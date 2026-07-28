@echo off
setlocal enabledelayedexpansion
title Peptide South Africa - Android Setup

echo.
echo ============================================================
echo   Peptide South Africa - One-Click Android Setup
echo ============================================================
echo.

REM ---- Move to project root (parent of /scripts) ----
cd /d "%~dp0.."
echo Project folder: %CD%
echo.

REM ---- Check Node.js ----
echo [1/6] Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo   X Node.js is NOT installed or NOT on your PATH.
    echo.
    echo   FIX:
    echo     1. Download Node.js LTS: https://nodejs.org
    echo     2. Run the installer. IMPORTANT: leave "Add to PATH" CHECKED.
    echo     3. CLOSE this window, then double-click setup-android.bat again.
    echo.
    echo   If Node IS installed but still not found, see scripts\fix-node-path.md
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODEVER=%%v
echo   OK Node.js !NODEVER!
echo.

REM ---- Check Java ----
echo [2/6] Checking Java JDK...
where java >nul 2>nul
if errorlevel 1 (
    echo.
    echo   X Java JDK is NOT installed or NOT on your PATH.
    echo.
    echo   FIX:
    echo     Android Studio bundles a JDK, but the keystore tool needs it on PATH.
    echo     Easiest: install Android Studio (https://developer.android.com/studio),
    echo     then in Android Studio: File ^> Settings ^> Build Tools ^> Gradle ^>
    echo     Gradle JDK, copy that path and add its \bin folder to System PATH.
    echo.
    echo     OR install standalone JDK 17: https://adoptium.net
    echo.
    echo   You can SKIP this for now - Android Studio can build without java on PATH.
    echo   You only need it later for the keystore step.
    echo.
    set /p CONTINUE="Continue without Java on PATH? (Y/N): "
    if /i not "!CONTINUE!"=="Y" exit /b 1
) else (
    for /f "tokens=*" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do set JAVAVER=%%v
    echo   OK !JAVAVER!
)
echo.

REM ---- npm install ----
echo [3/6] Installing dependencies (this can take 2-5 minutes)...
call npm install
if errorlevel 1 (
    echo   X npm install failed. Read the error above.
    pause
    exit /b 1
)
echo   OK Dependencies installed.
echo.

REM ---- npm run build ----
echo [4/6] Building web bundle...
call npm run build
if errorlevel 1 (
    echo   X Build failed. Read the error above.
    pause
    exit /b 1
)
echo   OK Web bundle built.
echo.

REM ---- cap add android (only if missing) ----
echo [5/6] Adding Android native project...
if exist "android" (
    echo   OK android\ folder already exists - skipping cap add.
) else (
    call npx cap add android
    if errorlevel 1 (
        echo   X cap add android failed. Read the error above.
        pause
        exit /b 1
    )
    echo   OK android\ folder created.
)
echo.

REM ---- cap sync ----
echo [6/6] Syncing web bundle into Android project...
call npx cap sync android
if errorlevel 1 (
    echo   X cap sync failed. Read the error above.
    pause
    exit /b 1
)
echo   OK Sync complete.
echo.

echo ============================================================
echo   DONE! Android project is ready.
echo ============================================================
echo.
echo   Next steps:
echo     1. Open Android Studio.
echo     2. File ^> Open ^> select the "android" folder inside this project.
echo     3. Wait for Gradle sync to finish (bottom status bar).
echo     4. Follow SETUP_CHECKLIST.md (in this project) for the
echo        keystore + signed AAB steps.
echo.
pause
