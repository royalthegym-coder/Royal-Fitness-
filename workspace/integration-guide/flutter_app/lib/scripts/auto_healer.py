import os
import sys
import json
import re
from groq import Groq

# ==============================================================================
# AUTONOMOUS AI DEVELOPER (Self-Healing Codebase)
# ==============================================================================
# This script runs automatically in the CI/CD pipeline. 
# If a build fails (e.g., Flutter compilation error or Python syntax error),
# GitHub Actions passes the error log to this script.
# This AI agent reads the error, finds the buggy file, rewrites the code to fix it,
# and commits the fix back to the repository WITHOUT HUMAN INTERVENTION.

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def read_error_log(log_path):
    with open(log_path, 'r') as f:
        return f.read()

def analyze_and_fix(error_log):
    print("🤖 AI Developer: Analyzing build failure...")
    
    prompt = f"""
    You are an expert Autonomous Software Engineer.
    The CI/CD build just failed with the following error log:
    
    <error_log>
    {error_log[-3000:]} # Send the last 3000 chars of the log
    </error_log>
    
    1. Identify the file causing the error.
    2. Identify the exact bug.
    3. Provide the FULL, FIXED code for that file.
    
    Output format MUST be strictly JSON:
    {{
        "file_path": "path/to/broken/file.ext",
        "fixed_code": "fully corrected source code here",
        "commit_message": "Fix: brief description of what was fixed"
    }}
    """
    
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-70b-8192",
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)

def apply_fix(fix_data):
    file_path = fix_data['file_path']
    fixed_code = fix_data['fixed_code']
    commit_msg = fix_data['commit_message']
    
    print(f"🤖 AI Developer: Fixing {file_path}...")
    
    # Write the fixed code to the file
    with open(file_path, 'w') as f:
        f.write(fixed_code)
        
    # Git operations to commit the fix
    os.system(f'git config --global user.name "AI-AutoHealer"')
    os.system(f'git config --global user.email "autohealer@fitnessgym.ai"')
    os.system(f'git add {file_path}')
    os.system(f'git commit -m "🤖 Auto-Heal: {commit_msg}"')
    os.system(f'git push origin HEAD')
    
    print("✅ AI Developer: Fix applied and pushed. Triggering rebuild...")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python auto_healer.py <path_to_error_log>")
        sys.exit(1)
        
    log_file = sys.argv[1]
    if os.path.exists(log_file):
        fix = analyze_and_fix(read_error_log(log_file))
        apply_fix(fix)
    else:
        print("No error log found. Build must have succeeded!")
