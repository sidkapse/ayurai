<!--
═══════════════════════════════════════════════════════════════════
  REFERENCE FILE — NOT ADOPTED FOR AYURAI
═══════════════════════════════════════════════════════════════════

WHAT THIS FILE IS:
  deploy-config.md is a companion to SKILL.md within a skill folder.
  It holds environment-specific configuration that the deploy skill
  references — URLs, registry names, cluster contexts, branch mappings —
  separated from the procedure steps so config changes don't require
  editing the skill logic.

WHY NOT ADOPTED FOR AYURAI:
  AyurAI has exactly one deploy target: GitHub Pages from the docs/
  directory of the main branch. There is no environment matrix, no
  registry, no cluster, and no URLs to track beyond the single
  GitHub Pages URL. Separating config from steps adds structure
  without any practical benefit for a single-environment app.

BENEFIT (when applicable):
  - Separates *what to do* (SKILL.md) from *where to do it* (deploy-config.md),
    so updating an environment URL or registry path doesn't require
    touching the deploy procedure logic
  - Makes the config diff reviewable on its own — environment changes
    are clearly visible in git history without noise from logic changes
  - Claude can reference config values by name in SKILL.md steps
    (e.g., "push to {{STAGING_REGISTRY}}") for clarity

─────────────────────────────────────────────────────────────────
USE CASE 1 — Multi-region SaaS with per-region config
─────────────────────────────────────────────────────────────────
Scenario: An app deploys to US-East and EU-West AWS regions.
Each region has a different ECR registry, ALB URL, and RDS endpoint.

Their deploy-config.md holds:
  us-east:
    registry: 111111111.dkr.ecr.us-east-1.amazonaws.com
    alb:      https://api.us.myapp.com
    db:       myapp-prod-us.cluster-xyz.us-east-1.rds.amazonaws.com
  eu-west:
    registry: 222222222.dkr.ecr.eu-west-1.amazonaws.com
    alb:      https://api.eu.myapp.com
    db:       myapp-prod-eu.cluster-abc.eu-west-1.rds.amazonaws.com

SKILL.md references these by key. When EU config changes, only
deploy-config.md is updated — SKILL.md steps stay untouched.

─────────────────────────────────────────────────────────────────
USE CASE 2 — Three-tier environment pipeline (dev → staging → prod)
─────────────────────────────────────────────────────────────────
Scenario: A fintech app enforces strict environment promotion:
feature branches → dev, release candidates → staging, tagged → prod.
Each tier has different approval requirements and health check URLs.

Their deploy-config.md holds:
  dev:
    branch:       feature/*
    approval:     none
    health_check: https://dev.myapp.internal/health
    migrations:   auto
  staging:
    branch:       release/*
    approval:     1 team lead sign-off required
    health_check: https://staging.myapp.com/health
    migrations:   auto with dry-run first
  production:
    branch:       tags matching v*
    approval:     2 senior engineers + security sign-off
    health_check: https://myapp.com/health
    migrations:   manual trigger only (migration-runner job)

Result: Claude knows which approval gates and migration strategies
apply to each tier without the developer spelling it out each deploy.
═══════════════════════════════════════════════════════════════════
-->

# Deploy Configuration

## Environments

### AyurAI (single environment)
- **Target**: GitHub Pages
- **Source**: `docs/` directory on `main` branch
- **Deploy**: `git push` (pre-push hook handles version stamp + force-with-lease push)
- **URL**: https://sidkapse.github.io/ayurai (or custom domain)
- **Rollback**: `git revert HEAD && git push`

> For multi-environment projects: add staging/production sections here with
> registry URLs, health check endpoints, and branch-to-environment mappings.
