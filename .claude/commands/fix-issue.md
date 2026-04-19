<!--
═══════════════════════════════════════════════════════════════════
  REFERENCE FILE — NOT ADOPTED FOR AYURAI
═══════════════════════════════════════════════════════════════════

WHAT THIS FILE IS:
  fix-issue.md is a custom slash command (/project:fix-issue) that
  automates the full workflow for picking up a GitHub issue:
  fetching issue details, creating a branch, implementing the fix,
  running validation, and opening a pull request.

WHY NOT ADOPTED FOR AYURAI:
  AyurAI bugs are highly specific JS quirks — split-function
  boundaries, sync/async DOM timing, single-file mirroring between
  src/ and docs/. Each issue requires its own investigation pattern.
  A generic fix-issue workflow adds process overhead without
  reducing cognitive load. The developer opens docs/index.html
  directly rather than following a structured issue → branch → PR flow.

BENEFIT (when applicable):
  - Reduces context-switching: Claude handles the full cycle from
    issue reading → branch creation → fix → PR without manual steps
  - Enforces consistent branch naming and PR format across a team
  - Prevents "fix it locally but forget to link the issue" mistakes
  - Speeds up repetitive bug-fix tasks that all follow the same shape

─────────────────────────────────────────────────────────────────
USE CASE 1 — High-volume bug tracker on a SaaS product
─────────────────────────────────────────────────────────────────
Scenario: A team processes 20-30 bug reports a week via GitHub Issues.
Each fix follows the same flow: read issue → branch off main →
implement → test → PR referencing issue number.

Their fix-issue.md command does:
  1. Read the GitHub issue by number (mcp__github__issue_read)
  2. Create a branch: fix/issue-{number}-{slug}
  3. Implement the fix based on the issue description
  4. Run the test suite
  5. Open a PR with "Fixes #NUMBER" in the body

Usage: /project:fix-issue 247
Result: Claude reads issue #247, creates the branch, fixes the bug,
runs tests, and opens a linked PR — developer reviews the diff only.

─────────────────────────────────────────────────────────────────
USE CASE 2 — Open-source project with contributor guidelines
─────────────────────────────────────────────────────────────────
Scenario: An open-source library requires all PRs to follow a
specific template: changelog entry, updated docs, and a test for
the exact bug scenario described in the issue.

Their fix-issue.md command does:
  1. Fetch issue body and labels from GitHub
  2. Create feature branch from latest main
  3. Implement fix + add regression test for the reported scenario
  4. Add entry to CHANGELOG.md under [Unreleased]
  5. Update relevant docs page if issue is tagged `docs-needed`
  6. Open PR using the project's required template

Result: Contributors (including Claude) produce complete,
policy-compliant PRs on the first attempt — no back-and-forth
from maintainers asking for missing changelog entries or tests.
═══════════════════════════════════════════════════════════════════
-->

# Fix Issue Command

> Implement the full issue-fix workflow:
> 1. Read issue: mcp__github__issue_read #NUMBER
> 2. Create branch: fix/issue-NUMBER-short-description
> 3. Implement fix
> 4. Run validation
> 5. Open PR referencing the issue

Usage: /project:fix-issue NUMBER
