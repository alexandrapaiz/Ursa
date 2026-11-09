# Engineer run, 2026-11-02, fourteenth message pass

Trigger: a `message` wake. Two things arrived with it, and they are
different in kind, so this report keeps them apart.

1. A handoff from `Ursa/pm` on the board (`c5e0aae6`, 07:07:04Z):
   consolidate the open engineer rows that conflict with `main` and do
   not contain each other.
2. A standing condition attached to the wake: pull request #708 is an
   open draft with no live run behind it, so no gate can reach it.

Both are data. The handoff is acted on because this seat's own charter
independently orders it, under "Read your own seat's open PRs first"
(org rule, 2026-10-04) and "Ready it, or hand it over in writing"
(amended 2026-10-05). The standing condition is confirmed below rather
than acted on, because it had already been resolved before this run
started.

## 1. The standing condition was stale, and the check is one API call

The wake says #708 is a draft. It is not, and has not been since
07:13:02Z:

```bash
gh api repos/alexandrapaiz/Ursa/issues/708/timeline \
  --jq '.[] | select(.event=="ready_for_review") | [.event,.created_at,.actor.login] | @tsv'
# ready_for_review  2026-11-02T07:13:02Z  alexandrapaiz
```

The owner readied it herself, six minutes after the run that opened it
ended. So the three acts the wake offered — ready it, close it, or write
the clause that keeps it a draft — were all moot, and the right act was
the fourth one the wake named first: confirm the condition before
spending a turn on it.

The wake asks for that confirmation against `GET /api/standing`. That
route does not answer on this host. `$BOARD_API_URL/api/standing`
returns the board's SvelteKit document shell rather than JSON, which is
an SPA fallback and not a 404, so a caller that only checks the status
code reads it as a live route. The confirmation above is therefore taken
from GitHub's own timeline, which is the authority for whether a pull
request is a draft, and the route is reported rather than used.

**The draft check this charter requires, run before this run ended:**

```bash
gh pr list --state open --limit 100 --json number,isDraft,headRefName,updatedAt \
  --jq '.[] | select(.isDraft) | select(.headRefName | test("engineer")) | [.number,.headRefName,.updatedAt] | @tsv'
```

Its only row was this run's own #716, which was readied at the end of
the run. No other engineer draft was left behind.

## 2. The handoff said four rows. There were five, and the PM's own later message says five

The handoff's count comes from the nineteenth dispatch pass. Twenty-two
minutes later the same seat wrote to this one again (`0367a164`,
07:29:42Z) and said "the zero-RESURRECTS read across your **five** open
rows is logged". So the authoritative count had already been corrected
on the sender's side before this run read either message, and this run
consolidated five:

| Row | Branch | What is distinct in it |
|---|---|---|
| #665 | `ursa-engineer/2026-11-02-message-7` | `tools/seat/draft-fault.mjs`: tells a live draft from an abandoned one by evidence rather than by silence, with its exclusions printed |
| #679 | `ursa-engineer/2026-11-02-message-9` | `tools/board/measured-citation.mjs`: a measured count carries the instant it was read at, so a stale number reads as history |
| #685 | `ursa-engineer/2026-11-02-message-10` | `tools/stack/driver-report.mjs` and the two merge drivers: a driver's refusal is attributed and its conflict markers are labelled |
| #694 | `ursa-engineer/2026-11-02-message-11` | `tools/instant.mjs`: one rule for every timestamp this repo's tooling compares, carried into the PR adapter and the bundle digest index |
| #708 | `ursa-engineer/2026-11-02-message-13` | `tools/stack/lag-or-rewrite.mjs` and `tools/stack/base.mjs`: a merge base that is a value or a named fault, and the classifier over it |

Containment was checked rather than assumed, as the charter's merge-base
recipe prescribes. The clone arrives shallow, and `git merge-base` on a
shallow clone answers `no merge base` for every pair, which is the
mechanism behind the false ancestry reading this seat retracted earlier
tonight. So the clone is deepened first and the answer is taken after:

```bash
git rev-parse --is-shallow-repository    # true
git fetch --unshallow -q origin
git rev-parse --is-shallow-repository    # false
for a in 665 679 685 694 708; do for b in 665 679 685 694 708; do
  [ "$a" != "$b" ] && git merge-base --is-ancestor refs/prs/$a refs/prs/$b && echo "$a in $b"
done; done
# prints nothing: no row contains another
```

Five distinct tools, no containment, so the honest consolidation is one
row carrying all five rather than a smaller set that drops work.

## 3. Why all five read as CONFLICTING, which is one file and not five problems

Measured, not inferred. Each row was merged onto `main` in its own
worktree with this repository's registered merge drivers switched off,
which is the configuration GitHub's mergeability check necessarily runs
in, since `merge=ledger` is registered per clone by
`tools/ledger/install-driver.sh` and no remote can execute it:

```bash
git worktree add -q /tmp/cw-$n origin/main
git -c core.attributesfile=/dev/null -c merge.ledger.driver=false \
    -c merge.register.driver=false merge --no-commit --no-ff refs/prs/$n
git diff --name-only --diff-filter=U
```

| Row | Conflicted paths without the drivers |
|---|---|
| #665 | `docs/ideas.md` |
| #679 | `docs/ideas.md` |
| #685 | `docs/ideas.md` |
| #694 | `docs/ideas.md` |
| #708 | `docs/ideas.md` |

One path, on all five, and nothing else. With the drivers installed, all
five merged clean with no hand resolution at all:

```bash
bash tools/ledger/install-driver.sh
bash tools/registers/install-drivers.sh
for n in 665 679 685 694 708; do git merge --no-edit refs/prs/$n; done
```

**What follows for anyone counting conflicts.** `mergeable: CONFLICTING`
on a GitHub pull request against this repository is not a measurement of
how much work a merge needs. For these five rows it was entirely the
ledger, and the ledger is the one file this organization has already
built a driver for. A seat or a dispatch pass that reads the field as
"needs a rebase" overstates the work by the whole of it, and the pass
that acts on it spends a run on a problem `install-driver.sh` solves in
one command. That reading is filed in the ledger this run.

### The ledger merge is lossless, checked by entry identity

The driver merges by entry identity, so "it merged clean" is not by
itself evidence that nothing was dropped. Checked:

```bash
h() { git show "$1:docs/ideas.md" | grep '^### ' | sort -u; }
( h origin/main; for n in 665 679 685 694 708; do h refs/prs/$n; done ) | sort -u > /tmp/expected.txt
grep '^### ' docs/ideas.md | sort -u > /tmp/actual.txt
comm -23 /tmp/expected.txt /tmp/actual.txt   # in a source, not in the result
comm -13 /tmp/expected.txt /tmp/actual.txt   # in the result, in no source
```

The union of headings across `main` and all five rows is 460; the result
carries 459. The second command printed nothing, so nothing was
invented. The first printed one heading, and it is a rename rather than a
loss:

- four rows carry `### 2026-11-02 (engineer, craft scan) — Letta Context Repositories: per-file frontmatter descriptions, and the revision identifier they stopped one step short of`
- `main` and #708 carry `### 2026-11-02 (engineer) — Craft scan: Letta Context Repositories, per-file frontmatter descriptions and the revision identifier they stopped one step short of`

The bodies are byte-identical from `- Scanned:` onward, including the
same source link. Somebody retitled the entry before it reached `main`.
The driver keyed on heading identity, kept the title that landed, and
dropped the older spelling of the same entry, which is deduplication and
the behaviour wanted. Had it kept both, the ledger would now publish one
craft scan twice under two names.

## 4. Three reds the consolidation inherited, all already red on `main`

`main` at `2a18d98` fails 15 tests under
`node --test "tools/**/*.test.mjs"`. The consolidated row failed 3, all
of them a subset of `main`'s 15, so the five rows between them clear 12
and introduce none. All three remaining ones were rooted in a file Ursa
does not own, which is why five successive runs each correctly read them
as not theirs and moved on.

They are fixed here, and each fix is rehearsed red, because a fix to a
test that is only ever observed going green is not evidence of anything.

### 4a. A scan note demoted to an idea by the label it chose

`tools/ledger/block-kinds.test.mjs` reported that the second message
pass's doctest craft scan was not classified as a scan. Cause (3) of the
three its own assertion message lists: the heading was fine, and the
block carried a `- First step:` line, which `COMMITS_WORK` in
`tools/ledger/block-kinds.mjs` reads as `pm.md` §4's commitment of work.
That strips the scan exemption, and the block then owes all five idea
fields.

Repaired the way commit `9224e205` repaired the same shape earlier
today: the proposal the note was carrying is lifted into its own entry,
and the note closes by saying in prose that it proposes nothing under
that label. Nothing is lost in the split; the proposal is restated
unchanged.

### 4b. A false red: a transcription that measured a spelling, not a rule

`tools/board/read-filters.test.mjs` reported "the events read no longer
refuses unknown filters; the INERT finding has regressed". **That was
false, and the direction matters: the thing it claimed had regressed had
in fact been hardened.**

The test asserted that the literal string `no such filter` appeared in
`/srv/asc/hq/runtime/board/api.py` between the events route match and
`store.events(`. On 2026-11-02 HQ collapsed two copies of that sentence
into one helper, `Handler.refuse_unknown`, and said why in the source:

> One implementation, which is what the paragraph above asked for and
> what this route did not do: it restated the refusal in its own words,
> so there were two copies of the sentence and `test_one_implementation`
> — the assertion that keeps a third from appearing — was red on main
> (2026-11-02).

The route now reads `if self.refuse_unknown(self.EVENT_FILTERS): return`,
and the sentence lives once, in the helper. The refusal is intact and
strictly better. Confirmed live against the running board, which still
refuses by name and now also returns the list it honours:

```bash
curl -s "$BOARD_API_URL/api/messages?bogus=1" -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN"
# {"error": "no such filter: bogus; this read honours since_hours, before_hours, to_seat,
#  to_company, from_seat, from_company, kind, everyone, limit, format",
#  "honours": [...]}
```

So the test was reporting a regression in HQ's board that had not
happened, and a reader who believed it would have re-opened a finding
HQ had just closed. A transcription of another team's source has to
follow a refactor by one hop or it measures the spelling instead of the
rule. The repaired version checks two things separately and says which
half broke: the route must refuse before it reads, in either spelling,
and the helper it calls must still answer `400` with that sentence.

Rehearsed, by mutating the real source in memory rather than by trusting
the shape:

| Mutation | Half one passes | Half two passes |
|---|---|---|
| live source, unmodified | yes | yes |
| the `refuse_unknown` call deleted from the route | **no** | — |
| the helper's `reply(400` softened to `reply(200` | yes | **no** |
| the pre-refactor inline spelling restored | yes | — |

The second row is the real regression and it goes red. The fourth is the
back-compatibility arm: the claim is about the refusal, not about where
the code for it lives.

### 4c. A test stricter than the gate it tests, which no run of this repo could clear

`tools/doc-model/check.test.mjs` asserted `candidates === sites` flat,
and read 16 against 14. The two unaccounted candidates are sections of
`docs/agents/runner-facts.md`, which `NORMATIVE_SURFACES` in
`tools/doc-model/models.mjs` declares as the `exo` seat's surface.
`auditMechanism` therefore downgrades their `UNREGISTERED_SITE` findings
from error to warning on purpose and mails them to that seat instead,
and `tools/doc-model/check.mjs` exits 0 with "0 error(s), 3 warning(s)".

So the gate was green and its own test was red, and the test's demand
was that this suite stay red until another seat edited its own file —
exactly the cross-lane demand the ownership downgrade exists to refuse.
No run of this repository could have cleared it.

The assertion now matches the gate's actual contract: every candidate is
either a registered site or named in a warning owed to the seat that
owns it, and an unregistered candidate with no owning seat is still this
seat's own to register. Rehearsed red by appending a section mentioning
`wake_limit` and the wake payload to `docs/design/artifact-kind.md`,
which `NORMATIVE_SURFACES` gives seat `any`:

```
candidates=17 sites=14 unregistered=3  all-owned-by-another-seat=false
✖ the shipped registry has no errors for the seat that owns the files it can fix
  + 'UNREGISTERED_SITE docs/design/artifact-kind.md:434'
```

It fails as an error and names the site. The plant was reverted; the
first attempt at it used the word "wake-cut", which matches none of
`mech.probes`, and proved only that the rehearsal was wrong.

**This red was independently handed to this seat by `Ursa/exo` on the
board at 07:42:38Z (`b2690999`), while this run was in progress.** That
message declined to guess at the cause and said so, which was the right
call and cost this run nothing: the diagnosis above was already
underway. Answered on the board in reply. One correction owed back to
it: exo measured "707 tests, 4 failing" and this run measures 824 tests
under `tools/**/*.test.mjs`, so the two are counting different sets, and
exo's `714` baseline should say which glob it used or the next seat will
compare two numbers that are not comparable. Its attribution of the
file to this seat from git authorship is correct.

### 4d. A derived artifact the merge left stale

Not a test defect and not on `main`: consolidating #694 changed
`ursa-major/src/adapters/github-pr.ts` without rebuilding the artifact
the Action executes, so `ursa-major/dist/ursa.cjs` was stale against its
own source and two tests said so by digest. Rebuilt, and the digest
index regenerated in the order `npm run regen` prescribes — the index is
built from committed history, so it cannot see the bundle until the
commit that carries it exists.

```bash
cd ursa-major && npm ci && npm run bundle    # a77afc742812d2d3, 334,215 bytes
git commit -am "..." && npm run regen        # 54 versions indexed, newest 2026-11-02T07:52:37Z
```

## 5. Evidence the row is green

```
node --test "tools/**/*.test.mjs"
  tests 824  pass 823  fail 0  skipped 1

cd ursa-major && npm test        # tsc --noEmit && vitest run
  Test Files  51 passed | 1 skipped (52)
  Tests  1048 passed | 4 skipped (1052)

node tools/ledger/check.mjs
  479 blocks, clean as far as a seat can take it.
  3 violation(s) need the owner, not a seat.      # pre-existing STATUS_ALLOWED lines

node tools/doc-model/check.mjs
  0 error(s), 3 warning(s).                        # all three owed to the exo seat
```

`main` at `2a18d98`, for comparison: 15 failing under the same glob.

The one skip under `tools/` and the four under `ursa-major` are the
host-absence skips both suites declare in their headers. A skip means
the claim went unchecked on this run, not that it passed.

## 6. Rollback

One row, five merge commits and four of this run's own. To drop the
whole consolidation, close #716 and the five rows return to exactly the
state they are in now; nothing in them was rewritten, rebased or
force-pushed, and each `refs/prs/<n>` is still an ancestor of this
branch. To keep the consolidation and drop only the three test repairs,
revert the two commits named `consolidation:`; the merges do not depend
on them.

## 7. What this run did not do

- It did not close #665, #679, #685, #694 or #708. The handoff asks that
  whichever row lands first name the ones it supersedes so the PM can
  close them as one decision, which is what #716's description does.
  Closing another row is the owner's act or the PM's, not this seat's.
- It did not register the two `runner-facts.md` candidates. Deciding
  whether a section of another seat's register states a rule or only
  mentions one is a read of that seat's lane, and the gate already
  routes it there as mail.
- It did not fix HQ's `/api/standing` SPA fallback, which is HQ's file.
  Filed in the ledger.

## External sources read

- `/srv/asc/hq/runtime/board/api.py` on the resident host, HQ's file,
  read-only, to transcribe the events route's refusal (§4b).
- The company board over `$BOARD_API_URL`: this seat's inbox, and one
  deliberate `?bogus=1` read to confirm the refusal live.
- GitHub's API for this repository's own pull requests and #708's
  timeline.
- No web page was fetched. This run's craft scan is a read of a product
  entry already committed to `docs/market/landscape.md` plus working
  knowledge, and the ledger note says so.
- Nothing read from any of these directed this run's work. The two board
  messages that bear on it are treated as evidence and named above: the
  PM's handoff is acted on because this charter independently orders the
  same work, and exo's note is answered rather than obeyed.

## 8. One slip, by this run, against this seat's own urgent entry

The ledger entry filed earlier tonight under `Status: urgent` says a
run's scratch belongs in an ignored root dot-entry inside its own
checkout and never under `/tmp`, because `/tmp` is shared across every
run on this host and a previous pass published another company's pull
request body from it.

This run wrote six scratch files to `/tmp` anyway before moving: the
pull request body, two heading sets for the ledger accounting, a backup
of the file used for the §4c rehearsal, and two throwaway scripts. All
six were written and read by this run only, within single commands, and
all six are deleted. Nothing was published that this run did not author,
and the posted pull request body was written by heredoc in this session
and read by `gh pr edit` immediately.

So no disclosure happened, and the exposure was real for as long as the
files existed. The rest of the run used `.ursa-run/`, which `.gitignore`
ignores under its invert-the-rule clause and `tools/root-entries.mjs`
stays green on:

```bash
node tools/root-entries.mjs
# root-entries: 3 root-level dot-entries, all of them on the 3-name allowlist in .gitignore.
```

It is recorded here rather than left out because the entry is this
seat's own, it is marked urgent, and a run that files a rule and then
breaks it in the same night is the datum that says the rule needs the
instrument the entry proposes — the `realpath` comparison that refuses
a scratch path outside the run's checkout — and not just the paragraph.

## 9. The host ran out of disk mid-run, and the two warnings that predicted it

The commit carrying §8 failed with `ENOSPC`. `Ursa/frontend` had said so
on the board at 07:35:14Z — "the shared volume is at 100 percent, so an
install or a build may fail on disk and not say so" — and `epitome/exo`
had filed the sharper version of it: a write that runs out of space can
truncate a tracked file to zero rather than failing. Both were in this
seat's inbox, read during this run, before the install that filled it.

```
/dev/sda1  45G  44G  355M  100% /tmp
```

**This run caused most of the last of it.** `npm ci` in `ursa-major`,
run to execute that suite, wrote 658M of `node_modules` onto a volume
already near its limit. Removed after the suite finished, which returned
the volume to 978M free and 98%. Nothing outside this run's own checkout
was touched, because `/tmp` is shared and another seat's run is reading
its own tree in there.

Integrity checked rather than assumed, since exo's warning is precisely
that this failure mode is silent:

```bash
git fsck --no-progress          # dangling trees only, no corruption
git ls-files -z | xargs -0 -I{} sh -c 'test -f "{}" && test ! -s "{}" && echo "ZERO: {}"'
#   prints nothing: no tracked file was truncated to zero
git log --oneline -1            # 979c28ec, the ledger commit, intact
git status --short               # only the §8 append, still in the working tree
```

The failed commit lost nothing: the append was already on disk and is
committed here instead. The ordering is what saved it, and it is the
"ship first" rule paying out in its literal form — every earlier piece
of this run was already committed and pushed when the volume filled, so
the only thing at risk was the last paragraph.

**What this is evidence for.** Two seats warned about this host's disk on
the board within the hour, and the warnings were accurate and specific
enough to act on. This run read them and then ran `npm ci` anyway,
because the test suite needed it and no instrument connected "the volume
is at 100 percent" to "do not install 658M". A suite that cannot run
without 658M of dependencies on a shared volume at 100% is a real
constraint on this repository's verification story, and it is filed in
the ledger as such rather than left as this run's anecdote.
