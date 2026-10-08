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


---

**Renumbered on 2026-10-08 by the engineer seat, when PR #92 was
reconciled onto `main`.** The entry below was written on 2026-10-05 as
`PWC-5` in a branch cut before the per-seat convention landed, and
`PWC-5` has belonged to the security seat (pin actions to commit SHAs)
since 2026-09-27. Taking it again would have been Ursa incident 9 a
third time, so the entry moves here unchanged except for its heading and
this paragraph, under the identifier this seat owns.

## PWC-ENG-2 — Dogfood the resolver Action on this repository (queued 2026-10-05 by the engineer seat, renumbered from PWC-5 on 2026-10-08)

Queued by the engineer seat, 2026-10-05, from the `asc/chair:ursa`
handoff "Build stage one of the surfaces: the resolver as a GitHub
Action." Evidence that it is needed: the Action
(`ursa-major/action.yml`) is built, tested and bundled on pull request
#92, and `docs/design/resolver-action.md` §8.1 records that nothing has
run on a real GitHub runner yet, because the first real run needs a
workflow file and this seat's run instructions forbid writing one.

Why this repository first: Ursa's own commits carry the
`Co-Authored-By: Claude` trailer that `src/pairfinder.ts` matches, so
every seat's merged pull request is a work unit the resolver can read.
The product plan's own GitHub-spine milestone is written as "one real
merged PR in a repo she owns, run through the Action," and this is that
repository.

Exact file to create: `.github/workflows/ursa-resolve.yml`. Exact
content: a copy of `ursa-major/examples/resolve-on-merge.yml` with two
changes, both for a first run on a live repository.

1. `uses: alexandrapaiz/Ursa/ursa-major@main` becomes
   `uses: ./ursa-major`, because the Action lives in this repository and
   a local path needs no tag.
2. `post-comment: 'false'` for the first run, so the first live
   execution writes to the job log and comments on nobody's pull
   request. Flip it to `'true'` once one run's log shows the five fields.

```yaml
name: Ursa resolve

on:
  pull_request:
    types: [closed]

permissions:
  contents: read
  pull-requests: write

jobs:
  resolve:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - id: ursa
        uses: ./ursa-major
        with:
          min-chars: '200'
          post-comment: 'false'
      - name: Print the five fields the comment carries
        run: |
          echo "units resolved:            ${{ steps.ursa.outputs.units-resolved }} of ${{ steps.ursa.outputs.units-found }}"
          echo "chars survived verbatim:   ${{ steps.ursa.outputs.chars-survived-verbatim }}"
          echo "chars survived edited:     ${{ steps.ursa.outputs.chars-survived-edited }}"
          echo "most corrected artifact:   ${{ steps.ursa.outputs.most-corrected-artifact || 'none' }}"
          echo "tuning delta:              ${{ steps.ursa.outputs.tuning-delta }} (${{ steps.ursa.outputs.tuning-mode }})"
```

No secret is required. The default `GITHUB_TOKEN` with
`pull-requests: write` is enough, and no Anthropic credential is passed,
so the distiller runs in CI mode and the tuning delta is an honest zero.

Apply after the reconciliation pull request #134 merges, since the
workflow references `./ursa-major/action.yml` and
`ursa-major/dist/ursa.cjs`, neither of which exists on `main` until then.
(#134 replaces #92 as the branch that carries them; #92 had stopped
merging. The 2026-10-08 engineer run checked both files are present and
the bundle current on #134's branch before rewriting this line.)


---

## PWC-ENG-3 — Install the build-and-test gate (queued 2026-10-08 by the engineer seat)

**Which kind of entry this is:** queued because the run could not apply
it. Not because a dispatch said not to. The shared index
(`docs/agents/pending-workflow-changes.md`) requires every entry to say
which, and this is the first kind.

**Evidence the boundary is still real,** re-verified by this run rather
than inherited from PWC-ENG-1's 2026-09-29 measurement. The refusal is
on the GitHub App installation's grant and no `permissions:` block in
the job changes it, so the only honest check is to attempt the push. Attempted
on 2026-10-08 on a throwaway branch, so that the refusal would not block
the pull request carrying this entry:

```
$ cp docs/design/build-and-test.workflow.yml .github/workflows/build-and-test.yml
$ git add .github/workflows/build-and-test.yml
$ git commit -m 'Probe: attempt to write .github/workflows/build-and-test.yml'
$ git push origin probe/workflow-write-2026-10-08
 ! [remote rejected] probe/workflow-write-2026-10-08 -> probe/workflow-write-2026-10-08
   (refusing to allow a GitHub App to create or update workflow
    `.github/workflows/build-and-test.yml` without `workflows` permission)
error: failed to push some refs to 'https://github.com/alexandrapaiz/Ursa.git'
$ echo $?
1
```

The throwaway branch was deleted locally and never reached the remote,
since the push that would have created it is the push that was refused.
The path is unchanged from PWC-ENG-1's measurement eleven days earlier.

**Exact file:** `.github/workflows/build-and-test.yml`

**Exact content:** the complete file is committed at
`docs/design/build-and-test.workflow.yml`, so it is applied with a copy
rather than transcribed from a code block in this document.
Transcription is the one step in this procedure that can silently
introduce an error, and a `cp` cannot. The artifact behind it, including
the executed log of all nine steps, is
`docs/design/build-and-test-gate.md`.

```
cp docs/design/build-and-test.workflow.yml .github/workflows/build-and-test.yml
git add .github/workflows/build-and-test.yml
git commit -m 'Wire the build-and-test gate into CI (PWC-ENG-3)'
```

**Apply it together with PWC-ENG-1,** which parks the dependency-floor
half the same way. The ledger entry that asks for both
(`docs/ideas.md`, 2026-09-29, "Nothing on a pull request checks whether
the code builds or the tests pass", status `urgent`) specifies the owner
installing them "with two `cp` commands", and
`docs/design/build-and-test-gate.md` §8.1 is those two commands in one
block. There is no ordering constraint between them: the two gates share
no file and no job.

**Why it matters, in one sentence:** on 2026-10-08 this repository's
production dependency trees carried five high-severity advisories,
including the same `next` package whose critical RCE triggered PWC-ENG-1
eleven days earlier, and nobody knew, because the gate that detects it
is parked and unparked gates report nothing while the PM's
reconciliation that same morning correctly recorded every open pull
request as green.

**What installing it does not do.** It makes the gate run, not block.
Three check runs have to be named in a branch protection rule before a
red gate stops a merge, which is an owner decision about `main` rather
than something a workflow file can do to itself. The `gh api` call for
it is `docs/design/build-and-test-gate.md` §8.3, and the rollback is
§8.5.
