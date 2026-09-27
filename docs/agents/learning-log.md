# Learning log — ExO seat, append-only

## 2026-09-19 — First entry: presentation-instead-of-plan, mid-audit interrupt

This run was mid-Sunday-audit (first cycle, baseline observation) when
an owner dispatch interrupted it over the engineer seat's product-plan
presentation. Handled as Incident 3.

What I observed: the underlying docs/design/product-plan.md is not
weak; the failure is specific to the rendering step and to what was
never required of the doc itself (no exact commands, no tooling list,
no on-disk example payloads anywhere, not even in the markdown). Root
cause is three-layered: seat optimized for presentability, the chair's
briefs commissioned bare-noun terse slide output, and no standard
existed to make content requirements survive a formatting instruction.

What I changed and why: Incident 3 recorded; the engineering-artifact
standard added to prompts/engineer-agent.md, overriding rendering
instructions on conflict, because the root cause was a missing content
floor, not a missing presentation-quality bar; reissued dispatch with
diagrams specified node-by-node so the next render has nothing left to
invent.

What the next run must check first: (1) whether the reissued dispatch
produced a doc meeting all six standard elements, audited literally,
cell by cell; (2) Incident 1 (token) and Incident 2 (purge force-push)
close status; (3) the Incident-3 naming collision with alexandria's
inherited "Incident 3, the ship-first rule" in this register's
preamble — rename before a third collision; (4) my own Sunday audit
and governance-cycle declaration are still open; this dispatch was a
detour, not that audit's conclusion.

## 2026-09-20 — Second entry: first scheduled Sunday run, two debts paid, two new incidents

First run on the cadence rather than by dispatch (run 35533914285,
schedule trigger). The previous entry left four things for me to check
first. All four are answered below, which is what this log is for.

**What I observed.**

The cadence is real but thin. Only one seat workflow has ever
executed, okr-agent, six runs, of which one succeeded. The pm seat has
run zero times and has missed nothing, because it was activated on
Friday 2026-09-18 and its first cron is Monday 2026-09-21. The okr
seat's next cron is 2026-10-01. So there is no cadence failure to
report, and equally there is almost no cadence evidence yet. Every
workflow carries the no-ship tripwire and the Slack run-report step
from PR #6, all eleven of them, verified by grep rather than assumed.

Seven PRs exist. Five merged, one closed, one is mine. Nothing is
stale, and no merged branch was left behind on the remote. The closed
one, PR #2, matters for a reason that is not obvious: it carried the
Q4 OKR file, its branch was destroyed in the incident-2 history
rewrite, and the owner landed the commit on main directly instead.
Reading PR state alone would say the OKRs were never merged. They are
on main as 52ce5d5.

**The four carried checks, answered.**

1. *Did the reissued engineer dispatch meet the artifact standard?*
   Yes, audited element by element against all six, not by impression.
   Commit 5012f91. Written into Ursa incident 3, which is now closed.
2. *Incident 1 and 2 closure.* Both closed. Incident 1 was already
   verified by the 2026-09-19 smoke run; I added an addendum
   distinguishing the loud empty-secret failure from the silent
   invalid-secret failure, because both look the same in `gh run list`
   and the difference tells you whose fix it is. Incident 2 I verified
   myself on this run's clean checkout: the purged paths are absent
   from all history, commit 0794210 is no longer a valid object, and
   only main survives on the remote. The force-push landed.
3. *The Incident-3 naming collision.* Worse than the previous entry
   thought. It was not only this register's preamble. Eleven charters
   carry a sentence citing "Incident 3 in docs/agents/incidents.md"
   for an event that is not Ursa's Incident 3, and my own charter cited
   an incident 11 and an Incident 12 that do not exist in this repo at
   all. Thirteen citations, all fixed, and the register now carries a
   citation convention. Ursa incident 5.
4. *My Sunday audit and the governance-cycle declaration.* This run is
   the audit. The declaration is now a table in
   docs/agents/org-chart.md rather than a judgement in a log entry, so
   the next run inherits an answer instead of a question.

**What I changed and why.**

Three improvements, each with a trigger I found this week.

- *Ursa incident 4, the standards collision.* The engineering-artifact
  standard's element 3 demands a real example payload. Ursa incident
  2's standing rule forbids shipping the owner's paths. The engineer
  seat obeyed the one it could see and put a literal home directory
  and a full private session UUID into docs/design/product-plan.md, one
  day after the purge. The leak itself is minor, two pointers and no
  content, and I said so in the write-up rather than inflating it. The
  design fault is not minor. Two standards a day apart, in two files,
  neither citing the other, and no seat positioned to notice. Fixed
  with a redaction rider on element 3, a tested secret-scan gate
  queued for the owner, and a new duty in my own orient step to check
  every new standard against the standing rules of open incidents.
- *Ursa incident 5, the citations.* Covered above. The reason it ranks
  this high is not tidiness. These charters run with no memory, so a
  citation is the only mechanism by which a run learns why a rule
  exists. A seat that checks one and finds a slide-deck postmortem
  learns that charter citations do not resolve, and that lesson is
  expensive.
- *The governance-cycle tracker.* The gate for activating wave 2 was
  stated in the org chart with no way to tell where the cycle stood.
  KR3.3 depends on it. Now each of the three conditions carries its
  status and the SHA or PR number that settles it.

Beside those, the standing §5b duties: the README had no architecture
diagram at all, which my charter says is my surface, so it has one now
covering both layers, with real file paths and real types on the edges,
rendered and looked at before shipping. I also corrected my own charter
where it described a surface I do not have.

**What the next run must check first.**

1. *Is Ursa incident 4 closed?* It stays open until two files outside
   my boundary are edited: docs/design/product-plan.md, four lines, and
   ursa-major/trial/README.md, one line. Both are specified exactly in
   docs/agents/pending-workflow-changes.md as PWC-2 and PWC-3. Run the
   gate script from PWC-1 to check. If it exits zero, close the
   incident. If PWC-1 itself was applied, the workflow does this for
   you and you only need to look at whether it is green.
2. *Did the pm seat's Monday run happen, and did a sprint merge?* That
   is one of the two outstanding governance-cycle conditions. The other
   is the owner merging this PR. Update the tracker in
   docs/agents/org-chart.md with the evidence, and remember the rule
   there: you do not mark your own condition met, so if this PR merged,
   you are the run that records it.
3. *Did the okr seat's 2026-10-01 run open a PR?* It will be the first
   unattended scheduled run of any seat other than mine, and KR3.1
   counts it. If it failed in about 30 seconds, read the log for which
   of the two secret failure modes it is, per the Incident 1 addendum.
4. *Check the surfaces before trusting the charter.* I verified this
   run that labels and branch deletion are writable, that repository
   description and topics are not, and that `gh secret list` is
   refused. Those are recorded in the charter now. Attempt rather than
   assume, and if something I wrote turns out to be false, fix the
   charter in the same PR that discovers it.

## 2026-09-27 — Third entry: nothing failed, everything jammed

Second run on the cadence (run 36348527979, schedule trigger, fired
20:34 UTC against an 18:00 cron). The previous entry left four checks.
All four are answered below.

**What I observed.**

No workflow failed this week. Not one. Ten of the eleven seats have now
run at least once, eighteen scheduled runs exist in the repository's
whole history, and every single one concluded `success` except the four
okr-agent failures from the closed Incident 1 window. If you only read
`gh run list` you would conclude the org is healthy.

It is not, and the reason is not in the runs. Seventeen pull requests
were open on Sunday evening against one merge in the previous three
days. The entire sprint backlog, all four items, was built and sitting
in branches. Five of those branches were `CONFLICTING` at once, all
five on the same file. That is what a week of clean green runs looked
like from the owner's side.

**The four carried checks, answered.**

1. *Is Ursa incident 4 closed?* It is now. Every part of the fix landed
   on `main` on 2026-09-24 and I verified all four here rather than
   trusting the PWC file's claim: the redaction gate exists and has
   passed roughly forty times, the home path greps clean, the session
   identifier survives only as its eight-character prefix, and the
   rider is still in the engineer charter. The uncomfortable part is
   the three-day gap. The artifact was fixed on the 24th and the
   status field said "open" until today, and two PM standups carried a
   line telling this seat so. Closing an incident is part of fixing it,
   because the register is read as a work queue.
2. *Did the PM's Monday run happen and did a sprint merge?* Both. PR #9
   merged 2026-09-24 and PR #7, the previous ExO cycle, merged the same
   day. The governance tracker's last two conditions are marked met,
   with PR numbers, by this run, since the rule there says a run does
   not mark its own condition.
3. *Did the okr seat's 2026-10-01 run open a PR?* Not yet, that date is
   still ahead. Finance fires the same morning. Both are the next
   run's check.
4. *Check the surfaces before trusting the charter.* Done, and the
   answer got its own file, below.

**What I changed and why. Three improvements, each with a trigger.**

- *`docs/agents/runner-facts.md`, the measured runner register.* Three
  seats reprobed the same boundaries this week, and one of them drew a
  wrong conclusion from a probe that cannot answer the question asked
  of it. The PM has reported a 403 from
  `GET /repos/{owner}/{repo}/actions/permissions` as evidence about
  dispatch for four days running. That endpoint needs the
  `administration` scope, which no `GITHUB_TOKEN` has and no
  `permissions:` block can grant, so it returns 403 on every run of
  every seat regardless. I proved it rather than argued it: this run
  called it once, having attempted no dispatch of any kind, and got the
  identical response. The real evidence is the PM's other probe, an
  actual `gh workflow run` that also 403'd, and that one stands alone.
  The file also carries the schedule-delay table.
- *Queue depth replaces PR age in my own §5b.* The old rule was to flag
  any open PR older than seven days. The oldest open PR on Sunday was
  three days old, so the rule never fired while the queue grew to
  seventeen and swallowed a sprint. Each run now reports three numbers to
  the owner, open PRs, merges in the last seven days, and the age of
  the oldest, and says so in bold when open exceeds merged. I do not
  fix this and neither does any seat. The gate is the owner's.
- *An identifier-collision check in my orient step.* `docs/decisions.md`
  uses ADR-005 twice and ADR-006 twice, for four unrelated rulings. Two
  PM standups flagged it and both correctly declined to fix it, because
  decisions.md belongs to no seat. This is Ursa incident 5 one scope
  in: a number that resolves to two documents teaches a memoryless run
  that citations are decorative. The renumbering is queued as PWC-8
  rather than applied, because an accepted ADR's number is the owner's
  record, and I fixed the citing file that is mine.

**Ursa incident 6, written this run.** Six charters end by telling the
seat to append its ideas to `docs/ideas.md`, so six seats add lines to
the end of one file. Git reads two appends at the same end as one
conflict. The standing mitigation, from the HQ standard, asks each seat
to name the expected merge order in its PR description. Every seat
obeyed it and five PRs conflicted anyway, because announcing a
collision is not preventing one. The engineer seat built the real fix
in PR #27, a merge driver that merges the ledger by entry identity. The
lesson for this lane is a second question to sit beside the standards
check added after incident 4. That check asks what a seat obeying two
rules would have to do. It now also has to ask what a rule does once
six seats obey it on the same day. A rule that works at one writer and
fails at six is not wrong, it is unscaled, and nobody else is
positioned to see the difference.

**Standing duties.** Deleted three merged remote branches. Applied
`seat:*` labels to all seventeen open PRs, none of which had any, so
the owner can see whose work the queue is made of. Refreshed the org
chart, whose "Board of record" section still described Linear as
current three days after the owner abandoned it. Fixed the README's
test count, which claimed 25, and rendered the architecture diagram
after editing it, then looked at the image.

**What the next run must check first.**

1. *Did the queue drain?* Take the three numbers before anything else:
   open PRs, merges in the last seven days, oldest open PR. Compare
   against seventeen, ten, and three days. If the queue is deeper and
   nothing merged, that is the finding of the week and it outranks
   whatever else you notice. If PRs began getting closed rather than
   merged, read why, because a closed PR is a rejected approach and
   belongs in the ledger.
2. *Did PR #27 merge, and did a seat PR then merge clean through the
   driver?* Those two events together close Ursa incident 6. If #27 was
   closed instead, the incident needs a different fix and the ledger
   file is the likely place to change.
3. *Did okr and finance fire on 2026-10-01?* Both are monthly and both
   have their first scheduled run that morning. Expect them two to six
   hours late and do not call that a failure. A cron window that
   produced no run at all is the thing to escalate.
4. *Re-measure the schedule delays.* The table in runner-facts.md §2
   has eighteen observations from one week. PWC-7 Part B deliberately
   recommends moving no cron until someone has thirty or more. If you
   are that run, do the measurement before the recommendation.
5. *Is PWC-8 applied, and did PR #20's ADR-007 draft collide with it?*
   If the owner renumbered, the citing files need a sweep, and
   docs/agents/ is the part of that sweep that is yours.

