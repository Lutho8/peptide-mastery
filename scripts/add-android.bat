@echo off
REM ============================================================
REM  Peptide South Africa - One-click Android bootstrap
REM  Run AFTER you have done: git pull
REM  Requires: Node 18+, JDK 17, Android Studio with SDK installed
REM ============================================================
setlocal

echo.
echo [1/5] Installing npm dependencies...
call npm install
if errorlevel 1 goto :fail

echo.
echo [2/5] Building web bundle (dist/)...
call npm run build
if errorlevel 1 goto :fail

if exist android (
  echo.
  echo [3/5] android/ folder already exists - skipping 'cap add android'.
) else (
  echo.
  echo [3/5] Creating native Android project (android/)...
  call npx cap add android
  if errorlevel 1 goto :fail
)

echo.
echo [4/5] Syncing web assets into android/...
call npx cap sync android
if errorlevel 1 goto :fail

echo.
echo [5/5] Opening project in Android Studio...
call npx cap open android

echo.
echo ============================================================
echo  DONE. In Android Studio: Build ^> Generate Signed Bundle/APK
echo ============================================================
exit /b 0

:fail
echo.
echo ############################################################
echo  STEP FAILED. Scroll up for the error.
echo  Most common causes:
echo    - Node not on PATH        (open a fresh Command Prompt)
echo    - JAVA_HOME not set       (install JDK 17, set JAVA_HOME)
echo    - ANDROID_HOME not set    (Android Studio ^> SDK Manager)
echo ############################################################
exit /b 1
