const fs = require("node:fs");
const path = require("node:path");

const GITHUB_API_BASE = "https://api.github.com";
const DATE_RE = /\((\d{4}-\d{2}-\d{2})\)$/;

function parseRepositoryFromPackageJson() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const fallback = "organvm-iii-ergon/peer-audited--behavioral-blockchain";

  if (!packageJson.repository) return fallback;
  if (typeof packageJson.repository === "string") {
    const match = packageJson.repository.match(/github\.com[:/](.+?)(?:\.git)?$/);
    return match?.[1] ?? fallback;
  }

  const url = packageJson.repository.url;
  if (typeof url !== "string") return fallback;
  const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
  return match?.[1] ?? fallback;
}

function labelName(label) {
  if (typeof label === "string") return label;
  return label?.name ?? "";
}

function sanitizeTableCell(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n+/g, " ")
    .trim();
}

function extractInterferenceType(issueBody, issueTitle) {
  if (!issueBody) return issueTitle;

  const headingMatch = issueBody.match(
    /(?:^|\n)###\s*Human Interference Type\s*\n+([^\n]+)/i,
  );
  if (headingMatch?.[1]) return headingMatch[1].trim();

  const inlineMatch = issueBody.match(/Human Interference Type:\s*(.+)/i);
  if (inlineMatch?.[1]) return inlineMatch[1].trim();

  return issueTitle;
}

function inferDueDate(issue) {
  if (issue.milestone?.due_on) {
    return new Date(issue.milestone.due_on).toISOString().split("T")[0];
  }

  const milestoneTitle = issue.milestone?.title ?? "";
  const fromTitle = milestoneTitle.match(DATE_RE)?.[1];
  return fromTitle ?? "-";
}

async function ghRequest(token, pathname, query = {}) {
  const url = new URL(pathname, GITHUB_API_BASE);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status} ${response.statusText}: ${text}`);
  }

  return response.json();
}

async function paginate(token, pathname, query = {}) {
  const all = [];
  let page = 1;
  while (true) {
    const rows = await ghRequest(token, pathname, { ...query, page, per_page: 100 });
    all.push(...rows);
    if (rows.length < 100) break;
    page += 1;
  }
  return all;
}

async function run() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required to generate the handoff index.");
  }

  const ownerRepo = process.env.GITHUB_REPOSITORY || parseRepositoryFromPackageJson();
  const [owner, repo] = ownerRepo.split("/");
  if (!owner || !repo) {
    throw new Error(`Unable to resolve owner/repo from "${ownerRepo}".`);
  }

  console.info(`Fetching blocked issues from ${owner}/${repo}...`);
  const issues = await paginate(token, `/repos/${owner}/${repo}/issues`, {
    state: "open",
    labels: "blocked",
  });

  const tracked = issues
    .filter((issue) => !issue.pull_request)
    .filter((issue) => {
      const labels = issue.labels.map(labelName);
      const hasOwnerLabel = labels.some((name) => name.startsWith("owner:"));
      const isLegacyRange = issue.number >= 123 && issue.number <= 144;
      return hasOwnerLabel || isLegacyRange;
    })
    .sort((a, b) => a.number - b.number);

  const today = new Date().toISOString().split("T")[0];
  const milestones = new Set();
  const ownerLabels = new Set();

  for (const issue of tracked) {
    if (issue.milestone?.title) milestones.add(issue.milestone.title);
    for (const name of issue.labels.map(labelName)) {
      if (name.startsWith("owner:")) ownerLabels.add(name);
    }
  }

  let md = `# Blocked Handoff Index (${today})\n\n`;
  md +=
    "Canonical register of tasks requiring external human intervention (native engineering, legal/commercial approvals, procurement, or cryptographic specialization).\n\n";

  md += "## Milestones\n";
  for (const milestone of [...milestones].sort()) {
    md += `- \`${milestone}\`\n`;
  }
  md += "\n";

  md += "## Owner Role Labels\n";
  for (const ownerLabel of [...ownerLabels].sort()) {
    md += `- \`${ownerLabel}\`\n`;
  }
  md += "\n";

  md += "## Handoff Matrix\n";
  md +=
    "| Feature / Ticket | Issue | Milestone | Owner Role(s) | Due Date | Human Interference Type |\n";
  md += "|---|---|---|---|---|---|\n";

  for (const issue of tracked) {
    const roles = issue.labels
      .map(labelName)
      .filter((name) => name.startsWith("owner:"))
      .join(", ");
    const milestone = issue.milestone ? issue.milestone.title.split(" (")[0] : "-";
    const dueDate = inferDueDate(issue);
    const interferenceType = extractInterferenceType(issue.body, issue.title);

    md += `| ${sanitizeTableCell(issue.title)} | [#${issue.number}](${issue.html_url}) | ${sanitizeTableCell(milestone)} | ${sanitizeTableCell(roles || "owner:unassigned")} | ${sanitizeTableCell(dueDate)} | ${sanitizeTableCell(interferenceType)} |\n`;
  }

  md += "\n## Operational Conventions\n";
  md +=
    "- Each blocked issue is assigned to a coordination owner until a domain owner is delegated.\n";
  md += "- Owner-role labels define who must take lead for next action.\n";
  md +=
    "- Milestones map blockers to roadmap gates; unresolved blockers at gate date imply launch risk.\n";

  const planningDir = path.join(process.cwd(), "docs", "planning");
  const datedFilePath = path.join(
    planningDir,
    `planning--blocked-handoff-index--${today}.md`,
  );
  const latestFilePath = path.join(
    planningDir,
    "planning--blocked-handoff-index--latest.md",
  );

  fs.writeFileSync(datedFilePath, md);
  fs.writeFileSync(latestFilePath, md);
  console.info(`Generated ${datedFilePath}`);
  console.info(`Updated ${latestFilePath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
