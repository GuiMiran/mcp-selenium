@echo off
setlocal enabledelayexpand

echo GUIDO MCP Engine Bootstrap - Full Execution
echo ============================================
echo.

REM First, create the directory structure
echo [1/3] Creating directory structure...
cd /d C:\reposClaude\mcp-selenium\src

if not exist "GUIDO.Mcp.Engine" mkdir GUIDO.Mcp.Engine
if not exist "GUIDO.Mcp.Engine\Commands" mkdir GUIDO.Mcp.Engine\Commands
if not exist "GUIDO.Mcp.Engine\Domain" mkdir GUIDO.Mcp.Engine\Domain
if not exist "GUIDO.Mcp.Engine\Infrastructure" mkdir GUIDO.Mcp.Engine\Infrastructure
if not exist "GUIDO.Mcp.Engine\Services" mkdir GUIDO.Mcp.Engine\Services
if not exist "GUIDO.Mcp.Engine\Tracing" mkdir GUIDO.Mcp.Engine\Tracing

echo ✓ Directory structure created
echo.

echo [2/3] Listing created directories...
dir C:\reposClaude\mcp-selenium\src\GUIDO.Mcp.Engine /B /AD
echo.

echo [3/3] Running Node.js bootstrap script...
cd /d C:\reposClaude\mcp-selenium
node guido-engine-bootstrap.js

echo.
echo Bootstrap execution completed!
pause
