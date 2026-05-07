@echo off
echo Testing shift cleanup...

echo.
echo 1. Checking current shifts...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.dummy" ^
  -H "Content-Type: application/json"

echo.
echo.
echo 2. Running cleanup...
curl -X POST "http://localhost:8080/api/schedules/cleanup-invalid-shifts" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.dummy" ^
  -H "Content-Type: application/json"

echo.
echo.
echo 3. Checking shifts after cleanup...
curl -X GET "http://localhost:8080/api/schedules/debug/shifts" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.dummy" ^
  -H "Content-Type: application/json"

echo.
echo.
echo Done!
pause