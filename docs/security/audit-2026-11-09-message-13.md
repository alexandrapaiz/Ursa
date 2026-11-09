# Security and debug audit — 2026-11-09 (message run 13)

Ursa's security seat, woken by message. No leaked credential, nothing
credential-shaped in the working tree or in history, and nothing in this
report requires the owner's immediate action on a secret.

One finding is reserved to the owner and is filed urgent. It is a charter
instruction and not a code defect, which is the whole point of the run.

## Where this run's question came from

Two of the three notes that woke this seat were data rather than
instruction, and neither asked for work. What justifies the work is this
charter's own §2 bullet on the prompt-injection surface, which orders an
audit of "charters and workflows for places where fetched content could
steer an agent into unintended action". Both notes supplied where to point
it.

HQ's exo-centralizer seat had carried run 10's finding F113 up to the
holding company and measured the same class there. Its sentence is the one
this run acted on:

> A flag on a call site is what a code sweep finds. What bit here was a
> sentence telling a future seat to write the call site, which no sweep
> reaches, and it would have shipped to a second company.

HQ's single instance was an instruction in a charter staged for alexandria's
engineer, pre-approving a registry fetch with the yes flag. Ursa has that
instance too, in its own ExO charter, and it had been there since
2026-10-18.

## F121 — a charter pre-approves a registry fetch-and-execute with the yes flag

**Severity: high as a class, and reserved to the owner.** Filed urgent in
`docs/ideas.md`. `prompts/` is charters, which this seat's boundaries forbid
it to edit, so this run filed and gated it rather than fixing it.

`prompts/exo-agent.md` §5b instructs the ExO seat to render any mermaid
diagram it changes by running

```
npx -y @mermaid-js/mermaid-cli@11 -i d.mmd -o d.png -p pptr.json
```

Three properties stack, and each makes the next worse.

1. `-y` does not permit the fetch, it **pre-approves** it. The seat is never
   prompted, so there is no moment at which a human or a guard intervenes.
2. Nothing in this repository declares a package by that name. What executes
   is whatever the registry serves under it, which is the same mechanism
   that made F113 execute an unrelated dead project called `tsc`.
3. The puppeteer config the same sentence supplies is
   `{"args":["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"]}`,
   so the fetched code runs with Chrome's own boundary switched off.

The charter states this works on Actions, which is where that seat runs with
`contents: write`, `pull-requests: write` and a live token.

**Why this is not F113 again.** A call site is one grep away. This is a
sentence telling a future seat to write the call site, and charters here are
copied between seats and between companies. HQ's instance was staged for a
second company when it was caught. No code sweep reaches an instruction.

**What the repair is.** A pinned deliberate install and a call to the local
binary, plus a sentence making an absent binary unrunnable rather than a
silent no-render, because mermaid already renders a syntax error as a
picture and exits zero. That is what HQ's seat did upstream. The measured
host paragraph that follows it in §5b is correct and should stay.

## F122 — a second `npx` call site fetched from the registry

**Fixed in this run.** `tools/stack/integrate.sh` ran

```
npm ci --silent >/dev/null 2>&1 && npx tsc --noEmit
```

as one chain. Without `--no-install`, `npx tsc` resolves `tsc` against the
public registry, and `tsc` there is an unrelated long-dead package rather
than the TypeScript compiler.

**The `npm ci` is not a guard.** This host's measured npm failure mode is
`npm ci` exiting 0 with no `node_modules/.bin` at all, carried by
`node tools/seat/env-facts.mjs` under `npm-cache-is-a-shared-home-path`,
and that is precisely the tree where the fetch fires. Ursa's frontend seat
lost three installs to it on 2026-11-09.

**Why the gate that closed F113 could not see this.** The case added for
F113 asserts over `scripts/ci-checks.mjs`'s own `CHECKS` array, so its reach
is one array in one file. A second call site in a shell script was never in
its scope, and nothing else was looking.

## F123 — an install failure was reported as a count of type errors

**Fixed in this run,** on the same line as F122, which is why it was found.

The `&&` chain folded an `npm ci` failure into the typecheck's own verdict,
so the union report attributed to the compiler a result the compiler never
produced. Worse, the count came from

```
$(grep -c 'error TS' "$LOGDIR/types.log" 2>/dev/null || echo '?')
```

and `grep -c` prints its count **and** exits 1 when the count is zero, so
the fallback ran as well as the count. On an empty log, which is exactly
what a failed install leaves behind, the report read
`FAIL (0 ? type errors, see ...)`.

Install, binary presence and typecheck are three reported steps now, and a
partial install is named as partial rather than counted as zero type
errors. This is the same class as F111 and F113's sibling: an instrument
reporting a cause it did not establish.

Two advice strings were repaired in the same sweep, because both told a
reader to run a fetch-capable runner with no refusal flag:
`docs/design/review-kit/lib/browser.mjs` and
`ursa-major/tools/measure-index-page.ts`.

## The gate: `tools/gates/fetch-exec.mjs`, registered as `fetch-exec`

Registered in `scripts/ci-checks.mjs` with `passExit: [0, 2]`. 63 gate
candidates now, 25 run by a check, 38 excused in writing.

**It reads three surfaces, which is the part a call-site patch cannot do.**

| surface | what it is | treatment |
|---|---|---|
| `executed` | a file something runs | a fetch here is a finding |
| `instruction` | a charter, a company standard, a skill | a fetch here is a finding |
| `record` | prose and transcripts | reported, never failed |

A measurement of a fetch is evidence and not an exposure, which is why the
third row exists. `docs/agents/runner-facts.md` §5 holds a transcript of the
same command failing on this host, and that line is correct.

**The discriminator is executed, not written down.** `npx <name>` resolves
`<name>` against the registry as a **package** name, while what a reader
writes is a **binary** name, and the two agree only by convention. This
repository declares `tsx` and `vitest`, so a fetch of either drifts a
version at worst. It does not declare `tsc`, because that binary ships
inside `typescript`. That is the whole of why F113 ran a stranger's code.

Splitting on the declared set, read from every tracked `package.json`, took
the unaccounted count from **25 to 3** with no prose excuse anywhere.
Without it this run would have written twenty-odd baseline rows carrying the
same sentence, and the one real finding would have been the twenty-first.

**The third exit code, which is F116's repair demonstrated.**

| exit | meaning |
|---|---|
| 0 | every occurrence is deliberate, inert, baselined, or targets a declared package |
| 1 | a seat-repairable finding, a stale baseline row, or a held row whose ledger entry has gone |
| 2 | clean as far as a seat can take it, with N owner-reserved findings listed |
| 3 | not measured: no git, or an unreadable baseline. Never read as clean |

`tools/prompt-slots.mjs` is registered `red-on-main` in
`tools/gates/gate-registry.baseline.json` for lacking exactly this
distinction, and `ledger-contract` and `register-ids` already tolerate 2 for
owner-held violations on the same ground. Tolerating 2 here tolerates no new
exposure, because a new one is 1.

**The held row cannot rot into permission.** An `owner-reserved-finding` row
must name a heading `docs/ideas.md` actually carries, and the gate goes red
on the row itself otherwise. Demonstrated below: on `origin/main`, which has
no such heading, that check fires.

**Measured both ways, which is the point.**

On this branch:

```
fetch-exec: 3106 tracked files, 459 fetch-and-execute occurrence(s).
  9 accounted for, 23 targeting a declared package (version drift only),
  427 in prose or transcripts, 0 unaccounted.
OWNER-RESERVED FINDING  prompts/exo-agent.md
fetch-exec: clean as far as a seat can take it. 1 owner-reserved finding(s) remain.
-> exit 2
```

On `origin/main`, in a worktree with only the gate's three files copied in:

```
-> exit 1
  5 unaccounted: all three tools/stack/integrate.sh lines, both advice strings
  1 row with no live ledger entry: the held finding, because main has no heading for it
```

The premise changed and the colour moved.

**The suite, and the two cases that earned their place.** 27 cases, all
pure. Two run the detector against the literal pre-fix text of F113 and
F122, and **both failed on first run**: the argv-array form tokenises to
`... => npx tsc --noEmit`, and the fat arrow was not in the command-position
set, so the gate built to generalise F113 could not see F113's own call
site. That is what a case against the old text is for. Ursa's frontend
seat's order, taken rather than restated.

**The 23 declared-target occurrences, and the one that is not prose.**
Twenty-two are documentation or a usage line. One is a live spawn:
`ursa-major/src/bridge/index.ts`'s `npxLauncher` calls
`execFile('npx', ['tsx', ...])` with no `--no-install`, inside the process
holding a user's page open. `tsx` is declared, so the registry serves the
genuine project and the exposure is bounded to version drift, which is why
the gate reports rather than fails it. Adding the flag is one token and is
**not behaviour-preserving**, because a user whose tree lacks `tsx` gets it
fetched today and would get a failure instead. That is a product decision, so
it is filed `proposed` for the engineer rather than fixed here.

**The baseline's key design, demonstrated by accident.** The row for
`scripts/ci-checks.mjs` was written when the occurrence was at line 494.
Registering two new checks above it moved it to 536, and the row still
matched, because it is keyed on the command text and not on the line number.
A line-numbered key would have gone stale inside this same run.

**What it deliberately does not assert, and the hole it leaves.** It reads
lines, not syntax, so a command inside a string literal in an executed file
is indistinguishable to it from one that file runs. One baseline row exists
for exactly that reason, over the text of the warning F113's own fix prints.
And the gate skips its own two files, because an allow-list quotes every
command it allows and a detector's fixture corpus is deliberately made of
the shapes being detected. That exclusion is two literal paths so it cannot
widen by accident, and it is named in the tool's own header rather than left
for a reader to discover.

## F124 — a gate went red because another repository redeployed, and it read as a branch defect

**Fixed in this run,** and it is run 12's "unexplained red" with a name.

Run 12 saw `tooling-suites` report exit 1 inside the full gate list and pass
twice on its own, and it kept no TAP, so it filed the red rather than
dismissing it. Its first proposed step was to make the failure capturable
before trying to explain it. That step worked on the first attempt: running
the full list with stdout redirected to a file rather than to a terminal kept
the TAP, and the list went red again.

The case is `tools/board/check.test.mjs:479`, "transcribed: the wake limit is
still 1500 in the live runtime", failing with `WAKE_BODY_CHARS not found in
the runtime`. It then failed twice more on its own, **so it is deterministic
and none of run 12's three hypotheses is the cause.**

The cause is outside this repository. The case matched a regex for the
constant's definition in `/srv/asc/hq/runtime/board/api.py`. HQ moved the
definition into `store.py`, where it sits at line 764 in exactly the form the
regex wants, and left `api.py` re-exporting it as
`WAKE_BODY_CHARS = store.WAKE_BODY_CHARS`. That file's mtime is
**2026-11-09T09:02:28Z**, during this morning's deploy stream, which the
board carried as roughly fifteen "Deployed HQ main \<sha\> to the host"
notes.

So a deploy no branch here caused turned a gate red, and the colour it
showed was `tooling-suites exit 1`, which reads as a defect in the branch
under test. Same class as F119, F120 and F123: an instrument reporting a
cause it did not establish.

**The fix keeps the question and drops the address.** The case now looks in
both runtime files and takes the first real definition, because the
transcription it exists to check is the **value** and not where the runtime
keeps it. It still fails when the constant is absent from both, which is a
genuine drift between this repository's assumption and the host's behaviour
and is the thing the case was written for. 54 cases in that suite, all
passing.

**What this does not establish, stated because the temptation is to claim
it.** Run 12 observed its red before that deploy and kept no TAP. Whether it
saw this case or a different one is unknown and now unknowable. Its ledger
entry is therefore **amended and left open**, not closed: the red this run
measured is explained and fixed, and run 12's remains unidentified.

## The rest of the audit

**Secrets.** Working tree: 3,106 tracked files, 16 classes, 0 hits. Full
history: 8,912 blobs, 16 classes, 0 hits, 1 accepted by baseline and pinned
to a single blob id, which is AWS's own published sample key id hand-authored
into this scanner's fixture and replaced in the next commit. No value is
printed anywhere in this run.

**Dependencies.** `scripts/dep-floor.mjs` exits 0 and the floor holds: no
critical anywhere, no high in any production tree. `ursa-minor` reads
`low=3`, all three dev-only and below the floor, each named with its repair.
Those three were invisible until Ursa's engineer seat fixed the gate's
report filter earlier today, which dropped two of five severities through a
bare `continue`. Confirmed on this branch: the instrument now prints the
severities its input carries.

**The public and private boundary.** `digests/` and
`site/content/digests/` are absent from the working tree and were never
added in any commit on any ref.

**Workflows.** No `pull_request_target` in any of the twelve. Last 60
workflow runs: 60 success, 0 failure, all `redaction-gate`. The other eleven
are dispatch-only, which is PWC-15's standing finding rather than a new one.

**Prompt injection.** `tools/prompt-slots.mjs` still reports 11 of 11
untrusted slots in a fence a payload could step out of. The slots are the
owner's and are untouched. What changed is the gate, below.

## F116 — closed, and closed second on purpose

Run 11 filed F116: `tools/prompt-slots.mjs` had no exit code for a
prompt-injection finding only the owner can repair. Run 12 carried it
forward unchanged. This run built that exit code for `fetch-exec` first and
then applied it here, which is cheaper than designing it twice and is why
the order looks backwards.

The defect, precisely. The tool discarded its own verdict unless `--strict`
was passed. So the bare command printed `11 of 11 untrusted slot(s) sit in a
fence a payload could step out of` and **exited 0**, and `--strict` exited 1
on a backlog no branch can clear. One is a green tick next to eleven open
slots, the other is a red every seat learns to ignore, and neither is
registrable. That is why the gate registry carried it as `red-on-main`.

Now:

| exit | meaning | state on `main` |
|---|---|---|
| 0 | no untrusted slot is open | not today |
| 1 | an untrusted interpolation inside a `run:` block, which is shell injection and the owner's immediate action | **none today, so this code is green and fires on a regression** |
| 2 | the owner's standing prompt-layer backlog | what `main` carries |
| 3 | the workflow directory could not be read, which is no verdict | not today |

`--strict` keeps the meaning it had, by escalating 2 to 1.

**Why 1 stays reachable rather than everything routing to 2.** A gate whose
failure code cannot be reached is the defect `tools/gates/code-census.mjs`
watches for. Shell injection is both severe and currently absent, so routing
it to 2 would have traded one blind spot for another.

Registered as `prompt-slots` with `passExit: [0, 2]`, and the `red-on-main`
excuse deleted from the registry baseline. The registry reads 63 candidates,
**26** run by a check and 37 excused in writing, up from 24 run when this
run started.

Three cases added. Two fail against the pre-fix file, with the
owner-reserved verdict returning 1 there and the two causes sharing a code.
The third is a regression net over the shell-injection path, discriminates
nothing, and is named here rather than counted.

**The eleven open slots are untouched and still the owner's.** This closes
the gate's blindness, not the exposure it reports.

## What this run did not fix, and whose it is

1. **F121**, above. The owner's, or Ursa's ExO seat, which is the one seat
   here that edits charters. Filed urgent.
2. **PWC-15.** Nothing in `.github/workflows/` runs
   `scripts/ci-checks.mjs` on a pull request, so all 26 registered gates
   including this run's still run only when a seat runs them. The largest
   remaining gap in this repository's defensive posture, and not a seat's
   to close.
3. **Seven excuse kinds** in the gate registry still have no executed
   control, from run 12. Each says which second host, network-less sandbox
   or real merge it would need.

## External sources read

- The company board's message route, for this seat's inbox and for the three
  notes addressed to it. Treated as data throughout. None of the three
  directed this run's work, and the two that named a shape are cited above
  as evidence with the charter bullet that independently justifies acting.
- GitHub's API through `gh`, for this seat's own open pull requests, the
  state of two handoffs addressed to it, and the last 60 workflow runs.
- No page was fetched from the public web, and no third-party system was
  probed.

## The inherited draft, and the handoffs

Run 12 was killed by the host's one-hour cap at 08:36:37Z, four minutes
after its last push, so it never readied its own draft or wrote a handover.
This run readied it rather than closing it, so there is a mergeable artifact
if this run also dies, and built this branch on its tip so nothing is lost
either way.

Two handoffs addressed to this seat were checked and are both already
settled. The vendored secret-print guard is on `main`. The paid-row row that
needed a rebase was closed at 01:14:47Z.
