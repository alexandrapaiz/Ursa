# Runner facts — what is measurably true about the hosts Ursa's seats run on

Every seat runs in a fresh cloud session with no memory, so every seat
rediscovers the runner by hand. This week three different seats probed
the same boundaries and one of them drew the wrong conclusion from a
probe that cannot answer the question it was asked. This file is the
shared answer, so a run can read it instead of re-deriving it.

Two rules for using this file.

1. **Every line carries the command that produced it and the date it
   was measured.** A claim with no probe is not a fact, and a fact with
   no date rots. If you find a line to be false, fix it in the same PR
   that discovers it and say so in the PR description.
2. **Prefer attempting to trusting.** This file exists to stop waste,
   not to stop verification. When the cost of the attempt is low, make
   the attempt. When it is not, this file is the next best thing.

3. **Say which host you measured on.** Added 2026-09-30, after this
   file's §1 table turned out to be true of one host and false of
   another. Every row belongs to an execution context, and §1b is how
   you tell which one you are in before you trust a row.

Owned by the ExO seat (prompts/exo-agent.md §5b). Any seat may append a
measured line.

## 1. What the Actions runner's token can and cannot do

**Scope: GitHub Actions only.** Read §1b first. On the resident company
host these rows do not apply, and at least one of them inverts.

The seat workflows authenticate with `GH_TOKEN: ${{ github.token }}`,
the repository's default `GITHUB_TOKEN`, scoped by each workflow's own
`permissions:` block. It is an installation token, so its refusals all
read the same: `Resource not accessible by integration`, HTTP 403. That
single message covers three very different causes, which is why it is
worth writing down which is which.

| Action | Result | Probe | Measured |
|---|---|---|---|
| Push to `.github/workflows/**` | refused | attempted push from an ExO run | 2026-09-20, reconfirmed by the security seat 2026-09-27. **Inverts on the resident host, see §1b.** |
| Push any other path, open a PR | works | every seat PR this week | 2026-09-27 |
| `gh label create` / `delete` / `gh pr edit --add-label` | works | ExO run | 2026-09-20 |
| Delete a remote branch (`git push origin --delete`) | works | ExO run deleted three merged branches | 2026-09-27 |
| `gh pr comment` | works | ExO run | 2026-09-20 |
| `gh repo edit` (description, homepage, topics) | refused | ExO run | 2026-09-20 |
| `gh secret list` | refused | ExO run | 2026-09-20 |
| `gh api /repos/{owner}/{repo}/actions/permissions` | refused **always** | see below | 2026-09-27 |

### The probe that does not measure what it looks like it measures

`GET /repos/{owner}/{repo}/actions/permissions` needs the
`administration` scope, which no `GITHUB_TOKEN` has and no
`permissions:` block can grant. It therefore returns 403 on every run
of every seat, whatever that seat's dispatch capability actually is.

This was demonstrated on 2026-09-27 rather than argued. The ExO run
(36348527979) called the endpoint once, having attempted no dispatch of
any kind, and received the identical response the PM seat has been
reporting as dispatch evidence since 2026-09-24:

```
{"message":"Resource not accessible by integration",
 "documentation_url":".../actions/permissions#get-github-actions-permissions-for-a-repository",
 "status":"403"}
```

So a 403 from that endpoint is not evidence about dispatch. **The only
probe that measures dispatch is an attempted dispatch**, `gh workflow
run <workflow>.yml`, which the PM run of 2026-09-25 also performed and
which also returned 403. That second result is the real finding, and it
stands on its own. The permissions-endpoint call beside it added
nothing and cost the owner four days of a duplicated action item.

Note that `agent-pm.yml` already declares `actions: write` (line 16),
so the workflow's own permissions block is not the cause. Whatever is
refusing the dispatch sits above it, in the installation's own grant.
That is the question for the owner, and it is narrower than the one
currently written in `docs/sprints/pending.md`.

## 1b. Two hosts, not one, and how a run tells which it is on

Added 2026-09-30 by the ExO window run, which found §1's table false of
itself.

Ursa's seats do not all run in the same place. There are two execution
contexts and they carry different credentials, so a boundary measured in
one of them says nothing about the other.

| | GitHub Actions | Resident company host |
|---|---|---|
| How a run arrives | `schedule` or `workflow_dispatch` in `.github/workflows/agent-<seat>.yml` | a window or dispatch opened on the host, per the holding-company note in every charter |
| Credential | `GITHUB_TOKEN`, an installation token, scoped by the workflow's `permissions:` block | a user-scoped fine-grained personal access token, exported as `GH_TOKEN` |
| `GITHUB_ACTIONS` | `true` | unset |
| Push to `.github/workflows/**` | **refused**, HTTP 403 | **works** |

**The detection, one line, run it before trusting any row above:**

```sh
if [ "${GITHUB_ACTIONS:-}" = "true" ]; then echo actions; else echo host; fi
```

`GITHUB_RUN_ID` is unset on the host too and works as a second check.
`gh auth status` is the third: an Actions run's token prints as `gho_`
or as an app installation token, and the host's prints as
`github_pat_`. Never print the value itself.

**The probe, 2026-09-30, ExO window run.** On the host, with
`GITHUB_ACTIONS` unset and `gh auth status` reporting a
`github_pat_`-prefixed token for the owner's account, this run created
branch `exo/probe-workflow-write`, appended one comment line to
`.github/workflows/redaction-gate.yml`, committed, and pushed. The push
succeeded, `[new branch] exo/probe-workflow-write`, exit 0. The branch
was deleted immediately afterwards and nothing was left behind. PR #42,
which rewrote all eleven seat workflows and pushed them, is the same
result from the HQ centralizer's context.

**Why this mattered for ten days.** `prompts/exo-agent.md` §5 said the
token "cannot push `.github/workflows/` at all" and that no
`permissions:` setting changes it, with no mention of a host. The claim
was inherited from alexandria's register and is correct about Actions.
Read on the host it is simply wrong, and a run that believes it queues
an entry in `docs/agents/pending-workflow-changes.md` and asks the owner
to hand-apply an edit the run could have shipped itself. That is the
owner doing a seat's work, which is what L-X12 exists to count.

**What each context should therefore do.** On Actions, design the
workflow change and queue it, which is what the charter already says. On
the host, apply it directly, unless the dispatch that opened the window
says otherwise. This run's dispatch did say otherwise, in those words,
so the workflow edits this run designed are queued rather than applied
and are marked as queued-for-that-reason rather than
queued-for-lack-of-access.

> **Superseded as advice, kept as measurement (2026-10-18).** The
> paragraph above is still true about what each host *can* write and is
> no longer what either should do. HQ's `standards/roles/exo.md` §8 made
> workflow files and runtime machinery the centralizer's in every product
> repository and retired the local queue of pending diffs, so a product
> ExO on either host measures the defect, writes the lesson, and hands it
> to `alexandra-systems/exo-centralizer` on the board. Do not queue and
> do not push. The rows in the table stay, because §2 and §5b of the
> charter still turn on which host you are.

## 1c. On the host, the actor field is the owner for every seat, so authorship cannot be read from GitHub (measured 2026-10-18)

§1b records that the host's credential is the owner's own account. This
section records what follows from it, because the consequence is larger
than the credential and it silently broke an instrument this seat reports
to the owner every run.

```sh
$ gh api user --jq '.login, .type'    # on the resident host
alexandrapaiz
User
```

Every merge, comment, review and push a seat makes on the host is
therefore attributed to `alexandrapaiz`. On Actions the same seat appears
as `app/claude`. So:

| Question | Readable from GitHub? | Read instead |
|---|---|---|
| Who merged this pull request | **no**, on the host | the PM's `done` on the board, whose `ref` is the pull request (`docs/standards/pm.md` §15, §21) |
| Who commented | **no**, on the host | the board, or the comment's own text |
| Who pushed this branch | **no**, on the host | the branch name's seat prefix, and the commit trailers |
| Who merged, on Actions | yes, `app/claude` is a seat | — |

**The boundary date is 2026-10-17**, when HQ retired the `schedule:`
block in all eleven `agent-*.yml` files and the seats' clocks moved to
the host. Before it, `mergedBy.login` separated the seats from the owner
correctly. The first merge across the boundary is #215, 2026-10-17 06:24,
recorded as the owner and reported by the PM two minutes later as its own
Tier B merge.

**What it cost.** On 2026-10-18 the fourth window of the ExO seat
reported forty-three owner merges against nine PM merges for the week and
graded autonomy the weakest of the ten attributes on that number. Eight
of that day's ten merges were the PM's, claimed on the board, recorded as
the owner. That is
`INC-2026-10-18-host-token-is-the-owner`, and the corrected measurement
is in `prompts/exo-agent.md` §3e.

**Do not try to fix this with a second token.** The credential is the
owner's and the boundary above says so; a seat does not get to request
one of its own. The board already carries the authorship record and
costs one `curl`.

## 2. Scheduled runs fire late, always, by two to five hours

GitHub's cron is a queue, not a clock. Ursa's own measurements, every
`schedule` run in the repository's history as of 2026-09-27, taken from
`gh run list --workflow=agent-<seat>.yml --json event,createdAt`:

| Seat | Cron (UTC) | Fired (UTC) | Late by |
|---|---|---|---|
| exo | Sun 18:00 | 2026-09-20 19:56 | 1h56 |
| pm (ceremony) | Mon 12:00 | 2026-09-21 18:07 | 6h07 |
| skill | Thu 13:55 | 2026-09-24 18:01 | 4h06 |
| frontend | Mon/Thu 14:15 | 2026-09-24 18:24 | 4h09 |
| pm | 11:05 | 2026-09-24 15:44 | 4h39 |
| engineer | 11:26 | 2026-09-24 15:51 | 4h25 |
| engineer | 23:26 | 2026-09-25 01:41 | 2h15 |
| pm | 11:05 | 2026-09-25 15:44 | 4h39 |
| engineer | 11:26 | 2026-09-25 15:51 | 4h25 |
| research | Tue/Fri 13:15 | 2026-09-25 17:55 | 4h40 |
| engineer | 23:26 | 2026-09-26 01:46 | 2h20 |
| pm | 11:05 | 2026-09-26 14:54 | 3h49 |
| engineer | 11:26 | 2026-09-26 15:02 | 3h36 |
| engineer | 23:26 | 2026-09-27 01:37 | 2h11 |
| pm | 11:05 | 2026-09-27 15:32 | 4h27 |
| engineer | 11:26 | 2026-09-27 15:42 | 4h16 |
| security | Sun 15:15 | 2026-09-27 18:58 | 3h43 |
| exo | Sun 18:00 | 2026-09-27 20:34 | 2h34 |

Eighteen scheduled runs, eighteen late, none early, none on time. The
range is 1h56 to 6h07 and the median is 4h07. The one clear pattern is
time of day: the 23:26 UTC engineer slot is consistently the least late
at 2h11 to 2h20, the Sunday 18:00 exo slot is next at around two hours,
and every slot between 11:00 and 15:15 UTC runs three and a half to
over six hours behind. That is the shape of a shared scheduler draining
a backlog, and it is the documented behaviour of GitHub's hosted cron
rather than a fault in any workflow here. The single worst observation,
the PM's Monday ceremony at 6h07, is also the only run in a Monday-noon
slot, so treat it as one observation and not as a Monday effect.

Three consequences that seats keep getting wrong.

- **Lateness is the norm, so lateness is not an incident.** The PM
  standup of 2026-09-25 spent a `pending.md` entry on research being
  "2.5+ hours late" and asked for an ExO look if it happened a third
  day. It has happened on all eighteen scheduled runs ever made in this
  repository, and that particular one was closer to the fast end than
  the slow end. The signal worth escalating is a **missed occurrence**,
  meaning a cron window that produced no run at all, not a late one.
- **Reason in windows, never in clock times.** A run that needs to
  observe another seat's output should assume it may start up to six
  hours after its nominal time, and a run that needs to land before a
  deadline should have its cron set five hours early.
- **The cron comments in `.github/workflows/` are wrong about local
  time.** `agent-exo.yml` says "18:00 UTC (early afternoon ET)" and the
  seat has in fact never started before 19:56 UTC. A comment that has
  quietly gone false is the same defect as a lying diagram. The
  corrected crons are queued as PWC-EXO-1 in
  `docs/agents/pending-workflow-changes-exo.md`, because this seat cannot
  write that directory.

## 3. The host's clone is shallow and the Actions checkout is not, so every ancestry question lies until you unshallow (measured 2026-10-06, host/Actions split measured 2026-10-18)

> **Second half of the same defect, measured 2026-10-18 (ExO, fourth
> window): the host's clone is also narrowed, and that one breaks a
> tool rather than a calculation.** A fresh host clone of this
> repository arrives with
>
> ```sh
> $ git config --get-all remote.origin.fetch
> +refs/heads/main:refs/remotes/origin/main
> ```
>
> so `git fetch origin <branch>` has nowhere to write the remote ref,
> and `git merge origin/main` on a branch fetched from a pull request
> ref fails with **"refusing to merge unrelated histories"** — measured
> this run, on a branch that was in fact a direct descendant.
>
> HQ's `tools/check-merge-queue.sh` fails harder and more quietly. Run
> cold in such a clone it reported **all eleven** open pull requests as
> `NO SUCH REMOTE BRANCH (the branch was deleted; GitHub says
> MERGEABLE)`, which was false for every one of them. Ursa's PM hit the
> identical output on 2026-10-18 at 02:30 UTC and said so on the board.
> That is a confident wrong answer, not a failure, and it is the worst
> shape an instrument can take.
>
> **Run these four lines before any ancestry, merge or queue question,
> on the host, every run.** They cost about a second and they are the
> difference between the two readings above:
>
> ```sh
> git rev-parse --is-shallow-repository      # true on the host
> git fetch --unshallow origin
> git config --unset-all remote.origin.fetch
> git config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
> git fetch -q origin
> ```
>
> The script's wording is HQ's to fix and was handed to the centralizer:
> a missing local ref should be reported as a narrowed or shallow clone,
> not as a deleted remote branch.


> **Corrected 2026-10-11 (ExO), and kept anyway.** The heading is no
> longer true as stated. All eleven `agent-*.yml` workflows now set
> `fetch-depth: 0` on `actions/checkout`, and this run measured
> `git rev-parse --is-shallow-repository` returning `false` on a fresh
> Actions checkout. The ancestry checks in this run's merge-order pass
> were run against a full clone and are sound.
>
> The section stays because the fix lives in eleven workflow files that
> this seat cannot write, so it can regress in a single edit, and
> because the lesson under it is not about shallowness. The lesson is
> that `merge-base`, `rev-list` and `git merge` answer ancestry
> questions wrongly without erroring when the history they are given is
> incomplete, and a run that trusts the answer can read a healthy
> repository as a destroyed one. Keep the one-line check. It costs
> nothing and it is the difference between a measurement and a guess:
>
> ```sh
> git rev-parse --is-shallow-repository   # expect: false
> ```
>
> If it ever prints `true`, `git fetch --unshallow -q origin` first and
> correct this note back.

> **Corrected back 2026-10-18 (ExO), on the other host.** It printed
> `true`. The heading is true again, with a host named on it: **the
> Actions checkout is complete and the resident company host's clone is
> shallow.**
>
> Measured on the host this run, on a fresh clone, before any fetch:
> `.git/shallow` present, `git rev-parse --is-shallow-repository`
> returning `true`, and `git rev-list --count origin/main` returning
> `1`. The first ancestry question this run asked, `git merge-tree
> --write-tree origin/main refs/prs/167`, answered `fatal: refusing to
> merge unrelated histories` with exit 128. After
> `git fetch --unshallow -q origin`, `main` had 715 commits and the
> same command exited 0 on the same branch.
>
> **Why the 2026-10-11 correction got it wrong, which is the part worth
> keeping.** That run measured a fresh Actions checkout, found
> `fetch-depth: 0` set in all eleven `agent-*.yml` files, and wrote the
> result as a fact about "the checkout". The fix it was describing lives
> entirely in those eleven workflow files. The host's clone is made by
> the resident runtime and not by `actions/checkout`, so no edit to
> those files could ever have reached it, and the correction was
> generalising from the one host where the fix applied.
>
> That is this file's own §1b defect, committed in this file. §1b exists
> to say that there are two hosts and that a run must determine which it
> is on before it reasons. A fact measured on one host and written
> without naming it reads as a fact about both. From now on, every line
> in this file that could differ between the two names the host it was
> measured on, and a line with no host on it is to be treated as
> unverified on the other one.
>
> The practical rule is unchanged and now unconditional. Run the check,
> every run, on either host, and unshallow if it says `true`. On the
> host that is a real step with a real consequence, not a formality.

This is the most dangerous fact in this file, because the tool that is
wrong does not report an error. It reports a confident wrong answer, and
the answer it gives is the one that makes a run destroy something.

**What happened on 2026-10-06.** This seat was woken by a handoff asking
which of two of its own cycle pull requests superseded the other. The
charter's own instrument for that question is
`git merge-base --is-ancestor`, named twice in `prompts/exo-agent.md`.
Run against `origin/main` on a fresh runner checkout it produced this:

```
$ git merge-base origin/main origin/ursa-exo/2026-10-05-window
                                     # empty: no common ancestor
$ git merge origin/main
fatal: refusing to merge unrelated histories
$ git rev-list --max-parents=0 origin/main
a088040...                           # main's tip IS its own root commit
$ git log --oneline origin/main | wc -l
1                                    # main has one commit in its history
```

Read at face value, that says the default branch's history has been
destroyed and replaced by a single orphan commit. It is the shape of a
force-push catastrophe, and the correct response to a real one is loud
and immediate. It was not real.

**The cause.** The checkout is shallow. `.git/shallow` exists and
`git rev-parse --is-shallow-repository` returns `true`. A shallow clone
has grafted roots, so every commit at the graft boundary looks parentless
to every command that walks parents. `merge-base` finds no common
ancestor because it cannot see far enough back to reach one, and it
signals that by printing nothing and exiting non-zero, which is
byte-for-byte the same output as a genuine absence of relation.

**The fix, which costs one command and a few seconds.**

```bash
git fetch --unshallow -q origin
git rev-parse --is-shallow-repository    # must print false before you reason
```

After unshallowing, the same two branches had merge bases, `main` had its
full history, and the real answer was visible: one branch's tip was an
ancestor of the other.

**Two traps around it.**

- `git fetch origin <branch>` does **not** create `origin/<branch>` on
  every runner configuration, so `origin/main..origin/<branch>` fails
  with "unknown revision" and looks like a missing branch. Fetch the
  refspec explicitly:
  `git fetch origin 'refs/heads/<branch>:refs/remotes/origin/<branch>'`.
- Unshallowing is a prerequisite for the charter rules that already
  depend on ancestry, not an optimisation. A run that skips it and
  obeys the charter literally will conclude that two related branches
  are unrelated, and the action that conclusion licenses is closing the
  wrong pull request.

**Why it had never been caught.** Every earlier use of
`--is-ancestor` in this seat's history compared two seat branches to each
other rather than either of them to `main`. Both of those are usually
fetched to their full depth relative to each other's recent tips, so the
answer came out right by luck. The comparison against `main`, which is
the one that decides whether a branch is landable, is the comparison that
reaches back furthest and the one shallowness breaks first.

## 4. A merge commit may carry `main`'s own workflow changes (measured 2026-10-06)

Section 1 records that the Actions token is refused on
`.github/workflows/`. One case is narrower than that rule suggests, and
knowing it unblocks a real task.

Merging `main` into a seat branch brings `main`'s workflow edits into the
merge commit's diff against that branch. On 2026-10-06 this seat merged
`main` (which had changed all eleven `agent-*.yml` files since the branch
forked) into `ursa-exo/2026-10-05-window` and pushed:

```
$ git push origin exo-land-81:ursa-exo/2026-10-05-window
   cc1aa6d..9bc5455  exo-land-81 -> ursa-exo/2026-10-05-window
```

Accepted. So a seat is not walled out of landing its branch merely
because `main` touched workflows while the branch was open, which is
what a literal reading of section 1 implies.

**State this narrowly.** What was measured is that this push succeeded
with those workflow blobs already present on the default branch. The
mechanism was not measured, and the refusal in section 1 is a measured
fact about introducing workflow content that `main` does not have. Do not
generalise this into permission to edit a workflow inside a merge
commit. If you need to know, probe it, the way this file demands
everywhere else.

**Reconfirmed 2026-10-17.** The same push, on the same seat, landing
this branch. `main` had moved through forty-three merges in six days and
had touched all eleven `agent-*.yml` files; merging it into
`exo/2026-10-11` and pushing was accepted. Two measurements, eleven days
apart, same result. The narrow statement above still stands as written,
and the thing it is narrow about is still unmeasured.

## 5. Mermaid rendering works on the Actions runner and not on the resident host (measured 2026-10-18)

The ExO charter's §5b requires that any mermaid diagram it changes be
rendered and looked at before shipping, because mermaid renders a syntax
error as a picture and exits zero, so a clean exit code is not a rendered
diagram. It gives the command and notes that it "works from the runner
and costs nothing".

**That is true of the runner and false of the host.** Measured this run,
with the documented puppeteer config in place:

```
$ npx -y @mermaid-js/mermaid-cli@11 -i d.mmd -o d.png -p pptr.json
Error: Failed to launch the browser process:  Code: 127
chrome-headless-shell: error while loading shared libraries:
libatk-1.0.so.0: cannot open shared object file: No such file or directory
```

The headless Chrome binary downloads fine. It cannot start, because the
host image has none of Chrome's GTK shared libraries. `ldconfig -p |
grep -c libatk` returns `0`, there is no `chromium`, `google-chrome` or
`firefox` on `PATH`, and the seat runs as uid 997 and cannot install
system packages. There is no way around this from inside a run, and
installing one would be a change to the host image rather than to this
repository.

**So on the host, a diagram change cannot be visually verified.** Say so
rather than implying it was. What a run can still do, and what this run
did, is narrow the risk to the point where the unverifiable part is
small:

- Keep the edit inside an existing node's label, so the graph's
  structure is untouched and only text changes.
- Smoke-test the block mechanically. Per line, quote count even and
  `[]`, `()` and `{}` balanced. Then check that every edge endpoint is a
  declared node id. That catches the malformed-label and
  typo-in-an-id classes, which are the two that actually happen, and it
  catches nothing about layout.
- Say in the pull request that the diagram was not rendered, on which
  host, and what was checked instead.

A structural change to a diagram should wait for a run on Actions, or be
handed to a seat running there, rather than be pushed unrendered from
the host.

**The general form, which is why this section exists at all.** This is
the third fact in this file to turn out host-dependent after being
written as though it were not, following the token's push permission in
§1b and the clone's depth in §3. The pattern is now established well
enough to state as a default: **a fact about what a run can do is
host-specific until measured on both hosts.** Write the host into the
line when you record it, and when you read a line with no host on it,
treat it as unverified on the host you are not on.

## 6. The tool scripts the standards tell seats to run are in HQ's repository and not in this one (measured 2026-10-18, both hosts)

`docs/standards/pm.md` and `docs/standards/lessons.md` name fourteen
scripts under `tools/`, written as bare relative paths in the
imperative. Ursa's `tools/` contains `ledger/` and `stack/` and none of
them. All fourteen are in HQ's repository. This is Ursa incident 18;
this section is the measured half.

The sweep, which is also §3 of the ExO charter and should be run every
cycle rather than enumerated by hand:

```bash
grep -rhoE 'tools/[A-Za-z0-9._-]+\.(sh|mjs|js|py)' docs/standards/ \
  | sort -u | while read -r t; do [ -e "$t" ] || echo "MISSING: $t"; done
```

On 2026-10-18 it printed fourteen `MISSING:` lines: `all-hands.sh`,
`chair-install.sh`, `check-actions-reach.sh`, `check-draft-prs.sh`,
`check-merge-queue.sh`, `check-seat-workflows.sh`, `check-tier.sh`,
`check-turn-caps.sh`, `event-bus-workflows.py`, `gh-actions.sh`,
`install-staged-workflows.sh`, `new-seat.py`, `no-ship-tripwire.sh`,
`sync-company.sh`.

**Where they are, per host.**

| Host | Path | Measured |
|---|---|---|
| Resident company host | `/srv/asc/repos/alexandra-systems/tools/` | 2026-10-18, all fourteen present |
| GitHub Actions | nowhere; the runner checks out this repository only | 2026-10-18, by reading the eleven `agent-*.yml` files: none of them checks out `alexandrapaiz/alexandra-systems` |

**They run correctly from an Ursa checkout when given the absolute
path.** The scripts use `gh` and `git` against the current working
directory, so the location of the file does not change what it measures.
Verified on the host, from this repository's working tree:

```
$ /srv/asc/repos/alexandra-systems/tools/check-merge-queue.sh
PR #234  clean     (behind main by 12)  exo 2026-10-18 (second window) …
PR #199  CONFLICT  (behind main by 132)  Skill run 2026-10-15 …
          in: docs/ideas.md
1 of 8 open pull request(s) cannot be merged as they stand.
```

**What this is and is not.** It is a bridge on one host. It is nothing
on the other, and it is not a fix: the absolute path is a fact about
where a sibling checkout happens to sit on this machine today, and the
standard will go on writing `tools/check-merge-queue.sh` until HQ makes
the relative path resolve. Use the bridge, cite incident 18 when you do,
and do not copy the scripts into `tools/` here. A vendored copy of
shared machinery drifts from the standard that calls it while continuing
to answer, which is worse than the absent file, because the absent file
fails loudly.

**Re-measure the table rather than trusting it.** The host path is
outside this repository and nothing in this repository keeps it true. If
`ls /srv/asc/repos/alexandra-systems/tools/` is empty or missing, the
bridge is gone and the fallback is the `git merge-tree` one-liner in the
ExO and PM charters. That is the point of §5's general form, one
section up: a fact about what a run can do is host-specific until
measured on both hosts, and a fact about a path outside the repository
is stale until measured this run.
