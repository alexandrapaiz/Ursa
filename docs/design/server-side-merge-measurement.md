# Measuring the ledger merge: what GitHub's merge button actually does to `docs/ideas.md`

Engineer seat, 2026-10-01 (second dispatch of the day). Artifact for the
six-element engineering-artifact standard in `prompts/engineer-agent.md`.

## 1. Why this was the day's work rather than a sprint item

`docs/sprints/sprint-2026-09-21.md` assigns items 1, 2 and 3 to this seat.
All three are built and unmerged: item 1 in PR #13, item 2 in PR #16, item 3
in PR #18. PR #43 established that on 2026-09-30, and nothing has merged
since. The survey is in §2.

The queue, not the backlog, is the constraint. The PM's standup today
(PR #60) counts 41 open pull requests, every one green and unreviewed, and
reports that the last merge of anything other than a PM standup or a lessons
sync was PR #9 on 2026-09-21. Twelve of those pull requests append to
`docs/ideas.md`, and `docs/ideas.md` is the file they conflict on.

The plan of record for that conflict class is PR #27. Its design document
`docs/design/ledger-union-merge.md` names one constraint that the whole plan
turns on:

> `.gitattributes` says `docs/ideas.md merge=ledger`, but that line only
> names a driver. The command behind the name lives in `.git/config`, which
> is per-clone and never committed, so a fresh clone (and GitHub's own
> server-side merge, which has no such config) falls back to the default
> line-based merge and conflicts on two appends.

That claim had never been measured. It also has an obvious-looking escape
hatch that nobody had tested: `union` is **built into git** and needs no
`.git/config` entry at all, so if GitHub honors `.gitattributes` then
`docs/ideas.md merge=union` would close the conflict class for one line and
no per-merge human step. The difference between those two worlds is the
difference between twelve pull requests that merge themselves and twelve
that each need a human to run a script first. So it was worth one day to
stop guessing (L-A12: verify by looking).

**Both halves of the answer came back negative, and the second half is the
one worth the day.** The escape hatch does not exist, and it is also a
data-loss bug. Details in §4.

## 2. The pull-request survey (L-E10, named numbers)

`gh pr list --state open` at `main` `8c453f0`, 2026-10-01:

- **41 open.** Engineer-seat branches, fifteen of them, this one excluded:
  #13, #16, #18, #22, #24, #25, #27, #32, #33, #36, #38, #43, #56, #57,
  #59. **Zero engineer pull requests have ever merged.** All 15 merges in
  the repository's history are `pm`, `exo`, `chair`, `okr` and `activation`
  branches, the newest being #41 on 2026-09-30.
- `gh pr list --state closed`: three closed without merging, #2, #26 and
  #58 (a market duplicate). None is an engineer branch, so nothing from
  this seat has been built twice and discarded, and the epitome failure
  behind L-E10 is not this repository's shape. The shape here is that
  nothing lands.
- Overlapping scope, searched with
  `gh pr list --state all --search 'ledger merge driver'`: **#27 owns this
  surface** (`.gitattributes`, `tools/ledger/*`), and **#43 owns the stack
  integration harness** (`tools/stack/integrate.sh`).

L-E10 permits three moves and forbids a fourth. The move taken here is
**extend #27**, not reimplement it: this run adds a measurement tool beside
#27's tools, confirms #27's central claim with evidence, and kills a
plausible-looking amendment to #27 that would have destroyed ledger data.
No part of #27 is rewritten. `.gitattributes` is #27's file and this branch
does not contain one (L-A10, one file one owning charter).

## 3. The system diagram, node by node

Every node below is a real file or a real remote endpoint.

```
                     tools/ledger/probe-server-merge.sh
                                   |
        (1) git worktree add --detach /tmp/ursa-sslm-probe.$$ <origin/main sha>
                                   v
                    /tmp/ursa-sslm-probe.$$   (scratch worktree)
                                   |
        (2) writes .gitattributes  |  one line: "docs/ideas.md merge=<arm>"
            commits it as the SHARED PARENT of both sides
                                   v
                 +-----------------+-----------------+
                 |                                   |
   (3) appends one 6-field entry        (3') appends one 6-field entry
       "Probe entry BASE"                   "Probe entry HEAD"
       to docs/ideas.md                     to docs/ideas.md
                 |                                   |
                 v                                   v
        refs/heads/tmp/sslm-<arm>-base      refs/heads/tmp/sslm-<arm>-head
                 |                                   |
                 +------------+----------+-----------+
                              |          |
          (4) LOCAL ARM       |          |     (5) GITHUB ARM
          git merge, HEAD     |          |     git push --force origin
          DETACHED so neither |          |     then POST /repos/{owner}/
          ref moves           |          |     {repo}/merges
                              v          v
                   docs/ideas.md    HTTP status line
                   (merged text)    (201 | 204 | 409 | other)
                              |          |
                              v          v
                    (6) survived(): awk over the merged docs/ideas.md,
                        counts Trigger/What/First step/Cost/Status
                        per "### ... Probe entry X" heading
                              |
                              v
                 stdout table  +  $JSON_OUT (ProbeReport)
                              |
                 (7) trap cleanup EXIT INT TERM:
                     git push origin --delete every tmp/sslm-* ref,
                     git worktree remove --force, git worktree prune
```

Edge data, named by what actually crosses it:

| Edge | Data that crosses it |
|---|---|
| (1) worktree add | a commit SHA, the 40-hex output of `git rev-parse origin/main` |
| (2) attributes commit | one text file `.gitattributes`, one line, 25 bytes |
| (3) and (3') append | six lines of markdown appended to `docs/ideas.md`, UTF-8 |
| (4) local merge | the merged `docs/ideas.md` blob, or a conflict exit status |
| (5) POST /merges | request `{base, head, commit_message}` as JSON; response either a commit object containing `"sha"`, or `{"message":"Merge conflict","status":"409"}`, or an empty 204 body |
| (6) survived | two integers per side, the count of required fields found |
| (7) cleanup | six ref deletions, by name, to `origin` |

## 4. The result

Command, run twice with identical output (`git` 2.55.0, `gh` 2.101.0,
base `origin/main` `8c453f0`):

```
$ bash tools/ledger/probe-server-merge.sh
probe base: origin/main @ 8c453f0   repo: alexandrapaiz/Ursa
merge.* config registered in this clone: 0 entries

== same commits, two merge implementations ==
arm        local git merge                     GitHub POST /merges
---------  ----------------------------------  ----------------------------------
control    CONFLICT                            409 conflict
union      merged  BASE 2/5  HEAD 5/5          409 conflict
ledger     CONFLICT                            409 conflict
```

Read the three rows as three separate findings.

**Finding 1 — GitHub's server-side merge does not honor `.gitattributes`
merge drivers, so #27's claim is correct as written.** The `ledger` arm and
the `control` arm are indistinguishable at the API: both 409. The `union`
arm is the decisive one, because `union` is built into git and so cannot be
explained away by the missing `.git/config` entry. It is also 409, and
deterministically so. Determinism was checked two ways: one commit pair with
`merge=union` on its shared parent was POSTed four times in a row and
returned 409 on all four, and the full three-arm probe was run twice end to
end with byte-identical output. A merge driver named in a committed
`.gitattributes` changes nothing about what the green merge button does.
The consequence is that `tools/ledger/requeue.sh --push` is not a stopgap
that a better `.gitattributes` could remove. It is load-bearing.

**Finding 2 — `union` silently destroys ledger entries, so it must never be
adopted even where it does run.** Local git honors `union`, and the local
column shows what honoring it costs: `BASE 2/5`. The base side's entry came
out of the merge holding two of the five fields the ledger contract
requires. Here is the literal tail of the merged `docs/ideas.md`, the real
payload, not a sketch:

```markdown
### 2026-10-01 — Probe entry BASE
- Trigger: BASE side of the server-side merge probe
- What: BASE paragraph, must survive the merge intact
### 2026-10-01 — Probe entry HEAD
- Trigger: HEAD side of the server-side merge probe
- What: HEAD paragraph, must survive the merge intact
- First step: none, this entry is deleted with the probe branches
- Cost: $0
- Status: proposed
```

Two entries went in. One and a half came out. `union` resolves a conflicting
hunk by concatenating both sides' **lines**, and the two appends end with
three byte-identical lines (`- First step:`, `- Cost:`, `- Status:`), which
the diff aligns as shared context rather than as content belonging to each
entry. So BASE loses its first step, its cost and its status, and HEAD
appears to own them. The merge exits 0. No conflict marker is written. The
file still parses as markdown. **This is worse than the conflict it avoids,
because a conflict stops a human and this does not.**

The reason it happens is structural, not a tuning problem: the correct merge
of two ledger appends is "both entries, whole", and *entry* is not a unit
any line-level driver can see. That is exactly why #27 wrote an entry-aware
driver (`tools/ledger/union-merge.mjs`) instead of using `union`. This
measurement is the evidence for that choice, which #27 made on judgement.

**Finding 3 — #27's checker already catches this corruption, and nothing
runs it.** `tools/ledger/check.mjs` from #27's branch, against the corrupted
file above:

```
$ node tools/ledger/check.mjs /tmp/sslm-local-union.md
::error::/tmp/sslm-local-union.md: near-duplicate block. "- 2026-09-25 (chair, owner-present): overlay s0 shipped and " repeats "- 2026-09-25 (chair, owner-present): overlay s0 shipped and ". A hand-resolved append collision leaves exactly this.
::error::/tmp/sslm-local-union.md: ### 2026-10-01 — Probe entry BASE is missing the "- First step:" line (pm.md §4)
::error::/tmp/sslm-local-union.md: ### 2026-10-01 — Probe entry BASE is missing the "- Cost:" line (pm.md §4)
::error::/tmp/sslm-local-union.md: ### 2026-10-01 — Probe entry BASE is missing the "- Status:" line (pm.md §4)
Ledger contract: 4 violation(s) in /tmp/sslm-local-union.md.
$ echo $?
1
```

Three of those four violations are the splice. The fourth is a
pre-existing near-duplicate pair already on `main`, two chair notes from
2026-09-25 differing only in `§16.2` against `plan 16.2`; `git log -S`
shows both arrived in one single-parent commit, `356b3e5`, so that one is
hand-authored rather than a merge artifact. It is reported here because the
checker reports it, not as evidence for Finding 2.

It catches it precisely. It is also not installed: `ls .github/workflows/`
on `main` returns eleven `agent-*.yml` seat runners and `redaction-gate.yml`,
and no ledger gate and no test workflow. #27 ships its gate as a proposal
under `tools/ledger/ci/` because this seat's GitHub App token has no
`workflows` permission and the push is rejected outright. So the guard that
would stop a corrupted ledger from landing is two `cp` commands away from
existing, and only the owner can run them.

## 5. Interfaces at the component boundary

The probe's one output contract, as the TypeScript a consumer would write:

```ts
/** The literal string in the `local` and `github` fields. `CONFLICT` and
 *  `409 conflict` mean the merge refused. `merged`/`201 merged` are followed
 *  by the field census, e.g. `merged  BASE 2/5  HEAD 5/5`. A `204` or a
 *  `PROBE FAILED:` value means the measurement is invalid, not that the
 *  merge succeeded. */
type MergeOutcome = string;

interface ArmResult {
  /** `git merge` in a clone with zero `merge.*` config registered. */
  local: MergeOutcome;
  /** `POST /repos/{owner}/{repo}/merges`, the merge button's own path. */
  github: MergeOutcome;
}

interface ProbeReport {
  /** 40-hex SHA of origin/main the arms were built from. */
  base: string;
  /** `owner/name`, from `gh repo view --json nameWithOwner`. */
  repo: string;
  arms: {
    /** No `.gitattributes` at all. The baseline. */
    control: ArmResult;
    /** `docs/ideas.md merge=union`, git's built-in driver. */
    union: ArmResult;
    /** `docs/ideas.md merge=ledger`, the driver PR #27 names. */
    ledger: ArmResult;
  };
}

/** A merge is correct only when every entry keeps all five contract fields.
 *  Implemented in the probe as an awk pass, specified here because the
 *  substring form of this check is what made the probe lie twice. */
function entryFieldCensus(mergedLedger: string): Record<'BASE' | 'HEAD', number>;
```

## 6. On-disk layout, with a real payload

| Path | Format | Lifetime |
|---|---|---|
| `tools/ledger/probe-server-merge.sh` | bash, `set -euo pipefail` | committed, this branch |
| `/tmp/ursa-sslm-probe.<pid>` | git worktree | deleted by the `EXIT` trap |
| `/tmp/sslm-local-<arm>.md` | the locally merged `docs/ideas.md` | left for inspection |
| `/tmp/sslm-github-<arm>.md` | the server-merged `docs/ideas.md`, when 201 | left for inspection |
| `$JSON_OUT` | `ProbeReport` as JSON | written only when the variable is set |
| `refs/heads/tmp/sslm-<arm>-{base,head}` | six remote refs on `origin` | deleted in the same run |

`$JSON_OUT` after the run above, the literal file contents:

```json
{"base":"8c453f049e996c6a9592fd5a719f1221ea0be652","repo":"alexandrapaiz/Ursa","arms":{"control":{"local":"CONFLICT","github":"409 conflict"},"union":{"local":"merged  BASE 2/5  HEAD 5/5","github":"409 conflict"},"ledger":{"local":"CONFLICT","github":"409 conflict"}}}
```

No path in this artifact names a home directory, a machine account or a
private session id, per the redaction rider.

## 7. Exact commands

What the probe runs internally, per arm, with real flags:

```bash
git -C "$ROOT" fetch --quiet origin main
git -C "$ROOT" worktree add --quiet --detach /tmp/ursa-sslm-probe.$$ "$START_SHA"

printf 'docs/ideas.md merge=%s\n' "$arm" > .gitattributes
git add -- .gitattributes
git commit --quiet --allow-empty -m "probe $arm: attributes"

git checkout --quiet -B "tmp/sslm-$arm-base" "$SHARED"   # then append, then:
git commit --quiet -am "probe $arm: base entry"
git checkout --quiet -B "tmp/sslm-$arm-head" "$SHARED"
git commit --quiet -am "probe $arm: head entry"

git checkout --quiet --detach "tmp/sslm-$arm-base"
git merge --no-edit --quiet "tmp/sslm-$arm-head"

git push --quiet --force origin "tmp/sslm-$arm-base" "tmp/sslm-$arm-head"
gh api -X POST "repos/$REPO/merges" \
  -f base="tmp/sslm-$arm-base" -f head="tmp/sslm-$arm-head" \
  -f commit_message="probe $arm"

git push --quiet origin --delete "tmp/sslm-$arm-base" "tmp/sslm-$arm-head"
```

How to reproduce and how to clean up after an interrupted run:

```bash
bash tools/ledger/probe-server-merge.sh
JSON_OUT=/tmp/probe.json bash tools/ledger/probe-server-merge.sh
bash tools/ledger/probe-server-merge.sh --cleanup-only
node tools/ledger/check.mjs /tmp/sslm-local-union.md      # needs PR #27 merged
```

## 8. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| `git` | 2.55.0 | builds the commit pairs and runs the local merge arm | the subject under test, not a choice. `--detach` and `worktree` are the two features the probe depends on |
| `gh` | 2.101.0 | reaches `POST /repos/{owner}/{repo}/merges` with the run's existing token | chosen over `curl` because it carries the GitHub Actions token without the script ever naming, reading or printing it, which keeps the charter's secrets boundary and L-A14's safe form |
| `POST /merges` | GitHub REST, no version pin | performs the identical server-side merge the green merge button performs | chosen over reading `pull_request.mergeable` because that field is a cached async computation that returns `null` while GitHub recomputes, so it reports staleness as an answer. Chosen over opening throwaway pull requests because the charter allows one pull request per day |
| `git worktree` | part of git 2.55.0 | isolates every write from the caller's clone and index | chosen after the first version of this script ran `git add -A` in the caller's clone and committed an uncommitted file into a branch it then deleted. A subdirectory or a `git stash` would not have prevented that; only a separate index does |
| `awk` | GNU awk, system | counts contract fields per entry in the merged ledger | chosen over `grep -c` because the substring form is exactly the assertion that passed on a corrupted ledger, and over `node` so the integrity check has no dependency on `ursa-major` being installed |
| `node` | 22.23.3 | validates `$JSON_OUT` parses, and runs #27's `check.mjs` in Finding 3 | already the repo's runtime; no new dependency |

No new paid service, account or domain. Steady-state cost stays $0.

## 9. Terms used above, defined

- **Merge driver.** A program git invokes to resolve one file's conflict
  instead of writing conflict markers. Named per path in `.gitattributes`
  (`docs/ideas.md merge=ledger`); the command behind the name lives in
  `.git/config` unless the name is one git ships.
- **`union`.** The merge driver built into git that resolves a conflicting
  hunk by keeping both sides' lines, in order, with no markers. Needs no
  configuration, which is the only reason it was a candidate here.
- **Server-side merge.** The merge GitHub performs on its own servers when
  the merge button is pressed or `POST /merges` is called. It runs with no
  access to any clone's `.git/config`.
- **Arm.** One of the three independent configurations the probe measures
  (`control`, `union`, `ledger`), each built from its own pair of commits.
- **Field census.** The count, per ledger entry, of the five fields the
  ledger contract requires: Trigger, What, First step, Cost, Status.
- **Probe leak.** The specific defect where the probe's own local merge
  advances a branch ref that is then pushed, so GitHub is handed an
  already-merged branch and answers 204, which the probe would otherwise
  score as a successful server-side merge.
- **`requeue.sh --push`.** PR #27's script, which recomputes the ledger
  merge in a clone that has the driver registered and pushes the result to
  each branch, so GitHub sees a branch that needs no merge driver.

## 10. What follows from this, for whoever merges

1. **Do not add `docs/ideas.md merge=union` to `.gitattributes`.** It would
   not help on GitHub (Finding 1) and it silently deletes entry fields
   wherever it does run (Finding 2). This is recorded here because it is the
   obvious one-line fix, and a future memoryless seat will propose it.
2. **#27 is the right plan and its requeue step is not removable.**
   Finding 1 is the measurement that justifies the manual step a reader
   would otherwise push back on.
3. **Install #27's two workflows.** Two `cp` commands, owner-only, listed in
   `tools/ledger/ci/README.md`. Until then nothing checks the ledger, and
   Finding 3 shows the check works.
4. **The conflict class ends by making the ledger many files, not by
   merging one file more cleverly.** Already in the ledger as an idea from
   PR #43, and this measurement is its supporting evidence: no driver, built
   in or custom, can be both correct and effective on GitHub. That change
   needs a charter edit, so it is the owner's call and not this seat's.

## 11. Honesty note on this run's own measurements

This probe reported the opposite of the truth twice before it was correct,
and both times it looked clean.

- **Run 1** reported all three arms conflicting, including `union`. Cause:
  the script ran `git add -A` in the caller's clone.
- **Run 2** reported `union` merging on GitHub with both entries intact.
  Cause: two defects at once. The local arm merged with HEAD on the base
  branch, so the following `git reset --hard <that same branch>` was a no-op
  and `push --force` shipped the local merge to origin, where GitHub had
  nothing left to merge and returned an empty 204 that the script scored as
  success; and the integrity check was a substring grep that the corrupted
  output satisfied. `cmp` proved it: the file recorded as GitHub's merge
  result was byte-identical to this clone's own.

What caught it was not re-reading the script. It was the control arm
disagreeing with the union arm on identical ledger text, which made one of
the two numbers necessarily wrong. The lesson generalizes past this probe
and is filed in the ledger for the centralizer: **a measurement harness
needs a control arm it is expected to fail, or it reports its own bugs as
findings.** Three of this run's numbers were its own bugs.
