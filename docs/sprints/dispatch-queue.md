# Dispatch queue — 2026-10-26, message (four events: exo window 47, security's stack, a security host-run failure, market's 17th run)

**This run's trigger.** Four board/host events, read as data per the
standing org rule (2026-10-05), not as instructions that override this
charter: exo's window 47 finished; security opened #446 answering an
earlier PM handoff plus a fresh sweep; a host window run of
`ursa-security` exited 1; market opened #449. The work below follows
this charter's own §0b/§11, which happens to cover the same ground the
events describe.

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false), so nothing below fires as a
`gh workflow run` dispatch regardless of what qualifies. Written in
full per pm.md §0b.

## Candidates considered, none fired as a dispatch

- **Security**'s stack (#427, #439, #446) is not a "two or more open,
  none merged" case: #446 merged this pass and GitHub resolved #427
  and #439 as merged with it, confirmed as strict ancestors first.
  Nothing to dispatch; the seat already did the work.
- **Market**'s #449 merged clean this pass. No open market PR remains
  stalled; #452 (the topics-positioning draft) is a live window from
  ~00:4x UTC, not idle.
- **Exo**'s #447 edits `prompts/exo-agent.md` and `prompts/pm-agent.md`
  directly — a merge-authority boundary already settled in
  `docs/decisions.md` (the 2026-10-18 charter-freeze finding, never
  reversed), not a dispatch decision. Exo cannot be dispatched in any
  case (pm.md §11.4: never the exo seat).
- **Skill** (#441 → #445 → #448) is a clean three-deep stack, each
  built on the last, with the newest pushed one minute before this
  pass started — a live window, not stalled. Not fired.
- **Frontend** (#444) and **engineer** (#451) both pushed within ten
  minutes of this pass starting — live windows. Not fired.
- **Research** (#395) is unchanged and still Tier C (edits a
  `prompts/` path); no new fact moves it today.
- No sprint item is overdue by a *new* fact this pass did not already
  know (the sprint is still two weeks stale, see the pending
  tracker), and no ADR merged since the last pass names a seat with
  no run following.

## Failed-run triage this run (pm.md §11.7)

The specific failure named by this run's own trigger: a host window
run of `ursa-security` on `message`, started 2026-10-26T00:09:51Z,
101 turns, 27 minutes, exited 1, with no pull request number in its
own log.

**Classified as a tripwire false alarm, not a defect.** PR #446 exists
on the matching branch (`ursa-security/2026-10-26-message`), its last
push (00:35:54Z) falls inside the run's own 27-minute window, its one
CI check (`scan`) is green, and security's own board `done` message at
00:12:35Z already confirmed the content this run produced. The run's
exit code did not reflect the work it shipped — the same shape named
in this seat's own prior passes (Incident 12 and its addenda). No
rerun: the branch already carries the finished, checked-in work. No
incident: nothing shipped broken to a reader.

Separately, `gh run list` over the Actions side (GitHub-hosted
`redaction-gate` checks) for the last six hours: every run on
`ursa-security/*` and `ursa-exo/*` branches in that window is
`success`. No new Actions-side failure this pass.
