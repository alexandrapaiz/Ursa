# The review kit

Tools this seat uses every run, kept here instead of in a dated review
directory, because three of the four runs before 2026-10-24 rewrote the
same scripts from scratch.

Nothing in here is a dependency of either site. `playwright` is installed
without saving and the kit finds it in whichever sibling package has it.
**Install it outside both sites**, in a directory neither `npm install`
will ever touch, and point `PW_ROOT` at it:

```bash
# from your checkout root, with <id> this run's own suffix.
# One directory holds everything this run writes, so there is one thing
# to delete at the end and one place to look for what a dead run left.
export FE_RUN="$PWD/.fe-run-<id>"
mkdir -p "$FE_RUN/pw"

cd "$FE_RUN/pw" \
  && npm i --no-save playwright --cache "$FE_RUN/npm-cache" \
  && npx playwright install chromium
export PW_ROOT="$FE_RUN/pw/node_modules"
cd -

# before any npm in a tree: is one already running there?
ps -eo pid,args | grep -v grep | grep -q "npm" && \
  for pid in $(pgrep -f "npm (ci|install)"); do \
    [ "$(readlink -f /proc/$pid/cwd 2>/dev/null)" = "$PWD" ] && \
      echo "REFUSING: npm $pid is live in this tree"; \
  done

# and at the end of the run: stop what you started, THEN delete what you
# wrote. One command does both and prints a count line either way.
bash docs/design/review-kit/teardown.sh            # --dry-run to look first
```

**Run the teardown even if you wrote nothing**, because the server is the
half that outlives the directory. `rm -rf "$FE_RUN"` was this step for a
week and it is not sufficient on its own: deleting a server's working
directory does not stop the server, it only removes the record of which
run owned it, since from then on the only trace is a `(deleted)` symlink
in `/proc`. Measured 2026-11-09: two `next-server` processes were still
listening on this box from `/tmp/epito-ursa-frontend-BBhu7I/ursa-minor`
and `/tmp/epito-ursa-frontend-ZIcHr7/ursa-minor`, both deleted, aged 2h54m
and 1h24m, on a volume at 94 per cent. Both runs' directories were gone,
so the documented step had run and done its half correctly. L63.

`--cache` is not optional and `PW_ROOT` does not cover it: `PW_ROOT`
isolates `node_modules` and the cache is a separate shared resource one
directory up, which is L55 and L56 and the scratch-path rule near the
bottom of this file.

**Three things in that block changed on 2026-11-02 (run h), each because
this seat broke them that morning.**

The playwright prefix moved from `/tmp/pw` into the run's own directory.
The bare `/tmp` name was this file contradicting itself: the scratch rule
near the bottom says write inside your checkout and names the reason,
and this block at the top said `/tmp/pw` anyway. Both halves are about
the same hazard and the top one is the half a run reads first.

The deletion at the end is now the whole run directory. L56 told a run to
delete its npm cache and nothing told it to delete anything else, so the
cache was the one pile that got collected and the larger ones did not. On
the morning of 2026-11-02 this seat's own earlier runs had 321M sitting
on the volume in three directories, none of them a cache, with three
server processes still pointed at two of them six and seven hours after
the runs ended. One directory per run means there is one `rm -rf`, and
the next run of the seat can recognise `.fe-run-*` from another day as
garbage without knowing what was in it.

The `/proc/<pid>/cwd` check is the only reliable answer to "is an install
already running in this tree", which is the question L51's rule needs
answered and does not say how to answer. An exit status will not do it;
see the end of this file.

`PW_ROOT` is the first entry in `lib/browser.mjs`'s search order and has
been since that file was written, and until 2026-11-02 it appeared in no
document and in one error string. The line this block used to carry told
you to install into `ursa-minor`, which is the one package a run that is
about to build `ursa-minor` must not install into. L49 found the half of
that where a plain `npm install` silently removes the kit. L51 found the
other half: the kit's install and the site's install are two commands a
run issues minutes apart in the same tree, and run together they leave a
package half-unpacked, after which the build blames the workspace root
rather than the install. A prefix nothing else owns is immune to both.

| file | what it does |
|---|---|
| `lib/browser.mjs` | Launches chromium. On a host with no root it fetches the shared libraries chromium needs with `apt-get download` and `dpkg-deb -x`, which need no privilege, and retries. |
| `shoot.mjs` | Full-page PNGs at 1x across the page by viewport matrix, measuring horizontal overflow on each and naming the widest element when a frame overflows. Frames are frozen by default; `--live` lets the sky animate. `--wait <ms>` sets the settle, `--until <selector>` gates the shutter on content, which any page that fetches after hydration needs, and `--state <module.mjs>` drives the page into a state first. `--viewports name=WxH,…` replaces the three-viewport matrix outright, which is how anything below 390 gets photographed at all; the set's `measurements.txt` records which matrix produced it. `--pin-now <iso>` pins the page's `Date`, verified in the page before each shutter, for a surface that reads the clock. |
| `measure-hit-areas.mjs` | The real tappable area of every control, probed outward one CSS pixel at a time so an `::after` overlay is seen rather than parsed. Promoted here on 2026-10-24g from `reviews/2026-10-24e/`, where it was written; `--base`, `--pages name=/path,…`, `--out`, `--json`, `--until`, and `--state` since 2026-10-26. Since 2026-11-09 (run c) the 2.5.8 sentence test counts words in an inline, non-interactive sibling **element** as well as in a bare text node, because an inline link whose neighbouring words are wrapped in a `<span>` is in the same sentence and the same line box; it was reporting the set view's record address link as a standalone control short of the floor, six times. The fixture's case 9, two abutting inline-block buttons, is what keeps that from exempting a row of controls. |
| `measure-narrow.mjs` | What every surface does below 390, which is the narrowest viewport the charter reviews. Reports a clipped edge (unreachable) separately from an overflow (scrollable), attributes offenders to the nearest scroll container, and exempts full-bleed decoration, screen-reader text and closed drawers. Waits for the geometry to stop changing rather than for a settle somebody guessed. Written 2026-10-26b out of L25; its six exemptions and how each was earned are in its own header. `--base`, `--pages`, `--widths`, `--height`, `--until`, `--state`, `--out`, `--json`. |
| `measure-contrast.mjs` | The WCAG ratio of every run of text against the pixels actually behind it, including placeholders. The backdrop is photographed, never read off the stylesheet, so a starfield, a gradient and an ancestor's `opacity` are all in the number. Reports a per-pixel median, fifth percentile and worst, exempts inactive components under 1.4.3, and refuses to answer for a page that moved between its two frames. Written 2026-10-25c. Since 2026-11-02e it narrates on **stderr**, one line per page with the five stage timings, because until then it wrote nothing at all until after `browser.close()` and a run making progress was indistinguishable from a wedged one. That cost a whole review its contrast number; L53. `--base`, `--pages name=/path,…`, `--only`, `--out`, `--json [path]`, `--until`. |
| `measure-focus.mjs` | The keyboard pass, written 2026-11-02 (run f). Walks the tab ring with real Tab presses, compares what Tab reaches against every focusable element the DOM offers, and names the controls in the difference. Then photographs each stop focused and blurred: the indicator is whatever pixels differ, so an outline, a box-shadow, a wash and a pseudo-element all answer without being named in advance, and each indicator pixel's ratio is taken against its own unfocused colour, which is the adjacency 1.4.11 asks for. Carries the SHARE of the indicator above 3:1 as well as its median, because a ring visible on one edge and invisible on the other three is what no single statistic shows. A third blurred frame gates on drift: a stop whose neighbourhood moves is UNSTABLE rather than given a number. The 2.4.11 area column is reported and never failed on, since the ring's weight is identity. Since 2026-11-02 (run h), after its first outing on the real site: the context pins `scroll-behavior`, because the site declares `smooth` and the tool was photographing a rectangle the control had scrolled out of (L58); the box is re-read after the focus lands rather than before; a stop that cannot be photographed is a row rather than the end of the run, which cost a whole viewport's table the first time; a stop Tab reaches that the DOM never declared gets a row too, instead of the silent `continue` that was reporting one direction of a set difference; a control under 8px on a side is photographed over its nearest ancestor, because an `sr-only` input's ring is drawn on its label and a crop around the input contains none of it; and a ring plus a low-contrast wash is `COMPOSITE` rather than `BELOW_FLOOR` when the clearing pixels alone cover a 1px perimeter of the control (L60). Since 2026-11-09: a stop the enumeration never declared is identified by a mark stamped on the element rather than by its coordinates, because `getBoundingClientRect` is viewport-relative and Tab scrolls each stop into view, so two undeclared stops of the same tag on a tall page hand the walk one identity and it stops short, reporting everything behind them as unreachable (L61). `--base`, `--pages`, `--only`, `--viewports`, `--until`, `--state`, `--out`, `--json`, `--frames`. Since 2026-11-09 (run c): the walk resets the **sequential focus navigation starting point** before its first Tab instead of calling `blur()`, which clears the focused element and does not move that point. Under `--state` the walk therefore used to begin wherever the drive left the focus and report everything above it as unreachable: on the set view, 3 stops of 11 and five false unreachables. No committed number was wrong, because the only `--state` module used with this tool before then set attributes and never moved focus. Selftest `selftest/check-focus.mjs`, 31 assertions. |
| `measure-swatches.mjs` | The WCAG 1.4.11 ratio of every swatch in a legend against the pixels behind it, and of each swatch's marks against each other. Samples **every pixel** of the swatch rather than its centre column, which is the only sample a 1px ring inside the box cannot fool, and reports the share of the area clearing 3:1 alongside the ratio, because one bright pixel in a flat box passes a ratio on its own. Promoted 2026-10-27 from the probe that found the dashboard's fourth provenance key at 1.20:1; L36, L43. |
| `measure-floor.py` | How much of a frame set is actually deterministic, over **N** independent shoots rather than a pair. Reports how many of the C(N,2) pairs drawn from them would have seen no floor at all, which is the number a two-shoot diff cannot produce and the reason this file exists; L48. Selftest `selftest/check-floor.py`, 12 assertions. |
| `verify-hover.mjs` | Every hover state on the site, photographed as a **pair**: one frame at rest and one hovered and settled, over the same frozen sky, plus what the computed style did. `diff-frames.py rest hover` then says how many pixels the hover is worth. The pair is the point: three of this site's hover rules style a descendant rather than the hovered element, so a computed-style read alone reports "nothing changed" for them, and a wash too faint to register in a PNG is what the property read catches instead. A `disabled` control gets the verdict `by-design-disabled`, because a correctly inert hover and a broken spring print the same `none`. |
| `lib/freeze.mjs` | Pins the animation clock and seeds `Math.random` before any page script runs, so the starfield draws the same sky twice. Without it 6 of the 15 review frames differ from themselves by up to 19,140 pixels. Since 2026-11-02 it also pins the page's `Date` on request, which is `shoot.mjs --pin-now`. |
| `lib/pin-clock.mjs` | Pins `Date` in a **server** process, as a `node --import` preload, so a timestamp the server stamps into a payload stops moving between two shoots. Written 2026-11-02 out of L47: the overlay dashboard's `read at HH:MM:SS` comes from `serve.ts`, not from the browser, so no init script can reach it. Refuses rather than defaulting, because a preload that quietly does nothing is the defect it exists to repair. |
| `diff-frames.py` | Counts the pixels that differ between two frame sets, per frame, with the row and column range. Only meaningful on frozen frames. |
| `crop.mjs` | Magnifies a named region of a frame, so a 6px bar or a 2px foot can actually be judged. `--in`, `--out`, `--box x,y,w,h`, `--scale`. Written in `reviews/2026-10-24g/`, promoted here on 2026-10-24h, where a second run wanted it. |
| `hover.mjs` | Hovers an element and scrubs its transition to an exact millisecond, or `--curve` to sweep the whole thing. Host-independent, which is the point. |
| `sample-motion.mjs` | Captures a hover three ways: a frame series, the inline style writes a library makes, and the browser's own animation engine. |
| `fit-motion.mjs` | Characterises a capture. Fits start time and duration as free parameters, names the curve, and says `UNRESOLVED` rather than guessing when the capture is too sparse. |
| `teardown.sh` | Stops this checkout's dev servers and deletes the run directory, in that order, and prints `servers_stopped=/servers_left=/dirs_removed=` on every path so a teardown that looked and found nothing is distinguishable from one that did not look. Scoped by `/proc/<pid>/cwd` to paths matching `epito-ursa-frontend-*`, because /tmp is shared between every seat on this host and a sibling's server is exactly what a sibling is mid-screenshot against; `--orphans` additionally takes a previous run of this seat, but only where that run's directory is already deleted. Matches **argv[0]** and never `pgrep -f`: a command line that merely mentions a server belongs to a shell, and the first version of this script printed `would stop` for the shell it was invoked from. Selftest `selftest/check-teardown.sh`, 9 assertions. Written 2026-11-09 out of L63. |
| `check-redaction.mjs` | The repository's redaction gate, run locally before pushing. Reads the three patterns, the exclusions and the allowlist out of `.github/workflows/redaction-gate.yml` on every run rather than holding a copy, and matches with the same `grep -rInE` the gate calls, so it cannot drift from the thing it predicts. Exits 2 and says so if it cannot parse the gate, because a checker that reports zero rules and a checker that reports zero hits print the same word. `--root`, `--json`. Written 2026-10-27 after the gate was red three times on one fixture line with nothing local able to see it. |
| `read-spring.mjs` | Reads a spring out of a `linear()` easing: overshoot, damping ratio, frequency, stiffness. |
| `make-spring.mjs` | Writes a spring into a `linear()` easing, which is how a spring ships in CSS with no library. |

**`--state` measures a surface rather than a path.** A module whose
default export is `async (page, name) => {}`, run after the navigation
and after `--until`, taken by both `shoot.mjs` and
`measure-hit-areas.mjs` since 2026-10-26. It exists because the
overlay's panel draws a passphrase field until a key is derived and
three other controls afterwards, so three quarters of that surface was
out of reach of the instrument whose job is to reach it. Its path is
printed in the output. `reviews/2026-10-26/data/state-panel-unlocked.mjs`
is the first one.

**The three review viewports start at 390, so a run that wants to know
what happens below it has to ask on purpose.** `measure-narrow.mjs`
counts and `shoot.mjs --viewports` photographs. Both were written on
2026-10-26b, the run after L25 found a panel that was cut off on the left
and overflowing on the right at the same time below 380, through six
reviews that could not have seen it. Calibrate the narrow sweep the way
this README asks for everything else: point it at the overlay, whose
before and after at these widths are written down in L25, before
believing it about a surface nobody has measured.

**Every instrument here that produces a headline has a selftest, and
until 2026-11-02 (run f) the table above listed none of them.** Four of
the kit's own tools were missing from it too, which matters more than it
reads: this README is the index, the index is why the kit exists rather
than a fourth rewrite of the same script in a dated folder, and a tool
absent from it is a tool the next run writes again. The set, each
runnable on its own with no server and no network:

| selftest | what it holds the tool to |
|---|---|
| `selftest/check-contrast.mjs` | 17 hand-computable ratios for `measure-contrast.mjs`, over `selftest/contrast.html`. |
| `selftest/check-hit-areas.mjs` | That `measure-hit-areas.mjs` can still fail. Eighteen expectations since 2026-11-09, the last two being that words in a sibling `<span>` exempt an inline link the way a bare text node does, and that two abutting controls with no prose between them are still held to the floor. Its headline on the real site went to zero on 2026-10-25b, and zero is also what a tool that had stopped looking would print, so this serves `selftest/hit-areas.html`, whose right answers are built in, and asserts each of the four verdicts actually fires. |
| `selftest/check-focus.mjs` | 31 assertions for `measure-focus.mjs`, including a focus trap it has to report as unreachable controls rather than a short clean ring, L36's two hand-taken ratios recomputed by a different code path, and a 4000px page whose three undeclared stops all land at the same viewport coordinate, which the walk has to run to the end of. That last fixture fails five of its six assertions on the code of 2026-11-02, which is how it was checked. `after-drive.html` is the same discipline for the walk's starting point: five controls, a drive that clicks the fourth, and three of its four assertions fail on the code of 2026-11-09 morning, reporting one stop and four false unreachables. |
| `selftest/check-teardown.sh` | 9 assertions for `teardown.sh`, with real processes rather than mocked paths, since the subject reads `/proc`. The two load-bearing ones are a live server in another seat's tree, which must be left alone under `--orphans` as well as without it, and a process that only names a server on its command line, which is what the `pgrep -f` version matched and would have killed. Every decoy is detached from the test's stdout: a background process holding the pipe open makes a finished test look like a hung one. |
| `selftest/check-floor.py` | 12 assertions for `measure-floor.py`, the load-bearing one being that six shoots split four and two report seven blind pairs of fifteen. |
| `selftest/check-pin-now.mjs` | That `shoot.mjs --pin-now` pins the page's clock and refuses the two ways it can be asked for what it cannot do. It needs its own fixture because neither product reads the wall clock client-side, so no page here would prove the flag works. |
| `selftest/check-redaction.mjs` | That each of the gate's three rules still fires, that the allowlist still forgives what the gate forgives, and that an unparseable gate is a refusal. |

**`selftest/check-redaction.mjs` writes its fixtures at run time and
commits none of them.** A fixture for a redaction checker has to contain
the three things the gate refuses, so committing one turns the gate red
on the repository that holds the tool for keeping it green. The fixtures
are assembled from pieces in code under `tmpdir()`, which is also why
none of the three patterns appears as a literal in that file. Run it
with `node docs/design/review-kit/selftest/check-redaction.mjs`; it
asserts that each of the three rules still fires on its own, that the
allowlist still forgives what the gate forgives, and that a gate it
cannot parse is a refusal rather than a pass. The last expectation is
there because the tool failed it when first written.

**A sweep like this is mostly exemptions, and getting one wrong looks
exactly like a pass.** Five of the six in `measure-narrow.mjs` were found
by the instrument being wrong first, four of them on benchmark sites
rather than on ours. If you add a sixth surface and it reports a failure
that never goes away, read the header before believing it, and if it
reports zero, check that the denominator is not zero too (L19, L23).

**`--until` is a gate on a selector, not on a state.** Measured
2026-10-26: running the overlay's two dashboard states in one
invocation under `--until "button"` measured one of them in the wrong
state and reported 1 target where there are 16, and exited 0. Gate each
state on a selector only that state has.

## When there is no disk for `npm install`, there is still a browser

Measured 2026-11-09 (run e). The volume `/tmp` and `/srv/asc` share is a
single 45G filesystem carrying about twenty seats' checkouts, and it was at
100 per cent with 392M free. Run `-c` had attempted an install at a
comparable figure that morning and it "consumed all of it and left the tree
half-unpacked", which is the anti-idempotent failure in
`docs/agents/runner-facts.md` §18/§82: each retry needs more room than the
last.

**The browser is not on the volume that is full.** Playwright's chromium and
a Python Playwright are both cached under `/srv/asc/home/.cache/`, so
driving a browser against a fixture, or against anything already built,
costs zero disk. Three facts about that path on this host:

- **It is `aarch64`.** The libs prefix is laid out under
  `usr/lib/aarch64-linux-gnu`. `lib/browser.mjs` joins
  `x86_64-linux-gnu` onto `LD_LIBRARY_PATH`, which is the right name on a
  different host and resolves to nothing here.
- **The full `chrome` does not start and `chrome-headless-shell` does.**
  With the prefix on the path, `ldd` reports `libatk-bridge-2.0.so.0`,
  `libcups.so.2`, `libcairo.so.2` and `libpango-1.0.so.0` missing from
  `chrome`, and reports nothing missing from the shell. Six libraries went
  into `CHROMIUM_LIBS` that morning one failed launch at a time. These four
  are not needed at all if the shell is what you launch.
- **Pass `executable_path` rather than letting the library resolve it.**
  Python Playwright 1.64.1 asks for build 1248; 1254 is what is installed,
  and the error it prints for that ("Executable doesn't exist") is the same
  one it prints when no browser is installed at all.

```bash
V=/srv/asc/home/.cache/asc-frontend-venv
L=/srv/asc/home/.cache/asc-frontend-libs
S=/srv/asc/home/.cache/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-linux-arm64/chrome-headless-shell
LD_LIBRARY_PATH="$L/usr/lib/aarch64-linux-gnu:$L/usr/lib" "$V/bin/python3" your-script.py
# ... launch(executable_path=S)
```

Both of this run's instruments are written against it:
`reviews/2026-11-09-message-e/data/measure-row-busy.py` and
`check-wash-guard.py`. What this path cannot do is render the site, so a
run on it measures fixtures over the real stylesheet and has to say so;
see that run's notes §1 for where the line falls.

## Three ways a driven dev server looks broken when it is only refusing

Measured 2026-11-09 (run e), reaching `/record`'s set view. Each of these
presents as a hung or dead page, and none of them logs anything that names
itself. Together they cost more of that run than the defect it was chasing.

- **Drive `localhost`, never `127.0.0.1`.** Next refuses dev requests from
  an origin outside `allowedDevOrigins`, so the client runtime never starts
  and the page stays as server-rendered HTML. Typed text still lands in the
  DOM and still reads back correctly from `input.value`, but no React state
  updates, so anything gated on state — here `disabled={busy || !address}`
  — stays gated forever. The only symptom is a failed HMR websocket, which
  looks like an unrelated dev-tooling complaint. **Check hydration by
  asserting on a control that state controls, not on the value you typed.**
- **A field under a tap-target overlay cannot be clicked.** `.rec-field` is
  a label carrying the 44px press over the input, so a click at the input's
  own box is intercepted and times out at 30s. `page.focus()` then type.
  This is L29 arriving as an instrument failure rather than a site one.
- **Scope the submit button to its own form.** `/record` renders two
  address forms, so a bare `button[type="submit"]` resolves to two elements,
  takes the first, and waits 30s for a button that is disabled because its
  own field is empty.

`reviews/2026-11-09-message-e/data/drive-real-set-view.py` carries all
three in its header and is the worked example.

**And one about the frames, not the drive.** That script clips to the row
after `scrollIntoView`, which lands at a different offset on each load, so
its frames are not pixel-comparable between two runs of it. The run that
wrote it published no diff for them and said so. If you need a pixel
comparison across arms, clip to something that does not move, or do not
scroll.

## Three things to know before you trust a number out of this

**Calibrate first.** Point `sample-motion.mjs` and `fit-motion.mjs` at
something whose answer you already know. `.rec-action` in
`ursa-minor/app/globals.css` declares 160ms on
`cubic-bezier(0.25, 0.46, 0.45, 0.94)`, and the kit reads it back as
out-quad over 152 to 164ms. If it does not, fix the kit before believing
it about anything else.

**Reading computed style every frame changes what you are measuring.** It
forces a style recalculation per frame, which on a heavy page halves the
frame rate and makes every motion look slower than it is. Use
`--writes-only` when the page is busy, and check `cadenceMs` in the
output before believing a fit.

**The freeze makes two loads identical, not two shutters.** Measured
2026-10-25c while building `measure-contrast.mjs`: two consecutive
full-page screenshots of the frozen home page at 390px differ by 4,456
pixels of sky, while the same page loaded twice is bit-identical. So any
tool that needs two frames of one page has to take them from two loads,
which is what `measure-contrast.mjs` does with a second context. A tool
that changes the page and shoots again is measuring the sky as well as
the change.

**A pixel count from a `--live` frame is a fact about the starfield.** Two
`--live` shoots of one build differ by 4,921 to 19,140 pixels on the home
page and the 404 page, and by 0 on every `/record*` frame. Four reviews
reported frame differences before anyone established that floor. The
freeze is on by default now, and `measurements.txt` says in its first line
which mode produced the set.

**A fixed settle is a race on any page that fetches its own data.** The
dashboard in `ursa-major/overlay/` photographed its own loading state at
the 400ms default, and at 1500ms two viewports of three were right and
the third was still racing. Use `--until` with a selector that only
exists once the data has landed. `measure-hit-areas.mjs` failed the same
way and worse: it reported `0 targets seen` instead of erroring.

**`next dev` and `next start` are not interchangeable for this.** On the
2026-10-24 host the overlay's client components never hydrated under the
dev server, with a failed HMR handshake and no error on the page, so
every frame of that app has to come from `next build && next start`.

**A frame rate measured in a sandbox is a fact about the sandbox.** With
no GPU, chromium falls back to SwiftShader and rasterises on the CPU, and
anything with a WebGL layer collapses. `sample-motion.mjs` records the
renderer for exactly this reason. Scrub with `hover.mjs` when you need a
number that two machines can compare.

**A file you write outside your checkout goes to a path you invented.**
Not to a path that describes its contents. On 2026-10-24g this seat wrote
a pull request body to `/tmp/prbody.md`, another seat on the same host
wrote its own body to the same path, and for about ninety seconds this
seat's pull request published another seat's prose. Twenty or so seats
share one unix user and one `/tmp` here. A parse that succeeds is no
evidence of authorship, so nothing at the read can catch it.

**Write scratch inside your own checkout**, in a root-level dot-entry
such as `.fe-run-<id>/`, and nothing outside it. That covers scratch
files, server logs and anything handed to `--body-file`. The checkout is
the one directory the host hands a single run, and `.gitignore` ignores
every root-level dot-entry, so the path is private by construction and
cannot be committed by accident. This line used to say
`/tmp/<seat>-<date>-<trigger>/`, which is a namespaced guess at privacy
rather than privacy, and on 2026-11-02 this seat's own earlier run read
it and reached for the bare name `/tmp/npm-fe-f` anyway.

**That includes the path npm chooses for you.** Every `npm` this seat
runs passes `--cache <checkout>/.fe-run-<id>/npm-cache`, because npm's
content-addressed cache defaults into a home directory twenty seats
share and a collision there empties `node_modules` before it fails, so
the tree ends up worse than before the command ran. L55 found that and
L56 measured the remedy: install 611 packages in 4m48s and a clean
build behind it, at a cost of **176M of disk per project per run** on a
45G volume that `/tmp` and `/srv/asc` share and that runs at 100%. So
**delete the cache before the run ends.** Nothing on this host collects
run scratch, and a cache left behind is 176M nobody will recognise as
garbage.

**After a rebuild, check that the page's own stylesheet answers 200
before you measure anything.** On 2026-11-02 this seat rebuilt
`ursa-minor` while the previous `next start` still held the port. That
server went on serving HTML whose stylesheet chunk the rebuild had
replaced, so the link 404'd into a 500 and every page rendered unstyled.
Three viewports of focus measurements were taken that way and all of them
looked reasonable. What caught it was 390 and 1440 reporting identical
control boxes, which a responsive layout cannot do. Nothing else would
have.

```bash
css=$(curl -s "$BASE/record" | grep -o '/_next/static/chunks/[^"]*\.css' | head -1)
[ -n "$css" ] || { echo "NO STYLESHEET LINK FOUND: the check did not run"; exit 1; }
[ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$css")" = 200 ] || echo "STALE SERVER"
```

The emptiness guard on the second line is not decoration. Without it a
grep that matches nothing leaves `$css` empty, the fetch falls back to
`$BASE` itself, the page answers 200, and the check prints a pass for
having tested the home page instead of a stylesheet. A run on 2026-11-09
did exactly that by reaching for `/_next/static/css/` from memory rather
than copying the pattern above, and the only reason it noticed was that
it looked at the empty variable. A check whose failure mode is to
silently measure something else is worse than no check, because it is
cited as evidence afterwards.

**Never wait on a string your own command line contains.** A loop like
`while pgrep -f "[c]heck-focus"; do sleep 10; done` never exits: `pgrep -f`
matches full command lines, the `[c]` bracket is a `grep` idiom that
`pgrep`'s regex reads as a one-character class, and the watching shell
carries the string it is watching for. Wait on a pid. L57.

**The same rule for `pkill -f`, where the failure is worse than a hang.**
On 2026-11-09 this seat ended a run with

```bash
pkill -f "next start -p 4981"; rm -rf .fe-run-1109 ursa-minor/node_modules
```

on one line. `pkill -f` matched the shell running that very line, killed
it at the semicolon, and the cleanup never ran. The server did stop, the
exit code was 144, and the only reason the scratch was not left on the
volume is that the run checked afterwards instead of assuming. With
`pgrep` the cost is a loop that never ends, which announces itself. With
`pkill` the cost is every command after it on the line, silently. Kill a
pid you read from `/proc`, or put the kill in a line of its own and
verify it separately.

The run that built this is `docs/design/reviews/2026-10-24/`, the cache
paragraph is `docs/design/reviews/2026-11-02-message-f/` §2.1, and the
two paragraphs above are `docs/design/reviews/2026-11-02-message-h/` §4
and §6.
