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
