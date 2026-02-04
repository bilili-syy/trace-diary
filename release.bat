@echo off
setlocal enabledelayedexpansion

set VERSION=%1
set MESSAGE=%~2

echo ========================================
echo   Trace Release Tool
echo ========================================
echo.

if "%VERSION%"=="" (
    echo [ERROR] Missing version parameter
    echo.
    echo Usage: release.bat ^<version^> [message]
    echo Example: release.bat v1.0.0 "First release"
    echo.
    exit /b 1
)

if "%MESSAGE%"=="" set MESSAGE=Release %VERSION%

:: Ensure tag uses v* so GitHub Actions trigger on tag push
echo %VERSION% | findstr /b /i "v" >nul
if errorlevel 1 (
    set VERSION=v%VERSION%
    echo [INFO] Version adjusted to %VERSION% to match tag trigger (v*)
)

:: Normalize version for app.json (strip leading v if any)
set VERSION_CLEAN=%VERSION%
echo %VERSION_CLEAN% | findstr /b /i "v" >nul
if errorlevel 1 (
    rem keep as is
) else (
    set VERSION_CLEAN=%VERSION_CLEAN:~1%
)

for /f "tokens=1-3 delims=." %%a in ("%VERSION_CLEAN%") do (
    set MAJOR=%%a
    set MINOR=%%b
    set PATCH=%%c
)

if "%PATCH%"=="" set PATCH=0

for /f "delims=0123456789" %%i in ("%MAJOR%%MINOR%%PATCH%") do (
    echo [ERROR] Invalid version format: %VERSION_CLEAN%
    exit /b 1
)

set /a VERSION_CODE=%MAJOR%*10000 + %MINOR%*100 + %PATCH%

echo [INFO] Syncing app version: %VERSION_CLEAN% (code %VERSION_CODE%)
powershell -NoProfile -Command "$path='app.json'; $json=Get-Content $path -Raw | ConvertFrom-Json; $json.expo.version='%VERSION_CLEAN%'; if (-not $json.expo.android) { $json.expo | Add-Member -NotePropertyName android -NotePropertyValue (@{}) -Force }; $json.expo.android.versionCode=%VERSION_CODE%; if (-not $json.expo.ios) { $json.expo | Add-Member -NotePropertyName ios -NotePropertyValue (@{}) -Force }; $json.expo.ios.buildNumber='%VERSION_CODE%'; $json | ConvertTo-Json -Depth 20 | Set-Content $path"
if errorlevel 1 (
    echo [ERROR] Failed to update app.json
    exit /b 1
)

echo [INFO] Preparing release: %VERSION%
echo [INFO] Commit message: %MESSAGE%
echo.

:: Check for uncommitted changes
echo [CHECK] Checking working directory...
git status --porcelain > temp_status.txt
set HAS_CHANGES=0
for %%A in (temp_status.txt) do if %%~zA gtr 0 set HAS_CHANGES=1
del temp_status.txt 2>nul

if !HAS_CHANGES!==1 (
    echo [FOUND] Uncommitted changes detected
    echo.
    git status --short
    echo.
    set /p COMMIT_CHOICE="Commit these changes? (Y/n): "
    if /i "!COMMIT_CHOICE!"=="n" (
        echo [CANCEL] Release cancelled
        exit /b 1
    )
    echo [RUN] Committing changes...
    git add .
    git commit -m "%MESSAGE%"
    if errorlevel 1 (
        echo [ERROR] Commit failed
        exit /b 1
    )
    echo [DONE] Changes committed
) else (
    echo [PASS] Working directory clean
)
echo.

:: Push code
echo [RUN] Pushing code to remote...
for /f %%B in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%B
if "%CURRENT_BRANCH%"=="HEAD" (
    echo [ERROR] Detached HEAD. Please checkout a branch before release.
    exit /b 1
)
git push -u origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo [ERROR] Push failed
    exit /b 1
)
echo [DONE] Code pushed
echo.

:: Check if tag exists
echo [CHECK] Checking if tag exists...
git rev-parse %VERSION% >nul 2>&1
if !errorlevel!==0 (
    echo [WARN] Tag %VERSION% already exists!
    echo.
    echo Choose action:
    echo   1. Delete old tag and create new one
    echo   2. Keep old tag and cancel release
    echo   3. Enter new version number
    echo.
    set /p TAG_CHOICE="Enter option (1/2/3): "
    
    if "!TAG_CHOICE!"=="1" (
        echo [RUN] Deleting old tag...
        git tag -d %VERSION%
        git push origin --delete %VERSION% 2>nul
        if errorlevel 1 (
            echo [WARN] Remote tag may not exist, continuing...
        )
        echo [DONE] Old tag deleted
    ) else if "!TAG_CHOICE!"=="3" (
        echo.
        set /p NEW_VERSION="Enter new version: "
        if "!NEW_VERSION!"=="" (
            echo [ERROR] Version cannot be empty
            exit /b 1
        )
        set VERSION=!NEW_VERSION!
        echo !VERSION! | findstr /b /i "v" >nul
        if errorlevel 1 (
            set VERSION=v!VERSION!
            echo [INFO] Version adjusted to !VERSION! to match tag trigger (v*)
        )
        echo [INFO] Using new version: !VERSION!
    ) else (
        echo [CANCEL] Keeping old tag, release cancelled
        exit /b 0
    )
    echo.
)

:: Create new tag
echo [RUN] Creating tag %VERSION%...
git tag -a %VERSION% -m "%MESSAGE%"
if errorlevel 1 (
    echo [ERROR] Tag creation failed
    exit /b 1
)
echo [DONE] Tag created

echo [RUN] Pushing tag to remote...
git push origin %VERSION%
if errorlevel 1 (
    echo [ERROR] Tag push failed
    exit /b 1
)
echo [DONE] Tag pushed
echo.

echo ========================================
echo   Release Success!
echo   Version: %VERSION%
echo   Message: %MESSAGE%
echo ========================================
echo.
echo Next steps:
echo   - Check GitHub repository for the new tag
echo   - If Actions workflow exists, check build status
echo   - Edit release notes on GitHub Releases page
echo.
