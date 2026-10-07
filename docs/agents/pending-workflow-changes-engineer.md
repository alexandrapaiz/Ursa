# Pending owner-applied changes — engineer seat queue

Entries the engineer seat designed and cannot apply from GitHub
Actions. The convention, the rules about what an entry must say, and
the reason this file is per-seat are in
docs/agents/pending-workflow-changes.md. Read that first.

Identifiers here are `PWC-ENG-N`, numbered by the engineer seat alone.

**This file was created by the ExO seat, 2026-10-05, and the entry below
is the engineer seat's own work, moved and not rewritten.** The engineer
queued it on 2026-09-29 as `PWC-7` inside PR #74, which is now carried
by PR #77. The ExO seat's PR #46 had taken the same number 7 in a branch
nobody could read, which is the collision written up as Ursa incident 9.
The shared index promises that whoever lands either pull request moves
the entry into the owning seat's file under its seat-scoped identifier,
so it is moved here ahead of the landing rather than after it, because
the alternative is a merge resolution that drops it. Only the heading
changed, from `## PWC-7 — Install the dependency floor gate` to the line
below. The body is byte-for-byte the engineer's.

---

## PWC-ENG-1 — Install the dependency floor gate (queued 2026-09-29 by the engineer seat, renumbered from PWC-7 on 2026-10-05)

Queued 2026-09-29 by the engineer seat, not the ExO seat. This file says
the ExO seat designs `.github/workflows/`, and that is still true; what
happened here is that a break-fix produced a gate as its remedy, and a
gate that nobody is required to run is not a remedy. Reinventing a
parallel queue next to this one would have been worse than crossing the
lane by one entry.

**Numbered 7, not 5.** PWC-5 (pin actions to commit SHAs instead of
mutable major tags) and PWC-6 (remove the unused `PROJECTS_TOKEN` from
all eleven seat workflows) are queued by the security seat inside pull
request #28, which is open and unmerged, so neither appears in this file
on `main` yet. Taking 7 leaves both numbers alone so the two PRs do not
have to be merged in a particular order to keep the numbering honest.

**Evidence the boundary is real,** verified today by attempting the push
rather than trusting this file's claim, as its own instructions require:

```
! [remote rejected] engineer/2026-09-29-next-rce-breakfix -> engineer/2026-09-29-next-rce-breakfix
  (refusing to allow a GitHub App to create or update workflow
   `.github/workflows/dep-floor.yml` without `workflows` permission)
```

The path is still refused. No `permissions:` block changes it, because
the restriction is on the GitHub App installation's grant, not on the
job.

**Exact file:** `.github/workflows/dep-floor.yml`

**Exact content:** the complete file is committed at
`docs/design/dep-floor.workflow.yml`, so it is applied with a copy rather
than transcribed from a code block in this document. Transcription is
the one step in this procedure that can silently introduce an error, and
a `cp` cannot.

```
cp docs/design/dep-floor.workflow.yml .github/workflows/dep-floor.yml
git add .github/workflows/dep-floor.yml
git commit -m 'Wire the dependency floor gate into CI (PWC-7)'
```

**Why it matters, in one sentence:** on 2026-09-27 the security seat
found a critical unauthenticated remote code execution in `ursa-minor`'s
`next` dependency, wrote it down, and routed it to a seat, and `main`
carried it for two more days because no mechanism could tell whether it
had been acted on. The advisory itself is now closed. This entry is what
stops the next one repeating the same two days. See
`docs/design/dependency-floor.md`.

