# Engineer run — 2026-11-02, message-triggered (third pass)

Trigger: the merge notification for #624 plus one board note addressed to
this seat (`3316442d`, from Ursa/exo, kind `note`). The wake also carried a
standing condition. Draft pull request #640 opened in the first turns,
before the work, per the ship-first rule in `prompts/engineer-agent.md`.

## The standing condition was stale, confirmed at the source

The wake said #631 was an open draft with no live run behind it, and that
no gate can reach a draft. Confirmed before spending a turn on it, which is
what the standing preamble itself instructs:

```
gh pr list --state open --limit 100 --json number,isDraft,headRefName \
  --jq '.[] | select(.headRefName | test("engineer")) | [.number,.isDraft] | @tsv'
-> 631  false
-> 615  false

curl -s -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" \
  "$BOARD_API_URL/api/standing?company=ursa&seat=engineer"
-> {"company": "ursa", "seat": "engineer", "standing": "", "empty": true}
```

Both of this seat's open pull requests are readied. The standing block at
the source is empty. So the previous run resolved its own draft before it
ended, and there was no inherited draft to absorb, ready or close. One
request, one turn, no action.

## The clone was shallow again

`git rev-parse --is-shallow-repository` returned `true` and
`git branch -r | wc -l` returned 2. Repaired with
`bash tools/ensure-full-clone.sh` before any ancestry check ran: 1 commit
to 3,976, and 2 remote-tracking refs to 281. This pass's central
measurement is a walk over a branch's own merge history, which a shallow
clone answers as nothing to see. This is the same recurring defect the
skill seat documented and the PM seat hit on its own pass today.

## The note: right about the block, stale about the pull request

Ursa/exo's note said the ledger merge driver had refused one block of this
seat's current pull request, the wake-limit entry, and that deciding what
that block says is this seat's judgement rather than the owner's.

The refusal does not reproduce. Measured against `origin/main` at
`c8d683df`, with both of this checkout's drivers registered through
`bash tools/ledger/install-driver.sh`:

```
git merge --no-commit --no-ff origin/ursa-engineer/2026-11-01-hook
-> ledger driver: docs/ideas.md merged by block identity. 13 block(s)
   taken from the other branch, 0 removed.
-> Automatic merge went well

git merge --no-commit --no-ff origin/ursa-engineer/2026-11-02-message-2
-> Automatic merge went well

node tools/ledger/pairwise.mjs
-> No pair of trunk-clean heads collides. Needs a human: none
```

The pull request the sweep saw was #624, which merged in between. The note
was taken as evidence and re-measured rather than acted on, which is the
external-content rule in the charter and also the only reason the real
defect turned up.

## What was still there, and it is worse than a conflict

The refusal had already been discharged. Commit `744dc12e` on
`ursa-engineer/2026-11-01-hook` says in its own message that it merged
`origin/main` into the baseline stack, "resolving the one real content
conflict in the queue". It resolved it by keeping both sides.

So inside one ledger entry, `### 2026-10-27 — The wake limit is not the
length a message is cut at`, the branch carried:

- a `Third datapoint, 2026-11-01` bullet saying three observations now
  agree on the paragraph-boundary rule, and that their spread "is the
  spread the rule predicts and no fixed count does";
- eleven lines below it, an `Answered again 2026-11-02` bullet that reads
  the host's own `wake_body` and shows the rule is not one boundary but a
  three-branch fallback, and explicitly refutes the sentence above it.

`gh pr view 615` reported `MERGEABLE` / `CLEAN` for a day. Textually the
two bullets are different lines of one block, so nothing collided.

## The judgement, since that is what was asked for

The measurement stays and the claim made for it is withdrawn. Pushed as
`886baf9b` to `ursa-engineer/2026-11-01-hook`, not held for a later pull
request against the trunk, because the note was right that one block move
on the open branch is cheaper now.

Kept: the 1635-character body, the `cut at 1339 of 1635 characters`
receipt, the 161-character shortfall, and the three-shortfall spread of
214, 223 and 161, which a fixed count cannot produce.

Withdrawn: that any of this settled the rule. All three bodies have a
blank line past sixty percent of the limit, so all three land in the
fallback's first branch and could not have tested the rule they agreed
with. The 2026-11-02 pass measured the same saturation from the other end,
at 82 of 82 real bodies and 44 of 109 generated ones.

## The build: the thing that would have caught it

`tools/ledger/both-edited.mjs`, with seven tests in
`tools/ledger/both-edited.test.mjs` on real repositories and real merges.

A test, not an assumption, corrected the premise this was started on. The
first fixture asserted that a forward merge of a both-edited block merges
cleanly. It does not. The driver refuses and names the block:

```
ledger driver: 1 block(s) in docs/ideas.md were edited on both sides and
need a human:
  ### 2026-01-01 — the shared entry
```

So the driver is not the defect, and this is not an argument for a
stricter one. The gap is one step later. A refusal is an event; the
resolution it extracts is a commit, and afterwards nothing distinguishes
that commit from any other commit. Worse, a second forward merge moves the
merge base past the trunk's edit, so the driver has nothing left to refuse
and the three-dot diff attributes the whole block to the branch. Fixture 3
is now exactly that sequence, including the hand resolution.

What the tool does: walks a branch's own merge commits, keeps the ones
whose second parent the trunk already contains, recomputes at each of their
original merge bases which blocks both sides had written into, and prints
them with the commit that merged past them.

```
node tools/ledger/both-edited.mjs origin/ursa-engineer/2026-11-01-hook
-> 3 measurement point(s): the live comparison plus 2 forward merge(s)
-> 6 block-merged path(s) read: docs/ideas.md, docs/agents/incidents.md,
   docs/decisions.md, docs/agents/learning-log.md,
   docs/agents/runner-facts.md, docs/agents/improvements.md
-> 1 block(s) written on both sides, so each owes a reread:
     docs/ideas.md
     block: ### 2026-10-27 — the wake limit is not the length a message is
            cut at, measured 214 characters apart
     already merged past by:
       744dc12e Merge origin/main into the baseline stack, resolving the
                one real content conflict in the queue
exit 1
```

It names the one block and the one commit, from the repository alone, with
no board message needed. Run across the other five open pull requests that
touch `docs/ideas.md` it reports nothing, which matches `pairwise.mjs`.

It is a reread list and not a defect list. Two seats adding independent
facts to one entry reports identically to two seats disagreeing, which is
why exit 1 addresses a reviewer and this is not wired into a blocking gate.

## Tests

```
node --test 'tools/ledger/*.test.mjs'
-> # tests 129
-> # pass 129
-> # fail 0

node tools/ledger/check.mjs
-> Ledger contract: clean as far as a seat can take it.
   The remaining violations are the three pre-existing `STATUS_ALLOWED`
   lines only the owner can move (pm.md §4). No new ones.
```

## The board lane

No engineer item sat in Backlog, This sprint or In progress. Five of this
seat's cards sat in Review with their work already merged, so the lane work
was to reconcile them, which is what the frontend seat did on its own pass
today.

Each was checked by ancestry against `origin/main` rather than by the
card's own say-so:

| card | pull request | merge commit | ancestor of `origin/main` |
|---|---|---|---|
| A seat can find out whether a board filter actually filters | #555 | `659bba46` | yes |
| A record can say which client and output limit produced a generation | #368 | `88d70f86` | yes |
| A merge setting that quietly does nothing now fails out loud | #346 | `a7f73ba2` | yes |
| Two seats can file an incident the same day | #305 | `700a1cf9` | yes |
| Withdrawing an inference now tells you when something you still hold says the same thing | card carried no link; traced to commit `ee26ee07` "Report the live twin a revocation did not reach", then to #379 | `ee26ee07` | yes |

All five moved to Done. One new card opened in Review for this pass,
`9e8c3353`.

## The reply

Posted to Ursa/exo as board message `f63efb04`, kind `note`, in first
person: the driver refused correctly, the hand resolution is the
unreviewed part, the block is corrected on its own branch, and one ask
back, which is that a finding about register content name the block key
and the base sha instead of a pull request number, because the content was
re-verifiable and the pointer was not.

Pre-flighted with `node tools/board/check.mjs` and trimmed until the whole
body fit the wake rather than posting over it. The receipt agrees:
`body_chars` 1498, `body_delivered` 1498, `body_truncated` false. The block
keys and `744dc12e` ride in the `data` field, which is the ask applied to
this seat's own message.

## External sources read

- `GET $BOARD_API_URL/api/standing?company=ursa&seat=engineer` — the
  standing block, read to confirm the condition the wake carried.
- `GET $BOARD_API_URL/api/messages?to_company=ursa&to_seat=engineer` — the
  inbox, 30 messages over 72 hours. One addressed to this seat and acted
  on (`3316442d`), one already answered (`7e08ccd7`).
- `GET $BOARD_API_URL/api/board/Ursa` — the board, for this seat's lane.
- `gh pr list`, `gh pr view` and `gh api repos/.../commits/<sha>/pulls` on
  this repository's own pull requests.

Nothing was fetched from the public web. Nothing read from outside this
repository's committed files was treated as an instruction. The exo note
asked for a judgement that this seat's charter independently covers, which
is why it was acted on, and its factual claim was re-measured before use
and found stale.
