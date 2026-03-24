import subprocess
import os

# Change to the repo directory
os.chdir('C:\\reposClaude\\mcp-selenium')

# Run the bootstrap script
print("=" * 50)
print("Running guido-engine-bootstrap.js")
print("=" * 50)
try:
    result = subprocess.run(['node', 'guido-engine-bootstrap.js'], 
                          capture_output=True, 
                          text=True, 
                          timeout=120)
    print(result.stdout)
    if result.stderr:
        print("STDERR:")
        print(result.stderr)
    print("Return code:", result.returncode)
except Exception as e:
    print(f"Error: {e}")

# List files in the created directory
print("\n" + "=" * 50)
print("Listing files in src\\GUIDO.Mcp.Engine\\")
print("=" * 50)
try:
    result = subprocess.run(['powershell', '-NoProfile', '-Command', 
                           "Get-ChildItem -Recurse 'C:\\reposClaude\\mcp-selenium\\src\\GUIDO.Mcp.Engine\\'"],
                          capture_output=True,
                          text=True,
                          timeout=30)
    print(result.stdout)
    if result.stderr:
        print("STDERR:")
        print(result.stderr)
except Exception as e:
    print(f"Error listing files: {e}")
    # Fallback to dir command
    print("\nFalling back to dir command:")
    try:
        result = subprocess.run(['cmd', '/c', 'dir /s "C:\\reposClaude\\mcp-selenium\\src\\GUIDO.Mcp.Engine\\"'],
                              capture_output=True,
                              text=True,
                              timeout=30)
        print(result.stdout)
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
    except Exception as e2:
        print(f"Dir also failed: {e2}")
