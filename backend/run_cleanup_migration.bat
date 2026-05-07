@echo off
echo Running cleanup migration to remove invalid working hours...
echo.

REM Get database connection info from .env file
for /f "tokens=2 delims==" %%a in ('findstr "DATABASE_URL" .env') do set DATABASE_URL=%%a

if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL not found in .env file
    echo Please make sure .env file exists and contains DATABASE_URL
    pause
    exit /b 1
)

echo Database URL: %DATABASE_URL%
echo.
echo WARNING: This will cleanup invalid shifts and cancel related appointments!
echo Press any key to continue or Ctrl+C to cancel...
pause

echo.
echo Running cleanup migration...
psql "%DATABASE_URL%" -f migrations/cleanup_invalid_working_hours.sql

echo.
echo Migration completed!
echo.
echo You should now restart the server and test the booking system.
echo Invalid time slots (evening/night) should no longer be available.
echo.
pause