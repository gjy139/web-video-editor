@echo off
title OpenCut - 무료 웹 동영상 편집기 실행기
chcp 65001 > nul
echo ========================================================
echo   OpenCut - 100%% 무료 웹 동영상 편집기 (Free Web Video Editor)
echo ========================================================
echo.
echo [1/2] 개발 서버를 시작하는 중입니다...
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%

start "" "http://localhost:5173"
call npm.cmd run dev -- --host
pause
