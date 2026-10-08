# Pending owner-applied changes

The ExO seat designs `.github/workflows/`. Whether it can also write it
depends on where the run is happening, which was not understood until
2026-09-30: on GitHub Actions the `GITHUB_TOKEN` is refused on that path
and no `permissions:` setting changes it, and on the resident company
host the push works. Both are measured, with their probes, in
docs/agents/runner-facts.md §1b.

So an entry here means one of two different things, and **every entry
must say which**: queued because the run could not apply it, or queued
because the run's dispatch told it not to. Each entry carries the
evidence, the exact file, and the exact content. Delete an entry once it
is applied.

The file's name says workflows and its contents are broader, which is
how it has actually been used since PWC-4, the repository description.
Read it as the queue of changes this seat designed and cannot apply,
whatever the surface. The name stays because other files link to it.

Verify the boundary by attempting it rather than trusting this file. If
a future run finds the path writable, apply the change directly and fix
prompts/exo-agent.md §5 instead of queueing here. What is known to be
writable and what is known to be refused, with the probe for each, is
in docs/agents/runner-facts.md §1.

---

All four of the original entries (PWC-1 redaction gate, PWC-2
product-plan redaction, PWC-3 trial README redaction, PWC-4 repo
description and topics) were applied by the chair on the owner's
directive, 2026-09-24. Entries deleted per this file's own rule.

PWC-5 (pin actions to SHAs) and PWC-6 (drop the unread PROJECTS_TOKEN
from all eleven workflows) were queued by the security seat on
2026-09-27 and live in PR #28, still open. They are not restated here,
to avoid two copies of one instruction drifting apart.

---

## The identifiers are seat-scoped, and the queue is per seat (2026-10-04)

A single shared file with one global counter does not survive several
seats queueing at once, and it stopped surviving this week. Measured on
2026-10-04, three seats held three unmerged pull requests that all
append to this one file:

- The ExO seat's #46 carries PWC-7 through PWC-10.
- The engineer seat's #74 carries a **second, different PWC-7**, the
  dependency-floor gate.
- The security seat's #28 carries PWC-5 and PWC-6.

The engineer seat chose 7 deliberately, reasoning in its own pull request
that taking 7 rather than 5 meant the PRs would not have to merge in a
particular order. That reasoning was sound and it still collided, because
the ExO seat's 7 existed only inside an unmerged branch and no seat can
read another seat's unmerged branch by default. This is the same failure
as Ursa incident 5 (an identifier unique in one place travelling into
another) and the same mechanism as Ursa incident 6 (several seats
appending to one file's end). See Ursa incident 9.

**The convention, from 2026-10-04.**

1. Identifiers are `PWC-<SEAT>-<N>`, where `<SEAT>` is the seat's own
   short name and `<N>` is numbered by that seat alone, starting at 1.
   No seat ever has to guess what another seat's open branch took.
2. Each seat's entries live in its own file,
   `docs/agents/pending-workflow-changes-<seat>.md`. Two seats queueing
   on the same day no longer touch the same file at all.
3. This file is the index and the contract. It changes rarely, so it is
   not a collision surface either.
4. Historical numbers are never reused and never renumbered across
   seats. PWC-1 through PWC-6 keep their meanings, below.

**The queues.**

| Seat | File | Entries |
|---|---|---|
| exo | `pending-workflow-changes-exo.md` | PWC-EXO-1 to PWC-EXO-6 |
| engineer | `pending-workflow-changes-engineer.md` | PWC-ENG-1, PWC-ENG-2 |
| security | `pending-workflow-changes-security.md` | queued in PR #28 as PWC-5 and PWC-6, not yet merged |

The security row describes a branch and not a file on `main`. The
engineer's file now exists, created by the ExO seat on 2026-10-05 with
the engineer's own entry moved into it byte-for-byte and renumbered
PWC-ENG-1. That is the promise in the paragraph this replaces, kept
early rather than late: the landing plan showed that resolving the
engineer stack's conflict with this file the obvious way deletes the
engineer's entry, so the entry was moved to safety before the merge
instead of after it. The resolution is written out in
docs/agents/merge-order.md §4b.

**What an entry must still say.** Which of the two reasons put it here,
queued because the run could not apply it or queued because the run's
dispatch forbade it. Plus the evidence, the exact file, and the exact
content. Delete an entry once it is applied.

---

## Applied and retired identifiers

All four of the original entries (PWC-1 redaction gate, PWC-2
product-plan redaction, PWC-3 trial README redaction, PWC-4 repo
description and topics) were applied by the chair on the owner's
directive, 2026-09-24. Entries deleted per this file's own rule.

PWC-5 (pin actions to SHAs) and PWC-6 (drop the unread PROJECTS_TOKEN
from all eleven workflows) were queued by the security seat on
2026-09-27 and live in PR #28, still open. They are not restated here,
to avoid two copies of one instruction drifting apart.
