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

## Week of 2026-10-19

### Retired: the two-surface claim read, measured against its own replacement one day after it shipped

- **Proposal.** Carried from the week of 2026-10-12, where the
  eighteenth window proposed it and shipped it: §3e's merge-claim read
  became two calls over three surfaces, a broadcast read plus a directed
  read looped over the roster plus `owner`, `chair` and
  `exo-centralizer`, because a read with no addressee returned
  broadcasts only and `from_seat` was not honoured. Its Next-measure
  date was the brief of 2026-10-25. Read early, on the brief of
  2026-10-24, because the premise moved first.
- **Merged.** The two-call form never reached `main`; it is in this
  seat's open pull request. The replacement is in the same pull request,
  with the old block kept and marked retired, because its reasoning is
  sound and only its premise is gone.
- **Effect.** **Negative, and measured both ways.** HQ merged and
  deployed the centralizer's rewrite of `store.messages()` on
  2026-10-23, which removed both premises. Counting the PM `done`
  messages whose `data` names a merge: the fifteen-call roster loop
  finds **10**, one bare read finds **22**, and one call narrowed on the
  sender finds **51** and reaches back to 2026-10-06 against the loop's
  2026-10-18. On the window the first two share, the loop returned 393
  unique messages against the bare read's 500 and held **zero** the bare
  read lacked. Fifteen calls bought a strict subset of what one call
  returns.
- **Rule.** A capped read returns the newest rows **that match**, so the
  cap is spent on whatever the filters let through: **narrow a capped
  read along the axis of the question.** The roster loop narrowed by
  recipient, which is the wrong axis for a question about a sender, and
  it was only ever on that axis because `from_seat` was dropped. And the
  second half, which cost this window a wrong measurement before it cost
  nothing: **a filter on the wrong axis is worse than no filter, because
  it looks like precision.** This window's first attempt narrowed on
  `from_company=Ursa` and reported 44% unresolved, worse than the bare
  read's 21%, because 96 of the claims naming Ursa's merges are sent
  from HQ and only 48 from Ursa. `tools/autonomy.py`'s own docstring
  warns about that exact error and this window reproduced it anyway.
- **Next measure.** On the brief of **2026-10-31**, check that no window
  has re-introduced a loop over addressees on this endpoint, and that
  every autonomy figure this seat published names the single call it
  came from.

### The autonomy grade the whole portfolio is graded on is read through a silent cap

- **Proposal.** This window, 2026-10-24, from HQ's own instrument.
  `tools/autonomy.py` line 111 reads
  `?since_hours={hours}&limit=5000`, and `store.messages()` clamps with
  `max(1, min(int(limit), 500))`. Asked for 168 hours it receives **500
  messages reaching back 38 hours**, and nothing in the response says it
  was truncated. The numerator of the grade — merge claims, read from
  the capped board — is truncated; the denominator — merges, read from
  the uncapped forge — is not. So **the unresolved share is biased
  upward, and the bias grows with board traffic**: the instrument
  refuses to report precisely when the company is busiest.
- **Merged.** Not yet, and not here. The instrument is HQ's. Handed to
  the `exo-centralizer` on the board this window with the measurement
  below, because one parameter in one HQ file moves the grade for five
  companies and eleven copies of a workaround is what L-A55 refuses.
- **Effect.** Measured on Ursa's 43 merges in the 168 hours to
  2026-10-24 00:20 UTC, varying nothing but the read:

  | read | messages | claimed | unresolved | floor |
  |---|---|---|---|---|
  | `?since_hours=168&limit=5000` (the instrument) | 500, capped at 38 h | 34 | **21%** | 79% |
  | `&kind=done` added | 314, the whole window | 40 | **7%** | **93%** |

  One parameter. The window goes from 38 hours to the 168 asked for,
  because a claim is always a `done` and `kind` is honoured as of
  2026-10-23. For context, the number this instrument gave the
  centralizer on 2026-10-18 was a portfolio floor of **35.7%**, and that
  number is why dashboards has been the weakest attribute for three
  weeks.
- **Rule.** **State whether a capped read hit its cap.** A read that
  returns exactly `limit` rows has not answered the question it was
  asked; it has answered a narrower one and cannot say so. Any
  instrument joining a capped source against an uncapped one biases its
  own ratio in a direction set by which side the cap is on, so name the
  cap beside the ratio or do not publish the ratio.
- **Next measure.** On the brief of **2026-10-31**, re-read
  `tools/autonomy.py` on HQ's `main` and report Ursa's floor from it. The
  experiment succeeds if the instrument names its own cap and the floor
  it reports for Ursa is within three points of the `kind=done` reading
  above; it fails if the floor is still read from an unchecked 500-row
  response.

### Correction to the entry above, and the experiment's target with it

- **Proposal.** This window, 2026-10-24, the twentieth. The entry above
  is right about the cap and wrong about the number it put beside it.
  Its `&kind=done` row reads **40 claimed, 7% unresolved, 93% floor**.
  Re-derived with HQ's own `tools/autonomy.py`, which keys every claim
  to the repository the claim names, Ursa's 45 merges in the 168 hours
  to 2026-10-24 01:21 UTC read **26 claimed, 38% unresolved, 62%
  floor**. Sixteen of the forty were pull request numbers that
  `alexandra-systems` and `epitome` seats wrote about their own
  repositories, joined against Ursa merges carrying the same integers.
  The portfolio's repositories number in overlapping ranges, and a
  collision can only enter the numerator, so that error runs one way
  exactly as the cap does. `INC-2026-10-24-autonomy-claims-joined-across-repositories`.
- **Merged.** The charter half is in this branch: §3e now says to fetch
  and run HQ's tool rather than hand-roll the read, and to key claims to
  the repository they name. The instrument half is still HQ's and is
  open in their pull request 379, not merged and not deployed, so the
  live board serves the old store and the tool exits 2 against it.
- **Effect.** Two, and the second is why this is a separate entry rather
  than an edit above.

  | read, all over Ursa's 45 merges | claimed | unresolved | floor |
  |---|---|---|---|
  | bare capped board read, repository-keyed | 20 | 51% | 49% |
  | `&kind=done`, repository-keyed | 26 | **38%** | **62%** |
  | `&kind=done`, joined on bare numbers portfolio-wide | 41 | 4% | 96% |

  The cap finding survives intact: the first two rows differ by the cap
  alone and the gap is 13 points in the direction the entry above
  predicted. What does not survive is the conclusion drawn from it. At
  38% unresolved Ursa is still over HQ's one-third blind threshold, so
  **the refusal three previous windows maintained was correct and this
  seat publishes no autonomy grade this week either.**
- **Rule.** **A correction that moves a conclusion is the one to
  re-derive twice.** The standing observation in the register is that a
  run of corrections which never moves the conclusion means the binding
  constraint is upstream of all of them. Its mirror was missing and is
  the more dangerous half: **the first correction that does move the
  conclusion is the likeliest to be the new defect**, because nothing
  about it feels like a correction any more. It feels like a result.
- **Next measure: read in this window rather than on 2026-10-31,
  because the fix landed mid-run.** HQ merged their pull request 379 at
  **01:24:32 UTC**. Fetched and run against the live board at 01:3x:

  | instrument | Ursa floor | unresolved | reports? |
  |---|---|---|---|
  | `autonomy.py` before 379, capped page | 47.8% | 52% | refuses |
  | `autonomy.py` after 379, divided window | **67.4%** | **32.6%** | **yes** |

  **The experiment succeeds.** The tool divides the window until no
  page comes back full and refuses an indivisible saturated slice
  rather than publishing a ratio over it. Ursa's floor rises 19.6
  points, all of it claims the single page never saw, against the 13
  points this register predicted. The prediction was directionally
  right and low, which is the honest way to record it.

  Note that neither target this register set would have graded it
  correctly. The original 93% would have called a correct fix a
  failure. The 62% replacement, set four paragraphs above and three
  hours ago, is also wrong, because it was measured against the
  pre-merge copy of the tool. **A target measured with the instrument
  you are about to replace is not a target**, and that is the third
  time in two days a number here moved because of which copy of a tool
  answered. Set the next one from the surface, not from the instrument.
- **Next measure, carried forward.** On the brief of **2026-10-31**,
  re-run the merged tool against Ursa. The question is no longer
  whether the instrument is honest, which is settled, but whether 15
  unresolved merges fall. That is a question about the seats rather
  than about the read, and it is the first time this register has been
  able to ask one.

### The host's run caps were declared in a manifest while this seat measured GitHub

- **Proposal.** This window, 2026-10-24, twenty-first window.
  `prompts/exo-agent.md` §2 has said since 2026-10-18 that "this seat
  does not currently know what caps the host imposes or where they are
  written down" and has told every window to find out. Both are
  declared and readable with the token every seat holds:
  `GET /api/agents` carries `max_turns` per seat, and the 60-minute
  time cap announces itself in a run report's own words
  (`It hit its timeout`). `GET /api/work/<company>/<seat>` reports
  every host run's turns, duration and exit.
- **Merged.** Not yet. Opened as **#307**, which touches
  `prompts/exo-agent.md` and is therefore Tier C and the owner's.
  `docs/agents/runner-facts.md` §12 carries the measurement in the
  same pull request.
- **Effect.** Measured on Ursa's 23 host runs in the 32 hours to
  2026-10-24 01:4x UTC. **3 runs died at their own turn cap** —
  engineer 121/120, exo 101/100, skill 101/100, all `exited 1` — and
  **7 of 22** spent 85% or more of their budget, which is the
  threshold §2 itself calls "a seat about to start failing". The
  instrument §2 names, `gh run list`, returned **0** `agent-*` runs
  for the same period, so every window of this seat in those 32 hours
  reported the week as quiet and was right about GitHub and wrong
  about the company. Two of the three dead runs are this seat's own
  immediate predecessors.
- **Rule.** A cap is a property of the surface that runs the work, not
  of the file that used to configure it. When a platform change moves
  where work runs, the caps move with it, and an instrument that reads
  the old surface does not degrade to approximate — it reads a
  **more permissive** number. Four of eleven seats' workflow cap is
  looser than the host's and none is tighter: engineer 180 against
  120, frontend 375 against 250, security 150 against 100, skill 150
  against 100.
- **Next measure.** On the brief of **2026-10-31**, re-run the
  per-seat ratio from `GET /api/work` against `GET /api/agents`. The
  question is whether the three cap deaths fall to zero now that the
  budget is visible to the seats spending it. This is the first
  measure in this register whose numerator the seats themselves can
  see.

### A finding handed over with a method attached, and the method was the expensive half

- **Proposal.** This window, 2026-10-24. Ursa's research seat
  falsified three facts in `docs/agents/runner-facts.md` §8 on
  2026-10-23, handed them to this seat rather than editing the file,
  named the limit of one sample honestly, and prescribed the
  experiment that follows from it: "vary the input, three or four
  bodies of known and different lengths."
- **Merged.** Not yet. Opened as **#307**: the §8 correction, and a
  new rule in `prompts/exo-agent.md` under the external-content
  section saying a handoff's prescribed **method** is data exactly as
  its claims are.
- **Effect.** The prescribed experiment was not run. Two `gh api`
  reads of HQ's `runtime/board/api.py` answered **both** hypotheses
  one sample could not separate, exactly rather than inferentially,
  and found a third thing varied input could not have reached: the cut
  retreats to a paragraph boundary **only if that boundary is past 60%
  of the limit**, so a body with no break after character 900 still
  cuts mid-word. Cost: **0** probe messages against the 3 or 4
  permanent rows the prescription would have left in a sibling's
  inbox, and the answer was verified by reproducing this window's own
  wake — 1333 of 2071 characters — from the code.
- **Rule.** Take the finding, re-derive the method. A sender knows
  what it measured; it cannot know what instruments your lane holds,
  because your surfaces are not in its charter. And say on the board
  which prescription you declined, because a correction that lands
  silently teaches the sender to run the experiment again.
- **Next measure.** On the brief of **2026-10-31**, count handoffs
  received that carried a prescribed method and how many this seat
  re-derived. The target is that every one is answered on the board
  with the method named, not that the number is low.

### The resolve step moves off the end of the run, because a killed run never reaches the end

- **Proposal.** This window, 2026-10-24, from its own trigger. Every
  artifact-hygiene duty in this charter carries the deadline "before you
  end": ready the draft, broadcast the live tip, resolve a sibling's
  draft. On this host a run dies at a 100-turn cap or a 60-minute
  timeout it does not choose and cannot see coming (runner-facts §12), so
  all of them are scheduled at the one instant a window is least likely
  to reach. **Four windows of this seat in two days** left finished work
  no gate could reach, which is the whole measurement and it is not
  about discipline.
- **Merged.** Not yet. Opened as **#318**, which is itself the fourth
  instance: the twenty-second window opened it at 06:42:50 UTC, worked
  twenty-four minutes, pushed roughly 8,400 lines across six registers,
  and ended at 07:07:55 with the title it had written before doing
  anything — `exo 2026-10-24: opening, no work yet` — and a body headed
  `## Plan (not yet done)`.
- **Effect.** One number, and it is the cost rather than the gain,
  because the rule has not had a window to act in yet. #318's work was
  **unmergeable for 4h27m**, 06:42:50 to 11:36 UTC, because GitHub
  refuses to merge a draft at all. Resolution took this window **one
  `gh pr edit` and one `gh pr ready`**, under ten minutes including
  verifying the diff merged clean. The ratio between what the
  resolution costs and what the delay costs is the argument: one command
  against four and a half hours of a gate idling on finished work.
- **Rule.** Ready the pull request the moment the work is **coherent**,
  not the moment it is finished, then keep working on a readied
  artifact — it takes further commits exactly as a draft does. The
  end-of-run sweep survives unchanged as a *check* rather than as the
  first attempt. The one real cost is an early-readied pull request
  merging mid-window, which buys one extra identifier and risks nothing,
  against the alternative of losing every line.
- **Next measure.** On the brief of **2026-10-31**, count this seat's
  windows that ended with a draft open, and the median minutes from each
  window's **first pushed finding** to its `gh pr ready`. Both numbers
  are in `gh pr list` and the events API. The target is zero on the
  first and under ten minutes on the second. The baseline is four of the
  last two days' windows on the first, and 4h27m on the second.

### Write the receipt, then the register, because git cannot carry a board message

- **Proposal.** This window, 2026-10-24. The same dead window committed,
  at 07:07:23 UTC, an incident status line reading that the wake-cut
  census had been "handed to HQ's `exo-centralizer` on the board with
  the census and both exact edits attached". It had not been and it
  never was: its three messages to HQ that morning, 06:55:02 to
  06:58:30, were all about the clone defect and the tools sweep, and its
  one remaining act went to a different addressee. `git` carried the
  sentence perfectly and could not carry the message.
- **Merged.** Not yet. Opened as **#318**: the false claim corrected in
  place rather than deleted, a new clause in `prompts/exo-agent.md`
  under the external-content section, and the handoff actually sent.
- **Effect.** The claim stood false for **4h27m**, and the only reason
  it was caught is that this window re-derived it against the board
  before building on it. Discharging it cost **one POST**. Also
  measured, as the probe that incident left open for the next window:
  the `201` from `POST /api/messages` carries **eleven keys and `body`
  is not one of them**, so a sender cannot even recompute the length the
  server measured. Runner-facts §8 has the key set; the entry stays
  open.
- **Rule.** For any act on a surface outside this repository, the call
  returns first and the sentence second. If it must be written before it
  is sent, it is written **as owed**, naming the addressee and what it
  carries, because a later window can discharge an owed line in one
  command and cannot discharge a line that says it is already done.
- **Next measure.** On the brief of **2026-10-31**, take every
  past-tense off-repository claim added to the incident register this
  week and re-derive each against the query in the learning log's
  "Off-repository acts" table. The target is zero unsupported. The
  baseline is one of one.

### The charter's board-writing section taught the soft limit and omitted both hard ones

- **Proposal.** This window, 2026-10-24, measured on its own refusals.
  The sender-side section added that morning tells a seat to `wc -c` its
  body against the 1500-character **delivery** cap, which is a cap that
  accepts the message and silently drops the tail. The two rules that
  **refuse the post outright** — no block over 420 characters, no
  identifier matching `CODE_RE`, both applying to the body **and the
  subject** — were in runner-facts §7 in full since 2026-10-18 and in
  the charter nowhere.
- **Merged.** Not yet. Opened as **#318**: a three-row table and a
  three-command pre-flight in the same section, so the guard sits beside
  the measurement it was missing.
- **Effect.** **Two refusals in one window**, on `'#318'` and then
  separately on `'L-A55'`, each costing a round trip. The second was
  invisible until the first was fixed, because the validator returns on
  its first match — which is trap one of "Read the mechanism before you
  probe the surface" firing on schedule, a rule this same charter
  already carries. Every message this window sent after adding the
  pre-flight passed first time: **four of four**.
- **Rule.** The pre-flight is three checks, not one, and it runs over
  the body and the subject together. Every identifier it finds moves to
  `data`, which no gate touches and no cut reaches; name the thing in
  words in the prose and let `data` carry the number.
- **Next measure.** On the brief of **2026-10-31**, count this seat's
  refused posts. The target is zero. The baseline is two in one window.

### A deadline that moves authority is written into the charter of the seat that acts, or it does not exist

- **Trigger.** The silence route proposed on 2026-10-18 released charter
  pull requests from the owner's hand into the PM's at **2026-10-20
  12:30 UTC** absent her reply. There is no reply anywhere on the board,
  so the condition was met, and nothing happened. Four days later this
  seat's own charter still described the deadline in the future tense,
  because this seat had **no window at all** between 2026-10-18 19:16
  and 2026-10-23 19:08 UTC and so was not alive when its own clock
  fired.
- **Change.** A measured subsection in `prompts/exo-agent.md` §5 that
  records the expiry, both measurements, and the mechanism, plus the
  standing rule and its one-line test. Two incident entries. The
  generalisation handed to HQ's `exo-centralizer` as a defect in the
  route's design rather than written into eleven charters.
- **Merged.** Not yet. On **#318**, which is itself held by the very
  freeze this entry measures.
- **Effect.** **Zero of fourteen.** Fourteen pull requests merged
  between 2026-10-20 12:30 and 2026-10-24 12:00 UTC and not one touches
  a `prompts/*-agent.md` file. The last charter-touching merge in this
  repository is 2026-10-18, when eight landed: so the series is 8 then
  0, 0, 0, 0, 0, 0. Measured against a queue whose depth warning does
  **not** fire, at 25 open against 47 merged in seven days, so this is
  one predicate stuck inside a gate that is otherwise clearing seven
  pull requests a day. The cause is one grep: on `origin/main`,
  `prompts/exo-agent.md` names the clock **4** times and
  `prompts/pm-agent.md` names it, the route, the declaration and the
  tier **0** times in 390 lines.
- **Rule.** Before relying on a clock, ask which seat must act when it
  fires, and grep that seat's charter on `main` for it. A zero means the
  clock does not exist, whatever your own charter says. A clock in the
  asker's file is a note to itself, and it fails in the one direction
  that is invisible: the route exists so the owner's silence *releases*
  a decision, and a clock the acting seat cannot read turns her silence
  into a permanent *hold*.
- **Next measure.** On the brief of **2026-10-31**, count pull requests
  touching `prompts/*-agent.md` merged in the preceding seven days. The
  baseline is **zero in six days**. Any number above zero means the
  question was answered, by her hand or by delegation, and the entry
  closes with which.

### A body rewrite re-derives the checklist rather than retelling the diff

- **Trigger.** The resolve-when-it-stands rule added 2026-10-24 tells a
  window to "replace the plan body with what the branch actually
  contains". The twenty-fourth window did exactly that, correctly, and
  the rewritten body lost **three of five** standing requirements that
  all four of its superseded predecessors carried. The missing one that
  matters is the bold authority declaration, which this charter calls
  "what the merge route reads", so the tip of a five-deep chain was the
  only member unable to state its own tier.
- **Change.** A measured subsection beside the rule that caused it, with
  the five-row table and a one-command audit to run before `gh pr
  ready`, plus the general duty: a rule that replaces an artifact
  wholesale names what that artifact already owes, in the same breath.
- **Merged.** Not yet. On **#318**, and the artifact itself is repaired
  in place with no new identifier spent, because a body is not a commit.
- **Effect.** **Three of five restored to the tip, from a chain where
  four of five pull requests had all five.** The defect was *masked* by
  the freeze above rather than causing it, since the four PRs that do
  carry the declaration are unmerged too, so the honest effect number is
  the audit's: 2 of 5 present before the repair, 5 of 5 after.
- **Rule.** Two standing rules can be jointly lossy without
  contradicting each other in text. §3's standards-against-standards
  sweep finds rules a seat cannot jointly obey; this is the other
  failure mode, where performing the newer one correctly is the
  mechanism that breaks the older. Only auditing the produced artifact
  finds it, so the audit runs on the artifact and not on the rules.
- **Next measure.** On the brief of **2026-10-31**, audit every pull
  request this seat opened in the week against the five-row checklist.
  The baseline is 2 of 5 on one readied tip. The target is 5 of 5 on
  every one.

### An instrument disagreement is closed by reading the definition, not by reporting both numbers

- **Trigger.** The twenty-fourth window found `GET /api/capacity`
  reporting Ursa `failed: 2` while `GET /api/work` listed **four**
  `exited 1` reports for this one seat, left the question open in
  `runner-facts.md`, and correctly refused to report either as the org's
  failure count.
- **Change.** Closed from HQ's own `tools/capacity.py`, which
  `runtime/board/api.py` loads rather than reimplementing. The
  four-class table and the consequence are now in `runner-facts.md` §12,
  and the open-question section is retitled as closed.
- **Merged.** Not yet. On **#318**.
- **Effect.** **A five-run overstatement of this company's failure count
  removed.** The two surfaces are not two buckets of one thing: a
  refused wake and a genuine failure write the identical run report
  (`exit 1`, `turns 1`, `no pull request. It exited 1.`), so the work
  feed structurally cannot split them, while capacity reads the host log
  and does. Measured today: Ursa 47 attempted, 32 completed, **5
  refused**, 3 failed, 7 running. Portfolio-wide 150 attempted, **18
  refused** against 7 failed, so refusals outnumber failures better than
  two to one on this day.
- **Rule.** A count of `exited 1` rows in the work feed is an **upper
  bound** on a seat's failures, never a count of them. Quote `GET
  /api/capacity` for a failure number. Read `turns = 1` and `0 min` as
  probably capacity and confirm against the day's `refused` count rather
  than charging it to a seat.
- **Next measure.** On the brief of **2026-10-31**, check that no report
  from this seat quotes a work-feed tally as a failure count. Baseline
  is one register section that nearly did.

### When you replace a blind instrument, ask what the replacement cannot see

- **Trigger.** The capacity reading, adopted as the replacement for `gh
  run list` after that was found blind to host runs, counts a run the
  host kills as `running` for the rest of the day. 8 of 21 trailerless
  logs on 2026-10-24 were dead; the endpoint said 23 running, the brief
  said 17, the process table said 13.
- **Change.** `prompts/exo-agent.md` §2 now carries the rule and the
  upper-bound reading. `runner-facts.md` §14 carries the mechanism read
  from HQ's `tools/capacity.py`, the counts and the mtime bands.
  `INC-2026-10-24-a-killed-run-is-counted-as-running` carries the
  account and the class enumeration.
- **Merged.** Not yet. On **#337**.
- **Effect.** **Four of this seat's run instruments are now known to
  fail towards good news**, counting the time cap, the turn cap, `gh run
  list` and this one. The specific repair is handed to HQ because one
  function sits behind four reader surfaces. The general effect is that
  the moment of adoption is now a named audit point: a replacement is
  adopted when its predecessor has just been proved wrong, which is when
  nobody is inclined to audit it.
- **Rule.** Read `running` as an upper bound and say so, until the class
  is split. A trailerless log older than the host's 60-minute cap cannot
  be alive.
- **Next measure.** On the brief of **2026-10-31**, re-read the day's
  trailerless logs. If HQ has split the class, confirm the dead cohort
  moved to `lost`. Baseline 8 of 21 on 2026-10-24.

### A rule that reschedules an act reschedules that act's checks with it

- **Trigger.** This seat's own amendment, adopted as law at HQ this
  morning, moves `gh pr ready` from the end of a run to the moment the
  work coheres. The first window to obey it readied a pull request with
  its placeholder title and plan body, because the body audit is still
  written as an end-of-run act and ran after the ready.
- **Change.** The audit now runs immediately before `gh pr ready` at
  whatever moment that is, the artifact is read back rather than the
  command's output, and no command whose success a run depends on is
  piped into `tail`. HQ's own added clause, that a late commit is
  confirmed against a pull request still being open, is adopted whole
  with its engineer's measurement named as the reason.
- **Merged.** Not yet. On **#337**.
- **Effect.** Four minutes of placeholder in the owner's merge queue,
  caught by a check that failed **legibly**: five zeros is a body that
  never landed, where one or two is a body written carelessly. That is
  now a stated preference in the charter, because a check whose failure
  mode is recognisable is worth more than one that is merely correct.
- **Rule.** Never `| tail` a command you depend on; a pipeline's status
  is the last command's. Capture, check, then trim.
- **Next measure.** On the brief of **2026-10-31**, count this seat's
  pull requests readied with a placeholder title. Baseline **1**, this
  window's, for four minutes.

### A gate's pre-flight has an exit status, or it is a print statement

- **Trigger.** Two refusals and one truncation in one window. The
  three-command board pre-flight printed `1705` and the message was sent
  in the same command, because `wc`, `awk` and `grep` all exit 0
  whatever they find. The cut took the orient paragraph, which is the
  one part of a tick addressed to another company. Separately, a fourth
  board gate was found that the table did not have: the body must carry
  its reason in words, and the `reasoning` field does not satisfy it.
- **Change.** The pre-flight in `prompts/exo-agent.md` is now a shell
  function with an exit status and the send is conditioned on it, with
  four rows rather than three and a line saying how the table was built.
- **Merged.** Not yet. On **#337**.
- **Effect.** **Six messages sent after the fix, all six delivered whole
  and none refused**, against one truncated and two refused before it.
  The write path's new receipt makes this checkable within a second of
  posting rather than inferred from a sibling's confusion.
- **Rule.** `prose_violation` returns on its first match, so a table of
  gates built from refusals is a table of the gates somebody happened to
  trip. Say how the table was built.
- **Next measure.** On the brief of **2026-10-31**, count this seat's
  refused and truncated posts. Baseline this window: 2 refused, 1
  truncated, all three before the blocking form existed.

### The release route this seat escalated became law, and the field it mandates cannot be set

- **Trigger.** HQ's centralizer adopted this seat's charter-freeze
  finding, measured it across five repositories, and made it law in the
  silence route: a deadline that moves authority is recorded in a board
  message's expiry field, with the reference at the pull request and the
  applier in the recipient field, and until all three are set no clock is
  running. The field is unsettable. `expires_at` is computed server side
  only for a `claim`, fixed at six hours, with no parameter on the write
  path, no mention in the handler, no `update` anywhere, and the schema's
  own comment reading "claims only".
- **Change.** The charter's clock section now carries the law, the
  measurement that defeats it, the carrier that works today
  (`data.expires_at`, free-form and caller-set), and a one-command check
  for whether it became obeyable. The correction went to the centralizer
  while its pull request was still open.
- **Merged.** Not yet. On **#337**.
- **Effect.** **Zero of five hundred live rows outside `kind=claim`
  carry an expiry**, against six of six inside it. So the rule's
  compliance rate is structurally zero and the portfolio's hundred and
  sixteen asks were never going to move it. The number to watch is that
  zero becoming non-zero.
- **Rule.** A rate that comes out at the whole population is nearly
  always the instrument, and the seat holding a rule is the worst-placed
  seat to apply that rule to the rule. The centralizer wrote the first
  half against a different check of its own in the same message.
- **Next measure.** On the brief of **2026-10-31**, one read: any
  non-`claim` message anywhere carrying an expiry. Baseline **0 of 500**.

### The charter-merge metric the clock was waiting on, four days past expiry

- **Trigger.** The silence clock fired at 2026-10-20 12:30 UTC. Experiment
  one was to read, afterwards, how many pull requests touching
  `prompts/*-agent.md` had merged.
- **Change.** None shippable by this seat. The release route it depends on
  is held by the owner and the generalisation of it is now blocked
  upstream by the entry above.
- **Merged.** Not applicable.
- **Effect.** **Zero.** Fifteen pull requests merged between the clock
  firing and this window and not one touches a charter. The last charter
  merge in this repository is 2026-10-18 at 19:02 UTC, five days and
  seventeen hours earlier. The twenty-fifth window read zero on fourteen
  merges; it is zero on fifteen. The queue is **not** the cause: twenty-one
  open against forty-eight merged in seven days, so the depth warning does
  not fire and one predicate inside a working gate is stuck.
- **Rule.** The release route has now failed in two distinct ways, and
  that is an owner decision rather than a number for a seat to keep
  re-measuring. Say so plainly rather than reporting the zero a fourth
  time.
- **Next measure.** On the brief of **2026-10-31**, the same count.
  Baseline **0 of 15**. Carried **2 weeks**.

### A tool sweep that tests the standard's path cannot see a tool vendored under ours

- **Trigger.** The `L-*` enforcement sweep reported
  `tools/merge-register.py` as missing. This repository has it, byte for
  byte, at `tools/registers/merge-register.py`, put there deliberately
  with the reason filed as `INC-2026-10-18-hq-tool-paths-are-hq-s`.
- **Change.** Both sweeps in the charter are basename-aware and report
  three states rather than two: present, vendored elsewhere, missing. Only
  the third is a finding and only the third is handed up.
- **Merged.** Not yet. On **#337**.
- **Effect.** The honest binding count is **3, not 4**. Proven by merging
  the engineer's branch into a detached copy of `main`: the file is
  present and the old form calls it missing.
- **Rule.** A check that resolves an identifier supplied by another
  organization is measuring that organization's naming, not this
  repository's capability. Resolve the thing, then the name.
- **Next measure.** On the brief of **2026-10-31**, the binding count and
  the vendored-elsewhere count separately. Baseline **3 binding, 1
  vendored elsewhere**.

### The learning log's recurring blocks sat at entry level, so a shipped merger could not read it

- **Trigger.** Ursa's engineer shipped a register merge driver and carried
  `docs/agents/learning-log.md` in its table with `enabled: false`, naming
  the duplicate heading that makes the merger refuse at parse and assigning
  the repair to this seat.
- **Change.** Twenty-nine mis-levelled headings demoted to level three. No
  entry's text altered. Five recurring per-window blocks had been written
  at the same level as the window entry containing them, so they collided
  once per window by construction.
- **Merged.** Not yet. On **#337**.
- **Effect.** Duplicated level-two headings went from **4 (worst case 6
  copies) to 0**, with twenty-nine unique entries including this window's.
  Verified against the merger itself with a distinct append on each side:
  exit 0, thirty-one entries out, both appends present, nothing blended.
  Before the repair the merger refused this side by name.
- **Rule.** A heading is an identifier the moment any tool keys on it, so a
  sub-section written at the identifier's own level is a collision
  generator and not a formatting preference.
- **Next measure.** On the brief of **2026-10-31**, whether
  `tools/registers/registers.json` has flipped this file to `enabled:
  true`. Baseline **false, blocked on this seat**.

### A gate in this charter was rebuilt rather than run, and the rebuild did not block

- **Trigger.** The twenty-sixth window shipped a blocking board pre-flight
  whose first condition is `[ "$n" -le 1500 ]`. The twenty-seventh wrote a
  second validator against the same four rules, forty lines below it in the
  file it had just read, and wired the status to the board's refusal
  conditions only. A truncation is not a refusal, so it exited zero and
  `validate && curl` sent two messages it had just flagged.
- **Change.** The charter says, where it defines the pre-flight, to run that
  function rather than rewrite it, with the one grep that would have found
  it. `runner-facts.md` §15d carries the Python form as a more accurate body
  for the same gate rather than as a second gate.
- **Merged.** Not yet. On **#337**.
- **Effect.** **2 of 5 messages truncated** this window, both of them
  before the rule existed, each costing one repair message. The previous
  window reported 6 of 6 delivered whole under the shell form, which is the
  comparison that makes the rebuild the cause rather than the gate.
- **Rule.** Before you write an instrument, grep your own charter for what
  it does. The duplicate-instrument finding this register already holds is
  about one repository's distance; this one is about forty lines, and that
  version is invisible to looking outward because reading the document
  carefully is what makes you write it again.
- **Next measure.** On the brief of **2026-10-31**, this seat's truncated
  posts. Baseline **2 of 5**.

### The scope clause, proposed here on 2026-10-24 and law upstream the same day

- **Proposal.** This seat and epitome's exo independently measured the
  same defect: a charter pull request whose merge would land files no
  ask ever tabled. Ursa's instance was twelve files and about 11,600
  insertions on a question about one 1,040-line charter, so the charter
  itself was eleven per cent of what the merge would land. Proposed to
  HQ's `exo-centralizer` as an amendment to the silence route rather
  than as a local practice, on the ground that two anecdotes in two
  companies make a company finding.
- **Merged.** Law in `standards/pm.md` §22 on 2026-10-24 at 12:37 UTC,
  with both measurements and both seats named. An ask tables every file
  its merge would land and whose lane each belongs to; a pull request
  that would land an untabled file is not released by silence on any
  part of it; the applier retargets, splits or re-asks with the true
  list and a new clock.
- **Effect.** **Measured on the first pull request to run under it,
  which is this seat's own.** Files a release decision covers went from
  **12 to 6**, and lines of other seats' work that a charter merge would
  have landed went from **4,261 to 0**. The sharpest single number:
  `docs/sprints/pending.md` would have landed 3,641 lines of the PM's
  register that the owner was never shown, in a version already 956
  lines behind that seat's own branch. Zero now.
- **Rule.** A decision's scope is the file list of its merge, not the
  subject of its prose. The corollary this seat owes its own loop: **the
  freeze raises the cost of ending the freeze**, because every window
  merges `main` to stay mergeable and every merge imports what the other
  branch carried, so two files on 2026-10-18 became twelve on
  2026-10-24. That makes the oldest pending decision always the most
  expensive one to take, which is a positive feedback loop under every
  clock in the portfolio. The centralizer kept that paragraph as the
  rule's closing text and called it the part that made the rule urgent.
- **Next measure.** The brief of 2026-10-25. Two numbers: whether #344
  merged, and whether any pull request in this repository still tables a
  file outside its opening seat's lane.

### Proposal: name one key for a caller-set clock, because the second field has now forked

- **Proposal.** The expiry column the new law mandates is computed
  server-side for `claim` messages only and no caller can write it, so
  the carriage in practice is the caller-set `data` object. Nobody named
  the key. Measured on 500 live rows reaching back nineteen hours:
  **15 distinct spellings** of a deadline instant, 33 rows, 6 authors,
  four companies, none of them `expires_at`. One seat wrote six of them
  in a day and this seat wrote one, so it is a census rather than a
  complaint. Handed to the `exo-centralizer` on 2026-10-24 asking for
  one field name in the standard.
- **Merged.** Not yet. Sent at 13:1x UTC, receipt read, delivered whole.
- **Effect.** **None yet, and the number that makes it urgent is the
  one already paid.** §3e of this seat's charter has held a table of
  five spellings of the *merge claim* since 2026-10-18 and asked the
  same question upstream on the same day. That ask is still unanswered,
  and in the six days since, a second caller-set field forked three
  times as wide across four times as many companies. The cost is
  already visible rather than predicted: Ursa's PM set the deadline, the
  pull request and the applier correctly by hand, told the owner, asked
  her for nothing, and its five clocks are invisible to the one command
  the rule names.
- **Rule.** **An unanswered request for a contract compounds into every
  field invented after it.** Escalate a missing contract with its
  compounding cost attached and not only with its current count, because
  a count of five spellings reads as untidiness and a second fork under
  a rule that is already law reads as what it is.
- **Next measure.** The brief of 2026-10-25. One number: distinct
  spellings of a deadline instant in `data` across the board. Fifteen
  today. If the standard names one, the measure is how many of the
  fifteen are still in use a week later.

### Carried forward, week two: the ten attributes and the autonomy grade

- **Proposal.** Carried from the week of 2026-10-19 unchanged.
- **Merged.** Still only in this seat's open pull requests, which is now
  the sixth day. See the Effect line, which is the point.
- **Effect.** **Flat, and the reason is measured rather than guessed.**
  Sixteen pull requests merged between the silence clock's expiry at
  2026-10-20 12:30 UTC and 2026-10-24 13:19 UTC. **Zero touch a
  `prompts/*-agent.md` file.** The last charter merge in this repository
  is 2026-10-18 at 19:02 UTC. Every other class clears: 49 merges in
  seven days against 22 open, so the depth warning does not fire and the
  gate is working. One predicate inside it is stuck.
- **Rule.** Report the compounding ratio honestly, including when it is
  zero. This window's changes touch **one** seat and six files, all of
  them this seat's own, and that is **down** from the previous window's
  reach by design rather than by accident, because the scope clause the
  same window shipped is what narrowed it. A loop that reports a smaller
  number because it got more honest should say which of the two it is.
- **Next measure.** The brief of 2026-10-25: whether #344 merged.

### The run-report resolver that was shipped to stop a false absence, measured against the repository it runs in

- **Proposal.** This window, 2026-10-24, the twenty-ninth, and it is
  HQ's improvement rather than this seat's. The host runner reads the
  pull request a run opened out of the executor's stdout tail; a run
  killed at its cap writes zero bytes, so the reporter published "no
  pull request" as a fact. HQ shipped `runtime/board/runpr.py` so that
  the board asks GitHub from the branch before writing the absence down.
  The right fix to the right defect, and this entry measures whether it
  changed a number here.
- **Merged.** Upstream and live, called from `POST /api/runs`. Nothing
  of it is this repository's, and nothing was vendored.
- **Effect.** **Zero, measured on the only surface that can show it.**
  Resolutions across the whole portfolio since it went live: **0**. In
  this repository on 2026-10-24: **67** run reports, **49** claiming no
  pull request, **58** pull requests actually opened by seat branches,
  and **4** reports carrying the resolver's own vantage-point sentence,
  each of which had a pull request inside its own window (#344, #347,
  #349, #345). The selection requires `head.startswith(f"{seat}/")`
  while the host writes `${name}/…` from the manifest's agent name, and
  `seat` equals `name` only where the company is HQ. Independently,
  HQ's own seats resolve nothing either, because `alexandra-systems` is
  the one private repository of the four and the resolver's GitHub read
  is unauthenticated and fails open.
- **Rule.** **A shared instrument that encodes a naming convention
  encodes the conventions of the repository it was written in.** It is
  the sibling of `INC-2026-10-18-hq-tool-paths-are-hq-s`, and worse in
  one respect: that was a borrowed copy, so each repository could hold
  its own, while this is one deployment serving every company and is
  correct about one of four. Corollary for this seat's reports: when an
  instrument's reading comes out at the whole population, including the
  control, suspect two faults rather than one and split on the
  discriminator before publishing either.
- **Next measure.** On the brief of **2026-10-25**, re-run the
  resolution count in `learning-log.md`'s "what the next run must check
  first". A non-zero count anywhere closes the first fault; a non-zero
  count inside `alexandra-systems` closes the second.

### The capacity split that was reported as shipped, measured against the three surfaces that would carry it

- **Proposal.** This window, 2026-10-24. The twenty-sixth window found
  that `GET /api/capacity` counts a killed run as `running` for the rest
  of the day, because the class is decided by an exit trailer the dead
  run never writes, and asked HQ to split the class. HQ agreed, measured
  it on its own host first, and reported it shipped.
- **Merged.** **No.** The split is on the branch of HQ's #408, which is
  **OPEN and a draft**, so the merge gate cannot act on it at all.
- **Effect.** **None yet, and the guard it would retire stays in
  force.** Measured on three surfaces: `tools/capacity.py` on HQ's
  `main` has **zero** occurrences of `lost`; the live endpoint answers
  `running: 27` with **no `lost` key**; the same file on #408's branch
  is 483 lines with **28** occurrences and a `LOST_AFTER_MINUTES`
  threshold of 90, being the host's 60-minute cap plus half an hour of
  grace. The upstream measurement itself is real and better than this
  seat's: ten lost rather than the eight this seat bounded, because two
  runs started just after midnight and an earlier restart took them.
- **Rule.** **A `done` names an authored state and never a landed
  one.** Four of four `done` messages from HQ's centralizer to this seat
  on 2026-10-24 preceded their merges, by 29, 50 and 28 minutes, and the
  fourth is a draft and so cannot follow. One `gh pr view` on the `ref`
  before relaxing any guard, and when the answer is a draft, ask the
  sender to ready it rather than filing a correction.
- **Next measure.** On the brief of **2026-10-25**, read
  `curl -s "$BOARD_API_URL/api/capacity" | jq 'keys'` for a `lost` key.
  Its presence retires the upper-bound guard in the charter's §2 and
  makes this entry's effect positive; its absence carries this entry
  forward with the week count incremented.

### The charter that every window must read is charged to the turn cap that reads it

- **Proposal.** This window, the thirtieth, 2026-10-24, from its own
  measurement. `prompts/exo-agent.md` went from 2,221 lines to 4,100 in
  thirteen hours, with 1,929 lines added against 50 removed, a 2.6 per
  cent replacement ratio. This seat's eleven runs that got a turn spent
  13 to 101 of a 100-turn cap, eight of eleven at or above eighty-five
  per cent and three killed by it. §2's own turn-budget warning had been
  firing for a day with nothing acting on it, because it names the
  symptom and no rule named the input this seat controls.
- **Merged.** **No**, open in this window's pull request, which is the
  live tip of this seat's chain and sits behind the charter freeze.
- **Effect.** **None yet, and the first reading is in this entry rather
  than ahead of it.** The instrument is the ratio itself, and this
  window's own is **82 added against 16 removed, 19.5 per cent**,
  against the 2.6 per cent of the day before. Better and still positive,
  so the curve has not turned and the entry carries forward.
- **Rule.** **A finding's account goes to the register and its
  instruction goes to the charter**, and a deletion is preferred to a
  banner whenever the superseded text is spent. The charter is read under
  a cap; the registers are not. The corollary for this seat is the
  harder half: §3's standards-against-standards sweep was built to catch
  an amendment that lies and is blind to one that is merely expensive,
  and every banner in this charter is of the honest, expensive kind.
- **Next measure.** On the brief of **2026-10-25**, run
  `git diff --numstat origin/main...HEAD -- prompts/exo-agent.md` and
  `wc -l prompts/exo-agent.md` in the window's own pull request. A net
  reduction, or a replacement ratio above fifty per cent, makes this
  entry's effect positive. Anything else carries it forward with the week
  count incremented, and the number is reported either way.

### An instrument set with no word for "redundant" reports a collision instead

- **Proposal.** This window, the thirty-first, 2026-10-24, from Ursa
  PM's note at 16:33:48 UTC and this window's re-derivation of it. Two
  instruments this charter names, `merge-base --is-ancestor` and
  `merge-tree --write-tree`, both returned their maximum alarm reading
  on #337 against #362: neither contains the other, six content
  conflicts. Both correct. The pair's actual relation is that #362 is an
  **in-lane superset** of #337, with zero lines of substance absent from
  it, and neither instrument can express that. Three windows of this
  seat and two PM passes had carried an unchecked "clean chain" claim;
  the PM refused to carry it further and measured the half its
  instruments could reach.
- **Merged.** **No**, open in #362, this seat's live tip, behind the
  charter freeze.
- **Effect.** **One number, measured.** The queue's nine tips were
  unchanged by the finding, but the count of this seat's open pull
  requests went from **five to four**, because the per-file comparison
  is what justified closing **#350** as contained rather than leaving it
  as a suspected conflict. That close also took the queue's red check
  count from **one to zero**: #350 carried five untruncated board
  identifiers the thirtieth window had already fixed one tip further on.
  Conflicts needing a hand resolution between this seat's own branches:
  still **one pair**, #337 against #362, and now classified as avoidable
  rather than resolvable.
- **Rule.** **When your own process begins creating a new relation
  between artifacts, check that your instruments can express it.**
  Splitting by content copy, which is this seat's standard answer to
  HQ's scope clause, produces "contains the content of, without
  containing the history of" every time, and nothing in this charter had
  a name for it until now. The operational half: a conflict count
  between two branches of one seat is a constant, since six append-only
  registers from a shared base always collide, so the per-file
  comparison runs before any containment claim is published or accepted.
- **Next measure.** On the brief of **2026-10-25**, check whether a
  window of this seat published a containment claim with the per-file
  comparison beside it. The three windows before this one all had the
  instrument available and none reached for it, so the entry's effect
  is positive only when the instrument is used unprompted. Absence
  carries it forward with the week count incremented.

### The charter that every window must read is charged to the turn cap that reads it (carried forward, week 1)

- **Proposal.** Carried from the thirtieth window's entry above,
  unchanged.
- **Merged.** **No**, open in #362.
- **Effect.** **Negative this window, and reported rather than dressed
  up.** `prompts/exo-agent.md` is **4,247** lines, from 4,166 at the
  thirtieth window's tip. This window's own ratio is **84 added against
  3 removed, 3.6 per cent replacement**, against the thirtieth window's
  19.5 and the day before's 2.6. So the curve has not turned and this
  window made it worse, not better.
- **Rule.** Unchanged: a finding's account goes to the register and its
  instruction goes to the charter, and a deletion is preferred to a
  banner wherever the superseded text is spent.
- **Next measure.** On the brief of **2026-10-25**, the same two
  commands. **And one qualification this window earned by trying:** it
  went looking for spent text to delete and found that the remaining
  expired-clock banners in §5b guard practice a run still acts on, which
  this window proved by acting on one of them when it left #350's branch
  standing. Only three lines were safely removable. So the next window
  should not read a low replacement ratio as evidence that nobody tried.
  The deletable surface in this file is smaller than its banner count
  suggests, and the honest lever is writing less into it rather than
  cutting more out.

### The containment instrument this register shipped yesterday measures position and was captioned as measuring presence (week 1)

- **Proposal.** Keep the per-file comparison added by the thirty-first
  window and add a set-wise form beside it, normalising heading level,
  so that the pair distinguishes **moved or re-levelled** text from
  **absent** text. Neither form alone can, and the output of the
  positional one says nothing about which it found.
- **Merged.** **No**, open in #374, Tier C by content because it edits
  this seat's own charter directly.
- **Effect.** **Positive, and measured on the one pull request this
  window had to rule on.** `#288` against `#362`, lines in the older
  branch the tip does not have: positional **143**, set-wise **110**,
  and on `docs/agents/learning-log.md` specifically **23** against
  **1**. Twenty-two of those twenty-three were `##` demoted to `###` by
  the tip with byte-identical prose either side. That file is this
  seat's longest and is where its memory across fresh contexts lives,
  so it is the worst possible place for a false positive: a window
  deciding whether its own predecessor's work is safe to close has to
  read every line the instrument names.
- **Rule.** **An instrument built to express a relation your old ones
  could not is itself unvalidated, so check that the quantity it prints
  is the quantity its caption claims.** The entry above this one found
  that this seat's instrument set had no word for *redundant*. This is
  the next layer of the same defect rather than a correction to it:
  the replacement was reached for, trusted, published to two other
  seats, and accepted by both, inside one hour and with nobody checking
  what it computed. Run both forms, and read every non-zero line in the
  survivor rather than normalising and waving it through — the set-wise
  form still returned 33 on this charter and all 33 were read.
- **Next measure.** On the brief of **2026-10-25**, re-run both forms on
  whatever pair this seat's chain presents and check that the published
  claim quotes **both** numbers. One number alone is the defect
  recurring, whichever form it is.

### Whether a containment claim gets published with its per-file proof beside it (carried from the thirty-first window, week 1, first reading)

- **Proposal.** Carried unchanged. The instrument runs before any
  containment claim is published or accepted.
- **Merged.** **No**, open in #374.
- **Effect.** **Positive, first time, and not unprompted.** The
  thirty-first window's own entry predicted that the three windows
  before it had the instrument available and none reached for it, so
  the effect is positive only when it is used without being asked.
  This window used it, on `#288`, and published the table in the
  closing comment and in the pull request body. The honest
  qualification is that the entry itself is what prompted it, which is
  the register working as designed rather than the rule being
  internalised. The owner also used it: her 17:03 comment on `#337`
  withdrew a gap she had flagged twenty-five minutes earlier, naming
  the per-file comparison as a better answer than her own ancestry
  read. So the instrument changed a judgement outside this seat within
  one hour of being written, which is the first time anything in this
  register has done that.
- **Rule.** Unchanged.
- **Next measure.** On the brief of **2026-10-25**, whether a window
  that was *not* prompted by this entry reaches for it.

### The charter that every window must read is charged to the turn cap that reads it (carried forward, week 2)

- **Proposal.** Carried from the thirtieth window's entry, unchanged.
- **Merged.** **No**, open in #374.
- **Effect.** **Negative again, and this window is the worst reading
  yet on one axis.** `prompts/exo-agent.md` is **4,310** lines, from
  4,247 at the thirty-first window's tip. This window's ratio is **63
  added against 0 removed**, a replacement ratio of **zero**, against
  3.6 per cent last window and 19.5 the window before. Three windows,
  three worsening readings. The previous entry warned the next window
  not to read a low ratio as evidence that nobody tried; this window
  did not try, and says so rather than citing that warning as cover.
- **Rule.** Unchanged, and one addition this window owes: **the
  cheapest deletion available to this seat is not in the file, it is
  the decision not to write the account twice.** This window's finding
  exists in full in three places — the pull request body, the learning
  log and this entry — and only the instruction needed to be in the
  charter. Sixty-three lines went in; perhaps twenty were instruction.
- **Next measure.** On the brief of **2026-10-25**, the same two
  commands, plus the added-lines count split into instruction and
  account. A window that cannot say which of its charter lines are
  instruction has not earned the lines.

### A register's own state is written where the content is improved and read somewhere else, so three surfaces reported one fixed defect as open

- **Proposal.** The thirty-third window, 2026-10-24, from
  `Ursa/research`'s 17:13 UTC report that the wake section was stale
  against the deployed service. Checking the report found the sentence
  true of three surfaces for three different reasons, none of them the
  one research named: the merged copy a stranger reads, the closing
  condition a later window reads, and the `**Status:**` prefix HQ's
  console reads. Three repairs, one per reader: a reader-facing rule 4
  at the head of `docs/agents/runner-facts.md`, a one-`grep` sweep of
  the registers' own open conditions, and the prefix on all 65 incident
  entries. Full entry:
  `INC-2026-10-24-a-registers-state-is-written-everywhere-except-where-it-is-read`.
- **Merged.** **No**, open in #378.
- **Effect.** **Positive and measured on all three surfaces, and the
  first two were measured as defects before the repair rather than
  after.** Entries carrying a status line HQ's generated portfolio view
  can parse went from **29 of 65 to 65 of 65**, 42 open and 23 closed.
  Two incidents closed on evidence that already existed in this
  repository: `INC-2026-10-18-wake-truncated-at-1500` was **eight days**
  past its own condition and
  `INC-2026-10-24-wake-cut-is-answered-for-readers-and-invisible-to-senders`
  **five hours**, the second on a live `201` receipt from this window's
  own reply. The third surface has no number yet, because it is a rule
  addressed to a reader who has not read it: the merged copy of
  `runner-facts.md` is **1,171 of 2,626 lines**, eight of eighteen
  sections exist only on a branch, and whether rule 4 saves a sibling
  seat a round trip is not this window's to claim.
- **Rule.** Two, and both are about where a finding is filed rather than
  about writing more of them. **An open condition is closed by whoever
  next measures it, not by whoever was looking for it** — the
  twenty-sixth window held the measurement that closed its own register's
  condition and filed it under a different fact for five hours.
  And **a correction aimed at the wrong half of a file still lands in
  the right section**, so a seat handed one checks the whole claim rather
  than the clause, and replies with where the correction already is.
- **Next measure.** On the brief of **2026-10-25**, three counts: whether
  the 65 status lines survive the next window's appends, whether any
  entry is still open past a condition the `grep` can see, and whether a
  sibling seat's next correction to this register names a branch.

### The charter that every window must read is charged to the turn cap that reads it (carried forward, week 3)

- **Proposal.** Carried from the thirtieth and thirty-first windows'
  entries, unchanged.
- **Merged.** **No**, open in #378.
- **Effect.** **Flat, and this is the first window to answer the
  question the last one actually asked.** `prompts/exo-agent.md` is
  **4,310** lines at this window's base and **4,324** at its tip: **14
  added against 0 removed**, so the replacement ratio is zero for the
  third window running. The previous entry asked the next window to
  split its added lines into instruction and account. Split: **14 of 14
  are instruction** — one new gate, its mechanism, and a pointer to the
  register — and **0 are account**. This window's three findings and
  every number in them live in the two registers and the pull request
  body, and nothing was written twice. That is the previous entry's own
  prescription followed, and it still produced growth, which says the
  prescription caps the damage rather than turning the curve.
- **Rule.** Unchanged, with one honest qualification this window owes:
  **a window with nothing to delete cannot turn this curve, and most
  windows have nothing to delete.** This one's work was two register
  sections and a format repair; no charter section became wrong. The
  deletions that would turn the curve are the superseded histories kept
  deliberately — the 2026-10-18 wake paragraph, the superseded read-path
  subsections — and every one of them is kept on a stated reason. Either
  those reasons are wrong or the ratio is the wrong metric, and three
  windows of flat readings is enough to ask which.
- **Next measure.** On the brief of **2026-10-25**, the same two
  commands and the same instruction-versus-account split, plus one new
  count: how many lines of this charter are explicitly marked as
  superseded history. If that number is large, this entry's metric
  changes to exclude it and says so.
- **Answered the same day, by the next entry below.** Both halves of the
  question this entry closes on were taken: the metric was the wrong one
  and the superseded-history count cannot be taken as asked. This entry
  is superseded by it and carries forward no further.

### The ratio was the wrong metric and the length was the right one, answered on the day HQ made the clause law (week 3, closed)

- **Proposal.** This window, the thirty-fourth, 2026-10-24, from HQ's
  `exo-centralizer`'s two `done` messages at 17:33:44 and 17:34:27 UTC.
  The centralizer took this seat's actionable clause into portfolio law
  as `L-A120`, added its own corollary — an instrument no charter points
  at grades the same as one that does not exist — and did the thing the
  experiment asked for: it reported its own charter-file replacement
  ratio inside its own pull request rather than a week later. It then
  asked this seat to disagree with its choice of figure now rather than
  after the reading, which is the one part of the message that needed an
  answer from here.
- **Merged.** **No**, open in this window's pull request, which chains
  off the thirty-third window's by true ancestry.
- **Effect.** **Four things measured, and the third closes this entry.**

  1. **The centralizer's choice of figure is right and this window
     checked it before agreeing.** It graded 24 removed against 116
     added on charter and standard files, 20.7 per cent, and set aside
     the 2.1 per cent over its whole diff as dominated by a new tool and
     its tests. Its 116 excludes `standards/lessons.md`, 147 added and 0
     removed, which is a register and not an instruction file — so it
     applied this entry's own account-versus-instruction rule to its own
     numerator without being asked. The objection worth raising against
     any set aggregate is that it can read 20.7 per cent while one file
     inside it reads zero. Split per file: `prompts/exo-centralizer.md`
     5/2, `standards/pm.md` 36/7, `standards/roles/exo.md` 75/15. The
     worst is 19.4 per cent. No file in the set is hiding. **So the
     objection does not bite here, and this is the cheapest moment to
     add it as a condition, because nobody has to re-measure.**
  2. **The cap number it reported was already stale when it arrived, in
     the direction that understates.** It read five runs killed at the
     cap in thirty-nine for this seat this week. Re-derived from
     `GET /api/work/Ursa/exo?days=7` six minutes later: **six of
     thirty-nine**, with twenty of thirty-nine at or above eighty-five
     per cent of cap. The denominator is identical and the numerator
     moved by one, because the sixth kill is the run that ended at
     17:39 UTC — **the window immediately before this one, killed at
     101 of 100 while reading this charter.** That is this register's
     re-derivation rule paying for itself on a number about itself.
  3. **The ratio has been answering a different question than the one
     this entry was opened on.** The entry was opened because the
     charter's *length* is the fixed cost every window pays out of a
     100-turn cap. The replacement ratio measures whether a window's
     additions displaced anything, which is a property of the kind of
     work that window did. Measured across this seat's eleven windows
     today, from each pull request's own copy of the file: 2,221 →
     2,706 → 2,794 → 3,268 → 3,656 → 3,879 → 4,100 → 4,247 → 4,310 →
     4,324. Per-window growth, from the fourth onward: **474, 388, 223,
     221, 147, 63, 14.** Seven consecutive windows each adding less
     than the one before, a fall of **thirty-four times**. Three
     windows published "flat, ratio zero" over exactly that period. The
     marginal curve had turned and the metric could not see it.
  4. **The level has not turned, and the level is what kills runs.**
     2,221 lines and two cap kills on 2026-10-18; 4,324 lines and four
     cap kills on 2026-10-24. The file roughly doubled and the kills
     doubled with it. So the honest reading is that the marginal cost
     is approaching zero and the fixed cost is still rising, and only
     a net deletion moves the second one. **This window's own numbers:
     4,324 lines at its base, 4,307 at its tip, 32 added against 49
     removed — a 153 per cent replacement ratio and the first net
     reduction of this file in the experiment's life.** The 34 deleted
     lines were the thirtieth window's account of its own measurement,
     which duty 2 of the very block it sat in says belongs in a
     register, and which was already in this one in full.
- **The count the previous entry asked for, and why it cannot be taken
  as asked.** It asked how many lines of the charter are explicitly
  marked as superseded history, and pre-authorised excluding them. The
  answer is that there is no excludable region. Supersession in this
  file is not a property of a block, it is a sentence inside a block
  that is otherwise in force: fourteen of thirty-seven sections carry a
  correction marker somewhere, and those sections are 2,839 of 4,307
  lines, but the superseded text is one paragraph in each and the rest
  is live instruction. Publishing 2,839 as superseded history would be
  false by a wide margin. So the metric change the previous entry
  offered is withdrawn rather than taken.
- **Rule.** **Report the level first, the per-window delta second, and
  the replacement ratio third.** The level is what the cap pays for; the
  delta is what this window did to it; the ratio only says whether the
  additions displaced anything and reads zero for every window that had
  nothing to delete. And **a ratio published over a set of files carries
  its per-file split**, because an aggregate can be healthy while the
  one file every window must read is at zero. Both halves are in
  `prompts/exo-agent.md` §5 now, in sixteen lines where thirty-four
  lines of account used to be.
- **Handed to the centralizer** on the board at 2026-10-24 17:47:03
  UTC, id `94f4cead`, in first person: the choice of figure agreed with
  the per-file condition attached, the ratio named as the weaker of the
  two numbers, and the level and the delta asked for beside it at the
  month-end reading. The receipt reads 1,483 of 1,500 delivered and
  `body_truncated` false, so this line is written against a response
  rather than ahead of one.
- **Next measure.** At the **2026-10-31** reading the centralizer set,
  three numbers per seat and not one: `wc -l` of the charter, its change
  since the previous window, and the replacement ratio with its
  per-file split. This entry's effect is positive if the level is flat
  or falling by then. The marginal reading is already positive and is
  not sufficient.

### A duty and its own check, authored together, where the check tests a proper subset of the duty

- **Proposal.** The tip-broadcast duty of 2026-10-18 says one broadcast,
  no `to_seat`, identifier in `data.live_tip`. The audit written under it
  in the same subsection filters on neither, and the sentence beneath
  tells the reader to compare `ref`. Replace it with a gate that filters
  to broadcasts, reads `live_tip`, prints `MISSING` rather than a dash,
  and returns an exit status, and attach the general rule: read a command
  back against each clause of the duty it serves and name any clause it
  does not test.
- **Merged.** **No**, open in this window's pull request. It supersedes
  #378 and #382, which carry the same charter with the defect in it.
- **Effect.** **One, measured on the defect's own surface, and it is the
  first reading rather than a trend.** Before: this seat's newest
  broadcast named **378** while its live tip was **382**, a gap open from
  17:40:00 and still open when this window began at 17:5x. The old audit,
  run verbatim, printed the directed 17:47:03 message and read as a pass.
  After: the corrected gate returns 0 against **384**, and the board's
  newest broadcast from this seat carries `live_tip: 384`. The cost the
  gap had already produced is one PM pass: a merge-rule verdict published
  at 17:44:40 against a superseded identifier, correct in substance and
  attached to the wrong number.
- **Carried finding, not yet an improvement.** The duty itself is in
  **one charter out of eleven** in this company. `grep -c live_tip` over
  `prompts/*.md` returns 9 for this seat and **0 for every other seat**,
  and 0 in both of HQ's standards. Measured across the seats with an open
  pull request: of the two whose newest artifact is more than an hour old,
  **both** have a stale public pointer — frontend's newest open is #360
  at 16:26 while its newest broadcast names #342, and skill's is #359 at
  16:26 against #348. The three opened within minutes belong to live runs
  and are not yet due. This is a proposal addressed to HQ and not an edit
  here, because eleven copies of a workaround is the shape `L-A55`
  refuses. **Handed to HQ's `exo-centralizer` on the board this window,
  id `a51e5726`**, with the measurement attached and the receipt read
  back at 1,500 of 1,500 delivered, `body_truncated` false. Written
  here after the response rather than ahead of it.
- **Instrument caveat, recorded because it nearly went into the number
  above.** The sweep compares a seat's newest open pull request against
  its newest broadcast's `ref`. For the **PM** that comparison is
  meaningless by construction: its broadcasts point at other seats'
  artifacts, which is its job, so its newest names #378 and not its own
  #385. One row of five was a false positive from a caption that did not
  match its quantity, which is this register's own rule turned on an
  instrument built two minutes earlier.
- **Next measure.** At the **2026-10-31** reading, re-run the sweep. The
  effect is positive if every Ursa seat whose newest artifact is over an
  hour old has a public pointer that names it. The single-seat fix in this
  pull request cannot move that number by more than one row, and that is
  the point of handing the rest up.

### The set-wise form's one finding on this seat's memory was itself a false positive, so the measure is coverage rather than any exact match (week 1, reading the 2026-10-25 next-measure a day early)

- **Proposal.** Replace both exact-match content instruments with one
  that scores **coverage** — matched characters over the length of the
  **old** line, asymmetric — and add a `replaced` class for files every
  window rewrites wholesale. Ship it as
  `tools/stack/absent-text.py` with an exit status, so the check in
  front of "close this one as superseded" is a command rather than three
  shell loops a window retypes from the charter.
- **Merged.** **No**, open in this window's pull request, which contains
  #384 by ancestry. Tier C by content: it edits this seat's charter.
- **Effect.** **Positive, and it closes the entry two above with a
  negative reading of that entry's own fix.** The 2026-10-25 next-measure
  asked for both forms re-run on whatever pair the chain presented. Run
  on `#288` against `#362`, the same pair:

  | file | positional | set-wise | coverage |
  |---|---|---|---|
  | `docs/agents/learning-log.md` | 23 | **1** | **0 to read** |
  | `docs/agents/merge-order.md` | 87 | 76 | not enumerated (`replaced`) |
  | `prompts/exo-agent.md` | 33 | 33 | 32 to read |

  The set-wise form's **single** finding on this seat's longest register
  was the `dashboards` attribute row, which the tip had given a
  forty-word reason: every character of the old line present in the new
  one, coverage **1.00**. So the instrument that was shipped to remove
  twenty-two false positives from that file left one, on the same file,
  for the same reason — the caption said *presence* and the computation
  said *identity*. The charter's 33 barely moves, which is the tool
  working: those are genuinely rewritten paragraphs and the duty to read
  them stands.
- **Rule.** **When you replace an instrument because its caption did not
  match its quantity, check the replacement's caption against the same
  standard, and expect the residue to be on the same surface.** This is
  the third layer of one defect in three days: no word for *redundant*,
  then position captioned as presence, now identity captioned as
  presence. Each replacement was correct about its predecessor's error
  and inherited the predecessor's framing. The portfolio-wide form, which
  HQ's `exo-centralizer` measured independently and which is the piece
  worth reusing anywhere: **a symmetric similarity measure punishes a
  line for saying more**, so containment is coverage and never
  similarity.
- **Next measure.** On the brief of **2026-10-31**, count the closes this
  seat published with `absent-text.py`'s exit status quoted beside them.
  The effect is positive if every "contained in the tip" claim carries an
  exit code rather than a number a reader has to interpret. The first
  reading is already non-zero: `#374`, `#378` and `#382` exit 0 against
  `#384`, and `#337` exits 1 on this charter's own rewritten paragraphs.
- **The false positive, recorded because it nearly shipped.** The first
  version of the tool reported `docs/prfaq/mvp-public-address.md` as
  missing from the tip — 123 lines of the PM seat's MVP PR/FAQ draft —
  and that reading went out in one board message before it was checked.
  **It is not lost**: it is live on `#383`, `#385` and `#388`, the PM's
  own current branches, and it is absent from this seat's tip only
  because the fresh-root retarget drops files outside this lane, which
  is correct. The sweep that looked for other carriers was `git
  for-each-ref … | head -200`, and the truncation dropped exactly the
  refs that held it. **A `head` in a reachability sweep is a count limit
  on a completeness question.** The tool now searches every ref before
  classifying a missing path and splits `elsewhere` from `at-risk`; the
  correction went back to the recipient the same minute.

### A field whose empty value is wider than its filled value, measured on this seat's own mail

- **Proposal.** Name `to_company` on every directed board message,
  including to `owner`; treat omission as a deliberate role broadcast
  that says so in its subject; and run a one-command self-check before
  the run ends, because nothing on the write path reports back. Handed
  upstream separately: have the 201 receipt echo the resolved recipient
  list the way it already echoes `body_chars`.
- **Merged.** **No**, open in this window's pull request.
- **Effect.** **Negative baseline, which is the measurement this entry
  exists to establish.** 25 of the newest **496** addressed messages on
  the board carry no recipient company, from **7 seats across 4
  companies**; 15 of the 25 are addressed to `owner`. **5 are this
  seat's**: one note that woke the `engineer` seat in all five
  repositories and cost `alexandria/engineer` part of a run to route
  back, and four `Ideas` notes carrying Ursa's product strategy, which a
  read scoped to `to_seat=owner&to_company=alexandria` returns. The read
  came back at exactly 500 and so spans about eighteen hours, not the ten
  days asked for; the real counts are higher.
- **Rule.** **Defaults should narrow, never widen.** A parameter whose
  empty value reaches more recipients than its filled value will be
  emptied by accident, because omitting a parameter is exactly the act
  of not having looked at it — so documenting what the omission means
  puts the documentation where it cannot be read. Where a widening
  default is load-bearing, the receipt has to name what it widened to.
- **Next measure.** On the brief of **2026-10-31**, re-run the sweep
  across all senders. The effect is positive if this seat's count is
  **0** and the portfolio's is below 25 on a comparable read. The
  charter rule can only move this seat's row; the receipt is what moves
  the other six seats, and that is with HQ.

## Window 37, 2026-10-24, hook on returned capacity

### The daily tick: observe, orient, decide

- **Observe.** The brief read whole from `GET /api/brief`, 1,835
  characters, not from the wake excerpt. **363 runs attempted
  portfolio-wide, 241 finished, 72 refused by the provider (20% of the
  day, 28 before their first turn), 21 failed, 17 running, 12 lost with
  their runner in 5 cohorts, 783 dark minutes of which 377 fell after
  the limit had already reset.** Ursa's own row: **120 attempted, 80
  finished, 23 refused, 8 failed, 5 running, 4 lost** — a third of the
  portfolio's attempts and two thirds of them finishing. Queue: 24 open,
  56 merged in seven days, oldest open 14 hours. 24 of 24 merge cleanly
  into `main`; 13 of the 24 are contained in another, so eleven merges
  close the queue. Three turn-cap overruns today, all at 101 of 100:
  skill at 16:43, research at 17:13, this seat at 17:39.
- **The biggest drag, named.** **Not the 72 refusals.** A provider limit
  is a rented asset and nothing in this organization moves it. The drag
  is `dark_after_reset`, **377 minutes**, because that is capacity the
  portfolio *had*. 237 of the 377 sit in one gap, 07:07 to 11:05, which
  begins the same second an eight-run, four-company lost cohort ends.
  `INC-2026-10-24-six-hours-of-the-day-were-dark-after-the-limit-had-already-reset`
  has the account and the explicit refusal to call the adjacency a cause.
- **The anomaly in the numbers.** The brief's own `running` number is
  trustworthy for the first time. HQ's capacity split merged at 18:12:23
  and the five classes now sum to `attempted` exactly, 363 = 241 + 72 +
  21 + 17 + 12. Before it the lost cohort was inside `running`.
- **Orient: the weakest attribute is 7, dashboards, and HQ's own tool
  routes this grade here rather than to autonomy.**
  `tools/autonomy.py --repos Ursa --days 7` returns **57.1% as a floor
  on 56 merges, 32 seat-claimed, 0 on Actions, 24 unresolved (43%)**,
  and prints its refusal condition: over a third unresolved means the
  number grades the instrument. So attribute 9 is not gradeable this
  week and attribute 7 is what it points at. The dashboards number:
  **27 of 93 Ursa run reports today name the pull request their run
  opened, against 103 pull requests created in this repository today.**
  Twenty of the 93 carry the bare `no pull request.` form, which is the
  unauthenticated-read defect and is independent of the prefix one.
- **The two instruments that moved today, and both were this seat's
  filings.** The capacity split shipped (18:12:23). The run-report
  branch-prefix resolver shipped too: from **18:27:17** the report text
  reads *"for a pm/ **or ursa-pm/** branch"*, where every report before
  it read *"for a pm/ branch"*. Four reports carry the new form and none
  of the four had a pull request to find, so the fix is deployed and
  **not yet exercised on a run that opened one**. Do not report it as
  verified; report it as deployed.
- **Decide.** One experiment, below, plus three `Ideas` notes to the
  owner. The experiment's metric is on an endpoint rather than in a
  register, which is a first for this seat.

### The three-state rule was written for one tool sweep and its companion kept the two-state form

- **Proposal.** Give the `L-*` enforcement sweep the same basename
  resolution the `pm.md`/`secrets.md` sweep got from the twenty-seventh
  window, so a tool this repository has deliberately vendored under its
  own path reads as `VENDORED-ELSEWHERE` rather than as missing.
- **Merged.** **No**, open in this window's pull request.
- **Effect.** **Three names before, two `RULE-MISSING` plus one
  `VENDORED-ELSEWHERE` after.** The reclassified name is
  `tools/merge-register.py` from **L-A18** — resolved to
  `tools/registers/merge-register.py`, where Ursa's engineer put it
  deliberately on 2026-10-24 with the reason recorded in
  `tools/registers/registers.json`. **That same file is the worked
  example the three-state rule was written on, seventy lines up this
  same charter.** The surviving binding finding is unchanged and still
  real: `tools/check-secret-print.py` from **L-X5** is absent here and
  this repository still has no `.claude/` directory to register it in,
  while HQ's `main` carries it.
- **Rule.** **A repair to one instrument is owed to every instrument
  that asks the same question, not only to every instrument fed by the
  same surface.** HQ's `L-A54` says the second and is why the companion
  was missed: these two sweeps read different files, `pm.md` against
  `lessons.md`, so a surface-keyed sweep exempts them from each other.
  The question is identical and the question is what the fix belongs to.
- **Next measure.** On the brief of **2026-10-31**, run both sweeps and
  count `RULE-MISSING` names that resolve to a file under `tools/`. The
  effect is positive if the count is **0**.

### The guard that was retired, and the only kind of charter edit that compounds

- **Proposal.** Retire the standing instruction to read `running` as an
  upper bound, now that the class split is deployed, and cut the
  subsection written to keep that guard in force down to the rule that
  outlives its instance.
- **Merged.** **No**, open in this window's pull request.
- **Effect, and the first number this entry published was stale by the
  end of the run, so both readings are here.** At the moment of the
  retirement the file was **4,580 lines** with this window's own delta
  at **+30/-29**, a replacement ratio of 0.97, and the entry said the
  length did not move. **At the end of the run it is 4,634 lines,
  +85/-30 against this seat's previous tip, so the file grew by 55
  lines net and the ratio is 0.35.** The growth is two later
  amendments, the companion-sweep fix and the Learn-step ordering rule,
  each of which carries a measurement that was not available when the
  retirement was written.
  **Report the end-of-run number, not the number at the moment you
  deleted something.** A replacement ratio taken immediately after a
  deletion is the most flattering instant in the window, and this entry
  published it before correcting itself in the same commit range. The
  honest summary: the retirement was real, it was the first non-trivial
  deletion this seat has made, and it was outweighed by the same run's
  additions.
- **Rule.** **The cheapest way to shorten this file is to watch for the
  defects it guards against being fixed elsewhere.** A guard is written
  when a defect is live and nothing in the loop re-reads it when the
  defect dies. Two of the four instruments in this register's
  fails-toward-good-news count were fixed today, and the only reason
  this window could delete anything is that it checked.
- **Next measure.** On the brief of **2026-10-31**, `wc -l
  prompts/exo-agent.md` on this seat's tip. The effect is positive if it
  is **at or below 4,634**, which is this window's closing length and
  not its mid-run one.

### Experiment for the week: does a lost cohort precede the dark minutes?

- **Hypothesis.** The minutes of darkness that fall *after* a capacity
  reset are concentrated behind lost runs rather than spread across the
  day. Stated so it can fail: on any day with at least one
  `lost_cohort`, the gap that begins within five minutes of a cohort's
  end accounts for **more than half** of that day's
  `dark_after_reset`.
- **The metric, and it exists.** `GET /api/capacity` returns
  `dark_after_reset`, `gaps[]` with per-gap `after_reset`, and
  `lost_cohorts[]` with `from` and `to`. One call answers it. No
  register, no hand count, and nothing for a later window to re-derive.
- **Today's reading, which is n=1 and is the baseline.** 237 of 377
  minutes, **63%**, in the gap beginning at 07:07, the second the
  06:45–07:07 cohort ended. The two gaps with `after_reset: 0` had no
  cohort in front of them.
- **Read on 2026-10-26**, on the brief's tick, over the two intervening
  days. Kept if the share is above half on both days; **reverted, and
  the hypothesis written off, if either day puts the majority of its
  post-reset darkness in a gap with no cohort behind it.** The honest
  failure mode is that the lost cohort and the darkness share a cause in
  the runtime and neither explains the other, which would still be worth
  the two calls it costs to find out.
- **What this seat does not do about it.** The scheduler is HQ's
  runtime. The measurement and the handoff are this seat's, and the
  handoff went to `exo-centralizer` with both numbers.

### The compounding ratio, reported flat

- **Files this window's changes touch: 7.** `prompts/exo-agent.md`,
  five of this seat's registers (`incidents`, `improvements`,
  `learning-log`, `merge-order`, `runner-facts`), and one deletion of a
  stray scratch file at the repository root.
- **Seats: 1.** This seat's own. No other seat's charter is in the diff.
- **So the curve is flat on the measure HQ asks for**, and saying so is
  the duty. The two pieces that can reach more than one seat left this
  repository as a handoff rather than as a diff: the
  repair-the-companion rule and the capacity finding, both to the
  centralizer, which is the shape `L-A55` asks for in place of eleven
  copies.

### The pairing sweep answered in one call what forty minutes of measuring could not

- **Proposal.** None; this is §3's existing sweep, run, and recorded
  because its yield this window was larger than anything else in the run.
- **Effect.** Reading HQ's 78-name `tools/` list against this register's
  live findings produced one pairing that changed a finding's status:
  **`capacity-retry.py`** against this window's dark-minutes
  measurement. The tool exists, is deployed, woke this very run, cites
  the identical 377-minute number in its own docstring, and **has one
  gap**: its first condition is `run["class"] != "refused": continue`,
  and the word `lost` is absent from all 233 lines. So the largest gap in
  the day, 237 minutes, sits behind the only class the tool cannot see,
  because that class shipped at 18:12:23 the same day the tool was
  written against the older instrument.
- **Four other pairings, reported as context rather than as findings.**
  `check-turn-caps.sh` against today's three 101-of-100 overruns
  (skill, research, this seat). `check-runner-alive.py` and
  `check-run-ran.py` against the lost cohorts. `check-silence-clocks.py`
  against the expired-clock entries. `check-secret-print.py` against
  **L-X5**, which is the one that is still a live finding: absent here,
  present on HQ's `main`, and this repository still has no `.claude/`
  directory to register it in.
- **Rule.** **Run the pairing sweep before you write the postmortem, not
  after.** §6 already says to check whether this organization has
  already written a postmortem for the mechanism; it did not say to check
  whether somebody has already built the tool. This window spent forty
  minutes measuring a gap, filed it as an untestable hypothesis about
  HQ's scheduler, and then found in one call that the scheduler's fix was
  already deployed and short by one word.
- **Next measure.** On the brief of **2026-10-31**, count the incident
  entries filed in the week whose account names an HQ tool. The effect is
  positive if every entry about a runtime surface names one, including
  the entries that name it to say no tool exists.

### The merge drivers this repository declares are registered in zero of the clones it runs in

- **Proposal.** Make the two driver installers a bootstrap step in the
  charters of the two seats that act on a conflict verdict: this seat,
  which writes `docs/agents/merge-order.md`, and the PM, which holds
  the merge gate. Not in all eleven, because the durable fix is the
  runtime running them after it clones, and eleven copies of a
  workaround is the shape L-A55 refuses.
- **Merged.** **No**, open in this window's pull request (**#404**),
  two charter files, 55 lines in this seat's and 30 in the PM's.
- **Effect.** Measured on the open queue of 2026-10-24, same commits
  and same instrument, before and after `bash
  tools/ledger/install-driver.sh` and `bash
  tools/registers/install-drivers.sh`: **4 of 15** open pull requests
  reported `CONFLICT docs/ideas.md`, then **0 of 15**. The whole queue
  is clean. Confirmed a second way by performing all four merges in a
  detached scratch worktree off `origin/main`. The four were #316,
  #320, #348 and #393, one seat's four-deep chain, and the conflict
  was never in any of them. `git config --get-regexp
  'merge\.(ledger|register)\.'` printed nothing on the clone as handed.
  Two costs are already paid and are not hypothetical: the gate held
  four clean pull requests, and at 13:20 this seat sent Ursa's engineer
  a measurement arguing that the one register with a driver declared
  was the only one blocking branches, which is true and inverted,
  because it was blocking them on the driver's absence. That correction
  went back to the engineer at 22:50.
- **Rule.** **A clone has three properties that fail silently and
  independently, and a guard that fixes one reads to every later run as
  having fixed the environment.** Depth, breadth, and now merge
  configuration. §0 of this seat's charter already carried the first
  two for exactly this reason and the third was missing from it, so
  name which property each line fixes. The second half is the one worth
  carrying further: **blindness has a direction, and the direction
  decides who pays.** Every blind instrument on this register until
  today failed toward good news, so the cost landed on the owner not
  being told. This one fails toward bad news, so the cost lands on
  seats burning runs on work that does not exist, and on a gate holding
  clean work. The two call for opposite urgencies and the register had
  only ever seen one of them.
- **Next measure.** On the brief of **2026-10-31**, re-run the conflict
  sweep twice, once on the clone as handed and once after the
  installers, and record both numbers. The experiment succeeds if the
  two agree, which means either the runtime now installs them or every
  seat's charter does. If they still disagree and the charter line
  merged, the charter is not the lever and the handoff to HQ is.

### The capacity-return wake landed, and the darkness it was built for went from 377 minutes to 1

- **Hypothesis.** A seat whose run the provider refused is simply over,
  and nothing restarts it until its next scheduled window hours later,
  so a tool that reads the reset time the refusal already announced and
  wakes the seat at it should collapse the minutes of a day that fall
  dark *after* capacity has returned.
- **The metric, and it exists.** `GET /api/capacity` returns
  `dark_after_reset` and per-gap `after_reset`. One call.
- **Effect.** **377 minutes to 1.** The 37th window measured 377 dark
  minutes falling after the provider limit had already reset on
  2026-10-24. Today's reading at 02:25 UTC is `dark_after_reset: 1`, and
  `last_start` is 02:20:33 against a `reset_at` of 02:20:00, so the wake
  fired 33 seconds after capacity returned and took 17 seats in 5
  companies with it. This window is one of them.
- **What this seat did.** The measurement and the handoff only. The tool
  is `tools/capacity-retry.py` and the scheduler is HQ's runtime. The
  37th window's finding was that the tool's class predicate was
  `refused` and the word `lost` was absent from all 233 lines; the
  deployed version carries `OWED_CLASSES = ("refused", "lost")`.
- **Next measure.** On the brief of **2026-10-31**, read
  `dark_after_reset` over the intervening days. Carried as kept if it
  stays under ten minutes on every day with at least one refusal window.

### The run-pr resolver fix landed, and its auditor passes on a third of the runs

- **Hypothesis.** `runtime/board/runpr.py` matched GitHub branches
  against the board's **seat** column while the branch carries the host
  manifest's **agent name**, so it resolved pull requests only for HQ,
  and fixing the one line should stop this company's seats reading as
  having shipped nothing.
- **The metric, and it exists.** `tools/check-run-pr.py` counts run
  reports whose claimed absence the repository contradicts.
- **Effect, and it is two numbers that disagree.** The fix is deployed:
  run reports from 2026-10-24T18:27 onward read `for a pm/ or ursa-pm/
  branch`, and the auditor reports **"25 run(s) read, 0 reported an
  absence the repository contradicts"**. That is a clean pass. In the
  same twelve-hour window the host's own logs hold **69** finished Ursa
  runs. **The auditor read 25 of 69 and passed, because the 44 it could
  not see were missing the row it audits through.** So the fix held and
  the surface it was measured on shrank under it.
- **What this seat did.** Filed
  `INC-2026-10-25-the-run-report-is-missing-for-twenty-two-of-thirty-five-windows`
  and handed HQ a join rather than a bug report: `capacity.read_runs`
  enumerates the runs that happened, `check-run-pr.py` reads the rows
  the board holds, and nothing compares the two. Both halves are already
  in HQ's `tools/`.
- **Next measure.** On the brief of **2026-10-31**, run both and record
  the pair. The experiment succeeds when the row count and the log count
  agree to within the runs still in flight.

### Experiment for the week: does installing the drivers a repository ships change what the owner is told to merge?

- **Hypothesis.** Stated so it can fail: on any run of the §5b sweep,
  the number of open pull requests reported as conflicting with `main`
  is **strictly lower** after running this repository's two merge-driver
  installers than before, and the difference is entirely accounted for
  by files `.gitattributes` names.
- **The metric, and it exists.** The sweep itself, run twice, and
  `git config --get-regexp '^merge\.'` to say which state the clone was
  in. No register and nothing for a later window to re-derive.
- **Today's reading, which is the baseline.** **4 conflicts before, 0
  after**, all four on `docs/ideas.md`, which `.gitattributes` names.
  The clone as handed had no driver configured at all. The §5b
  instrument would have told the owner that four of Ursa's skill pull
  requests conflict with `main` when none of them do.
- **Read on 2026-10-31.** Kept if the difference is non-zero and
  attributable on at least two further runs. **Reverted, and the
  installer duty written off as noise, if a clone as handed ever comes
  back with the drivers already configured**, because that would mean
  the runtime installs them and the charter line is dead weight. The
  honest failure mode is the one this run already hit on the other
  driver: `register` is installed, enabled and attributed, and still
  does not fire, so "installed" and "working" are two states and this
  experiment currently measures the first.
- **What this seat does not do about it.** It does not patch either
  driver. `tools/` here is shared machinery with a design document per
  driver, and the `register` question belongs to whoever owns
  `tools/registers/`.

### Delta on that experiment, read the same night rather than on 2026-10-31: "installed" and "working" are two states, and the second one now has a number

- **Hypothesis under test.** The entry above closes by naming its own
  honest failure mode: "`register` is installed, enabled and attributed,
  and still does not fire, so 'installed' and 'working' are two states
  and this experiment currently measures the first." Ursa's PM said the
  same thing from the other side at 02:47:22 UTC, that it had not
  settled the question because no open pull request gave it an
  overlapping hunk to test. Two seats independently reported the same
  gap within three minutes, which under §24 makes it worth measuring
  rather than waiting a week for.
- **The metric, and it exists.** Four merge cases on `main`'s real
  `docs/agents/incidents.md`, each run with the attribute on and off, so
  every row carries its own control. Plus the ascending sweep of the
  live queue, which is the same §5b instrument the experiment above
  already uses.
- **Reading.** **It fires.** Two different entries appended to the tail
  go from `CONFLICT` to **exit 0 with both kept**, 35 entries to 37.
  Duplicate identifiers are refused **by name** where git gives markers
  and no diagnosis. `merge-tree` honours the driver, so the fix reaches
  the sweep and not only `git merge`. So the experiment above is
  **kept**, and its stated failure mode is retired rather than carried:
  the second state is now measured and the number is four of four cases
  behaving as designed.
- **And the cost it also measured, which was not in the hypothesis.**
  The driver's unit is the entry and git's is the line, so two edits
  twelve lines apart inside one entry are refused on a tree **byte
  identical** to git's clean merge — exit 1 against exit 0 over
  `2fbf5fe`. That is a false conflict the drivers *introduce*, and it
  belongs in the same ledger as the four they remove. Net on tonight's
  queue: **four false conflicts removed, one true conflict surfaced,
  zero false conflicts introduced**, because no open pair happened to be
  in the row-4 shape. The honest statement is that the net is favourable
  and the row-4 cost is unpaid rather than absent.
- **Read on 2026-11-01.** Kept while the net stays favourable. The
  reading that would revert it is a run that spends time resolving a
  row-4 refusal whose tree matches the clean merge, because that is the
  drivers charging this org for a conflict that does not exist. The
  charter now tells a window to compare the trees when the refusal
  reason is the entry-edited one, so the cost should be one command
  rather than one hand resolution.
- **What this seat does not do about it.** It still does not patch
  either driver, and the row-4 granularity is a design property of
  `tools/registers/` rather than a bug in it. Reported to the board, not
  fixed here.

### The compounding ratio, window 41

- **Changes that touch more than one seat: one of three.** The
  file-scoped-split finding is every seat's, because eleven seats run
  under the same HQ scope clause and four of this repository's registers
  are multi-author files. It is handed to HQ's `exo-centralizer` as an
  all-seats clause rather than written into eleven charters, which is
  the shape `L-A55` asks for. The driver matrix is this repository's
  alone. The deletion of the frozen entry is this chain's alone.
- **Files this run's changes touch: six.** `prompts/exo-agent.md`,
  `docs/agents/incidents.md`, `runner-facts.md`, `merge-order.md`,
  `learning-log.md`, and this file.
- **Charter length, which is what the turn cap pays for.**
  `prompts/exo-agent.md` is **4,850 lines**, +2,698 / −69 against
  `main`. This window added 91 lines and deleted 2. The replacement
  ratio is 0.026 and **the curve is not flat**, which is the honest
  reading rather than the flattering one: this seat's charter is 11.5
  times the median of the other eleven, and that remains the largest
  single cost it imposes on itself. The one deletion it made tonight
  replaced a sentence that said the driver "is still not firing" with
  the measurement that it does, which is the only kind of edit that
  makes a later window's charter shorter.

## Window 42, 2026-10-25, message wake (a note from Ursa/pm, 03:06:40 UTC)

### The delta on window 41's experiment, read the next window

- **What window 41 shipped.** The register merge driver, measured with
  controls in a scratch repository, and a charter clause saying to read
  the refusal reason on stderr before believing the conflict count.
- **The delta, measured.** The driver's positive case now has a live
  confirmation instead of a synthetic one: this window's own branch and
  the PM's share base `e3f14d9`, both append to
  `docs/agents/incidents.md`, and the pair goes from `CONFLICT
  (content)` with the attribute off to exit 0 with it on, same result in
  both merge orders. **Kept.**
- **And one line of it reverted, which is the point of reading a
  delta.** §21's heading said a half-registered driver is a third exit
  status. It is not; it is exit 1, identical to a missing driver.
  Corrected in `runner-facts.md` §22 rather than quietly edited, because
  the wrong version was published on the board and in a pull request
  description.

### This window's experiment

- **Hypothesis.** This seat's registers are not held by a disagreement
  about authority; they are held by branch *shape*. If the register half
  ships on a branch carrying no `prompts/` path, the PM seat can merge it
  the same day under §21, with no standard changed and no exception
  asked for.
- **The metric, and it exists in this repository rather than on a
  dashboard.** The date of the newest commit on `main` touching
  `docs/agents/*.md`. It has read **2026-10-18** for seven days.
- **When it is read.** The next window of this seat. If `main`'s
  register date has moved, splitting by merge authority is this seat's
  default and the charter says so. If it has not, the hold was never
  about the path and the escalation to HQ is the only live route.

### The compounding ratio, window 42

- **Changes that touch more than one seat: two of three.** The
  authority-split finding is every seat's — eleven seats run under the
  same §10 checklist, and any seat that amends its own charter alongside
  its own registers is buying the same hold. Handed to HQ's
  `exo-centralizer` as an all-seats clause plus the §10/§21 contradiction
  underneath it, rather than written into eleven charters. The
  "run the exit condition your own register already wrote down" lesson
  is portable to every register in the portfolio and costs nothing.
  The learning-log driver flip is this repository's alone.
- **Files this run's changes touch: seven**, across two kinds.
  `docs/agents/incidents.md`, `runner-facts.md`, `learning-log.md`,
  `merge-order.md`, this file, plus `tools/registers/registers.json` and
  `.gitattributes`. **Zero under `prompts/`**, deliberately, which is
  this window's whole thesis expressed as a file list.
- **Does it make the next change cheaper?** Yes, and for once the
  mechanism is not a clause. One more register merges without a hand
  resolution — the largest one this seat keeps, 6,846 lines, the file its
  memory lives in. And if the split holds, every future window's
  registers land on the day they are written instead of waiting on a
  charter decision they have nothing to do with, which removes the need
  for the §0 bootstrap block to grow.
- **Charter length, and this is the honest part.**
  `prompts/exo-agent.md` is **unchanged at 4,850 lines** by this window,
  for the first time in this chain. Not restraint: this branch may not
  contain it. The two clauses this window earned — split by merge
  authority, and run your register's own exit conditions — are therefore
  **owed to the charter and not in it**, named here so the next window
  writes them rather than rediscovering them. **The curve is flat on the
  charter and not flat on the registers**, and that is the first time
  those two have been able to differ, because they were previously the
  same branch.

## Window 44, 2026-10-25, hook wake on returned capacity (23:02:10 UTC)

### The delta on window 42's experiment: splitting by merge authority worked, and the number moved while this window was running

- **What window 42 shipped.** #422, the register half of this seat's
  chain alone, rooted so that it carries no `prompts/` path, on the
  hypothesis that the hold was branch **shape** and not a disagreement
  about authority. Nothing in any standard was changed and no exception
  was asked for.
- **The metric it named.** "The date of the newest commit on `main`
  touching `docs/agents/*.md`. It has read **2026-10-18** for seven
  days."
- **The delta, measured.** It reads **2026-10-25**, for all five
  registers. #422 merged at **2026-10-25T23:06:36Z**, about four minutes
  into this window, after those files had been frozen on `main` for
  seven days. **Kept, and it is now this seat's default.**
- **The second number, which is the one that makes the case.** This
  window's own diff against `main` went from **10 files and 11,315
  lines** to **2 files and 302 lines** the moment #422 landed, because
  everything else in it was window 38 to 43's unmerged output being
  carried for want of a merge. The split did not only unblock the
  registers; it made every later window's pull request legible to the
  owner, which is the cost
  `INC-2026-10-24-resolving-a-register-collision-imports-the-other-seats-whole-branch`
  measured at twelve files and nine thousand lines.
- **Honest residue.** The charter half, #418, is still held, correctly,
  and the §10-versus-§21 contradiction underneath it is still HQ's to
  resolve. The experiment proved the registers never needed that
  decision. It proved nothing about the decision.

### The delta on the capacity-retry driver, which is HQ's instrument and this seat's reported drag

- **What was shipped, and by whom.** `tools/capacity-retry.py`, HQ's,
  built after this seat and `epitome`'s exo independently measured that
  most of the company's idle day was capacity sitting available with
  nothing asking for it. Its own docstring cites **783 dark minutes on
  2026-10-24, 377 of them after the provider's limit had already
  reset.**
- **The delta, measured on 2026-10-25.** The brief's renderer reports
  **1 minute** of the day's darkness falling after the limit had reset,
  against 377 the day before. **Kept.** The hole the driver was built
  for is closed to within a minute.
- **And the drag moved rather than disappearing, which is the part worth
  reporting.** Total darkness went **up**: 783 minutes to **1,191**
  (19.9 h), on 149 attempted runs of which **70 were refused by the
  provider, 48% of the day, 53 of them before their first turn.** So
  the scheduler's hole is closed and the quota's hole is now the whole
  of it. A driver that woke seats into a still-exhausted quota would
  show exactly this shape, and the 53 turn-one refusals are consistent
  with it. **This is the biggest drag on this company and it is not
  this seat's to fix**: it is the provider's limit and the owner's
  question about how many seats wake into one quota.
- **What this window adds to the same instrument.** The driver decides
  from a seat's latest run alone, so a barren refusal landing on top of
  a fertile one hides the fertile one — measured at **73 of 110 barren
  wakes, 66.4%, across 19 seats and all five companies, nine runs deep
  at worst.** One block fixes it, on HQ's already-open #456.
  `runner-facts.md` §24 has the reproduction.

### This window's experiment

- **Hypothesis.** The two defects this window found in its own charter
  are both **proxy failures**: §0 selects a charter by recency when it
  wants evolution, and the fork sweep fires on an act when it guards a
  state. If those are a class rather than a coincidence, then a sweep
  over this charter for rules that select or fire on a proxy will find
  more of them, and it will find them before they cost a window.
- **The metric, and it exists in this repository.** The count of
  standing rules in `prompts/exo-agent.md` whose trigger is an event
  (`when you split`, `before you end`, `on any wake`) against the count
  whose trigger is a state. Four of the five members of the
  "jointly lossy" family already in `incidents.md` are the first kind.
- **When it is read.** The next window of this seat that holds the
  charter branch, because the sweep's output is a charter edit and the
  charter is on #418.

### The compounding ratio, window 44

- **Changes that touch more than one seat: two of three.** The
  retry-wake defect is every seat's in all five companies — 19 seats
  measured, and the fix is one block in one deployment rather than
  eleven charters, handed to HQ's `exo-centralizer` for #456. The
  fork-sweep scheduling defect is every seat's that copies content
  across a split, which today is this seat alone, so that one is
  local and says so. The §0 proxy defect is this seat's only.
- **Files this window changed: three**, all registers, all in this
  seat's lane. **Seats whose charters it changed: none**, deliberately,
  and the three charter amendments it owes are stated verbatim in the
  register with the reason they are not on this branch.
- **The curve is not flat this window and the reason is not this
  window.** The register date on `main` moved seven days in one merge.

## Window 45, 2026-10-25, message wake (the merge of #429, 23:25 UTC)

### The delta on window 44's experiment, read by the first window to hold the charter branch

- **What window 44 registered.** That the two defects it found in one run
  were both **proxy failures** of one class, §0 selecting a charter by
  recency when it wanted evolution and the fork sweep firing on an act
  when it guards a state, and that a sweep of this charter for the same
  shape would find more of them before they cost a window.
- **The metric it named.** "The count of standing rules in
  `prompts/exo-agent.md` whose trigger is an event against the count
  whose trigger is a state."
- **The delta, measured.** Thirteen distinct rules in this charter are
  scheduled on an act. **Seven** of the thirteen guard a condition that
  outlives the act, which is the defect shape. Three of those seven are
  already paired with a standing check that catches the inherited case,
  one is the fork sweep window 44 measured, and **three were unpaired**.
  **Kept.** The hypothesis predicted more members and there were three,
  found in one read rather than over three windows.
- **One of the three was live rather than hypothetical, which is the
  part that makes the case.** The rule "when a reported number moves,
  the correction goes to every addressee" is checked only "before you
  end a run", so an ask handed to another company and never answered is
  a state nothing surfaces. Window 44 handed HQ a one-block fix on its
  open **#456**. That pull request merged at 2026-10-25T23:23:54Z
  **without the block**, confirmed by reading the deployed
  `tools/capacity-retry.py` rather than the merge: `unresolved` appears
  zero times and the loop is still keyed on `latest[agent]`. The 66.4%
  census stands and the ask is live. It reached this window only because
  window 44 wrote it into handover prose, which is memory by luck. It is
  now a standing check and the correction has been sent.
- **Honest residue.** The census counts rules, and "distinct rule" is a
  judgement this window made by reading, not a number a script returned.
  A successor recounting it may get twelve or fourteen. The three
  unpaired members are the finding and they are each named, so the
  finding is checkable even where the denominator is soft.

### The delta on window 42's split, which this window had to repair rather than only report

- **What window 42 shipped, and it is still right.** The register half
  rooted in `main` with no charter path, so the 81.4% of this seat's
  held work that needed no owner stopped waiting on one. Window 44
  reported the register date on `main` moving seven days in one merge.
- **What nobody had measured.** The split gives the two halves
  **different clocks**, and the fast half drags `main` away from the
  slow one. Measured at 23:30 UTC, fifteen minutes after #429 landed,
  the charter half **#418 conflicted with `main` in all five
  registers** and could not be merged at all. GitHub's `mergeable` field
  read `UNKNOWN`, so the queue showed nothing.
- **And merging it would have undone the previous window.** 42 of the 42
  lines it held that `main` lacked were the fork of the PM's entry that
  window 44 had deleted fourteen minutes earlier.
- **Repaired, on #418.** `main` merged in, every register resolved to
  `main`'s side, both charter files clean because `main` has not touched
  them since 2026-10-18. Eight files and 13,897 insertions became two
  and 2,843, and `merge-tree` exits 0.
- **The standing fix, which is the compounding part.** A branch held
  behind an authority must have `main` merged into it **every window**,
  because the thing that staleness comes from is your own other branch
  landing. Neither the depth warning nor the tier checklist can see
  this, and the instrument that can has to be pointed at your own held
  branch rather than at the queue.

### This window's experiment

- **Hypothesis.** The two defects above are both the same shape one
  layer up from the proxy family: a **rule that was verified against a
  pair of branches and then relied on against `main`**. Window 44 proved
  deleting a fork is safe in both merge orders by merging two feature
  branches, and the proof failed the moment one side was `main`. This
  window proved the split was sound by measuring the register half, and
  it failed the moment the other half had to merge. If that is a class,
  then every safety claim in `incidents.md` whose proof was a
  branch-to-branch merge is suspect when one side becomes the default
  branch.
- **The metric, and it exists in this repository.** The count of
  entries in `docs/agents/incidents.md` whose stated verification is a
  merge or ancestry check between two pull request refs, against the
  count verified against `origin/main`. Both are greppable:
  `refs/prs/` against `origin/main` inside the entries' own commands.
- **When it is read.** The next window of this seat, on either half,
  because the output is a register entry and not a charter edit.

### The compounding ratio, window 45

- **Changes that touch more than one seat: two of four.** The
  stale-held-branch failure is every seat's that holds work behind an
  authority, which on this board is several, and it was handed to HQ's
  centralizer as portfolio shaped rather than fixed once here. The
  import-then-delete conflict is the PM's problem today and any pair of
  seats sharing an append-only register tomorrow, and the structural fix
  is the sweep reschedule, which is one line. The §0 selection
  amendment and the three standing-check conversions are this seat's
  only.
- **Files this window changed: six.** Four registers on the register
  half, and `prompts/exo-agent.md` plus one inherited `prompts/pm-agent.md`
  on the charter half. **Seats whose charters it changed: one**, and
  that one arrived by inheritance rather than by this window.
- **The curve is not flat, and the number that says so is the charter's
  own.** `main`'s copy of this charter has been 2,221 lines since
  2026-10-18. The live copy is 4,962 and now merges clean, where ninety
  minutes ago it could not merge at all. Replacement ratio this window:
  three amendments shipped against three owed, so the owed queue is
  **zero** for the first time in three windows.

## Window 46 — 2026-10-26 (message: the merge of #433, 23:49:44Z)

### The delta on window 45's experiment, read

- **What window 45 registered.** That its two findings were one shape:
  a rule **verified against a pair of branches and then relied on
  against `main`**. Window 44 proved deleting an imported fork is safe
  in both merge orders by merging two feature branches, and the proof
  failed the moment one side was `main`.
- **The metric it named.** The count of entries in
  `docs/agents/incidents.md` whose stated verification is a merge or
  ancestry check between two pull request refs, against the count
  verified against `origin/main`.
- **The delta, measured over all 81 entries.** Six name `refs/prs/`
  only, six name `origin/main` only, four name both, and 65 name no ref
  at all.
- **Verdict: the hypothesis is kept and the metric is replaced.** The
  class is real, and this window found an independent instance of it at
  a different layer, below. But the metric cannot find members. Three
  of its six hits are
  `INC-2026-10-18-branch-name-reuse`,
  `INC-2026-10-18-shallow-clone-false-conflicts` and
  `INC-2026-10-18-readied-sibling-is-not-a-branch-to-grow`, and every
  one of them is a **containment fact about one named pair**. An
  ancestry fact about two refs makes no claim that transfers to
  anything, so there is nothing in it to be falsified by `main`. The
  remaining three are windows 44 and 45's own entries, one of which is
  the confirmed failure the hypothesis came from.
- **So the discriminator is not which ref an entry names.** It is
  whether the entry states a rule in the imperative that a later window
  would **apply**, and whether that rule's proof was a pair of refs.
  That is a read and not a grep. Window 45's own honest residue said
  the same thing about its previous census: "distinct rule is a
  judgement this window made by reading, not a number a script
  returned." Two consecutive experiments have now chosen a greppable
  metric and found that greppable and discriminating are different
  properties. **That is the transferable result**, and it is worth more
  than either count.
- **The independent instance, which is why the hypothesis survives.**
  GitHub's `mergeable` field is itself a claim verified against a
  recorded base rather than against `main`: it answers for the commit
  in `baseRefOid`, and five of fourteen open pull requests carry an
  answer that is wrong about `main`. Same shape, one layer up from the
  register, and found by measuring the queue rather than by reading
  entries.

### The owed queue, and the carried checks window 45 left

All five answered this window, which is the first time this seat has
cleared a handover list in one pass.

1. **Take the longest charter.** Done. `main` is 2,221 lines, #418 is
   4,962, and §0's new selection rule found it. The trap is still live
   because #418 has not merged.
2. **Merge `main` into whichever half is still held.** #418 needed
   nothing: it merges clean at `5902fd21`, re-measured before and after
   this window's push. Window 45's repair held through two further
   merges to `main`.
3. **Whether the PM resolved #432 and #438 in its own favour.** It did,
   and nothing was lost. Its forty-eight-line postmortem survives
   intact on **#443**, which contains both and merges clean. The
   resolution this seat recommended at 23:41:22Z is the one taken.
4. **Whether HQ answered the capacity-retry re-ask.** Not yet.
   `unresolved` appears **zero** times in the deployed
   `tools/capacity-retry.py` on HQ's `main`, 420 lines, and the loop is
   still keyed on `latest[agent]`. The barren-wake census stands and
   the ask is live. Re-sent.
5. **The experiment.** Read above.

### This window's experiment

- **Hypothesis.** The defect behind tonight's finding is not GitHub's.
  It is that **adopting a local mechanism silently invalidates every
  shared instrument that was correct before**, and nothing in the
  adoption reports it. This repository added six `merge=` attributes on
  2026-10-24 to stop paying for register collisions, and in doing so
  made GitHub's merge field, GitHub's merge button and HQ's mandated
  `check-merge-queue.sh` all wrong about it, within two days, with no
  signal. If that is a class, other local mechanisms this repository
  has adopted have the same unreported blast radius.
- **The metric, and it exists in this repository.** The count of
  repository-local mechanisms declared in config-like files that a
  shared instrument could be reading past: the entries of
  `.gitattributes`, the registered git config drivers, the hooks in
  `.claude/` if one ever exists, and anything under `tools/` a standard
  names by a different path. Against each, the count of shared
  instruments (HQ tools, GitHub fields, workflow steps) that compute
  over the same files without the mechanism. Today the first number is
  **6 attributes / 2 drivers** and the second is **3** for those.
- **When it is read.** The next window of this seat, on either half.
  The output is a register entry, so either can carry it.

### The compounding ratio, window 46

- **Changes that touch more than one seat: two of three.** The
  merge-verdict finding is every seat's, because every seat's branch
  passes the gate and two of them acted on the field tonight; it went
  to the PM, to the skill seat and to HQ in the same pass. The
  `check-merge-queue.sh` gap is HQ's tool and the portfolio's, handed
  up rather than patched. The `merge-tree` exit-code rule is this
  seat's instrument only.
- **Files this window changed: five.** Four registers on the register
  half (#442) and `prompts/exo-agent.md` on the charter half (#418).
  **Seats whose charters it changed: none.** The `prompts/pm-agent.md`
  change on #418 is window 45's, inherited unchanged.
- **The curve, stated honestly.** The charter went 4,962 to 5,049
  lines, one amendment against zero owed, so the owed queue stays at
  **zero** for a second window. The amendment's reach is wider than
  usual: the rule it adds is performed by every seat with a branch, not
  only by this one. Against that, `main`'s copy of this charter has not
  moved since 2026-10-18, so every amendment of the last eight days is
  still invisible to every fresh clone, and that number has not
  improved in three windows. The compounding is in the writing and not
  yet in the reading.

## Window 47 — 2026-10-26 (message: three directed notes, 00:09:30Z the newest)

### The delta on window 46's experiment, read

- **What window 46 registered.** That the class is real but the metric
  cannot find its members, because "greppable" and "discriminating" are
  different properties, and that the discriminator is whether an entry
  states a rule in the imperative whose proof was a pair of refs.
- **The delta, measured on the one rule that fits that description
  exactly.** The charter's fork sweep says deleting a foreign register
  entry is "safe in both merge orders". That is a rule in the
  imperative. Its proof was a pair of refs. **It failed in production
  this window**, against `main`, in the direction window 45 predicted,
  and the cost is six dangling citations on the default branch.
- **Verdict: the hypothesis is confirmed and closed.** Three
  consecutive windows framed this class, failed twice to find a metric
  for it, and the fourth instance arrived as a live defect found by
  another seat rather than by any census. The transferable result is
  the one window 46 wrote down, and it now has a confirmed instance:
  **a rule whose proof is a pair of refs has not been tested against
  `main`, because `main` is the one branch a seat's own prior window
  may have written.**
- **And the sharper statement, which came from HQ the same night.** The
  centralizer filed as portfolio law that an instrument whose own
  actions produce the events it reads cannot treat latest as current.
  That is this class's general form, one layer up. It was written about
  the wake bus; this window's instance is on the default branch, which
  is a second surface. Carried up as a proposed widening: **any state an
  instrument both reads and writes**, not only wake events.

### This window's experiment

- **Hypothesis.** The charter's standing rules fail in production
  through their **unstated premises**, not through their stated
  conditions, and the premises are detectable at writing time by one
  question: does this sentence assert that an act is safe without
  saying what makes it safe?
- **Metric, which exists in this repository.** The count of sentences in
  `prompts/exo-agent.md` that assert safety, correctness or sufficiency
  of an act, against how many of those state a check a later window can
  run. The population is greppable this time — safety claims use a
  small vocabulary — and the grade is a read, which window 46 already
  established is the honest form.
- **Read on.** The next window of this seat, against the count filed
  here.
- **Predicted delta.** Two to five unpaired safety claims besides the one
  that failed tonight. If the count is zero the hypothesis is refuted
  and the fork sweep was unique rather than typical.

### Compounding ratio, this window

- **Seats touched: 2.** This seat's charter, and the PM seat indirectly
  through the sweep rule that governs its registers.
- **Files touched: 5.** `prompts/exo-agent.md`,
  `docs/agents/incidents.md`, `docs/agents/runner-facts.md`,
  `docs/agents/learning-log.md`, this file.
- **Does it make the next change cheaper?** Yes, and specifically: the
  authoring-commit check and the dangling-citation check are two
  commands that replace a judgement every window was making by eye and
  getting wrong. The driverless-merge override replaces an instrument
  three windows and two seats had copied.
- **Is the curve flat?** Not this window, and the reason is worth
  naming: **both of this window's findings were handed to it by other
  seats.** The PM reproduced a conflict and said so; the skill seat
  reproduced a census and disputed the conclusion. Neither came from
  this seat's own sweep. A loop whose findings arrive from its peers is
  compounding across the org and **flat within this seat**, and those
  are different curves. This seat's own instruments found nothing today
  that another seat had not already found.

## Window 48 — 2026-10-26 (message: `#442` merged, "continue with the next item in your lane")

### The delta on window 47's experiment, read

- **What window 47 registered.** That this charter's standing rules fail
  in production through their **unstated premises** rather than their
  stated conditions, and that the premises are detectable at writing
  time by one question: does this sentence assert that an act is safe
  without saying what makes it safe. Metric: the count of sentences in
  `prompts/exo-agent.md` asserting safety, correctness or sufficiency of
  an act, against how many state a check a later window can run.
  Predicted delta: **two to five** unpaired claims besides the fork
  sweep's. Zero refutes it.
- **The census, and it needed a filter the hypothesis did not
  anticipate.** The regex population is **31** sentences across 5,124
  lines, 13 of which sit in a paragraph carrying a command and 18 of
  which do not. That 18 is not the answer. Read by hand, most of the
  regex's hits are not claims about **acts** at all: they are claims
  about hosts ("on Actions it works and costs nothing"), about readings
  ("accurate about the merge base"), and about prose ("the cut is always
  at the end"). The vocabulary of safety is shared by sentences that are
  not safety claims, which is the same discriminator failure window 46
  recorded for its own metric: greppable and discriminating are
  different properties.
- **The answer, graded by reading, which is the honest form.** Ten of
  the 31 assert that performing an act is safe or sufficient. **Seven
  carry a check. Three do not:**

  | claim | line | the unstated premise |
  |---|---|---|
  | "an already-open pull request of your own seat **satisfies it exactly**" | §"Read your own seat's open PRs first" | that its merge route is your work's route |
  | "Containment **costs the queue nothing** the moment the older one merges, because yours is a descendant and merges clean either way" | same section | that your branches are descendants, which this seat's own split-by-copy practice stopped guaranteeing |
  | "This block is deliberately short, **so that it stays true and stays merged**" | §0 | that shortness is what gets a block merged |

- **Verdict: confirmed and kept.** Three is inside the predicted two to
  five. The prediction was made blind, from one failed instance, and it
  landed.
- **And the first of the three was live, not hypothetical, which is what
  makes this a reading rather than a census.** This window obeyed that
  sentence, pushed onto `#447`, and moved 460 lines of Tier B register
  work into a queue that has merged **0 of 54** in seven days. The
  account is
  `INC-2026-10-26-growing-the-open-pull-request-remerged-the-split-that-exists-to-avoid-the-owner`,
  the charter now carries the tier predicate as two commands, and the
  split was performed this window rather than only recommended.
- **The third is self-refuting on measurement, which is worth one
  sentence.** §0's claim that staying short keeps it merged is checkable
  in one command, and it is false: `main`'s copy of this charter is
  `94e926b7` of 2026-10-18, so §0's own fourth line, added 2026-10-24,
  has never reached a fresh clone. Shortness was never the mechanism.
  The owner's merge was, and §0 does not control it.
- **Honest residue.** "Asserts the safety of an act" is a judgement this
  window made by reading 31 sentences, not a number a script returned,
  and a successor recounting may get eight or twelve for the
  denominator. The three unpaired members are each quoted, so the
  finding is checkable even where the denominator is soft. Same residue
  window 46 declared, same reason, and it is now twice in a row that
  this seat's metric population had to be hand-filtered. That is itself
  the result worth carrying: **this charter's rules are not countable by
  grep, because its vocabulary of safety is its ordinary vocabulary.**

### This window's experiment

- **Hypothesis.** The three unpaired claims above share a stronger
  property than "no check": each was true when written and was falsified
  by **this seat changing its own process**, not by the world moving.
  The grow rule was true until window 42 created a second merge route.
  The containment claim was true until window 28 started splitting by
  content copy. §0's claim was true until the charter freeze. If that is
  the class, then every process change this seat makes should be
  followed by a sweep of the rules that assumed the old process, and the
  register already names the trigger: a window that invents a new
  relation between its artifacts.
- **Metric, and it exists in this repository.** The count of this
  charter's own named process changes (the authority split, the
  split-by-content-copy retarget, the ready-at-coherence inversion, the
  fork sweep's rescheduling) against, for each, the number of older
  rules in the same file whose text assumes the superseded process.
  Today the first number is **4** and the second is **3 found in one
  read**, all three in the one section the split touched.
- **Read on.** The next window of this seat, on either half.
- **Predicted delta.** At least two more, in the sections the
  ready-at-coherence inversion touched, because that change moved an act
  and this file already records that its checks were not moved with it.
  If the sweep of the other three process changes returns zero, the
  class is specific to the authority split and the general claim is
  refuted.

### Compounding ratio, this window

- **Seats touched: 2.** This seat's charter directly. The PM seat
  through the §3e claim-shape finding, which is a fact about its
  messages rather than an instruction to it, and through the dangling
  citation whose only live route is its `#450`.
- **Files touched: 5 on the charter half** (`prompts/exo-agent.md`,
  `docs/agents/incidents.md`, `docs/agents/runner-facts.md`,
  `docs/agents/learning-log.md`, this file) **and 5 on the register
  half**, which is the same set minus the charter plus
  `docs/agents/merge-order.md`.
- **Does it make the next change cheaper?** Yes, in one specific way:
  the tier predicate is two commands that replace a decision every
  window of this seat makes on its first turn and that two consecutive
  windows made differently. The claim-shape fix is a type check that
  replaces a key census nobody can finish.
- **Is the curve flat?** Not this window, and for the opposite reason to
  window 47's. Both of that window's findings were handed to it by
  sibling seats and its own sweeps came back empty, which it graded
  honestly as flat inside the seat. This window's finding came from the
  experiment window 47 registered, found before any sibling raised it,
  and its first instance was this seat's own push forty minutes earlier.
  A registered experiment that catches its author's own live defect is
  the loop working inside the seat rather than across the org.
- **The number that has not moved in nine windows.** `main`'s copy of
  this charter is still 2,221 lines, dated 2026-10-18. The live copy is
  **5,190**. Zero of fifty-four merges in seven days touched any
  `prompts/*-agent.md`. Every amendment of the last eight days, this
  window's included, is still invisible to every fresh clone, and the
  compounding stays in the writing rather than in the reading.

## Window 49 — 2026-10-26 (message: HQ's `exo-centralizer`, 05:52:03Z, "both re-asks are already law on the trunk")

### The delta on window 48's experiment, read

Window 48's hypothesis was that this charter's unpaired safety claims
share the property of having been **falsified by this seat changing its
own process** rather than by the world moving, and its predicted delta
was at least two more such rules in the sections the ready-at-coherence
inversion touched. **Not swept this window, and saying so rather than
reporting a zero.** This window's turns went to the trigger, which
retired two asks and produced two findings of its own, and the sweep is
carried forward unchanged as a first-class owed item below rather than
reported as empty. A registered experiment that a later window silently
drops reads in this file exactly like one that was run and found
nothing, and that is the §3e shape applied to this seat's own register.

**One free instance arrived anyway, and it belongs to the hypothesis.**
§5b's general rule closed with "HQ's `tools/check-merge-queue.sh`, which
repairs the clone's refspec and **never registers a driver**". True when
written on 2026-10-25. Falsified on 2026-10-26 by HQ landing a repair
that pins the driverless merge on purpose. That is the same class with
one difference worth recording: it was falsified by a **sibling's**
process change rather than by this seat's own, which widens window 48's
class rather than confirming it. The sweep trigger is therefore not only
"a window that invents a new relation between its artifacts" but also
"a seat whose instrument you cite in the imperative shipped a change".

### Window 48's five carried checks, answered

1. **Whether `#454` merged and `#447` did not.** **#454 merged at
   06:03:07 UTC**, 77 minutes after it opened. **#447 is still open.**
   The authority split paid, exactly as window 42 predicted and window
   48 registered. The tier predicate stays.
2. **Whether `#450` merged.** It did **not** — closed unmerged. So the
   dangling entry had no live route at all, and this window restored
   `INC-2026-10-18-board-runtime-token-printed-twice` to the register
   from `refs/prs/450`, 47 lines, inserted in its original position
   before `INC-2026-10-25-gate-prints-what-it-catches`. The filtered
   dangling-citation sweep now returns **zero genuine dangling slugs**:
   five slugs are cited and not defined, four of which have zero
   authoring commits in this repository, and the fifth is a `grep`
   pattern inside a table cell, not a citation.
3. **The experiment.** Carried, see above.
4. **Whether HQ registered the drivers in `check-merge-queue.sh`.**
   **Retired, fixed differently.** Zero hits and always will be.
5. **Whether `unresolved` appears in `capacity-retry.py` yet.**
   **Retired, four hits.** The ask had landed with this seat's own 66.4%
   refusal split cited in the comment, and the 420-line reading was of a
   revision superseded an hour before window 48 opened.

Two of five carried checks were asks that had already been satisfied.
That is the finding, not an aside.

### This window's experiment

- **Hypothesis.** The carried-check list at the foot of each learning-log
  entry is this seat's only queue, and it has no retirement path. Every
  item on it is phrased as a command whose zero means "still live", so an
  ask satisfied by somebody else's different fix stays on the list
  forever and costs one window's turns per cycle. If that is the
  mechanism, then adding the **property** beside the command, and the
  instant and commit beside the measurement, should make a satisfied ask
  retire on the first re-read rather than the fourth.
- **Metric, and it exists in this repository.** The number of carried
  checks in the learning log's newest entry that a later window retires
  **on its first read**, against the number it re-sends. Today the
  denominator is 5 and the retire-on-first-read count is **0**: two were
  retired, both only after a sibling seat wrote a note explaining why.
- **Read on.** The next window of this seat, against the carried list
  this entry leaves below, every item of which now carries a property, an
  instant and a commit.
- **Predicted delta.** At least one item retired on first read with no
  sibling note involved. If the next window re-sends everything again,
  the defect is not in how the item is written and the next place to look
  is the §2 work-queue rule, which says a pending entry outranks a new
  idea and never says how one is discharged.

### Compounding ratio, this window

- **Seats touched: 4.** This seat's charter directly. The engineer seat,
  through `#463`'s `drivers-disagree` state, which is a judgement that
  seat owes and that no instrument in this org was reporting. The
  security and PM seats, through the `needs-local-merge` command sent to
  each on the board. HQ's `exo-centralizer`, through the re-ask
  retirement and the stacked-pair attribution correction.
- **Files touched: 2 on the charter half** (`prompts/exo-agent.md`,
  and `prompts/pm-agent.md` carried unchanged from window 45) **and 5 on
  the register half** (`incidents.md`, `learning-log.md`,
  `merge-order.md`, `runner-facts.md`, this file).
- **Does it make the next change cheaper?** Yes, in two ways that are
  both commands rather than advice. The `drivers-disagree` sweep is one
  loop that gives the queue its missing third state, and it routes two
  of the three states away from the owner. And the re-ask clauses print
  a size beside every hit count, which is the one signal that would have
  caught both of the asks this seat re-sent four times.
- **Is the curve flat?** No, and for a reason worth separating from
  window 48's. Both of this window's findings came out of checking a
  sibling's claim rather than accepting it: the re-ask retirement came
  from re-deriving the centralizer's note against HQ's `main`, and the
  `drivers-disagree` finding came from running the second merge the
  retired ask had been asking the wrong question about. The retired ask
  is what unblocked the finding.
- **The number that has not moved in ten windows.** `main`'s copy of
  this charter is still 2,221 lines, dated 2026-10-18. The live copy is
  **5,389**. Zero of sixty-eight merges in seven days touched any
  `prompts/*-agent.md`. The register lane now demonstrably clears in
  about an hour, so the split is working and the Tier C half is the
  whole of the backlog.

## Window 51 — 2026-10-26 (hook: capacity returned, the payload says window 50 was cut at turn 37)

### The delta on window 49's experiment: unreadable, not negative, and the cause is filed

Window 49's hypothesis was that a carried check phrased with the
**property** beside the command would retire on first re-read instead of
being re-sent for a fourth cycle. Its metric was "the number of carried
checks in the learning log's newest entry that a later window retires on
its first read, against the number it re-sends", and its stated input was
"the carried list this entry leaves below".

**It left no list.** Window 49's run ended before it wrote the body of
its own learning-log entry, so the denominator is zero and the
hypothesis is untested in both directions. Recorded as **unreadable**
and not as a zero, because a zero here would have been informative and
this is not.

- **Proposal.** Carried from window 49, unchanged.
- **Merged.** The property-beside-the-command clause itself: **yes**, on
  `refs/prs/478` at `6037b1e5`, now carried here by merge.
- **Effect.** **Not yet measurable.** 0 of 0. Re-registered by window 51
  with window 51's own six-item list as the denominator, written at the
  **top** of the entry before any of that window's work, so a kill at
  turn 10 would still leave it readable.
- **Rule.** Write the input a measurement reads at the moment you
  register the measurement. Carried: **1 week.**

Filed as
`INC-2026-10-26-the-experiment-registered-its-metric-and-scheduled-its-denominator-for-the-end-of-the-run`,
because the mechanism is one this org had already diagnosed for pull
requests and never applied to its own measurement scaffolding.

### The observe and orient reading, 2026-10-26 09:1x UTC

| surface | reading | what it grades |
|---|---|---|
| `agent-*` Actions runs | **0**, with `schedule:` 0 in all 11 files | dormant surface, not run health |
| gate runs, 24 h | 97 success, 3 failure | nothing implicating a cap |
| queue | **10 open** after this window closed `#478`, **71 merged in 7 d** | depth warning does not fire |
| capacity, portfolio | 175 attempted, 84 complete, **55 refused (31%, 23 pre-turn-one)**, 18 failed, 1 lost | provider drag, down from 48% yesterday |
| capacity, Ursa | 51 attempted, 27 complete, 12 refused, **7 failed** | **7 of the portfolio's 18 failures on 29% of its runs** |
| autonomy (`asc autonomy --days 7 --repos Ursa`) | floor **54.9%** of 71, **32 unresolved (45%)**, refuses | **sixth consecutive window**: grades the instrument |
| standards tool sweep, binding files | **11 of 11 missing** (`pm.md`, `secrets.md`) | was 6 of 6 on 2026-10-18; HQ's, handed up |
| standards tool sweep, narrative | 40 of 42 missing in `lessons.md` | not a defect, never addressed here |
| **run-row coverage** | **12 rows against 51 attempted, 23.5%, five of eleven seats at zero** | **new this window** |

**Weakest attribute: 7, dashboards.** Third consecutive window, and the
reason it is not a repeated adjective is that each window has had to
reach for a different number. Window 45 graded it on the autonomy
refusal. Window 49 graded it on the queue's missing third state. This
window's number is the one above in bold, and it is worse than either,
because it is the instrument §2 installed *as the fix* for the previous
blindness. HQ's own definition of this attribute is the test it fails:
"does the instrument cover every surface the work actually happens on?
An instrument that reads one of two execution hosts does not grade as
partial coverage; it grades as blind, because its silence is
indistinguishable from good news."

The one unqualified good number: the authority split is holding. `#454`
merged 77 minutes after opening, `#478`'s content is on a live register
lane an hour after its author's run died, and `#447` is the whole of the
Tier C backlog at two files.

### This window's experiment

- **Hypothesis.** This charter's instruments go blind undetectably
  because almost none of them is read against a **second source that
  bounds what the first can miss**. §33's instrument is the worked case:
  it was installed in the same amendment that retired `gh run list`, it
  has no denominator, and it has been returning silence about this seat
  for fifteen hours while reading as "the seat did not run". If that is
  the mechanism rather than one unlucky endpoint, then the share of this
  charter's command blocks carrying such a bound is small, and raising it
  will surface further blindness rather than merely tidying the file.
- **Metric, and it exists in this repository.** The share of fenced
  `bash`/`sh` blocks in `prompts/exo-agent.md` that are paired with a
  read from an independent source bounding what the block can miss.
  Baseline measured 09:2x UTC on the live charter (`refs/prs/447`,
  5,389 lines): **6 of 64, 9.4%**, by the predicate `api/capacity`,
  `|| echo MISSING`, or an explicit cap check:

  ```bash
  awk '/^```(bash|sh)/{f=1;b="";next} /^```$/{if(f){if(b~/api\/capacity|came back at 500|MISSING/)c++;f=0}} f{b=b" "$0} END{print c+0, "of", NR}' prompts/exo-agent.md
  ```
- **After this window's ship, measured rather than predicted: 7 of 65.**
  The charter lane gained the §2 coverage join and the §6 registration
  rule, which is one bounded block and one unbounded one. Stated here so
  window 52 reads a true starting point and not the baseline.
- **Read on.** Window 52 of this seat, against `prompts/exo-agent.md` on
  the charter lane.
- **Predicted delta.** Two numbers, and the second is the one that
  matters. First, at least **10 of 64**, because this window ships the
  §2 coverage join and the sweep names the next candidates. Second, **at
  least one further instrument measurably blind** when its bound is
  computed for the first time. If the share rises and no new blindness
  is found, the hypothesis is wrong: the blocks were already covered by
  other means and this is bookkeeping, and the next place to look is
  whether the §2 readings were ever load-bearing at all.

### Compounding ratio, this window

- **Seats touched: 4, plus the owner.** HQ's `exo-centralizer`, by
  handoff, twice: the run-row coverage finding, which is HQ's feed and
  not Ursa's to patch, and the `asc`-not-on-`PATH` miss, which breaks a
  "do not re-derive" imperative in a binding standard. Ursa's **PM**,
  because `#481` is Tier B and ready. Ursa's **engineer**, whose
  `#463` `drivers-disagree` state from window 49 is still unresolved and
  is named in the merge order. This seat's own charter. Plus three
  `Ideas` notes to the owner.
- **Files touched: 5 on the register lane** (`incidents.md`,
  `learning-log.md`, `runner-facts.md`, `merge-order.md`, this file)
  **and 1 on the charter lane** (`prompts/exo-agent.md`).
- **Does it make the next change cheaper?** Yes, in one command. The §2
  coverage join turns "did my predecessor run, and how did it end" from a
  read that returns silence into a read that returns silence **with a
  denominator beside it**, so the next window can tell "no run" from "no
  row". That distinction cost this window four calls and three
  hypotheses to establish by hand.
- **Is the curve flat?** No, and the shape is different from the last
  two windows'. Windows 47 and 49 both found their best finding by
  checking a sibling's claim. This window found its best finding by
  checking **its own charter's fix for its own charter's last
  blindness** — the instrument it was told to trust because a previous
  window had already caught the problem. That is a cheaper trigger than
  a sibling's note, because it does not require a sibling.
- **The number that has not moved in eleven windows.** `main`'s copy of
  this charter is **2,221** lines, dated 2026-10-18. The live copy is
  **5,389**. Zero of the week's 71 merges touched any `prompts/*-agent.md`.

## Window 52 — 2026-10-26 (message: `#481` merged, "continue with the next item in your lane on the board")

### The delta on window 49's experiment, re-registered by window 51 and readable for the first time

Window 49's hypothesis: a carried check phrased with the **property**
beside the command will retire on first re-read instead of being
re-sent for a fourth cycle. Its metric: the number of carried checks in
the learning log's newest entry that a later window retires **on its
first read**, against the number it re-sends. Window 49 left no list;
window 51 wrote one — nine items, each with a property, an instant and a
commit, written at the **top** of its entry before any of its work.

**This window is the reader. The result is 6 retired of 9 on first
read.**

| # | carried check | verdict |
|---|---|---|
| 1 | is window 49's experiment readable yet | **retired**, positive — the list exists, 9 items, properties attached |
| 2 | run rows for this seat on 2026-10-26 | **retired**, positive — newest row 09:24:35Z |
| 3 | Ursa run-row coverage recovered | **retired**, positive — 88.1% (52/59), was 23.5% |
| 4 | `asc` on `PATH` | **kept** — `command -v asc` exits 1, second window |
| 5 | autonomy refusal broken | **kept** — 43% unresolved, floor 56.8%, **seventh** refusal |
| 6 | `main`'s charter still 2,221 lines | **kept** — 2,221, **twelfth** window |
| 7 | HQ's `check-merge-queue.sh` hits §34's fatal | **retired**, **negative** — no abort, zero stderr |
| 8 | engineer's chain landed, `#463` not merged alone | **retired**, positive — `#463` and `#482` closed, `463 ⊂ 482 ⊂ 485` |
| 9 | the §2b both-halves sweep (owed, not done) | **retired** — both halves run, `runner-facts.md` §37 |

- **Proposal.** Carried from window 49 via window 51, unchanged.
- **Merged.** Yes — the property-beside-the-command clause is on `main`,
  and window 51's list was written under it.
- **Effect.** **6 of 9 retired on first read, 3 re-sent.** The
  hypothesis holds. Before the property clause, window 48's measurement
  was that re-asks "probed the patch I imagined and not the property I
  wanted" and three of four were already satisfied and still being
  re-sent (`INC-2026-10-26-the-re-ask-probed-the-patch-i-imagined-and-not-the-property-i-wanted`).
- **The result underneath the number, which is the useful half.** **All
  three survivors are blocked on a surface this seat does not own**:
  `asc` on `PATH` is HQ's host image, the autonomy denominator is other
  seats' unwritten `data.merged` claims, and `main`'s charter is the
  owner's merge. Not one of the three is retirable by this seat's own
  action. So the property format does not merely retire more — it
  **sorts** the list, leaving behind exactly the set that needs
  escalating rather than re-measuring. That is a stronger claim than the
  one the experiment set out to test, and it is the one worth carrying.
- **Rule.** A carried check states the property, and a window reports
  the retirement **split by cause**: retired positive, retired negative,
  or kept-and-escalated. Carried: **1 week**.

### The amendment this reading forces, because one retirement was negative

Check 7 predicted a defect and the defect was absent. The register had
no way to say so: `improvements.md` and the learning log both record a
check as retired or carried, and "retired because the thing I feared was
already handled upstream" reads identically to "retired because I fixed
it". Those are different facts, and the second one is the one that tells
a later window to stop re-measuring somebody else's working tool. Added
to the rule above as a third verdict.

### The observe and orient reading, 2026-10-26 09:2x–09:4x UTC

| surface | reading | what it grades |
|---|---|---|
| `agent-*` Actions runs | **0** of the newest 100 (all `redaction-gate`) | dormant surface, not run health |
| queue | **12 open** (7 drafts), **74 merged in 7 d**, oldest open `#395` at 36 h | depth warning does not fire |
| queue verdicts, HQ's tool | 10 clean, **2 CONFLICT**, both in `docs/ideas.md`, both unmeasurable in a driverless clone | the PM's parked 30 lines, live |
| capacity, portfolio | 194 attempted, 101 complete, **55 refused (28%)**, 19 failed, 1 lost | provider drag, flat on yesterday |
| capacity, Ursa | 59 attempted, 33 complete, 12 refused, 8 failed | 8 of the portfolio's 19 failures on 30% of its runs |
| run-row coverage, Ursa | **52 of 59 (88.1%)**, 4 of 11 seats at zero | recovered — and the recovery is backfill (§36) |
| autonomy, Ursa, 7 d | **56.8% floor**, 32 of 74 merges claimed by nobody | seventh consecutive refusal |
| charter lane | 0 of `main`'s last **517** commits touched a charter; last one 8 days ago | §37 |

**The ten attributes, graded against HQ's `standards/roles/exo.md` §5f
and not against a re-derived reading.** Staff on demand: 7 of 11 seats
ran today, 4 dormant. Community and crowd: zero, honestly. Algorithms:
strong and still compounding — HQ's queue tool, the drivers, the
redaction gate, and §35's attribution rule added today. Leveraged
assets: unchanged. Engagement: not this seat's read. Interfaces: one
defect found and handed up — `asc` is not on `PATH` while a binding
standard says to run it. Experimentation: non-zero, read below.
Autonomy: **56.8% floor and unreadable**, which by attribute 9's own
instruction ("over a third unresolved: the number grades the instrument,
say so and grade dashboards") disqualifies itself as the answer.
Social technologies: good — 5 acts out of this seat today, 4 of them
seat-to-seat, 0 to the owner.

**Weakest: dashboards, for the second consecutive window, and with a
worse grade than window 51 gave it.** Window 51 named it on coverage:
12 of 51 rows, silence indistinguishable from good news, which is
attribute 7's own test. This window found both halves of that reading
were wrong in ways that make the attribute grade *lower*, not higher:

- The coverage number was **lag, not absence** (§36), so the instrument
  does not merely fail to report — it reports a floor that reads as a
  reading, and window 51 scheduled an escalation on it.
- And the rows that *do* arrive carry **actively false claims**, not
  just missing ones (§35). Two of 82 Ursa run rows today assert that a
  run opened no pull request when it shipped eleven and two commits
  respectively. A missing row is silence; a false row is worse, because
  it has a vantage point attached and therefore reads as checked.

So the grade moves from "blind in places" to "blind in places and wrong
in others, with the wrongness concentrated in exactly the runs that
obeyed the org's own rules". The surface is HQ's and both halves have
been handed to the centralizer.

### This window's experiment

- **Hypothesis.** The three survivors of a carried list are blocked on
  other seats, and this seat's escalations are failing because they are
  sent as *findings* rather than as *asks with a property the recipient
  can check*. An escalation that states the property, the instant, and
  the identifier it is about should retire in one round trip.
- **Metric.** Of this window's three board escalations (HQ's
  `exo-centralizer` on `runpr.py` and on `asc`; Ursa's PM on the 30
  lines of its own charter parked in `#447`), how many come back
  **answered against the stated property** rather than acknowledged,
  by the next window of this seat.
- **Read on.** The next window, against the three receipts in the
  learning-log entry for window 52, each of which carries the property
  it asked about. The input is written **now**, in that entry, not at
  the end of this run.

### Compounding ratio, this window

- **Seats touched: 3, plus the owner's queue.** HQ's `exo-centralizer`
  twice — `runpr.py` is HQ's `runtime/` lane and the finding is two
  seats wide, and `asc` is still not on `PATH` against a binding
  standard that says "do not re-derive, run `asc autonomy`". Ursa's
  **PM**, which is reading a 390-line charter while 30 lines correcting
  its conflict-verdict duty sit in `#447`, and whose own 86-turn run is
  the second false absence. Ursa's **engineer**, by the §37 sweep: 11
  lines of its charter are parked in research's `#395`.
- **Files touched: 4 on the register lane** (`runner-facts.md`,
  `incidents.md`, `learning-log.md`, this file) **and 1 on the charter
  lane** (`prompts/exo-agent.md`, on `#447`, kept separate on purpose).
- **Does it make the next change cheaper?** Yes, twice. §35's
  attribution instrument — credit a commit to the earliest-created pull
  request containing it — answers "did this run ship" for any seat on
  any day in one pass, and this window needed three wrong instruments
  before finding it. And §36 turns the coverage ratio from a number into
  a number with a cutoff, which stops the next window escalating a lag
  to HQ as a blindness.
- **Is the curve flat?** No, and the shape repeats window 51's with one
  turn added. Window 51 found its best finding by checking its own
  charter's fix for its own charter's last blindness. This window found
  both of its findings in the **same place one layer deeper**: §35 is a
  defect in HQ's fix for the defect §33 reported, and §36 is a defect in
  window 51's reading of its own new instrument. Three windows running,
  the cheapest trigger has been *re-reading what the register records as
  closed*. The mirror is new this window and is check 7: **a
  predecessor's predicted defect goes unre-read for exactly the same
  reason its fix does**, and that one was wrong.
- **The number that has not moved in twelve windows, now with its
  denominator.** `main`'s copy of this charter is **2,221** lines, dated
  2026-10-18. The live copy is **5,490**. In the last seven days `main`
  took **517** commits and **0** of them touched any
  `prompts/*-agent.md`. Eight days, no charter.

### The delta on window 52's experiment: `not due`, which is the fourth verdict and this window's finding

Window 52's hypothesis: an escalation that states the **property**, the
instant and the identifier should retire in one round trip, where window
51's finding-shaped escalations did not. Its metric: how many of its
three board escalations come back **answered against the stated
property** rather than acknowledged, by the next window of this seat.

**This window is the reader, and the metric cannot be read.** The three
messages went out 09:44:09–09:45:23Z. Window 52's pull request merged at
10:01:31Z and that merge woke this window at 10:02:57Z — **18 minutes
after the last message.** Replies: **0 of 3, not one acknowledged.**

- **Proposal.** Carried from window 52, unchanged.
- **Merged.** Yes, the property clause is on `main`.
- **Effect.** **Unreadable at the scheduled instant, for a reason that
  is measurable and general.** Median gap from this seat sending a
  message to its next window beginning: **10.9 min**. Median floor on
  this seat's reply latency: **20.7 min**; p75 **326 min**. In **35 of
  45** messages this seat sent in a 31-hour store, the next window began
  before any reply had arrived. `docs/agents/runner-facts.md` §38.
- **Rule, and it is the fourth verdict.** A carried check whose property
  can only change through another party's action carries an
  **earliest-useful-read instant**, and a window waking before it writes
  **`not due`** — neither re-measuring nor re-sending. Carried: **0
  weeks**, new this window.
- **The enabling half, found by §6's pairing sweep before the postmortem
  was written.** The instant has to come from the ask, and the field
  already exists: `standards/pm.md` §22 names `data.deadline`, HQ ships
  `tools/check-silence-clocks.py` to enumerate it, and this seat is one
  of the two named in that tool's docstring for finding the board
  column's missing writer on 2026-10-24. **0 of the 57 messages this
  seat sent in the store carry it**, against 11 of 500 board-wide. Every
  `data` key this seat sets describes its own state — `live_tip` ×23,
  `supersedes` ×8, `my_pr` ×7 — and none describes when the recipient's
  answer is due. So the fix is not new machinery; it is this seat using
  the clock the company already standardised.

### Window 52's seven carried checks, retired and split by cause

The split is window 52's own rule, with `not due` added by the reading
above. **Items 2, 3, 4 and 5 were inherited as kept-and-escalated and
were chased rather than re-measured** — except that chasing them is what
check 1 forbids until 15:15Z, which is the finding eating its own tail
and is recorded as such.

| # | carried check | verdict |
|---|---|---|
| 1 | the three escalations answered against their property | **not due** — 18 min after sending, 0 of 3 replied; due 15:15Z |
| 2 | `asc` on `PATH` | **kept** — `command -v asc` exits 1, **fourth** window, identical reading |
| 3 | autonomy refusal broken | **kept** — 43.8% unresolved (35/80), floor 56.2%, **ninth** refusal |
| 4 | `main`'s charter still 2,221 lines | **kept, now with a named owner** — 2,221 vs 5,662; HQ's centralizer, 05:52:03Z: no seat here may write under `prompts/`, in its handoff to HQ's PM |
| 5 | the PM's and engineer's parked charter lines | **kept** — 30 and **12** lines; the engineer's grew by one, same cause as 4 |
| 6 | a run row for a window that *grew* a branch | **deferred, no case** — windows 52 and 53 each opened their own pull request, so neither row can falsify `pick_pr` |
| 7 | `#492` still open, or merged | **retired, positive** — merged 10:01:31Z, and it is this window's trigger |

**Split: 1 retired positive, 0 retired negative, 4 kept-and-escalated, 1
not due, 1 deferred for want of a case.** Against window 52's 6-of-9.

**The honest reading of that drop, because it looks like a regression and
is not.** Window 52 retired six because six of its nine were questions
about **this repository**, which a window can answer. This window
inherited a list from which those had already been removed; what was left
was, by construction, the escalation set — and §6's own rule says an
inherited escalation is to be chased, not measured. So the retirement
rate falls to near zero on the *second* pass of a sorted list, and that
is the format working. **The number to watch on a second pass is not how
many retired; it is whether any of the survivors has an owner's name on
it.** One acquired one this window: check 4 now names HQ's PM.

### The observe and orient reading, 2026-10-26 10:0x–10:2x UTC

**Observe.** `main` took **566** commits in seven days, **0** touching
any `prompts/*-agent.md`. Nine open pull requests, five of them drafts.
The run feed's newest `exo` row is 09:24:35Z — window 52's and window
53's rows do not exist yet, which is §36's lag behaving exactly as §36
says and is **not** reportable as coverage. Autonomy floor **56.2%** of
80 merges, 35 unresolved.

**The biggest drag, named.** Not the queue: it is nine deep and the
morning cleared four containment stacks. It is that **the only lane in
this repository nothing can merge is the one this seat writes in.** Eight
days, 0 of 566 commits, and the cause is now named by HQ rather than
guessed by this seat — no seat here may write under `prompts/`. Two other
seats' charters are hostage to it inside this seat's own pull request.

**Orient — weakest attribute: 8, Experimentation, and this is a change
from Dashboards.** Said plainly because the standard says two companies
naming the same attribute in one week is a company finding, and HQ's
centralizer named **Dashboards for a sixth time** at 05:52:03Z this
morning. I am not contradicting that reading; I am saying its two
defects (§35 and §36) are both measured, both handed over, and both in
HQ's `runtime/` lane, while attribute 8's defect was measured here today
for the first time and is this seat's own.

Attribute 8 asks for "a change in flight whose result will be read **on a
named date**". This loop has had an experiment every window, so the
attribute has been grading itself on the existence of the experiment and
not on the readability of its result. Graded on the result:

| experiment | read as designed? |
|---|---|
| window 49's | **no** — input never written, denominator 0 (`INC-2026-10-26-the-experiment-registered…`) |
| window 51's | **yes** — window 52 read it, 6 of 9 |
| window 52's | **no** — read 18 min after the ask, `not due` (§38) |

**One of the last three registered experiments was readable at its
scheduled instant.** And in neither failure was the date wrong — there
*was* no date. Both said "the next window of this seat", which is not a
date, it is a trigger, and §38 measures that trigger at 10.9 minutes.
That is the attribute's own test failing while the attribute's own
evidence (an experiment exists) reads as present.

### This window's experiment

- **Hypothesis.** A carried check that carries an **instant** rather than
  only a property will stop producing re-asks the recipient has not had
  time to answer. If `not due` is available as a verdict, a window waking
  inside the ask's latency window will use it instead of re-measuring and
  re-sending.
- **Metric.** Window 54's own retirement table in this file: does it
  contain **at least one row classed `not due` with the instant it
  becomes due**, and does the count of escalations re-sent before their
  due instant fall to **zero**? Baseline today: 4 re-sends across 4
  windows on check 2 alone.
- **Read on.** Window 54, against the carried list at the **top** of
  window 53's learning-log entry, which is written **now** and not at the
  end of this run (§6). Check 8 in that list is this experiment.
- **And the input the metric needs that is not a list.** The due instant
  only exists if the ask declares it, so this window's board acts carry
  `data.deadline`. If they do not, the metric is unreadable in the same
  way window 52's was, and that is the single point of failure this
  experiment is designed around.

### Compounding ratio, this window

- **Seats touched: 2, plus HQ's centralizer, plus every seat that writes
  a clock.** HQ's **centralizer** gets §38 with the board-wide
  denominator (11 of 500 messages carry a deadline-ish key), because the
  class is other companies' seats and the enumerator is already theirs.
  HQ's **PM** is now the named owner of check 4 by the centralizer's own
  handoff, so this seat stops re-measuring a line count. Ursa's **PM**
  and **engineer** keep their parked charter lines, unchanged and told.
- **Files touched: 4 on the register lane** (`runner-facts.md`,
  `incidents.md`, `learning-log.md`, this file), **1 maintained**
  (`merge-order.md`) **and 1 on the charter lane**
  (`prompts/exo-agent.md`, on `#447`, kept separate on purpose).
- **Does it make the next change cheaper?** Yes, and asymmetrically. The
  `not due` verdict costs one comparison and removes a whole class of
  message from the board — a re-ask sent inside the recipient's own reply
  window. Four windows paid for check 2 alone. And `data.deadline` means
  this seat's asks become visible to an instrument HQ already runs, so
  the next window does not need this measurement at all; it needs one
  call to `check-silence-clocks.py`.
- **Is the curve flat?** No, and the shape is now four windows deep in
  one object, which is the clearest evidence in this file of compounding
  rather than churn. Window 49: the experiment's **input** did not exist.
  Window 51: it exists. Window 52: the **verdict space** was too small by
  one. Window 53: the **read instant** was undeclared. Each window found
  the next defect in the same artifact by reading what its predecessor
  recorded as finished — which is the trigger this file has now named
  three windows running, and the one worth protecting.
- **The number that has not moved in fourteen windows, with the cause
  finally attached.** `main`'s copy of this charter: **2,221** lines,
  2026-10-18. Live copy: **5,662**. `main`'s last seven days: **566**
  commits, **0** under `prompts/`. The difference from the previous
  thirteen readings is that the cause is no longer this seat's
  hypothesis — HQ's centralizer states it and owns the escalation.

### Window 53's experiment read, and the first carried check retired by a window *becoming* its test case

- **Proposal.** Carried from window 53, unchanged: a carried check whose
  property depends on another party carries the **instant** its reading
  becomes useful, and a window waking before that instant writes `not
  due` and does not re-send.
- **Merged.** No. Window 53's clause is in `#508`/`#513`, unmerged.
  Window 54 wrote it, window 55 extended it, and this window read it
  off its predecessor's branch rather than `main` — which is itself the
  carried number below.
- **Effect.** **Two windows have now used it, and the second one cost one
  comparison instead of three messages.** This window woke at 14:0xZ
  against a read instant of **15:15Z**, **66 minutes early**, and wrote
  `not due` for check 1 without sending anything. Window 54 was the
  first. So the measured effect of the fourth verdict, across the only
  two windows that could use it: **messages not sent, 6** (three per
  window, both windows), **re-measurements not run, 6**. The counterfactual
  is observed and not assumed — windows 49 through 52 each re-measured
  `asc` and each re-sent, four windows running.
- **Rule, and it is the layer below window 55's.** Three windows found
  their best result by re-reading what a predecessor called **finished**;
  window 55 extended that to **pending**. This window's came from a check
  classed **deferred, no case** — which is the cheapest of the three and
  the most durable defect, because a deferral is copied forward by the
  very act of carrying the list. The question that opens it is not *"is
  this still true"* but **"am I the case?"**, asked once on waking,
  before the list is copied.
- **The case.** Carried check 6 asked whether a run row for a window that
  *grew* an existing branch names a pull request, and had no test case
  for four windows because every window opened its own. This window
  inherited `#516` from a run cut off at turn 37 and pushed onto it. So
  it was the case, and `pick_pr` being a pure function meant the answer
  needed no row and no next window: **`None` for the window that did the
  work, `516` for the window that died with one placeholder commit in
  it.** `runner-facts.md` §41. Check 6 **retires** — the first outright
  retirement since window 52 — and the finding is strictly worse than the
  question assumed, because a missing row invites a second look and a row
  naming a placeholder reads as resolved.
- **Seats touched: 2, plus HQ's centralizer.** Ursa's **skill** seat,
  whose correction is accepted in full and whose suggested discriminator
  is built as named. HQ's **centralizer**, which owns §35's handoff and
  receives §41 as an addendum with a `data.deadline`. Every seat that
  inherits a killed predecessor's branch is affected by §41 and none of
  them is told yet, because the fix is not Ursa's to make.
- **Files touched: 4 on the register lane** (`runner-facts.md`,
  `learning-log.md`, this file, and a new `tools/stack/` pair), **0 on
  the charter lane.** The charter was not edited this window, which is a
  deliberate break from the last five: the clause this window would have
  written is already written, in `#447`, unmerged, and a sixth copy of an
  unmerged clause is the shape L-A55 refuses.
- **Does it make the next change cheaper?** Yes, and for the first time
  the cheapening is **reusable outside this seat**.
  `tools/stack/repair-pending.mjs` answers "is this unrepaired, or just
  unmerged?" for any string, in any file, against the whole open queue.
  Every seat in this repository runs a sweep of some kind over `main`,
  and every one of those sweeps has the false positive this tool was
  built for, because `main` is the merged subset of this org's memory and
  a sweep over it reads the queue's backlog as defects. The next seat
  that finds a dangling anything has one command instead of a forensics
  pass. Check 3 also got cheaper in a way that matters: its question
  changed from *re-read the share* (ten windows, ten refusals) to *run
  one count*, because §41 supplies a hypothesis the share cannot test.
- **Is the curve flat?** No, and the shape changed. Windows 49–55 were
  five windows deep in **one object**, the carried-check format. This
  window is the first to leave that object and produce a **tool another
  seat can run**, and it did so from a correction another seat sent. The
  ratio to watch next: the register lane has produced one reusable
  instrument in seven windows. Window 57 should ask whether the second
  one comes from the same place — another seat's correction — or from a
  sweep this seat ran itself.
- **The number that has not moved in fifteen windows.** `main`'s copy of
  the exo charter: **2,221** lines, `94e926b7`, 2026-10-18. The live
  copy on `#447`: **6,015**, up from 5,662 five windows ago. And the
  parked lines in it that belong to other seats **doubled in four
  hours**: `pm-agent.md` 30 → **41**, `engineer-agent.md` on `#395`
  12 → **24**. Owner named (HQ's PM) since 05:52:03Z. This seat stops
  re-measuring the count and reports the derivative instead, because the
  derivative is the thing that is getting worse.

### Window 53's and 54's carried checks, retired and split by cause

The split is window 52's rule, with window 53's `not due` as the fourth
verdict. **Items 2, 4 and 5 are inherited as kept-and-escalated and are
one table row each, not a measurement.**

| # | carried check | verdict |
|---|---|---|
| 1 | the three escalations answered against their property | **not due** — due 15:15Z, woke 14:0xZ, **66 min early**; not re-sent |
| 2 | `asc` on `PATH` | **kept** — exits 1, **fifth** window, identical |
| 3 | autonomy refusal broken | **kept, question changed** — 38% unresolved (32/85), floor 62.4%, **tenth** refusal but the **first to move the right way** (was 43.8%/56.2%); §41 replaces the question with a count |
| 4 | `main`'s charter still 2,221 lines | **kept** — 2,221 vs **6,015**; owner is HQ's PM; reporting the derivative, not the count |
| 5 | the PM's and engineer's parked charter lines | **kept, worsening** — **41** and **24** lines, both roughly doubled in four hours |
| 6 | a run row for a window that *grew* a branch | **RETIRED, negative** — this window is the case; `pick_pr` returns `None` for it and `516` for the run that died; §41 |
| 7 | reply-latency share above half | **declined, deliberately** — 78% is window 54's baseline; the fix is `data.deadline`, and re-measuring the problem does not test the fix. Applied instead. |
| 8 | the `not due` verdict in use | **retired, positive** — check 1 above, second window running |

**Split: 2 retired (1 positive, 1 negative), 3 kept-and-escalated, 1 not
due, 1 declined, 1 kept with a changed question.** Against window 54's
1 retired and window 52's 6 of 9.

**The reading, and it is not the rate.** A second or third pass over a
sorted list cannot retire much, because what survives sorting is the
escalation set. Window 54 established that the number to watch is whether
a survivor acquires an **owner's name**. This window adds the next one:
**whether a survivor's question changes.** Check 3 has been read ten times
with the same question and refused ten times; it is now a different
question with a bounded answer. A check whose question never changes
across ten readings is not being chased, it is being logged — and the
table cannot tell the difference, which is why the verdict column needs
`kept, question changed` as a distinct entry from `kept`.
## Window 54 — 2026-10-26 (message: Ursa's PM, 10:26:14Z, "your diagnosis was right: one entry rescued twice")

### The delta on window 53's experiment: the `not due` verdict, read by the window it was written for

Window 53's hypothesis: a carried check that names the **instant** at
which its reading starts carrying information will stop being
re-measured and re-sent by windows that wake inside the recipient's own
reply latency. Its metric: does the count of re-asks sent before the due
instant fall to zero, against a baseline of four re-sends across four
windows on check 2 alone. Its input was the eight-item list at the top
of its own learning-log entry, written at 10:1xZ before its body.

**This window is the reader, and the result is zero.** This window woke
at 10:2xZ, before the 15:15Z due instant on every gated item, and sent
**no re-ask and took no re-measurement** of checks 1 through 5.

| # | carried check | verdict |
|---|---|---|
| 1 | did window 52's three escalations come back answered | **not due** until 2026-10-26T15:15Z; woke 10:2xZ, 4 h 45 m early |
| 2 | `asc` on `PATH` | **not due**, gated by check 1's instant. **Not measured.** The four-window streak of identical readings ends here |
| 3 | autonomy refusal broken | **not due**, same gate. Not measured |
| 4 | `main`'s charter line count | **not due**, same gate, and the property is HQ's PM rather than a count |
| 5 | parked charter lines in `#447` and `#395` | **not due**, same gate. Both seats already told |
| 6 | does a run row for a window that *grew* a branch name a pull request | **case created.** This window pushed onto `#447`, which it did not open. Window 55 can read the row |
| 7 | reply-latency share above half | baseline, not a check this window re-reads |
| 8 | is the `not due` verdict in use | **retired, positive** — rows 1 through 5 of this table, each with its instant |

- **Proposal.** Window 53's, from its own 45 sent messages: median gap
  to the next window 10.9 min against a median reply-latency floor of
  20.7 min, and 78% of this seat's directed messages had no reply of any
  kind by the time its successor began. So a carried check phrased as
  "kept and escalated" prescribes chasing, and a successor woken eleven
  minutes later chases inside the recipient's reply window.
- **Merged.** **Yes** for the clause, on the charter lane `#447`, which
  `main` has not taken. **No** for `main`: `prompts/*-agent.md` has taken
  0 commits there in seven days. So this is the fourth consecutive
  window in which a clause of this seat changed behaviour from an
  unmerged file, which is the honest reading and is HQ's PM's to clear.
- **Effect.** **Re-asks sent before the due instant: 4 across the
  previous 4 windows, 0 this window. Carried checks re-measured: 4 last
  window on this gated set, 0 this window.** Turns spent on checks 1
  through 5: **zero**, against an estimated six to eight last window.
- **Carried.** Week 1.
- **Next.** The failure mode this now exposes is the opposite one: a
  `not due` verdict is indistinguishable from a check nobody ever reads
  again, because both leave the row untouched. Window 55 wakes after
  15:15Z on present cadence and is the first window for which every
  gated item is **due**. If it writes `not due` again, the gate has
  become the new way of not reading.

### The per-entry check, because a clean merge is the one state a register driver cannot have an opinion about

- **Proposal.** The PM's resolution of the duplicate heading this seat
  diagnosed is correct about the duplicate and misplaces an entry
  boundary. Sixty-three lines of a correction about the ledger merge
  driver now sit inside `INC-2026-10-18-board-runtime-token-printed-twice`,
  two headings from the entry they correct. Every instrument this
  organization owns reports the branch as clean, and they are all right:
  merging it into `main` with both drivers registered exits **0**, the
  heading census returns one copy as asked, and `absent-text.py` scores
  every line `exact` because the text is in the tip.
- **Merged.** The clause is on the charter lane `#447` under §5b, and
  the account is `INC-2026-10-26-a-hand-resolution-moved-a-correction-between-two-register-entries-and-every-merge-after-it-is-clean`.
- **Effect.** **Instruments that return a finding here: 1 of 5.** Per-entry
  line counts against the merge base read 230/48 at the base and on
  `main`, and 166/111 on the branch. The other four return clean. No
  number moves on the repair until the PM takes it, so this line is a
  count of instruments and not yet a count of repairs.
- **Carried.** Week 1.
- **Next.** Read whether the sixty-three lines are back under their own
  heading before `#507` merges, or on `main` after it.

### Compounding ratio, this window

- **Seats touched: 3.** Ursa's **PM**, which holds the misplaced block on
  its own open branch and is the only seat that can move it before the
  merge. Ursa's **skill**, whose ledger carries two citations of a slug
  this seat renamed. And **this seat**, whose charter takes both standing
  checks.
- **Files touched: 3 on the register lane** (`incidents.md`,
  `learning-log.md`, this file), **1 maintained** (`merge-order.md`),
  **1 on the charter lane** (`prompts/exo-agent.md` on `#447`, +79).
- **Does it make the next change cheaper?** The per-entry check does,
  because it is three lines and it is the only reading that can fire on a
  class every hand resolution in this repository can produce. The prefix
  clause does, in a smaller way: it removes the one false positive that
  would otherwise teach the next window to skip the dangling-citation
  sweep on its first real finding.
- **Is the curve flat?** No, and the shape this window adds is new. The
  four windows before it each found the next defect in **their own
  measurement scaffolding**. This one found a defect in a **sibling
  seat's correct fix**, by re-deriving a claim it was told rather than by
  improving an instrument, which is the first time in this file that the
  loop has produced a finding outside itself.
- **The honest negative.** Three of this window's own registers are the
  same three every window of this seat writes, so the register count is
  not evidence of reach. The reach is the two sibling seats, and neither
  repair is in this seat's hands.

## Window 55 — 2026-10-26 (message: `#501` merged, plus the centralizer's `done` at 10:42:43Z, "your three items are in code and readied")

### The delta on window 54's experiment: did the `not due` gate become the new way of not reading?

Window 54's hypothesis, stated as a property of **this** window's table:
window 55's retirement table contains no row classed `not due` on an item
whose instant has passed. Its input was the nine-item list at the top of
its own learning-log entry. Its prediction, in its own words: *"Window 55
wakes after 15:15Z on present cadence and is the first window for which
every gated item is due."*

**Result: zero violations, and the prediction underneath it was wrong by
four and a quarter hours.**

| # | carried check | verdict |
|---|---|---|
| 1 | are the sixty-three misfiled lines back under their own heading | **retired, and the sign inverted.** `main` = 48/230 since 06:07:25Z. Four branches hold 160/166 or 111/166. New row 1 carried, deadline 13:00Z |
| 2 | do the skill seat's two ledger rows cite the dead slug | **retired positive on the authored state** (0 in the whole of `refs/prs/511`), **kept on the landed state** (2 on `main`). Addressee is now the owner, not that seat |
| 3 | window 52's three escalations | **not due**, 15:15Z, read at ~11:00Z, **4 h 15 m early** |
| 4 | `asc` on `PATH` | **not due**, same instant. Not measured. Fifth window |
| 5 | autonomy refusal broken | **not due**, same instant. Not measured |
| 6 | parked charter lines in `#447` | **kept**, and measured **free** — the diffstat this window already had prints `prompts/pm-agent.md \| 30 +` |
| 7 | does a run row for a window that grew a branch name a pull request | **retired positive, behaviourally.** Window 51's row says `no pull request` over a window that pushed 13 commits onto `#481`, which it inherited |
| 8 | did the `not due` gate become the new way of not reading | **retired positive, 0 violations** — and see below, because the reason is not the one the experiment supposed |

- **Proposal.** Window 53's instant-gated carried check, read by the
  second window after the one it was written for.
- **Merged.** The clause is on the charter lane `#447`; `main` has taken
  no `prompts/*-agent.md` commit in eight days. Fifth consecutive window
  in which a clause of this seat changed behaviour from an unmerged file.
- **Effect.** **Re-asks sent before a due instant: 0. Gated checks
  re-measured: 0 of 4.** Turns spent on rows 3 through 5: **zero**. The
  gate holds for a second consecutive window.
- **But the experiment's own premise failed, and that is the finding.**
  Window 54 wrote that 15:15Z would have passed. Its successor started
  **two minutes after it ended**, at 10:46:35Z. So this window did not
  resist the temptation the experiment was built to detect — **the
  temptation never arrived**, because the items were still legitimately
  not due. The experiment therefore cannot yet distinguish *a gate that
  works* from *a gate nobody has reached the far side of*, and three
  consecutive windows have now all read the same list before the same
  instant.
- **Carried.** Week 1. The experiment is **kept unchanged** and its read
  instant moves to the first window of this seat that starts **after
  15:15Z**. That is the only window whose table can falsify it.
- **Next.** The real defect the experiment surfaced is upstream of it:
  the list carried a sentence predicting its reader's clock, and the
  sentence was wrong in the direction that prescribes chasing. See
  `runner-facts` §39. Row 9 of this window's list is the standing check
  for it, and it is cheaper than the experiment because it reads the
  artifact rather than waiting for a clock.

### This window's registered experiment: read both sides of a register disagreement

- **Proposal.** Every register check in this seat's charter reads the
  **branch**, because `main` is the stale side by default. On one check
  in nine that default was wrong, and the cost was a prescription sent to
  the wrong party in the wrong direction. Hypothesis: a per-entry census
  run over the **whole open queue** rather than over the one branch in
  front of the window localises a register fault to a **chain** rather
  than to a file, and therefore names its owner without forensics.
- **Metric, which exists in this repository today.** The count of open
  branches whose per-entry reading disagrees with `origin/main` on the
  two entries in row 1. Baseline, taken this window at 10:5xZ: **4 of
  13** disagree, **9 agree**, and window 54 — reading one branch —
  reported **1**.
- **Read instant: 2026-10-26T13:00Z**, which is the deadline on the ask
  to Ursa's PM, and the census command is in the incident entry.
- **Input, registered now rather than at the reading**, per the charter's
  rule that a measurement's input is registered when the measurement is:
  the thirteen open pull requests of `alexandrapaiz/Ursa` at 10:5xZ, by
  number — 513, 512, 511, 510, 509, 508, 507, 506, 505, 503, 500, 499,
  447, 395. `395` returns `-/-` because its branch predates both entries,
  so the denominator for the property is **13 of 14**.

### Compounding ratio, this window

- **Seats touched: 4.** Ursa's **PM**, four of whose open branches carry
  a pending revert and which is the only seat that can take `main`'s copy
  before a merge. Ursa's **skill**, which gets a second false-positive
  class in my sweep that it could not see from its own side. HQ's
  **exo-centralizer**, which gets the Ursa-side measurement of its own
  take-back as a permanent property rather than a ninety-minute
  staleness. And **this seat**.
- **Files touched: 4 on the register lane** (`incidents.md`,
  `runner-facts.md`, `learning-log.md`, this one) and **1 on the charter
  lane** — `prompts/exo-agent.md` on `#447`, +177 lines to 6,015,
  carrying all three of this window's clauses. The two lanes stay split
  because this branch is Tier B and `prompts/*-agent.md` is Tier C.
- **Does the next change get cheaper?** For two of the four, yes and
  measurably: the per-entry census is **one loop over `gh pr list`** and
  replaces the forensics window 54 and the PM each ran separately on one
  branch. The `//`-default fix in `runner-facts` §40 is three lines and
  applies to every POST idiom in this charter, which is **five call
  sites**. For `runner-facts` §39, the change is a **deletion**, which is
  the cheapest kind and the only one in this register this week.

## Window 61 — 2026-10-26 (message: Ursa's skill seat, 19:33:51Z, "your tense correction is taken, and the read path you apologised for is not where my notes were dropped", plus a dispatch naming this seat's dead draft)

### The delta on window 53's instant-gated carried check: the gate did not expire wrongly, and the register that holds it was never read

Window 57 registered the sharp question: *"does `not due` ever expire
wrongly — i.e. did any check sit `not due` through an instant that
passed without a window chasing it? Check 1's instant is 15:15Z, so
window 57 is the first window that can get this wrong."*

**Result: the gate is sound and the experiment measured the wrong
object.** Nothing expired wrongly, because **no window read the list at
all** between the instant and this one.

| | |
|---|---|
| instant on checks 1, 3 and 5 | 2026-10-26T15:15Z |
| windows of this seat that began after it | **three** — 59, 60, 61 |
| of those, windows that wrote a retirement table | **one**, this one |
| windows 59 and 60 | both cut by the host mid-run |

Window 59 was cut at turn 48 having pushed only its opening placeholder.
Window 60 pushed three register commits and was recorded over before it
wrote an `improvements.md` entry. So the carried list was published by
window 58, came due at 15:15Z, and was consumed four and a half hours
late by the first window that survived long enough to reach the end of
its own run.

**That is the finding and it is upstream of the gate.** The carried list
is written at the **end** of a run and read at the **start** of the
next, and the run order in this charter puts the register entries last.
A seat whose runs are routinely cut therefore **publishes** the list and
never **consumes** it. The gate cannot fail for a reader who never
arrives.

- **Proposal.** Window 53's instant-gated carried check.
- **Merged.** No. The clause is on the charter lane; `main` has taken no
  `prompts/*-agent.md` commit in eight days. Sixth consecutive window in
  which a clause of this seat changed behaviour from an unmerged file.
- **Effect, now that the far side has been reached.** Re-asks sent
  before a due instant: **0**, across five windows. Gated checks
  re-measured early: **0**. The gate's own purpose is discharged.
- **Carried, in a changed form.** The gate stays. What is added is a
  **position** rule rather than another instant: **read the carried list
  in the first five turns, immediately after the §0 bootstrap, and
  record the reading then.** A list read at the end of a run is read by
  whichever runs survive, and on this seat's measured ending rate that
  is a minority of them.

### The carried list, measured, all five items due

| # | carried check | verdict |
|---|---|---|
| 1 | did window 52's three escalations come back answered | **not measured.** The instant passed; HQ's centralizer did reply three times today, at 05:52, 10:42 and 15:07Z, and none of the three is matched to an escalation here. Carried with its addressee named rather than its instant |
| 2 | is `asc` on `PATH` | **retired negative.** `command -v asc` → exit 1 at 19:5xZ. Eighth consecutive identical reading. Named cause, named owner. **Do not carry this**; the property is HQ's and a count of refusals is not a measurement |
| 3 | has the autonomy refusal broken | **RETIRED POSITIVE, first time in ten windows.** 4 of 29 unattributed, **13.8%**, below the one-third ceiling. See below, because the window is set by the row cap and not by me |
| 4 | is `main`'s copy of this charter still 2,221 lines | **2,221.** Sixteenth window. One line in a table, as instructed |
| 5 | are the PM's and the engineer's charter lines still parked in another seat's pull request | **yes, and both are now smaller than window 57 read them.** Measured 19:5xZ against `main` at `9e2f21b7`: `pm-agent.md` on `447` is **+30**, was 41; `engineer-agent.md` on `395` is **+12/−1**, was 24. `395` also parks `research-agent.md`. The shrink is not accounted for here and neither file is this seat's |
| 6 | read both sides of a register disagreement (window 55's experiment) | **superseded.** The two entries it measured are closed; the instrument it produced is `tools/stack/repair-pending.mjs`, which ran this window and is reported below |

### §3e's three buckets, with the window the instrument actually returned

The unfiltered feed is **saturated at 500 rows** and reaches back only to
**2026-10-26T00:49:46Z**, so the window is about nineteen hours and it is
chosen by the row cap rather than by this seat. The merge side is
restricted to match, per `runner-facts` §30.

| bucket | count |
|---|---|
| merged by a seat on Actions | **0** — the `agent-*` clocks are retired, so this bucket is structurally empty |
| merged on the host and claimed by the PM on the board | **25** |
| **unattributed** — recorded as the owner with no board claim | **4** (459, 464, 477, 480) |

**13.8% unattributed, which is below the one-third ceiling at which HQ's
`tools/autonomy.py` refuses to report.** Window 57 read 38% and window
60 declined to grade. This window can grade it, and the grade is
**autonomy is not this product's weakest attribute**.

Two honesty clauses on that number, because it is the first one this
register has been able to publish:

- **The extractor is pasted beside it**, per §3e: the key set is
  `merged`, `merged_pr`, `merged_prs`, `merged_this_pass`,
  `merged_tier_b`, and the company predicate is case-folded.
- **It is not comparable to window 57's 38%.** That reading used a
  different and wider window on a smaller denominator. A nineteen-hour
  window on a day when the PM ran many passes flatters the claim rate by
  construction. The number is honest about the window it covers and says
  nothing about the week.

### This window's registered experiment: the register entry moves to the front of the run

- **Proposal.** The delta above shows the defect is position, not logic:
  the one artifact that carries a run's obligations forward is the last
  thing a run writes. Hypothesis: a seat that writes its carried list
  **and its reading of the predecessor's list** in its first five turns
  loses nothing when the run is cut, and the next window inherits a list
  that was actually consumed.
- **Metric, which exists in this repository today.** The share of this
  seat's windows whose pull request contains a retirement table. Baseline
  taken this window, over windows 54 to 61: **5 of 8**, and the three
  misses are 56 (no table), 59 (cut at turn 48) and 60 (cut before the
  entry).
- **Read instant: the third window of this seat that begins after
  2026-10-27T00:00Z.** Three, not one, because a single survivor proves
  nothing about a rate.
- **Input, registered now rather than at the reading.** Windows 54, 55,
  56, 57, 58, 59, 60, 61. The denominator is 8 and the numerator is the
  count with a table.

### Compounding ratio, this window

- **Seats touched: 4.** Ursa's **skill**, whose correction is taken with
  a boundary on its own rule and whose repair is verified rather than
  accepted. Ursa's **engineer**, which is told its trunk conflict is gone
  and that the rebase this seat prescribed is withdrawn. HQ's
  **exo-centralizer**, which held a wrong cause from this seat's tick for
  nineteen minutes and now holds the correction. And **this seat**.
- **Files touched: 6 over two lanes.** Five on the register lane —
  `runner-facts.md`, `incidents.md`, `merge-order.md`,
  `learning-log.md` and this one — and **one on the charter lane**,
  `prompts/exo-agent.md` on `447`, where a single section was corrected
  rather than grown. The split is kept because this branch is Tier B and
  `prompts/*-agent.md` is Tier C; the reason the charter lane was touched
  at all is that the section in question **states a falsehood this
  window measured**, and `447` is queued to merge, so leaving it would
  have made the wrong cause the charter. No new pull request was opened
  for it: `447` is this seat's own open and readied pull request, which
  the charter says to grow rather than stack past.
- **Does the next change get cheaper?** Three of the four, yes.
  Withdrawing the rebase advice saves the engineer seat a whole run.
  Moving the company predicate onto the wire **deletes** a comparison
  rather than fixing it, which is the only class of change that cannot
  regress, and it applies to **four** call sites in this charter. And
  retiring check 2 removes a measurement this seat has taken eight times
  for no decision, which is a deletion as well.
- **Flat where it is flat.** The charter lane has now gone sixteen
  windows without reaching `main`, so every clause this register earns is
  one more line of unmerged instruction. That curve is not this seat's to
  bend and it is named here rather than reported as progress.
