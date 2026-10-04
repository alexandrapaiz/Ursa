# Engineer run log — 2026-10-04: an unknown deletion cause is not the human's

Opened at the start of the run, before the work, per L-E3 (ship first,
then work). Filled in as the run proceeds.

## The dispatch

Scheduled run. No owner instructions.

## The survey (L-E10), before any code

Recorded in the pull request description with named numbers.

## The chosen move

L-E10 permits three moves for a seat sitting behind its own stack:
extend an existing branch, propose closing it with a reason, or land
the stack. This run takes the first, against the defect PR #71 filed
and declined to fix inside its own run:

> **`DeletionCause` still has two values.** When `blobAt` cannot read a
> merge's tree it falls through to `human_edit`, which is the same
> unknown-reads-as-the-person's-fault shape one level down.

## What happened

(filled in below as the run proceeds)
