@echo off
echo Starting backend with logging...
echo Log will be saved to backend_log.txt
echo.

gradlew.bat run > backend_log.txt 2>&1

echo.
echo Backend stopped. Check backend_log.txt for logs.
pause
