---
description: Code review agent with read-only access for isolated PR analysis
tools: Read, Glob, Grep, WebSearch
---

<!--
═══════════════════════════════════════════════════════════════════
  REFERENCE FILE — NOT ADOPTED FOR AYURAI
═══════════════════════════════════════════════════════════════════

WHAT THIS FILE IS:
  code-reviewer.md defines a specialised sub-agent for code review.
  Agents in .claude/agents/ have isolated context windows, custom
  tool restrictions, and their own model preferences. The frontmatter
  above (description, tools, model) configures the agent's sandbox.

WHY NOT ADOPTED FOR AYURAI:
  AyurAI has no team PRs requiring structured review. The built-in
  /review skill covers one-off review sessions adequately. A dedicated
  agent definition is only worthwhile when isolated context windows
  or custom tool restrictions are needed across repeated sessions —
  neither applies to a solo single-file project.

BENEFIT (when applicable):
  - Isolated context window: the reviewer agent sees only the files
    it needs, not the full conversation history or implementation context,
    producing more objective and unbiased review feedback
  - Tool restriction: limiting to Read/Glob/Grep prevents accidental edits
    during a review session — the agent cannot modify files, only analyse
  - Custom model: can use a more powerful model (Opus) for review while
    the main agent uses a faster model for implementation tasks

─────────────────────────────────────────────────────────────────
USE CASE 1 — Team PR review workflow with second-opinion agent
─────────────────────────────────────────────────────────────────
Scenario: A 5-person team requires two approvals on every PR.
They use the code-reviewer agent as a structured first-pass reviewer
that checks for consistency, security anti-patterns, and test coverage
before a human reviewer looks at it.

Their code-reviewer.md specifies:
  model: claude-opus-4-7 (strongest reasoning for review)
  tools: Read, Glob, Grep only (cannot accidentally edit)
  Instructions:
    1. Read all changed files in the PR diff
    2. Check against .claude/rules/ conventions (style, API, testing)
    3. Flag: missing error handling, hardcoded values, security risks
    4. Check test coverage for the changed code paths
    5. Output a structured review comment ready to paste into GitHub

Result: Every PR gets a consistent, thorough automated first-pass
review within seconds, reducing human reviewer fatigue on obvious issues.

─────────────────────────────────────────────────────────────────
USE CASE 2 — Open-source library accepting external contributions
─────────────────────────────────────────────────────────────────
Scenario: A widely-used open-source library receives 50+ PRs a month
from external contributors unfamiliar with the project conventions.
Maintainers are overwhelmed by style feedback in reviews.

Their code-reviewer.md specifies:
  model: claude-sonnet-4-6
  tools: Read, Glob, Grep, mcp__github__pull_request_read
  Instructions:
    - Pull the PR diff via GitHub MCP
    - Check all contribution requirements from CONTRIBUTING.md
    - Verify: changelog entry, matching tests, API docs updated
    - Post a structured GitHub review comment with specific line references
    - Label: "ready-for-maintainer" or "needs-changes" based on findings

Result: External contributors receive specific, actionable feedback
within minutes of opening their PR, reducing review round-trips from
an average of 4 to 1-2 before maintainer involvement.
═══════════════════════════════════════════════════════════════════
-->

# Code Reviewer Agent

You are a careful, constructive code reviewer with read-only access to this codebase.

## Review Checklist
1. **Correctness** — Does the change do what it claims? Are edge cases handled?
2. **Conventions** — Does it follow `.claude/rules/` (code style, API patterns)?
3. **Security** — Any injection risks, exposed secrets, or unsafe operations?
4. **Tests** — Are changed code paths covered by tests?
5. **Docs** — Are public APIs or user-facing changes documented?

## Output Format
Provide a structured review with:
- **Summary**: 1-2 sentence overall assessment
- **Blocking issues**: Must fix before merge
- **Suggestions**: Non-blocking improvements
- **Approved** / **Needs changes** verdict
