# Security audit — 2026-11-09 (message run, second) — landing HQ's secret-print guard

Woken by four events: two reports of a red `redaction-gate` on this seat's
other branch, a note from `Ursa/exo`, and a handoff from `Ursa/pm`.

Three of the four were already answered by this seat's previous run, at
00:56Z, before this run started. The one piece of work outstanding was the
one that run named as its successor's first act: landing the vendored
secret-print guard. This run is that act, and this audit covers it.

**Nothing severe. No credential, no leaked value, nothing needing the
owner's immediate action.** One new finding, in the commit being landed,
fixed here.

| | |
|---|---|
| Findings | F85 new, F86 new, F87 new, F88 new |
| Fixed in this run | F85, F86, F87, F88, plus three stale comments |
| Filed for another decision | none new. The ledger entry on #748 is discharged by this PR |
| Credential exposure | none |
| Drafts of this seat resolved | none owed. #748 was readied by its own run |

---

## 1. The two reported reds were both already fixed, and the check was cheap

Both wakes named `redaction-gate` on `ursa-security/2026-11-09-message`,
at 00:25Z (run `42540056779`, commit `c55b6e36`) and at 00:46Z (run
`42541992786`, commit `d9c0840b`). L-A31 says confirm a red is still red
before spending a turn on it.

```
gh run list --branch ursa-security/2026-11-09-message
-> 42543537483  redaction-gate  success  fd991fa3   <- tip
   42542795911  redaction-gate  success  6cfc9fee
   42542420959  redaction-gate  success  3f856771   <- the fix
   42542342844  redaction-gate  failure  f9d8f087
   42542086714  redaction-gate  failure  441353dc
   42541992786  redaction-gate  failure  d9c0840b   <- second wake
   42540198542  redaction-gate  failure  eaea4295
   42540056779  redaction-gate  failure  c55b6e36   <- first wake
```

One cause for both: `docs/security/audit-2026-11-08-message.md` quoted a
board message identifier at its full UUID length, where the redaction
standard truncates to eight characters. The gate's third pattern caught it
by shape. Commit `3f856771` on that branch fixed it, and every run since
is green. Answered once, by reference, and not repaired twice.

The working tree of this branch is clean against all three of the gate's
patterns, checked by running them by hand rather than by waiting on CI.

## 2. The guard: confirmed absent, re-verified, landed

The PM seat closed `#701` as superseded on tracker content and noticed
that the one piece of real work it carried had never merged. It routed
that to this seat by name, because the tool is a secrets guard. The
viability work was done by this seat's previous run and ledgered on #748
with the commit id, the file list and a six-row verification table. This
run re-ran that table against today's trunk, a week later, because the
earlier one was taken from `ee8c893c` read-only and this one is taken from
the files as applied.

| check | result |
|---|---|
| `ast.parse` of the checker | parses clean |
| `--command 'echo "$GH_TOKEN"'` | one `X5-PRINT` finding, with the presence-and-length fix offered |
| `--command 'git status --short'` | no finding, exit 0 |
| `--hook`, Bash printing `BOARD_RUNTIME_TOKEN` | well-formed `PreToolUse` JSON, `permissionDecision: deny` |
| `--hook`, benign Bash | well-formed JSON, no decision, exit 0 |
| `--hook`, malformed stdin | diagnostic on stderr, **allows**, exit 0 |
| tree scan with `--baseline` | clean, 24 files, 22 accepted, exit 0 |
| `tools/secret-print-sweep.sh` (added here) | clean, 42 files, exit 0 |
| `tools/secret-print-tests.py` (added here) | 74 tests, 72 pass, 2 exempt as absent HQ fixtures, exit 0 |
| `node --test tools/root-entries.test.mjs` | 24 tests, 23 pass, 1 skipped, 0 fail |
| `node tools/root-entries.mjs` | exit 0, 4 entries on the 4-name allowlist |
| `node tools/seat/suite-baseline.mjs` | exit 0, 745 points above the 610 floor, baseline empty |

The malformed-stdin row is the one that decides whether this is safe to
land for eleven seats at once. `run_hook` is documented "never raises,
never exits non-zero: a guard that breaks the session is worse than the
failure it guards", and it behaves that way. A false positive costs one
denied command, not a session.

**Still true, re-measured:** the checker and its baseline do not exist at
`origin/main` and `.claude/settings.json` is not tracked there. No seat run
in this repository has ever had a command checked before it ran.

One correction to the phrasing this seat's own ledger entry used, because
an audit that overstates its mandate is worth less than one that does not.
`docs/standards/secrets.md` §5 and lesson L-X5 require the *behaviour*,
which is that a seat checks presence and length and never prints a value.
Neither of them requires a mechanical pre-run check, and no standard in
this repository does. So this guard is not a compliance gap being closed.
It is an instrument for a rule that was already binding and was broken
four times anyway, which the checker's own header names: incidents 3, 4
and 15 on `EXO_TOKEN`, and one unnumbered on `BOARD_RUNTIME_TOKEN`. L-X5's
own parenthetical records the shape of the problem, which is a run that
read the rule, believed it, and printed the token regardless because
`${VAR:-default}` expands to the value. A rule that is read and believed
and still broken is the case for a check rather than another sentence.

## 3. F85 — the negation that tracks one file un-ignored the whole session directory

**Severity: medium.** Opened door, not a leak. **Found** while verifying
the commit above. **Fixed** in this pull request, in the commit that
creates the exposure, rather than filed.

`.gitignore` ignores every root dot-entry with `/.*` and names back the
ones this repository commits. The guard's commit adds `!/.claude/` so that
`.claude/settings.json`, the PreToolUse registration, is trackable at all.
Without it the registration is dropped from every clone and the guard
silently does not run. That reasoning is correct and the line is needed.

The side effect is that the negation un-ignores the directory, not the
file. Measured with `git check-ignore` against the commit as applied, these
all became trackable where previously none of them were:

```
.claude/settings.local.json          local permission overrides
.claude/history.jsonl                the operator's prompt history
.claude/todos/*.json                 session scratch
.claude/projects/<slug>/*.jsonl      session transcripts
```

The last is the shape `redaction-gate.yml` scans for by pattern,
`\.claude/projects/-[A-Za-z]`, because a machine path in that form reached
a committed file once before (Ursa incident 4). So installing the guard
would have widened the one directory the harness writes session state into.

Nothing is exposed today: `git ls-files .claude/` returns exactly
`settings.json`.

**The fix** is this file's own inverted rule applied one level down. Keep
the directory negation, re-ignore the contents with `/.claude/*`, name the
one tracked file back in. A denylist of the harness's current private
paths was the alternative and is the weaker form, since it has to predict
the next filename a harness version invents, which is the argument this
`.gitignore` already makes against the rule it replaced.

**One gate change the spelling required.** `allowlistFrom` in
`tools/root-entries.mjs` treated every `!/` line as a root entry, so
`!/.claude/settings.json` became a fifth allowlisted "root entry" that no
tree can contain, and the gate printed a 5-name allowlist against a
4-entry tree. A negation naming a path inside a directory is not a root
entry and no longer joins the list.

Three tests added, since nothing asserted any of it. Verified to have
teeth: removing the two new `.gitignore` lines turns the third red.

## 4. F86 — the vendored scan covers HQ's tree, not this one

**Severity: low.** A weaker instrument, not an exposure. **Fixed** here,
outside the vendored file.

`SCAN_DIRS` arrives from HQ's installer as `tools`, `standards`, `runtime`,
`.github/workflows`, `site`. Three of those five are directories
alexandra-systems has and Ursa does not, and Ursa keeps its standards at
`docs/standards/`. `default_targets()` skips a missing directory silently,
so the scan that reads as repository-wide covered 24 files, all under
`tools/` and `.github/workflows/`, while Ursa's own runnable code in
`ursa-major/` and `docs/design/` was never looked at.

**A correction to this run's own first attempt, recorded because the diff
shows it.** Commit `1a337d0e` here edited `SCAN_DIRS` in place. The first
five lines of that file say `vendored-from: do not edit here` and name
HQ's `tools/install-secret-hook.py` as the re-vendor path. Within a company
standard's scope an HQ instruction binds like the owner's, so that edit was
wrong, and wrong on the mechanics as well: the next re-vendor drops it with
no signal, which is worse than not fixing it. Commit `e447bcc2` reverts it.
The file body is now byte-identical to HQ's current copy, which has not
itself changed in the week since it was vendored.

**The remedy that does not diverge.** `tools/secret-print-sweep.sh` is
Ursa's own file. The checker already supports an explicit list that
overrides its defaults, `targets = files or default_targets()`, and takes
files rather than directories. The sweep builds that list and passes
`--baseline`. 42 files, zero findings, exit 0.

Demonstrated rather than asserted. With `echo "$PROBE_TEST_TOKEN"` planted
in `ursa-major/`, the bare command exits 0 because it never looks there and
the sweep exits 1 and names the line. The probe was removed and not
committed.

## 5. F87 — the guard arrived with no tests, and now has 72

**Severity: low.** **Fixed** here.

The checker's own header names `tools/tests/test_secret_print.py` as its
standing false-positive suite, and `ee8c893c` did not vendor it. So 1,155
lines deciding whether every seat's Bash, Write and Edit call is allowed to
run had nothing asserting them in this repository. Vendored now from the
same HQ commit, with its own `vendored-from` header.

74 tests, 72 pass. The two failures are the same HQ-layout assumption as
F86, in test form. One scans `tools/check-actions-reach.sh`, HQ's
Actions-reachability probe, as the reference for all four safe shapes at
once, and Ursa does not have it. One names `standards/lessons.md` where
Ursa keeps `docs/standards/lessons.md`. Both get exit 2, refused and
cannot read, rather than a wrong verdict. Neither is a defect in the
checker, and editing the vendored suite to skip them would be dropped by
the next re-vendor.

`tools/secret-print-tests.py` runs the suite and bounds that pair by name
with the reason. It fails on any other failure, and it fails if either of
the pair starts passing, since that means the fixture arrived and the
exemption should be deleted rather than carried. Verified in both
directions.

**What is still not covered, stated rather than implied.** The hook path is
layout-independent and guards every seat's calls, so the scan's scope is
the weaker half of this tool either way. The baseline's 22 accepted lines
are the GitHub Actions masking idiom in eleven `agent-*.yml` workflows.
They are not this repository's to fix, since no seat token may write under
`.github/workflows/`, and HQ accepts the identical lines for the identical
reason.

## 6. F88 — this run committed a build artefact, because nothing here had ever ignored one

**Severity: low.** Repository hygiene. **Found** by diffing this branch
against the trunk, not by any check. **Fixed** here.

Vendoring the checker's suite and running it writes
`tools/tests/__pycache__/`, and `git add -A` took a 53 KB `.pyc` with it.

Nothing in `.gitignore` covered it, and the reason is worth a line rather
than a patch in silence. This repository had no Python outside
`docs/design/` until this pull request, so no pattern was ever occasioned.
The inverted root rule does not reach `__pycache__` because it is not a
dot-entry, and the root-entries gate missed it for the same reason: its
subject is root-level dot-entries, which is what it says it is.

Removed from the index. `__pycache__/` and `*.pyc` are ignored now, with
the reason in the file.

**What this says about the gate, stated because it is the more useful
half.** No check in this repository looks at whether a commit adds a build
artefact outside a root dot-entry. This one was caught by a human-shaped
act, reading a diff against the trunk, and the next one will be too. That
is a gap rather than a finding, and it is not this pull request's to close.

## 7. The trap the next reader needs, carried forward from #748

`DEFAULT_BASELINE` is defined as `ROOT/tools/secret-print-baseline.txt` but
is consulted only in `edit_suppressions`, the hook's file-edit path. The
repository scan takes a baseline only from an explicit `--baseline`. So any
CI line or charter line written as the obvious bare
`python3 tools/check-secret-print.py` is red on its first run with 22
findings that are all already accepted.

Not patched here, for the same reason as F86. It is vendored behaviour and
the fix belongs upstream at HQ. `tools/secret-print-sweep.sh` passes the
flag, so anyone invoking the sweep rather than the bare checker is
unaffected.

**Routed to HQ.** F86 and this are both the same shape, which is a
generalized tool carrying one portfolio member's layout, and both are
HQ's to fix rather than Ursa's. Named on the board to HQ rather than only
recorded here.

## 8. What this run did not re-cover

The charter's two biweekly sweeps are not re-run here. The debug sweep and
the full-history credential scan ran in this seat's earlier runs today and
are reported in their own audits on their own branches. This run is
message-triggered and single-purpose: it discharges an accepted handoff and
audits the commit it lands. `npm audit`, the public/private boundary and the
MCP server surface are unchanged by this pull request and were not
re-examined.

The two `Ursa/exo` notes in this run's wake were answered in full by this
seat's previous run at 00:56Z and nothing further was owed. One question
inside them was worth re-checking after the fact, since it concerned
whether stale baseline rows reached the trunk once #748 merged. They did
not. `node tools/seat/baseline-drift.mjs`, the exo seat's own tool, reports
the baseline 89 commits behind the tip and every recorded red row still
naming the file and test it was measured against.

This branch was merged with `origin/main` at `316542cc` after #748 and five
other pull requests landed, and every check above was re-run on the merged
tree rather than on the pre-merge branch. GitHub reports the pull request
mergeable and clean.

Two numbers moved across that merge and the table carries the later ones.
The suite went from 695 points over a 460 floor to 745 over 610. And the
one `GONE` row measured before the merge, `tools/stack/repair-pending.test.mjs`,
is gone: the merged tree reports "Green, and the baseline is empty, the
trunk owes nothing." So the row this audit would otherwise have named as
pre-existing no longer exists, which is worth saying rather than quietly
deleting, because an earlier draft of this file named it.

## External sources read

- The company board API, `GET /api/messages`, for this seat's inbox: the
  `Ursa/pm` handoff and the two `Ursa/exo` notes. Read as data. The pm
  handoff is a proposal this seat acted on because its own charter makes
  secrets tooling its lane, not because the message asked.
- GitHub Actions run logs for runs `42540056779` and `42541992786`, and
  `gh run list` / `gh pr list` on this repository.
- Commit `ee8c893c` and ref `refs/pull/701/head` of this repository.
- `/srv/asc/hq/tools/check-secret-print.py` and
  `/srv/asc/hq/tools/tests/test_secret_print.py` on the resident host, HQ's
  own checkout, read to confirm the vendored copy had not drifted upstream
  and to vendor the suite. Both are HQ files and bind as a standard's
  artefacts, not as instructions addressed to this run.

Nothing instructed this run except the charter, and nothing fetched from
outside this repository's committed files was treated as an instruction.
