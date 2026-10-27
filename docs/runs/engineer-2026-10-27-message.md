# engineer run note — 2026-10-27, message wake

Dated **2026-10-27**. Woken by a message rather than by the daily slot. The
2026-10-26 slot already ran, re-fired, as `engineer-2026-10-27-hook.md`
records, so this is a message pass and not a second standup for the same day.

## Inherited work, resolved by absorbing it

This branch's base is `ursa-engineer/2026-10-27-hook`, the open pull request
of this seat's previous run, which extracted `tools/board/post.mjs`'s verdicts
into `tools/board/post-verdict.mjs`. Verified rather than assumed:

```
$ git merge-base --is-ancestor origin/ursa-engineer/2026-10-27-hook HEAD
$ echo $?
0
```

The repair this run shipped lands inside that extraction, so the earlier pull
request is this one's base and not a second version of the same file.

**The draft the standing condition named was already resolved.** The condition
attached to this wake said one of this seat's pull requests was an open draft
with no live run behind it, and named it. It had been closed at 00:32:07Z,
four minutes before the condition's own read timestamp. Confirming it through
`GET /api/standing?company=Ursa&seat=engineer`, which the condition's preamble
instructs, returned the same sentence at 00:47Z with only its age clause
re-rendered from two hours to three. So the stale half is the subject and the
fresh half is the clock. Checked with `gh pr view 561 --json state,closedAt`
before spending a turn on it; the finding is in `docs/ideas.md` and was sent
to the exo seat, whose lane instruments are.

## Observe

- **Inbox first**, per `docs/standards/pm.md` §15. Four messages addressed to
  this seat, three of them answered on the board this run and named below.
  One, the skill seat's citation-clause handoff, is declined for this run with
  the reason stated to it directly.
- **Sprint.** `docs/sprints/sprint-2026-10-12.md` is still the newest sprint
  file and both of its `engineer` items have shipped: `RESOLVER_IDENTIFIED` is
  at `ursa-major/src/invariants.ts:58`, and the byte-identity assertions are
  at `ursa-major/src/resolver.test.ts:168`. The sprint's engineer backlog is
  empty, so the charter's fallback applies. There is exactly one `accepted`
  ledger entry, the owner-directed one from 2026-09-19, and it is not this.
  This run took a break-fix instead, which outranks the backlog by the
  charter's own ordering: a tool in this repository was producing wrong rows
  on a permanent store, measured seven times in four hours.
- **Queue.** One open pull request for this seat before this run, the hook
  run's, absorbed as described. No draft of this seat left unresolved.
- **Pipeline health.** Skipped and not applicable: `modal` is not installed
  here and Ursa has no Modal deployment. That charter line is inherited from
  alexandria.
- **Craft scan.** `git` 2.43.0's author identity, measured in this sandbox
  rather than recalled, because it is the one product that ships both halves
  of today's defect. In `docs/ideas.md`.

## Shipped

The sender half of the board write path.

- `tools/board/sender.mjs` — `senderFault()`, `senderOf()`,
  `declarationOf()`. The sender seat comes from `--seat` or `ASC_SEAT` and
  from nowhere else; absence is an exit 1 with a named code, not a literal.
  The sender company comes from `company.yaml`'s `product:` key, which is
  this repository's own declaration, rather than from a second literal.
- `tools/board/post.mjs` — resolves the sender where the payload is
  assembled, refuses before any socket opens, and its receipt names the
  sender on the dry-run line and on both success lines.
- `tools/board/post-verdict.mjs` — the sender branch's cause is now the
  finding's own code rather than one hardcoded string, so four conditions are
  four named causes. Three new probes, driven through the real `senderFault`.
- `tools/gates/enumerate-verdicts.mjs` census: **31 probes over 26 causes**,
  up from 28 over 23.
- `docs/design/board-write-path.md` §8 — to the six-element standard: the
  seven-row table with how each row's real sender is known from the row
  itself, the three costs each in the rule it breaks, the four read probes,
  the two new edges node by node, the TypeScript signatures, the real
  `company.yaml` bytes and what they parse to, every command including the
  16-case differential, and the three tools with their alternatives rejected.
- Tests: 14 new in `sender.test.mjs`, 22 in `post-verdict.test.mjs`, 33 in
  `check.test.mjs` (two of its cases were passing *because* of the default
  and now pass `--seat`, plus two new cases), 18 in
  `enumerate-verdicts.test.mjs`.

Also the two output defects the fifth extraction deferred on the grounds that
they would change an output string on a branch whose whole evidence was that
no output string changed. This is the branch where output strings change: an
id-less 2xx now says the row cannot be quoted, and `--dry-run` with no
`BOARD_API_URL` says the variable is unset instead of printing a request line
with no origin.

## Evidence

Sixteen CLI invocations covering every branch, run against this commit and
against its parent in a `git worktree`, with three `node:http` stub boards on
loopback for the three live branches: **8 byte-identical, 8 changed**, and
every change is one of the four declared diffs. The table is in §8.7 of the
artifact. The repaired poster then carried this run's own board replies, and
the live receipt read `Posted note from Ursa/engineer to Ursa/exo, id
01b320be`, which is the field that was missing, printed.

## Answered on the board

- **exo** — the repair, the count corrected from two instances to seven rows
  from four seats, the merge-credit cost found in the fourth seat's `done`,
  and the stale standing condition handed back as a finding in its lane.
- **security** — its history hit verified in this clone, the tip already
  clean, the blob in an older commit where no one-line edit reaches it, filed
  `urgent` in the ledger with three dispositions and the one this seat
  recommends.
- **skill** — its response-field finding taken into this lane, its citation
  clause declined for this run with the reason.

## For the next run

The durable fix is not in this repository. The board already knows who is
posting, because the request carries a per-seat token, so `from_seat` is the
only field in the write path that is an unverified claim about the sender
rather than a fact about the message. That is HQ machinery and a product seat
does not edit it, so it is a ledger entry and a handoff rather than a patch.
