# Pending owner-applied changes — ExO seat queue

Entries this seat designed and cannot apply. The convention, the rules
about what an entry must say, and the reason this file is per-seat are in
docs/agents/pending-workflow-changes.md. Read that first.

Identifiers here are `PWC-EXO-N`, numbered by this seat alone. The four
entries below were queued as PWC-7 through PWC-10 before the identifiers
became seat-scoped on 2026-10-04, and they are renamed in place: PWC-7 is
now PWC-EXO-1, PWC-8 is PWC-EXO-2, PWC-9 is PWC-EXO-3, PWC-10 is
PWC-EXO-4. Nothing else about them changed.

---

## PWC-EXO-1 — The cron comments are false, and the midday slots are the worst ones (queued 2026-09-27, ExO)

**Evidence.** Every `schedule` run in this repository's history fired
late, eighteen out of eighteen, by between 1h56 and 6h07, with a median
of 4h07. The full table with per-run timestamps is in
docs/agents/runner-facts.md §2. This is GitHub's shared cron queue
draining a backlog and not a fault in any workflow here, so it will not
be fixed by anything a seat can write.

Two things follow that are worth the owner's hand.

**Part A, the comments. Uncontroversial, apply whenever.** Two cron
lines carry a local-time claim that has never once been true.
`agent-exo.yml` line 5 says `# weekly, Sunday, 18:00 UTC (early
afternoon ET)` and the seat has never started before 19:56 UTC, which
is late afternoon ET. `agent-okr.yml` line 5 says `(morning ET)` for a
13:00 UTC cron that, on the measured delays, will land in the
afternoon. The other nine comments state UTC only, so they are not
false, but they invite the same mistake by naming a time the run never
starts at. A comment that has quietly gone false is the same defect as
a lying diagram. The minimal edit is to append the measured reality to
each cron comment rather than to restate a nominal time:

```yaml
# .github/workflows/agent-exo.yml line 5
    - cron: "0 18 * * 0" # weekly, Sunday. GitHub's queue adds 2-3h, so this lands ~20:30 UTC. See docs/agents/runner-facts.md §2.
```

The same one-line treatment applies to `agent-pm.yml` (both crons),
`agent-engineer.yml` (both crons), `agent-research.yml`,
`agent-frontend.yml`, `agent-skill.yml`, `agent-market.yml`,
`agent-security.yml`, `agent-okr.yml` and `agent-finance.yml`.

**Part B, moving the slots. The owner's call, and not obviously worth
it.** The delay is not uniform across the day. The engineer's 23:26 UTC
slot is the least late of any measured slot, at 2h11 to 2h20, while
every slot between 11:00 and 15:15 UTC runs 3h36 to 6h07 behind. Moving
the midday seats into the late-evening UTC band would probably buy back
about two hours each.

It is written as a proposal and not as an edit, for a reason worth
stating. The delay is a property of the hour, so subtracting today's
measured delay from today's cron moves the job into a different hour
with a different delay, and the correction does not straightforwardly
converge. There are only eighteen observations, all from one week. The
honest recommendation is to apply Part A now, leave the slots alone,
and have a later ExO run re-measure against thirty or more runs before
anyone moves a cron. Lateness costs the org nothing by itself. It cost
something exactly once this week, when a seat mistook it for a fault,
and Part A is what fixes that.

## PWC-EXO-2 — Four ADRs, two numbers (queued 2026-09-27, ExO)

**Evidence.** `docs/decisions.md` contains two headings numbered
ADR-005 and two numbered ADR-006, for four unrelated rulings:

| Line | Heading | Date |
|---|---|---|
| 84 | ADR-005 — Every seat but sales is active | 2026-09-24 |
| 92 | ADR-006 — Ursa is a subcompany of Alexandra Systems Company | 2026-09-24 |
| 100 | ADR-005 — Linear is the board of record | 2026-09-23 |
| 123 | ADR-006 — Linear abandoned; secrets move to Infisical | 2026-09-25 |

The PM standups of 2026-09-25 and 2026-09-27 both flagged this and both
correctly declined to fix it. The cost is already real rather than
hypothetical. `docs/agents/org-chart.md` cites "ADR-005" twice for two
different rulings, and its "Board of record" section reads as current
while describing a board that the second ADR-006 abandoned. Ursa
incident 5 is the same defect one scope out: a citation is the only
mechanism by which a memoryless run learns why a rule exists, and a
number that resolves to two documents teaches a run that citations do
not resolve.

**Why this is queued rather than applied.** Renumbering an accepted ADR
changes an owner's decision record, and other files cite the current
numbers. That is the owner's edit and nobody else's.

**The suggested fix, in the order it should be applied.**

1. Renumber by date, which is the convention the file already follows
   everywhere else. The 2026-09-23 Linear ruling becomes **ADR-005**
   and moves above the 2026-09-24 entries. Seat activation becomes
   **ADR-006**. The subcompany ruling becomes **ADR-007**. Linear
   abandoned becomes **ADR-008**.
2. Note that PR #20 carries an "ADR-007 draft" and is still open, so
   whichever of the two lands second needs its number checked against
   the other.
3. Add a one-line convention under the file's title: numbers are
   assigned in date order, are never reused, and are never renumbered
   once a second file cites them. That is the rule that stops the next
   one, and it mirrors the citation convention already at the top of
   docs/agents/incidents.md.
4. The citing files are then this seat's to correct, and
   docs/agents/org-chart.md is fixed in the same PR that queues this
   entry, using the rulings rather than the numbers where a number is
   ambiguous.

---

## PWC-EXO-3 — Draft-PR-first is missing from all eleven workflow prompt blocks (queued 2026-09-30, ExO)

**Queued by instruction, not by access.** This run had write access to
`.github/workflows/` and proved it (docs/agents/runner-facts.md §1b).
Its dispatch said in its own words never to touch workflows, so the
edit is specified here instead. A future ExO run on the resident host
whose dispatch does not forbid it should apply this directly and delete
the entry.

**Evidence.** Ursa incident 7. All eleven charters in `prompts/` say
`gh pr create --draft` and carry the ship-first section. Zero of the
eleven `prompt:` blocks in `.github/workflows/agent-*.yml` mention
`--draft` or ship-first ordering. Per L-X11 the workflow block arrives
last and closest, so it wins. Reproduce with:

```sh
python3 - <<'PY'
import yaml, glob, os
for f in sorted(glob.glob('.github/workflows/agent-*.yml')):
    seat = os.path.basename(f)[6:-4]
    d = yaml.safe_load(open(f))
    pr = ''.join(s['with']['prompt'] for s in d['jobs']['run']['steps']
                 if isinstance(s, dict) and isinstance(s.get('with'), dict)
                 and 'prompt' in s['with'])
    ch = open(f'prompts/{seat}-agent.md').read()
    print(f"{seat:<10} workflow --draft: {'--draft' in pr!s:<5}  charter --draft: {'--draft' in ch}")
PY
```

**The exact edit, ten workflows.** In each `prompt:` block, replace the
literal string `gh pr create` with `gh pr create --draft`, then add the
ordering sentence immediately after the sentence that contains it. The
ten occurrences, by file and by the line that carries them:

| File | The line to edit |
|---|---|
| `agent-engineer.yml` | `exactly one pull request with \`gh pr create\`, appending new ideas to` |
| `agent-exo.yml` | `request with \`gh pr create\`. Never edit product code` |
| `agent-finance.yml` | `open exactly one pull request with \`gh pr create\`. Never merge` (appears twice, both in the primary and the fallback step; edit both) |
| `agent-frontend.yml` | `on a branch named fe/YYYY-MM-DD-slug via \`gh pr create\`. Protect` |
| `agent-market.yml` | `` `gh pr create`. You write only docs/market/ and proposed entries `` (twice; edit both) |
| `agent-okr.yml` | `exactly one pull request with \`gh pr create\`. You write only` (twice; edit both) |
| `agent-pm.yml` | `exactly one pull request with \`gh pr create\`. You write only` (twice; edit both) |
| `agent-research.yml` | `pull request with \`gh pr create\`. Never write to the database,` |
| `agent-sales.yml` | `open exactly one pull request with \`gh pr create\`. Never merge` |
| `agent-security.yml` | `sec/YYYY-MM-DD and open exactly one pull request with \`gh pr` (the flag goes after `create\``, which wraps to the next line) |

Note that the four workflows with two prompt blocks (finance, market,
okr, pm) carry the open-routing primary step and the subscription
fallback, and **both** blocks need the flag. A run that takes the
fallback path reads only the second one.

**The sentence to add**, once per prompt block, immediately after the
sentence containing `gh pr create --draft`:

```
            Open that draft PR in your first few turns, before the
            substantial work, then commit as you go and call `gh pr
            ready` when the run is finished. A run that dies at turn 90
            with a draft PR open has delivered most of its value; the
            same run with nothing pushed has delivered none of it.
```

Match the surrounding block's indentation exactly, which is twelve
spaces in every one of the eleven files.

**`agent-skill.yml` is the eleventh and needs more than a flag.** Its
prompt block does not mention opening a pull request at all. It needs
the branch-and-PR instruction its charter already carries, in the shape
the other ten use, and then the sentence above.

**How to know it worked.** Re-run the reproduction script. Every row
must read `workflow --draft: True`. Ursa incident 7 closes on that
output.

## PWC-EXO-4 — The one gate that runs on every push cannot see a conflict marker (queued 2026-09-30, ExO)

**Queued by instruction, not by access.** Same reason as PWC-9.

**Evidence.** Ursa incident 8. Commit `ce30b5a` on
`chair/langfuse-traces` carried unresolved conflict markers in four seat
workflow files. GitHub's own workflow validator caught it, producing
four zero-job failed runs; `redaction-gate.yml` ran on the same push
(run 36659158568) and reported `success`. GitHub validates
`.github/workflows/` and nothing else, so the same defect in `docs/` or
`ursa-major/src/` would pass every check this repository runs.

**Tested before being proposed**, per L-A21's requirement that a gate be
tried against an artifact known to fail it. Against a `git archive` of
`ce30b5a`'s tree: exit 1, all twelve marker lines listed by file and
line number. Against this run's tree: exit 0, "Conflict-marker gate
clean."

**The exact edit.** Add one step to `.github/workflows/redaction-gate.yml`,
immediately after the existing `Scan for private paths and identifiers`
step, at the same indentation:

```yaml
      # Ursa incident 8. A hand-resolved merge shipped conflict markers
      # into four workflow files on 2026-09-30. GitHub's validator caught
      # it because they were workflows; nothing here would have caught
      # the same markers in docs/ or in product source. This is the
      # cheapest repo-wide version of that check, and it belongs in the
      # command that already runs on every push and pull request (L-A22).
      - name: Scan for unresolved conflict markers
        run: |
          set -uo pipefail
          markers=$(grep -rInE '^(<{7}|={7}|>{7})( |$)' . \
            --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.ursa \
            --exclude=redaction-gate.yml 2>/dev/null || true)
          if [ -n "$markers" ]; then
            echo "::error::Unresolved git conflict markers are committed. See Ursa incident 8 in docs/agents/incidents.md."
            printf '%s\n' "$markers" | head -20
            exit 1
          fi
          echo "Conflict-marker gate clean."
```

**Two properties of that pattern worth keeping.** The three marker
shapes are written as `{7}` quantifiers rather than as literal runs of
seven characters, so this file and the incident register can describe the
check without tripping it (L-A23, a prohibition must not quote the banned
specimen where the gate can see it). And the trailing `( |$)` is what
keeps a markdown `=======` table rule or a row of `<<<<<<<` in prose from
matching, since a real marker is either bare or followed by a space and a
branch name.

**The known hole, stated rather than hidden.** The step excludes
`redaction-gate.yml` itself, inherited from the existing scan's
`--exclude`, so the gate cannot see conflict markers in its own file. That
is the right trade while the patterns live in the same file as the data
they match, and it is a real gap: a conflicted merge of this workflow
would ship. The alternative is moving both scans into
`tools/redaction-scan.sh` and having the workflow call it, which removes
the exclusion and is the better end state. That is an engineer-seat
change, not queued here.
