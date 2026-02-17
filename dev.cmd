@echo off
REM ── Add portable node to PATH for this session ──
set "PATH=%~dp0node_bin;%PATH%"

REM ── Run the requested npm script (default: dev) ──
if "%~1"=="" (
    npm run dev
) else (
    npm run %*
)
