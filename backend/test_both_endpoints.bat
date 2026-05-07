@echo off
echo Testing both available slots endpoints...

echo.
echo 1. Testing OLD endpoint (schedules/available-slots)...
curl -X GET "http://localhost:8080/api/schedules/available-slots?doctorId=bac-si-id&date=2026-05-10" ^
  -H "Content-Type: application/json"

echo.
echo.
echo 2. Testing NEW endpoint (doctors/id/available-slots)...
curl -X GET "http://localhost:8080/api/doctors/bac-si-id/available-slots?date=2026-05-10" ^
  -H "Content-Type: application/json"

echo.
echo.
echo 3. Running cleanup to remove invalid shifts...
curl -X POST "http://localhost:8080/api/schedules/cleanup-invalid-shifts" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.dummy" ^
  -H "Content-Type: application/json"

echo.
echo.
echo 4. Testing OLD endpoint again after cleanup...
curl -X GET "http://localhost:8080/api/schedules/available-slots?doctorId=bac-si-id&date=2026-05-10" ^
  -H "Content-Type: application/json"

echo.
echo.
echo Done!
pause