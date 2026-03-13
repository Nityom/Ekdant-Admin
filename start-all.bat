@echo off
echo ================================
echo Starting KS Dental Clinic
echo ================================
echo.
echo Starting PHP Backend on port 8000...
start "PHP Backend" cmd /k "cd php-backend && php -S localhost:8000 -t ."

timeout /t 3 /nobreak >nul

echo Starting Next.js Frontend on port 3000...
start "Next.js Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo.
echo Press any key to stop all servers...
pause >nul

echo Stopping servers...
taskkill /FI "WindowTitle eq PHP Backend*" /T /F >nul 2>nul
taskkill /FI "WindowTitle eq Next.js Frontend*" /T /F >nul 2>nul

echo Servers stopped.
