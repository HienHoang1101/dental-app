@echo off
echo Testing API endpoints to see which one returns invalid slots...
echo.

echo 1. Testing OLD endpoint (schedules/available-slots)...
echo URL: http://localhost:8080/api/schedules/available-slots?doctorId=test-doctor-id&date=2026-05-10
curl -X GET "http://localhost:8080/api/schedules/available-slots?doctorId=test-doctor-id&date=2026-05-10"

echo.
echo.
echo 2. Testing NEW endpoint (doctors/id/available-slots)...
echo URL: http://localhost:8080/api/doctors/test-doctor-id/available-slots?date=2026-05-10
curl -X GET "http://localhost:8080/api/doctors/test-doctor-id/available-slots?date=2026-05-10"

echo.
echo.
echo 3. Testing debug endpoint...
echo URL: http://localhost:8080/api/schedules/debug/shifts
curl -X GET "http://localhost:8080/api/schedules/debug/shifts"

echo.
echo.
echo 4. Testing all shifts...
echo URL: http://localhost:8080/api/schedules/shifts
curl -X GET "http://localhost:8080/api/schedules/shifts"

echo.
echo.
echo Done! Check which endpoint returns invalid time slots.
pause