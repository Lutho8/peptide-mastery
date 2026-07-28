@echo off
setlocal
title Peptide South Africa - Build Release AAB

echo.
echo ============================================================
echo   Peptide South Africa - Rebuild for Release
echo ============================================================
echo.

cd /d "%~dp0.."
echo Project folder: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo X Node.js not found on PATH. See scripts\fix-node-path.md
    pause
    exit /b 1
)

if not exist "android" (
    echo X android\ folder is missing. Run setup-android.bat first.
    pause
    exit /b 1
)

echo [1/2] Building web bundle...
call npm run build
if errorlevel 1 ( pause & exit /b 1 )
echo   OK
echo.

echo [2/2] Syncing into Android project...
call npx cap sync android
if errorlevel 1 ( pause & exit /b 1 )
echo   OK
echo.

echo ============================================================
echo   READY for signed build.
echo ============================================================
echo.
echo   In Android Studio:
echo     Build  ^>  Generate Signed Bundle / APK
echo     -^> Android App Bundle
echo     -^> Select your peptidesa-release.keystore
echo     -^> Build variant: release
echo     -^> Finish
echo.
echo   Output AAB will appear at:
echo     android\app\release\app-release.aab
echo.
echo   Upload that .aab file to Google Play Console.
echo.
pause
