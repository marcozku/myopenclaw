@echo off
REM Signal CLI REST API - Automated Setup Script for Windows
REM This script will install and configure signal-cli-rest-api for you

setlocal enabledelayedexpansion

echo ======================================
echo Signal CLI REST API - Auto Setup
echo ======================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed!
    echo.
    echo Please install Docker Desktop for Windows:
    echo https://docs.docker.com/desktop/install/windows-install/
    pause
    exit /b 1
)

echo ✅ Docker found
docker --version
echo.

REM Check if signal-cli is already running
docker ps | findstr "signal-rest-api" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  signal-cli container is already running!
    echo.
    set /p RECREATE="Do you want to stop and recreate it? (y/N): "
    if /i "!RECREATE!"=="y" (
        echo Stopping existing container...
        docker stop signal-rest-api >nul 2>&1
        docker rm signal-rest-api >nul 2>&1
    ) else (
        echo Exiting...
        pause
        exit /b 0
    )
)

REM Create data directory
echo 📁 Creating data directory...
if not exist "%USERPROFILE%\signal-data" mkdir "%USERPROFILE%\signal-data"

REM Pull latest image
echo 📦 Pulling signal-cli-rest-api image...
docker pull bbernhard/signal-cli-rest-api:latest

REM Run container
echo 🚀 Starting signal-cli-rest-api...
docker run -d ^
    --name signal-rest-api ^
    -p 8080:8080 ^
    -v "%USERPROFILE%\signal-data:/home/.local/share/signal-cli" ^
    --restart unless-stopped ^
    bbernhard/signal-cli-rest-api:latest

REM Wait for container to be ready
echo ⏳ Waiting for service to start...
timeout /t 5 /nobreak >nul

REM Check if container is running
docker ps | findstr "signal-rest-api" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ Failed to start container. Check logs:
    echo    docker logs signal-rest-api
    pause
    exit /b 1
)

echo.
echo ✅ signal-cli-rest-api is running!
echo.
echo 📍 API URL: http://localhost:8080
echo.

REM Show menu for linking
echo ======================================
echo Link Your Signal Number
echo ======================================
echo.
echo Choose a linking method:
echo   1) QR Code (Recommended) - Link from your phone
echo   2) SMS Verification - Register with phone number
echo.
set /p CHOICE="Enter choice (1 or 2): "

if "%CHOICE%"=="1" (
    echo.
    echo 📱 Generating QR Code...
    echo.
    echo Follow these steps:
    echo   1. Open Signal on your phone
    echo   2. Go to: Settings ^> Linked Devices ^> Link New Device
    echo   3. Scan the QR code below
    echo.

    docker exec -it signal-rest-api signal-cli link -n "OpenClaw"

    echo.
    echo ✅ If QR code scan was successful, your Signal is now linked!
) else if "%CHOICE%"=="2" (
    echo.
    set /p PHONE="Enter your phone number (with + and country code, e.g., +1234567890): "

    echo.
    echo 📲 Requesting SMS verification for %PHONE%
    docker exec signal-rest-api signal-cli -a "%PHONE%" register

    echo.
    echo 🔑 Check your phone for the SMS verification code.
    set /p CODE="Enter the verification code: "

    echo.
    echo 🔄 Verifying...
    docker exec signal-rest-api signal-cli -a "%PHONE%" verify "%CODE%"

    echo.
    echo ✅ Your Signal number %PHONE% is now registered!
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo 📍 API URL: http://localhost:8080
echo.
echo Test the API:
echo   curl http://localhost:8080/v1/about
echo.
echo View logs:
echo   docker logs -f signal-rest-api
echo.
echo Stop service:
echo   docker stop signal-rest-api
echo.
echo Restart service:
echo   docker start signal-rest-api
echo.
pause
