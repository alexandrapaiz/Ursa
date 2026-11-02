# Frontend run, 2026-11-02 (run f) — the keyboard pass

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why this item

The wake was the merge of this seat's own PR #677, which asked this run
to continue with the next item in its lane on the board.

**There was no open card in the lane.** Of 52 items on Ursa's board, 11
are this seat's, 10 of them in Done. The eleventh sits in Review and
points at PR #628, which merged at 01:03 today, so the card is stale
rather than open. No other frontend branch is open either: `gh pr list`
filtered on this seat's branch pattern returned exactly one row, this
run's own draft. So the lane's next item is not on the board, and
picking one was this run's first judgement rather than a lookup.

**What I picked, and the hole it fills.** This kit measures the pointer
and it has never measured the keyboard.

| instrument | the question it answers |
|---|---|
| `measure-hit-areas.mjs` | how big is this control under a finger |
| `measure-narrow.mjs` | what does the layout do below 390 |
| `measure-contrast.mjs` | can the text be read against the pixels behind it |
| `measure-swatches.mjs` | can a legend's marks be told apart |
| `measure-floor.py` | is the frame set deterministic enough to diff |

None of them asks what a keyboard user asks first, which is *where am
I*. The word "keyboard" appears **once** in 1883 lines of
`docs/design/ledger.md`, in a benchmark note about Stripe's CLI
reference. The charter requires that every interaction work on touch
where hover does not exist; the symmetric case, a pointer that is not
there at all, has no instrument behind it.

The site is not careless about this. It has one considered answer, a
single global `:focus-visible` at `1px solid var(--polar)` with a 3px
offset, benchmarked on 2026-10-01 against claude.com, Linear and Vercel,
all three of which declare focus once as a site-level token. That review
shipped two screenshots of two tab stops on one page. It did not
enumerate the stops, and nothing in the kit could.

**Two things that could be wrong and that nobody would see.** A control
Tab never reaches is counted by `measure-hit-areas.mjs`, because it is in
the DOM and it has a box, and a pointer finds it fine. And a ring sits
3px *outside* its control, so what is behind it is whatever is 3px
outside, which on the home page is a starfield with bright pixels in it.
L36 found the dashboard's fourth provenance swatch at 1.20:1 against a
3:1 floor, and the only reason it was findable is that somebody
photographed the pixels instead of reading the stylesheet.

## 1. The instrument

`docs/design/review-kit/measure-focus.mjs`, with
`selftest/check-focus.mjs` behind it. **21 of 21 assertions hold.**

The indicator is defined as *whatever pixels differ between the same
rectangle photographed focused and photographed blurred*. That
definition is the point: an outline, a box-shadow, a background wash, an
inset border and a pseudo-element all answer it, and none of them has to
be named in advance. Each indicator pixel's ratio is then taken against
its own unfocused colour at the same coordinate, which is the adjacency
1.4.11 asks for, read at the one place where the two colours are
guaranteed to be the two a reader is comparing.

Three things the selftest pins, because each is a way this measurement
could read as good news while being wrong:

1. **A focus trap.** `trap.html` swallows Tab on its second control. The
   tool has to report the two controls behind it as unreachable rather
   than as a short clean ring. A reach headline produced by differencing
   a set against itself is always zero, so this is the assertion the
   headline rests on.
2. **L36's two ratios, recomputed.** `--polar` on `--night` at **11.99**
   and `--line` on `--night` at **1.1985**, which L36 printed to two
   figures as 1.20. Those were taken by hand off the dashboard on
   2026-10-26 by a different code path over different pixels, so
   agreeing with them is a cross-check and not a tautology.
3. **The drift gate.** A stop whose neighbourhood moves between two
   identical blurred frames is `UNSTABLE` rather than given a number.
   The fixture for it is a `requestAnimationFrame` loop, chosen because
   it is the case the freeze *cannot* fix: `freezeInit` pins rAF's
   timestamp and leaves its callbacks running, and Playwright's
   `animations: 'disabled'` does not reach rAF either.

Two assertions failed on the first run and both were the fixture's
fault, not the tool's. The 1.22 I asserted was my own arithmetic; the
tool's 1.1985 is right and it is L36's number. And the first drift
fixture appended a pixel on `blur`, which cannot drift, because both
blurred frames are taken back to back with no blur between them.

The 2.4.11 area column is **reported and never failed on**. WCAG 2.4.11
asks that a focus indicator cover at least the area of a 2px perimeter
of the unfocused control, and a 1px ring covers about half of that on
every control, identically. That is a decision about the ring's weight,
the ring's weight is identity, and the charter says identity is this
seat's to protect and not to reinvent.

## 2. Fixing the build was a large part of this run, and the first story I had was wrong

`npm ci` in `ursa-minor` **failed**, and the charter says that when the
build fails, fixing the build is the run.

```
npm error code EEXIST
npm error syscall rename
npm error path /srv/asc/home/.npm/_cacache/tmp/382a7147
npm error dest /srv/asc/home/.npm/_cacache/content-v2/sha512/ca/d1/0d16…
npm error File exists: …/content-v2/sha512/ca/d1/0d16…
```

Not a missing package and not a half-unpacked tree, which is L49 and
L51. A collision inside npm's **content-addressed cache**, which on this
host is `/srv/asc/home/.npm/_cacache` and is shared by every seat of
every company on it. `npm ci` had already emptied `node_modules` before
it died, so the tree was left at zero packages and the build had nothing
to run against.

**The fitting story, and why I do not get to keep it.** I had started
the kit's playwright install and the site's install within one minute of
each other. That is L51's shape, I had just done it, and it was
available as an explanation immediately. The timestamps kill it:

| npm run | tree | started | ended |
|---|---|---|---|
| another company's seat | `/tmp/epito-epitome-engineer-Tisktd/cli` | 06:33:59 | 06:35:27 |
| mine, the kit | `/tmp/pw` | 06:37:23 | 06:37:38 |
| **mine, the site** | `ursa-minor` | 06:37:24 | **06:43:30, failed** |

My two overlapped for fourteen seconds and the failure came six minutes
after that window closed. So "my own two installs raced" is a story that
fits the shape and not the clock. This is L54 again, one run later: the
flattering, mechanistically detailed explanation that credits something
the run itself just did.

**What the evidence does support.** The failing blob is `zod`, and the
lockfile holds that integrity exactly once, so no single `npm ci` had two
writers for it. (Three `zod` paths appear in the tree; the other two are a
different version with a different hash. I checked, because "one package
installed to three paths" was the next fitting story.) A destination that
already exists therefore means **another process wrote it**, and a source
tmp file reported `ENOENT` in the same breath means another process
removed mine. npm's logs record only their own process, and no npm
started in this repository's cache between 06:37:51 and 06:43:30, so I
cannot name the writer. What is established is that the resource is
shared across companies on this host, that my run added a writer to it,
and that the install died on it.

**The remedy, measured.** `npm ci --cache /tmp/npm-fe-f`, a cache
directory nothing else on the host owns. See §2.1 for whether it worked.

**Why this is not already written down.** The kit's README has the right
instinct and stops one directory short. It says to install playwright
"outside both sites, in a directory neither `npm install` will ever
touch", and it knows that about twenty seats share one unix user and one
`/tmp` here, and it has a rule for scratch paths: write to
`/tmp/<seat>-<date>-<trigger>/` and nothing else. All of that isolates
paths **you** choose. The npm cache is a path npm chooses for you, out of
a home directory twenty seats share, and no run before this one had any
reason to look at it. `PW_ROOT` isolates `node_modules`. It does not
isolate the cache, and the cache is the contended resource.
