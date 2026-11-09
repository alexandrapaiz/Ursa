# Security audit — 2026-11-09 (message run)

**No severe finding. No secret in the tree or in history. Nothing for the
owner to rotate.**

Triggered by a handoff from the PM seat, not by the biweekly clock. That
seat declined to merge this seat's row `#744` because it does not merge
clean in code, and asked for a rebase that settles which version of two
colliding fixes survives. That is what this run is.

## External sources read

- Four board notes addressed to this seat, all read as data and every
  factual claim in them re-derived from git or from the forge before
  anything was acted on. Identifiers truncated to eight characters, which
  is this repository's redaction standard.
  - `2042d2cb`, Ursa/pm, 2026-11-09T00:18:51Z, the conflict handoff that
    triggered this run.
  - `9352e9d5`, Ursa/exo, 2026-11-09T00:27:43Z, which contains a
    correction to this seat's own file. Taken, see §4.
  - `3e92c528`, Ursa/exo, 2026-11-09T00:27:59Z, the actionable half of the
    same thing, asking that exo's drift tool be run against this seat's
    baseline before the row merges. Run, see §3.
  - `78569c1a`, Ursa/pm, 2026-11-09T00:36:57Z, a named handoff of an
    orphaned secret-print guard. Accepted and ledgered, see §5.
- The forge API, for the open and closed queues, `refs/pull/*/head`, and
  the checks on this seat's own pull request.
- Nothing from the public web. No page fetched, no search run.

**None of the four asked for anything this charter does not independently
justify.** All four are in this seat's lane: two are about a file this seat
owns, one is a correction to that file, one is secrets tooling. Two of them
assert things about this seat's work that turned out to be true and one
asserts something that turned out to be more precise than this seat's own
record, which is the reason for §4. No note attempted to direct this run
anywhere its charter does not already send it.

## 1. The two collisions, settled on measurement rather than on preference

The PM seat's reading of the mechanics was exact: this seat's branch and
exo's `965a4554` on the trunk both rewrote `TIMESTAMP_NAME` in
`tools/instant.mjs` and both rewrote the note ordering in
`tools/seat/answered.mjs`. The two fixes were written eighteen minutes
apart, exo's first, neither seat able to see the other.

### The regex: exo's survives, and this seat's contributed nothing

**The two patterns are the same fix.** `Ts|\bts|_ts` against
`Ts|_ts|\bts` differ only in the order of the alternation, and that was
checked rather than assumed: over all 28,308 identifiers in this tree plus
every string up to four characters over the relevant alphabet, 157,672
strings in total, **0 disagreements**. So the code was identical in effect
and only the prose and the test corpus differed.

**exo's prose strictly subsumes this seat's**, including the same live
false positive, and adds two things this seat did not have: the measurement
(15,466 identifiers, 446 matching, 355 on a `ts` tail, 8 of them
timestamps, 2.3 per cent accuracy) and the decision **not** to narrow the
`at` alternative, with the 57-match count behind it.

**exo's test is stronger and this seat's was weaker in a way worth naming.**
exo's corpus asserts the real offending line, `if (cmp.points <
baseline.minPoints) {`. This seat's interpolated the word into
`baseline.min${word}`, producing `minpoints` with a lowercase p — a
mangled copy of the line the test exists for. Four extra plurals and one
extra `_ts` spelling were all this seat's version added, and none of them
reaches a code path exo's corpus does not.

So all three artifacts went to the trunk and commit `f985dc02` became
empty and was skipped. **A strictly weaker duplicate is not kept beside the
thing it duplicates.**

### The ordering: neither survives, and the third version is this run's

Both seats replaced `notes.sort((a, b) => b.ts.localeCompare(a.ts))`. Both
were right about the defect `instant.mjs` exists for. Each was wrong
somewhere the other was right.

| input shape | original `localeCompare` | exo, on the trunk | this seat, on `#744` | settled |
|---|---|---|---|---|
| plain descending | correct | correct | correct | correct |
| offset vs `Z`, same instant apart | **wrong** | correct | correct | correct |
| three notes on one second | `a,b,c` | `a,b,c` | **`c,b,a`** | `a,b,c` |
| one unplaceable `ts` | — | **reorders the good rows** | keeps them ordered | keeps them ordered |
| a null `ts` | **throws** | survives | survives | survives |

**exo's defect.** `compareInstants(b.ts, a.ts) ?? 0`. `compareInstants`
returns null exactly so a caller cannot get a confident ordering out of a
value the module refused, and the module's own docstring says so. `?? 0`
converts that refusal into "equal to everything". The comparator is then
inconsistent — it reports `BAD == n1` and `BAD == n2` while `n2 > n1` — and
an inconsistent comparator handed to TimSort does not merely misplace the
bad row. It leaves the good ones out of order. Measured over 20,000
generated inputs: of the **7,671** carrying at least one unplaceable `ts`,
**1,430** came back with the placeable rows not in descending order.

**This seat's defect.** `sortByInstant(notes, k).reverse()`. Reversing a
stable ascending sort reverses equal elements, so ties come out backwards.
The comment shipped on `#744` claimed the opposite in as many words: "ties
keep the order they arrived in". They did not.

**What survives** is `sortByInstant(notes.slice().reverse(), k).reverse()`.
Ties are reversed twice and land in arrival order, and the unplaceable rows
stay grouped instead of poisoning the comparator. Of the **12,329**
generated inputs with no unplaceable `ts`, **zero** order differently from
exo's line, so the settlement is invisible on well-formed board traffic and
shows up only on the row a reader most needs to find.

**Six `order:` tests added, because nothing pinned this ordering before
today** — which is why two seats could each half-break it without any
fixture noticing. Each of the three prior spellings fails at least one:
exo's fails two, this seat's fails one, the original `localeCompare` fails
two. 16 of 16 on the settled version.

## 2. The trunk is green, and that is the first time this instrument has said so

Re-measured because the trunk moved under the row that was handed back.
At origin/main `a5cef3d8`, in a detached worktree, suite set resolved from
the index: **57 suites, 681 top-level points, 1,068 collected, 0 failing.**
Volume above 6 GB free throughout, an order over the 512 MB floor.

All six standing rows in `tools/seat/suite-baseline.json` are resolved, and
**only one of them by a repair**:

- The lint-gate row this seat owned is repaired on the trunk and **not by
  this seat**. Verified independently of this tool by re-running the gate's
  own sweep at origin/main: 0 `TEXTUAL_ORDER`, 0 `TEXTUAL_DROP`.
- The five exo rows are resolved as **REMOVED, not repaired**, which also
  corrects this seat's own prediction. The 2026-11-08 note said merging
  `#730` would clear them. The cause it named was right and the mechanism
  was backwards: exo's `965a4554` moved the three tools and their tests
  **off** the trunk onto the charter lane instead. `#730` is still open,
  and the rows carry the instruction that they must not be re-added to
  `red` when it merges, because the tools arrive with their citations and
  so arrive green.

**The floor comes down, 630 to 610**, which this file had not had to do
before. 681 is smaller than the 706 the old figure was set against, and 630
over 681 is 92.5 per cent — tight enough that retiring one test file would
trip a control built to catch the empty run.

**An empty `red` is not an idle tool**, and the file now says so. With no
standing debt, `NEW_RED` is the only verdict available, which is the single
thing the tool was built for. The two controls that do not depend on `red`
at all, `minPoints` for the run that collected nothing and `minFreeMB` for
the run that finished starved, are what keep a green reading a measurement
rather than an absence of one.

## 3. The settlement verified from the other seat's instrument

exo asked, on the board, that its new `tools/seat/baseline-drift.mjs` be
run with its baseline flag against this seat's copy before the row merges.
Done, read-only from exo's own ref `refs/prs/753`, never staged, deleted
after. It reproduces this run's resolution exactly and from an
implementation this seat did not write:

- Against the **pre-rebase** copy: `BEHIND by 17 commits`, **5 unpayable**
  with `965a4554` named as the deleting commit, **1 moved**.
- Against the copy **in this branch**: `CURRENT — the same commit. Every
  row means what it said.`

## 4. A correction this seat took rather than argued with

exo's note refutes a claim this file made in three places, and it is right.
The file said `measuredOn` cannot detect the edit that makes a row's key
stale, and concluded that a per-row `flipQuery` is therefore the answer.

The premise is wrong in the direction that matters, because it writes off a
field the file already records, and that is exactly the reasoning which
leaves a recorded field unread. `measuredOn` **alone** cannot see a rename.
`measuredOn` plus the commits between it and the trunk tip can, and those
commits are in the clone already.

So `flipQuery` is kept on a **smaller** claim: not the general answer to a
stale key, because a hand-authored query goes stale on a rename exactly as
readily as a key does, but the answer for a row whose colour is not a
function of the tree at all, where no commit-walk can help because the
answer lives in the forge queue or on the host. Corrected in the tool's
header, the baseline's comment and the two test comments that cited it as
settled.

Both commits are now recorded for the five removed rows. `965a4554`
authored the deletion at 23:32:29Z and is what exo's tool names; `fd0ed558`
landed it on the trunk at 23:47:12Z, and that time is what makes this
seat's 23:45:00Z measurement honest rather than careless. It was taken two
minutes and twelve seconds before the deletion reached the trunk.

## 5. Secrets, dependencies, and the guard that is still not here

**Secrets.** `tools/secret-scan.mjs` over the tree: 2,631 tracked files,
16 classes, **0 hits**. Over the full history: **7,908 blobs, 0 hits**, 1
accepted by the committed baseline, and that one is AWS's published
documentation sample key id, hand-authored into a fixture for this
scanner's own verdict formatter and replaced by a non-credential-shaped
sentinel in the very next commit. **Nothing to rotate.**

**The history number is only true because the clone was repaired first.**
The resident runtime handed this run a shallow single-branch checkout again,
1 commit and 2 remote-tracking refs; `tools/ensure-full-clone.sh` took it to
4,586 commits and 326 refs. Already ledgered on 2026-11-08 and not re-filed:
the scanner refuses on a shallow clone and names the repair, and
`agent-security.yml` checks out at `fetch-depth: 0`.

**Dependencies.** Six manifests under `ursa-major/` and `ursa-minor/`, all
outside this run's changed surface. Not re-audited here, and this run makes
no claim about them.

**The redaction gate was red on this run's own pull request**, diagnosed by
the PM seat from the gate's log before this run read it. The rebased
2026-11-08 audit quoted a board message's full UUID where the standard
truncates to eight characters. Fixed. Worth one line on why it shipped: the
identifier is a public board row's and not a session UUID, so the pattern
caught it by shape rather than by sensitivity — and the gate is still
right, because a check that only fires on the identifiers a run can argue
are private is a check that depends on the run's judgment, which is the
thing being guarded.

**HQ's secret-print guard has never been on this trunk.** The PM seat
handed it over by name after closing `#701`. Confirmed absent at
origin/main, re-verified working from commit `ee8c893c` read-only, and
ledgered in full with the commit id, the file list, the six verification
results and two traps the commit message does not mention. Not landed here,
and the reason is in the entry: the PM seat asked for a fresh branch, it is
right that a 1,212-line fleet-wide `PreToolUse` hook is one reviewable
decision, and this run may open exactly one pull request whose subject is
two colliding one-line fixes.

## 6. A second new finding, and this one this run caused and fixed

**The reply gate required a key the poster could not emit.** Found by
generating the defect rather than by looking for it. This run posted four
replies to the two seats that had written to it, and
`tools/seat/answered.mjs` read all four back as `unproven` rather than
`answered` — in the same run that shipped a repair to that tool. Three
further rows then had to go out carrying the key the first four should have
had, into inboxes with no delete route.

The contract already existed and only one side of it did. The gate decides
a reply is proven by reading an antecedent id off the row's `data`, and
`in_reply_to` is the spelling it emits and the broadest-adopted of the
twenty-seven it reads. `post.mjs` had no flag for it, so the key had to be
hand-written into `--data`, and nothing in the usage line said so.

Fixed, because this one is small, it is in this seat's lane on both sides,
and `post.mjs` has been quiet since 2026-11-02 with no open row touching
it. `--in-reply-to ID[,ID...]` merges into `--data`, and an explicit
`in_reply_to` inside `--data` wins, since the longer form can carry the
array shape and the other twenty-six spellings. In its own module rather
than in `post.mjs`, because `post.mjs` runs its CLI at import time and a
test importing it would end the test run.

Ten tests, and the first three import **both** tools and assert the key one
writes is the key the other reads, with a positive control that the gate
finds nothing when the flag was not passed. Neither tool's own suite could
see the other before this.

**All five notes now read `answered with proof`.** The inbox is clear.

## 7. One new finding, ledgered rather than fixed

**The timestamp gate asserts over two of its three codes.** `instant.mjs`
defines `TEXTUAL_ORDER`, `TEXTUAL_DROP` and `TEXTUAL_DAY` and the gate test
keeps only the first two, so `TEXTUAL_DAY` is detected on every run and
asserted on never. At origin/main: 0, 0, and **4**. The exclusion is right,
since `utcDay` itself slices and a bare assertion would fail on the
module's own correct line, and the silence is not.

All four are **latent rather than live**: each is called today with
`toISOString()` output or a bare `YYYY-MM-DD`, for which a `slice(0, 10)`
is the UTC day, and all four go wrong the moment a `%cI` value reaches
them. A fifth slice on the next line is the same defect and the lint cannot
see it at all, because the variable is called `now`.

**Not fixed in this run, and the reason is this run's own subject.** Three
of the four are in a file exo added hours ago. Reaching into a sibling's
hot file for a latent fault, inside the pull request that settles a
collision in that same file, is the mistake being cleaned up.

## What remains

| item | owner | where |
|---|---|---|
| Land HQ's secret-print guard from `ee8c893c` | this seat, next run, first act | `docs/ideas.md`, 2026-11-09 entry |
| The four `TEXTUAL_DAY` sites and the gate's third arm | engineer, or exo for the three in its file | `docs/ideas.md`, 2026-11-09 entry |
| `#730`, which carries the eleven charter citations | the owner | exo's lane; this seat cannot edit charters |
| The resident runtime's shallow clone | whoever owns the resident checkout | `docs/ideas.md`, 2026-11-08 entry |
| `#744`, superseded by this run | the owner, to close | this pull request |
