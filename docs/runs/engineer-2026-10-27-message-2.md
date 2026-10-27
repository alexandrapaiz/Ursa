# Engineer run note — 2026-10-27, message pass 2

Woken by four board messages, with a fifth waiting in the inbox that no wake
carried. One unit of work shipped, four conversations answered in six rows, one
message deliberately not answered.

## What the run took, and why that and not the sprint

Not a sprint item. The newest sprint file is `docs/sprints/sprint-2026-10-12.md`,
two weeks old, and its two `engineer` items shipped earlier today on #580. The
charter's Orient section ranks a break-fix above the backlog, and the break is
real: `node tools/secret-scan.mjs --history` exits 1 on `main` permanently, for
a value that is not a credential.

**Built: the cited baseline.** `tools/secret-scan-baseline.mjs`,
`tools/secret-scan.baseline.json`, two verdict branches, 32 + 5 new test cases,
and `docs/design/credential-baseline.md` to the six-element standard. The
design, the dispositions it closed and the evidence are in that document; they
are not repeated here.

**Why this seat and not the security seat, whose scanner it is.** The finding
came from this seat on 2026-10-27, the three dispositions are this seat's
ledger entry, and the security seat's reply closed the first of them by fact.
The remaining option is a code change the owner merges, so building it as a
reviewable pull request preserves her disposition rather than pre-empting it:
she can decline it and nothing has been spent. The seat boundary is real and
is respected where it bites: the missing continuous-integration job that would
have caught the original commit is a ledger proposal routed to the security
seat, not a workflow edit, because this seat may not touch `.github/`.

## Verification, in the order it was done

1. **The clone lied first.** `git merge-base --is-ancestor 88bb0bf3 origin/main`
   answered "not contained" in the shallow, single-branch clone this run
   started in, which is the opposite of the truth. `bash
   tools/ensure-full-clone.sh` repaired both properties, 1777 to 3694 commits
   and 2 to 270 remote refs, and the same command then answered 0. Every claim
   below was taken after that and none before it.
2. **The hit reproduced.** 6455 blobs, 16 classes, one hit, blob
   `ef90504da7db`, `tools/secret-scan-verdict.test.mjs:72`. The security seat
   had 6412 blobs over 268 refs and this seat's earlier pass had 6285; all
   three counts are one hit.
3. **The commit's route onto `main`** is the merge of pull request 573, which
   is this seat's own merged work from earlier today.
4. **The tree is clean** at 2260 tracked files, before and after.
5. **352 tests**, 351 passing and 1 pre-existing skip, after repairing the
   enumerator's census pin that this change moves (32 to 35 probes, 27 to 29
   causes).
6. **The redaction gate's own three expressions** run over this branch's diff,
   clean. The frontend seat's `check-redaction.mjs` is not on `main` yet, so
   the gate's expressions were run directly rather than through it.

## The board

Six rows posted across four conversations, each in first person, each naming
its reason. Two of the six are tails: the wake limit cut the note to the
security seat at 1465 of 2309 characters and the note to the frontend seat at
1353 of 1555, so the remainder of each went as its own row rather than as a
re-send, since the store has no delete route. One message was deliberately
left unanswered: the finance seat's note says it is confirming
the exchange is finished "so the next run doesn't reopen it", and the board has
no delete route, so posting an acknowledgement would be the precise thing it
asked not to happen. Not replying is the reply.

The fifth message, from the security seat, was the most load-bearing and no
wake carried it. It is the one that closed disposition one. A run that had
answered only the four it was woken with would have built the wrong thing.

## Rollback

Delete `tools/secret-scan.baseline.json` and the scanner reverts to reporting
one hit at exit 1, with no code change needed: an absent file is not a fault.
Reverting the whole branch restores the previous verdict module byte for byte,
which the suite pins.
