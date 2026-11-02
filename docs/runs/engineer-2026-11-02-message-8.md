# Engineer run, 2026-11-02, eighth message pass

**What woke this run.** Two rows. A merge notification for `#661` telling this
seat to take the next item in its lane and say what it took, and a `note` from
`Ursa/exo` saying this seat's hook branch `#615` conflicts in **three** files
and not the two its first sweep reported, because that sweep piped
`git merge-tree` through `2>&1`.

**What this run took, and why that and not a board item.** The rebase of
`#615`. Nothing of this seat's sits in the Ursa board's Backlog or This
sprint; all five engineer items on the board are in Review, and one of their
branches could not be merged at all. An unmergeable branch of this seat's own
is ahead of new work by the charter's own ordering, which puts "read your own
seat's open pull requests first" before everything else.

## 1. The ExO seat's three-file number, reproduced rather than taken on faith

The note is data, so the figure in it was re-measured here before anything was
rebased. Reproduced exactly: three files, `tools/gates/enumerate-verdicts.mjs`,
its `.test.mjs`, and `tools/secret-scan-verdict.mjs`.

| instrument | arm | answer |
|---|---|---|
| `git merge-tree --write-tree --name-only origin/main refs/prs/615`, streams separate | drivers installed, 6 `merge.*` keys | exit 1, **3 paths** |
| the same, against `e9cf564b` (the commit the note names) | same | exit 1, **the same 3 paths** |
| the same, `2>&1`, `head -4` | same | **2 paths**, and the one dropped is `tools/secret-scan-verdict.mjs` |
| `T=$(git merge-tree --write-tree origin/main refs/prs/615 2>&1 \| head -1); git diff --name-only origin/main "$T"` | same | **exit 128**, `fatal: invalid object name 'ledger driver'` |

**The mechanism, measured rather than inferred.** With the drivers installed,
the `ledger` driver writes one line to **stderr** and `merge-tree` writes the
tree's object id as the **first line of stdout**. Under `2>&1` the diagnostic
lands on line 1 and the tree id on line 2, so every fixed-width read of the
head of that stream is off by one. `head -4`, which over the separated stream
yields exactly the three paths, yields the tree id and the first two paths
instead, and the third path falls off the end of the window.

That is the direction the note described, and it is the dangerous one: an
under-report of a conflict surface reads as progress. A seat handed the
two-file verdict rebases, pushes, and is refused on a file nobody mentioned.

**One sharpening this run can add.** The two-step form of the same idiom does
not under-report, it fails outright at exit **128** with
`fatal: invalid object name 'ledger driver'`. So the redirect has two distinct
failure modes and only one of them is silent, which matters because a sweep
that uses the loud one would have caught itself.

## 2. The rebase

`git merge --no-edit origin/main` on the hook branch, drivers installed,
conflicted on the same three paths the read predicted. All three are two seats
appending to the same list on the same day, so **every resolution keeps both
sides** and none of the three is a choice between two versions of one thing.

- **`tools/secret-scan-verdict.mjs`** — both sides append one entry to
  `GATE.groundProbes`. Kept as two: this branch's `BASELINE_UNPARSEABLE` and
  `main`'s unknown-argument refusal. 5 probes at the merge base, 9 here.
- **`tools/gates/enumerate-verdicts.mjs`** — both sides append to `REGISTRY`.
  Kept all four, `main`'s two first because they landed first. All four module
  paths were checked to exist in the merged tree.
- **`tools/gates/enumerate-verdicts.test.mjs`** — the only one with arithmetic
  in it, and the only one where "keep both" was not enough.

**The arithmetic, because this is the resolution a future seat would get
wrong.** The test asserts a probe count and a cause count. The hook branch
said 36 causes over 46 probes, `main` said 36 over 47, and the union is
neither. Settled by running the enumerator at three commits rather than by
choosing:

| commit | gates | probes | causes |
|---|---|---|---|
| merge base `aaa98509` | 5 | 32 | 27 |
| `main` `cdbdcdff` | 7 | 47 | 36 |
| hook `886baf9b` | 7 | 46 | 36 |
| **the merge** | **9** | **61** | **45** |

`32 + 15 + 14 = 61` and `27 + 9 + 9 = 45`, so the two sides added disjoint
branches and disjoint causes and the union is exact rather than approximately
right. The merged tree then reports 61 and 45 when run, which is the check on
the arithmetic rather than a restatement of it.

**The two identical 36s are why this needed measuring at all.** A reviewer
comparing the two halves sees the same number on both sides and gets no signal
that either is wrong. Taking either one as written would have left the
assertion fourteen or fifteen probes short of the registry it is a census of,
and it would have gone red on the next run rather than silently, which is the
one mercy in it.

The ledger merged by block identity and that union is exact too: 391 blocks at
the base, 401 on `main`, 404 on the branch, **414** merged.

**Pushed to `ursa-engineer/2026-11-01-hook` rather than carried here.** `#615`
is already non-draft, already in the board's Review column with its own item,
and already has a description the owner has read. Making it mergeable where she
already has it is worth more than making this run's pull request a superset of
it. Measured after the push, reading the forge's field three times because its
first read triggers the computation rather than reporting it: `MERGEABLE` on
all three, and `gh pr checks 615` green.

## 3. What shipped on this branch: `tools/stack/merge-surface.mjs`

The rebase was the ask. This is the part that makes the ask unnecessary next
time.

**Why an instrument and not another sentence.** The rule this run's wake
message is about is already written down, in bold, in
`docs/agents/merge-order.md`: **No `2>&1`**. It sits five lines above the table
whose first sweep used it. The reason is already written down too, twice, in
`INC-2026-10-25-the-merge-sweep-this-charter-mandates-reports-four-false-conflicts-in-a-clone-as-handed`
and in a ledger entry whose first step is the single sentence "And keep
stderr." The prose is complete, correct, prominent and was obeyed sometimes.

This repository has now paid **four separate times** for one command answering
confidently and wrongly, and each time the violated precondition was a property
of the clone rather than of the branch:

1. 2026-10-18 — a shallow clone, five of nine open branches read as conflicting.
2. 2026-10-24 (L-A55) — a single-branch refspec, so `origin/<branch>` was
   absent and every refused merge was counted as a conflict in zero files.
3. 2026-10-25 — a clone as handed has neither declared merge driver registered,
   four false conflicts on `docs/ideas.md`; then sixteen more in the same
   window, produced by fixing the first four, from the `2>&1` idiom.
4. 2026-11-02 — this run's wake message.

**So the preconditions are executed, not documented.** Four of them, each
`derivedFrom: 'ground'` with its own cause and its own repair holder, all run
before a merge is attempted: the clone answers history questions
(`tools/ensure-full-clone.sh --check`); every driver `.gitattributes` declares
is registered **in this clone**; every registered driver's program is **inside
this checkout**, which is `merge-order.md`'s "path asserted against `$PWD`"
executed rather than asked for; and no driver key is the empty string, which
returns one side verbatim and exits 1, the same exit a genuine conflict
returns.

**The stream guard is positive rather than a denylist, which is the one design
decision worth defending.** A check for known diagnostic text would be a list
of strings belonging to whichever driver this repository registers next. So
instead: stdout's first line must match `/^[0-9a-f]{40}$/` **and** name an
object that exists, or the run is `TREE_ID_UNREADABLE` and the path list under
it is discarded. There is no invocation of this program that can put a driver's
stderr where the tree identifier belongs, because `spawnSync` is handed two
pipes, and no caller can obtain a conflict surface from it without the tree
that produced it.

**The exit code is read three-valued, never two.** 0 clean, 1 conflict,
anything else — 128 in practice — is git refusing to attempt the merge, which
is ground. `tools/stack/integrate.sh` learned this on 2026-10-24 after
classifying refusals as conflicts in `--json` and as conflicts-in-no-files on
the console in the same run.

**What it is not.** Not a replacement for `integrate.sh`, which answers "would
the union of every open branch build and pass" and needs a real worktree, a
real `git merge` and the suites. This answers "what is the conflict surface of
one pair of commits", writes nothing outside the object database, and is cheap
enough to sweep the whole queue in one call.

**Not registered in the enumerator's `REGISTRY`, deliberately.** Adding a tenth
line to the list `#615` has just taken from seven to nine would re-create the
identical conflict in the identical file while `#615` is unmerged, which is the
conflict this run spent its morning resolving. The structural fix — make the
registry a discovery instead of a literal — is in the ledger as its own entry.
The census already lists this gate as `not yet` extracted, so nothing claims
otherwise.

## 4. Evidence

```
$ node tools/stack/merge-surface.mjs --head refs/prs/615         # before the push
merge-surface origin/main..refs/prs/615: 3 conflicted path(s), which the authoring
seat rebases, measured with 2 merge driver key(s) registered and 1 driver
diagnostic(s) read off stderr.
  tools/gates/enumerate-verdicts.mjs
  tools/gates/enumerate-verdicts.test.mjs
  tools/secret-scan-verdict.mjs
$ echo $?
1

$ node tools/stack/merge-surface.mjs --head refs/prs/615         # after the push
merge-surface origin/main..refs/prs/615: clean, 0 conflicted path(s), measured with
2 merge driver key(s) registered and 0 driver diagnostic(s) read off stderr.
$ echo $?
0

$ node tools/stack/merge-surface.mjs --prs 674,673,672,671,670,669,668,667,666,665,664,660,652,651,649,646,644,643,640,638,633,631,618,601,395 --json
25 rows, 23 clean, 2 conflicting:
  refs/prs/668  PATHS_CONFLICT  docs/agents/improvements.md, docs/agents/merge-order.md
  refs/prs/601  PATHS_CONFLICT  12 paths under skills/

$ node --test tools/stack/merge-surface.test.mjs     # 19 pass, 0 fail
$ node --test tools/gates/*.test.mjs                 # 18 pass, 0 fail (merged tree)
$ node tools/ledger/check.mjs                        # exit 2, the 2 owner-only warnings main has
```

The whole `tools/` suite on the merged hook tree: **592 pass, 0 fail, 2
skipped**. On this branch: **473 of 474**, and the one red is
`tools/board/read-filters.test.mjs:245`, which is red on `main` at `cdbdcdff`
in a separate worktree with nothing of this run's in it. Its cause is the
`/api/events` route answering 500, which `Ursa/exo` routed to HQ this morning;
its own failure message misreads the zero as "the INERT finding is fixed", and
that misreading is in the ledger as its own entry.

**All four guards rehearsed red, each arm separately.** Removing the object-id
shape check, the object-existence check, the three-valued exit reading, or the
clone precondition each fails exactly one test and no others.

**One arm was green at first, and the fix was in the test.** Deleting only the
`--check` exit-1 branch of the clone precondition left the suite green, because
a second branch returns the same `CLONE_INCOMPLETE` cause for the same fixture,
so `/depth|refspec/` was proving the cause and not the reading. It now asserts
both reasons joined, which only the exit-1 path produces. The fixture also had
to clone over `file://`: `git clone --depth 1 /some/dir` prints "--depth is
ignored in local clones" and hands back a complete history, so the clone was
narrow only and the test was proving half of what it claimed.

## 5. Named rather than fixed

- `tools/gates/enumerate-verdicts.test.mjs` line 391 reads
  `describe('the six committed gates, through the same functions')` and
  iterates **five**. Stale on both sides of the conflict, so not part of the
  conflict surface, and left alone deliberately: the merge commit pushed to
  `#615` contains conflict resolution and nothing else, which is what makes it
  reviewable. The adjacent `describe` title and the file header, which were
  wrong at 6 and 7 respectively and are load-bearing on the count this run
  re-derived, were corrected as part of the resolution.
- Three ledger entries this run opened are all defects in this seat's own
  shipped tools: the registry append-point, the live probe that reads a dead
  route as a fixed finding, and `tools/ledger/check.mjs` telling a seat the
  owner must repair a status line no owner wrote.

## External sources read

Everything outside this repository's committed files, one line each:

- The company board over `$BOARD_API_URL`: this seat's inbox (12 rows), and
  the Ursa board's columns and items. The `note` from `Ursa/exo` that woke this
  run is one of those rows. Treated as evidence throughout, per the org rule of
  2026-10-05: its three paths were re-measured here before anything was rebased,
  and the work it points at is independently justified by this seat's own
  charter, since the unmergeable branch is this seat's.
- GitHub, through `gh`: the open pull request list, `#615`'s files, mergeability
  and checks, and the `refs/pull/*/head` refs for 25 open branches.
- `https://docs.mergify.com/merge-queue/` and
  `https://docs.mergify.com/merge-queue/parallel-checks/`, for the craft scan.
  Public vendor documentation, read as data about an adjacent product. It asked
  nothing of this run, and what it does not say — how a speculative merge that
  cannot be created at all is reported as against a CI failure on one that
  could — is written in the ledger entry as a limit of the scan rather than as
  a claim about the product.
