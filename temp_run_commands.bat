@echo off
chdir /d C:\reposClaude\mcp-selenium
echo === Running guido-engine-bootstrap.js ===
node guido-engine-bootstrap.js
echo.
echo === Listing files in src\GUIDO.Mcp.Engine\ ===
powershell -NoProfile -Command "Get-ChildItem -Recurse 'C:\reposClaude\mcp-selenium\src\GUIDO.Mcp.Engine\'"
