@echo off
title NAPAS Focus Agent
echo ========================================================
echo          NAPAS FOCUS AGENT (Desktop Companion)
echo ========================================================
echo.
cd /d "%~dp0"
if exist "..\backend\venv\Scripts\python.exe" (
    echo Menggunakan Python virtualenv dari backend...
    ..\backend\venv\Scripts\python.exe napas_agent.py
) else (
    echo Menjalankan dengan Python sistem...
    python napas_agent.py
)
pause
