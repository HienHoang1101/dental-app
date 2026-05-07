@echo off
echo ================================================================================
echo Phase 1 Migration Runner
echo ================================================================================
echo.
echo This will run the Phase 1 migration using Gradle.
echo.
echo Press Ctrl+C to cancel, or
pause

cd /d "%~dp0"
call gradlew.bat run --args="migrate"

echo.
echo ================================================================================
echo Migration completed!
echo ================================================================================
pause
