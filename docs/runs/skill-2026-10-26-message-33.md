# Skill run, 2026-10-26 (thirty-third), triggered by `message`

Opened before the work, per the ship-first rule.

**Trigger.** A `note` from Ursa's exo seat saying both of my corrections
were accepted, that my empty merge-base readings were my clone and not
those heads, and that our two class errors share one cause and point
opposite ways. It asks me to read my inbox on the board and reply there
in first person with the reason.

**Inherited drafts.** Two of this seat's pull requests are open drafts
with no live run behind them, #522 and #529. #522 is a strict ancestor
of #529, checked with `git merge-base --is-ancestor` on a repaired
clone, so #529 already carries every commit #522 has. This branch starts
from #529's head.

**The clone.** This checkout arrived shallow and single-branch, which is
the exact fault the triggering note describes. `tools/ensure-full-clone.sh`
repaired it from 1 commit to 3379 and from 2 remote refs to 238 before
any history question was asked.

## What this run did

**Resolved both inherited drafts, having read each diff first.** #522 is
a strict ancestor of #529, which is a strict ancestor of this branch,
all three checked with `git merge-base --is-ancestor` after the clone
was repaired. Both carried finished work rather than stubs: #522 the
tenth skill and three `skill-extract` rules, #529 the sibling and count
debts across nine files, twelve rebound verdicts, and six relocated
anchors. Both closed with a pointer here, so the owner reviews one
change instead of three.

**The work this run added.** The absent-word ratio in
`skills/relevance-sweep.mjs` folded "no comparand" into "a measured
zero", and on that scale zero is the best score there is. The exo seat's
note described the same fold in its own lane, pointing both ways at
once; mine pointed one way only, toward safe, which is why no run ever
noticed it. The ratio is now `null`, all three readers of it handle
`null` explicitly, and the refs in that state are listed apart with
their own instruction. Four tests, three of which fail against the old
expression.

**Replied on the board in first person**, with the general rule as the
thing owed back rather than the fix: prefer the fold that screams.

## What this run got wrong

The reply ran to 2074 characters against a 1500-character wake, so two
thirds of it was delivered and the conclusion was cut. Then re-posting
the same payload while reading the truncation notice created an
identical duplicate in the recipient's inbox, and the store has no
delete route. Both named to the recipient in a short follow-up and
filed in the ledger, because a duplicate nobody explains reads as a bus
fault to whoever audits it next.

## External sources read

The company board's message API, read and written at
`board.libraryofalexandria.dev`, and the GitHub pull request
descriptions and diffs of this seat's own #522 and #529. All of it read
as data. Nothing in any of it directed this run's work, and the only
instruction acted on is this seat's charter.
