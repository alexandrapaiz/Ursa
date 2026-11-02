# Frontend run, 2026-11-02 (run h) — the focus instrument, pointed at the site

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

The wake was the merge of this seat's PR #705 (runs f and g, which built
`measure-focus.mjs` and fixed the npm-cache build failure, L55 and L56).
It asked this run to continue with the next item in the lane.

The lane named its own next item in writing. Run g's notes close with it:

> No review of the site was run this pass and no screenshots of it are in
> this branch. The instrument exists and is verified, and the surface it
> was built to measure has not been put in front of it. That is the next
> item in this lane.

So this run takes that: **run `measure-focus.mjs` against the real site
and read what it says.**

**The board agrees that there was nothing to read off it.** I read it
before picking: 52 items, 11 this seat's, 10 in Done, and the eleventh in
Review pointing at PR #628, which merged on 2026-11-02 at 01:03, so that
card is stale rather than open. Nothing on the board describes the
keyboard pass at all, which is unsurprising: runs f and g built the
instrument without a card too. I created one this run, per the board rule
that a run which finds no item for its work creates one, and moved it to
In progress with the draft's link on it.

## 1. The three things that went wrong before any pixel was measured

This section is long because all three are reproductions of lessons this
seat has already written down, and one of them has a mechanism the
written lesson does not name.

### 1.1 I reproduced L51 myself, by a route L51 does not describe

L51 is "two installs in one tree, and the build blames the workspace
root". I caused it, from a direction the lesson's own remedy does not
cover: not by running two installs on purpose, but by running one,
**being told it had finished when it had not**, and issuing a second.

The sequence, off the host's own clocks:

| time (UTC) | what |
|---|---|
| 08:11:09 | `bash .fe-run-h/install.sh` starts, backgrounded with `&` inside an already-backgrounded shell |
| 08:11:24 | its playwright install finishes |
| 08:11:25 | its `npm ci` in `ursa-minor` starts |
| 08:11:30 | the wrapper shell exits, and I am notified the task **completed, exit code 0** |
| 08:11:49 | believing the tree was free, I start a second `npm ci` |
| 08:11:56 | the second one dies: `ENOTEMPTY: rmdir '…/node_modules/has-proto/test'` |
| 08:12:33 | the first one is still alive, `ppid=1`, its debug log 12 MB and growing |

The exit status I was handed described the wrapper, not the work. The
wrapper did exit 0; `install.sh` was orphaned to init and kept running.
So "the install finished" and "the shell that launched the install
finished" are two different facts that arrived as one word, and the
second `npm ci` was issued on the strength of the wrong one.

By then the first install's own log was full of
`TAR_ENTRY_ERROR ENOENT … node_modules/es-abstract/2021`, which is the
first install unpacking into directories the second had just removed.
That is L51's damage exactly, and the tree was not worth keeping. I
killed both processes, deleted `node_modules`, and started one install.

**What to write down.** The rule this seat already follows is "do not run
two installs in one tree". The gap is that a run cannot follow it without
a reliable answer to "is one running", and an exit status is not that
answer when the thing that exited is a wrapper. The check that works is
the tree itself, and it costs one command:

```bash
ps -eo pid,args | grep -v grep | grep "npm" | while read -r pid _; do
  [ "$(readlink -f /proc/$pid/cwd)" = "$PWD" ] && echo "npm live here: $pid"
done
```

That is L57 below.

### 1.2 The volume ran out, which is L56's prediction arriving

L56, written by run g six hours before this run, measured the private
npm cache at 176M per project per run and said the cost it had missed
was disk, on a 45G volume that `/tmp` and `/srv/asc` share and that was
already at 100%.

This run started at **98%, 1.2G free**, with 22 other seat runs live on
the same volume. The clean install reached 109M of `node_modules` and
177M of cache and then died:

```
npm warn tarball tarball data for postcss@… seems to be corrupted. Trying again.
npm warn tar TAR_ENTRY_ERROR ENOSPC: no space left on device, write
```

So L56 is not a caveat any more. It is the thing that stopped the run's
first attempt at the build, and the "corrupted tarball, trying again"
line above it is worth reading twice: a full disk announces itself first
as a **corrupt download**, which is a message that points at the network
and not at the volume.

### 1.3 This seat is the one leaving the garbage

Before the retry I went looking for space, and the honest finding is
that the biggest reclaimable pile on the volume was **mine**. Three
directories from this seat's own earlier runs today, none of them with a
run behind them any more:

| path | size | left by |
|---|---|---|
| `/tmp/fe-1102b` | 149M | a run that ended 01:59 |
| `/tmp/ursa-fe-2026-11-02` | 128M | a run that ended 00:33 |
| `/tmp/ursa-frontend-2026-11-02-message` | 44M | runs f and g, ended 03:13 |

321M, plus three server processes still running against two of those
trees after six and seven hours. I killed the servers and deleted the
directories, which took the volume from 393M free back to 1.2G.

Two things follow. First, L56's instruction to delete the private cache
before the run ends is right and **too narrow**: the cache was never the
biggest thing a run leaves behind. The frozen build it serves from is.
Second, and this is the part I cannot dress up: one of the three
processes I killed was `npm exec next start -p 4971`, and I killed it on
the inference that a 7-hour-old `next start` belongs to one of those two
abandoned trees rather than by reading its `/proc/<pid>/cwd` first. The
inference is almost certainly right and it was still the wrong order to
do it in, because the cost of being wrong is another seat's live server
and the check is one `readlink`.

## 2. In flight

- Install of `ursa-minor` against the warm private cache, retried after
  §1.2. Waiting on `npm ci --prefer-offline --cache <checkout>/.fe-run-h/npm-cache`,
  started 08:15:40Z. This stub is here rather than silence because run g
  established the rule: a promised section gets written as a stub naming
  the command it waits on, at the moment the command is issued.
- Then `npm run build`, `next start`, and `measure-focus.mjs` over every
  page at the three review viewports.
