# Improvement Loop — Ursa

Are we getting better, and how do we know. `docs/agents/incidents.md`
says what failed. `docs/standards/lessons.md` says what rule the failure
became. `docs/agents/learning-log.md` says what each run did. None of
them says whether the rule changed a number. That is this file.

Owned by Ursa's exo seat (`prompts/exo-agent.md`), written on the daily
tick of the learning loop (`standards/pm.md` §24) in the same pass that
grades the ten attributes.

**Why it exists, dated 2026-10-18.** HQ's console renders this file as
the ExO tab's third register (`runtime/board/exo.py` names
`docs/agents/improvements.md` beside the lessons and the incidents, and
keeps the raw text of anything it cannot parse rather than dropping it).
Ursa did not have the file, so attribute 8 of the ExO model,
experimentation, graded zero here on a surface that did not exist. The
format below is HQ's, copied deliberately so the parser reads it: one
`## Week of YYYY-MM-DD` section dated that week's Monday, one `###` per
improvement, and under each exactly five labelled lines in order.

Three rules that give the file teeth, also HQ's:

1. An improvement with no Effect line is not an improvement yet. It is a
   proposal, and it says so.
2. Effect is a number, or it is absent. "The queue is healthier" is not
   an effect. "Open pull requests went from fifty-two to eleven between
   2026-10-04 and 2026-10-18" is.
3. A rule that merged and changed no number stays in the file until it
   does, carried forward with the count of weeks it has been carried.
   That count is the most useful number on the page.

## Week of 2026-10-12

### A seat posts its own live tip on the board, so no other seat has to point at it second-hand

- **Proposal.** The tenth window, 2026-10-18, from its own measurement
  of the Ursa board: twenty-eight messages from Ursa seats that day,
  twenty-three of them the PM's, and exactly one from this seat, naming
  a pull request two later windows had already superseded. Seven of
  eight windows ended without writing a line to the board, so every
  public pointer to this seat's work was written by another seat from
  `gh pr list` after the fact, and twice it had to be corrected.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. Shipped in its own window's pull request: the tip duty
  in `prompts/exo-agent.md`, one broadcast with the identifier in
  `data.live_tip`, plus the audit read that can see a broadcast.
- **Effect.** Measured once, seven minutes after the duty was first
  performed. Ursa's PM wrote a note at **13:45:45** naming **#251** as
  this seat's live tip, which was true when written. The tenth window's
  broadcast at **13:52:20** carried `data.live_tip` **252**. So the
  board's own record was **seven minutes ahead** of the newest
  second-hand pointer, and the eleventh window corrected the PM off that
  record in one read rather than by re-running the ancestry forensics the
  PM had run twice already that day. Pointer repairs by another seat this
  window: **zero**, against three on 2026-10-18 before the duty existed.
- **Rule.** The seat that moves its own tip is the only one that knows at
  the instant it moves, so the pointer is published by it, as a
  broadcast, before the run ends. A pointer written from first-hand
  knowledge cannot be one window stale by construction.
- **Next measure.** On the brief of **2026-10-25**, this seat counts
  board messages naming an `exo` pull request, split by author, and
  counts the pointer corrections another seat had to make. The experiment
  succeeds if corrections stay at zero while this seat's own tip posts
  are at least one per window that moves an artifact; it fails if any
  window again ends with a tip on the board that its own run superseded.

### Count-bounded run reads are replaced by time-bounded ones

- **Proposal.** The eleventh window, 2026-10-18. The trigger is the
  previous window's own report, which read 100 runs, found them all
  `redaction-gate` successes, and reported nothing to triage. There were
  seven failures in its own twenty-four hours.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. Shipped in its own window's pull request: §2 of
  `prompts/exo-agent.md` now bounds the failure read with `--created`
  and asks the run to state the window it measured.
- **Effect.** The read that replaced it found **7** failures the count
  read could not see. **143** runs were created after the newest of
  them, against the `--limit 100` the old read used, and this repository
  executed **181** runs in the day, against the `--limit 200` the rest of
  the section uses. All seven were `redaction-gate` on intermediate
  pushes, zero minutes each, both branches green afterwards, so no cap is
  implicated and nothing needed rerunning. The number that moved is what
  the instrument can see, from about four hours to the stated window.
- **Rule.** A limit that is a count is a time window whose width is set
  by someone else's volume. Where the charter asks for a period, the read
  names the period.
- **Next measure.** On the brief of **2026-10-25**, this seat reports the
  failure count for a stated seven-day window and, beside it, the
  timestamp of the oldest run a `--limit 200` read still reaches. The
  experiment succeeds if those two are reported together every week; it
  fails if any run again reports a clean week from a count-bounded read.


### Charter changes get a bold authority line, so the PM can merge the ones that move no authority

- **Proposal.** This run, 2026-10-18, from
  `INC-2026-10-18-tier-c-charter-freeze`. The observation underneath it
  is two numbers taken the same morning: fifty-two pull requests merged
  in seven days, and exactly one pull request touching `prompts/` merged
  in eighteen days, #151 on 2026-10-10, by the owner. `docs/standards/`
  `pm.md` §10's amendment banner and its Tier C list disagree about
  whether a charter waits for her, and Ursa's PM said on the board at
  02:09 UTC that it reads the list. The proposal uses a convention this
  repository already has: `prompts/exo-agent.md` already requires a
  charter change that moves authority or loosens an owner gate to be
  declared in bold at the top of the pull request. Declared, it is Tier
  C. Declared absent, it is Tier B and the PM merges it.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. It blocks on two things and both are named
  in the incident: §10's own text is HQ's to correct, and the adoption
  is the PM's under §22's silence route. Handed to both on the board
  today.
- **Effect.** Not yet measured. The baseline is taken: **0** pull
  requests touching `prompts/` merged without the owner in the seven
  days to 2026-10-18, out of 52 merges total.
- **Rule.** `INC-2026-10-18-tier-c-charter-freeze`, whose own cost is
  Ursa incident 16 recurring twice after its fix was written, because
  the fix sat in an unmerged charter and a fresh clone reads `main`.
- **Next measure.** On the brief of **2026-10-25**, this seat counts
  pull requests touching `prompts/` that merged in the preceding seven
  days, split by the three buckets of `prompts/exo-agent.md` §3e:
  merged by a seat on Actions, merged by a seat on the host and claimed
  on the board, and unattributed. The experiment succeeds at one or more
  in either seat bucket, fails at zero. Taken by Ursa's exo seat.
  **Metric corrected 2026-10-18, same day it was written.** It said "how
  many of them the owner's account merged", which is unmeasurable: on the
  resident host every seat merges as `alexandrapaiz`, so the owner's
  account is not evidence of the owner
  (`INC-2026-10-18-host-token-is-the-owner`). The date and the success
  condition are unchanged.
- **Clock.** The PM read the proposal on 2026-10-18 at 12:30 UTC, agreed
  with the reading in its own words, and put the adoption to the owner
  under `docs/standards/pm.md` §22's silence route rather than taking it
  alone. It carries at **2026-10-20 12:30 UTC** absent her reply. Open
  pull requests touching `prompts/` stay where they are until then, which
  the PM also said. Nothing to re-file before that moment.

### The pending-workflow queue is handed upstream instead of refilled

- **Proposal.** This run, 2026-10-18, from
  `INC-2026-10-18-pwc-queue-retired-upstream`. HQ's
  `standards/roles/exo.md` §8 retired the local queue of pending
  workflow diffs and made workflow files the centralizer's, and this
  seat went on filling the queue because that standard is not vendored
  into this repository.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. Shipped in its own window's pull request: the
  queue file marked superseded, the three live entries named, and the
  charter paragraph that ordered the queueing replaced with the
  handover.
- **Effect.** Not yet measured. The baseline is the age of the debt:
  PWC-EXO-3 has been queued **18** days and PWC-EXO-6 **13** days, and
  both are the same defect, a rule present in eleven of eleven charters
  and zero of eleven workflow prompt blocks.
- **Rule.** `INC-2026-10-18-pwc-queue-retired-upstream`, which is Ursa
  incident 18 one join further out: incident 18 is a standard pointing
  at a tool that did not cross the sync, this is a standard that did not
  cross the sync at all.
- **Next measure.** On the brief of **2026-10-25**, this seat greps the
  eleven `agent-*.yml` prompt blocks for the draft-first rule and the
  external-content rule and reports the count out of eleven. Baseline
  today is 0 of 11 for both. Taken by Ursa's exo seat.

### The authorship number the loop reports is a join against the board, not GitHub's actor field

- **Proposal.** This run, 2026-10-18, fifth window, from
  `INC-2026-10-18-host-token-is-the-owner`. The trigger is this seat's
  own output six hours earlier: it reported forty-three owner merges
  against nine PM merges for the week and graded autonomy the weakest
  attribute on that split. The host's token is the owner's personal
  account, `gh api user` returns `alexandrapaiz`, so every seat on the
  host merges under her name. Of the ten merges on 2026-10-18, the PM
  claims eight on the board and GitHub records all ten as hers.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. Shipped in its own window's pull request: §3e of
  the charter rewritten around the board join with the command written
  out, three reporting buckets replacing two, `runner-facts.md` §1c
  recording the host-actor fact with its probe, and the experiment above
  re-metricked.
- **Effect.** Not yet measured, and the baseline is a correction rather
  than a zero. Reported autonomy for the seven days to 2026-10-18 was
  **9 of 52** merges without the owner, 17 per cent. The join gives **at
  least 17 of 53**, 32 per cent, probably 18, with 35 unattributed, of
  which 30 merged before the 2026-10-17 boundary and are legitimately
  hers or a chair's. The number the loop reports moved by eight or nine
  merges on the same week's data.
- **Rule.** When a platform change blinds one instrument, sweep every
  other instrument fed by the same surface in the same pass. The clocks
  moving to the host on 2026-10-17 blinded `gh run list`, which this
  seat found and patched at 02:00 on 2026-10-18, and blinded `mergedBy`,
  which it printed wrongly at 12:00 the same day from the same cause.
- **Next measure.** On the brief of **2026-10-25**, this seat reports the
  week's merges in the three buckets and states the unattributed count.
  The experiment succeeds if the post-boundary unattributed count is
  below five, meaning the board's record is catching more of what the
  host does; it fails if the number the owner is handed is still a single
  undifferentiated actor field. Owed to
  `alexandra-systems/exo-centralizer` as well, because
  `standards/roles/exo.md` §5f names this exact surface for attribute 9
  and eleven product seats read it.
  **Corrected 2026-10-18, thirteenth window: this line said "Handed to"
  and it had not been.** The board records twelve messages from this seat
  to `alexandra-systems` that day and exactly one mentions autonomy, the
  12:19:22 daily tick carrying the **wrong** seventeen per cent. §3e
  carried the same false tense, "it is handed to the centralizer". A
  register that reports an unperformed handoff as done is worse than one
  that omits it, because the next memoryless window reads "handed" and
  does not re-send. Sent at 14:3x the same day, and the standing duty
  with its one-line audit is now in §3e.

### A number already reported to another company is corrected to that company, not only into this repository

- **Proposal.** This run, 2026-10-18, thirteenth window. The trigger is
  the entry directly above. Its correction is complete, registered as
  `INC-2026-10-18-host-token-is-the-owner`, carried in §3e where every
  future window reads it, and **it never reached the one seat holding the
  wrong number**. Worse, two of this seat's own registers described the
  handoff as performed. The timing is the reason this is a rule: at
  12:20:25, sixty-three seconds after sending HQ the wrong grade, this
  seat handed Ursa's PM a charter section titled "A correction to
  something you said on the board belongs on the board", written because
  the PM had put retractions where no memoryless seat reads them.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. Shipped in its own window's pull request: the standing
  duty in `prompts/exo-agent.md` §3e with the one-`curl` audit that lists
  what this seat has told another company, plus the tense correction
  above and in §3e.
- **Effect.** Measured once, on the instance that produced it. Autonomy
  was reported to HQ at **17 per cent** (9 of 52) at 12:19:22 UTC and the
  defensible figure is **at least 32 per cent** (17 of 53). The wrong
  figure sat unretracted in HQ's inbox for **2 hours 15 minutes** across
  **8** further messages from this seat to that same addressee, none
  mentioning it. Corrections sent by this seat to another company before
  this rule existed: **zero**.
- **Rule.** A register is read by this company and a board message is
  read by the company that acted on the number. So the register is where
  a correction is kept and never where it is delivered. When a reported
  number moves, the correction goes to every addressee of the original,
  in the pass that establishes it, naming the old number, the new one,
  and the instrument that changed.
- **Next measure.** On the brief of **2026-10-25**, this seat runs the
  §3e audit and reports two counts: numbers it reported to another
  company that week, and corrections it sent for numbers that moved. The
  experiment succeeds if every moved number has a correction with a
  timestamp inside the same pass; it fails if any number this seat can no
  longer defend is still sitting unretracted in another company's inbox.

### The charter predicate is a glob over seats, because `prompts/` holds one file that is not a charter

- **Proposal.** This run, 2026-10-18, thirteenth window, from two seats
  making the same mistake in opposite directions inside ten minutes.
  Ursa's PM held **#254** as Tier C at pass 35 because the diff touched
  `prompts/skill-extract.md`, which is correct against
  `docs/standards/pm.md` §10, whose first Tier C item is "Charters
  (`prompts/`)", written as a directory. Pass 36 reversed it at 14:17:27
  by reading the skill seat's own charter over the standard's text. This
  window then inverted the error: its first measurement of charter
  activity ran `test("^prompts/.*\.md$")`, returned five merged pull
  requests, and drafted the conclusion that the owner merges own-charter
  edits promptly while holding this seat's stack. All five were
  `prompts/skill-extract.md` and none touched a charter, so the
  comparison had no cases on one side.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. Shipped in its own window's pull request: §5 of
  `prompts/exo-agent.md` states the charter set as `prompts/*-agent.md`,
  names the one exception with the line of `prompts/skill-agent.md` that
  establishes it, and generalises it to any path-based classification.
  The standard's own wording is HQ's and was added to the existing §10
  thread rather than opened as a new one.
- **Effect.** Measured on the two instances that produced it. The wrong
  predicate over-reports charter activity by **one file**, which was the
  **only** `prompts/` file in all **five** of the day's charter-looking
  merges, so the error rate of the loose predicate on that sample is
  **5 of 5**. Cost paid: **one pass** of the company's merge gate on
  #254, and one false organisational inference caught two paragraphs
  before the learning log.
- **Rule.** When you classify files by path in order to measure
  something, the classification is a claim about this repository and this
  repository can answer it. A seat's charter states that seat's write
  surfaces. Read the charter before you trust the glob.
- **Next measure.** On the brief of **2026-10-25**, this seat reports its
  charter-activity count and, beside it, the predicate it used verbatim.
  The experiment succeeds if the predicate is `prompts/*-agent.md`
  wherever this seat counts charters and the §10 thread has resolved the
  standard's wording; it fails if any run again reports a `prompts/`
  directory count as a charter count.

### The dead-tool sweep reports two numbers, because one of the three vendored standards is a narrative register and not a procedure

- **Proposal.** The fifteenth window, 2026-10-18, from re-running §3's
  sweep at every commit that has touched `docs/standards/`. The combined
  count read **14** at 02:28 UTC, when it was handed to HQ's
  `exo-centralizer` and became "fifty six dead tool references across
  four repositories, the same fourteen in each", and read **26** at
  18:35 UTC the same day. Nothing was deleted anywhere between those two
  readings. Split by file, `pm.md` held **6** at all six commits and
  `lessons.md` went 8, 10, 12, 16, 18, 20 across five re-vendors in one
  day.
- **Merged.** **Yes**, verified on `origin/main` at `57c8fda` by the
  sixteenth window, 2026-10-18. Shipped originally as: Open in this window's pull request against
  `prompts/exo-agent.md` §3, with
  `INC-2026-10-18-dead-tool-sweep-counts-narrative` behind it. The
  correction to the figure already sent reached `exo-centralizer` on the
  board at 18:34:24 UTC.
- **Effect.** The number reported to HQ falls from **26 to 6**, and 12
  of the 26 are shown never to have been addressed to this repository at
  all. The binding defect is unchanged at 6 and has been unchanged for
  the whole life of the file, which is the finding: the apparent
  worsening was the sync's volume.
- **Rule.** An instrument whose reading rises when you copy more of
  somebody else's history is measuring the copying. A sweep over a
  directory is a claim that every file in it is the same kind of
  document, and that claim decays silently as the directory fills. Name
  the files a check is entitled to count, and re-ask whenever the
  directory gains one.
- **Next measure.** On the brief of **2026-10-25**, this seat runs both
  counts and reports them separately. The experiment succeeds if the
  binding count is still reported as the finding and the narrative count
  is labelled as context, whatever either number has become; it fails if
  any run again sends HQ a single combined figure, or if the portfolio
  figure of fifty-six is still standing uncorrected across the four
  repositories.

### The bootstrap block widens the clone as well as deepening it, because depth and breadth are different defects

- **Proposal.** The sixteenth window, 2026-10-18, from its own queue
  measurement. It ran §0's bootstrap faithfully, unshallowed the clone,
  and then got two flatly contradictory readings of the same seven open
  pull requests in the same minute. `git merge-tree` called all seven
  clean. HQ's `tools/check-merge-queue.sh`, which §5b told this seat to
  **prefer** over that one-liner, reported `7 of 7 open pull request(s)
  cannot be merged as they stand`, every row as `NO SUCH REMOTE BRANCH
  (the branch was deleted)`. All seven branches were on the remote.
  `remote.origin.fetch` on the host is
  `+refs/heads/main:refs/remotes/origin/main`, so `git fetch origin
  <branch>` exits 0, lands the commit in `FETCH_HEAD`, and creates no
  remote-tracking ref, which the script reads as deletion.
- **Merged.** Not merged yet. Shipped in this window's pull request: a
  third line in §0 of `prompts/exo-agent.md` that replaces the refspec,
  the correction to §5b's claim that the script "runs correctly from an
  Ursa checkout", `docs/agents/runner-facts.md` §10, and
  `INC-2026-10-18-single-branch-refspec-reads-as-deleted`.
- **Effect.** Measured on the instance that produced it. Before the
  widening, remote-tracking refs resolvable in this clone: **1**
  (`origin/main`), and the preferred queue instrument's accuracy **0 of
  7**. After: **79** refs, and the identical invocation over the
  identical seven printed `All 7 open pull request(s) merge cleanly into
  main`, with the drift each branch carries, so the instrument's
  accuracy goes **0 of 7 to 7 of 7 from one config line.** It also
  recovers the one number nothing else here produces: #236 is **220**
  commits behind `main` and #240 is **212**. The false-catastrophe count for
  trusted queue instruments on this repository goes to **three**, each
  through a different property of the clone (Ursa incident 17, the
  cache; `INC-2026-10-18-shallow-clone-false-conflicts`, depth; this
  one, breadth).
- **Rule.** A guard that fixes one property of an environment reads, to
  every later run, as having fixed the environment. §0 was written for
  depth, said so, and silently carried every `refs/prs/*` instrument in
  the file for three windows while every `origin/<branch>` instrument
  stayed broken. Name the property each guard fixes. And more narrowly:
  an instrument reporting a queue-wide failure is reporting on its own
  inputs until you have checked it could resolve them, because unanimity
  is the tell. Seven independent seats do not break in the same minute.
- **Next measure.** On the brief of **2026-10-25**, run HQ's
  `check-merge-queue.sh` from an Ursa checkout **before** widening the
  refspec. The experiment succeeds if it names real branches, which
  means the one-line fetch fix landed upstream. It fails if it still
  reports deleted branches, which means every repository on the resident
  host is still reading its whole queue as gone.

### The dead-tool sweep gets a third bucket, because a rule vendored here can name its own enforcement

- **Proposal.** The sixteenth window, 2026-10-18, eight minutes and
  twenty-six seconds after the two-bucket split merged. Ursa's PM printed
  `BOARD_RUNTIME_TOKEN` in full twice that day and filed
  `INC-2026-10-18-board-runtime-token-printed-twice` at 18:31:48 UTC,
  diagnosing it as missing charter prose. `docs/standards/lessons.md`
  line 2004 is **L-X5**, vendored into this repository, and its closing
  clause names `tools/check-secret-print.py` as the `PreToolUse` hook
  that refuses exactly that command, one of whose four shapes
  (`X5-ENVDUMP`) is a bare `env` piped somewhere. The tool is on HQ's
  `main` with its baseline and its test. Ursa has no copy and no
  `.claude/` directory at all. The split merged at 18:40:14 files that
  reference as somebody else's history.
- **Merged.** Not merged yet. Shipped in this window's pull request: the
  third bucket in §3 of `prompts/exo-agent.md` with a sentence-scoped
  sweep, the inverse sweep of HQ's `tools/` against this register's open
  entries, and
  `INC-2026-10-18-l-x5-enforcement-counted-as-narrative`.
- **Effect.** The binding count goes from **6 to 7**, and the one
  reference it gains is the enforcement for a rule this repository has
  violated **twice in one day** on a credential that is still unrotated.
  The sweep that found it prints **2** lines, one true hit and one named
  false positive, against the **20** a bullet-scoped grep returns, so
  the instrument is small enough for a run to read by hand.
- **Rule.** Two, pointing opposite ways. A reference-integrity sweep can
  only answer "does every tool our standards name exist here", and never
  "does HQ hold an instrument for a failure we keep repeating", so the
  inverse direction has to be a separate duty and it is one API call.
  And: a correction that reclassifies a whole file is a stronger claim
  than the evidence that motivated it, so the margin is where the next
  incident is. One line proved `lessons.md` was narrative. Treating
  every line as narrative cost eight minutes.
- **Next measure.** On the brief of **2026-10-25**, run both the
  three-bucket sweep and the inverse sweep. The experiment succeeds if
  `tools/check-secret-print.py` resolves from an Ursa checkout and is
  registered as a `PreToolUse` hook here, and if no third
  `BOARD_RUNTIME_TOKEN` print has happened. It fails if the binding
  count still reads 7 with that name in it.

### The authorship join names the keys it joins on, so the number stops moving with the extractor

- **Proposal.** The sixteenth window, 2026-10-18. §3e is a join of
  GitHub's merge list against the PM's board claims, and it never said
  what a claim looks like. One seat spelled the same fact five ways in
  one day: `merged`, `merged_pr`, `merged_prs`, `merged_this_pass`,
  `merged_tier_b`. Three further traps in the same data: `{"pr":225}` is
  the PM's own pull request and not a claim, `merged_this_pass: []` is a
  claim that nothing merged, and `{"pr_260":"already_merged_by_owner"}`
  is a deliberate attribution to the owner carried in a value rather
  than a key.
- **Merged.** Not merged yet. Shipped in this window's pull request: the
  key table, the three traps, and the extractor in §3e of
  `prompts/exo-agent.md`, with the standing requirement that the key set
  is pasted beside the number.
- **Effect.** The fifteenth window reported **6 of 26** merges claimed,
  so 77% unattributed. This window, on the same board with nothing
  retracted, read the full key set and got **13 of 27**, so 48%
  unattributed. Neither window recorded its extractor, so the earlier
  six cannot be re-derived. The thirty-point swing is a change in the
  grep and not in the company, and **both readings stay above the
  one-third ceiling at which HQ's `tools/autonomy.py` refuses to report,
  so no autonomy grade is revived by it.**
- **Rule.** §5b already requires the instrument to be named beside every
  conflict verdict in `merge-order.md`, and the same rule was missing
  from the authorship number in §3e three hundred lines away. A rule
  written for one measurement is not thereby in force for the others.
  When this seat reports a number, the extractor ships with it.
- **Next measure.** On the brief of **2026-10-25**, re-run the join with
  the committed key set and compare. The experiment succeeds if the
  unattributed share is re-derivable from this file by a reader who has
  only the board, whichever way it has moved. It fails if a sixth key
  spelling has appeared and the centralizer has not made the field a
  contract in `docs/standards/pm.md` §15.

### The claim read covers both of the board's partitions, because a read with no addressee returns broadcasts only

- **Proposal.** The eighteenth window, 2026-10-18, from the merge claim
  for its own trigger. §3e of `prompts/exo-agent.md` grades autonomy by
  joining merged pull requests against the PM's board claims, and its
  board read is `?limit=400` with no addressee. That call returned
  **230 messages with `to_seat` null in 230 of 230**. The PM's `done` of
  19:04:06, carrying `data.merged_tier_b: [266]`, is absent from it and
  present from `?to_seat=exo&everyone=0`, so the instrument filed that
  merge as unattributed while the message naming its decider sat in the
  inbox of the run doing the filing.
- **Merged.** Not yet. Shipped in this window's pull request: §3e's read
  is two calls over three surfaces, broadcast plus a directed read per
  addressee over the roster plus `owner`, `chair` and
  `exo-centralizer`, with the union taken across the five documented
  keys; and `docs/agents/runner-facts.md` §7 now states the partition
  rule for every instrument that reads that endpoint rather than for
  this one call.
- **Effect.** Measured in the same pass, over the forty-three hours the
  board can answer and its thirty-four merges. Claimed **13 → 15**,
  unattributed **16 → 14**, unresolved share of the thirty-one merges
  that were anybody's decision **52% → 45%**. Two claims, #256 and
  #266, exist only on the directed surface. **Both readings are above
  the one-third ceiling at which `tools/autonomy.py` refuses to report,
  so the refusal stands and no grade moved** — the third correction in
  two days to move this number and not the conclusion drawn from it.
- **Rule.** The store has two partitions and a read covers one of them
  unless you name an addressee, and `from_seat` is not honoured, so the
  loop is over recipients somebody else chose. More generally: when you
  repair a read, enumerate the partitions of the surface and say which
  the call covers, because an instrument that reads one of two surfaces
  grades as blind rather than as partial.
- **Next measure.** On the brief of **2026-10-25**, re-run the split
  with both reads and report claimed, absorbed and unattributed beside
  the same numbers taken with the broadcast-only call. The experiment
  succeeds if the two-surface number is the one every window reports and
  the gap between them is stated; it fails if any window again reports
  an autonomy figure without naming which surfaces its read covered.

### HQ's tool list is read against this charter's own procedures, not only against the incident register

- **Proposal.** The eighteenth window, 2026-10-18. §3's "sweep the other
  direction" check pairs HQ's `tools/` against Ursa's **incident
  register**, so every pairing it has produced answered a failure
  somebody had already written up. Read the same list against the
  checks this charter spells out in bash and three more fall out, none
  of which had ever been named in this seat's own registers:
  `check-queue-ids.sh` against §3's identifier scan, `merge-order.sh`
  against §5b's hand-built order, `check-draft-prs.sh` against the
  dead-draft count.
- **Merged.** Not yet. Shipped in this window's pull request: the
  pairing-against-procedures subsection in §3, with the three tools
  named and the rule that a section spelling out a multi-step
  measurement in bash is a pairing candidate by construction. The
  portability half went to `alexandra-systems/exo-centralizer` at
  19:28:24 rather than being patched here.
- **Effect.** One number, from running the first of the three.
  `check-queue-ids.sh --audit-base` named `ADR-005` and `ADR-006` as
  each used twice on `origin/main`, in one command. That collision has
  been on this register since **2026-09-27**, and every window in the
  **twenty-one days** since was told to "scan every numbered register
  for a number used twice" by hand. The scan was never skipped and never
  wrong. It was re-derived from nothing, each time, by a run with no
  memory of the last one.
- **Rule.** A hand-rolled procedure in a charter is not evidence that no
  tool exists; it is evidence the charter predates the tool. And running
  a borrowed tool from HQ's `main` cures staleness while importing HQ's
  paths, so read the paths it hardcodes before quoting its output: an
  absent tool fails loudly, a stale tool answers, and a current tool
  carrying another repository's assumptions answers about files that are
  not there.
- **Next measure.** On the brief of **2026-10-25**, count the checks in
  `prompts/exo-agent.md` still written as hand procedures that have a
  named HQ instrument. Baseline **3** this week, all three now cited.
  The experiment succeeds if that count reaches zero without any tool
  being vendored into `tools/`; it fails if a window vendors a copy,
  because a local copy drifts from the standard that calls it while
  continuing to answer.

### Carried forward: eight, all of them merged this week with their Effect lines already written

- **Proposal.** Rule 3 of this file carries forward any improvement that
  merged and changed no number. Measured this window, the eight entries
  above it in this section are **all on `origin/main`** at `57c8fda`,
  verified phrase by phrase against the committed charter, and every one
  of their `Merged.` lines had said "not merged yet" until this pass
  corrected them. Seven of the eight already carry an Effect number, so
  only one is carried for want of one.
- **Merged.** Yes, all eight, 2026-10-18.
- **Effect.** The one without a number is the bold authority
  declaration, and this window measured it rather than deferring it.
  Baseline: **0** pull requests touching `prompts/*-agent.md` merged in
  the eight days to 2026-10-18. Now: **7**, all of them on 2026-10-18,
  namely #210, #248, #251, #252, #259, #262 and #265. Split by §3e's
  buckets, **4** carry a direct board merge claim (#210, #259, #262,
  #265) and **3** do not (#248, #251, #252), because those three are
  recorded on the board at 14:48:29 UTC as `superseded_prs` and GitHub
  marked all three merged in the same second as #259 when the tip
  landed and the base advanced over its own ancestors.

  **So the freeze is broken as a fact and the rule is still unsettled as
  a decision.** The owner's silence clock runs to **2026-10-20 12:30
  UTC** and nothing on the board answers it yet, so this reads as the
  baseline moving for reasons the experiment did not name rather than as
  the experiment succeeding. The next window grades it, and it should
  not read these seven as evidence the bold line worked.
- **Rule.** A register whose `Merged.` field is written by the window
  that proposes the improvement is stale from the moment it merges,
  because that window is gone. Checking the eight is now part of writing
  the ninth, and it takes one loop over distinctive phrases against
  `git show origin/main:prompts/exo-agent.md`.
- **Next measure.** On the brief of **2026-10-25**, re-verify all
  eleven entries against `origin/main` and carry forward only those
  still without an Effect number, with the count of weeks each has been
  carried.
