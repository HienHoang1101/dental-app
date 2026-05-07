@echo off
echo FORCE CLEANUP - Removing invalid working hours...
echo.

echo Starting server in background...
start /B .\gradlew run --no-daemon

echo Waiting for server to start...
timeout /t 10 /nobreak > nul

echo.
echo 1. Checking current shifts...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts" ^
  -H "Authorization: Bearer admin-token" ^
  -H "Content-Type: application/json"

echo.
echo.
echo 2. Running cleanup...
curl -X POST "http://localhost:8080/api/schedules/cleanup-invalid-shifts" ^
  -H "Authorization: Bearer admin-token" ^
  -H "Content-Type: application/json"

echo.
echo.
echo 3. Checking shifts after cleanup...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts" ^
  -H "Authorization: Bearer admin-token" ^
  -H "Content-Type: application/json"

echo.
echo.
echo Cleanup completed! Please refresh your browser and test again.
pause