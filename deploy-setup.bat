@echo off
echo 🚀 DevDash Deployment Setup for Windows
echo =====================================

REM Check if .env.local exists
if not exist .env.local (
    echo ⚠️  .env.local not found! Copying from .env.example...
    copy .env.example .env.local
    echo 📝 Please edit .env.local with your actual values before deploying!
    echo.
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

REM Run build
echo 🔨 Building project...
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful! Your project is ready for deployment.
    echo.
    echo 📋 Pre-deployment checklist:
    echo 1. ✅ Dependencies installed
    echo 2. ✅ Build successful
    echo 3. ⚠️  Configure environment variables in your hosting platform
    echo 4. ⚠️  Update GitHub OAuth callback URL
    echo 5. ⚠️  Test Supabase connection
    echo.
    echo 🌐 Recommended platforms:
    echo   • Vercel (easiest): https://vercel.com
    echo   • Netlify: https://netlify.com  
    echo   • Railway: https://railway.app
    echo.
    echo 📚 See DEPLOYMENT.md for detailed instructions
) else (
    echo ❌ Build failed! Please fix the errors before deploying.
)

echo.
pause
