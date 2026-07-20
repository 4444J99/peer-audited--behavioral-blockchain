#!/usr/bin/env python3
import json
import subprocess

REPO = "organvm/peer-audited--behavioral-blockchain"
ROOT_DIR = "/Users/4jp/Workspace/peer-audited--behavioral-blockchain"

def run_cmd(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=ROOT_DIR)
    return res.stdout.strip()

def get_open_pr_branches():
    out = run_cmd(f"gh pr list --repo {REPO} --state open --limit 200 --json headRefName")
    if not out:
        return set()
    prs = json.loads(out)
    return {p["headRefName"] for p in prs}

def main():
    print("Fetching active open PR branches...")
    open_branches = get_open_pr_branches()
    print(f"Active open PR branches ({len(open_branches)}): {open_branches}")

    # Fetch all remote branches
    raw_branches = run_cmd("git branch -r")
    all_branches = []
    for line in raw_branches.splitlines():
        b = line.strip()
        if "origin/HEAD" in b or not b.startswith("origin/"):
            continue
        branch_name = b.replace("origin/", "")
        if branch_name == "main":
            continue
        all_branches.append(branch_name)

    print(f"Total remote branches: {len(all_branches)}")

    deleted_count = 0
    kept_count = 0

    for branch in all_branches:
        if branch in open_branches:
            print(f"  [KEEP] Branch '{branch}' is associated with an active open PR.")
            kept_count += 1
            continue

        # Check if branch has an associated merged or closed PR
        pr_out = run_cmd(f"gh pr list --repo {REPO} --head {branch} --state all --json number,state")
        if pr_out:
            try:
                prs = json.loads(pr_out)
                if prs:
                    pr_state = prs[0].get("state")
                    if pr_state in ["MERGED", "CLOSED"]:
                        print(f"  [DELETE] Branch '{branch}' has {pr_state} PR #{prs[0]['number']}. Deleting from origin...")
                        run_cmd(f"git push origin --delete {branch}")
                        deleted_count += 1
                        continue
            except Exception as e:
                print(f"  Error checking PR for '{branch}': {e}")

        # Check if branch has 0 unmerged commits relative to main
        log_out = run_cmd(f"git log origin/main..origin/{branch} --oneline")
        if not log_out:
            print(f"  [DELETE] Branch '{branch}' has no unmerged commits relative to main. Deleting from origin...")
            run_cmd(f"git push origin --delete {branch}")
            deleted_count += 1
        else:
            print(f"  [KEEP/REVIEW] Branch '{branch}' has no active PR but contains commits: {log_out.splitlines()[0]}")
            kept_count += 1

    print(f"\nReap Complete! Deleted: {deleted_count} branches | Kept: {kept_count} branches.")

if __name__ == "__main__":
    main()
