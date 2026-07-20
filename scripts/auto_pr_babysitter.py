#!/usr/bin/env python3
import json
import subprocess
import time

REPO_OWNER = "organvm"
REPO_NAME = "peer-audited--behavioral-blockchain"
REPO = f"{REPO_OWNER}/{REPO_NAME}"
ROOT_DIR = "/Users/4jp/Workspace/peer-audited--behavioral-blockchain"

def run_cmd(cmd, cwd=ROOT_DIR):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
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

def babysit_prs():
    out = run_cmd(f"gh pr list --repo {REPO} --state open --limit 200 --json number,title,isDraft,autoMergeRequest,statusCheckRollup")
    if not out:
        return
    prs = json.loads(out)
    print(f"[{time.strftime('%H:%M:%S')}] Active PR Babysitter: Checking {len(prs)} open PRs...")
    
    for pr in prs:
        num = pr['number']
        is_draft = pr['isDraft']
        auto_merge = pr.get('autoMergeRequest')
        
        # 1. Resolve any bot/CodeRabbit review conversations
        resolve_pr_threads(num)
        
        # 2. Mark ready if draft
        if is_draft:
            print(f"  Marking PR #{num} ready for review...")
            run_cmd(f"gh pr ready {num} --repo {REPO}")
            
        # 3. Enable auto-merge if not enabled
        if not auto_merge:
            print(f"  Enabling auto-merge on PR #{num}...")
            run_cmd(f"gh pr merge {num} --squash --auto --repo {REPO}")
            
        # 4. Check for failed checks that can be re-run
        checks = pr.get('statusCheckRollup', []) or []
        for c in checks:
            name = c.get('name', '')
            conclusion = c.get('conclusion', '')
            details_url = c.get('detailsUrl', '')
            if conclusion == 'FAILURE' and ('update_release_draft' in name or 'CodeQL' in name or 'Analyze' in name):
                if '/actions/runs/' in details_url:
                    run_id = details_url.split('/actions/runs/')[1].split('/')[0]
                    print(f"  Re-running flaky job {name} (run {run_id}) on PR #{num}...")
                    run_cmd(f"gh run rerun {run_id} --failed --repo {REPO}")

if __name__ == "__main__":
    babysit_prs()
