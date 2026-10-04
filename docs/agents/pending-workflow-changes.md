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

All four queued entries (PWC-1 redaction gate, PWC-2 product-plan
redaction, PWC-3 trial README redaction, PWC-4 repo description and
topics) were applied by the chair on the owner's directive,
2026-09-24. Entries deleted per this file's own rule.

---

## PWC-5 — Pin every action to a commit SHA

**Queued by:** security seat, 2026-10-04 run (first queued by the
2026-09-27 run in PR #28, which is still open; same content, same
number, so either can be applied without a collision).

**Evidence.** Twenty-eight `uses:` lines across the twelve workflow
files, every one of them a mutable tag:
`anthropics/claude-code-action@v1` fifteen times, `actions/checkout@v4`
twelve, `actions/setup-node@v4` once. A tag can be repointed by whoever
controls the action's own repository, so a tag pin is a trust decision
renewed silently on every run rather than a fixed one. These workflows
run with `contents: write`, `pull-requests: write` and four secrets in
the job environment.

**Change.** Replace each `uses: owner/repo@tag` with
`uses: owner/repo@<full-40-char-sha>  # tag`, resolving each SHA from
the action's release at apply time rather than from this file, since any
SHA written here would be stale by the time it is applied. The trailing
tag comment is what makes the pin readable and lets Dependabot or a
human bump it deliberately.

**Verification after applying.** `grep -h 'uses:' .github/workflows/*.yml`
should show no `@v` form remaining.

---

## PWC-6 — Drop the two credentials nothing reads, and the permission nothing uses

**Queued by:** security seat, 2026-10-04 run (first queued by the
2026-09-27 run in PR #28, still open; same content and number).

**Evidence.** Verified by searching the whole repository, not by
reading the workflows:

- `PROJECTS_TOKEN` is injected into the job environment of all eleven
  seat workflows. No code anywhere reads it. It appears only in prose,
  in `docs/agents/org-chart.md`, `docs/standards/pm.md` and
  `prompts/exo-agent.md`.
- `id-token: write` is granted by all eleven. There is no OIDC consumer
  in the repository: no `azure/login`, no `aws-actions/*`, no
  `getIDToken` call, nothing reading `ACTIONS_ID_TOKEN_REQUEST_URL`.

Both sit in the environment of an agent running under
`--permission-mode bypassPermissions` that is instructed by its charter
to read pull request and issue text written by strangers. That
combination is why this is worth doing even though neither item is
exploitable on its own.

**Change.** In each of the eleven `agent-*.yml` files, delete the
`PROJECTS_TOKEN: ${{ secrets.PROJECTS_TOKEN }}` line from the job `env:`
block, and delete the `id-token: write` line from the `permissions:`
block. Leave `contents`, `pull-requests` and `actions` as they are.
Leave `BOARD_API_URL` and `BOARD_RUNTIME_TOKEN`, which are a standing
decision of `pm.md` §14 rather than an oversight, and leave
`NEON_RO_URL` in the research and skill workflows, where the charters
name it.

If a seat is later given the board or projects work that
`PROJECTS_TOKEN` was provisioned for, add it back to that one workflow
rather than to all eleven.

**Verification after applying.** `grep -c PROJECTS_TOKEN
.github/workflows/*.yml` returns 0 for every file, and
`grep -c 'id-token' .github/workflows/*.yml` likewise.

---

## PWC-8 — The redaction gate should also scan history, and stop dropping whole lines

**Queued by:** security seat, 2026-10-04 run. PWC-7 is held by the
engineer seat's dependency-floor gate in PR #36, so this takes 8.

**Evidence.** Two defects in `redaction-gate.yml`, both found by running
the gate's own patterns in a wider scope than the gate does.

1. The gate greps the working tree only. Sixteen blobs across five
   files, all reachable from `origin/main`, carry the three classes it
   exists to stop. Finding F2 of
   `docs/security/audit-2026-10-04.md` has the detail. Had the gate
   looked at history, this would have been a red build in September
   instead of a finding now.
2. The CI allowance is line-scoped. `grep -vE '/(home/runner|...)/'`
   discards the entire matching line, so a genuinely leaked path that
   happens to share a line with a `/home/runner/` path is not reported.
   Narrow, but it is a bypass in a gate whose whole job is to have none.

**Change.** For (2), anchor the allowance to the pattern rather than the
line, by removing the matched CI prefixes from the line before testing
it instead of dropping the line. For (1), add a second step that walks
`git rev-list --objects --all`, reads each blob with `git cat-file`,
applies the same three patterns, and fails on a hit that is reachable
from the default branch. It needs `fetch-depth: 0` on the checkout,
which the gate's current checkout does not set. Scope the history step
to fail only on blobs reachable from `origin/main`, so an in-flight
branch that the gate is about to reject on its tree is not also reported
twice.

Expect it to fail on the first run, because F2 is currently true. Either
apply it after the F2 decision, or land it in report-only mode first.

**Verification after applying.** The step reports the sixteen known
blobs before the F2 decision and reports nothing after a purge. Never
have it print a matched value, only the path, the blob and the class.

---

## PWC-9 — Three workflows cite ADR numbers that are not Ursa's

**Queued by:** security seat, 2026-10-04 run.

**Evidence.** `docs/standards/lessons.md` already carries the rule: a
bare "ADR-15" in a product repository cannot be resolved, so cite
`HQ ADR-015` or `alexandria ADR-15` and never a bare number. The rule is
recorded and these references still violate it, having been inherited
when the charters were adapted from alexandria at bootstrap.

- `agent-security.yml` line 36 says "ADR-20 in docs/decisions.md". Ursa's
  ledger contains ADR-001 through ADR-006 and no ADR-20, so this seat's
  own stated authority does not resolve.
- `agent-research.yml` lines 37 and 52 cite ADR-11 and ADR-12 the same
  way.

**Change.** Rewrite each bare number to name its source repository, so
"ADR-20 in docs/decisions.md" becomes "alexandria ADR-20" and the
research pair likewise, after confirming against alexandria's ledger
which ruling each one means. If a reference is meant to be an Ursa
decision, the fix is the opposite direction and the ADR needs writing
here, which is the owner's call rather than a text edit.

Two charter files have the same defect, `prompts/engineer-agent.md`
(ADR-15) and `prompts/research-agent.md` (ADR-7). They are not queued
here because they are not workflow files, but they are writable and
belong to the ExO seat. They are reported in
`docs/security/audit-2026-10-04.md` F10.

**Verification after applying.**
`grep -nE 'ADR-[0-9]+' .github/workflows/*.yml` shows every hit
qualified by a repository name.
