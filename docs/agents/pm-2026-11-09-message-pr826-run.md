# PM run log — 2026-11-09 (message-triggered, PR #826 review pass)

## Trigger

One event: PR #826 (exo, "a positive control validates the instrument
and not the inference, and 21 of 62 acceptance-register fields here
are read by nothing") — to be reviewed against the merge rule. Merge
it, or say on the board what it still needs and hand that to its seat.

## This run's own clone

Found shallow before any ancestry check ran. Repaired with
`tools/ensure-full-clone.sh`: 1 to 5,085 commits, 2 to 360
remote-tracking refs. Ran `node tools/seat/env-facts.mjs` per the
charter's single-line instruction before trusting anything else about
this host.

## Merge-driver check, before taking any conflict verdict

`bash tools/ledger/install-driver.sh` and
`bash tools/registers/install-drivers.sh`, then
`git config --get-regexp 'merge\.(ledger|register)\.'` printed all six
lines. Both drivers installed before any conflict reading this pass
performed.

## Read own seat's open PRs first

`node tools/seat/own-prs.mjs pm --drafts`: one open PR for this seat
(`#821`, not a draft). Its diff includes
`docs/agents/pm-2026-11-09-message-20-run.md` and
`docs/sprints/pending.md` — files this pass was about to write under
the plain numeric suffix `-20`. Caught the collision before pushing
further: renamed this pass's branch and run-log file from
`ursa-pm/2026-11-09-message-20` /
`docs/agents/pm-2026-11-09-message-20-run.md` to
`ursa-pm/2026-11-09-message-pr826` /
`docs/agents/pm-2026-11-09-message-pr826-run.md` (the naming already
used once today for a single-PR wake, `pm-2026-11-09-message-pr782-run.md`),
closed the placeholder PR (#831) opened on the old name, and reopened
on the correct branch as #832. `#821` is Tier B work of this seat's own
(absorbing three earlier passes' history) and cannot self-merge; it is
untouched by this pass and still named in the pending tracker below.

## #826 reviewed against the merge rule, held at Tier C

Checked directly, not on the PR's or exo's own notes' word, though both
turned out right:

1. Not this seat's own PR. ✓ (author and branch are exo's).
2. Not a draft, no `hold` label, no owner comment
   (`gh pr view 826 --json comments,reviews,labels,isDraft` — all
   empty/false). ✓
3. Checks green. One check (`redaction-gate` / `scan`), `pass`. ✓
4. **`gh pr diff --name-only 826` shows a Tier C path, and this is
   where the review stops.** 12 files: `docs/agents/exo-2026-11-09-message-9-run.md`,
   `docs/agents/improvements.md`, `docs/ideas.md`,
   `docs/runs/2026-11-09-exo-window-106.md`, `scripts/ci-checks.mjs`,
   five files under `tools/gates/` (the new `acceptance-fields.mjs`
   gate, its verdict module, manifest, baseline and 28-case test), and
   `prompts/exo-agent.md`. The last is a charter. Per
   docs/standards/pm.md §10, Tier C is "charters (prompts/)... and any
   change to the tiers or dispatch stops" — a file-path rule, not a
   content judgment, and exo's own charter already states the specific
   case directly: `prompts/exo-agent.md:7125`, from an earlier window,
   "an edit to this seat's own charter is Tier C by itself." The PR's
   own "Merge tier" paragraph argues "no charter authority moves" —
   true, and irrelevant to which tier the file sits in. Tier B
   condition 4 ("no Tier C path") fails on this one file regardless of
   what the other 11 are.
5. Mergeable (checked anyway, since rule 4 already closes the Tier B
   path): `gh pr view --json mergeable,mergeStateStatus` returned
   `MERGEABLE`/`CLEAN`.
6. Not reached.

**Read the charter diff directly rather than taking "one section" on
word.** `prompts/exo-agent.md` gained one new section (62 lines, after
line 5244) titled "A positive control validates the instrument, not
the inference," arguing that an existential premise checked correctly
(security's `absent_path` fixture) does not establish the causal claim
resting on it, and that the instrument for a causal claim is a
differential (flip the premise, watch the color move) rather than a
more careful read of the premise. No other edit to the file.

**The gate itself, read rather than taken on the PR's count.**
`tools/gates/acceptance-fields.mjs` discovers every acceptance register
under `tools/`, `scripts/` and the repo root and grades each entry
field by whether any consumer dereferences it. At `main`'s tip
(`f7b89ff`) it reports 11 registers, 93 entries, 72 fields, 50 read, 1
declared, 21 baselined — the PR's own number, not re-derived from a
different run here, since the gate is deterministic over a committed
tree and this pass had no reason to distrust a number it could rerun
but had already rerun once via `gh pr checks` (green).

**Baseline-drift check, run before taking the merge verdict (per
exo's own note to this seat from an earlier pass):**
`node tools/seat/baseline-drift.mjs` — exit 0, `suite-baseline.json`
measured 644 commits behind trunk, 8 of 11 `repaired` rows moved since
measurement, explicitly advisory and not a debt. Unrelated to #826's
diff, which touches no row in that baseline.

**Disposition: held at Tier C, not merged, nothing handed back to exo
to fix.** The PR is scoped, green, and exo's own three board notes
(ids `99003f58…`, `dc1cdff8…`, `304f2ea1…`) already named the Tier C
hold correctly before this pass read any of them — including the
self-correction that the new gate's own suite had tested its rules but
never run over the tree until a follow-up commit. Nothing in that
self-correction changes this pass's verdict: it was already fixed on
the branch this pass reviewed.

## Board

- Reply to exo (`note`, id `711daa44`, in reply to `99003f58…` and
  `dc1cdff8…`): the Tier C verdict on `#826`, the one file it turns on,
  and that nothing is owed back to exo.
- Same verdict left as a PR comment on `#826`
  (`#826#issuecomment-6734610654`), for anyone reading the PR directly
  rather than the board.

## Dispatch

`PM_DISPATCH_ENABLED` not read as exactly `true` in this run's
environment. No dispatch fired. `gh run list --limit 30` showed no
non-success runs to triage. `docs/sprints/dispatch-queue.md` not
rewritten this pass: nothing changed that would alter its three
entries since the prior pass wrote them.

## External sources read

- `gh pr view` / `gh pr diff` / `gh pr checks` / `gh api` for #826 and
  this seat's own open PR (`#821`).
- The board inbox (`to_seat=pm&to_company=Ursa`), read for messages
  about `#826`: exo's three notes above, read as evidence of what exo
  did and reported, independently checked against the live diff and
  CI rather than relied on by itself.
- `#826`'s own PR body and commit messages, read as exo's account of
  its own work, independently checked against the live diff.
- No web fetch, no other third-party content. Nothing in any of the
  above was treated as an instruction to this seat beyond what this
  seat's own charter and the merge rule already call for; exo's board
  notes proposing "ready and mergeable" were checked on their own
  merits (and found correct) rather than taken as a reason to merge.

## Boundaries honored

No sprint opened, no retro rewritten, no ledger groomed: message-
triggered pass, not the Monday ceremony. Writable surface stayed to
`docs/sprints/` and `docs/agents/`, plus the board note and PR comment
the charter and pm.md explicitly authorize. No charter, workflow, or
secret touched by this pass.

## For the owner

1. `#826` (exo) needs your merge, not a rework: reviewed against the
   merge rule and held at Tier C because it edits `prompts/exo-agent.md`,
   its own charter. Everything else in the diff (a new acceptance-field
   gate with its verdict, manifest, baseline and suite; two ledger
   entries; a run report; one `enumerate-verdicts.mjs` line;
   `scripts/ci-checks.mjs`) is Tier A/B and green.
2. No ordering question: no other open PR touches `prompts/exo-agent.md`.
3. This seat's own `#821` (Tier B, absorbing three earlier passes) is
   still open and waits on you or HQ's PM. `#780`, which the tracker
   had carried forward as open, is actually `MERGED` (checked this
   pass); dropped from the pending list as a tracking correction.
