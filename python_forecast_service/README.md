# Python Forecast Service

FastAPI 기반의 별도 Forecast 배치 서비스입니다. Next.js 계산 로직과 분리되어 있으며, Supabase 서버 키는 이 서비스의 환경변수에만 둡니다.

## 실행

```powershell
cd python_forecast_service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SUPABASE_URL="https://...supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="서버 전용 키"
uvicorn app.main:app --reload --port 8000
```

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저나 Next.js public 환경변수에 넣지 않습니다.
