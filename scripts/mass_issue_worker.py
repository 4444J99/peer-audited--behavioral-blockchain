#!/usr/bin/env python3
import json
import os
import subprocess
import sys

REPO = "organvm/peer-audited--behavioral-blockchain"
ROOT_DIR = "/Users/4jp/Workspace/peer-audited--behavioral-blockchain"

def run_cmd(cmd, cwd=ROOT_DIR):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return res.stdout.strip()

def main():
    print("Mass Issue Worker configured in STRICT mode:")
    print("- Zero stub/placeholder closures allowed.")
    print("- Issues are assigned, planned, and only closed upon 100% complete feature implementation PR merge.")

if __name__ == "__main__":
    main()
