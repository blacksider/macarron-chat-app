@echo off
echo Starting dependencies...
echo Starting related databases...
start cmd /k "cd %~dp0Server && docker-compose up -d"
pause