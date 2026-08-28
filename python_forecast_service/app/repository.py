from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import uuid4
import pandas as pd
from supabase import create_client


class Repository:
    def __init__(self):
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("SUPABASE_SERVER_CONFIG_REQUIRED")
        self.client = create_client(url, key)

    def setting(self) -> dict:
        result = self.client.schema("core").table("forecast_setting").select("*").eq("setting_key", "default").single().execute()
        return result.data

    def train(self) -> pd.DataFrame:
        result = self.client.schema("core").from_("v_train_demand").select("item_id,use_date,qty").execute()
        return pd.DataFrame(result.data or []).rename(columns={"use_date": "period", "qty": "quantity"})

    def create_run(self, payload: dict) -> str:
        run_id = str(uuid4())
        row = {**payload, "run_id": run_id, "started_at": datetime.now(timezone.utc).isoformat()}
        self.client.schema("core").table("forecast_run").insert(row).execute()
        return run_id

    def save_results(self, rows: list[dict]):
        if rows:
            self.client.schema("core").table("forecast_result").insert(rows).execute()

    def save_model_version(self, run_id: str, model_id: str, version: str, params: dict):
        self.client.schema("core").table("model_version").insert({"run_id": run_id, "model_id": model_id, "version": version, "parameters": params, "definition": {"engine": "PYTHON_SERVICE"}}).execute()

    def finish_run(self, run_id: str, status: str, message: str, count: int = 0):
        self.client.schema("core").table("forecast_run").update({"status": status, "message": message, "n_rows": count, "finished_at": datetime.now(timezone.utc).isoformat()}).eq("run_id", run_id).execute()
