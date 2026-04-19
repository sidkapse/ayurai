<!--
═══════════════════════════════════════════════════════════════════
  REFERENCE FILE — NOT ADOPTED FOR AYURAI
═══════════════════════════════════════════════════════════════════

WHAT THIS FILE IS:
  SKILL.md defines an auto-triggered skill that Claude loads into
  context when it detects deployment-related tasks. Skills are
  lightweight instruction sets that activate on task context match,
  keeping the main context window clean until actually needed.

WHY NOT ADOPTED FOR AYURAI:
  AyurAI deployment is a single step: `git push`. The pre-push hook
  in scripts/hooks/pre-push automatically stamps the version, amends
  the commit, and pushes with --force-with-lease. GitHub Pages then
  serves docs/ with zero additional config. There is no multi-step
  deploy pipeline, no environment targeting, and no deploy tooling
  to document. A deploy skill would describe one git command.

BENEFIT (when applicable):
  - Loads deployment context only when needed (not on every task),
    keeping the main context window free for feature work
  - Captures environment-specific URLs, secrets references, and
    rollback procedures so Claude handles them correctly without
    asking the developer each time
  - Supports shell execution — Claude can run actual deploy commands
    via this skill, not just provide instructions

─────────────────────────────────────────────────────────────────
USE CASE 1 — Multi-environment Node.js app (staging + production)
─────────────────────────────────────────────────────────────────
Scenario: A team deploys a Node.js API to staging and production on
Render. Each environment has different env vars, different health
check URLs, and requires running DB migrations before the app starts.

Their SKILL.md specifies:
  Trigger: when user mentions "deploy", "staging", "production", "ship"
  Steps:
    1. Run test suite — abort if failures
    2. Run `npm run migrate` against target environment DB
    3. Push to environment branch (staging/ → staging, main → prod)
    4. Wait for Render deploy webhook confirmation
    5. Hit health check URL and confirm 200
  Staging URL : https://myapp-staging.onrender.com/health
  Prod URL    : https://myapp.onrender.com/health
  Rollback    : git revert HEAD && git push (triggers auto-redeploy)

Result: Claude runs the full deploy procedure correctly for any
environment without the developer having to repeat the steps each time.

─────────────────────────────────────────────────────────────────
USE CASE 2 — Docker + Kubernetes microservice deploy
─────────────────────────────────────────────────────────────────
Scenario: A platform team manages 8 microservices. Deploying any
service requires building a Docker image, pushing to ECR, updating
the Kubernetes deployment manifest, and applying it to the cluster.

Their SKILL.md specifies:
  Trigger: "deploy", "release", "rollout", "k8s apply"
  Registry: 123456789.dkr.ecr.us-east-1.amazonaws.com
  Steps:
    1. docker build -t SERVICE:VERSION .
    2. docker push REGISTRY/SERVICE:VERSION
    3. Update k8s/deployment.yaml image tag to VERSION
    4. kubectl apply -f k8s/ --namespace=production
    5. kubectl rollout status deployment/SERVICE --timeout=120s
  Rollback: kubectl rollout undo deployment/SERVICE

Result: Claude executes the correct multi-step deploy for any of the
8 services with proper version tagging and rollout monitoring —
reducing human error in a repetitive but high-stakes workflow.
═══════════════════════════════════════════════════════════════════
-->

# Deploy Skill

This skill loads automatically when deployment-related tasks are detected.

## Trigger Keywords
`deploy`, `release`, `ship`, `publish`, `production`, `staging`

## Deploy Steps
> Document your deploy pipeline steps here.

## Rollback Procedure
> Document rollback steps here.
