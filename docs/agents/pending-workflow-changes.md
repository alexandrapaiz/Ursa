# Pending workflow changes — for the owner to apply

The ExO seat designs `.github/workflows/` but cannot write it. The
runner's token is refused on that path and no `permissions:` setting
changes it, so changes are specified here in full and the owner applies
them by hand. Each entry carries the evidence, the exact file, and the
exact content. Delete an entry once it is applied.

Verify the boundary by attempting it rather than trusting this file. If
a future run finds the path writable, apply the change directly and fix
prompts/exo-agent.md §5 instead of queueing here.

---

## PWC-1 — Redaction gate (new file, from Ursa incident 4)

**Status: queued 2026-09-20 by the ExO Sunday run. Not yet applied.**

**Evidence.** Ursa incident 2 purged the owner's absolute local paths
from this repo's history on 2026-09-18 and made a standing rule of it.
On 2026-09-19 the same class of string re-entered the public repo
through two new files, and no check noticed. Incident 2's fix was
history surgery only. It protected the past and left nothing watching
the future. This is that missing half.

**What it does.** Greps the working tree for the three data classes
incident 2 named, and fails the job on a hit. It runs on pushes to main
and on pull requests, because the leak in incident 4 arrived as a
direct commit to main and a pull-request-only trigger would have missed
it.

**Verification already done.** The script below was run against this
repo on 2026-09-20 from the ExO run's sandbox. It exits 1 and reports
exactly the four known bad lines in the two files named in PWC-2 and
PWC-3, with no false positives anywhere else in the repo. The allowlist
in the `grep -vE` exists because `/home/runner/` is the Actions
workspace and `/Users/<you>/` is the placeholder form the standard now
requires, so both must pass. Once PWC-2 and PWC-3 are applied, this
gate goes green.

**Create `.github/workflows/redaction-gate.yml` with exactly this:**

```yaml
name: redaction-gate

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Ursa incident 2 named three classes of private data. Incident 4
      # is the same classes coming back through new files one day later,
      # because the incident-2 fix rewrote history and added no gate.
      - name: Scan for private paths and identifiers
        run: |
          set -uo pipefail
          fail=0
          scan() {
            label="$1"; pattern="$2"
            hits=$(grep -rInE "$pattern" . \
              --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.ursa \
              --exclude=redaction-gate.yml 2>/dev/null \
              | grep -vE '/(home/runner|Users/<you>|home/<you>)/' || true)
            if [ -n "$hits" ]; then
              echo "::error::$label"
              printf '%s\n' "$hits" | head -20
              fail=1
            fi
          }
          scan "Absolute home path with a real username. Write /Users/<you>/ or ~/ instead." \
               '(/Users/|/home/)[A-Za-z][A-Za-z0-9._-]{2,}/'
          scan "Claude Code project slug carrying a machine path. Write -Users-you-Desktop." \
               '\.claude/projects/-[A-Za-z]'
          scan "Full private session or conversation UUID. Truncate it to 8 characters." \
               '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
          if [ "$fail" = 1 ]; then
            echo "::error::Redaction gate failed. See prompts/engineer-agent.md, the engineering-artifact standard, element 3, and Ursa incident 4 in docs/agents/incidents.md."
            exit 1
          fi
          echo "Redaction gate clean."
```

**Known limitation, stated so nobody trusts it too far.** This is a
pattern gate, not a secret scanner. It catches the three shapes
incident 2 actually produced. It does not catch prompt text,
conversation captures, or a path format nobody has written yet. It is a
floor. The security seat's `docs/security/redaction-standard.md`,
still unwritten, is the ceiling.

---

## PWC-2 — Redact `docs/design/product-plan.md` (engineer seat's file)

**Status: queued 2026-09-20. Outside the ExO boundary, so not applied.**

This is the engineer seat's deliverable, so the ExO seat may not edit
it. Four edits, all mechanical, none of which weaken the
engineering-artifact standard. The payload stays real and runnable.

- **Line 115.** Replace
  `"projectPath": "/Users/alexandrapaiz/Desktop/ursa-minor-site",`
  with
  `"projectPath": "/Users/<you>/Desktop/ursa-minor-site",`
- **Line 109.** In the sentence beginning "Episode — real example",
  replace the full conversation UUID with `64899e58` and the words
  "conversation 64899e58 (full id in ursa-private)".
- **Line 125.** Replace the full UUID in `"conversationIds": [...]`
  with `"64899e58"`.
- **Line 142.** Replace the full UUID in `"conversationId": ...`
  with `"64899e58"`.

The right person to apply this is the engineer seat on its next run,
or the owner directly. Either way the gate in PWC-1 stays red until it
is done, which is the intended pressure.

---

## PWC-3 — Redact `ursa-major/trial/README.md` line 46 (product code)

**Status: queued 2026-09-20. Outside the ExO boundary, so not applied.**

`ursa-major/` is product code and explicitly outside the ExO seat's
writable surface. Line 46 currently passes `--sessions` with both the
machine-path project slug and the full session UUID. Replace that one
line with:

```
  --sessions ~/.claude/projects/-Users-you-Desktop/<session-id>.jsonl \
```

The line above it already uses `~/Desktop/...` correctly, so this makes
the block internally consistent. The surrounding README explains where
to find your own session file, so a placeholder loses the reader
nothing. The irony worth naming: this line sits in the README whose
closing section announces that the repo's history was purged of exactly
this string.

---

## PWC-4 — Set the repository description (owner-only, not a workflow)

**Status: queued 2026-09-20. Attempted and refused, so routed here.**

**Evidence.** The public repo has an empty description and no topics.
The ExO seat's charter §5b says the repo description is its
responsibility, so this run tried to set it and got HTTP 403,
"Resource not accessible by integration," from `gh repo edit`. The
runner's token cannot write repository metadata, the same boundary that
closes `.github/workflows/`. The charter has been corrected to say so.
Labels and branch deletion were probed in the same way and are
writable, so those stay with the seat.

**What the owner runs, once:**

```bash
gh repo edit alexandrapaiz/Ursa \
  --description "Turn AI peer-to-peer. Ursa Minor trains models on the world's dispersed knowledge; Ursa Major imports your tuning into every model." \
  --add-topic ai --add-topic rlhf --add-topic preference-data \
  --add-topic personalization --add-topic privacy
```

The description is the mission sentence from docs/vision.md §0 followed
by the two product missions from §1, so it stays true as long as those
do. Change it there first if the mission ever moves, and this follows.
