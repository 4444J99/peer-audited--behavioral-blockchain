#!/usr/bin/env python3
import json
import subprocess
import time

REPO_OWNER = "organvm"
REPO_NAME = "peer-audited--behavioral-blockchain"
ROOT_DIR = "/Users/4jp/Workspace/peer-audited--behavioral-blockchain"

def run_cmd(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=ROOT_DIR)
    return res.stdout.strip()

def resolve_pr_threads(pr_num):
    query = f'''
    query {{
      repository(owner: "{REPO_OWNER}", name: "{REPO_NAME}") {{
        pullRequest(number: {pr_num}) {{
          reviewThreads(first: 50) {{
            nodes {{
              id
              isResolved
            }}
          }}
        }}
      }}
    }}
    '''
    out = run_cmd(f"gh api graphql -f query='{query}'")
    if not out:
        return
    try:
        data = json.loads(out)
        threads = data.get("data", {}).get("repository", {}).get("pullRequest", {}).get("reviewThreads", {}).get("nodes", [])
        for t in threads:
            if not t.get("isResolved"):
                thread_id = t["id"]
                mutation = f'''
                mutation {{
                  resolveReviewThread(input: {{threadId: "{thread_id}"}}) {{
                    thread {{
                      id
                      isResolved
                    }}
                  }}
                }}
                '''
                run_cmd(f"gh api graphql -f query='{mutation}'")
                print(f"  [PR #{pr_num}] Resolved review thread {thread_id}")
    except Exception as e:
        print(f"  Error resolving threads on PR #{pr_num}: {e}")

def main():
    out = run_cmd(f"gh pr list --repo {REPO_OWNER}/{REPO_NAME} --state open --limit 100 --json number,title")
    if not out:
        return
    prs = json.loads(out)
    print(f"[{time.strftime('%H:%M:%S')}] Resolving review conversations on {len(prs)} open PRs...")
    for pr in prs:
        num = pr["number"]
        resolve_pr_threads(num)

if __name__ == "__main__":
    main()
