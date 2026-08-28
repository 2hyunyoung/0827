from __future__ import annotations

import os
from datetime import datetime, timezone
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
import pandas as pd
from .models import MODEL_REGISTRY, available_models
from .repository import Repository

app = FastAPI(title="SCM Python Forecast Service", version="1.0.0")


class RunRequest(BaseModel):
    model_ids: list[str] = Field(default_factory=lambda: ["PY_MA_3M"])
    horizon: int | None = Field(default=None, ge=1, le=36)
    note: str | None = None


class BacktestRequest(BaseModel):
    forecast_run_id: str


def authorize(token: str | None):
    expected = os.environ.get("FORECAST_SERVICE_TOKEN")
    if expected and token != f"Bearer {expected}":
        raise HTTPException(status_code=401, detail="INVALID_SERVICE_TOKEN")


@app.get("/health")
def health():
    return {"status": "ok", "service": "python-forecast", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/models")
def models():
    return {"models": available_models()}


@app.post("/forecast/run")
def forecast_run(request: RunRequest, authorization: str | None = Header(default=None)):
    authorize(authorization)
    repo = Repository()
    setting = repo.setting()
    horizon = request.horizon or int(setting.get("forecast_horizon") or 3)
    train = repo.train()
    run_id = repo.create_run({"status": "RUNNING", "granularity": setting["granularity"], "train_start": setting["train_start"], "train_end": setting["train_end"], "horizon": horizon, "data_snapshot_at": datetime.now(timezone.utc).isoformat(), "triggered_email": "python-service", "note": request.note})
    saved: list[dict] = []
    try:
        for model_id in request.model_ids:
            model_cls = MODEL_REGISTRY.get(model_id)
            if not model_cls:
                raise ValueError(f"UNKNOWN_MODEL:{model_id}")
            model = model_cls()
            repo.save_model_version(run_id, model_id, model.model_version, {})
            for item_id, item_train in train.groupby("item_id"):
                output = model.forecast(item_train.sort_values("period"), horizon, {})
                for row in output.itertuples(index=False):
                    point = None if pd.isna(row.predicted_qty) else float(row.predicted_qty)
                    saved.append({"run_id": run_id, "model_id": model_id, "item_id": item_id, "period": pd.Timestamp(row.period).date().isoformat(), "model_version": model.model_version, "predicted_qty": point, "p50": point, "p80": point, "p90": point, "basis": "PYTHON_SERVICE · train only", "calculation_status": "SUCCESS" if point is not None else "CALCULATION_UNAVAILABLE", "reason_code": None if point is not None else "INSUFFICIENT_HISTORY"})
        repo.save_results(saved)
        repo.finish_run(run_id, "SUCCESS", "PYTHON_FORECAST_SUCCESS", len(saved))
        return {"run_id": run_id, "status": "SUCCESS", "rows": len(saved)}
    except Exception as error:
        repo.finish_run(run_id, "FAILED", str(error), len(saved))
        raise HTTPException(status_code=500, detail={"run_id": run_id, "error": str(error)})


@app.post("/backtest/run")
def backtest_run(request: BacktestRequest, authorization: str | None = Header(default=None)):
    authorize(authorization)
    repo = Repository()
    result = repo.client.schema("core").rpc("run_backtest", {"p_forecast_run_id": request.forecast_run_id}).execute()
    return {"backtest_run_id": result.data, "status": "SUCCESS"}
