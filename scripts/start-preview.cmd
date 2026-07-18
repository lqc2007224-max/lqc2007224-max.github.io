@echo off
cd /d "%~dp0\.."
set ASTRO_TELEMETRY_DISABLED=1
set PORT=4321
"C:\Program Files\nodejs\node.exe" scripts\serve-static.mjs >> server-4321.out.log 2>> server-4321.err.log
