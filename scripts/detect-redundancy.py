#!/usr/bin/env python3
"""Redundancy detector — finds duplicate and near-duplicate issues on a board."""

import json
import sys
import re
from collections import defaultdict

def main():
    if len(sys.argv) < 2:
        print("Usage: detect-redundancy.py <board-data.json> [threshold] [status-filter]")
        sys.exit(1)

    board_file = sys.argv[1]
    threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.6
    status_filter = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else ""

    with open(board_file) as f:
        data = json.load(f)

    STOP = {'the', 'a', 'an', 'and', 'or', 'for', 'to', 'in', 'of', 'on', 'at',
            'is', 'it', 'as', 'by', 'with', 'from', 'be', 'this', 'that', 'not',
            'are', 'was', 'all', 'add', 'set', 'up', 'do', 'if', 'so', 'no'}

    def tokenize(text):
        words = re.findall(r'[a-z]+', text.lower())
        return {w for w in words if w not in STOP and len(w) > 2}

    def similarity(tokens_a, tokens_b):
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = tokens_a & tokens_b
        smaller = min(len(tokens_a), len(tokens_b))
        return len(intersection) / smaller if smaller > 0 else 0.0

    # Collect issues
    issues = []
    for item in data.get('items', []):
        content = item.get('content', {})
        if not content:
            continue
        num = content.get('number')
        title = item.get('title', '') or content.get('title', '')
        status = item.get('status', '')
        priority = item.get('priority', '')
        itype = content.get('type', '')

        if status_filter and status != status_filter:
            continue

        issues.append({
            'num': num,
            'title': title,
            'status': status,
            'priority': priority,
            'tokens': tokenize(title),
            'is_draft': itype == 'DraftIssue',
        })

    # Find near-duplicates
    groups = []
    used = set()

    for i, a in enumerate(issues):
        if i in used:
            continue
        cluster = [a]
        for j, b in enumerate(issues):
            if j <= i or j in used:
                continue
            sim = similarity(a['tokens'], b['tokens'])
            if sim >= threshold:
                cluster.append(b)
                used.add(j)
        if len(cluster) > 1:
            used.add(i)
            groups.append(cluster)

    # Find exact title duplicates
    title_counts = defaultdict(list)
    for item in issues:
        title_counts[item['title'].strip().lower()].append(item)
    exact_dupes = {t: items for t, items in title_counts.items() if len(items) > 1}

    # Report
    print("=" * 60)
    print(f"REDUNDANCY REPORT")
    print(f"Threshold: {threshold} | Items scanned: {len(issues)}")
    print("=" * 60)
    print()

    if exact_dupes:
        print(f"## Exact Duplicates ({len(exact_dupes)} groups)")
        print()
        for title, items in sorted(exact_dupes.items()):
            ids = []
            for it in items:
                if it['num']:
                    ids.append(f"#{it['num']}")
                else:
                    ids.append("(draft)")
            print(f"  {', '.join(ids)}: \"{items[0]['title'][:70]}\"")
        print()

    if groups:
        print(f"## Near-Duplicates ({len(groups)} clusters)")
        print()
        for idx, cluster in enumerate(groups, 1):
            print(f"  Cluster {idx}:")
            for item in cluster:
                tag = f"#{item['num']}" if item['num'] else "(draft)"
                draft = " [DRAFT]" if item['is_draft'] else ""
                pri = f" [{item['priority']}]" if item['priority'] else ""
                print(f"    {tag}{draft}{pri}: {item['title'][:80]}")
            shared = cluster[0]['tokens']
            for c in cluster[1:]:
                shared = shared & c['tokens']
            if shared:
                print(f"    → shared terms: {', '.join(sorted(shared))}")
            print()

    # Summary
    total_in_clusters = sum(len(c) for c in groups)

    print("## Summary")
    print()
    print(f"  Total items scanned: {len(issues)}")
    print(f"  Exact duplicate groups: {len(exact_dupes)}")
    print(f"  Near-duplicate clusters: {len(groups)} ({total_in_clusters} items)")
    print(f"  Unique items: {len(issues) - total_in_clusters}")
    print()

    if not groups and not exact_dupes:
        print(f"✅ No duplicates at threshold {threshold}")
    else:
        mergeable = total_in_clusters - len(groups)
        print(f"⚠️  ~{mergeable} items could potentially be merged or archived")

if __name__ == '__main__':
    main()
