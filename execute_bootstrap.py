#!/usr/bin/env python3
"""
Python implementation of the Node.js bootstrap script
Reads guido-engine-bootstrap.js and executes its file creation logic
"""

import os
import sys
import json
import re

# Change to the repo directory
os.chdir(r'C:\reposClaude\mcp-selenium')

# Read the Node.js script
with open('guido-engine-bootstrap.js', 'r', encoding='utf-8') as f:
    script_content = f.read()

# Extract the FILES object content using regex
files_match = re.search(r'const FILES = \{(.*?)\n\};', script_content, re.DOTALL)

if not files_match:
    print("ERROR: Could not find FILES object in bootstrap script")
    sys.exit(1)

# Create the base directory
BASE = os.path.join('src', 'GUIDO.Mcp.Engine')
os.makedirs(BASE, exist_ok=True)

# Parse the FILES content manually - this is a simplified approach
# Extract all file paths and their content
pattern = r"'([^']+)':\s*`([^`]*)`"
matches = re.findall(pattern, script_content, re.DOTALL)

created_count = 0
errors = []

for file_path, file_content in matches:
    full_path = os.path.join(BASE, file_path)
    dir_path = os.path.dirname(full_path)
    
    # Create directories if needed
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)
    
    try:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(file_content.strip())
        print(f"✓ Created: {file_path}")
        created_count += 1
    except Exception as e:
        error_msg = f"✗ Failed to create {file_path}: {e}"
        print(error_msg)
        errors.append(error_msg)

print(f"\n{created_count} files created successfully in {BASE}")

if errors:
    print(f"\n{len(errors)} errors encountered:")
    for error in errors:
        print(error)
    sys.exit(1)

# List created directory structure
print("\nCreated directory structure:")
for root, dirs, files in os.walk(BASE):
    level = root.replace(BASE, '').count(os.sep)
    indent = ' ' * 2 * level
    print(f'{indent}{os.path.basename(root)}/')
    sub_indent = ' ' * 2 * (level + 1)
    for file in sorted(files):
        print(f'{sub_indent}{file}')
