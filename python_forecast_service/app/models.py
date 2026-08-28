from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
import math
import numpy as np
import pandas as pd


@dataclass
class ForecastOutput:
    item_id: str
    period: str
    predicted_qty: float | None
    p50: float | None
    p80: float | None
    p90: float | None
    reason_code: str | None = None


class ForecastModel(ABC):
    model_id: str
    model_version: str = "1.0.0"
    applicable_demand_types: tuple[str, ...] = ("SMOOTH", "ERRATIC", "INTERMITTENT", "LUMPY")

    @abstractmethod
    def forecast(self, train_df: pd.DataFrame, horizon: int, params: dict) -> pd.DataFrame:
        """train_df에는 학습기간 자료만 전달하고 period/predicted_qty를 반환합니다."""


def _future_periods(train_df: pd.DataFrame, horizon: int) -> pd.DatetimeIndex:
    last = pd.to_datetime(train_df["period"]).max()
    return pd.date_range(last + pd.offsets.MonthBegin(1), periods=horizon, freq="MS")


class MovingAverage(ForecastModel):
    model_id = "PY_MA_3M"

    def forecast(self, train_df, horizon, params):
        window = int(params.get("window", 3))
        values = pd.to_numeric(train_df["quantity"], errors="coerce").dropna().tail(window)
        prediction = float(values.mean()) if len(values) == window else None
        return pd.DataFrame({"period": _future_periods(train_df, horizon), "predicted_qty": prediction})


class ExponentialSmoothingModel(ForecastModel):
    model_id = "PY_EXPSMOOTH"

    def forecast(self, train_df, horizon, params):
        values = pd.to_numeric(train_df["quantity"], errors="coerce").dropna()
        if len(values) < 2:
            prediction = None
        else:
            try:
                from statsmodels.tsa.holtwinters import SimpleExpSmoothing
                fitted = SimpleExpSmoothing(values.to_numpy()).fit(optimized=True)
                prediction = fitted.forecast(horizon)
                return pd.DataFrame({"period": _future_periods(train_df, horizon), "predicted_qty": prediction})
            except Exception:
                prediction = None
        return pd.DataFrame({"period": _future_periods(train_df, horizon), "predicted_qty": prediction})


class HoltWintersModel(ForecastModel):
    model_id = "PY_HOLT_WINTERS"

    def forecast(self, train_df, horizon, params):
        values = pd.to_numeric(train_df["quantity"], errors="coerce").dropna()
        season = int(params.get("seasonal_periods", 12))
        if len(values) < season * 2:
            result = [None] * horizon
        else:
            try:
                from statsmodels.tsa.holtwinters import ExponentialSmoothing
                fitted = ExponentialSmoothing(values.to_numpy(), trend="add", seasonal="add", seasonal_periods=season).fit()
                result = fitted.forecast(horizon)
            except Exception:
                result = [None] * horizon
        return pd.DataFrame({"period": _future_periods(train_df, horizon), "predicted_qty": result})


class SeasonalNaive(ForecastModel):
    model_id = "PY_SEASONAL_NAIVE"

    def forecast(self, train_df, horizon, params):
        season = int(params.get("season_months", 12))
        values = pd.to_numeric(train_df["quantity"], errors="coerce").dropna().to_numpy()
        result = [float(values[-season + i]) if len(values) >= season else None for i in range(horizon)]
        return pd.DataFrame({"period": _future_periods(train_df, horizon), "predicted_qty": result})


class CrostonModel(ForecastModel):
    model_id = "PY_CROSTON"
    applicable_demand_types = ("INTERMITTENT", "LUMPY")

    def forecast(self, train_df, horizon, params):
        values = pd.to_numeric(train_df["quantity"], errors="coerce").fillna(0).to_numpy(dtype=float)
        nonzero = values[values > 0]
        if len(nonzero) == 0:
            prediction = None
        else:
            intervals = np.diff(np.flatnonzero(values > 0), prepend=-1)
            prediction = float(nonzero.mean() / max(intervals[intervals > 0].mean(), 1))
        return pd.DataFrame({"period": _future_periods(train_df, horizon), "predicted_qty": prediction})


class SBAModel(CrostonModel):
    model_id = "PY_SBA"

    def forecast(self, train_df, horizon, params):
        output = super().forecast(train_df, horizon, params)
        output["predicted_qty"] = output["predicted_qty"].map(lambda value: None if pd.isna(value) else float(value) * (1 - float(params.get("alpha", 0.1)) / 2))
        return output


class TSBModel(CrostonModel):
    model_id = "PY_TSB"

    def forecast(self, train_df, horizon, params):
        values = pd.to_numeric(train_df["quantity"], errors="coerce").fillna(0).to_numpy(dtype=float)
        if not len(values) or not np.any(values > 0):
            prediction = None
        else:
            demand_prob = float(np.count_nonzero(values) / len(values))
            prediction = float(values[values > 0].mean() * demand_prob)
        return pd.DataFrame({"period": _future_periods(train_df, horizon), "predicted_qty": prediction})


class OptionalModel(ForecastModel):
    def forecast(self, train_df, horizon, params):
        raise RuntimeError(f"OPTIONAL_DEPENDENCY_REQUIRED:{self.model_id}")


class SARIMAModel(OptionalModel):
    model_id = "PY_SARIMA"


class ProphetModel(OptionalModel):
    model_id = "PY_PROPHET"


class XGBoostModel(OptionalModel):
    model_id = "PY_XGBOOST"


MODEL_REGISTRY: dict[str, type[ForecastModel]] = {model.model_id: model for model in [MovingAverage, ExponentialSmoothingModel, HoltWintersModel, SeasonalNaive, CrostonModel, SBAModel, TSBModel, SARIMAModel, ProphetModel, XGBoostModel]}


def available_models() -> list[dict]:
    return [{"model_id": key, "version": cls.model_version, "applicable_demand_type": list(cls.applicable_demand_types)} for key, cls in MODEL_REGISTRY.items()]
