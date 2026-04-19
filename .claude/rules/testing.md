<!--
═══════════════════════════════════════════════════════════════════
  REFERENCE FILE — NOT ADOPTED FOR AYURAI
═══════════════════════════════════════════════════════════════════

WHAT THIS FILE IS:
  testing.md defines project-wide testing conventions — framework
  choice, file naming patterns, coverage expectations, mocking
  strategies, and what constitutes a passing test suite.
  Claude reads this whenever writing or modifying test files.

WHY NOT ADOPTED FOR AYURAI:
  AyurAI has no test suite. The only validation is:
    node scripts/validate.js
  …which checks required function *existence*, not behaviour.
  There is no test framework, no test runner, no test files, and
  no coverage tooling. Creating testing.md documents conventions
  for a system that does not exist.

BENEFIT (when applicable):
  - Claude writes tests in the team's actual framework (Vitest,
    Jest, Playwright, pytest) rather than guessing or mixing tools
  - Documents coverage thresholds so Claude adds enough tests,
    not just the happy path
  - Captures project-specific mocking patterns so Claude reuses
    established helpers instead of reinventing them per feature

─────────────────────────────────────────────────────────────────
USE CASE 1 — React / TypeScript SaaS app with Vitest
─────────────────────────────────────────────────────────────────
Scenario: A product team uses Vitest + React Testing Library.
Without a testing.md, Claude sometimes writes Jest-style tests,
uses enzyme patterns, or skips error-state coverage.

Their testing.md specifies:
  Framework  : Vitest + @testing-library/react
  File naming: MyComponent.test.tsx alongside the component
  API mocking: Use msw (Mock Service Worker) — never jest.fn() fetch
  Required coverage per component:
    - Renders without crashing
    - Primary user interaction (click/submit)
    - Error state (API failure, empty data)
  Coverage threshold: 80% branch coverage enforced by CI (vitest --coverage)
  Snapshot tests: Forbidden — they break on every style change

Result: Every component Claude creates or modifies gets consistent,
maintainable tests that pass CI without developer rework.

─────────────────────────────────────────────────────────────────
USE CASE 2 — Python FastAPI backend with pytest
─────────────────────────────────────────────────────────────────
Scenario: A backend team uses pytest with factory_boy for fixtures.
Without testing.md, Claude writes inline test data objects and
skips parametrize patterns, making tests hard to extend.

Their testing.md specifies:
  Framework  : pytest 7+
  Fixtures   : Use factory_boy factories in tests/factories.py only —
               never create model instances inline in test functions
  Parametrize: Use @pytest.mark.parametrize for all data-driven tests
  Integration: Require --integration flag + live DB (skip in unit CI)
  Performance: Unit tests must complete in under 100ms each
  Auth mocking: Use tests/conftest.py fixture `mock_current_user`

Result: Claude applies these rules when adding tests to new endpoints,
keeping the test suite consistent with the established patterns and
preventing slow or database-coupled unit tests from slipping through.
═══════════════════════════════════════════════════════════════════
-->

# Testing Conventions

> Add testing framework, file naming, coverage thresholds, and mocking patterns here.
