@echo off
cd /d "%~dp0\.."
set ASTRO_TELEMETRY_DISABLED=1
set HOST=127.0.0.1
set PORT=4325
"C:\Program Files\nodejs\node.exe" scripts\serve-static.mjs >> server-4325.out.log 2>> server-4325.err.log
