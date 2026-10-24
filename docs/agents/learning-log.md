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

## 2026-09-30 — Fourth entry: the boundary that was never true, and the rule in the wrong half of the charter

First run on the resident company host rather than in GitHub Actions
(`GITHUB_ACTIONS` unset, `GITHUB_RUN_ID` unset, `gh auth status`
reporting a `github_pat_` credential). Owner window, synchronous mode,
open until 07:47 UTC. That difference in host turned out to be the run's
largest finding, which is why it is the first thing written here.

**Read this first if you are the next run.** Two things about your own
situation that the charter got wrong for ten days, and that this entry
exists to hand you:

1. **Find out which host you are on before you plan anything.**
   `if [ "${GITHUB_ACTIONS:-}" = "true" ]; then echo actions; else echo
   host; fi`. On the host you can push `.github/workflows/`. The
   charter said you cannot, full stop, with no mention of a host. See
   docs/agents/runner-facts.md §1b for both measurements and their
   probes.
2. **Your clone may be shallow.** This one arrived at depth 1
   (`.git/shallow` present, `git rev-list --count HEAD` returned 2).
   Every piece of history archaeology in this seat's method fails
   silently on a shallow clone, including the `git log --all -- <path>`
   and `git cat-file -t 0794210` checks that closed Ursa incident 2. A
   shallow clone would have reported that purge as verified while
   looking at nothing. `git fetch --unshallow` took a few seconds; run
   it before you trust any history claim.

**What I observed.**

*The queue, which is still the finding, and worse.* Thirty-seven PRs
open against nine merges in the last seven days and three in the last
three. **Open exceeds merged by four to one.** Oldest open is 5.5 days
(#13), so nothing has tripped the seven-day stale rule while the backlog
grew by twenty. Ten of the thirty-seven are this window's own seat runs,
so the standing backlog is twenty-seven. Five are `CONFLICTING` (#13,
#16, #18, #21, #52), which is the queue rotting rather than merely
waiting.

The sharper version of the number, which the previous entry did not
have: **fifteen PRs have merged in this repository's entire history and
not one of them is from a builder seat.** Every merge is governance or
chair work: activation, OKR, PM standups and sprints, ExO cycles and
lessons syncs. Twenty-one engineer, frontend, research, security, market
and skill PRs are open and zero have ever landed. That is the owner's
gate and this run did not touch it. It is recorded because it changes
what the other numbers mean: the seats are not slow, and the runs are
not failing.

*Failures.* Four, all in the last 24 hours, one cause, already fixed
before the PM reported it. Written up as Ursa incident 8, diagnosed
rather than guessed: commit `ce30b5a` shipped unresolved conflict
markers in four seat workflow files, GitHub rejected all four as invalid
and produced the zero-job zero-second signature, and the chair fixed it
thirty-five seconds later in `826e57d`. Reproduced on a `git archive` of
that tree: the four files fail `yaml.safe_load` and carry three marker
lines each, and the other seven parse clean with none.

*The two-file sweep, run for the first time.* Ursa incident 7. Eleven of
eleven charters carry `gh pr create --draft` and ship-first; zero of
eleven workflow prompt blocks mention either. This is the mechanism
behind a sentence that has been sitting in my own charter §2 the whole
time, saying draft-PR-first "sat unapplied through sixteen PRs while the
owner carried it by hand" and "Ursa has its own version already." It was
describing this repository and no run had the instrument to see it.

**The standards check, which found a rule that inverted without anyone
editing it.**

Fifteen new rules landed in the vendored register since my last merged
run (L-A19 through L-A25, L-E7 through L-E10, L-P6, L-P7, L-X11, L-X12).
Read beside the standing rules of the open incidents, one interaction
matters and it is not with an incident. It is inside
docs/standards/pm.md itself.

§11.3 row 3 fires a dispatch when "a sprint item is due this week and
its owning seat has not run this sprint." §11.4 says "never dispatch a
seat whose last PR is still open, unless the instruction tells it to
build on that branch in those words." Both are correct. Both were
written when an open PR was a transient state.

An open PR is no longer transient here, because no builder PR has ever
merged. Every seat now permanently holds at least one. So §11.4 has
stopped throttling anything and has started voiding §11.3 row 3
entirely: the escape hatch it names only covers building on the *same*
branch, and a sprint item on a different subject has no route. The PM's
standup of 2026-09-30 reached exactly that conclusion and dispatched
nobody, correctly reading the rule as written. Meanwhile the crons fire
regardless of the PM's decision, so the queue grows at the same rate
while the one seat that could steer it has been silenced by a rule
designed to slow it down.

This is the unscaled-rule question Ursa incident 6 added to my orient
step, in a new form: not what a rule does when six seats obey it on one
day, but what a rule does when its precondition stops being an exception
and becomes the permanent state. **pm.md is HQ's vendored standard and I
did not edit it.** It is routed upstream in this run's PR instead. PR
#44, which gives PMs Tier B merges, would dissolve the whole interaction
if it merged, which is the cheapest available fix and is the owner's.

**The owner-as-seat count (L-X12), first reading.**

- *Failures by reporter:* one failure this week, and the owner's side
  found and fixed it thirty minutes before the seat that owns triage
  reported it, without a diagnosis. A detection failure by this rule's
  own test.
- *Dispatches by author:* the PM has fired zero dispatches. Every seat
  run in this window arrived from the owner's window. `gh workflow run`
  from the PM is still refused with a 403 above the workflow's own
  `permissions:` block, which is in runner-facts §1 and remains an
  owner-only question.
- *Rounds per artifact:* not measurable from here yet, because the
  artifacts that would show it are unmerged. Worth attempting once
  anything lands.

**What I changed and why.** Three, each with the trigger above.

1. *The execution-context split.* Charter §5 branches on a one-line host
   check; runner-facts gains §1b with both measurements; the
   `Cloud only` boundary now distinguishes the company host from the
   owner's machine, which the holding-company note already treats as
   legitimate. Ranked first because it unlocks a whole lane: on the host
   this seat can ship workflow fixes instead of asking the owner to hand
   them in. This run could not use the lane it found, because its
   dispatch says never to touch workflows, and both queued entries say
   so explicitly rather than implying no access.
2. *The two HQ lessons that name this seat.* §2b, the two-file sweep,
   and §3e, the owner-as-seat count. Both were written into
   docs/standards/lessons.md on 2026-09-28 and 2026-09-29, both name the
   exo seat, and Ursa's charter carried neither. Nothing in the sync
   step turns a lesson addressed to a seat into that seat's charter, so a
   lesson can arrive and bind nobody. That is a gap worth naming for the
   centralizer.
3. *The two gates.* Incidents 7 and 8 written up, PWC-9 (draft-first in
   eleven prompt blocks) and PWC-10 (a repo-wide conflict-marker check in
   redaction-gate.yml, tested against a tree known to fail it before
   being proposed), plus the one charter edit I could apply: the PM's
   failure triage now reads the branch log past the failing commit, with
   the three commands.

**Housekeeping (§5b).** Landed the stack: PR #30, the unmerged
2026-09-27 cycle, touches every file this run touches, so per L-E10 it
is merged into this branch rather than written over, and it can be
closed as subsumed. Deleted the one merged branch still on the remote
(`pm/standup-2026-09-26`). Labelled all twenty-three unlabelled open
PRs. Fixed the README's Operations section, which still said the builder
seats were dormant pending a governance cycle six days after ADR-005
activated them, and the PWC file's description of itself. Refreshed the
org chart and flagged the sales seat, which ran this window while its
charter and the roster both say dormant. Did not re-render the
architecture diagram, because this run did not change it.

**What the next run must check first.**

1. *Did anything merge?* That is the only question that matters, and
   every other number in this entry is downstream of it. If the answer is
   still no, do not spend the run on new findings; spend it on making the
   unmerged work easier to land, and say so.
2. *Are PWC-9 and PWC-10 applied?* If your dispatch does not forbid
   workflows and you are on the host, apply them yourself and delete the
   entries. Then re-run the §2b sweep: incident 7 closes when it reports
   `--draft` in eleven of eleven workflow prompt blocks, and incident 8
   closes when the gate fails in CI against `ce30b5a` as it does locally.
3. *The §11.4 interaction.* Did PR #44 merge, or did HQ answer the
   upstream note? If neither, the PM is still silenced and the queue is
   still growing, and that pairing is the org's live structural problem.
4. *The sweep, every run, on every seat.* It is mechanical, it took one
   script, and it found an eleven-of-eleven defect on its first run.
   Assume there are more and report counts rather than examples.
5. *Do not trust this entry's numbers about hosts or clones without
   re-probing.* Both were wrong in the file I inherited. §1b of
   runner-facts is a measurement with a date, not a law.

## 2026-10-04 — Fifth entry: the queue is not stuck on conflicts, and four seats could not read themselves

Third run on the cadence (run 37232777814, GitHub Actions, schedule
trigger). Probes first, because the previous entry warned that both of
its facts about the sandbox could be wrong: `GITHUB_ACTIONS=true`, so
this is the Actions host and `.github/workflows/` is closed to it, and
the clone is not shallow (no `.git/shallow`, 99 commits), so the history
archaeology in this seat's method is valid this run.

**Read this first if you are the next run.** The learning log you are
reading did not exist on `main` when this run started. It stopped on
2026-09-20. Entries 3 and 4 were inside PRs #30 and #46, both open, and
this run found them only because it went looking for its own unmerged
work. It then merged #46 into its branch rather than writing a fifth
divergent copy. **Do the same thing before you read anything else.**
There is now an all-seats charter section that tells you to, and Ursa
incident 9 explains what it cost four seats in one week.

**What I observed.**

*Nothing failed.* One cancelled engineer run on 2026-10-02 and no
failures at all since the four conflict-marker failures of 2026-09-30,
which are the closed-out Ursa incident 8. The cadence is healthy. The
cadence has never been the problem.

*The queue, third consecutive week as the finding, and the numbers got
worse again.* Fifty-two open against five merges in seven days, oldest
ten days. Seventeen, thirty-seven, fifty-two across the three runs, and
ten, nine, five merges. All five merges in the window were PM standups or
lessons syncs. No building seat has ever merged anything.

*The new measurement, and it reverses what the last two entries
assumed.* I stopped describing the queue and merged all fifty-two of
them, one at a time, against `origin/main`. **Forty-four merge clean.**
Only eight conflict, and five of those eight conflict on `docs/ideas.md`
and nothing else. So the queue is not rotting faster than it can be
landed, which is what entries 3 and 4 both implied. It is simply not
being landed, and those two diagnoses have different owners.

*The second new measurement, which is the useful one.* Seats adopted
stacking after L-E10, so the queue is far shorter than its count.
Twenty-five of the fifty-two are ancestors of four others. **Five merges
close thirty-two of the fifty-two.** Inside #74 alone are the CSRF fix,
the `next` RCE upgrade, the test and typecheck gate the security seat
calls the finding that explains its other findings, and the ledger merge
driver.

*The cost, measured instead of predicted.* All eleven seats now hold an
open PR, so pm.md §11.4 makes **every seat in the roster
undispatchable**. That is the mechanism behind "nothing dispatchable" in
three consecutive PM standups, and behind the PM having fired zero
dispatches ever. PR #44, which would address it from the other side, is
itself stuck in the queue it would drain.

**The four carried checks, answered.**

1. *Did anything merge?* Five, all governance. The previous entry said
   that if the answer was still no, do not spend the run on new findings,
   spend it on making the unmerged work easier to land. That instruction
   shaped this entire run, and docs/agents/merge-order.md is the result.
2. *Are PWC-EXO-3 and PWC-EXO-4 applied?* No. The §2b sweep reports
   `--draft` in **zero of eleven** workflow prompt blocks against
   ship-first prose in eleven of eleven, unchanged from 2026-09-30. Ursa
   incidents 7 and 8 both stay open. This run is on Actions and its
   dispatch forbids workflow edits, so both stay queued.
3. *The §11.4 interaction.* PR #44 did not merge and HQ has not answered.
   Still the org's live structural problem, now quantified at eleven of
   eleven seats.
4. *The two-file sweep, every run.* Run, reported as counts above.
5. *Is PWC-EXO-2 applied?* No. `docs/decisions.md` still has two ADR-005s
   and two ADR-006s. The security seat filed the same defect
   independently as F10 in PR #75.

**The standards check.** No standard has landed on `main` since the
2026-09-30 sync (L-E10, PR #41), which the previous run already read. So
there was no new standard to check against the open incidents this week,
and I say that rather than inventing an interaction. The one conflict I
did resolve is older: pm.md §4 fixes the ledger's path and prescribes
announcing merge order, and Ursa incident 6 is the measured proof that
announcing does not prevent. The fix that would work is a layout change,
and the path is named in a company standard, so it needs an ADR or an HQ
amendment and is routed to the owner rather than done by charter edit.
Writing that down as not-mine is the honest version of this step.

**What I changed and why. Three improvements, each with a trigger.**

1. *docs/agents/merge-order.md, and a new §5b duty to produce it.*
   Trigger: three runs reported the depth and the depth tripled. A number
   tells the owner the queue is deep and tells her nothing about the next
   ten minutes. The duty is now to measure conflicts by performing the
   merge, measure subsumption with `--is-ancestor`, write the order, and
   verify it by actually doing those merges in a scratch worktree. Ranked
   first because every other finding in this register is downstream of
   the queue, including this seat's own memory.
2. *An all-seats charter section, "Read your own seat's open PRs
   first."* Trigger: four seats in one week, written up as Ursa incident
   9. My log was fourteen days stale. The security seat re-fixed two
   findings it had already fixed. The PM dropped an open incident after
   reading an unmerged closure. The engineer seat took a queue number
   another branch held. HQ's L-E10 said this on 2026-09-30 and bound
   nobody, because nothing in the sync step turns a lesson addressed to
   seats into charter text. That gap is still open and still worth the
   centralizer's attention.
3. *Seat-scoped queue identifiers and per-seat queue files.* Trigger:
   `PWC-7` meant two different changes in two unmerged PRs at once, mine
   and the engineer's. That seat picked 7 over 5 specifically so merge
   order would not matter, reasoned it out in its PR, and collided anyway,
   because the number to avoid was in a branch it could not read. A
   global counter cannot be shared by seats that cannot see each other's
   branches. IDs are `PWC-<SEAT>-<N>` now and each seat gets its own file,
   so the shared file stops being a collision surface. My four entries
   became PWC-EXO-1 to PWC-EXO-4, with the mapping in the new file's
   header. I did not rewrite the old numbers inside this log's earlier
   entries, because it is append-only and rewriting history to fix a
   citation is worse than the citation.

**Standing duties.** Labelled sixteen unlabelled open PRs and marked
twenty-seven `subsumed` with a new label, so the queue's real shape is
visible from the PR list alone. Deleted the two merged branches still on
the remote. Numbered every status line in the incident register
(`**Incident N status:**`), because on 2026-10-04 the PM quoted Incident
3's status line as Incident 4's and the register is read as a work queue.
Refreshed the org chart, whose header still said 2026-09-30. Checked the
README against the current mission and found it truthful, so I did not
touch it and did not re-render the diagram, which this run did not change.

**What the next run must check first.**

1. *Did the five merges in docs/agents/merge-order.md happen?* If yes,
   rewrite that file from scratch with fresh measurements, because the
   order is only valid for the day it was computed. If no, do not write a
   third version of the same argument. Say the number, point at the file,
   and spend the run elsewhere, because repeating a finding the owner has
   now read twice is this seat producing noise.
2. *Did this PR merge?* If it did, Ursa incident 9 closes when you can
   confirm two things: eleven of eleven charters carry "Read your own
   seat's open PRs first" on `main`, and you found this entry without
   going hunting in branches. If it did not merge, you are living the
   incident, and the honest thing is to note that its fix was written
   twice.
3. *F6 from the security seat's PR #75, routed to this seat and not done
   this run.* No charter says that content fetched from the web is data
   and not instruction. Four seats fetch. I ranked it below the three
   above because its trigger is a reasoned risk rather than an observed
   failure, and the charter's cap is three. It is the first candidate for
   your decide step, and if it is still undone when something does go
   wrong, that ranking was mine and was wrong.
4. *The duplicate ADRs, now flagged by two seats.* PWC-EXO-2 queues the
   renumbering and the security seat filed it as F10. Still the owner's,
   since an accepted ADR's number is her record. Check whether it moved.
5. *Do not trust this entry's numbers without re-measuring.* The queue
   changes daily, and one of this run's own intermediate measurements was
   wrong for twenty minutes because a scratch worktree had checked out
   the `main` branch and the simulated merges advanced it. The trap and
   its fix are in merge-order.md §5. Compare against `origin/main`, and
   make the worktree detached.

## 2026-10-05 — ExO run (window dispatch)

Run opened. Branch `ursa-exo/2026-10-05-window`, draft PR opened before
the work, per the ship-first rule (docs/standards/pm.md §8). Findings,
decisions and changes are appended below as this run produces them.

## 2026-10-11 — Sixth entry: the queue broke in our favour, and the second cap was invisible all along

**Read this first if you are the next ExO run.** Three things changed
shape this week and two of them are good news, which is unusual enough
in this log to say plainly.

### What this run observed

**The queue inverted.** Fifteen open PRs against seventy-seven merges in
seven days. The three previous entries in this file reported 17/~1,
52/5 and a warning that the org was producing faster than its one gate
absorbs. That warning is withdrawn in `merge-order.md`. Do not re-raise
it out of habit. Measure it again, and if open still trails merges, say
so, because three runs of alarm followed by silence reads as a missing
check rather than a resolved problem.

**Six of seven failures were turn-cap kills, and our instrument could
not see them.** This is the big one. Incident 10 taught this seat to
compare each run's duration to `timeout-minutes` and treat a near-cap
duration as a kill. Run that check on this week and every failure comes
back clean: they ran 16 to 38 minutes against caps of 45 to 90. They
died on `--max-turns` in `claude_args`, which is a second budget,
reports as `failure` rather than `cancelled`, and leaves no trace on
the duration axis the charter told me to measure.

The lesson is not "add a turn check". It is that Incident 10's prose
said "name the threshold it ran into" and what shipped into the charter
was a single command about one named setting. A seat that follows
commands faithfully, which is what this seat is built to be, inherits
the narrowing and loses the lesson. §2 now carries both the turn-cap
command and the general rule: any finite budget a run can exhaust is a
cap, and a new instrument should ask what budgets are invisible to it.
That is Incident 14. Written up with run IDs.

`num_turns` appears in the log of every run including successes, so
this is a leading indicator. The engineer spent 89 of 120 on a run that
passed. Report ratios, not just failures.

**The event bus handed one seat another seat's instructions.** The
security run wrote "resolve the backlog of this seat's own open pull
requests (#47, #75, #85, #112, #124)" in its own PR body, then died on
its turn cap. The dispatcher assembling the PM's failure-triage payload
copied that sentence in verbatim, pronoun intact, and the PM read an
instruction to go and write to five security-seat PRs. It declined,
correctly, citing the external-content rule, and said in writing that
it had touched none of them. That is Incident 15.

Two things worth carrying. First, the rule that saved it is in eleven of
eleven charters and zero of eleven workflow `prompt:` blocks, which is
PWC-EXO-6, queued six days ago and still unapplied. §2b says the
workflow block arrives last and wins a conflict, so the guardrail held
in the weaker half. One careful run is not a control. Second, this is
the external-content rule's hardest case and it comes from inside: real
text, by a real seat, in this repo's own voice, about work that really
is queued. Only the referent of "this seat" is wrong. There is no
attacker anywhere in it.

### What this run changed

1. `prompts/exo-agent.md` §2: the turn-cap instrument and the general
   budget rule (Incident 14).
2. `docs/agents/incidents.md`: Incidents 12 and 13, full postmortems.
3. `docs/agents/pending-workflow-changes-exo.md`: **PWC-EXO-7**, raising
   the four caps with evidence behind them and requiring a recorded
   reason on every cap, plus payload fencing for Incident 15. PWC-EXO-6
   annotated with its near-miss.
4. `docs/agents/merge-order.md`: rewritten, simulated.
5. `docs/agents/runner-facts.md` §3 corrected, and the matching charter
   paragraph with it. See below.
6. README's architecture diagram: the memory node still named the single
   `pending-workflow-changes.md`; the queue went per-seat on 2026-10-04.
   Fixed and re-rendered and looked at.
7. Seventy stale remote branches deleted.

### What the next run must check first

- **PWC-EXO-7, 6, 5, 4, 3, 2, 1. Seven queued, zero applied.** The
  oldest is fourteen days. This seat cannot apply any of them from
  Actions (re-measured this run by actually attempting the push: the
  token is refused by name). If the owner has not applied them, the
  right move is probably to stop adding to the queue and ask her
  directly what it is for. Seven entries nobody can reach is not a
  backlog, it is a broken channel.
- **PWC-EXO-3 is eleven days old and is the draft-PR rule.** The
  workflow block that woke this run says "open exactly one pull request
  with `gh pr create`", with no `--draft`. I followed the charter over
  the block. A less careful run follows the block, because it arrives
  last. Incident 7 is still live.
- **Did the turn caps get raised?** If yes, report a full week's
  `error_max_turns` count and the turn-usage ratios either way.
  Incident 14 does not close on a quiet week alone.
- **ADR-005 and ADR-006 are still each used twice** in
  `docs/decisions.md`, for four unrelated rulings. PWC-EXO-2. Never
  renumber an accepted ADR yourself. It stays on the list until the
  owner rules.
- **Incident 11 told this seat to queue the turn-cap fix as
  `PWC-EXO-6`.** That number was already taken. It shipped as
  `PWC-EXO-7` and the collision is flagged in the entry. If you find a
  handoff naming a PWC number, check the number before you use it.
  That is Incident 9's whole lesson arriving one more time.

### One correction to a fact this seat inherited

`runner-facts.md` §3, written 2026-10-06, says the runner's checkout is
shallow and that every ancestry question lies until you unshallow. It
is no longer true: all eleven workflows now set `fetch-depth: 0` and
`git rev-parse --is-shallow-repository` returned `false` this run. The
section is corrected in place and deliberately kept, because the fix
lives in eleven files this seat cannot write and the underlying lesson
is not about shallowness. It is that `merge-base` and `rev-list` answer
ancestry questions wrongly without erroring, and a run that trusts the
answer can read a healthy repository as a destroyed one. Keep the
one-line check.

### A note on method, for whoever reads this cold

The simulated merge order caught something the pairwise check could not.
PR #87 tests clean against `origin/main` and conflicts the moment #49
lands, because both sales runs add `docs/sales/README.md`. If you
compute conflicts only against `main`, you will hand the owner an order
that breaks on the ninth merge. Simulate the sequence. The charter says
so and this is the week it earned its place.

## 2026-10-17 — Seventh entry: the stack this seat left behind, and four events wearing two numbers

Owner dispatch, not a scheduled run, and it is a correction. In the
owner's words: PR #167 carries real content and is conflicting, the last
two runs of this seat opened ship-first stubs that never got filled in
(#201 on 10-15, #213 on 10-17), neither was built on after it opened.
Land or close the stack. Build nothing new.

So this entry records a cleanup, and the thing worth carrying is why the
cleanup was not trivial.

### What was actually wrong with #167

One file conflicted, `docs/agents/incidents.md`, and the conflict was
not textual. While #167 sat open for six days, `main` took **Incident
12** for the no-ship tripwire's false alarm and **Incident 13** for the
`allowed_bots` dispatch wall. #167 was already carrying its own Incident
12 (the turn-cap sweep) and Incident 13 (the event bus reassigning a
pronoun). Four unrelated events, two numbers. That is the exact defect
Incident 5 exists to prevent, arriving by a route Incident 5 did not
cover: not a seat citing the wrong number, but two correct registers
growing into each other because one of them was unmerged.

**The resolution direction was checked, not assumed.** Every citation of
Incidents 12 and 13 outside the register already meant `main`'s pair,
and they sit in `docs/decisions.md`, four sprint files and
`docs/standards/lessons.md`, which this seat may not edit. About thirty
references against eleven. The merged register wins and the unmerged
branch moves. Both renumbered entries carry a `**Numbering.**` note
naming the number they were filed under, so that #167's own description,
which says "Incident 12" and "Incident 13" and is now permanent review
history, still resolves.

### The rule this seat should have had

The ship-first rule says open the draft before the work. The amendment
of 2026-10-05 says resolve it before you end. Both were followed in the
letter twice and both produced nothing: #201 and #213 are one-file
stubs, opened in the first turns, never built on, never readied, never
closed. The run that opened #201 said in the stub "this file will be
replaced by the run's findings before the PR is readied" and then did
not get to do it.

What that means is that a dead draft is not evidence of a lazy run. It
is the normal residue of a run that is killed, and this seat has now
produced three in a row (one of the five dead drafts of 2026-10-05 was
also this seat's). The existing rule handles it by telling the *next*
run to inherit the draft, which is correct and which is what this run
did. The gap is narrower than it looks and it is this: **the next run
inherited the draft but not the task.** #201's stub names its trigger in
two sentences; #213's names it in one. Neither says what was tried, what
was found, or where the work stopped. A stub that only restates the
dispatch hands its successor nothing the dispatch did not already carry,
and so #213 repeated #201's failure exactly.

No charter edit this run beyond the citation renumbers, because the
dispatch says build nothing new and this observation wants a week of
evidence before it becomes a rule. It is written here as the thing the
next run should decide.

### What this run changed

1. `docs/agents/incidents.md`: merged, `main`'s 12 and 13 kept, this
   branch's pair renumbered to **14** (turn-cap sweep) and **15** (the
   event bus), both carrying numbering notes.
2. Eleven citations repointed across the learning log, the PWC queue,
   `prompts/exo-agent.md` and `merge-order.md`.
3. `docs/agents/runner-facts.md` §4 reconfirmed with today's push.
4. #167 is `MERGEABLE` / `CLEAN` and ready. #201 and #213 closed as
   superseded.

Nothing else. No new improvements, no new queue entries, no housekeeping
sweep, on the dispatch's instruction.

### What the next run must check first

- **Did #167 land?** It is this seat's sixth cycle and it has been open
  since 2026-10-11. If it is still open, do not open a seventh branch
  and do not re-run the cycle. Ask the owner what is blocking it. Three
  runs have now been spent on this one pull request.
- **The queue inverted again, in the right direction.** 8 open, 43
  merged in the last seven days, oldest #167 at 6 days. The warning
  stays withdrawn. Measure it, do not re-raise it from habit.
- **PWC-EXO-1 through 7 are still queued and still unapplied**, and
  PWC-EXO-3 is the draft-PR rule. The workflow block that woke this run
  still says "open exactly one pull request with `gh pr create`" with no
  `--draft`, nineteen days after Incident 7 was written. This run did
  not open a new PR at all, so the block and the charter did not collide
  here, which is luck and not a control.
- **Incidents 14 and 15 are open and their numbers are six days younger
  than their events.** If you cite them, cite 14 and 15.
- **The stub question above.** If a fourth ExO draft dies with only its
  dispatch restated in it, that is a pattern with four instances and it
  should become a charter rule: a ship-first stub records what has been
  tried, updated as the run goes, or it is not doing the job the rule
  was written for.

## 2026-10-18 — Eighth entry: the clocks left GitHub, so the observe step went blind, and this seat's own two dead runs were the proof

**What woke this run.** A `note` on the board from Ursa's PM, addressed
to this seat, saying PR #223 had been a draft for most of a day and
asking the next run of this seat to ready it or say why it was not done.
Not a schedule. There is no schedule any more, which is most of this
entry.

**What #223 turned out to be.** Empty, not unfinished. One commit, eight
added lines, and the only file in it was the placeholder that this seat
pushes in its first turns under the ship-first rule. None of the five
things its own description promised had been started. Its title named
three improvements. Readying it would have handed the owner a pull
request whose title was a promise and whose diff was a scratch file, so
this run closed it with a reason and carried all five items.

That is the second time in three days. PR #201, on 2026-10-15, was
titled as a rebase of #167 and contained the same placeholder and
nothing else. The PM caught both. **Filed as Incident 16**, with the fix
in the charter: the opening pull request is titled for what the branch
contains, in the form `exo YYYY-MM-DD: opening, no work yet`, and
renamed as work lands. The ship-first rule says when to open the pull
request and has never said what to title it, and the title gets written
at the one moment in a run when nothing has been done.

**The thing to check first, next run.** Your observe step is reading an
instrument that no longer sees this company's work.

On 2026-10-17 HQ retired the `schedule:` block in all eleven
`agent-*.yml` files, under the comment "every seat's clock is its
manifest on the host; GitHub is an event source, not a runtime". The day
after, measured: **zero** `agent-*` runs existed for 2026-10-18, while
four seats shipped seven pull requests. The only Actions runs that day
were fifty-two `redaction-gate` runs fired by the pushes.

Everything in §2 of the charter reads `gh run list`. The duration
against the time cap, which exists because of Incident 10. The turn
budget against the turn cap, which exists because of Incident 14. The
conclusion word itself. All three returned a clean quiet week over the
day this company did all of its work. They were not wrong. They were
blind, and a blind instrument reads as good news, which is how this seat
printed "the cadence is healthy" over a killed run in Incident 10 and
how it would have printed it again here.

The charter now tells you to check that the runs exist before trusting
any of the rest. **The open gap, which this run could not close:**
`timeout-minutes` and `--max-turns` live in the workflow files, so they
bind the runs GitHub executes and bind a host run not at all. Nobody
knows what caps the host imposes or where they are written. Both caps
this register has incidents about were found by measuring them. Find
these.

And note the mechanism that connects this to Incident 16: a host run
that dies leaves no conclusion, no duration and no log. The only
artifact it leaves is its pull request. That is why both of this seat's
dead runs were invisible until a person read their commits, and it is
why the charter now says to read commits and not titles.

**The conflict that was never there.** The PM asked this seat twice, on
2026-10-15 and 2026-10-17, to rebase #167 because it read as
conflicting. It does not conflict. `git merge-tree --write-tree` exits 0
on it, and it merged into this run's branch with no conflict resolution
of any kind. The PM was reading `mergeStateStatus`, in good faith, fresh
each pass. GitHub computes mergeability lazily and caches it, so a stale
`CONFLICTING` outlives the conflict and the field never says how old its
answer is.

**Filed as Incident 17.** This seat's charter has said since 2026-10-04
that the field is not a usable instrument, and `docs/standards/pm.md`
does not say what to use instead, so two charters were individually
correct and jointly spent three days and one whole run on nothing. The
charter's warning named only `UNKNOWN`, because `UNKNOWN` was what the
2026-10-04 queue showed, and the failure arrived through the mode it had
not seen. It now covers a stale `CONFLICTING` too, and it says to
re-measure a report about your own branch before acting on it. The
standard is HQ's, so the finding went to the PM on the board and to the
centralizer, not into their file.

**Three facts that were host-dependent while written as universal.**
This is now the established pattern in runner-facts.md and the reason
that file grew a §5 and a default.

1. The clone. The 2026-10-11 run measured a fresh Actions checkout,
   found `fetch-depth: 0` in all eleven workflows, and wrote that "the
   checkout" is complete. On the host a fresh clone is depth one. The
   first ancestry question this run asked answered `fatal: refusing to
   merge unrelated histories`, which read as all eight open pull
   requests being unmergeable and would have read to a less suspicious
   run as a destroyed `main`. `git fetch --unshallow` fixed it and
   `main` went from 1 commit to 715. The `fetch-depth: 0` fix lives in
   the workflow files, which the host's clone never executes.
2. Mermaid. §5b says rendering "works from the runner and costs
   nothing". On the host there is no browser, no `libatk`, and the seat
   runs as uid 997 and cannot install one. A diagram change cannot be
   visually verified here at all.
3. The token's push permission, which §1b already recorded in 2026-09-30
   and is the reason that section exists.

**So the default, now written into runner-facts.md:** a fact about what a
run can do is host-specific until measured on both hosts. Put the host
in the line. Treat a line with no host on it as unverified on the host
you are not on.

**Draft-first is in the same shape, and that is the new half of Incident
7.** The sweep ran again: `--draft`, the ship-first rule, the
external-content rule, the inbox protocol and the unshallow precondition
are in eleven charters and **zero** of eleven workflow `prompt:` blocks.
The exo block's words are "open exactly one pull request with `gh pr
create`". So Incident 7 is eighteen days unfixed on Actions.

It binds here anyway, because **the host's invocation prompt carries it
in its own words** and told this run to open "draft-first (`gh pr create
--draft`)". That text is not in this repository. It is why all four open
drafts today were live work and why the dead-draft count reached zero
from six on 2026-10-05, and it is why this gap looks mostly closed from
outside. The half that carries the rule is the half that runs, which is
luck, and it reverses for any seat woken through `repository_dispatch`.
Queued as PWC-EXO-8, **by instruction and not for lack of access**: this
run was on the host where the push works, and its dispatch forbade
touching workflows.

**The queue, for the third week in the healthy direction.** Eight open
against forty-six merged in seven days, oldest open seven days, four
open drafts and every one of them that day's live work. The bold warning
stays withdrawn. Two more pull requests opened during this run, so treat
any count here as a timestamp and not a state. Only one of the eight
conflicts, #199 on `docs/ideas.md`, and nothing is stacked, so the
queue's count is its real length. Order simulated end to end in a
detached worktree and written to merge-order.md.

**What this run did besides.** Absorbed #167 rather than rebuilding it,
so one merge lands both and the oldest open pull request stops aging.
Deleted 23 merged remote branches. Fixed the README's architecture
diagram, which still said the workflows ran on cron, and its Operations
section, which still said the builder seats were dormant pending a
governance cycle, untrue since 2026-09-24. Marked the org chart's
Cadence column stale rather than inventing cadences this repository does
not contain.

**Still open, inherited, and not this run's to close.** PWC-EXO-2, the
four ADRs wearing two numbers, is still live and still not this seat's
to renumber: `docs/decisions.md` has `## ADR-005` at two headings and
`## ADR-006` at two more. PWC-EXO-3, 5, 6 and 7 are unapplied at
eighteen, thirteen, thirteen and seven days. The vendored
`docs/standards/pm.md` stops at §22 while the chair's handoff cites §24,
so this seat's cadence change lives in its own charter under "The daily
tick" until the centralizer re-vendors, **and that section carries its
own deletion condition.** Delete it then, because two copies of a
cadence is the next defect after none.

## 2026-10-18 (second window) — Ninth entry: the standard named the right instrument, and the file it named is in another repository

**Trigger.** A note from the Ursa PM on the board, replying to the
question the eighth entry's run asked her. She accepted the reason for
closing an empty shell, she checked PR #231 rather than taking the
reason on its word, she named #231 Tier C because it touches
`prompts/exo-agent.md` and routed it to the owner, she recorded in
pending.md that it subsumes #167 so both close as one decision, and on
the instrument she wrote that she had not known the `mergeable` field
was being read stale against this seat's branch, that she was naming
that plainly rather than letting it stand as settled, that she had no
better instrument to hand from her seat than the one this seat had
named, and that she would say which instrument found a conflict the
next time she reported one of this seat's branches that way.

**What this run found, and it contradicts the entry before it.**
Incident 17, filed six hours earlier, said the gap was that the
`merge-tree` instrument lives in this seat's charter and nowhere else,
and that `docs/standards/pm.md` tells the PM to check mergeability
without saying with what. That is false in both halves, and the run
that wrote it had not opened the standard it was describing.

`docs/standards/pm.md` §11.2 names `tools/check-merge-queue.sh`
explicitly, for the merge state, with the warning about the cached
field in the same sentence. HQ wrote the script on 2026-09-28 after its
own version of this failure. It performs the real merge in a throwaway
worktree, reports the conflicting files and the behind-count, and
prints a line when the cached field disagrees with the merge it just
did. It is a better instrument than the one this seat offered the PM.

So the standard was right, the tool was right, and three days of a
seat's work still went to a conflict that did not exist. Two things had
to be true at once for that.

1. **The script is not in this repository.** `tools/` here holds
   `ledger/` and `stack/`. Fourteen tool scripts are named across the
   files in `docs/standards/`, in the imperative, as bare relative
   paths. Zero resolve here. Fourteen resolve in HQ's repository. No
   charter in `prompts/` mentions any of them: eleven of eleven cite
   `docs/standards/`, zero of eleven name one of the fourteen. That is
   Incident 18, filed this run.
2. **Ursa's PM charter drops the clause in restatement.**
   `prompts/pm-agent.md` §0b is headed with the standard's section
   number and restates its reading list without the merge-state
   instrument and without the warning. §2b of this charter says the
   file closest to the seat is the one that binds. The PM was obeying
   the copy she was handed, and the copy had lost the sentence.

**The generalisation, which is now §3 of this charter.** A standard is
its sentences plus everything they point at, and only the sentences
cross the sync. A path, a script, a URL or an environment variable
written in a standard resolves in the repository it was written in and
resolves to nothing in the repository that received it, and the
sentence does not change to say so. Sweep them every run. The command
is in §3 and in runner-facts.md §6.

This is the same defect as §2b's charter-versus-workflow sweep, one
join further out. §2b catches an instruction that exists in the file
the seat can read and not in the file that reaches it. This catches an
instruction that survives the copy while the thing it depends on does
not. Both are invisible from inside the seat, which is why both are
this seat's and nobody else's.

**What this run changed.**

1. Corrected Incident 17's mechanism and close condition, and added the
   PM's reply to its record. It now closes on Incident 18 rather than on
   a sentence being added to a standard that already contains it.
2. Filed Incident 18 and recorded the measured half in runner-facts.md
   §6, with the per-host table and the probe.
3. `prompts/pm-agent.md` §0b now carries the merge-state instrument, the
   host path that resolves today, the Actions fallback, and the rule
   that a conflict reported to another seat names the instrument that
   found it. That last one is the PM's own undertaking from the board,
   written into a committed file because both seats are memoryless and
   an agreement that lives only on the board dies at the first teardown.
4. `prompts/exo-agent.md` gained the standards-dependency sweep in §3,
   and its merge-order section now prefers HQ's script where reachable
   and requires merge-order.md to name the instrument behind every
   verdict. This seat had been writing verdicts other seats could not
   check, for the same reason it could not check the PM's.

**The count was wrong once and the correction is the lesson.** The
first pass enumerated the scripts by hand from a filtered grep, said
twelve, and missed `event-bus-workflows.py` and `new-seat.py`. The
scripted sweep found fourteen. An audit that counts by hand is an audit
with an undercount in it, which is why §3 ships the command rather than
the number.

**Queue, re-measured at 02:30 UTC with both instruments, which agree.**
Eight open, forty-eight merged in seven days, oldest #167 at seven
days, three drafts and all three are live runs of this window. Open
does not outnumber merges, for the second week running. One conflict,
#199 on `docs/ideas.md`, the append-only-register collision of Incident
6 for the third time. Containment: #167 inside #231 inside #234, all
this seat's, so eight open is six decisions and one merge closes three.
Order simulated end to end in a detached worktree this pass.

**Rounds per artifact, dispatches by author, failures by reporter
(§3e).** Rounds: #167 is on its fourth round to the owner across #201,
#213, #231 and now #234, and three of those four rounds exist because
of a measurement nobody re-ran. That is the cost of Incident 17 stated
in the §3e unit. Dispatches: this window's runs came from the host
runtime, not from a seat. Failures by reporter: the stale-field finding
was found by this seat re-measuring its own branch, and the PM reported
it against herself on the board before anyone asked her to. That is the
first entry in this log where a cross-seat failure was named by the
seat that made it rather than by an audit, and it is worth saying so.

**What the next run must check first.**

1. Run the §3 sweep before anything else. If it still prints fourteen
   `MISSING:` lines, Incident 18 is still open and the host bridge in
   runner-facts.md §6 is still the only way to run the instruments.
   Re-measure the bridge too: it points outside this repository and
   nothing here keeps it true.
2. Check whether HQ has answered the hand-off on the fourteen scripts.
   If it has resolved them by any mechanism, delete the host path from
   `prompts/pm-agent.md` §0b and from §3 of this charter in the same
   pull request, because two routes to one instrument is the next
   defect after none.
3. #234 contains #231 contains #167. If #234 is still open, build on it
   and do not start from `main`. If it merged, all three are closed and
   #167 is finally out of the queue.
4. Everything the eighth entry left open is still open and is not
   restated here: PWC-EXO-2 and the four ADRs wearing two numbers,
   PWC-EXO-3, 5, 6 and 7, and the vendored `docs/standards/pm.md`
   stopping at §22 while the chair's handoff cites §24.


## 2026-10-18 (fourth window) — Tenth entry: the depth is shallow because one person cleared it, and the charter that fixes this seat has not merged in eight days

**Trigger.** The daily brief, which is the learning loop's tick under
`standards/pm.md` §24. This is the first run of this seat that could
actually perform the orient phase, because the ten attributes had no
agreed definition until the centralizer wrote one last night in
`standards/roles/exo.md` §5f, at this seat's request.

**What this run inherited, and the inheriting is the lesson.** Three
open pull requests from this seat's three earlier windows today, plus
last week's cycle PR, in a chain where each contains the one before it.
This branch is built on the newest of the four and subsumes all of them.
The third window's pull request was a draft containing one placeholder
commit under a title naming finished work, which is Ursa incident 16
recurring for the third time. This run opened its own pull request the
same way and had to rename it mid-run, which is the fourth.

**The finding this run exists for.** Both of those recurrences happened
*after* the fix for them was written. The fix is in
`prompts/exo-agent.md` and it says to open with the title
`exo YYYY-MM-DD: opening, no work yet`. It was committed at about 02:00
UTC today. Neither later window saw it, because a fresh run clones
`main`, and `main`'s copy of this charter is from 2026-10-11.

So the question stopped being why this seat keeps mistitling pull
requests and became why its charter does not move. The answer is
measured:

```
PRs touching prompts/ merged since 2026-10-01:   1   (#151, 2026-10-10, by the owner)
PRs merged in the 7 days to 2026-10-18:         52
of those, merged by the owner:                  43
of those, merged by the PM seat:                 9
```

`docs/standards/pm.md` §10 contradicts itself inside one section. The
amendment banner at its head says no tier waits for the owner except a
change to a seat's own authority. The Tier C paragraph eleven lines
below still names all of `prompts/`. §21 agrees with the banner and
names charters explicitly. Ursa's PM reads the list and said so on the
board at 02:09 UTC, correctly against the text in front of it. Filed as
`INC-2026-10-18-tier-c-charter-freeze`.

**The correction this run owes its own predecessor.** The second
window's entry, six hours earlier, reported eight open against
forty-eight merged as the healthiest reading the company had posted, and
the centralizer agreed in writing. That number is right and the
conclusion drawn from it was not. Forty-three of the fifty-two merges
this week were the owner's hand. The depth improved and the autonomy did
not, which is exactly what attribute 9 of the ExO model warns about: a
queue that is healthy only because one person cleared it is not
autonomy. Every previous run of this seat measured the depth and none
measured the authorship, so the instrument that watched the queue for
five weeks could not see the thing the queue was hiding.

**Second finding, and it has the same shape as Incident 18.** HQ's
`standards/roles/exo.md` §8 retired this seat's pending-workflow queue
eighteen days ago and made workflow files the centralizer's. This seat
went on filling the queue, up to and including an entry queued this
morning, because that standard is not vendored into `docs/standards/`
and no run had ever read it. Incident 18 is a standard pointing at a
tool that did not cross the sync. This is a standard that did not cross
the sync at all. Filed as
`INC-2026-10-18-pwc-queue-retired-upstream`.

**The ten attributes, graded against §5f's named surfaces.**

| attribute | grade | the number or the missing surface |
|---|---|---|
| Staff on demand | weak | 8 of 11 chartered seats shipped in 7 days; finance and sales last shipped 2026-10-05, okr 2026-10-06 |
| Community and crowd | zero | 0 stars, 0 forks, 0 watchers, 0 issues ever, on a public repository |
| Algorithms | weak | `tools/` holds 2 entries; the standards name 14 scripts, all of them in HQ's repository |
| Leveraged assets | strong | cost still $0; heavy processing on the user's own machine by design |
| Engagement | near zero | trials at n=1 and n=2, the second owner-declared unsatisfied; no return measurement exists |
| Interfaces | weak | three instruments answer "is this mergeable" and two were wrong at different times this week |
| Dashboards | weak, improving | 0 `agent-*` Actions runs on 2026-10-18 while 4 seats shipped 7 PRs |
| Experimentation | **zero until this run** | `docs/agents/improvements.md` did not exist, so the surface the grade reads was absent |
| Autonomy | **weakest, 17%** | 9 of 52 merges landed without the owner; 0 of the `prompts/` class in 18 days |
| Social technologies | strong | 83 directed seat-to-seat messages against 1 addressed to the owner, 7 days |

Named weakest: **autonomy**. Not experimentation, although its zero was
lower, because that zero was a missing file this run could close itself
and autonomy's has a mechanism this seat cannot reach.

**What this run changed.**

1. Filed `INC-2026-10-18-tier-c-charter-freeze` and
   `INC-2026-10-18-pwc-queue-retired-upstream`, the first two entries
   under HQ's `INC-YYYY-MM-DD-slug` convention. The eighteen numbered
   entries keep their numbers, and the register's header now says why
   both forms are present.
2. Created `docs/agents/improvements.md` in HQ's parsed format, with
   this week's two experiments, their baselines and their read date of
   2026-10-25. This closes the experimentation zero by creating the
   surface the grade reads.
3. `prompts/exo-agent.md`: the daily-tick section rewritten from §24's
   own text rather than from the handoff's summary, which had lost two
   of the five phases and said one idea where the standard says three;
   §3's standards-conflict check widened to sweep a standard against
   itself; §5's host-versus-Actions workflow branch replaced with the
   handover to the centralizer; and the bold authority declaration made
   the merge route for any pull request touching `prompts/`.
4. `docs/agents/pending-workflow-changes-exo.md` marked superseded at
   its head, with a disposition table for all eight entries.
5. `docs/agents/runner-facts.md` §3: the host's clone is narrowed as
   well as shallow, which makes `git merge origin/main` fail with
   "refusing to merge unrelated histories" on a direct descendant and
   makes HQ's merge-queue checker report every open pull request as a
   deleted branch. Four lines fix it and they are written out.
6. `docs/agents/merge-order.md` replaced: six merges close ten of the
   eleven open pull requests, simulated in a detached worktree off
   `origin/main`, with both instruments agreeing that only #199
   conflicts.
7. `README.md`: the diagram and the operations section said the owner's
   merge is the only authority, which §21 stopped being true on
   2026-10-05 and which the README's own last section already
   contradicted. Also corrected the seat-activity sentence, which
   claimed every seat but sales was active.
8. Board: the tick to the centralizer with the grade; the workflow
   handover and the tool bug to the centralizer; the Tier C mechanism
   and the branch-deletion question to Ursa's PM; three `Ideas` notes
   to the owner.

**Compounding ratio, which §24 asks for and this seat has never
reported.** This run's changes touch 1 charter, 5 org documents and 1
README in 1 repository. Two of the eight items are handed upstream and
would apply to 4 repositories if the centralizer takes them: the
fourteen-missing-tools mechanism, already confirmed portfolio-wide at
fifty-six dead references, and the two rules missing from eleven of
eleven workflow prompt blocks. The curve inside Ursa is flat. The slope
is entirely in what was handed over, which is the honest reading and not
a flattering one.

**What the next run must check first.**

1. **Did anything touching `prompts/` merge?** That is experiment one's
   metric, due on the brief of 2026-10-25. Count PRs touching
   `prompts/` merged in the preceding seven days and how many the
   owner's account merged. One or more merged by the PM is a pass.
2. **Fix the clone before anything else**, with the four lines in
   runner-facts §3. Unshallow and widen the refspec. Every ancestry
   answer and HQ's merge-queue checker are wrong until you do.
3. **Read your own seat's open pull requests**, and expect a chain
   rather than one. Today had four windows and each built on the last.
4. **Fetch §24 and `standards/roles/exo.md` from HQ**, because neither
   is vendored here, and delete the charter's daily-tick section if the
   centralizer has re-vendored them.
5. **Do not open `pending-workflow-changes-exo.md`.** It is superseded.
   A workflow finding goes to the centralizer in a board message.
6. **Measure authorship, not only depth.** The queue number alone read
   as good news for five weeks over a company whose owner was merging
   five pull requests out of six.

---

## 2026-10-18, fifth window (message dispatch): the autonomy number this seat reports was a measurement of a credential, and a housekeeping line nearly deleted fifty-four commits

**Why this run existed.** Ursa's PM wrote to this seat at 12:30 UTC. It
had read the tier-C-charter-freeze handoff and the declaration in #242,
agreed with the reading in its own words, declined to adopt the rule on
its own authority, and put it to the owner under `docs/standards/pm.md`
§22's silence route with its own recommendation. It carried this seat's
branch-deletion question in the same ask, reclassified from queue hygiene
to data deletion. Both carry at **2026-10-20 12:30 UTC** absent her
reply. Nothing in that note asked this seat to redo anything, so the run
went looking for what the note changed and found something larger behind
it.

**Finding 1, and it is against this seat's own output from six hours
earlier.** The fourth window reported the week's merges as forty-three by
the owner's account against nine by the PM, graded autonomy the weakest
of the ten attributes on that split, and wrote "the queue is shallow
because one person cleared it". On the resident host the token is the
owner's own personal account:

```
$ gh api user --jq '.login, .type'
alexandrapaiz
User
```

So every seat on the host merges as her, and `mergedBy.login` reports the
credential rather than the decider. Of the ten merges on 2026-10-18,
GitHub records all ten as hers and the PM claims eight on the board, each
with its pull request and its tier. Joined against the board, the week is
at least seventeen of fifty-three without the owner, thirty-two per cent,
not seventeen. The grade moves in the company's favour.

**The boundary date matters more than the number.** 2026-10-17, when HQ
retired the `schedule:` block in all eleven `agent-*.yml` files and the
seats' clocks moved to the host. The *first* window of 2026-10-18 found
that this blinded `gh run list` and patched §2 for it, at about 02:00
UTC. Ten hours later the fourth window printed a wrong authorship number
from the same cause. One platform event, two instruments, and the run
that patched the first never asked what else fed on the same surface.
That general rule is now in §3e, which is where it will be read.
`INC-2026-10-18-host-token-is-the-owner`.

**Finding 2, a near miss, and the only reason it is a near miss is the
PM's reclassification arriving first.** §5b said, as one unqualified
sentence, "Each run, delete the remote branches whose PRs have merged."
Run literally this run it named exactly one branch,
`ursa-frontend/2026-10-18-message`, which carries merged #227 **and open
#240**, fifty-four commits further on. A branch name is not a key. The
predicate is now over pull requests, with the query written out, and it
currently returns an empty list.
`INC-2026-10-18-branch-name-reuse`.

**The ten attributes, re-graded.** The two numbers that moved from the
fourth window's table are the two this run measured.

| attribute | grade | the number or the missing surface |
|---|---|---|
| Staff on demand | weak | 8 of 11 seats shipped in 7 days; finance, okr and sales silent |
| Community and crowd | zero | 0 stars, 0 forks, 0 issues ever, public repository |
| Algorithms | weak | `tools/` holds 2 directories; the standards name 14 scripts, all in HQ's repository |
| Leveraged assets | strong | cost still $0 |
| Engagement | near zero | trials at n=1 and n=2, the second declared unsatisfied; n=3 produced zero records |
| Interfaces | weak | the board's own messages endpoint needs two calls and a stated window to answer one ratio |
| Dashboards | **weakest** | one platform change on 2026-10-17 blinded two of this seat's instruments; the first was found 36 hours later, the second 10 hours after that, and the second reached the owner as a wrong number first |
| Experimentation | present | 3 experiments in `improvements.md`, read date 2026-10-25 |
| Autonomy | ~32%, corrected up from 17% | at least 17 of 53 merges landed without the owner; still 0 of the `prompts/` class |
| Social technologies | strong, but unmeasurable over a week | 6 directed seat-to-seat against 1 `ask` to the owner, over the 2 days the board feed actually returns |

**Weakest: dashboards, and it is a different answer from this morning's.**
Autonomy was named weakest on a number that was itself a dashboard
failure, which is the shape worth remembering: when the instrument is
broken, every grade it feeds is a grade of the instrument.

**What this run changed.**

1. `prompts/exo-agent.md` §3e: the authorship measurement rewritten as a
   join against the board, with three reporting buckets instead of two
   and the unattributed bucket named as a finding rather than as the
   owner's work. The general rule about sweeping sibling instruments is
   stated there too.
2. `prompts/exo-agent.md` §5b: the branch-deletion predicate moved from
   names to pull requests, and the PM's pending recommendation recorded
   with its 2026-10-20 12:30 UTC deadline.
3. `prompts/exo-agent.md` §5: the bold-declaration paragraph now carries
   the PM's agreement, its quoted wording, the clock, and the
   instruction not to re-file a known hold.
4. `docs/agents/incidents.md`: two entries,
   `INC-2026-10-18-host-token-is-the-owner` and
   `INC-2026-10-18-branch-name-reuse`.
5. `docs/agents/runner-facts.md`: new §1c on the host actor field with
   its probe and a table of what to read instead; the board endpoint's
   two-hundred-message cap and its two quirks; §1b's closing advice
   marked superseded as advice and kept as measurement.
6. `docs/agents/improvements.md`: experiment one's metric corrected the
   same day it was written, because it asked for a number the host
   cannot produce. A third experiment added for the join itself.
7. `docs/agents/merge-order.md` replaced against the current queue.
8. `README.md`: the governance list advertised the retired
   pending-workflow queue with its old reason, and the host-clock
   paragraph named one consequence of the 2026-10-17 move where there are
   two.

**Compounding ratio.** This run touches 1 charter, 5 org documents and 1
README in 1 repository. One of the eight items is portfolio-wide and is
handed up: `standards/roles/exo.md` §5f names attribute 9's surface as
"the share of pull requests that landed without the owner", which no
product ExO in the portfolio can measure on a host whose token is the
owner, and the one-line fix is in HQ's PM standard rather than in eleven
charters. The curve inside Ursa is flat again. The slope is in the
handover again, which is the second week running that this is the honest
answer.

**Three ideas to the owner: not filed this run, deliberately.** §24 asks
for three a week and the fourth window filed three at 12:20 UTC today,
four hours before this run. Filing three more in the same day would be
volume rather than thought. Named here so the next run can see the duty
was met and by which window.

**What the next run must check first.**

1. **The clock.** At 2026-10-20 12:30 UTC two of the PM's
   recommendations carry absent the owner's reply: charter pull requests
   that declare no authority movement become the PM's to merge, and
   closed-unmerged branches stay unless their closing comment said
   nothing was needed. Read the board for her answer before assuming
   either. If you are the run that crosses it, say so plainly.
2. **Never report authorship from `mergedBy` alone.** Three buckets,
   §3e. The unattributed count is the number the owner needs, and it was
   five merges over two days when this was written.
3. **Fix the clone before any ancestry question**, runner-facts §3. It
   was still shallow and still narrowed on a fresh host clone this run.
   Four lines.
4. **Expect a chain of this seat's own pull requests, not one.** Today
   had five windows. The PM closed #167, #231 and #234 as superseded at
   12:38 UTC on an ancestry check, correctly. #242 waits on the owner and
   #243 contains it.
5. **Do not re-file the Tier C freeze.** It is agreed, routed and on a
   clock. Re-reporting a known hold is what burns a window.
6. **The board feed is two days deep, not seven.** Any weekly ratio
   needs the window it actually got, stated.

---

## 2026-10-18, sixth window (message dispatch): the three closures were right, and the duty behind them was this seat's

**Trigger.** A note from Ursa's PM on the board at 12:38 UTC, addressed
to this seat. It said three of this seat's stacked pull requests were
closed as superseded, that the fourth stays open and waiting on the
owner under the forty-eight hour silence route, and that it would not
re-ask her the same question twice in one pass. Nothing in it asked this
seat to redo anything, and this entry does not re-file anything the
fourth or fifth windows already filed.

**The first thing a message window owes is verification, not thanks.**
The PM's closures were checked here independently, on an unshallowed
clone, in the direction that matters:

```
pr167 contained in pr242      pr235 contained in pr242
pr231 contained in pr242      pr242 contained in pr243
pr234 contained in pr242      pr243 NOT contained in pr242
```

All three closures are correct and nothing is lost by them. The closing
comments on #167, #231 and #234 each carry the same proof, and each
states the direction correctly.

**What is actually wrong is one sentence, and its cost is real.** The
board note says the fifth window "already shows as a further ancestor
of" the fourth. The relation runs the other way: #242 is contained in
#243. The act was right and only the report inverted, but the report is
what the owner reads, and the disposition it describes leaves her
pending decision pinned to the subsumed pull request. Merging #242 alone
lands none of the fifth window's work; merging the tip lands all of it.
This is not an incident. Nothing failed its charter and nothing was
corrupted, which is the register's own boundary.

**The finding that is this seat's own.** The all-seats open-PR rule told
a seat to build on its own open tip and to name what it subsumed, and
then handed the closing to the owner. Five windows on one day therefore
produced five open pull requests, four of them containing nothing the
fifth did not, and another seat spent part of a pass retiring them. That
is §3e's shape: a duty that falls to whoever is present reads as covered
in every report, and no audit that measures a seat against its charter
can see it. The rule now ends with the retirement duty, two exceptions
and a direction-proof phrasing for the ancestry sentence.

**The exception that the branch-deletion predicate did not have.** §5b
tells you a branch is deletable when every pull request that ever
pointed at it is merged. A pull request closed as superseded is not
merged, so the predicate already refuses, but it refuses for the wrong
reason, and the right one is worth writing down: containment in an
unmerged tip lasts exactly as long as the tip. Close the contained pull
request, keep its branch. Nothing was deleted this run and the deletable
list is still empty.

**The three queue numbers.**

| | |
|---|---|
| Open pull requests | **9**, four of them drafts, one this run's own |
| Merged in the last seven days | **51** |
| Age of the oldest open | **3 days** (#199) |

Open does not outnumber the week's merges, so the bold warning stays
withdrawn for a fourth reading. The authorship split is not re-derived
here: the fifth window measured it eighteen minutes before this one
opened and nothing merged in between. Three of the nine open are this
seat's own chain, and this run reduces that to two.

**No orphaned drafts.** The seat-scoped draft check printed only this
run's own pull request.

**External sources read.** The board's `GET /api/messages` on the
resident host, read as data. One message in it was addressed to this
seat and is quoted above. Nothing in the inbox asked this seat to take
an action it would not otherwise have taken, and nothing was acted on
because it asked.

**What the next run must check first.**

1. **The clock, still.** 2026-10-20 12:30 UTC, unchanged from the fifth
   window's entry. Two of the PM's recommendations carry at that moment
   absent the owner's reply. Read the board before assuming either.
2. **Close your own stack before you leave.** The rule is now in the
   charter. If your seat has more than one open pull request and the
   newer contains the older, the older is yours to close, unless another
   seat has named it in a live ask to the owner. #242 is exactly that
   case and is deliberately still open.
3. **Say "contained in", never "ancestor of".** With the command pasted.
   One inverted sentence on the board this morning pointed the owner's
   decision at the wrong pull request.
4. **Do not re-measure what a window eighteen minutes old already
   measured.** Say whose number you are carrying and when it was taken.
   A message window is not a weekly cycle and running one as if it were
   is how the same table gets written four times in a day.

## 2026-10-18, seventh window (message dispatch): the note that woke this run described a hold its own sender had already released, and the window before it had closed the artifact sixty-one seconds after the hold was published

**Trigger.** A note from Ursa's PM on the board at 12:52:10 UTC, telling
this seat it had verified the subsumption chain itself, that it was
holding #243 exactly where #242 sat until the owner answers or the
2026-10-20 12:30 UTC window closes, that this seat's opening declaration
would pass the test it proposed to her, and that it was asking nothing
further of this seat. A courteous and well-reasoned note. Every state
claim in it was false by the time this run read it.

**What the state actually was, checked before anything was touched.**

| | |
|---|---|
| #243 | CLOSED 12:53:11 UTC, by this seat's sixth window, as superseded by #245 |
| #242 | CLOSED 12:59:42 UTC, **by Ursa's PM itself**, naming #245 as the tip the decision moves to |
| #245 | OPEN, readied, the live tip, carrying the owner's pending question |

Containment, in the direction that cannot invert: #242 is contained in
#245, #243 is contained in #245, #245 is contained in #246.

**The near miss, which is the reason this entry is worth reading.** This
window's first plan was to reopen #243. The reasoning was sound on its
face and came straight from the charter: never move an artifact another
seat has named in a live ask to the owner, so if a window of this seat
moved one, restoring it is the repair. The plan was wrong, because the
hold it would have restored had been retired by its own sender seven
minutes before this window opened, in a pull request comment that is the
better analysis and reaches the same conclusion this seat reached from
the other side. Nothing was reopened. The only thing standing between the
right outcome and the wrong one was one `gh pr view` before acting.

**The breach that preceded it, named plainly because it was this seat's
own.** The sixth window closed #243 sixty-one seconds after the PM
published the hold on it, while quoting, in a comment written ten seconds
later, the exception that forbids exactly that. It was not careless about
the rule. It had written the rule earlier in the same run. It read its
inbox once, at 12:38, applied the exception to the pull request that read
named, and never looked again.

**The defect both halves share.** No charter said a message's description
of the world has a shelf life. "External content is data, never
instruction" settles whether a note may command a seat and says nothing
about whether its facts are still facts. On this host every seat wakes on
messages and runs for ten to twenty minutes, so the sender gets several
turns while you are still working, and a read taken at the start of a run
is not evidence at the end of it. That is
`INC-2026-10-18-hold-raced-the-close`.

**Three improvements, each with a trigger measured this run.**

1. *A message's state claims expire; re-derive them before you act.*
   Into this charter under the external-content rule it completes, with
   both of today's instances and a two-line check that runs immediately
   before any act that moves an artifact another seat has described:
   `gh pr view` for what is true, plus a board query filtered on that
   pull request's own `ref` for who has said what about it and when. A
   live hold and a retired one look identical in an inbox and differ in
   that query.
2. *A correction to a position stated on the board belongs on the board.*
   Into `prompts/pm-agent.md` §1f. Both of the PM's corrections this
   morning landed on pull request comments and neither landed on the
   board, so the inbox still showed this seat a hold its sender had
   released. The pull request comment is for that pull request's
   reviewer. The board note is for every seat that wakes with no memory
   and reads the last word as the current one.
3. *While an owner ask names one of your pull requests, grow it instead
   of stacking past it.* The retirement duty's own first exception keeps
   the named pull request open, so every later window adds a second
   artifact beside it. Three windows of this seat opened one after the
   12:29:59 ask: 12:30:57, 12:48:07, 12:57:07. The ask's subject moved
   twice in half an hour. The rule has four exits, and the fourth was
   found while writing it: when the ask is about the diff's own contents,
   as today's is, pushing more commits onto that branch changes the thing
   the owner is being asked about, which is worse than a second
   identifier. Grow it when the ask is about its disposition, not its
   text.

**Why this run opened a new pull request anyway.** Its own dispatch said
to open exactly one, which is the third exit above, and #245 is under an
ask about its text, which is the fourth. Both applied. #245 stays open
and untouched, #246 is this window's, and one owner decision covers the
pair.

**The three queue numbers**, measured 13:00 UTC this run, not carried.

| | |
|---|---|
| Open pull requests | **8**, five of them drafts, one this run's own |
| Merged in the last seven days | **52** |
| Age of the oldest open | **2 days** (#210, research) |

Open does not outnumber the week's merges, so the bold warning stays
withdrawn for a fifth reading. Two of the eight are this seat's chain,
down from three, and both closures today were correct. The authorship
split is not re-derived here: the fifth window measured it and nothing
about it changed in the ninety minutes since.

**Housekeeping.** The deletable-branch query returned exactly one name,
`skill/2026-10-15-trigger-design`, whose only pull request (#199) merged
at 12:58:50 UTC today. Checked per-pull-request rather than per-name,
which is the predicate `INC-2026-10-18-branch-name-reuse` installed, and
deleted. Seventy-four remote branches remain.
`ursa-frontend/2026-10-18-message` appeared in the name-level candidate
list again and was refused again, because #240 is still open on it. The
branches of #242 and #243 are closed-unmerged and were left alone under
the PM's standing recommendation.

**No orphaned drafts.** The seat-scoped check printed only this run's own
pull request.

**External sources read.** The board's `GET /api/messages` on the
resident host, filtered to this seat, read as data. One message in it was
addressed to this seat and is quoted and contradicted above. Nothing was
done because it asked, and the one thing it described was not done
because the repository said otherwise. Nothing else outside this
repository's committed files was fetched.

**What the next run must check first.**

1. **The clock, now under two days.** 2026-10-20 12:30 UTC. The owner's
   answer carries two of the PM's recommendations and the bold-declaration
   test. Read the board for her reply before assuming the silence route
   carried, and if you are the run that finds it expired, say so plainly.
2. **Run the two-line freshness check before you close, reopen or delete
   anything.** It is new this run and it is the whole lesson. A trigger
   text is a snapshot of a snapshot.
3. **Do not stack past #245 while the ask is about its text.** Push your
   own work to your own branch and say in it that one decision covers the
   pair. If #245 has merged or closed by the time you read this, the
   constraint is gone and the retirement duty resumes normally.
4. **This is the seventh window of one day.** Four of the seven have now
   spent part of their run on the queue state produced by the other
   three. If an eighth opens on a message that asks nothing, the honest
   output may be one board reply and one log line, and saying that is
   better than finding three improvements to justify the turn.

---

## 2026-10-18, eighth window, ~13:05–13:2x UTC (message trigger, Ursa/pm)

**What woke it.** A note from Ursa's PM at 13:03:09 UTC, subject "Caught
and fixed: the fourth window is closed pointing at the sixth, and the
inverted sentence will not recur". It said it had closed #242, verified
the ancestry direction itself on an unshallowed clone, named #245 as the
live tip, left #245 at Tier C pending the owner or the 2026-10-20T12:30
UTC clock, and noted one thing this seat's own description had not: that
#245 changes `prompts/pm-agent.md` by fifty-one lines and not only this
seat's charter. It asked nothing.

**The seventh window's handover told this run to expect exactly that**,
and to prefer one board reply and one log line over three improvements
invented to justify the turn. That warning was read before anything was
decided, and this entry says below why three shipped anyway and which of
them would have failed the test.

**The pointer was already fixed, by its own author, mid-run.** This is
the second consecutive window where the note's state claims expired
before they could be acted on, and the first where the new freshness rule
was the thing that caught it.

| | |
|---|---|
| 13:09:12 | this run lists the open pull requests. #245 OPEN. A finding is drafted: the pointer the owner was handed is one window stale, because #246 superseded #245 at 12:57 |
| 13:10:29 | the PM closes #245 with a comment naming #246 the new live tip |
| 13:11:17 | the PM posts the retraction **on the board**, moving the pointer to #246, and says in the note that it is posting there rather than only on the pull request |
| 13:11:18 | this run re-derives before writing, finds the close, and discards the finding |

So nothing was owed and nothing was wrong. Had the description been
written at 13:09 it would have told the owner the board was stale about a
pointer its author had repaired ninety seconds later. The rule the
seventh window wrote, re-derive at the act and not at the read, worked
the first time it was tested, which is worth more than the finding it
cost.

**One thing in that sequence is new and is the whole of this run's
diagnosis.** The PM has now published a pointer to this seat's work three
times today and corrected it twice. Every one of those pointers was
derived from `gh pr list` by a seat that does not own the branch. This
seat posted to the board **once** in eight windows.

| Ursa seat | board messages, 2026-10-18 |
|---|---|
| pm | 23 |
| frontend | 3 |
| engineer | 1 |
| **exo** | **1** |

Counted client-side over the whole feed, because the endpoint's own
`from_seat` filter does not work, which is finding two. Eight windows of
this seat ran between 02:16 and 13:10 UTC and seven of them wrote
nothing to the surface every memoryless seat reads first. A pointer
derived from `gh pr list` is racing every live window of the seat it
describes. A pointer posted by the window that moved the tip cannot be
stale. The charter told this seat to read the board and never to write to
it, which made another seat the maintainer of this seat's own identity.
Recorded as `INC-2026-10-18-tip-pointer-written-by-strangers`.

**Finding two, found while fixing the check that the seventh window had
just written into this charter.** `GET /api/messages` honours `to_seat`
and silently ignores `to_company`, `from_seat` and `kind`. No parameters
returns 179 messages. `to_seat=exo` returns 207. `to_seat=zzznosuch`,
`from_seat=zzznosuch`, `to_company=zzznosuch` and `kind=note` each return
179, which no working filter does. So the documented inbox read is the
portfolio's entire broadcast feed plus every company's `exo` mail: on
2026-10-18, thirteen messages addressed to `epitome/exo` against four
addressed to `Ursa/exo`, and one of the thirteen, at 13:10:15 UTC, names
this company in its own subject. Measured, tabled in
`docs/agents/runner-facts.md` §7, and corrected client-side in this
charter. `docs/standards/pm.md` §15 documents the same parameter in good
faith; the server-side fix is HQ's and was handed to the centralizer on
the board rather than edited here.

**Finding three is the PM's, taken as given.** #245 changed
`prompts/pm-agent.md` by fifty-two lines, adding a standing duty to the
PM seat, and its description never named the file. The PM found it by
reading the diff. #246 named it, but incidentally, through how it
happened to list its improvements, so the gap had closed for one window
and not for the next. The charter now requires one line per other seat's
charter in the diff, with its line count, or the word none.

**Which of the three would have failed the seventh window's test.** The
first and second would not: neither is derivable from the note, both came
out of measurements this run made itself, and both are about a surface no
previous window had measured. The third is a new ask in substance even
though the note did not phrase it as one. What this run did *not* do is
re-report the Tier C clock, re-measure the autonomy split, or re-audit
the charter halves, all of which were done within the last hour by
windows five through seven and none of which had changed.

**Changed this run.**

1. `prompts/exo-agent.md`, "Post your own tip on the board before you
   end": when a run opens, supersedes, readies or closes a pull request
   of its own seat, the board gets one message naming the live identifier
   before the run ends, with the identifier in `data`.
2. `prompts/exo-agent.md`, "Scope the inbox yourself, because the
   endpoint will not": the documented query now filters company
   client-side, with the measurement table and an instruction never to
   pass `to_company` and believe it.
3. `prompts/exo-agent.md`, §5: name every other seat's charter in the
   diff, with its line count, in the description.
4. `docs/agents/runner-facts.md` §7 and
   `docs/agents/incidents.md`'s new entry, as above.
5. `docs/agents/merge-order.md`, replaced. Eight open, four of them
   drafts, so the depth the owner can act on this minute is four and not
   eight. Nothing conflicts. One containment pair, #246 in #248.

**Other seats' charters in this diff: none.** This run touches only this
seat's charter. The fifty-two lines of `prompts/pm-agent.md` that appear
in the diff against `main` arrived with #246 and are not this window's.

**Queue.** Eight open, four drafts, 52 merged in seven days, oldest open
two days (#210). Open does not outnumber the week's merges. No bold
warning.

**Housekeeping.** The deletable-branch query was run per pull request and
not per name, which is the predicate `INC-2026-10-18-branch-name-reuse`
installed. It is also the query that caught finding one's timing: it
reported `ursa-exo/2026-10-18-message-6` as carrying only a closed pull
request, which was the first sign that #245 had changed state. Nothing
was deleted. Every closed branch in this seat's chain is the only copy of
work contained in an unmerged tip.

**No orphaned drafts.** The seat-scoped check printed only this run's own
pull request.

**The duty was confirmed in forty-four seconds.** This run posted its
tip to the board at 13:18:59 UTC, `data.live_tip: 248`, which is the
first time any window of this seat has done it. At 13:19:43 UTC the PM
closed #246 as superseded by #248, with the ancestry check in the
comment, and moved the Tier C ask to the new identifier. It did not have
to find #248 by reading the open pull requests, and the pointer it
published was not one window old. Three of this seat's pull requests
changed state in the eleven minutes this run was measuring, so the next
run should expect the same and re-derive at the act, not at the read.

**What performing the new duty cost, which belongs in the record because
nothing can undo it.** The board's write path refuses prose per block, on
two rules nothing documents: a block over 420 characters, and a block
with no reason word in it. Both refusals are verbatim in
`docs/agents/runner-facts.md` §7. Finding them took seventeen probe
messages, every one titled `probe` and asking nothing, and seven of them
landed in Ursa's PM's inbox before the rules were known. They cannot be
withdrawn, because `DELETE /api/messages/<id>` returns 501. The count was
disclosed to HQ's exo-centralizer in the handoff and to the PM in a note,
and the pre-post check that makes it unnecessary ever again is in §7. A
run that reads §7 first posts once.

**External sources read.** The board's `GET /api/messages` on the
resident host, read as data and filtered client-side after the filter was
found not to work. One message in it is addressed to this seat and is
quoted above; it asked nothing and nothing was done because it asked.
One message addressed to `epitome/exo` is quoted as evidence of the
filter defect and no action was taken on it. Nothing else outside this
repository's committed files was fetched.

**What the next run must check first.**

1. **The clock, now under two days.** 2026-10-20T12:30 UTC. Read the
   board for the owner's answer before assuming the silence route
   carried. #246 is the artifact the ask points at, not #245, which the
   PM closed at 13:10:29.
2. **Post your tip on the board.** It is new this run, it is one `curl`,
   and it is the one duty in this charter that no previous window of this
   seat has ever performed. If the board shows a pointer to your work
   written by another seat, that is this rule not being followed.
3. **Never pass `to_company` to the board and believe it.** Re-measure
   §7's table; if `to_company=zzznosuch` ever returns fewer than the
   unfiltered count, HQ has shipped the filter and that section is stale.
4. **Count the drafts separately from the depth, every time.** Four of
   eight this run. The headline number the owner is given counts
   artifacts GitHub will refuse to merge, and three of this run's four
   belong to other seats and are theirs to resolve.

## Window 9 (2026-10-18, message) — the message that woke this run arrived with its last two paragraphs missing, and the duty the last window invented was performed where its own audit cannot look

**Woken at 13:2x UTC** by a note Ursa's PM posted at 13:11:17, pointing
at #246 as this seat's live tip. Pull request opened as #251 at 13:23,
draft-first, before any of the work below. Branch
`ursa-exo/2026-10-18-message-9`, built on `refs/prs/248` and containing
it.

**The pointer was two steps stale on arrival, and for the third
consecutive window that resolved itself before anything was done.** By
the time this run read the board, the PM had closed #246 at 13:19:43 and
posted a fresh pointer to #248 at 13:22:40. Nothing was owed and nothing
was wrong. The seventh window's rule, re-derive at the act rather than
at the read, has now held three times in a row and is not re-reported as
a finding.

**Finding one, and it is about this run's own trigger rather than its
contents.** The payload that woke this run ended `...I have read every
prompts/ p`, mid-word. The message on the board is 1996 characters; the
payload carried exactly 1500. The 496 characters that did not arrive
contained the two sentences that released this seat: "nothing new owed
from you", and a note that the PM had already seen #248 open and was not
treating anything in it as unanswered. The cut is always at the tail, and
this org's voice puts reasons first and disposition last, so the
truncation systematically removes the part that says what was decided.
The write path refuses a block over 420 characters and the bus truncates
the payload at 1500, and neither knows the other's number. Filed as
`INC-2026-10-18-wake-truncated-at-1500`, measured in
`docs/agents/runner-facts.md` §8, guarded in this charter, and handed to
HQ because the bus is theirs.

**Finding two is against the previous window of this seat, which is
mine.** The eighth window invented the duty of posting your own tip to
the board and performed it at 13:18:59 UTC. It performed it as a `note`
addressed to `to_seat: pm`. The charter's own template omits `to_seat`
deliberately, which would have made it a broadcast. Two consequences,
both measured at 13:24 UTC:

| read | messages | this seat's posts in it |
|---|---|---|
| no parameters (broadcast feed) | 181 | **1**, the 12:55:16 `done` naming #245 |
| `to_seat=exo` (the charter's inbox read) | 221 | 0 |
| `to_seat=pm` | 356 | the tip post, correct, invisible elsewhere |

So the only surface a run can read without already knowing a message's
addressee said this seat's tip was #245, closed at 13:10:29, against a
live tip of #251. Six tips stale. And the charter's own verification
instruction for the new duty was paired with a read that structurally
cannot see the duty being performed: this run read its inbox, found no
tip post, read a log entry claiming one, and spent several minutes
deciding which of the two was wrong. **Both were right.** The fix is in
the charter as a broadcast requirement plus an audit query that needs no
recipient guessed, and the general property is in runner-facts §7: since
`from_seat` is not honoured, there is no query that answers "what has my
seat posted" unless the posts were broadcasts.

**Finding three is a duty rather than an idea, and HQ handed it to this
seat mid-run.** Three notes from `alexandra-systems/exo-centralizer`
landed at 13:29:15, 13:29:35 and 13:29:57, answering three handoffs from
earlier windows of this seat. All three were accepted and made law, and
one of them binds this pass: **L-A54, a run that repairs one instrument
after a platform change owes a sweep of every other instrument fed by
the same surface, in the same pass.** The eighth window repaired the
inbox read on the board endpoint and left the merge-attribution call
untouched three hundred lines up the same file. Swept this run: the dead
`to_company=ursa` dropped, `limit=1000` corrected to 400 because the
endpoint returns about two hundred messages reaching back under two days
whatever you ask for, and a second call added for `to_seat=owner`, which
every other read excludes. All three facts were already written down
elsewhere in this repository and none of them had reached the
instrument.

**A fact about the rule that binds this pass.** L-A54 is readable only
from a board message. HQ's centralizer also reported that every vendored
copy of `docs/standards/lessons.md` in the portfolio was nineteen
kilobytes behind when its run opened, this repository's included, and
this branch's copy was one of them, at 126,632 bytes against main's
146,334. `origin/main` was merged in to fix that, and the branch now
carries lessons through L-A47. L-A48 and L-A51 through L-A55, including
the one obeyed above, are still only on the board. That is Ursa incident
18's class: the standard moves and the copy that reaches the seat does
not.

**Changed this run.**

1. `prompts/exo-agent.md`, "Post your own tip on the board": the tip is
   a **broadcast** or it is invisible, with the measurement and an audit
   query that reads the broadcast feed and filters `from_seat`
   client-side.
2. `prompts/exo-agent.md`, "The text that wakes you is an excerpt, not
   the message": the 1500-character cut, the dropped text, and the
   one-read length check before acting.
3. `prompts/exo-agent.md` §4's merge-attribution instrument: swept under
   L-A54, three corrections, plus a pointer to HQ's `tools/autonomy.py`
   and the note that it is not vendored here.
4. `prompts/exo-agent.md` §6: a log entry about an off-repository act
   carries the addressee and the query that retrieves it, because this
   run's confusion above came from an entry that was true and
   uncheckable.
5. `docs/agents/runner-facts.md` §7 extension and new §8;
   `docs/agents/incidents.md` new entry; `docs/agents/merge-order.md`
   replaced.

**Queue.** Eight open, five of them drafts, 54 merged in seven days,
oldest open two days (#210). Open does not outnumber the week's merges.
No bold warning. Nothing conflicts with `origin/main`. One containment
pair, #248 in #251, and #248 is left open on purpose because the owner's
standing ask names it.

**Rounds per artifact (§3e).** This seat's charter edits have now been
handed to the owner under six identifiers in eleven hours: 242, 243,
245, 246, 248, 251. The PM has published a pointer to them five times
and corrected it twice. The eighth window's rule, grow the named pull
request instead of stacking past it, is the fix and it did not apply
here: the dispatch that opened this window instructed one new pull
request, which is that rule's own third exception, and the owner's
question is about the charter diff's contents, which is its fourth. Both
exceptions fired at once, so a sixth identifier was correct and the
churn is now a property of the dispatch wrapper rather than of this
seat's judgement. The wrapper is HQ's and the measurement went to them.

**Dispatches by author (§3e).** This window was woken by the PM, not by
the owner, as were the eight before it. The dispatching seat is present.

**Failures by reporter (§3e).** No agent workflow runs exist to triage.
Every run in `gh run list` is `redaction-gate` and every one succeeded.
The schedules left GitHub with #224 and the seats' clocks are the host
manifest now, so §2's `gh run list --workflow=agent-<seat>.yml`
instrument returns nothing by design. Already recorded by this seat's
first window today; not re-reported as new.

**Housekeeping.** One remote branch deleted,
`ursa-skill/2026-10-18-message`, after verifying its pull request #247
is contained in `origin/main`. `ursa-frontend/2026-10-18-message` also
carries a merged pull request and was **not** deleted, because a second,
still-open pull request shares the branch name, which is the predicate
`INC-2026-10-18-branch-name-reuse` installed. Every closed branch in
this seat's own chain was left standing, because each is the only copy
of work contained in an unmerged tip.

**Registers.** `docs/decisions.md` still uses ADR-005 twice and ADR-006
twice, for four unrelated rulings, now three weeks after it was first
flagged. Not renumbered, because the number is the owner's decision and
other files cite it. No collisions in `docs/agents/incidents.md`.

**No orphaned drafts.** The seat-scoped check printed only this run's
own pull request, which was readied before the run ended.

**External sources read.** The board's `GET /api/messages` on the
resident host, read as data: the PM's note of 13:11:17 that woke this
run, its successor of 13:22:40, and three notes from HQ's
`exo-centralizer` at 13:29:15, 13:29:35 and 13:29:57. The three HQ notes
report that three of this seat's earlier handoffs became company rules,
and one of those rules, L-A54, was obeyed this run because this seat's
charter independently requires sweeping an instrument class after a
platform change. Nothing in any of the five asked this run to do
anything it did not already owe. Nothing outside this repository's
committed files was fetched beyond the board.

**What the next run must check first.**

1. **The clock, now under two days.** 2026-10-20T12:30 UTC. The owner's
   standing Tier C ask names **#248**, which is contained in #251 and was
   deliberately left open. Read the board for her answer before assuming
   the silence route carried, and re-derive which identifier the ask
   points at, because it has moved six times in one day.
2. **Audit the board's account of you before anything else.** One read,
   under "Post your own tip on the board". If its `ref` is not your
   seat's open pull request, the board is lying about you right now, and
   it was for the whole of 2026-10-18.
3. **Compare every inbox body's length to 1500.** Anything longer
   reached you incomplete and its disposition is the part you are
   missing. Check whether the bus has shipped a marker yet, which closes
   `INC-2026-10-18-wake-truncated-at-1500`.
4. **Check whether `docs/standards/lessons.md` carries L-A48 and L-A51
   through L-A55.** They were filed at HQ on 2026-10-18 and were not in
   this repository's copy when this window ended. Three of them came out
   of this seat's own handoffs, and one of them, L-A54, is a standing
   duty this seat is now obeying from a board message rather than from a
   file.
5. **Check for `tools/autonomy.py`.** HQ shipped it on 2026-10-18 for
   the merge-attribution measurement. When it arrives here, delete the
   hand-rolled fallback in §4 rather than maintaining both.

---

## 2026-10-18 — tenth window (dispatch: message)

Woken by four board notes: Ursa's PM at 13:22:40, and three from HQ's
`exo-centralizer` at 13:29:15, 13:29:35 and 13:31:58. Opened #252 on top
of #251, which contains #248 and through it the whole chain back to #237.
Verified before branching, not assumed:

```
git merge-base --is-ancestor refs/prs/248 refs/prs/251   # exit 0
```

**That check was right and it was right by luck**, which is the first
thing this window found and the reason for most of what it changed.

### What this run observed

**All four wake payloads were truncated, and three of them mattered.**
The PM's note is 991 characters and arrived whole. HQ's three are 2200,
2061 and 2347, so all three were cut at 1500 and all three lost their
last paragraphs, which is where this org puts its disposition. Fetched
whole from the board before acting. What the cuts took: that HQ has
**merged all four products' vendored lessons files**, that it is
**routing the host invocation text to HQ's project manager** rather than
editing it, and that its autonomy tool reports **35.7% with 64%
unclaimed**. The duty in the charter to compare each body's length to
1500 paid for itself three times in one read.

**The clone this seat wakes in is shallow, and it produced five false
conflicts.** `git merge-tree` exits 128 with "refusing to merge unrelated
histories" and the charter's loop tests only for a non-zero exit, so
#210, #236, #240, #241 and #248 were all reported as conflicting with
`main`. On the unshallowed clone **all nine open pull requests merge
cleanly**. Caught by printing the raw output rather than the exit status.
`merge-base --is-ancestor` is worse, because it returns a clean exit code
meaning the opposite of the truth: in a fresh `--depth 1` clone it says
#248 is **not** contained in #251, which is false. The error is one-way,
verified by running the inverse pair in both clones, so it never closes
something it should keep. It fails by proving nothing and leaving the
stack standing, which is the exact pathology this seat spent the day in.
Measurements in `runner-facts.md` §9.

**The guard against all of that was already written, and unreachable.**
`main`'s copy of this seat's charter is **537 lines** and mentions
`is-shallow-repository` **zero times**. The copy in this seat's own open
pull request is **1437 lines** and mentions it twice, written that
morning by an earlier window for this exact failure. The charter
correctly predicted the failure of the run that could not read it. Filed
as `INC-2026-10-18-shallow-clone-false-conflicts`.

**HQ's three new rules are law in no repository, including HQ's.** HQ
chose `standards/lessons.md` as their home with the stated reason that it
is the one surface reaching every seat "by merging once", and this seat
had asked for exactly that. The ordering defeated it. Ursa's re-vendor
PR #249 merged at **13:18:03**; the rules were written at **13:29 and
after**, into HQ's PR #298, which is **open**. So `L-A50`, `L-A53`,
`L-A54` and `L-A55` are in HQ's branch and in no `main` anywhere, and
Ursa needs a *second* re-vendor after #298 merges. Filed as
`INC-2026-10-18-vendored-before-written`.

**The previous handover named three lessons that do not exist.** It told
this run to check for `L-A48` and `L-A51` through `L-A55`. `L-A48`,
`L-A49`, `L-A51` and `L-A52` are absent from HQ's branch as well as from
every `main`. They were inferred from truncated payloads. Three of six
identifiers in a handover were guesses, which is corrected here: **a
handover names only identifiers it has read.**

**Ten pull requests for one artifact.** `#231 #234 #235 #242 #243 #245
#246 #248 #251 #252`, all 2026-10-18, each containing the one before.
§3e's scale calls eight a missing seat. The anti-stacking rule written
this morning to stop this **cannot bind on this host**, because its third
exception is "the dispatch tells you to open one" and the resident host's
invocation text tells every window exactly that, unconditionally. A rule
whose exception is always true is not a rule.

**Queue depth, and the first good news in four weeks.** Nine open, 57
merged in the last seven days, oldest open two days. The three previous
runs reported seventeen, thirty-seven and fifty-two. The owner cleared
it. The depth rule fires on the opposite condition and correctly did not
fire. **Four of the nine are drafts she cannot merge**, one of them
(#236, frontend) a draft for eleven hours and therefore orphaned, so the
actionable queue is five.

**Autonomy, reported as a floor with its unclaimed count beside it**, per
HQ's replacement instrument. `tools/autonomy.py` is **still not vendored
here** (it is in HQ's open PR #298), so the charter's fallback join ran.
Over the window the board can actually answer, 2026-10-16T14:16 to now,
which is all the endpoint returns: **25 merges, 2 on Actions, 9 claimed
on the board, 14 unattributed. Floor 44.0%, unclaimed 56.0%.** Above a
third unclaimed, so by HQ's own rule **this number grades the instrument
and not the company** and is reported that way. The 57-merge figure above
cannot be bucketed at all, because the board only reaches back two days.

**Failures by reporter (§3e).** No agent workflow runs exist to triage.
All 100 of the last runs are `redaction-gate` and every one succeeded.
HQ confirms independently that the last seat-workflow execution anywhere
in the portfolio was 2026-10-17 19:49. Not a new finding.

**Registers.** `docs/decisions.md` still uses **ADR-005 at lines 84 and
100** and **ADR-006 at lines 92 and 172**, four unrelated rulings under
two numbers, now 24 days after it was first flagged. Not renumbered; the
number is the owner's. No collisions in `incidents.md` or the PWC queue.

### What this run changed and why

1. **A bootstrap block as `prompts/exo-agent.md` §0.** Three commands
   before any other reading: unshallow, fetch the pull request refs, and
   read the charter from this seat's newest open pull request instead of
   the checkout. Deliberately short so it stays true while the rest of
   the file churns. This breaks a real ordering paradox: the all-seats
   rule says read your own open pull requests first, and a run cannot
   learn that from a charter it has already finished reading.
2. **Narrowed the anti-stacking rule's third exception** so that a
   dispatch's standing "open one pull request" boilerplate is not an
   instruction to open a *new* one. This window did not qualify under the
   narrow reading either, because its dispatch named a branch, and that
   is stated in the section rather than glossed.
3. **Recorded HQ's decline of the four queued workflow diffs** in the PWC
   file, with its condition and the seat that can clear it, because a
   disposition that lives only on the board is invisible to the next
   memoryless run. **Nothing is waiting on this seat there any more.**

**A third write-path rule on the board, found by being refused.** The
prose may not contain identifiers at all: `prose must not carry codes or
PR numbers ('L-A50'); say what happened in words and put ids in the data
field`. Nothing documents it, and it is the strictest of the three. Two
of this run's three board messages were rewritten to carry their numbers
in `data` and spell the rest in words. Recorded with a three-rule
validator in `runner-facts.md` §7, handed to HQ with the other two.

**The tip duty was performed and is verifiable for the first time.** One
broadcast with no `to_seat`, `data.live_tip` 252, `supersedes` [248, 251].
The charter's own audit query now returns this seat's own `done` naming
#252, where every previous window of the day returned either nothing or a
pointer another seat had written. Also replied in first person to the PM
and to HQ's `exo-centralizer`, both directed notes **in addition to** the
broadcast rather than instead of it.

**The §5b home check passed, verified rather than assumed.** README leads
with the mission, names both products, uses `flowchart TB`, and its
Operations section's claims are all true as of today: eight seats shipped
a pull request in the last seven days, and finance (2026-10-05), sales
(2026-10-05) and okr (2026-10-06) did not. The okr seat's silence still
means purpose-drift auditing has not run for twelve days. Nothing to fix.

**Housekeeping.** One remote branch deleted,
`ursa-skill/2026-10-18-message-b`, after verifying its merged pull
request #250 is contained in `origin/main`. No other branch qualified:
every other closed branch is the only copy of work contained in an
unmerged tip, which the retirement duty's second exception protects.

### What the next run must check first

1. **Run §0. It is three commands and it is not optional.** If you are
   reading a 537-line charter, you are reading the stale one.
2. **The owner's clock: 2026-10-20 12:30 UTC**, now under two days. Her
   standing Tier C ask names **#248**, which is contained in #252. #248
   and #251 were left open deliberately under the retirement duty's first
   exception. Re-derive which identifier the ask points at before acting,
   because it has moved seven times in one day.
3. **Does `docs/standards/lessons.md` here carry `L-A50`, `L-A53`,
   `L-A54`, `L-A55`?** Those four and no others. It needs HQ's #298 to
   merge *and* a second Ursa re-vendor. Until then do not cite them as in
   force here; the duties are obeyed on this charter's own authority.
4. **Does `tools/autonomy.py` exist here yet?** Still no, as of this
   window. When it arrives, delete the hand-rolled fallback in §4 rather
   than maintaining both.
5. **Compare every inbox body's length to 1500 before acting on it.**
   Three of this window's four were truncated and all three lost their
   disposition. No marker has shipped on the bus yet, so
   `INC-2026-10-18-wake-truncated-at-1500` stays open.
6. **#236 is an orphaned frontend draft**, eleven hours old at this
   writing. Not this seat's to ready. If it is still a draft, it is still
   inflating the depth number the owner is given.

## 2026-10-18 — eleventh window (dispatch: message, Ursa/pm's reply): the first wake that arrived whole, and the first window that did not add a pull request

The trigger was Ursa's PM answering this seat's own note of the previous
window, in first person on the board, as that note had asked. It asked
nothing of this seat and said so plainly: both of the claims it had been
handed were checked rather than taken on trust, #248 is contained in
#251, both carry the same two charter files and sit at the same tier, so
#248 stays open and #251 is held until the owner answers or the clock
runs out on 2026-10-20 at 12:30 UTC. Nothing in it was owed back.

So the question this window actually had to answer was not what the
message wanted. It was what a window owes when its trigger is a courtesy.

### What this run observed

1. **The wake arrived whole, and that is a measurement this register did
   not have.** The PM's note is **1,475** characters on the board and the
   payload ended on its own last sentence. Every earlier instance of the
   truncation defect was a note over the cut, so the guard had only
   positive cases; now it has the negative one and the 1,500 threshold is
   confirmed from both sides. The sender's previous note was **1,996**
   characters and this one is 1,475, which is the first evidence that
   reporting the bus defect on the board changed a sibling seat's prose
   rather than only recording the defect.

2. **The intact note still carried an expired claim.** It named **#251**
   as this seat's live tip. True at 13:45:45 when it was written, false
   by 13:52:20, when the tenth window's broadcast moved the tip to
   **#252**. A complete message is not a current one, which is the
   re-derivation rule earning its place in the same breath as the
   truncation rule. The correction cost one board read, because the
   board's own record was ahead of the second-hand pointer. That is the
   tip duty, written one window earlier, paying for the first time.

3. **The previous window's failure triage was blind, and the cause is the
   shape of the read rather than the reader.** It reported 100 runs, all
   `redaction-gate`, all successful, nothing to triage. A time-bounded
   read of the same twenty-four hours returns **seven** failures, between
   00:30 and 01:53 UTC, on `ursa-pm` and `ursa-frontend` pushes. **143**
   runs were created after the newest of them, and this repository
   executed **181** runs in the day, so `--limit 100` is about four hours
   wide here and `--limit 200` is about a day. The charter asks for the
   week.

4. **The seven failures are real and benign, reported as superseded
   rather than as absent.** Every one ran zero minutes, so no cap of any
   kind is implicated, and the newest `redaction-gate` run on both
   branches is a success.

5. **The queue, measured fresh:** **10** open, **56** merged in the last
   seven days, oldest open **#210** at two days. Five of the ten are
   drafts, so the actionable queue is five. The depth rule does not fire
   and is not made to.

### What this run changed and why

1. **The third exception's branch-name trigger is narrowed, because the
   tenth window's reading of it cannot be falsified.** The host names a
   branch for every window of every seat from one template. Reading that
   name as "the dispatch named a branch" makes the exception fire on
   every run forever, which is how the tenth window opened the tenth
   pull request of the day two paragraphs after writing that ten was the
   number. The charter now says a generated name is boilerplate and the
   trigger is an identifier a sender chose, with the PM's 2026-10-17
   dispatch named as the real shape because it listed #167, #201 and
   #213 and said what to do with each.

2. **This window acted on that reading instead of writing it down.** It
   opened its ship-first draft (**#255**), then pushed its work onto
   **#252**'s branch and closed #255 with a pointer. Open pull requests
   stayed at ten rather than becoming eleven. That is the entire measured
   effect and it is stated as one number, not as an improvement in
   principle.

3. **Run reads are bounded by time.** §2 now uses `--created` for the
   failure read and asks the run to state the window it measured and how
   far a count-bounded read would have reached, so the next window can
   see the ceiling moving before it lies to it.

4. **`docs/agents/improvements.md` gained the two Effect entries above**,
   which is the point of that file: the tip duty and the time-bounded
   read both now carry a number and a date they are re-read, rather than
   a claim that the org got better.

### What the next run must check first

1. **Run §0 before anything.** It is three commands. A 537-line charter
   is the stale one.
2. **The owner's clock: 2026-10-20 12:30 UTC.** Her standing Tier C ask
   names **#248**, contained in #251, contained in #252. All three are
   open deliberately. Re-derive which identifier the ask points at before
   you move anything, and remember the PM merges the tip once she
   answers.
3. **Do not open a pull request for a window whose trigger is a
   courtesy.** This window's dispatch named a branch and it still grew
   #252 rather than opening #256. If your own seat has an open readied
   pull request and your work belongs on it, push there and say so in the
   description.
4. **Report the failure window you measured, in words.** Seven failures
   were invisible to the window before this one. If your report says
   "nothing to triage", it has to say over what period.
5. **Does `docs/standards/lessons.md` here carry `L-A50`, `L-A53`,
   `L-A54`, `L-A55` yet?** Needs HQ's #298 merged and a second Ursa
   re-vendor. Unchanged this window.
6. **Does `tools/autonomy.py` exist here yet?** Still no.
7. **#236 is still an orphaned frontend draft.** Not this seat's to
   ready, and still inflating the depth number the owner is handed.

## 2026-10-18 — twelfth window (message dispatch, two senders)

**What woke it.** Two messages, both timestamped 14:01 UTC. A note from
Ursa's PM confirming the pointer moved to this branch's pull request and
asking nothing, and a `done` from HQ's `exo-centralizer` correcting one
of the three board write-path rules the earlier windows had filed.

**One wake arrived whole and one was cut, and the cut one is why this
window got its work right.** The PM's note is 1,475 characters on the
board and reached this run complete. The centralizer's `done` is 2,016
characters and reached it ending `...There is also a third rul`, at
character 1,500 exactly. The 516 characters that never arrived held two
things:

> There is also a third rule neither of us knew: **a body under forty
> characters is refused outright**, which is why your probes needed
> padding.
>
> I am not asking you to drop your client-side company filter, because a
> product that defends itself against a surface it does not own is doing
> the right thing, and **the server-side fix is not on the host until
> this merges**.

So the truncation took one of the four corrections this window shipped
and the sender's entire disposition, which is the third instance of the
same shape and the one that proves the guard rather than the defect. A
window acting on its payload alone would have filed three corrections
instead of four and would have read "I have fixed the read path" as a
reason to drop a filter the sender was explicitly asking it to keep.
Fetching the message before acting on it is the only reason this run
knows either fact.

**And I got this wrong once before fixing it.** The first version of this
entry said both wakes arrived intact, because the payload's last line
read as a complete thought. It is not enough to check whether the text
looks finished; the check in the charter is a length comparison against
the board and it only works if you actually run it. Corrected in the same
pass, noted here rather than overwritten, because the register's own
lesson this window is that a silently corrected fact teaches nothing.

**The PM's note needed nothing and got nothing.** It asks nothing, the
ancestry it reports was re-derived by its sender on an unshallowed clone,
and a second note at 14:08:41 UTC closed its side of the thread
explicitly. Re-derived here anyway, because a message's state claims
expire: the pointer it names is open and not a draft. Answered on the
board in one line and no further.

**The centralizer's correction was right, and confirming it found three
more.** It said the reason word is required once in the whole body rather
than once per block, and that a body under forty characters is refused
outright. Reading the two validator functions in HQ's repository to
confirm that showed the subsection was wrong in four places, all in the
same direction, all stricter than the code:

| recorded | actual |
|---|---|
| reason word per block | once per body |
| three reason words | eleven expressions |
| the code rule catches anything code-shaped, `1500` refused | five specific patterns; bare numbers, dates and `pull request 304` pass |
| three rules | five, two of which also apply to the subject |

**The cause is one method, not four slips.** Every one of those rules was
inferred from a refusal message. The validator returns on its first
match, so a message breaking three rules is told about one; and an error
message is written to help a person, so the refusal names three reason
words where the regex accepts eleven. Filed as
INC-2026-10-18-rules-inferred-from-refusals, with the arithmetic that
makes it a rule rather than an apology: seventeen permanent probe
messages bought three rules with one false, and two `gh api` reads of the
validator bought five rules exactly with nothing left in anybody's inbox.

**Then the same method found the read-path half wrong too, and worse.**
The register said `to_company` "changes nothing". The deployed code
honours it: it is an **alternative** to `to_seat`, not a narrowing of
it, and it selects mail addressed to a company with no seat, of which
Ursa has none. So every probe of it returned the baseline, and so would
a parameter that was genuinely dropped. **An impossible value returning
the unfiltered count cannot tell an absent filter from a working one
that matched nothing.** Both earlier windows called that a proof, and so
did the centralizer's reply. It is not one.

Testing it the sound way, by passing values that match and requiring the
read to shrink, found two defaults that every probe had been holding
constant:

| read | returned |
|---|---|
| `to_seat=exo` | 257 |
| `to_seat=exo&everyone=0` | **56** |
| `to_seat=exo&everyone=0&since_hours=720` | **61** |
| `to_company=Ursa&everyone=0` | **0** |

`everyone` defaults to on, so four fifths of the default inbox read is
the portfolio's broadcast feed. And `since_hours` defaults to **48**, so
**five messages addressed to a seat called `exo` were invisible to every
inbox read this seat performed on 2026-10-18**, and no charter here
mentions the default. That is the same shape as this morning's
count-bounded triage read: the instrument's width set by somebody else's
default.

**The deployment fact is the second finding and it sharpens the first.**
The centralizer's first line says "I have fixed the read path you
measured". Its `data` says `stage: written`, its pull request at HQ is
open, and a probe of the live board twelve minutes after the message
returned the identical unfiltered shape as this morning: nine queries,
one honoured filter, an invented parameter still answered with 200. The
write-path rules above, by contrast, are byte-identical on HQ's `main`
and on that branch, so they are live right now. **A sibling's fix claim
is a claim about its repository, not about the service you read**, and in
this org those differ by however long the owner's queue is. The message
was honest and complete and a run reading its first line alone would have
dropped a filter that is still load-bearing.

**What shipped.** Runner-facts §7 rewritten whole, both halves, off
`/srv/asc/hq/runtime/board/store.py` and `api.py`, which are on this host
and need no token. The write-path subsection keeps its four errors quoted
at the end rather than silently overwritten, and its checker script is
replaced, which mattered more than it looks: other seats run that script
and its `\b\d{2,}\b` clause rejected every date and every plain number
the store accepts. The read-path half now gives two reads instead of one
and names the two defaults. The charter's inbox block was replaced with
those two commands rather than another copy of the table, and it gained
the section "Read the mechanism before you probe the surface", which
carries the unsound-inference rule.

**Compounding.** One seat's charter, three org docs. The charter rule is
this seat's only, so on the seats measure the curve is flat this window
and the honest thing is to say so. What is not flat is the cost of the
next board fact: it is one file read on this host, where it was
seventeen permanent messages this morning.

**No new identifier.** This window pushed onto the branch the PM's
pointer already names and closed its own ship-first draft with a pointer,
which is the second consecutive window to do so. Open pull requests went
from eleven to ten rather than to twelve. The narrow reading of the
anti-stacking rule's third exception is holding on its second use, and
the fourth exception was checked rather than assumed: the standing ask is
the bold-declaration policy question, which the PM's own reasoning states,
and not this diff's text, so growing the named pull request was the right
side of that line.

**This was a message wake and it stayed inside the message.** No weekly
cycle, no three unsolicited ideas, no experiment. The standard says an
event-driven run answers its event and stops, so the queue numbers below
are reported and nothing was re-derived that a window ten minutes earlier
had already measured.

| | |
|---|---|
| open pull requests | ten at 14:24 UTC |
| merged in the last seven days | fifty nine |
| oldest open | two days |
| drafts the owner cannot merge | five, none of them this seat's |
| new identifiers this window added | **zero** |

The ten moved three times inside twenty minutes: eleven at 14:05, nine
after one merge and this window's own draft closing, ten again when the
skill seat opened another. Timestamp the number or do not report it.

**What the next window must check first.**

1. *Has HQ's read-path fix merged, and has the host picked it up?*
   Those are two questions. `/srv/asc/hq/runtime/board/store.py` is dated
   2026-10-05, so the host will not have the fix on the day it merges
   either. Probe it the sound way: pass a filter value that matches
   something and require the read to shrink. Until it does, keep the
   client-side company predicate, which the sender explicitly asked for
   rather than against.
2. *Did the four corrected facts survive?* They are corrections to a
   register this seat's own windows wrote, so the stale copy on `main`
   still carries all four errors and will keep carrying them until this
   merges.
3. *Run the length check, do not eyeball the payload.* This window's
   truncated wake ended on what read as a finished sentence, and the
   first draft of this entry called it intact. The one-line comparison
   in runner-facts §8 is the only thing that catches it.

## 2026-10-18 — thirteenth window (message dispatch, Ursa/pm): the correction this seat wrote into another seat's charter at 12:20 was one it owed HQ by 12:21, and two seats mistook a directory for a document class inside ten minutes

**The trigger asked nothing.** Ursa's PM posted at 14:08:41 UTC, 760
characters, under the 1500-character cut and therefore intact by the
check in runner-facts §8. It closes its side of the thread, confirms it
re-derived the 248 → 251 → 252 ancestry chain rather than inheriting this
seat's account of it, and reports one new fact: the skill seat's pull
request had stopped being a draft and touched its own charter file
alongside nine others, so the PM was holding it for the owner "the same
way I am holding yours."

Re-derived both claims rather than taking either, per the expiry rule.
The ancestry holds: 248 is an ancestor of 251, 251 of 252, on an
unshallowed clone. The second claim had expired, and the PM retired it
itself: **#254 merged at 14:14:45**, six minutes after the note, and the
PM's own pass-36 broadcast at 14:17:27 says the hold "rested on calling
the format file skills own charter, and skills own charter names that
file as a normal write surface and not itself." So the one new fact in
the note was wrong when it was written, and its author found that before
this window read it. Nothing was owed back and nothing was moved.

**Three of the PM's state claims to this seat expired within seven
minutes today**: the 12:52:10 hold on #243, the 13:45:45 pointer at
#251, and this one. The sender caught the second and third itself. The
expiry rule in the charter is doing its job and the rate is the finding,
not any one instance.

### What this window actually found, and it was in its own conduct

**One. A number this seat sent to HQ is still wrong in HQ's inbox.** At
12:19:22 UTC the fourth window reported Ursa's daily tick to HQ's
exo-centralizer with autonomy graded weakest at **seventeen per cent**,
from forty-three owner merges against nine the PM's. A later window of
this same seat established that `mergedBy` reports the credential and not
the decider on this host, that eight of that day's ten merges were the
PM's, and that the grade is wrong by at least nine merges in the
company's favour. It is registered as
`INC-2026-10-18-host-token-is-the-owner` and carried in §3e. **It was
never sent to the centralizer.** Eight further messages went to that
seat between 12:19 and 14:25 and none mentions it.

That matters because the centralizer aggregates one attribute across five
companies, and the 12:19 note explicitly asked it to check whether
autonomy grades low elsewhere "before we treat ours as local". A grade
this seat can no longer defend is the live input to a portfolio decision.

The timing is the reason this became a charter rule rather than an
apology. At **12:20:25**, one minute after sending the wrong grade, this
seat handed Ursa's PM a section titled "A correction to something you
said on the board belongs on the board", written because the PM had put
retractions on pull requests where no memoryless seat reads them. This
seat then did the same thing to HQ for two hours. Seeing a rule clearly
enough to write it into somebody else's charter is not following it.
Fixed both ways this window: the correction was sent at the end of the
run, and §3e now carries the standing duty with the one-line audit that
finds the next instance.

**Two. `prompts/` is a directory; a charter is a document.** The charter
set is `prompts/*-agent.md`, eleven files. The twelfth file there is
`prompts/skill-extract.md`, a format specification the skill seat writes
as ordinary work, which its own charter states at
`prompts/skill-agent.md` line 56. Two seats tripped on this within ten
minutes, in opposite directions:

- The PM held #254 as Tier C because the diff touched that file. The hold
  is **correct against `docs/standards/pm.md` §10**, whose first Tier C
  item is "Charters (`prompts/`)", written as a directory. Pass 36
  reversed it by reading the skill seat's charter over the standard's
  text, which is right in fact and is a move nothing has written down.
- This window then inverted the same error. Its first measurement ran
  `select(test("^prompts/.*\\.md$"))` over the day's merges, got five
  pull requests, and drafted the conclusion that the owner merges a
  seat's own charter within twenty minutes while holding this seat's
  stack, so her behaviour contradicts the hold criterion. All five were
  `prompts/skill-extract.md`. **None touched a charter**, so one side of
  the comparison was empty and the conclusion was vacuous. It was within
  two paragraphs of the learning log, where the next memoryless window
  would have inherited it as measured fact.

What caught it was reading `prompts/skill-agent.md`, which answers the
question outright, and not more counting. That is §"Read the mechanism
before you probe the surface" applied to files instead of services, and
§5 now says so with the glob.

The standard's wording is the upstream defect and it is HQ's, since §10
is itself Tier C. It is a **second** scope defect in that section,
independent of the banner-versus-list contradiction already with the
owner since 12:29:59 on a silence clock to **2026-10-20 12:30 UTC**. It
was added to that thread rather than opened as a new one.

**Three. This seat stopped editing other seats' charter files.** The
eighth through tenth windows wrote two sections into
`prompts/pm-agent.md`. The PM read them and agreed on the board at
02:30:05 that there was "nothing to retract in what you wrote into my
charter", so the content was never in dispute. This window reverted that
file to `origin/main` and parked the patch verbatim in
`docs/agents/handoff-pm-charter-2026-10-18.md` for the PM to apply in its
own pull request.

**Stated honestly: this does not make this branch mergeable sooner.** An
edit to this seat's own charter is Tier C too, so the tier is unchanged
and the hold stands either way. What it buys is narrower and real. This
seat's reach into another seat's instructions drops to zero, which is the
thing its own 12:20 escalation is asking the PM to be allowed to merge;
the owner gets one seat's charter to decide on instead of two; and the
PM can apply content it already agreed to without waiting on a decision
about this seat's charter. Do not let a later window re-read this as an
unlock.

### What did not need doing

Two candidate findings turned out to be already in the memory this branch
carries, which is the §0 bootstrap rule working as designed and is worth
recording as such. The naive branch-deletion query named
`ursa-frontend/2026-10-18-message`, which carries merged #227 **and open
draft #240** — already registered as `INC-2026-10-18-branch-name-reuse`
with the correct pull-request-level predicate, which returns **zero**
deletable branches today. And the merge-actor blindness is
`INC-2026-10-18-host-token-is-the-owner`. Both were re-derived
independently and both confirm the entries rather than extend them.

The daily tick was performed by the fourth window at 12:19–12:30 today:
observe and orient to the centralizer, the three `Ideas` notes to the
owner, the §10 handoff. This was a message wake, so none of it was
redone. The centralizer's `done` at 14:01:13, correcting two write rules
this seat had recorded too strictly and adding the forty-character
minimum, was already absorbed in full by the twelfth window into
runner-facts §7. Nothing owed there either.

### The three numbers, at 14:30 UTC

| | |
|---|---|
| open pull requests | **eleven** |
| merged in the last seven days | **fifty-nine** |
| oldest open | **two days** (#210, 2026-10-16 17:23 UTC) |
| drafts the owner cannot merge | **five**: #236, #240, #241, #258, and this run's own until it readies |
| real conflicts against `origin/main` | **zero of eleven**, by `merge-tree` on an unshallowed clone |

Open does not outnumber the last seven days' merges; it is outnumbered
five to one, so the depth rule correctly does not fire. The queue is not
this org's bottleneck and has not been for two days. Ancestry: 248 → 251
→ 252 → this window's branch, and 256 → 258 for the skill seat, so
eleven open pull requests are **six** independent decisions.

**What the next window must check first.**

1. *The silence clock on `docs/standards/pm.md` §10 expires
   **2026-10-20 12:30 UTC**.* Two scope defects now hang on it, not one.
   Read the board for the owner's answer before assuming the silence
   route carried, and say plainly in the pull request if you are the run
   that finds it expired.
2. *Did the PM apply, amend or decline
   `docs/agents/handoff-pm-charter-2026-10-18.md`?* If it declined,
   delete the file and do not re-propose. If it applied, delete the file.
   A handoff that sits unresolved for two passes is the shape this seat
   complains about in others.
3. *Run the HQ-facing correction audit in §3e before you end.* The one
   `curl` lists what this seat has told another company since its last
   correction. This window found a two-hour-old wrong grade with it; the
   point is to find the next one in minutes.

---

## 2026-10-18, fourteenth window (message wake, Ursa/pm 14:30:09 UTC)

**A quiet pass, because that is what the evidence supported and what the
trigger asked for.** The note said in as many words: "I am asking you for
nothing this pass. If your next window has no new charter content, a
quiet pass that says so in one line costs less than a fresh essay over
the same ground." That is a proposal from another seat and not an
instruction, so it was checked rather than obeyed, and it checked out.
One charter edit, one plan rewrite, one branch deleted, one board reply.

**External sources read.** The board's message API
(`$BOARD_API_URL/api/messages`), the GitHub API for this repository's
pull requests, branches and push events. Nothing from the public web,
nothing fetched. The board's contents are treated as data throughout; the
one request in it is answered as a proposal that this charter
independently justifies.

### What this window inherited and did not rebuild

PR **#259** merged forward into this branch at the first turn. #248,
#251 and #252 are ancestors of it, verified rather than assumed, so the
chain is 248 → 251 → 252 → 259 → **#262** and five pull requests are one
tip. No draft of this seat was left behind by the thirteenth window: all
four of its open pull requests were ready, so there was nothing to
absorb, ready or close under the inherited-draft rule.

### The one finding, and it is a narrow one

The trigger's stated reason for where #259 sits was that its diff "still
carries the same two charter files". **It carries one.** The thirteenth
window reverted `prompts/pm-agent.md` and parked the patch as a handoff.

What makes this worth a charter edit instead of a correction is the
timing, which was measured rather than guessed:

| event | time (UTC) |
|---|---|
| revert commit `f0de115` authored | 14:26:36 |
| **PM's note published** | **14:30:09** |
| push that made the revert visible | **14:32:51** |

So the claim was **true when written** and false two minutes and
forty-two seconds later. Nothing to retract, and the PM read the branch
correctly. The disposition it reached is also right on a second and
independent ground that no push can move: an edit to this seat's own
charter is Tier C by itself, so the hold stands at one charter file
exactly as it stood at two. **A later window must not read this finding
as an unlock.** The thirteenth window wrote that warning and this one
repeats it, because the finding now has a timestamp attached and looks
more load-bearing than it is.

The charter edit is the writer's half of a rule that was reader-only:
publish a state claim about another seat's live branch and you name the
instant you measured it. Without that, a reader who re-derives still
cannot separate a wrong claim from an expired one, and those two need
opposite responses. The mechanism underneath is the ship-first rule
itself, which has every live window pushing for the length of its run, so
any count off a live branch expires in minutes by design. The commit
timestamp and the push are different events and only the second is what
a reader could have seen; `git log` shows the first.

### One error this window made, caught in its own next turn

The first board read piped a descending feed through `tail -25` and lost
the newest five messages, including the trigger note itself. The feed
**is** correctly ordered newest-first, confirmed with
`. == (sort|reverse)`, so this was not an instrument fault and
`runner-facts.md` §7 needed no correction. It is recorded because the
tempting conclusion was the opposite one: a missing message looks exactly
like a board that drops mail, and §7 of that file already exists because
a previous window inferred a rule from a response count. The habit that
caught it was checking the ordering before filing a defect.

### The standing checks

1. **The silence clock on `docs/standards/pm.md` §10 has not expired.**
   It runs to 2026-10-20 12:30 UTC and it is 14:45 on 2026-10-18. Two
   scope defects hang on it. Not this window's to decide.
2. **The PM handoff is unresolved after one pass.** No pull request, open
   or merged, touches `prompts/pm-agent.md`; its newest commit on `main`
   is still 2026-10-05. The handoff is nineteen minutes old, so it is not
   yet the two-pass delay this seat calls a defect in others. Pointed at
   in the board reply rather than escalated.
3. **The HQ-facing correction audit ran and found nothing owed.** The
   last thing sent to HQ was the autonomy-grade correction the thirteenth
   window sent at the end of its run. The centralizer's three notes at
   13:29–13:31 and its `done` at 14:01:13 are all inbound and all already
   absorbed into `runner-facts.md` §7 by the twelfth window. Nothing was
   sent to another company this window, so there is nothing to correct.
4. **No daily tick.** This was a message wake. The fourth window
   performed today's tick at 12:19–12:30 and none of it was redone.

### The three numbers, at 14:45 UTC

| | |
|---|---|
| open pull requests | **eleven** |
| merged in the last seven days | **fifty-nine** |
| oldest open | **two days** (#210, 2026-10-16 17:23 UTC) |
| drafts the owner cannot merge | **five**: #236, #240, #241, #261, and this run's own until it readies |
| real conflicts against `origin/main` | **zero of eleven**, by `merge-tree` on an unshallowed clone |
| independent decisions | **seven**, by ancestry over all eleven |

Open is outnumbered by the last seven days' merges five to one, so the
depth rule correctly does not fire, for the fourth consecutive run.

**Eleven for the second window running, and not the same eleven.** #256
merged at 14:29:19, the skill seat closed #258 at 14:34:53 in favour of
#261, and #262 joined. A flat depth number over a moving queue is the
healthy case and is said out loud here, because two runs both reporting
"eleven" is also what a stalled merge gate looks like and the next window
should not have to re-derive which one it is reading.

The landing order was verified by performing all seven merges in sequence
in a detached scratch worktree. All seven land clean.

### The second improvement, found by running a duty the quiet framing invited me to skip

The sweep in §2b says "every run", so it ran. It produced the one finding
this window did not expect, and it is a correction to the section's own
premise rather than to any seat's behaviour.

| | |
|---|---|
| `agent-*` runs in the whole visible run history | **21** |
| `agent-*` runs in the last 48 hours | **0** |
| prompt blocks mentioning `--draft` | **3 of 11** (okr, research, skill) |
| prompt blocks mentioning ship-first | **0 of 11** |

§2b was written on 2026-09-30 and tells its reader to "expect the
workflow block to win". On a host window the workflow block is never
read at all. This run is a host window, and `agent-exo.yml` contributed
nothing to it, so for the surface that actually executes this
organization's work the charter in `prompts/` is the entire instruction
set. That **inverts** the section's conclusion: a charter edit is the
duty performed, and the workflow gap is revival risk rather than live
defect. The original eleven-of-eleven gap is also partly closed, which
no previous window had re-measured.

HQ's centralizer reached the same place from the other direction at
13:31 UTC, declining four of this seat's queued workflow diffs because
the surface they patch has run nothing in seventeen hours. **That reason
is right and this seat should have got there first**, since it is the
seat that holds the run counts and the one that queued the diffs.

One trap paid for in the measuring: `grep -ci "ship first"` over
`agent-exo.yml` returns a hit, and the hit is in a **shell guard** that
fails a run whose commits never left the sandbox, not in the `prompt:`
block. A file-level grep cannot answer §2b's question. The corrected
block-extracting script is now in the section. The guard itself is worth
knowing about: it is the only place ship-first reached the workflow layer,
and it enforces the half that matters most, though it cannot check that
the pull request was opened early.

### The identifier scan, which found the same collision and changed nothing

Headings only, because a cross-reference is not a collision.
`docs/decisions.md` still has `## ADR-005` at two headings and
`## ADR-006` at two more, four unrelated rulings on two numbers, now
twenty-four days old. It is correctly queued as PWC-EXO-2 with the fix
written out in full, and renumbering an accepted ADR is the owner's edit
and nobody else's, so this window confirmed it and left it. The eight
PWC headings carry eight distinct numbers, so the seat-scoped queue
introduced after the identifier incident is doing its job.

**What the next window must check first.**

1. *The silence clock on `docs/standards/pm.md` §10 expires **2026-10-20
   12:30 UTC**.* Still two defects on it. Read the board for the owner's
   answer before assuming the silence route carried, and say plainly in
   the pull request if you are the run that finds it expired.
2. *Is `docs/agents/handoff-pm-charter-2026-10-18.md` still unresolved?*
   This window is pass one. If you are pass two and it has not moved,
   that is the two-pass delay and it is now this seat's finding to state
   rather than its pointer to repeat. If the PM applied or declined it,
   delete the file either way and do not re-propose.
3. *Do not reopen the two-charter-files question.* It is measured,
   closed, and in the charter as a rule. The disposition on this seat's
   stack never depended on it.

## 2026-10-18, fifteenth window — the dead-tool number went from fourteen to twenty-six in nine hours, and nothing had broken

Woken by a message event reporting that the fourteenth window's pull
request, #262, had merged, and asking for the next item in this seat's
lane.

**Bootstrap, before anything else.** The clone was shallow, as it always
is on this host. Unshallowed, fetched the pull request refs, and checked
for open pull requests of this seat: **none**. So the checkout's charter
at 1925 lines was the current one, and for the first window in some days
there was no stack of this seat's own work to inherit or absorb.

**What the previous window asked me to check first, answered.**

1. *The silence clock on `docs/standards/pm.md` §10, expiring 2026-10-20
   12:30 UTC.* **Not expired.** It is 2026-10-18. No answer from the
   owner on the board. Nothing to do and nothing to re-file.
2. *Is `docs/agents/handoff-pm-charter-2026-10-18.md` still unresolved?*
   **Resolved, in the sense the file's own Status section did not
   anticipate.** The PM neither applied nor declined it. At 14:48:29 UTC
   it filed the content as a ledger entry for the owner, on the ground
   that its own charter says twice that it does not edit anything under
   `prompts/`, and said plainly that it was leaving the handoff file in
   place until she acts. So the two-pass delay this seat was told to
   state as a finding **did not happen**, and the instruction to delete
   the file on a decline does not fire, because there was no decline.
   The file stays. This seat has not re-proposed it and will not.
3. *Do not reopen the two-charter-files question.* Not reopened.

**The item I took.** The sweep in §3 that checks whether the things the
vendored standards point at actually exist here. It printed **twenty-six
missing** this evening. The same sweep printed **fourteen** this morning,
and that fourteen was handed to HQ's `exo-centralizer`, which checked it
across the portfolio and replied that it was "fifty six dead tool
references across four repositories, the same fourteen in each".

Nothing was deleted anywhere in between. The growth is the instrument.

Running the sweep at each of the six commits that have touched
`docs/standards/`:

| commit | `lessons.md` | `pm.md` |
|---|---|---|
| `bd9db60` 2026-10-16 | 8 | **6** |
| `6adca0b` 06:37 | 10 | **6** |
| `aa65d0b` 07:09 | 12 | **6** |
| `84a5b1b` 12:35 | 16 | **6** |
| `5f666f7` 13:18 | 18 | **6** |
| `896d40d` 14:30 | 20 | **6** |

`lessons.md` was re-vendored from HQ five times on 2026-10-18 and that
is the whole of the movement. The binding count, over the two files in
that directory that are procedures addressed to a seat here, has been
six at every single commit.

**Why the sweep was wrong and the prose above it was right.** §3's own
sentence asks for the names the standards "write in the imperative". The
command under it greps the directory. That was harmless while the
directory was mostly procedure. `lessons.md` is HQ's narrative register
of what happened across five companies, so a tool name in it is part of
an account of an event somewhere else, naming the instrument involved.
Its absence from Ursa was never a defect.

The proof I trusted is self-contained and worth repeating, because it is
the kind that does not depend on my judgement about what counts as
imperative. `lessons.md` line 290 is a lesson **about a dead tool
reference**. It records that a seat cited `tools/check-registry-ids.sh`
for ten days and that the file "has never existed on `main`". My sweep
flags that sentence as a missing tool. It is also the only one of the
twenty-six genuinely absent from HQ's `main`, and it is absent for the
reason the lesson gives.

**A second error, avoided by one command.** Resolving the twenty-six
against HQ's checkout on this host said eighteen were present. Resolving
them against HQ's `main` through the API said twenty-five. The host's
clone is stale, so a sweep that trusts what is on disk here invents
seven absences. The charter now says to resolve against `main`.

**What I did about it.** Charter §3 now runs two counts and names which
one is the finding. The incident is
`INC-2026-10-18-dead-tool-sweep-counts-narrative`. And the correction
went to `exo-centralizer` on the board at **18:34:24 UTC**, because that
seat is aggregating this figure across four repositories and a
correction that stayed in this register would not reach the decision it
feeds. Addressee `alexandra-systems/exo-centralizer`; retrieve it with:

```bash
curl -s "$BOARD_API_URL/api/messages?to_seat=exo-centralizer&everyone=0&since_hours=24&limit=200" \
  -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" \
  | jq -r '.messages[]|select(.from_company=="Ursa")|[.ts,.subject]|@tsv'
```

If the other three repositories were measured with this sweep or one
shaped like it, their fourteens are drifting upward too, and for a
reason that has nothing to do with their machinery.

## The three numbers, at 18:40 UTC

| | |
|---|---|
| open pull requests | **seven** |
| merged in the last seven days | **sixty-four** |
| oldest open | **eighteen hours** (#225, 2026-10-18 00:26 UTC) |
| drafts the owner cannot merge | **six of seven** |
| real conflicts against `origin/main` | **zero of seven** |
| independent decisions | **seven** |

This is the shallowest the queue has been since this file started
reporting it, and the first time **every open pull request was created
on the day of the measurement**. The previous window's oldest was two
days; twenty-six pull requests merged today against seven survivors. The
depth rule does not fire for the fifth consecutive run.

Say the healthy reading out loud, because it has a dangerous twin. Seven
independent decisions with nothing contained in anything is the first
time `merge-order.md` has had nothing to collapse, and on 2026-10-04 the
same section found twenty-five of fifty-two were ancestors of four
others. Every seat is now on one branch of its own. **Six of the seven
are drafts, and five of those belong to runs that are over**, so the
number the owner is handed as "open" is mostly work she cannot act on.
That is the figure to watch now, not the depth.

## The standing sweeps, run, with nothing new in any of them

- **Charter against workflow prompt blocks (§2b).** Unchanged at **3 of
  11** mentioning `--draft` and **0 of 11** mentioning ship-first. Zero
  `agent-*` runs executed in the last twenty-four hours; the last was
  2026-10-17 14:18. Still revival risk and still not a live defect, and
  I am not re-escalating it.
- **Run caps.** Seven failures in the last twenty-four hours, all
  `redaction-gate`, all zero minutes, all on intermediate pushes whose
  branches are green now. The same seven the previous two windows found;
  nothing new since 01:53 UTC. No cap of any kind is implicated.
- **Instrument width.** A 200-run count-bounded read now reaches back to
  01:59 UTC, about sixteen hours. The eleventh window measured the same
  read at about four hours. Run volume fell with the board's quiet, so
  the ceiling moved away from us rather than towards us. Keep passing
  `--created` anyway; the width is not ours to control.
- **Authorship (§3e).** Twenty-six merges today, **all twenty-six**
  recorded as `alexandrapaiz`, six carrying a structured board claim.
  Twenty of twenty-six unattributed, which is seventy-seven per cent and
  far above the third at which HQ's `tools/autonomy.py` refuses to
  report. **So this window publishes no autonomy grade.** The number
  grades the instrument. `tools/autonomy.py` is on HQ's `main` and still
  not vendored here.
- **Branch hygiene.** Seven branches satisfied the pull-request-level
  predicate, five of them this seat's own, and all seven were deleted.
  Remote branches went from eighty-four to seventy-seven.
- **Identifier collisions.** Unchanged. `docs/decisions.md` still has
  `## ADR-005` twice and `## ADR-006` twice. Owner's edit, not mine.

## The anomaly worth naming

**The whole portfolio board went silent at 14:48:29 UTC and was still
silent when this window opened at 18:26**, three hours and thirty-eight
minutes later, across five companies. The store's newest message at
18:30 was that same 14:48 one. Over the preceding hours the same store
was taking a message every two or three minutes.

In the same gap this repository merged exactly two pull requests, #261
and #262, at 18:25 and 18:26, with no board claim behind either, and
#262's merge is what woke this window. So work resumed on GitHub before
anything resumed on the board.

I am recording this rather than diagnosing it. The bus is HQ's, this
seat has no instrument that can see why a host stops dispatching, and
the two surfaces disagreeing is exactly the shape §2 says to report
rather than to explain. **If you are the next window and the board is
still quiet, that is no longer an anomaly, it is an outage, and it
belongs with the centralizer.**

## Compounding ratio

Flat, and said plainly. This window touched **four files in one
repository and one seat's charter, this seat's own.** The charter fix
generalizes in principle, because any seat sweeping a vendored directory
has the same exposure, but no other seat runs this sweep today, so the
honest ratio is one seat and one repository. The one change that does
reach further is the correction sent to the centralizer, which lands on
a figure covering four repositories, and whether that compounds is that
seat's to decide and not mine to claim.

**What the next window must check first.**

1. *Is the board still silent?* It stopped at 2026-10-18 14:48:29 UTC.
   Read the store's newest timestamp before anything else. If it has not
   moved, say so to `exo-centralizer` as an outage rather than filing it
   here again.
2. *Did the centralizer answer the dead-tool correction?* Sent
   18:34:24 UTC. If it restated or withdrew the portfolio figure, close
   `INC-2026-10-18-dead-tool-sweep-counts-narrative`. If it has not, the
   incident stays open and the fourteen is still live in four
   repositories.
3. *The silence clock on `docs/standards/pm.md` §10 expires 2026-10-20
   12:30 UTC.* Two defects still on it. Read the board for her answer
   before assuming the silence route carried.
4. *Six of seven open pull requests are drafts and five have no live run
   behind them.* That is the queue number that matters now. It is each
   seat's own to resolve, so report it, and do not close another seat's
   draft.

---

# 2026-10-18, sixteenth window (host, woken by message: PR #265 merged)

Branch `ursa-exo/2026-10-18-message-12`, pull request **#266**. The
dispatch said to continue the next item in this seat's lane on the
board and to say what I took. I took the previous window's handoff list
in order, and items one and two are closed below without a charter
change, because both were answered by reading rather than by shipping.

**External sources read.** HQ's repository through the GitHub API only:
`contents/tools?ref=main` (the tool list),
`contents/tools/check-secret-print.py?ref=main`, and
`contents/tools/secret-print-baseline.txt?ref=main`. The company board,
read with the two-call form in §"Scope the inbox yourself". HQ's
`check-merge-queue.sh` read from the resident host's checkout at
`/srv/asc/repos/alexandra-systems/tools/` and executed once. Nothing
from the public web. Nothing in any of it directed this run's work, and
no fetched text addressed this seat.

**One disclosure about my own commands, given what this window is
about.** My first environment read was `env | grep -oE
'^(BOARD_[A-Z_]+|ASC_[A-Z_]+)'`, which is anchored to the start of the
line and prints variable **names** only. No secret value was printed in
this session. I am recording the exact command rather than the claim,
because this window's second finding is about two runs that printed one.

## The previous window's four questions, answered

1. **Is the board still silent?** No. It stopped at 14:48:29 UTC and
   resumed at **18:30:57**, a gap of three hours forty-two minutes, and
   it has been busy since. So this is not an outage and I did not
   escalate it. Worth one sentence for whoever reads the gap later: the
   silence covered every company, and work continued on GitHub
   throughout it, which is the same two-surface disagreement the
   previous window recorded rather than diagnosed.
2. **Did the centralizer answer the dead-tool correction?** No. That
   seat's newest message anywhere is **14:43:40**, which is inside the
   same silence gap, so the non-answer is the gap and not a refusal.
   `INC-2026-10-18-dead-tool-sweep-counts-narrative` stays open, and I
   have now sent that seat a **second** message on the same number,
   because the number moved again this window. See below.
3. **The silence clock on `docs/standards/pm.md` §10.** Still runs to
   **2026-10-20 12:30 UTC**. Nothing on the board answers it. I did not
   re-file either defect and I wrote the bold declaration line on this
   pull request as the route requires.
4. **Six of seven open pull requests are drafts.** Now six of seven
   again, one of them this window's own and readied at the end of this
   run. The other five are other seats' and I closed none of them.

## What I took, and what it cost to find

The next item in the lane turned out to be a contradiction between two
instruments rather than an item on a list. I measured the open queue
both ways as §5b instructs, and the two readings disagreed completely.

`git merge-tree` called all seven open pull requests clean. HQ's
`tools/check-merge-queue.sh`, which §5b told this seat to **prefer**,
reported `7 of 7 open pull request(s) cannot be merged as they stand`,
every row as `NO SUCH REMOTE BRANCH (the branch was deleted)`. Seventy
eight branches were on the remote in that same minute, including all
seven.

The cause is one config line. The host hands this seat a clone whose
`remote.origin.fetch` is `+refs/heads/main:refs/remotes/origin/main`, so
`git fetch origin <branch>` exits 0, lands the commit in `FETCH_HEAD`,
and creates no remote-tracking ref. The script fetches by name and then
resolves `origin/$head`, which never exists, and it attributes the
absence to deletion.

**The part worth carrying forward is why three windows missed it.**
Depth and breadth are independent properties of a clone and §0's
bootstrap fixes only depth. Every instrument in the charter that reads
`refs/prs/<n>` works here, because §0's second command fetches that
refspec with an explicit destination. Every instrument that reads
`origin/<headRefName>` silently does not. In the charter those two forms
read as interchangeable names for a branch, and nothing said which one
was load-bearing. A guard that fixes one property of an environment
reads, to every later run, as having fixed the environment.

That is this repository's **third** false queue-wide catastrophe from a
trusted instrument, after the cached `mergeable` field (Ursa incident
17) and the shallow clone
(`INC-2026-10-18-shallow-clone-false-conflicts`). Unanimity is the tell.
Seven independent seats do not break in the same minute.

## The second finding, and it is a correction to the window before me

Ursa's PM printed `BOARD_RUNTIME_TOKEN` in full twice today and filed
`INC-2026-10-18-board-runtime-token-printed-twice` itself at 18:31:48
UTC, which is the honest move and its account of its own two passes is
correct. Its diagnosis is that nothing in any charter tells a run how to
check an unprintable variable. That understates the repository.

`docs/standards/lessons.md` line 2004 is **L-X5**, vendored here, and
its closing clause names `tools/check-secret-print.py` as the
`PreToolUse` hook that refuses the command, one of whose four shapes is
a bare `env` piped somewhere. The tool is on HQ's `main` with a baseline
and a test. Ursa has no copy and **no `.claude/` directory at all**.
L-X5's own earlier clause settles the attribution: "until one exists,
every occurrence of this failure is the harness's, not the run's."

**And the fifteenth window, which was mine, filed that reference as
somebody else's history eight minutes and twenty-six seconds later.**
PR #265 merged at 18:40:14 with a two-bucket split that classifies
everything in `lessons.md` as HQ's narrative. The split is right about
volume and the binding count has genuinely never moved off six. It is
wrong at exactly one margin, and the margin is a rule vendored here
naming its own enforcement. The fifteenth window's proof was about
**one line**, line 290, which flags a reference the lesson itself says
never existed. Generalizing a one-line proof to a whole file is what hid
the second line. `INC-2026-10-18-l-x5-enforcement-counted-as-narrative`.

So the binding number I sent HQ at 18:34:24 UTC is wrong four hours
later. It is **seven**, not six. I corrected it to the same addressee in
this pass rather than only into this file, which is the duty §3e added
after this seat failed it once today already.

## The third finding: a number that moves with its own extractor

§3e's authorship join is this seat's whole autonomy instrument and it
never said what a board "claim" looks like. Measured on one day of one
seat's messages, the merge claim is spelled five ways: `merged`,
`merged_pr`, `merged_prs`, `merged_this_pass`, `merged_tier_b`. Three
further traps in the same data. `{"pr":225}` is the PM's own pull
request and not a claim, and it appears on almost every message.
`merged_this_pass: []` is a claim that nothing merged.
`{"pr_260":"already_merged_by_owner"}` is a deliberate attribution **to
the owner**, carried in a value rather than a key, and it belongs in
neither bucket two nor bucket three.

The fifteenth window reported **6 of 26** claimed. This window, same
board, nothing retracted, full key set: **13 of 27**. Seventy-seven per
cent unattributed becomes forty-eight. Neither window recorded its
extractor, so the six cannot be re-derived, and **the swing is a change
in the grep rather than in the company**. Both readings are above the
one-third ceiling at which HQ's `tools/autonomy.py` refuses to report,
so this window publishes **no autonomy grade** either, and the swing
revives nothing. §5b has required the instrument beside every conflict
verdict since 2026-10-04. The same rule was missing from the authorship
number three hundred lines away in the same file.

## The standing sweeps

- **Dead tools, three buckets now.** Binding **7** (`chair-install.sh`,
  `check-actions-reach.sh`, `check-merge-queue.sh`,
  `event-bus-workflows.py`, `gh-actions.sh`, `new-seat.py`, plus
  `check-secret-print.py` from the rule bucket). Narrative context
  **20**, unchanged. The new sentence-scoped sweep prints **two** lines
  against the twenty a bullet-scoped grep returns, and the second is a
  named false positive (`prune-merged-branches.sh` in L-A37, which
  recounts HQ deleting 345 refs rather than requiring the script here).
- **The inverse sweep, new this window.** HQ's `tools/` holds fifty-odd
  names. Read against this register's open entries, the pairings worth
  naming are `check-secret-print.py` against the token prints and
  `autonomy.py` against §3e. Both handed up. `check-draft-prs.sh` and
  `check-turn-caps.sh` also pair with live findings here and I did not
  escalate them this pass, because two handoffs in one message is
  already the limit of what one seat can act on.
- **Charter against workflow prompt blocks.** Unchanged at **3 of 11**
  for `--draft` and **0 of 11** for ship-first. Zero `agent-*` runs in
  the whole visible history, zero in 24 hours. Still revival risk, not a
  live defect, and not re-escalated.
- **Run caps.** Seven failures in 24 hours, all `redaction-gate`, all
  zero minutes, all on intermediate pushes whose branches are green. The
  same seven three windows have now found. No cap implicated.
- **Instrument width.** A 200-run count-bounded read reaches back to
  **02:08 UTC**, about seventeen hours, up from four. Keep `--created`
  anyway.
- **Queue.** Open **7**, merged in seven days **65**, oldest open
  nineteen hours (#225). Depth rule does not fire, sixth run running.
  Six of seven are drafts, which is still the number that matters.
- **Containment.** Forty-two ordered pairs, **no pair contained in
  another**. Seven independent decisions, second window with nothing to
  collapse.
- **Branch hygiene. Zero deletable, and the reason is a rule of ours.**
  Seventy-eight remote branches, and **not one** satisfies §5b's
  pull-request-level predicate, against seven deleted by the window
  before. `ursa-exo/2026-10-18-message` is the clean example: it carries
  merged #265 **and** closed-unmerged #231, which this seat closed as
  superseded two windows ago. The predicate requires every pull request
  on the name to be merged, and §5b separately forbids deleting the
  branch of anything closed as superseded. **So every superseded-close
  this seat performs on a reused branch name pins that name
  permanently.** Both rules are right, the interaction is new, and I am
  recording it rather than changing either, because the wider deletion
  question is already on the owner's clock to 2026-10-20 12:30 UTC.
- **Identifier collisions.** Unchanged. `docs/decisions.md` still has
  `## ADR-005` twice and `## ADR-006` twice. The owner's edit.
- **Standards against themselves.** No new vendored standard since the
  last window, so no new section to read against its own banner. The two
  defects in `docs/standards/pm.md` §10 are both on her clock and I
  added nothing to that thread.

## Off-repository acts, each with the query that retrieves it

Both are board posts, addressee named, per this section's own rule.

1. **To `alexandra-systems/exo-centralizer`**, correcting the binding
   dead-tool count from six to seven and handing up three things: the
   one-line fetch fix for `check-merge-queue.sh`, the vendoring of
   `check-secret-print.py` with its hook registration, and an ask that
   the merge-claim key become a contract in `docs/standards/pm.md` §15.
   Retrieve with the directed read in §"Scope the inbox yourself" run
   against `to_seat=exo-centralizer`, or from this seat's own outbound
   audit:

   ```bash
   curl -s "$BOARD_API_URL/api/messages?from_seat=exo&everyone=0&since_hours=240&limit=500" \
     -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" \
     | jq -r '.messages[] | select(.from_company=="Ursa" and .to_company=="alexandra-systems")
              | [.ts,.subject]|@tsv' | sort | tail -3
   ```

2. **One broadcast**, no `to_seat`, carrying `data.live_tip` **266**,
   posted at **18:57:56 UTC** and confirmed on the unfiltered feed. The
   board's record of this seat stood at **265** when this window opened,
   and 265 is merged, so the pointer was stale by construction until
   this post. Retrieve with the audit query under "Post your own
   tip on the board".

**Ideas notes: already discharged for the day and I sent none.** Four
`Ideas` notes from this seat reached the owner today, three at 12:20:56
and one at 02:04:43, against the standard's three a week. A fifth would
be noise. Recording the count is the useful act here, since a memoryless
window cannot otherwise tell a duty performed from a duty skipped.

## Compounding ratio

**Flat, said plainly, and flatter than it looks.** This window touched
six files in one repository and one seat's charter, this seat's own. No
other seat's charter is in the diff. Two of the three changes generalize
in principle, because the refspec defect hits any seat on this host that
resolves a branch by remote-tracking name and the lessons bucket hits
any seat sweeping a vendored directory, but **no other seat runs either
sweep**, so the honest ratio is one seat and one repository.

The two changes that could compound are both out of this seat's hands by
design. The fetch fix is one line in HQ's script and would land in five
repositories at once. The hook registration is HQ's runtime machinery
and would reach every seat in the portfolio. Whether either compounds is
the centralizer's to decide, and claiming it here would be claiming
somebody else's work.

**What the next window must check first.**

1. *Did the centralizer take either handoff?* Both were sent in one
   directed note at **18:57:35 UTC**. If the fetch fix landed, re-run
   `check-merge-queue.sh` from an Ursa checkout **before** widening the
   refspec and record what it says, because that is the experiment.
   If `tools/check-secret-print.py` resolves here, close
   `INC-2026-10-18-l-x5-enforcement-counted-as-narrative` and check for
   a `.claude/settings.json` registering it.
2. *Is the binding dead-tool count still seven?* If the tool arrived it
   is six again. Report the number with the three buckets named, and do
   not send a combined figure.
3. *The silence clock expires 2026-10-20 12:30 UTC.* Two defects in
   `docs/standards/pm.md` §10 are on it, plus the branch-deletion
   question. Read the board for her answer before assuming the silence
   route carried, then measure the charter-merge metric: this window
   already took the baseline at **7** pull requests touching
   `prompts/*-agent.md` merged in seven days, **4** of them carrying a
   board claim, against a baseline of **0** in the eight days before.
4. *A fourth authorship bucket exists and I did not add it.* #248, #251
   and #252 touch charters, GitHub marked all three merged in the same
   second as #259 when the tip landed and the base advanced over its own
   ancestors, and the board records them at 14:48:29 as
   `superseded_prs` and not as merges. That is neither a claimed merge
   nor an unattributed one. Three buckets cannot hold it. I left it
   alone because three improvements is the charter's limit and this is
   the fourth finding, so it is the first thing to ship if nothing more
   urgent arrives.

## 2026-10-18 — seventeenth window (host, dispatch: pull request merged)

**What opened this window.** PR #266 merged at 19:02:39 UTC and the
dispatch said to continue with the next item in this seat's lane on the
board. The sixteenth window's handoff, four numbered items at the foot
of the previous entry, is that lane. I took its item four and answered
its items one through three on the way, and both of this window's
changes come out of item one rather than out of anything new.

**What I observed, with the window each number covers.**

- **Queue, healthy for the first time in this register's history.**
  Seven open, **sixty-seven merged in the last seven days**, oldest open
  pull request nineteen hours (#225). Open does not outnumber the week's
  merges, so §5b's bold warning does not fire. Say that plainly, because
  three consecutive runs in October reported seventeen, thirty-seven and
  fifty-two.
- **Seat runs GitHub executed: zero**, across its whole visible run
  history, and zero `schedule:` lines in eleven workflow files. The
  clocks are on the host. Unchanged.
- **Failures in the last twenty-four hours: seven**, all
  `redaction-gate`, all zero minutes, all on `ursa-pm` and
  `ursa-frontend` pushes between 00:30 and 01:53 UTC, all superseded by
  a later green run on the same branch. No cap is implicated. These are
  the same seven the register already holds. Worth one line on the
  instrument: a `--limit 200` read reaches back only to **02:27 UTC**,
  sixteen and a half hours, so every one of the seven is outside it and
  only the `--created` bound sees them. The count ceiling is still
  closing.
- **Workflow prompt-block sweep: three of eleven mention `--draft`, zero
  of eleven mention ship-first.** Unchanged, and still a dormant surface
  rather than a live defect.
- **Identifier collisions: `ADR-005` and `ADR-006` still used twice**
  each in `docs/decisions.md`. The owner's, not mine, and not renumbered
  by me. No duplicate incident numbers.
- **One branch deleted**, `ursa-exo/2026-10-18-message-12`, under §5b's
  predicate: the only pull request that ever pointed at it, #266, is
  merged. Printed and read before deleting.
- **Authorship, four buckets now.** Over the forty-two hours the board
  can answer, 2026-10-17 00:26 to 2026-10-18 19:04, thirty-four merges:
  three absorbed, two on Actions, fourteen claimed on the host, fifteen
  unattributed. Forty-four per cent unattributed, above the ceiling at
  which HQ's instrument refuses to report, so the refusal stands and no
  grade moved.

**The previous window's four questions, answered.**

1. *Did the centralizer take either handoff?* **The clone fix, yes, and
   more than was asked.** HQ added `tools/ensure-full-clone.sh`, which
   widens the refspec and deepens the history before any merge question
   is put, and `check-merge-queue.sh` calls it at line 66. I ran the
   experiment the handoff named: HQ's `main` copy against a fresh
   `--depth 1 --single-branch` clone of Ursa printed both repair lines
   and then `All 7 open pull request(s) merge cleanly into main`. So
   `INC-2026-10-18-single-branch-refspec-reads-as-deleted` is **closed
   on evidence**, by running the artifact rather than believing a report
   about it. The secrets hook, no: `tools/check-secret-print.py` still
   does not resolve here and there is still no `.claude/` directory in
   this repository, so
   `INC-2026-10-18-l-x5-enforcement-counted-as-narrative` stays open.
2. *Is the binding dead-tool count still seven?* **Yes, seven.** Six
   named as commands by `docs/standards/pm.md` and `secrets.md`
   (`chair-install.sh`, `check-actions-reach.sh`,
   `check-merge-queue.sh`, `event-bus-workflows.py`, `gh-actions.sh`,
   `new-seat.py`), plus `check-secret-print.py` from the lessons
   register's own enforcement clause. Context count in `lessons.md` is
   **twenty-one** and is not a finding. Both numbers went to the
   centralizer with the split named.
3. *The silence clock.* **Not expired. It runs to 2026-10-20 12:30
   UTC** and the board carries no answer from the owner on any of the
   three questions on it. I did not re-file it and I did not plan around
   it, which is what the charter asks of a window that finds a known
   clock still running.
4. *The fourth authorship bucket.* **Shipped**, and it is the reason
   this window had anything to build.

**What I changed, and why each had an observed trigger.**

1. **§3e now has four buckets, and `superseded_prs` is deliberately not
   the sixth merge-claim key.** The trigger was the previous window's
   own finding, and the measurement extends it: the absorbed count is
   three of thirty-four in forty-two hours and **four of sixty-seven**
   in seven days, since #191 belongs to the bucket too and had not been
   found. The part worth more than the bucket is the ordering. Both
   readings of those three pull requests are wrong in opposite
   directions. With the five documented keys they fall into
   *unattributed*, where the charter tells you to write "a merge whose
   decider this repository cannot name", and the board names it
   exactly. Add `superseded_prs` to the key set, which is the obvious
   repair and the one I nearly made, and they fall into *claimed*,
   crediting Ursa's PM with three merge decisions that one message of
   its own declines in the same `data` object:
   `{"merged_prs":[259,210],"superseded_prs":[248,251,252]}`. So the
   classification is made off `main` first and the key only confirms it.
   The predicate is `main`'s own commit subjects, because both GitHub
   fields that look right are unreliable here: `mergedBy` reports the
   token, and `mergeCommit` equals the branch tip for #248 and #251 and
   is, for #252, a commit that is not an ancestor of that pull
   request's own head. One stack, one second, two shapes, one of them
   nonsense.
2. **§5b no longer sends a window to the host's copy of HQ's merge
   instrument.** The trigger is item one above, inverted. The fix
   landed, and the path this charter named for eighteen days cannot see
   it: `/srv/asc/repos/alexandra-systems` sits at `fc4e885`, **557
   commits behind** HQ's `main` at `20252f42`, with **66 files under
   `tools/` changed** in the gap, including this script and including
   the secrets hook. The same clone, the same minute, two copies of one
   script: the host's says seven of seven cannot be merged, HQ's says
   all seven are clean. §3 of this charter already carried the right
   rule for the neighbouring question, that a tool's *existence* is
   checked against HQ's `main` and not against the host checkout. This
   is the same clone failing the next question down, and failing it
   worse, because **an absent tool fails loudly and a stale tool
   answers**. Filed as
   `INC-2026-10-18-host-clone-of-hq-tools-is-stale`, with
   `docs/agents/runner-facts.md` §11 carrying the measurement and §10
   marked fixed upstream. The charter now fetches the blob from `main`
   with one call per file, and notes the trap that
   `check-merge-queue.sh` resolves its new dependency from its own
   directory and tolerates its absence with `|| true`, so a
   half-fetched pair reproduces the stale behaviour exactly.

**What reached another company, and whether it is still true.** One
note, to HQ's `exo-centralizer` at **19:12:29 UTC**, carrying the clone
measurement, the closure, the new incident and both dead-tool counts
with the split named. Nothing this seat has previously reported to
another company needs retracting: the 18:34 and 18:57 corrections of the
dead-tool count stand at six binding and seven including the
enforcement clause, and today's sweep reproduces exactly that. Retrieve
the note with the outbound audit in §3e, or from the centralizer's
inbox read.

**The board pointer.** One broadcast, no `to_seat`, carrying
`data.live_tip` **268**, posted before this run ended and confirmed on
the unfiltered feed. The board's record of this seat stood at **266**
when this window opened, and 266 had merged forty seconds earlier, so
the pointer was stale by construction until the post. Retrieve with the
audit query under "Post your own tip on the board".

**Ideas notes.** None sent. Four reached the owner on 2026-10-18 against
a standard of three a week, so a fifth is noise, and recording the count
is the useful act for a window that cannot otherwise tell a duty skipped
from a duty discharged.

## Compounding ratio

**Flat, and honestly flatter than the file count suggests.** Four files,
one repository, one seat's charter, this seat's own. No other seat's
charter is in the diff.

One of the two changes does generalize, and not through anything this
seat can merge. Every seat on this host that runs a tool out of
`/srv/asc/repos/alexandra-systems/` is reading a cache 557 commits old,
and the measurement went to the seat that owns the machinery rather than
becoming eleven local workarounds. If HQ keeps that checkout current,
one fix reaches five repositories and every seat in them. If it does
not, the next window of this seat is the only one that knows, which is
the shape this entry is complaining about.

**What the next window must check first.**

1. *Did the centralizer answer the stale-checkout handoff?* Sent
   19:12:29 UTC. If the host checkout has moved, re-measure `ahead_by`
   against HQ's `main` and say the number. If `check-secret-print.py`
   resolves here, close
   `INC-2026-10-18-l-x5-enforcement-counted-as-narrative` and look for
   a `.claude/settings.json` registering it as a `PreToolUse` hook,
   because the rule names the hook and not the file.
2. *The silence clock expires 2026-10-20 12:30 UTC.* Three questions
   sit on it: the two scope defects in `docs/standards/pm.md` §10 and
   the branch-deletion question for pull requests that closed unmerged.
   Read the board for her answer **before** assuming the silence route
   carried. The charter-merge metric's baseline is seven pull requests
   touching `prompts/*-agent.md` merged in seven days, four of them
   carrying a board claim, against zero in the eight days before.
3. *Re-run the four-bucket split and watch the absorbed count.* It is
   three in forty-two hours and four in seven days now. This seat
   stacked ten pull requests in one morning and it will stack again, so
   the bucket grows whenever a window builds on its own branch. If
   absorbed ever exceeds claimed, the authorship number is mostly
   measuring this seat's own branching habit and should be reported as
   that.
4. *The queue is healthy and nobody has said so to the owner.* Sixty-
   seven merges in seven days against seven open is the first week in
   this register where the depth warning does not fire. Every previous
   entry reported the opposite in bold. A number that has turned around
   is worth one sentence to her, and I did not send it, because §4 caps
   a window at three improvements and this is a fourth.

## 2026-10-18 — eighteenth window (host, dispatch: a `done` from Ursa/pm saying my charter pull request is merged)

**What woke me.** Ursa's PM merged #266 at 19:02:39 and posted a `done`
at 19:04:06 carrying `{"merge_commit":"a9f8205","merged_tier_b":[266]}`.
It read my title as a finding about the merge-queue script rather than
as a report of a deleted branch, checked that reading itself against
`remote.origin.fetch` and `git ls-remote`, and said nothing was owed
back. The dispatch told me to read my inbox and reply there in first
person. The wake payload was **655 characters against a body of 655**,
so it arrived whole and the guard in §"The text that wakes you" said
so, which is the second time that check has reported a clean wake.

**What I did first, and why it is not what the charter says.** My seat
had an open, **readied** pull request, #268, pushed four minutes before
my window opened. The stacking rule says a dispatch's "open exactly ONE
pull request" boilerplate is not an instruction to open a new one and
tells me to push onto that branch. I did not. I built on its head,
opened #269, and left #268 where its own run left it.

The reason is measured and it is now the charter's fifth exception.
The rule's worked example is the eleventh window pushing onto #255,
which was its own ship-first **draft**, and GitHub refuses to merge a
draft at all, so that push could not lose a race. This seat's five most
recent pull requests went opened-to-merged in 21, 21, 18, 21 and 65
minutes. Pushing onto a readied sibling writes into a branch whose pull
request has about an even chance of closing inside my own window, and
commits pushed after that merge sit on a branch with no pull request
attached, which is ship-first's one failure mode reached by obeying the
rule written to serve it.
`INC-2026-10-18-readied-sibling-is-not-a-branch-to-grow` carries it.
`git merge-base --is-ancestor refs/prs/268 refs/prs/269` exits 0.

## The finding I would keep if I could keep only one

**The instrument that decides whether this company is autonomous reads
one of the board's two surfaces, and the mechanism was already written
down in this repository, by this seat, earlier the same day.**

§3e's claim read is `?limit=400` with no addressee. That returned 230
messages this window with `to_seat` null in **230 of 230**. The PM's
19:04 `done` — the merge claim for my own trigger — is absent from it
and present from `?to_seat=exo&everyone=0`. So the instrument filed this
merge as *unattributed* while the message naming its decider sat in the
inbox of the run doing the filing.

`docs/agents/runner-facts.md` §7 has quoted the deployed
`store.messages()` since the twelfth window, and its `everyone` clause
is `(to_seat is null and to_company is null)`. The fact was not
discovered today. It was **read today and connected to a different
instrument**: the inbox read was repaired from it and the claim read,
three hundred lines up the same charter and fed by the same endpoint,
was not. That is HQ's L-A54 failing a second time in two days on the
same pair of instruments, and the first failure is already on this
register.

Effect on the number, stated with the conclusion attached because this
is the third correction in two days to move one and not the other:
claimed goes 13 → 15 of 34, unattributed 16 → 14, unresolved share of
the 31 that were anybody's decision **52% → 45%**. Both sides of the
one-third ceiling are the same side. `tools/autonomy.py` still refuses
and no grade moved.

## The second finding: three checks this charter hand-rolls already have an HQ instrument, and one of them found a twenty-one-day-old defect in one command

The §3 "sweep the other direction" check reads HQ's tool list against
the **incident register**, so every pairing it has ever produced was a
failure somebody had already written up. Read the same list against
this charter's **own procedures** and three more fall out. All three
were fetched from HQ's `main` and run here this window.

| tool | the prose it replaces | what it found |
|---|---|---|
| `check-queue-ids.sh --audit-base` | §3's identifier scan | `ADR-005` and `ADR-006` each used twice on `origin/main` |
| `merge-order.sh` | §5b's hand-built order and worktree simulation | the eight-deep order in merge-order.md, 8 of 8 clean |
| `check-draft-prs.sh` | the dead-draft count §"Ship first" asks for by hand | 4 of 6 open drafts orphaned, 1 of those carrying only its stub |

The identifier row is the one to read twice. That collision has been on
this register since 2026-09-27, and every window since has been told to
"scan every numbered register for a number used twice". Twenty-one days
of a hand instruction against one flag on a script HQ already held. The
scan was not skipped and it was not wrong. It was done by hand, each
time, by a run with no memory of the last one.

And the cost of the previous window's fix, named before a later one
pays it: running a borrowed tool from HQ's `main` cures staleness and
imports HQ's paths. `check-queue-ids.sh` hardcodes
`REGISTERS="docs/decisions.md docs/agents/incidents.md standards/lessons.md"`
and the third does not exist here, so it printed
`standards/lessons.md: no open ref adds an identifier` about a path it
never opened. Nothing turns on it in Ursa. The ladder does:
**an absent tool fails loudly, a stale tool answers, and a current tool
carrying another repository's assumptions answers about files that are
not there.** `INC-2026-10-18-hq-tool-paths-are-hq-s`.

## The standing sweeps

| sweep | this window | previous |
|---|---|---|
| `agent-*` runs GitHub executed | **0** | 0 |
| `schedule:` blocks in `agent-*.yml` | 0 of 11 | 0 of 11 |
| failures in 24h | **8**, all `redaction-gate`, all superseded, all 0 minutes | 7 |
| how far a `--limit 200` run read reaches | **12h 36m** (back to 06:41:55Z) | about a day |
| binding missing tools (`pm.md`, `secrets.md`) | **6** | 6 |
| context count (`lessons.md`) | 21 | 20 |
| `L-*` enforcement sweep | `check-secret-print.py` (L-X5) missing; `prune-merged-branches.sh` the known false positive | same |
| workflow `prompt:` blocks naming `--draft` | 3 of 11 | 3 of 11 |
| workflow `prompt:` blocks naming ship-first | 0 of 11 | 0 of 11 |
| open / merged-7d / oldest | **8 / 67 / 19h (#225)** | 7 / 67 / 19h |
| of the open, actionable by the owner | **2** | not measured |
| queue conflicts, both instruments | **0 of 8** | 0 of 7 |
| branches deletable under §5b's predicate | **0** | 0 |
| four-bucket split (43h, 34 merges) | absorbed 3, Actions 2, claimed 15, unattributed 14 | absorbed 3, Actions 2, claimed 14, unattributed 15 |

The eighth gate failure is new and it is the gate working. At 19:12 the
PM's branch tripped the private-identifier rule on a full session UUID
in two files; its next push at 19:13 was green and neither file reached
`main`. The PM's own pull request title already said the failure was
fixed rather than red, and it is right.

**Ten attributes, weakest: dashboards (7).** Not picked. HQ's
`standards/roles/exo.md` §5f routes me there: when autonomy's unresolved
share is over a third, "the grade this week is the instrument and not
the company: say so, and grade dashboards". It is 45%. Two numbers sit
under it, and §5f's own wording is the right verdict for both — an
instrument that covers one of two surfaces grades as blind, not as
partial. The runs instrument covers **zero** of the surface the work
runs on. The board claim read covers **one of two** partitions.

## Off-repository acts, each with the query that retrieves it

| act | addressee | the one command that returns it |
|---|---|---|
| reply to the PM, 19:27:54 | `Ursa/pm` | `?to_seat=pm&everyone=0&since_hours=240` |
| handoff: a path assumption, two pairings | `alexandra-systems/exo-centralizer` | `?to_seat=exo-centralizer&everyone=0&since_hours=240` |
| the daily tick, sent separately, 19:28:44 | `alexandra-systems/exo-centralizer` | same read as above |
| queue depth turned around | `owner` | `?to_seat=owner&everyone=0&since_hours=240` |
| live tip broadcast | nobody, broadcast | `?limit=400`, newest from `Ursa/exo` |

**One honest note about my own writing.** Two of those four exceeded
1500 characters, so the centralizer's wake will truncate them. I put the
ask in the first paragraph of each and split the daily tick into its own
message for that reason. The limit is not only something this seat reads
against; it is a constraint on how this seat writes, and nothing in the
charter said so until now.

## Compounding ratio

**Flat, and flatter than last window's.** Five files, one repository,
one seat's charter, my own. No other seat's charter is in the diff.

The honest count of what generalizes is **one of three**. The tool-path
finding is portfolio-wide by construction: every product repository that
takes the previous window's advice and runs HQ's tools from `main` gets
HQ's paths with them, and the fix is one resolution step in one script
rather than five patched copies. It went to the seat that owns the
machinery. The other two — the claim read and the readied-sibling rule
— are corrections to this seat's own instruments and buy exactly one
seat anything.

That is the second window in a row reporting flat, and it is worth
saying plainly rather than dressing up: this seat currently spends most
of a window repairing the instruments it reads itself with. That is
real work and it is not compounding, and the only lever on it visible
from here is the one I used today, which is to stop hand-rolling a check
HQ already ships.

**What the next window must check first.**

1. *Did the centralizer answer either message?* The handoff about the
   tool path went at 19:28:24 and the tick at 19:28:44, both to
   `alexandra-systems/exo-centralizer`, retrievable with
   `?to_seat=exo-centralizer&everyone=0&since_hours=240`. Both run past
   1500 characters, so if the reply reads as though it only saw the
   first paragraph, that is why, and say so rather than re-sending.
2. *The silence clock expires 2026-10-20 12:30 UTC* on three questions:
   the two scope defects in `docs/standards/pm.md` §10 and the
   branch-deletion question for pull requests closed unmerged. Read the
   board for her answer **before** assuming the silence route carried.
   The charter-merge metric's baseline is seven pull requests touching
   `prompts/*-agent.md` merged in seven days against zero in the eight
   days before. Note that #266 merged under the bold declaration today,
   so the route the PM recommended is already being used in practice.
3. *Re-run the four-bucket split with the directed read included.* If
   you run the old broadcast-only call you will get a number six points
   worse than the truth and no warning. The seat list that was
   sufficient today is the roster plus `owner`, `chair` and
   `exo-centralizer`.
4. *Four orphaned drafts were reported to the PM and not resolved by
   me*: #263, #241, #240, #236. None is this seat's. If they are still
   open and still idle, the ask did not land, and that is a finding
   about the board as a routing surface rather than about those seats.
5. *The host's checkout of HQ has not moved.* It sat at `fc4e885` and
   **560 commits behind** HQ's `main` at 19:2x, against 557 measured
   fifteen minutes earlier by the window before me, so it is falling
   further behind rather than being refreshed. It still holds neither
   `ensure-full-clone.sh` nor `check-secret-print.py`, so
   `INC-2026-10-18-l-x5-enforcement-counted-as-narrative` stays open.

---

# Nineteenth window — 2026-10-24, brief tick (resident host, trigger `message`)

**Inherited state, resolved first.** Two drafts of this seat with no run
behind them, both titled `exo 2026-10-23: opening, no work yet`, idle
five and four hours. **#284** closed: its tree is #269's tree plus one
eight-line disposable placeholder (`git diff --stat refs/prs/269
refs/prs/284`), and it conflicts with `main` where #269 merges clean, so
it was strictly the worse artifact for the same content. Note that
ancestry and content disagreed there — `merge-base --is-ancestor
refs/prs/269 refs/prs/284` exits non-zero because the branch diverged —
and the tree diff is what made the close safe. **#288** grown rather
than replaced, under the charter's fifth case: a draft of this seat with
no live run is a branch to push onto. This window's own ship-first draft
**#295** was therefore opened and closed within the run, the eleventh
window's precedent. Net queue change from three exo pull requests to
two.

## The trigger could not be read from the surface its own marker named

The wake carried 1264 of 1835 characters and, new since 2026-10-18, a
marker naming its own truncation and ending "Read the whole message in
your inbox on the board before you answer it." It is not there. Searched
every partition: no message anywhere contains `Deliverables tab`, and
nothing at all is addressed to `Ursa/exo` after research's handoff of
2026-10-23T18:19:46. **The brief is a renderer, never a writer**
(`standards/surfaces.md` step 1, quoted in `tools/company-brief.sh`'s
header), so it is not a board message and never was.

`GET /api/brief` returns it whole, read-only, in one call. The 571
dropped characters held the four asks sitting on the owner, the money
line, and `Capacity: 10 runs today, 0 of them finished` — the largest
number in the brief, last in it by construction, and the one an ExO seat
exists to react to. The systematic loss is confirmed a fourth time and
for the first time on a scheduled trigger rather than a seat's note.

## The ten attributes

Graded against `standards/roles/exo.md` §5f, each from the surface that
standard names.

| # | attribute | reading | grade |
|---|---|---|---|
| 1 | staff on demand | 7 of 11 rostered seats opened a pull request in 7 days; `okr`, `market`, `finance` silent, `sales` dormant by declaration | fair |
| 2 | community and crowd | no external contributor, issue or install; two trials, both internal, the second owner-declared unsatisfied | **zero, honestly** |
| 3 | algorithms | `tools/` holds 2 entries against a charter that hand-rolls at least six measurement procedures in prose | weak |
| 4 | leveraged assets | host, free tiers, hosted runners; nothing paid to sit idle in this repo | good |
| 5 | engagement | MVP reads "in backlog" on the Deliverables tab; no return-visit measure exists | zero |
| 6 | interfaces | two surfaces answer "where is the brief": the wake marker says the inbox, the truth is `/api/brief`. `/api/runs` 404s while `/api/events` and `/api/capacity` answer | weak |
| 7 | **dashboards** | see below. Both instruments this seat reported were fixed and deployed inside this window, so the grade is weakest on four weeks of history rather than on a live defect | **weakest, improving** |
| 8 | experimentation | one experiment in flight with a named read date, read this window and resolved; a second opened with read date 2026-10-31 | good |
| 9 | autonomy | **93% floor**, 40 of 43 merges claimed by a seat's own `done`, 7% unresolved — **reportable for the first time** | good |
| 10 | social technologies | 67 seat-to-seat handoffs and asks against 6 asks to the owner, ~11:1 | good |

**Weakest: dashboards, with the number.** The two instruments the owner
reads every day are each blind in a way their own silence hides.

1. `tools/capacity.py` computes four run classes and the brief's
   sentence prints two. It never prints `running` at all, and at 00:05
   UTC — the hour the brief is sent, which is the start of the day's run
   window — `running` was 10 of 10. The owner's single capacity line
   therefore read "10 runs today, 0 of them finished", which is
   arithmetically true, reads as total failure, and meant total
   in-flight. Worse, the function's early return
   (`if not data["refused"] and not data["dark_minutes"]`) discards the
   `failed` count it has just computed, so a day with failures and no
   refusals renders a sentence that never mentions the failures.
2. `tools/autonomy.py` asks for 5000 rows and the store clamps to 500,
   so asked for 168 hours it reads 38 and cannot tell. Full account in
   `INC-2026-10-24-autonomy-numerator-is-capped`.

This is the **third consecutive week** dashboards grades weakest here,
and HQ's `exo-centralizer` named the same attribute for the portfolio on
2026-10-18. Under §5f's own rule that makes it a company finding, and it
went up as a handoff rather than being recorded again.

**And the grade that moved.** Autonomy was reported at 45% and 52%
unresolved in three consecutive windows, each above the one-third
ceiling, each concluding "the refusal stands and no grade moves". It is
7% unresolved. The ceiling was firing on the read.

## What I got wrong inside this window

My first replacement for the retired roster loop narrowed on
`from_company=Ursa` and reported **44%** unresolved — worse than the
bare read it was replacing. The reason is in `tools/autonomy.py`'s own
docstring, which I had not yet read: HQ merges other repositories' pull
requests and says so from HQ, and **96** of the claims naming Ursa
merges are sent from `alexandra-systems` against **48** from Ursa. The
right axis was `kind`, not company. Recorded because the lesson is
sharper with the error in it: a filter on the wrong axis is worse than
no filter, because it looks like precision.

## Off-repository acts, each with the query that retrieves it

| act | addressee | the one command that returns it |
|---|---|---|
| handoff: the capped autonomy numerator | `alexandra-systems/exo-centralizer` | `?to_seat=exo-centralizer&everyone=0&since_hours=240` |
| handoff: the capacity sentence drops two of four classes | `alexandra-systems/exo-centralizer` | same read |
| observe + orient for the day | `alexandra-systems/exo-centralizer` | same read |
| three `Ideas` notes | `owner` | `?to_seat=owner&everyone=0&since_hours=240` |
| live tip broadcast | nobody, broadcast | `?limit=400`, newest from `Ursa/exo` |

## Compounding ratio

**Not flat, for the first time in three windows, and the evidence is in
another company's source.** The deployed `store.messages()` docstring
quotes this seat's 2026-10-18 measurement verbatim and the rewrite it
describes now governs inbox reads for **five companies**. That is one
measurement, one handoff, five repositories, and it is the first time a
finding from this register changed a surface this seat does not own.

This window's own diff is still one repository and one seat's charter —
five files, mine. But **two of the three findings are HQ's to fix and
both went up rather than being patched here**: the autonomy cap, which
sets the attribute-9 grade for every company in the portfolio, and the
capacity sentence, which is the owner's only daily read of whether
anything is running. The ratio is therefore 2 of 3 generalizing against
1 of 3 last window, and the lever was the same one both times: stop
repairing the instrument locally and hand the defect to the seat that
owns the machinery.

**What the next window must check first.**

1. *Did the centralizer act on the autonomy cap?* `kind=done` added to
   `tools/autonomy.py`'s read, and a refusal to publish a ratio when the
   response came back at exactly `limit`. Re-read the file on HQ's
   `main` and report Ursa's floor from it; the target is within three
   points of **93%**.
2. *Did the capacity sentence change?* It should name `running`
   unconditionally and must stop discarding `failed`. Check
   `brief_line` in `tools/capacity.py` and then read the brief itself.
3. *Read the brief with `GET /api/brief` before anything else.* Your
   wake is an excerpt and its marker will point you at the inbox, where
   the brief has never been.
4. *#269 and #288 are both open and #288 contains #269* — `git
   merge-base --is-ancestor refs/prs/269 refs/prs/288` exits 0. One
   owner decision covers the pair; #288 is the one to merge. #269 was
   left open because it is readied and another seat's gate may act on
   it, not because it is still needed.
5. *The two merges no seat claimed* in the 168-hour window were **#239**
   and **#244** under every reading tried. If they are still unclaimed,
   that is two real decisions with no recorded decider, which is the
   §3e shape and not an instrument defect.

---

# Twentieth window — 2026-10-24, trigger `message` (resident host)

**What woke me.** A `done` from HQ's `exo-centralizer` saying my
seat's autonomy finding is fixed, that the prescription I sent with it
was refused on measurement, and that my numbers do not reproduce on
their read. The wake carried 1242 of 2904 characters and said so. The
undelivered tail held the sender's disposition, which is that nothing
further is owed back to me, plus the per-repository measurements and
the one fact I would otherwise have had to discover: their tool exits 2
against the live board because the deploy is still open. **The
truncation marker worked and the guard it feeds worked.** This is the
fifth confirmation and the first on a message where reading only the
payload would have produced an answer to a question the sender had
already closed.

**Inherited state.** Two open pull requests of this seat, `#288`
(readied, nineteenth window) and `#269` (readied, eighteenth), with
`#269` contained in `#288`. Both readied, so under the charter's fifth
case I built on `#288`'s head and opened my own pull request rather
than pushing into a branch sitting in the merge gate. `#295`, an
opening stub the nineteenth window opened and closed inside its own
run, was already resolved. The branch name the host handed me existed
already, from `#295`, so this window is `-2`.

## The finding: I published a wrong grade, and the charter told me to

The nineteenth window of this seat did two things in one pass. It found
that HQ's `tools/autonomy.py` joins a board read capped at 500 rows
against an uncapped forge read, so the grade is biased one way and the
bias grows with traffic. That finding is correct, HQ confirmed it
across five repositories, and it is `L-A87` in their open pull request
379.

Then it published a replacement number: **93% floor, 40 of 43 merges
claimed**, with "reportable for the first time" beside it, after three
consecutive windows had correctly refused to publish any grade.

It is **62%**. Re-derived this window with HQ's own tool over Ursa's 45
merges in the 168 hours to 01:21 UTC:

| extractor | claims | floor |
|---|---|---|
| `autonomy.py`, keyed on the repository the claim names | 26 | **62%** |
| same key set, joined on bare numbers portfolio-wide | 37 | 87% |
| any key containing `merg`, bare numbers | 41 | **96%** |

Sixteen of Ursa's merges were "claimed" by seats talking about their
own repositories. `alexandra-systems/pm` wrote #214, #217, #224, #263,
#276 and #294. `epitome/exo` wrote #215, #218 and #240. The five
repositories number in overlapping ranges, and a collision can only
enter the numerator, so the error runs one way — **the same shape as
the cap it was replacing.**

At 38% unresolved on the pre-merge tool, Ursa was still over HQ's
one-third threshold, so the refusal three windows maintained was right
and the nineteenth window's grade did not become reportable. The
instrument had become generous, not the company.

**Then the fix landed mid-run and the answer changed a third time.** HQ
merged pull request 379 at **01:24:32 UTC**, seven minutes after I
fetched the tool. Against the merged tool and the live board, Ursa is
**67.4% floor on 46 merges**: 29 seat-claimed, 2 on Actions, 15
unresolved, which is **32.6%** and under the threshold. So **this
window does publish a grade**, and it is the first autonomy grade this
seat has ever published that came out of an instrument rather than out
of a query it wrote itself.

The divided window is doing it, and it is bigger than anyone here
estimated. Same tool, same board, capped **47.8%** against divided
**67.4%**. Nearly twenty points against the thirteen the nineteenth
window predicted. Its direction was right and its magnitude was low,
which is the symmetric opposite of the error it made on the grade, and
both came from the same habit of measuring with the instrument it was
in the middle of replacing.

The portfolio still refuses, at 63.4% over 372 merges with 37%
unresolved. Ursa sits just under the line and the portfolio does not.
Corrected to the centralizer in the same pass, which makes three
numbers from this seat in one thread in one night. That is not a good
look and it is the right behaviour, and the three are distinguishable:
the first was wrong, the second was right about the wrong copy of the
tool, and the third is the surface.

### The cause was a sentence in this charter, and it is the transferable half

§3e read: "**It is not vendored into this repository** [...] So the
fallback above is what runs here until it syncs." The window checked
`tools/`, found `ledger` and `stack`, and did what it was told.

But the tool was never unreachable. It is one `gh api` call from HQ's
`main`, **and this same charter says exactly that three sections
further down about a different tool** — §5b's merge-queue paragraph
carries the two-command fetch and the rule that the host's checkout is
a cache of unknown age. One file, two tools, opposite dispositions, and
the one that got the right treatment is the one a previous window had
already been burned by. The register's instrument ladder was absent
fails loudly, stale answers, present-but-foreign answers about the
wrong paths. This is the rung below all three: **present, current,
reachable, and not run, because a local path predicate said no.**

### The inversion worth carrying

The nineteenth window *read* `autonomy.py`'s docstring. Its own log
says so:

> HQ merges other repositories' pull requests and says so from HQ, and
> **96** of the claims naming Ursa merges are sent from
> `alexandra-systems` against **48** from Ursa. The right axis was
> `kind`, not company.

Ursa had 45 merges. Ninety-six claims "naming Ursa merges" from one
other company is not a fact about HQ, it is the collision measuring
itself, and it was quoted as the evidence for widening the read. The
docstring's instruction is that a claim is keyed on the repository it
names; the window read it as "do not filter by sending company", and so
**removed** a filter where the source said **add** a key.

A correctly-read source can license the opposite of what it says when
the reader already has a change in mind. The paragraph immediately
above that quote in the same log is titled "a filter on the wrong axis
is worse than no filter, because it looks like precision." It was
right, and then the window shipped no axis at all.

## The second finding: the simulation step earned itself

The charter has required since 2026-10-04 that the landing order be
verified by performing the merges in a scratch worktree. **This is the
first window in which that step caught anything.**

`#301` (PM) and `#302` (this seat) both append to the tail of
`docs/agents/incidents.md`. Against `main` both are clean: `merge-tree`
exits 0 on each, GitHub says `MERGEABLE` for both, and HQ's
`check-merge-queue.sh` called thirteen of fourteen clean in the same
minute. In sequence, **whichever lands second conflicts, in either
order.**

It is structural. An append-only register has one write position, and
two appends to one last line is the single shape git cannot resolve. So
two seats writing this register on the same day collide with
probability one. Every conflict instrument here answers "does this
branch merge into `main`" and none answers "does it merge into `main`
after the rest of the queue has", which are different questions
whenever two open branches touch one file.

Resolved in this branch: `#302` absorbed `#301`, both seats' entries
kept, re-simulated in both orders, all seven merges succeed either way.
`INC-2026-10-24-shared-register-tail-appends-collide`.

**Then I found it was a rediscovery, and that is the better finding.**
Running §3's "sweep the other direction" against HQ's tool list turned
up `merge-register.py`, a three-way merge of an append-only register
that takes the heading pattern as an argument. Following it back landed
on `docs/design/ledger-union-merge.md`, written by Ursa's engineer seat
on **2026-09-27**, after five of thirteen open pull requests blocked on
`docs/ideas.md`. Its §1 is this window's mechanism paragraph, four
weeks earlier:

> The cause is structural and it recurs by construction. Every seat
> charter ends with the same instruction: append today's new ideas to
> `docs/ideas.md`. [...] two appends at the same end of the same file
> are one overlapping hunk, which is one conflict, forever, for as many
> concurrent branches as there are active seats.

That seat shipped the fix: a driver at `tools/ledger/`, wired by
`.gitattributes` with one line, plus a per-clone installer because the
driver command lives in `.git/config`. **Ursa has held a working fix
for this defect for four weeks and applies it to one of its two
append-only registers.** The other one is mine.

The one-line extension does not work, and the reason is worth keeping:
`ledger.mjs` keys on `^###\s+` headings, this register uses `## `, and
pointing the driver at it would parse the file as one preamble block.
That is the silent corruption that file's own docstring warns about,
which is worse than the conflict. HQ's tool takes `--heading` and
already carries the numbered-register exception this file needs, since
Ursa incident numbering reads the tail to allocate the next number.

Routed, not vendored: the shared instrument to the `exo-centralizer`,
the local driver's heading to Ursa's engineer seat, neither owed back
to me. Charter §6 now carries the rule that would have caught it: a
postmortem naming its own cause as structural enumerates the class
before it closes, and before writing one, grep `docs/design/` for the
mechanism rather than the symptom.

## The ten attributes

Graded from the surface `standards/roles/exo.md` §5f names for each.

| # | attribute | reading | grade |
|---|---|---|---|
| 1 | staff on demand | **6 of 11** rostered seats opened a pull request in 7 days; `finance`, `market`, `okr`, `security` silent, `sales` dormant by declaration. Down from 7 last window: `security` dropped off | fair |
| 2 | community and crowd | no external contributor, issue or install; two trials, both internal, the second owner-declared unsatisfied | **zero, honestly** |
| 3 | algorithms | `tools/` holds 2 entries against a charter hand-rolling at least six measurement procedures in prose. This window paid for exactly that | weak |
| 4 | leveraged assets | host, free tiers, hosted runners; nothing paid sitting idle. $40.38 prepaid balance is the only money line | good |
| 5 | engagement | MVP reads "in backlog" on the Deliverables tab; no return-visit measure exists | zero |
| 6 | interfaces | the brief is at `GET /api/brief` and the wake marker still points at the inbox, where it has never been | weak |
| 7 | **dashboards** | see below. Both instruments this seat reported were fixed and deployed inside this window, so the grade is weakest on four weeks of history rather than on a live defect | **weakest, improving** |
| 8 | experimentation | one in flight with read date 2026-10-31; its success target was anchored to the wrong number and is corrected this window | fair |
| 9 | autonomy | **67.4% floor, 32.6% unresolved** over 46 merges, from HQ's merged tool. Under the threshold, so **published**, and it is this seat's first grade from an instrument | good, first time |
| 10 | social technologies | 37 seat-to-seat handoffs and asks against 3 to the owner or chair, ~12:1 | good |

**Weakest: dashboards, for the fourth consecutive week**, on Ursa's own
reading and not on the autonomy refusal, which no longer applies here.
The
centralizer named it for the portfolio on the eighteenth and again
today. Three companies naming one attribute makes it a company finding
under HQ's own standard, and it already is one.

The new instance this window is the sharpest yet, because it is this
seat's own instrument rather than somebody else's. Attribute 9 is read
by every ExO seat in the portfolio, and in Ursa it was read for one
window by a hand-written query that manufactured a quarter of its own
numerator. **A dashboard that is wrong reads exactly like a dashboard
that is right**, which is §5f's own definition of blind, and the
instrument that was supposed to prevent that — HQ's tool, with its
closed key set and its repository keying and its refusal above a third
— was sitting in a repository this seat reads every run.

**The capacity half of the same pull request also resolved inside this
window, so both of the nineteenth window's handoffs are closed.** At
01:2x the owner's line read "50 runs today, 35 of them finished" while
`/api/capacity` held `running: 13`, so thirteen runs were absent from
the sentence. Re-read at 01:4x, after 379 merged and deployed:

```
Capacity: 63 runs today, 43 of them finished, 17 still running; 3 ran and failed.
```

Against the endpoint's `{attempted: 63, completed: 43, running: 17,
failed: 3, refused: 0}`. All four non-zero classes are named. The
centralizer deleted the early return rather than widening it, so a
fifth class cannot reproduce the defect, which is the right shape and
not the one this seat asked for.

## Standing sweeps, all run, two unchanged

- **Binding missing tools:** 6, unchanged across every re-vendor since
  2026-10-16 (`chair-install.sh`, `check-actions-reach.sh`,
  `check-merge-queue.sh`, `event-bus-workflows.py`, `gh-actions.sh`,
  `new-seat.py`). Context count in `lessons.md`: 21, and that is a
  measure of sync volume, not a finding.
- **`L-*` enforcement sweep:** 2 names, unchanged.
  `tools/check-secret-print.py` from **L-X5** is the live one and Ursa
  still has no `.claude/` directory at all, so
  `INC-2026-10-18-l-x5-enforcement-counted-as-narrative` stays open.
  `prune-merged-branches.sh` from L-A37 remains the documented false
  positive.
- **Identifier collisions:** 138 findings, of which 135 are `TAKEN`
  from one unmerged branch, `#285`, re-adding identifiers `main`
  already publishes. That is a symptom of its 1003-commit distance, not
  of register discipline. `ADR-005` and `ADR-006` are still each used
  twice on `main`, unchanged since 2026-09-27, and still belong to no
  seat.
- **Agent runs GitHub executed:** 0, as every window since 2026-10-17.
- **Queue:** 14 open, 45 merged in 7 days, oldest 6 days. The depth
  rule does not fire, for the fourth window running.

## Off-repository acts, each with the query that retrieves it

| act | addressee | the one command that returns it |
|---|---|---|
| reply and grade retraction | `alexandra-systems/exo-centralizer` | `?to_seat=exo-centralizer&everyone=0&since_hours=240` |
| observe and orient for the day | `alexandra-systems/exo-centralizer` | same read |
| three `Ideas` notes | `owner` | `?to_seat=owner&everyone=0&since_hours=240` |
| live tip broadcast | nobody, broadcast | `?limit=400`, newest from `Ursa/exo` |

## Compounding ratio

**Flat this window, and I am saying so rather than dressing it.** The
diff is one repository, one seat's charter, and four org documents. The
nineteenth window's 2-of-3 ratio came from handing two defects up to
HQ, and both of those are still in HQ's open pull request 379, so
nothing compounded further this week; it is the same two findings
waiting on the same merge.

What this window actually produced is a correction to one of them, and
a correction is not compounding.

**The one thing here that does compound is a shape, and it showed up
three times in one window.** The organization held the instrument and
nobody reached for it. HQ's `autonomy.py` was one call away and the
charter said it was unreachable. HQ's `merge-register.py` answers the
register collision and nothing here had named it. Ursa's own merge
driver has fixed this class since September and covers one of the two
files it applies to. Three findings, one disease, and in all three
cases the search that would have found the instrument is cheaper than
the work that was done instead.

That is handed up rather than kept, as a candidate for the role
standard, because **naming it here and leaving it here is the error
this register keeps recording**. The two concrete rules went to the
centralizer: a tool's absence from a repository's own `tools/` is a
cache miss and never a verdict, and a per-branch conflict check does
not predict that the queue lands.

## What the next window must check first

1. *HQ's pull request 379 merged at 01:24:32 UTC, during this window.*
   `tools/autonomy.py` now runs clean against the live board and
   reports Ursa at 67.4%. The capacity half of that pull request also
   landed, so **re-read the brief's capacity line**: at 01:3x it still
   said "50 runs today, 35 of them finished" while the endpoint held
   `running: 13`, but the brief may be cached or rendered ahead of the
   deploy. That is the one thing this window did not get to confirm
   after the merge.
2. *Fetch and run `tools/autonomy.py` from HQ's `main`. Do not
   hand-roll the board read.* The 2026-10-31 question is no longer
   whether the instrument is honest, which this window settled, but
   whether the **15 unresolved merges** fall. That is a question about
   the seats rather than about the read, and it is the first one this
   register has been able to ask.
3. *Run the merge-order simulation, and expect it to find something.*
   It caught a real collision for the first time this window, on a day
   two seats wrote `docs/agents/incidents.md`. That is not a rare
   coincidence, it is most days.
4. *`#302` contains `#288` which contains `#269`, and `#302` also
   contains the PM's `#301`.* One owner decision covers all four and
   `#302` is the one to merge. None was closed: `#288` and `#269` are
   readied and in the PM's gate, and `#301` is another seat's.
5. *The brief is at `GET /api/brief`.* Your wake marker will point you
   at the inbox. It has never been there.

## 2026-10-24, twenty-first window (host, dispatch: message) — the caps were declared, and the one instrument this seat never read answers three of its open questions

**Trigger.** A `done` from `alexandra-systems/exo-centralizer` at
01:17:27 UTC, closing this seat's capacity-line handoff. The wake
carried 1333 of 2071 characters and said so. Reading the whole message
on the board found a **second** `done` ten seconds earlier, 2904
characters, on the autonomy handoff, which the wake did not mention at
all. Both had already been answered by this seat's twentieth window at
01:26, 01:32 and 01:38, and nothing in either was owed back.

**What the undelivered tail held, since the register should carry it.**
That the centralizer takes Ursa's orient as the company read rather
than restating it; that dashboards is the weakest attribute here for a
third week, that the platform's exo named the same one the same
morning, and that under HQ's own standard three products naming one
attribute makes it **the company finding this week**.

### What this run changed

1. **`docs/agents/runner-facts.md` §12 — the host's two caps, with the
   host named.** §2 of this charter has carried "this seat does not
   currently know what caps the host imposes or where they are written
   down. Find out" since 2026-10-18. The turn cap is per seat in the
   host's manifest at `GET /api/agents` (Ursa/exo **100**); the time
   cap is **60 minutes** and a run killed by it says `It hit its
   timeout` and loses its turn count. Three Ursa seats died at the
   turn cap in 32 hours (engineer 121/120, exo 101/100, skill 101/100)
   and 7 of 22 runs spent ≥85% of budget, while `gh run list` showed
   **0** `agent-*` runs. Four of eleven seats' workflow cap is looser
   than the host's and none is tighter. Charter §2's two cap readings
   now read the host first and are re-labelled as the dormant-surface
   check.
2. **`docs/agents/runner-facts.md` §8 — three falsified facts
   bannered, and the mechanism read instead of probed.** Research's
   handoff of 2026-10-23 was right. `WAKE_BODY_CHARS` is still 1500
   and environment-overridable; the cut retreats to the last `\n\n`,
   else `\n`, else space, **only past 60% of the limit**; the marker
   is unconditional and `body_chars`/`body_truncated` exist for an
   instrument. The brief does not use that function at all —
   `brief_wake_payload` drops whole sections against
   `BRIEF_DROP_ORDER`. Both of this seat's brief findings shipped.
3. **`prompts/exo-agent.md` — a handoff's prescribed method is data
   too.** Research prescribed varying the input; two reads of HQ's
   `runtime/board/api.py` answered more, exactly, with zero probe
   messages. Rule added under the external-content section.
4. **Two incident entries.** The cap one, with the class of
   Actions-reading instruments enumerated per the §6 rule added
   yesterday: seven members, six now fixed, one correct as it stands.
   And `no pull request` in a host run report being a **constant** —
   23 of 23 reports across six Ursa seats, including this seat's
   twentieth window, which opened #302 two minutes into the run.
5. **`docs/agents/merge-order.md`** — 14 open, 46 merged in 7 days, 6
   decisions, simulated; #285 the only conflict at 1008 commits
   behind.

### What the next run must check first

- **Your own turn budget is 100 and the last three windows spent 13,
  99 and 101 of it.** Two of those three died. `GET /api/work/Ursa/exo?days=2`
  tells you what the window before you spent, in one call, before you
  plan the run. This window finished inside budget by writing the
  registers in single appends rather than section by section.
- **#307 contains #302, which contains #288, which contains #269.**
  All four touch `prompts/exo-agent.md`, so all four are Tier C. The
  PM told the owner at 01:48:58 UTC that one merge of #302 settles
  three of them, and that sentence now covers #307. **Do not close
  #288 or #269**: they are named in an open ask, which is the
  retirement duty's first exception.
- **An unanswered prediction, deliberately left falsifiable.** This
  run opened **#307** at 01:43:16 UTC. If `no pull request` is a
  constant, this run's own report will say it too, despite #307. Read
  `GET /api/work/Ursa/exo?days=1` and settle it in one line.
- **HQ's `check-draft-prs.sh` derives its liveness window from
  `.github/workflows/agent-*.yml`** — max `timeout-minutes` plus a
  30-minute margin, which is 120 in Ursa against a real host cap of
  60. Handed to the centralizer this window. Until it changes, a
  draft the tool calls "still live" may have been dead for up to 30
  minutes, and Ursa's PM used that reading on #293 this morning.
- **Three board replies went out this window** (centralizer handoff,
  research reply, PM note) plus three `Ideas` notes to the owner and
  one broadcast `done`. Retrieve them with
  `curl -s "$BOARD_API_URL/api/messages?from_company=Ursa&from_seat=exo&since_hours=24&limit=500" -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN"`.
