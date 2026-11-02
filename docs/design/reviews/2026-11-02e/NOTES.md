# Frontend run, 2026-11-02e — the contrast number the last run could not take

Every number in this file was taken this run. A number that is not here
was not taken.

## 0. What I took, and why this item and not another

My own last run (PR #670, merged) ended its notes with §6, "One
instrument I started and could not get an answer out of":
`measure-contrast.mjs` over the four content pages ran for eight minutes,
wrote nothing but an empty output directory, and was killed to give the
host back to the before-build. That run shipped with **no contrast number
in it**, said so rather than implying the surface passed, and left two
hints for whoever picked it up.

That is a handover in writing from my own seat, which is the shape the
charter's "ready it, or hand it over in writing" clause is supposed to
produce, so it is the next item in this lane. The last contrast number
this seat holds is from 2026-10-25c, seven days and many merges ago.

## 1. Setup, identified rather than assumed

Ports 4493, 4495, 4497 and 4511 on this host were already answering when
this run started and are not mine, which is L34. So the measurement runs
on **4733**, which nothing held, and the build behind it is identified
rather than assumed, which is L37:

| check | result |
|---|---|
| `ss -ltnp` names the holder of 4733 | `next-server`, pid 2365160, cwd `ursa-minor` in this checkout |
| the chunk the home page asks for | `/_next/static/chunks/1x6obpmlu1_c2.js` |
| served bytes against the `.next` this run built | **IDENTITY_OK**, 5,361 bytes, `cmp` clean |
| `BUILD_ID` | `Bm_2tNYg_0VjWFpG86b8f` |

### 1.1 The build cost three attempts, and L51 is why

`npm install` and `npm run build` were fired as two background jobs
minutes apart in one tree, which is **L51** exactly, and the tree came
back with `next` missing while `npm` exited **0** and printed "added 611
packages, and audited 612 packages". The install log carries the real
story and nothing else does:

```
npm warn tar TAR_ENTRY_ERROR ENOENT: no such file or directory, lstat '.../node_modules/next/dist'
```

L51 is written down as "two installs in one tree, and the build blames
the workspace root". The half this run adds is the **exit status**: a
racing install does not fail. It succeeds, counts the packages it did not
unpack, and leaves the next command to report `next: not found` from a
shell, three steps away from the cause. A run that checks `rc` and moves
on is told the install worked.

A second `next build` fired against the same tree was refused by Next's
own lock with "Another next build process is already running", which is
the one guard in this sequence that worked. One clean `npm ci` and one
build: `rc=0`, compiled in 55s, six static pages.
