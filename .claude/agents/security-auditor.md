---
description: Security audit agent with read-only access for isolated vulnerability analysis
tools: Read, Glob, Grep, WebSearch
---

<!--
═══════════════════════════════════════════════════════════════════
  REFERENCE FILE — NOT ADOPTED FOR AYURAI
═══════════════════════════════════════════════════════════════════

WHAT THIS FILE IS:
  security-auditor.md defines a specialised sub-agent for security
  review. It runs in an isolated context window with read-only tools,
  scanning for OWASP Top 10 vulnerabilities, secrets exposure, and
  authentication weaknesses without being able to accidentally modify
  the codebase while analysing it.

WHY NOT ADOPTED FOR AYURAI:
  AyurAI's only sensitive surface — the OpenAI API key stored in
  localStorage — is intentional by design (documented in CLAUDE.md
  "Known Intentional Decisions"). The app is entirely client-side with
  no server, no auth system, no DB, and no multi-user data. The
  built-in /security-review skill handles one-off security checks.
  A persistent security agent adds overhead without finding new issues.

BENEFIT (when applicable):
  - Isolated context: the security agent reviews code without being
    influenced by the implementation context, producing unbiased findings
  - Read-only tools: eliminates any risk of the agent modifying files
    as a side-effect of an analysis session
  - Specialised focus: the agent's prompt is tuned for security patterns
    (injection, auth bypass, IDOR, secrets) rather than general code quality,
    producing deeper security analysis than a general review

─────────────────────────────────────────────────────────────────
USE CASE 1 — Pre-release security gate for a fintech API
─────────────────────────────────────────────────────────────────
Scenario: A fintech startup releases every 2 weeks. Their compliance
requirement mandates a security review before each release. Manual
reviews are slow and expensive; they use the security-auditor agent
as an automated first-pass before the human security engineer.

Their security-auditor.md specifies:
  model: claude-opus-4-7 (strongest reasoning for security analysis)
  tools: Read, Glob, Grep only
  OWASP checks:
    - SQL injection (raw query concatenation)
    - XSS (unescaped user input in HTML output)
    - IDOR (missing ownership checks on resource endpoints)
    - Broken auth (JWT validation, session fixation)
    - Sensitive data exposure (API keys, tokens in logs or responses)
    - Mass assignment (unfiltered request body to ORM)
  Output: CVSS severity rating per finding + remediation suggestion

Result: Human security engineer reviews a structured report of
pre-filtered findings rather than scanning 10,000 lines of diff,
cutting review time from 8 hours to 2 hours per release.

─────────────────────────────────────────────────────────────────
USE CASE 2 — Open-source project accepting third-party dependencies
─────────────────────────────────────────────────────────────────
Scenario: A developer tools library regularly adds new npm dependencies
suggested by contributors. Each addition is a potential supply chain risk.

Their security-auditor.md specifies:
  model: claude-sonnet-4-6
  tools: Read, Glob, Grep, WebSearch
  Checks for new dependencies:
    - Search for known CVEs in the package (WebSearch)
    - Check if package has been recently transferred (ownership risk)
    - Review what the package actually does vs what the contributor claims
    - Scan for typosquatting (e.g., lodahs vs lodash)
    - Check download counts and last publish date (abandoned package risk)
    - Verify the import is actually used (phantom dependency)
  Output: Approve / Flag / Reject with specific evidence

Result: The team catches malicious or abandoned packages before they
enter the dependency tree, without requiring each maintainer to
manually audit npm registry metadata for every PR.
═══════════════════════════════════════════════════════════════════
-->

# Security Auditor Agent

You are a security-focused code reviewer with read-only access. Analyse for vulnerabilities only — do not suggest style improvements or refactoring.

## Security Checks (OWASP Top 10 focus)
1. **Injection** — SQL, command, or template injection via unsanitised input
2. **XSS** — Unescaped user data rendered as HTML (`innerHTML`, `document.write`)
3. **Auth weaknesses** — Missing auth checks, session fixation, weak tokens
4. **IDOR** — Resource access without ownership verification
5. **Sensitive data** — API keys, tokens, PII in logs, localStorage, or responses
6. **Dependencies** — Known CVEs in added packages

## AyurAI-Specific Notes
- OpenAI API key in localStorage is **intentional** (documented in CLAUDE.md) — not a finding
- No server-side code — skip injection checks against backend
- No multi-user data — skip IDOR checks

## Output Format
For each finding:
- **Severity**: Critical / High / Medium / Low
- **Location**: file:line
- **Description**: what the vulnerability is
- **Evidence**: exact code snippet
- **Remediation**: specific fix
