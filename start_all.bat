@echo off
echo ========================================================
echo Launching Full CartGuard ML System (Backend + Frontend)
echo ========================================================
start "CartGuard Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 3 /nobreak >nul
start "CartGuard Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both services launched!
echo Frontend will be accessible at: http://localhost:5173
echo Backend API Docs at:            http://127.0.0.1:8000/docs
