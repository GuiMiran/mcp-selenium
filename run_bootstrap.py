#!/usr/bin/env python3
"""
Wrapper script to run the Node.js bootstrap script using subprocess
"""
import subprocess
import sys
import os

# Change to the repo directory
os.chdir(r'C:\reposClaude\mcp-selenium')

try:
    # Try to run the Node.js script
    result = subprocess.run(
        [sys.executable, '-c', """
import subprocess
import sys
result = subprocess.run(['node', 'guido-engine-bootstrap.js'], 
                       capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print('STDERR:', result.stderr, file=sys.stderr)
sys.exit(result.returncode)
"""],
        capture_output=False,
        text=True
    )
    sys.exit(result.returncode)
except Exception as e:
    print(f"Error running bootstrap: {e}", file=sys.stderr)
    sys.exit(1)
