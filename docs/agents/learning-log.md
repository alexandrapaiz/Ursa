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
