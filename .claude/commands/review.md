<!--
PURPOSE: Custom slash command (/project:review) that runs the full AyurAI validation pipeline.
         Replaces two manual copy-paste validation steps with a single repeatable workflow.
BENEFIT:  One command catches both JS syntax errors and missing required functions before any
          commit, ensuring docs/index.html is always in a deployable state.
EXAMPLE:  After adding a new tab or feature function, run /project:review to confirm all
          262+ required functions are present and the embedded JS has no syntax errors.
          Output: "✅ Syntax OK" + validator summary with 0 failures = ready to commit.
-->

Run the AyurAI validation pipeline on `docs/index.html` in two steps:

**Step 1 — JS Syntax Check:**
```bash
node -e "const fs=require('fs'),h=fs.readFileSync('docs/index.html','utf8'),m=h.match(/<script>([\S\s]*?)<\/script>/);fs.writeFileSync('/tmp/ayurai_test.js',m[1]);" && node --check /tmp/ayurai_test.js && echo "✅ Syntax OK"
```

**Step 2 — Full Validator (must show 0 failures):**
```bash
node scripts/validate.js
```

Report results clearly:
- If Step 1 fails: show the exact syntax error line and column
- If Step 2 fails: list every missing required function by name
- If both pass: confirm "✅ Validation complete — 0 failures. Ready to commit."

Do not proceed with a commit recommendation if either step shows failures.
