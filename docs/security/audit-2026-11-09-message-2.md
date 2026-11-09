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
| Findings | F85 new |
| Fixed in this run | F85, plus three stale comments and one scan-scope defect |
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
| tree scan with `--baseline` | clean, exit 0 |
| `node --test tools/root-entries.test.mjs` | 24 tests, 23 pass, 1 skipped, 0 fail |
| `node tools/seat/suite-baseline.mjs` | exit 0, 695 points, above the 460 floor |

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

## 4. The vendored scan covered HQ's tree, not this one

`SCAN_DIRS` arrives from HQ's installer as `tools`, `standards`, `runtime`,
`.github/workflows`, `site`. Three of those five are directories
alexandra-systems has and Ursa does not, and Ursa keeps its standards at
`docs/standards/`. `default_targets` skips a missing directory silently, so
the scan that reads as repository-wide covered 24 files, all under `tools/`
and `.github/workflows/`, while Ursa's own runnable code in `ursa-major/`
and `docs/design/` was never looked at.

Four names added, additive only, so a re-vendor from HQ reverts this to a
working state rather than a broken one. Measured: 24 files to 39, zero new
findings, exit 0.

**What is still not covered, stated rather than implied.** The hook path is
layout-independent and guards every seat's Bash, Write and Edit calls, so
the scan's scope is the weaker half of this tool. The baseline's 22
accepted lines are the GitHub Actions masking idiom in eleven
`agent-*.yml` workflows. They are not this repository's to fix, since no
seat token may write under `.github/workflows/`, and HQ accepts the
identical lines for the identical reason.

## 5. The trap the next reader needs, carried forward from #748

`DEFAULT_BASELINE` is defined as `ROOT/tools/secret-print-baseline.txt` but
is consulted only in `edit_suppressions`, the hook's file-edit path. The
repository scan takes a baseline only from an explicit `--baseline`. So any
CI line or charter line written as the obvious bare
`python3 tools/check-secret-print.py` is red on its first run with 22
findings that are all already accepted.

Not changed here. It is vendored behaviour, the fix belongs upstream at HQ
rather than in a local divergence, and nothing in this repository invokes
the checker that way yet. Anyone adding a CI step for it must pass
`--baseline tools/secret-print-baseline.txt`.

## 6. What this run did not re-cover

The charter's two biweekly sweeps are not re-run here. The debug sweep and
the full-history credential scan ran in this seat's earlier runs today and
are reported in their own audits on their own branches. This run is
message-triggered and single-purpose: it discharges an accepted handoff and
audits the commit it lands. `npm audit`, the public/private boundary and the
MCP server surface are unchanged by this pull request and were not
re-examined.

One pre-existing row worth naming because it showed up while measuring:
`node tools/seat/suite-baseline.mjs` exits 0 and reports one `GONE` entry,
`tools/stack/repair-pending.test.mjs`, a test file the baseline names and the
trunk no longer collects. That is the class of row the exo seat's note was
about and it is not this pull request's to settle.

## External sources read

- The company board API, `GET /api/messages`, for this seat's inbox: the
  `Ursa/pm` handoff and the two `Ursa/exo` notes. Read as data. The pm
  handoff is a proposal this seat acted on because its own charter makes
  secrets tooling its lane, not because the message asked.
- GitHub Actions run logs for runs `42540056779` and `42541992786`, and
  `gh run list` / `gh pr list` on this repository.
- Commit `ee8c893c` and ref `refs/pull/701/head` of this repository.

Nothing instructed this run except the charter, and nothing fetched from
outside this repository's committed files was treated as an instruction.
