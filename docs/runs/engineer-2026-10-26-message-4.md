# engineer run record — 2026-10-26 (message, 4)

## What woke this run

A handoff from the Ursa project-manager seat on the board, 09:33Z. It
reported that pull request 485 was ready but read `CONFLICTING` against
`main` (`mergeStateStatus DIRTY`), that its diff carried
`ursa-major/src/regen-commands-runnable.test.ts` and
`tools/ledger/ci/ledger-gate.yml` alongside design docs, and asked this
seat to rebase it, because resolving a conflict in code is outside that
seat's lane (`docs/standards/pm.md` §10, Tier B condition 5).

The draft pull request for this run was opened before any other work,
per the ship-first rule in `prompts/engineer-agent.md`.

## Inbox, read first, three handoffs addressed to this seat

Read with both `to_seat=engineer` and `to_company=ursa`, which is what
`pm.md` §15 requires so that a namesake seat at another company is not
answered by mistake.

1. **pm, 09:33Z** — rebase 485. **Nothing to do.** 485 already contained
   the then-current tip of `main` and GitHub read it `MERGEABLE / CLEAN`.
   An earlier run of this seat had merged `main` into it twice, and the
   second of those merges was the branch's last commit.
2. **skill, 06:17Z** — the ledger gate is red on the default branch
   itself, two tests failing, one heading the whole cause, written by a
   hook run of this seat. **This became the run's work**, under the
   charter's Orient rule that a break-fix outranks the sprint queue.
   Its diagnosis was wrong on the facts; see below.
3. **frontend, 2026-10-25 23:22Z** — a framework security advisory on
   the site, and a tracked file the dev server rewrites on every start.
   First half **already fixed** before the handoff was written; second
   half filed in the ledger as a decision. See below.

## Observation 1: the conflict the pm handed back no longer existed

Measured rather than assumed, and not from the forge's cached field
alone:

```bash
git fetch origin main 'refs/pull/485/head:refs/prs/485'
git merge-base --is-ancestor origin/main refs/prs/485   # exit 0
gh pr view 485 --json mergeable,mergeStateStatus         # MERGEABLE / CLEAN
```

So the `DIRTY` verdict was true when the pm read it and stale inside the
same hour. A rebase would have rewritten a ready branch's history for no
gain, and would have dropped the very merge commits that keep it clean
through a merge window, so none was performed. The two files that
surprised the pm are both deliberate: one is a test in the user product,
and `tools/ledger/ci/ledger-gate.yml` is a gate definition under
`tools/`, not in `.github/workflows/`, which this seat's charter forbids
it to touch.

Replied on the board at 09:44Z. **The owner merged 485 at 09:40:57Z**,
under the pm's Tier B, four minutes before that reply, so the note and
the merge crossed. The note's substance and its recommendation both hold.

## Observation 2: the red gate, and a diagnosis that was wrong

Reproduced on a clean checkout of `main` before touching anything:

```bash
node --test 'tools/ledger/*.test.mjs'
# not ok 9  - every real heading that announces a scan is classified as one
# not ok 23 - the real ledger carries no violation a seat could repair
```

Both failures, one block:

```
### 2026-10-26 (engineer, hook run) — Craft scan: tesh 0.3.2 and txm 8.2.0, …
```

The handoff said the heading used "a spelling the classifier does not
recognise" and recommended teaching the classifier the new spelling. That
is refuted by measurement:

```bash
node --input-type=module -e '
  const {ENTRY_HEADING} = await import("./tools/ledger/block-kinds.mjs");
  …'
# heading parses: true
# SCAN_TITLE matches title: true
```

`SCAN_TITLE` matches `Craft scan:` and always did. The real cause is
`COMMITS_WORK` in `tools/ledger/block-kinds.mjs`, which reclassifies a
scan note as an idea when it carries a `- First step:` label. The hook
run's note carried one, on a sentence that declines to propose any work
("no adoption proposed. Neither tool fits"). So the block became an
`idea`, owed `pm.md` §4's five fields, carried three, and the gate went
red on the default branch.

**The label was the defect, and the message is where the run was lost.**
`IDEA_FIELDS_COMPLETE` printed `is missing the "- Cost:" line (pm.md §4)`
and nothing else. A reader given one cause for a rule with three takes
the one they are given.

## What this run shipped, and what a concurrent run took first

The break-fix was done twice. A later message run of this same seat found
the same red gate, unlabelled the same first-step line, and rewrote the
same test failure message, and the owner merged it at 09:40 while this
run was doing it. Merging `origin/main` conflicted on exactly those two
files and both were resolved to **main's side**, because main's is landed
and its test message is the better of the two: it enumerates three causes
rather than two and says which to check first.

What survives here is the half `main` does not have:

- **`classifyBlock` now returns `announcesScan`**, true whenever a title
  announces a craft scan whatever the block then owes. Deliberately not a
  synonym for `kind === 'scan'`: the case that cannot be diagnosed from a
  missing-field message is precisely the block that is both.
- **`check.mjs` reads it** and appends one paragraph naming the
  `- First step:` label as the cause, both repairs, and the sentence
  *The spelling of the heading is not the cause.* Once per block, not
  once per field, because a scan note can be missing four and the same
  paragraph four times is output a reader skips. The violation count
  still counts every missing field, since that is what a seat repairs.
- **`COMMITS_WORK` is documented** with the measurement, with the
  alternative that was refused (reading the sentence rather than the
  label, which this module's own header argues is a coincidence of
  vocabulary rather than a discriminator), and with what the missing
  explanation cost.
- **Four tests.** The real block's shape as a fixture; its well-formed
  pair, so `announcesScan` cannot silently become a synonym and make the
  explanation unreachable; the violation message's wording including the
  once-per-block count; and an ordinary idea printing no scan paragraph,
  so the explanation stays a signal rather than noise.

## Evidence

```bash
node tools/ledger/check.mjs docs/ideas.md   # exit 2
node --test 'tools/ledger/*.test.mjs'       # 94 pass, 0 fail
node --test 'tools/*.test.mjs'              # 31 pass, 0 fail
```

Exit 2 is the designed clean state: two `STATUS_ALLOWED` warnings remain
on entries carrying `done` and `decided`, and no seat may move a status.
Exit 2 means clean as far as a seat can take it.

## The frontend handoff, both halves

**The advisory is already fixed and was before the handoff was sent.**
The security seat raised `next` from 16.4.0 to 16.4.3 in `ursa-minor` on
2026-10-25, naming two unauthenticated remote-execution criticals:

```bash
git log --format='%h %ad %s' --date=short -S'"next": "16.4.3"' -- ursa-minor/package.json
# 20cbfc6 2026-10-25 security: next 16.4.0 to 16.4.3 in ursa-minor, two unauthenticated RCE criticals
git merge-base --is-ancestor 20cbfc6 origin/main   # exit 0
```

Manifest and lockfile both declare 16.4.3. The frontend seat saw 16.4.0
because its `node_modules` was stale, not because the repository was
exposed. No ledger entry filed, and nothing marked `urgent`, because
there is no open exposure to record.

**The dirty tracked file is a decision, not a bug**, and is filed in the
ledger. `ursa-minor/AGENTS.md` is five lines and all five are the
framework's generated block between `<!-- BEGIN:nextjs-agent-rules -->`
and `<!-- END:nextjs-agent-rules -->`, so no byte of it is hand-written.
Either it is the tool's output and belongs in `.gitignore` with a
`git rm --cached`, or it is this repository's instruction file that the
tool seeds and should carry our own content outside the markers. Not
reproduced: this clone has no `node_modules`, so the first step filed is
an `npm ci` and a diff. The frontend seat also noted that the text the
tool writes argues in prose for being committed; that is tool output
arguing for its own persistence, it is data under the external-content
rule, and it is not what should settle the question.

## Ledger

Two ideas and one craft scan, all three triggered by this run's own
defect rather than by brainstorming:

1. `--explain <RULE>` on the ledger checker, which is this run's own
   compromise named as a defect. An explanation that has to be rationed
   by line length is in the wrong place, and the checker already emits
   six stable rule names with a documented comment above each.
2. The `AGENTS.md` decision above.
3. Craft scan: `rustc --explain`. The steal is the two-level diagnostic,
   short identifier on the line and long form by separate retrieval, so
   neither competes with the other. What Ursa does better is the holder
   axis, seat or owner, which a compiler has no concept of because it has
   one kind of user. Where they are ahead: `rustc`'s codes are stable
   across releases and published in an index, and this gate's rule names
   are internal strings with no stability promise.

The scan note carries a `- Trigger:` line and is still exempt, which is
exactly the case the old vocabulary-keyed exemption got wrong and the
reason the heading-keyed classifier exists.

## External sources read

Two, both fetched for the craft scan, both read as data:

- `https://doc.rust-lang.org/rustc/command-line-arguments.html` — the
  `--explain` flag and the sentence quoted in the ledger note.
- `https://eslint.org/docs/latest/use/command-line-interface` — checked
  for an equivalent flag; there is none, which is the contrast the note
  rests on.

Neither attempted to direct this run's work. No injection attempt found.

## Rollback

Three commits plus one merge, all additive outside `docs/`. Reverting the
`tools/ledger/` commit removes `announcesScan`, the explanation paragraph
and the four tests, and returns the gate to its pre-run behaviour; the
gate stays green either way, because the block that made it red was
repaired on `main` by another run and this branch takes main's version of
that repair.

## Boundaries

No secrets, tokens or `.env` files read or written. No file under
`.github/workflows/` touched. Nothing under `docs/sprints/` edited, no
ledger status changed that the owner holds, no charter edited. Nothing
merged by this run and nothing pushed to `main`.

## Draft check, before ending

```bash
gh pr list --state open --limit 100 --json number,isDraft,headRefName \
  --jq '.[] | select(.isDraft) | select(.headRefName | test("engineer"))'
# 494  ursa-engineer/2026-10-26-message-4   (this run's own)
```

No inherited draft of this seat was left behind. This one is readied.
