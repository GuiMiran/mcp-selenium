#!/usr/bin/env node

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("=".repeat(60));
console.log("Running guido-engine-bootstrap.js");
console.log("=".repeat(60));

try {
  const result = spawnSync('node', ['guido-engine-bootstrap.js'], {
    cwd: 'C:\\reposClaude\\mcp-selenium',
    stdio: 'inherit',
    shell: true
  });
  
  console.log("\nBootstrap script exit code:", result.status);
} catch (error) {
  console.error("Error running bootstrap:", error.message);
}

console.log("\n" + "=".repeat(60));
console.log("Listing files in src\\GUIDO.Mcp.Engine\\");
console.log("=".repeat(60));

const engineDir = 'C:\\reposClaude\\mcp-selenium\\src\\GUIDO.Mcp.Engine';

function listFilesRecursive(dir, indent = '') {
  try {
    if (!fs.existsSync(dir)) {
      console.log(`Directory does not exist: ${dir}`);
      return;
    }
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        console.log(`${indent}[DIR]  ${item.name}`);
        listFilesRecursive(fullPath, indent + '  ');
      } else {
        const stats = fs.statSync(fullPath);
        console.log(`${indent}[FILE] ${item.name} (${stats.size} bytes)`);
      }
    });
  } catch (error) {
    console.error(`Error listing directory: ${error.message}`);
  }
}

listFilesRecursive(engineDir);
