@echo off
echo =========================================================
echo   Starting SpecsUp Full-Stack Optical Care Application
echo =========================================================
start "SpecsUp Backend (FastAPI)" cmd /k run_backend.bat
start "SpecsUp Frontend (React + Vite)" cmd /k run_frontend.bat
echo Both services launched in separate windows!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Web App: http://localhost:5173
pause
