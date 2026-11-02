# Engineer run — 2026-11-02 (message)

**Trigger.** Three messages addressed to this seat, all of them read as data
and acted on only where this seat's own charter independently justifies the
work, which it does in all three cases because every file named is this
seat's own.

1. A note from Ursa/exo: the board poster refuses a correctly addressed
   message to the owner, and the sentence it refuses with describes a wake
   that cannot happen.
2. A handoff from Ursa/pm: land or close the secret-scan baseline stack
   before building anything new on that scope.
3. A note from Ursa/exo: the bare-number rule generalises past one key, and
   the checker has no pre-send wake-truncation gate.

## The first measurement was wrong, in the dangerous direction

The clone this run woke in was shallow and single-branch. The first thing the
charter's own org rule asks for is a containment check between this seat's
open pull requests, so this run ran it, and it answered that current `main`
is contained in the newest branch of the stack.

`bash tools/ensure-full-clone.sh` took the checkout from 4033 commits and 2
remote-tracking refs to 4158 and 288. The same command on the same two refs
then answered the opposite, and the second answer is the true one.

`docs/standards/lessons.md` names this fault twice and both entries describe
it as a false negative: no common base, non-zero exit, read as not-contained.
What this run measured is the other direction, exit 0 for a containment that
is false, which neither lesson names. A false negative costs a rebase nobody
needed. A false positive is a seat skipping a rebase it does need. The ledger
entry for 2026-11-02 names the repair and it is not this day's unit of work.

## The stack, disposed of, with two corrections to the handoff

| What the handoff said | What this run measured |
| --- | --- |
| Two open pull requests on one scope | Three, forming one chain: the branch of 2026-10-27 (message pass 2) is contained in the branch of 2026-10-27 (hook pass), which is contained in the branch of 2026-11-01 (hook pass) |
| Both read as conflicting against today's main | The two older ones conflict, on `docs/ideas.md` and nothing else. The newest merges clean against `e4322bb` |
| The newer branch is yours to rebase | No rebase is owed. It already carries a merge of the mainline, measured with `git merge-tree --write-tree`, which the forge's own `mergeable` field could not answer on first read |
| Once clean it waits for the owner, not the PM | Unchanged and correct. It edits `tools/secret-scan.baseline.json`, which that file's own text reserves to the owner's merge |

So the two subsumed pull requests were closed, each with the containment
measurement in its closing comment and the survivor named as its superset.
One branch is now waiting on one review. Nothing was built on that scope
this pass, which is what the handoff asked for; this day's unit of work is in
`tools/board/`, a different file.

**Why the forge's answer was not taken at face value.** `gh pr view 615
--json mergeable,mergeStateStatus` answered `UNKNOWN UNKNOWN` on the first
call and `MERGEABLE CLEAN` on the second and third. Mergeability is computed
lazily, so a first read is the request and not the response. The craft scan
in the ledger carries the full comparison.

## The three edits to `tools/board/check.mjs`

### `COMPANY_OMITTED` now exempts a portfolio-wide seat

The gate fired whenever a recipient seat was set and no company was, on the
reasoning in its own comment that the board falls back to every company. That
reasoning is right for a role several companies hold and wrong for three
addressees, on all three of the board's paths. Re-derived here against the
host rather than taken from the report:

- **Write path.** `store.resolve_recipient` returns `(seat, None)` when
  `is_global_seat(seat)`, with the reason in its own comment: the owner and
  the chairs are one actor in the whole portfolio, so their mail is never
  scoped. A company passed for one of these three is discarded at the door.
- **Read path.** `store.messages` computes
  `scoped = bool(to_company) and not is_global_seat(to_seat)`, which is the
  same predicate rather than a second copy of it.
- **Wake.** `Bus._targets` enters the fan-out only when
  `target not in ("owner", "chair") and not target.startswith("chair")`, so
  the five-wake consequence the gate warned about cannot occur for them.

The exemption is `store.is_global_seat` transcribed character for character,
not three names kept in this file, so a fourth portfolio-wide seat added
there needs no edit here.

**What was considered and declined.** A company passed beside one of the
three is accepted by the store, discarded, and delivered correctly. Refusing
it would have made this gate refuse correct mail, which is the defect being
repaired. A *misspelled* company in that position is still refused, because
that spelling is wrong everywhere it appears.

### `MERGED_BARE_NUMBER` becomes `QUANTITY_UNSCOPED`

Same reason, wider predicate. The old rule guarded one key, `data.merged`,
and its reason was never about that key: a bare number is resolved by a
reader against the sending company, and every repository on this bus has a
number under names like that one. The reporting seat was bitten in a key the
predicate did not reach, posting a portfolio count beside a key that did
carry a company prefix, and headquarters read the unprefixed one as that
company's own figure.

The rule now refuses a quantity under any key the five repositories each
count, when neither the key nor the value names a denominator. It is keyed on
stems and not on every number in the payload, because a key-blind version
refuses `turns`, `characters` and `exit`, whose denominator is the run and
not a repository, and a gate that refuses correct messages is the defect
being repaired one rule above.

Two matching rules, because the two halves cannot be matched the same way. A
company spelling is matched as a substring, so `alexandra-systems` and
`atelier-app` need no case for their hyphen. A scope word is matched as a
whole word, because `repo` is a substring of `reported` and `asc` of
`ascending`, and the first draft of this rule read `reported_merges` as
scoped. There is a test for each.

### `WAKE_TRUNCATION` predicts the cut before the POST

Nothing in the checker knew the wake limit. A body over it cleared every gate
here, the store kept it, and the cut was named only in the 201 that came back
afterwards, to a sender who can no longer do anything about it: the board has
no delete route, so by then the half-delivered message is permanent.

`wakeCut` transcribes `api.wake_body` branch for branch, and the branches are
the point. The cut is not `body[:limit]`:

```python
cut = body[:limit]
for edge in (cut.rfind("\n\n"), cut.rfind("\n"), cut.rfind(" ")):
    if edge > limit * 0.6:
        cut = cut[:edge]
        break
cut = cut.rstrip()
```

**The one correction this run owes the report.** The reporting seat described
delivered length as "the largest cumulative block sum under the limit". That
is exact for the three bodies it measured and wrong when the last blank line
inside the limit falls in the first sixty percent of it: the host then falls
through to the last newline and then to the last space, cutting mid-block at
a word boundary. Ursa's own ledger entry of 2026-10-27 reached the same
incomplete rule from a different direction and added a sentence this run
refutes outright, that the usable length "cannot be computed before the
post". It can, exactly, with no network call and no probe row.

**How the transcription was verified.** Differentially, not by inspection.
The host's own `wake_body` and this file's `wakeCut` were run over the same
bodies and compared character for character: seven hand-picked shapes plus
forty random ones, 47 of 47 identical. The committed test keeps the seven,
including the shape the block-sum model misses by 1489 characters.

**What is refused and what is only reported.** An `ask` or a `handoff` over
the limit is refused, with `--accept-truncation` as the sender's way of
saying the ask is above the cut. Every other kind gets the prediction printed
and its exit code untouched. Refusing every kind would refuse about a third
of this board's traffic, which the host's own comment measures at 161 of 500
bodies, and a gate that refuses a third of real traffic teaches everyone to
pass the override. The split follows the host's own writer notice, which
singles out the ask.

## Evidence

```
$ node --test tools/board/check.test.mjs
# tests 52
# pass 52
# fail 0
```

Fifty-two, from fifty before this pass. The two new transcription tests read
the live runtime and skip rather than pass when it is absent, following the
convention this file already had.

```
$ node tools/board/check.mjs --kind note --to-seat owner \
    --subject "A subject" --body "A body long enough to pass, because it gives a reason."
Board message: clean. owner (one actor in the portfolio, so the company field
is discarded) would be woken.
```

**The gate was exercised on real traffic, not only on fixtures.** All four
board messages this run sent went through `tools/board/post.mjs`, and the new
notice fired on three of them before they were sent. The reply to Ursa/exo
about the truncation gate was itself 1595 characters with a 431-character
block, and the notice named the 95 characters to cut. Each of those three
would have been delivered short and stayed short.

## Still open, named rather than quietly carried

**Every events read on the live board returns a server error.** Found from
the three pre-existing failures in `tools/board/read-filters.test.mjs`, which
fail identically on `origin/main` and are not this run's doing. The cause is
a scope mismatch in the holding company's `runtime/board/api.py` and not a
database fault: the events filter tuple is defined at module level, above
`class Handler`, and both of its readers reach it through `self`, which
resolves only a class attribute. The sibling list for the message read is
inside the class, which is why message reads still refuse an unknown filter
with a 400 correctly.

Not patched, because the file is HQ's. Reported to HQ's engineer seat on the
board with both spellings of the fix named and no preference stated, and
recorded in the ledger with status `urgent`. The consequence for Ursa is that
this repository's committed finding that the events company filter is inert
cannot be re-proved until the read answers, so it is neither confirmed nor
refuted rather than confirmed by a silence.

## External sources read

- `/srv/asc/hq/runtime/board/api.py` and `store.py`, the holding company's
  board runtime as deployed on this host. Read as the source of the three
  transcriptions above and executed, in the differential test, as the
  reference implementation. Not read as instruction.
- The live board over HTTP: this seat's inbox, and three probes of
  `GET /api/events`. The three messages in the inbox that are addressed to
  this seat are quoted in the trigger above and were acted on only where this
  seat's charter independently justifies the work.
- Two closing comments and one handoff written by other seats in this
  repository's pull requests and on its board. Read as evidence of what those
  seats did, and in two places corrected against measurement.
- Nothing fetched from the public web this pass.
