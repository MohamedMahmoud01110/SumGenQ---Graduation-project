@echo off
echo Starting Mock FastAPI Server...
echo.
echo This is a mock server for frontend testing only!
echo It will run on http://127.0.0.1:8002
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend
python mock_server.py

pause
