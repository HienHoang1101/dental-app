@echo off
echo COMPLETE TEST AND CLEANUP
echo.

echo 1. Checking current shifts...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts"

echo.
echo.
echo 2. Testing available slots BEFORE cleanup...
curl -X GET "http://localhost:8080/api/schedules/test-available-slots?doctorId=bac-si-id&date=2026-05-10"

echo.
echo.
echo 3. Running emergency cleanup...
curl -X POST "http://localhost:8080/api/schedules/emergency-cleanup"

echo.
echo.
echo 4. Testing available slots AFTER cleanup...
curl -X GET "http://localhost:8080/api/schedules/test-available-slots?doctorId=bac-si-id&date=2026-05-10"

echo.
echo.
echo 5. Final shift check...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts"

echo.
echo.
echo Test completed! 
echo - If you still see evening slots, the issue might be in frontend caching
echo - Try Ctrl+F5 to hard refresh the browser
echo - Or check which API endpoint the frontend is calling
pause