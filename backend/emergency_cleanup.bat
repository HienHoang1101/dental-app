@echo off
echo EMERGENCY CLEANUP - No Auth Required
echo.

echo 1. Checking current shifts...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts"

echo.
echo.
echo 2. Running emergency cleanup...
curl -X POST "http://localhost:8080/api/schedules/emergency-cleanup"

echo.
echo.
echo 3. Checking shifts after cleanup...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts"

echo.
echo.
echo Cleanup completed! Please refresh your browser.
pause