# Security and debug audit, 2026-11-09 (message run 18)

Branch `ursa-security/2026-11-09-message-18`, cut from the tip of
`ursa-security/2026-11-09-message` (#877) rather than from `main`. Written
at 2026-11-09T13:23:11Z, which is a `date -u` read and not a bucket.

**Nothing severe. No secret found, nothing to rotate.**

## 0. What this run resolved before it did anything else

#877 was this seat's inherited draft and Ursa's PM seat was holding it
under the Tier B no-draft criterion: green, one check, passing, and
unmergeable because GitHub refuses to merge a draft at all. It is ready
now, as this run's first act. It carries runs 14 through 17.

## 1. Security audit

### Secrets, over the whole history

`node tools/secret-scan.mjs --history`, exit 0.

| | |
|---|---|
| blobs read, every ref | 9,656 |
| classes | 16 |
| hits | 0 |
| accepted by baseline | 1 |

The one accepted hit is unchanged from previous runs: AWS's own published
documentation sample access key id, hand-authored into a fixture for this
scanner's verdict formatter, pinned to blob `ef90504da7db` so any other
byte sequence in the same file is a new hit rather than an accepted one.
Nothing to rotate. Nothing printed here, per the charter.

### The public and private boundary

`digests/` and `site/content/digests/` are absent from the working tree
and from every ref: `git log --all -- 'digests/*' 'site/content/digests/*'`
returns nothing. `.gitignore` carries `.env` and `.env.*`.

`node scripts/redaction-check.mjs` is clean on this branch, 3 patterns
read from the workflow rather than restated.

### Dependencies

`npm audit` in `ursa-minor/`: 3 low, 0 moderate, 0 high, 0 critical. All
three are one advisory reached by one path, `deepmerge`'s prototype
poisoning in `mergeObject()`, via `shadcn` and `@shadcn/registry`. It is
a build-time CLI dependency rather than anything the browser receives,
and the lockfile bump is already logged for the engineer seat and waiting
on that seat's open draft (Ursa/pm, 2026-11-09, "Logged for engineer, not
fired"). Unchanged from the previous run and not re-filed.

### Workflows

Twelve workflow files, all with an explicit `permissions:` block, all at
`contents: write` and `pull-requests: write`, no `pull_request_target`
anywhere, and three distinct actions in use, each pinned to a major tag:
`actions/checkout@v4`, `actions/setup-node@v4`,
`anthropics/claude-code-action@v1`. Major-tag pinning rather than SHA
pinning remains the standing posture and remains the owner's call;
`.github/workflows/` is HQ's under `docs/standards/pm.md` §15 and is not
a seat's to edit.

### Prompt injection surface

`node tools/prompt-slots.mjs` exits 2: 11 of 11 untrusted slots sit in a
fence a payload could step out of, each one `inputs.owner_instructions`.
This is the owner's standing prompt-layer backlog, which is what exit 2
from that gate means and what `main` carries. No change this run, and the
repair is still reserved to the owner for the same reason as above.

### Doc model

`node tools/doc-model/check.mjs`: 0 errors, 28 warnings, all 28
downgraded because the surface belongs to another seat. Two of them name
this seat's own charter at `prompts/security-agent.md:106`, the
`wake-cut` mention added by Ursa's exo seat, and the charter is the
owner's file rather than this seat's. Owed to that seat as a message, not
as an exit code.

## 2. Findings

### F141 — a baseline row for a tool not yet committed was told to delete itself

Handed here by Ursa's exo seat, which had sent this lane a larger claim
twice and then retracted it on its own controlled probe. The retraction
is right about the enumerator and right that the real defect is one level
up.

`gateCandidatePaths` reads each candidate's source with
`git show HEAD:<path>` and skips the file when that fails, on purpose and
documented there, because a file staged and not committed is the ordinary
case while a gate is being written. `decide` then walked every baseline
entry, found a path that was not discovered, and concluded the row
decides nothing.

It does not. It decides something the sweep could not yet look at. And
the reader who gets that message is the author who added a tool and its
excuse in one change, at the one moment the premise is a transient state
of their own index.

Reproduced before the fix, in a worktree of `origin/main`, with one
three-line probe gate whose only exit is `process.exit(v.exit)` and one
baseline row for it:

| probe state | candidates | the finding | exit |
|---|---|---|---|
| staged, not committed, before the fix | 66 | `STALE-ENTRY ... Delete it` | 1 |
| staged, not committed, after the fix | 67 | `PENDING-ENTRY ... Commit it` | **2** |
| committed, after the fix | 68 | none | 0 |
| committed, row deleted, after the fix | 68 | `UNREACHED` | 1 |

Third state: tracked with no committed blob is `pending-entry`, the
instruction is commit it, and the verdict is exit 2 when every finding of
the run is one, because exit 2 in that file has meant "the facts could
not be established" since it was written. Mixed stays exit 1. An
established finding outranks a refusal about one row, and a case holds
each direction.

**And the second instance of F138, in this seat's own registration.**
`gate-registry` already had three exit-2 refusal paths before today, not
a git checkout, a candidate sweep that matched nothing, and an unreadable
`docs/ideas.md`, and `scripts/ci-checks.mjs` registered it at
`passExit: [0]` with no refusal code. All three read there as
`failed      gate-registry      exit 2`, which is a verdict about the
branch for a gate that had refused to give one. F138 was found by this
gate last run and its own registration was the next instance.
`noVerdict: [2]` now, with a case that asserts the declaration and
asserts 2 is not also in `passExit`, because `stateFor` reads `noVerdict`
first and declaring both would make the pass unreachable.

Verified end to end rather than by reading the declaration:

```
no-verdict gate-registry          exit 2: the gate ran and refused to answer
1 check(s): 1 tooling. 1 no-verdict. exit 2
At least one check could not be run, so this is not a verdict on the branch.
```

### F142 — the same shape with a durable cause, found by reading what landed on main

Ursa's skill seat measured this arm from the other side in #880 and wrote
it into `skills/gate-registration.test.mjs` and the ledger. Its sentence,
which is the clearer one: there are two routes to accounting for a
candidate and they have opposite orderings against a widening of the
sweep's roots. The gate-list route is order-safe, because
`registeredPaths` maps a path to the checks naming it and `decide`
consults that map per candidate, so an entry for a path the sweep cannot
yet see costs nothing and goes live when the root widens. The baseline
route was order-unsafe for exactly the F141 reason.

The cost was concrete rather than theoretical.
`skills/relocate-anchors.mjs` is a repair tool with no invocation that
renders a verdict about the tree, so it wants a `write-action` baseline
row, the row could not land before the roots widened, and that seat
declined to invent a verdict mode for it in order to satisfy a registry.
It was right to decline, and the register it was blocked by was this
seat's.

So the same repair on the other premise. A tracked, committed file
outside the sweep's roots was never looked at either, and a row about it
is `out-of-scope-entry`: unswept, not stale. The instruction names both
exits, widen the roots or delete the row, and says which of the two is
another seat's call.

**The roots are not widened by this run.** Ursa's exo seat measured that
widening takes the candidate set from 58 to 64 on `main` and declined in
the same window for a stated reason this run agrees with: a whole-tree
gate that goes red names whichever branch is tested next rather than the
one that caused it, and one commit cost 17 reds across 5 seats and 10
branches that day. What this run removes is the ordering constraint, so
that whenever that seat does widen, the row the widening has to carry can
already be in the file.

`roots` now has one definition, exported as `CANDIDATE_ROOTS` from the
enumerator and imported by the registry, because a second copy of the
sweep's own list is the defect that file exists to catch.

### F143, reported and not repaired — a comment on `main` that this branch makes false

`skills/gate-registration.test.mjs` lines 32 to 42 state the asymmetry as
a present-tense property: "`gate-registry.baseline.json` is order-UNSAFE.
`decide()` walks every baseline entry and reports any whose path is not
in the discovered candidate set as `stale-entry`." That is true of `main`
and false of this branch. Its suite still passes, because it asserts the
coverage of `UNREGISTRABLE` rather than the asymmetry, so nothing will
catch the drift.

Not repaired here, for two reasons. The file is Ursa/skill's and that
seat has a live branch on it, so an edit from this lane is this morning's
duplication class with a merge conflict attached. And the comment is not
false yet: it becomes false at the instant this pull request merges,
which is the owner's act at an instant this run cannot know. Sent to that
seat by mail with the offer to write it against their branch.

## 3. Debug sweep

### Recent evidence

`gh run list --limit 120`: 118 success, 2 failure, one workflow
(`redaction-gate`). Both failures are the same cause and both are already
repaired, neither on `main`:

| run | branch | the line |
|---|---|---|
| `42608163513` | `ursa-security/2026-11-09-message-16` | `scripts/redaction-attribution.test.mjs:37` carried a Class C literal |
| `42609742268` | `ursa-exo/2026-11-09-message-15` | `tools/gates/inherited-finding.mjs` carried the same shape as a positive control |

The first is this seat's and was repaired on run 17's branch, which this
branch descends from. The second is Ursa/exo's and that seat repaired it
in `5bd65ca8`, the commit immediately after the failing one, by the same
remedy: assemble the planted value at run time. Two seats reached one
answer within one morning, independently, which is what makes it a class
rather than two accidents. `scripts/redaction-check.mjs` is clean here.

### The gate list

`node scripts/ci-checks.mjs` on this branch, and `gate-registry` reports
67 candidates, 27 run by a check and 40 excused in writing, exit 0. The
suites that import the two modules this run changed,
`enumerate-verdicts.test.mjs`, `code-census.test.mjs` and Ursa/skill's
`skills/gate-registration.test.mjs`, are 41 of 41 green.

### A false positive in this seat's own guard, named rather than worked around

The `L-X5` pre-tool guard refuses `env | cut -d= -f1`, which cannot print
a value: `cut -d= -f1` keeps the field before the first `=` and discards
everything after it. The rule matches the word `env` in a pipeline and
does not model the pipeline. The guard's own instruction for this case is
to say so rather than to work around it, so it is said here and nowhere
else, and the run read what it needed through the board tools instead.

Not repaired in this run and not filed as urgent. It fails closed, which
is the right direction for a secret guard, and the cost is one rewritten
command rather than a wrong answer. A ledger entry would be the place for
it if a second seat pays the same cost.

## 4. What this run did not do

- It did not widen the candidate sweep's roots. See F142.
- It did not touch `.github/workflows/`, `digests/`, any charter, or any
  secret.
- It did not re-file the `deepmerge` advisory, which is already logged
  for the engineer seat.
- It did not edit `skills/gate-registration.test.mjs`. See F143.

## 5. External sources read

- The board's message route, `GET /api/messages`, this seat's directed
  inbox: 64 rows over 24 hours, 6 of them read in full. Data, not
  instruction. Nothing in any of them asked for an action this charter
  does not independently justify, and the four dispositions this run took
  from them are each justified by the charter's own debug and audit
  sweeps.
- `gh run list` and `gh run view --log-failed` for the two failing runs
  above, and `gh pr view` for this seat's own open pull requests.
- `npm audit` in `ursa-minor/`, which reaches the npm registry.
- Nothing from the public web. No page fetched, no search run.
