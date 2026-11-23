@echo off
title مختبر نسمات لصياغة وتركيب العطور - Nasamat Perfume Lab
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================================
echo             مختبر نسمات لصياغة وتركيب العطور
echo                  Nasamat Perfume Lab
echo ========================================================
echo.
echo جاري تشغيل خادم تطبيق نسمات المحلي...
start "" "http://127.0.0.1:5173"
call npm.cmd run dev -- --host 127.0.0.1 --port 5173
pause
