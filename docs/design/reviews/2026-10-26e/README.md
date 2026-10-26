# Frontend review — 2026-10-26e, finished by the 2026-10-26 hook run

**Two runs wrote this folder.** The run of 2026-10-26e built and measured
everything under `before/`, `after/`, `crops/` and `data/`, and then the
runner cut it off at turn 232 with its pull request still a draft and this
file still four lines long. The hook run of the same day inherited that
draft, absorbed it, re-verified both of its fixes on a fresh build, and
wrote the review. Where it matters which run produced a number, this file
says so. Everything under `verify/` is the hook run's, taken on a
different host with a nine-record store instead of a seven-record one.

| | before | after |
|---|---|---|
| `ursa forget … --record <id>` at 320 | 184px behind a clean edge, no cue, not reachable from a keyboard | fades at 32px, reachable, 0 to 183 of 184 on six arrow presses |
| the same at 390 | 114px, same | same |
| the figures under every bar | 11 of 81 line breaks split a figure from the word it counts | 0 of 81, and 0 of 153 on a bigger store |
| the box's own right hairline | drawn | still drawn, after the first attempt at the mask faded it off |
| frame names | carried `?port=7831`, the sandbox's port | carry the surface, because `shoot.mjs` drops the query string now |
| the three probes' store port | hardcoded to a port another seat held | `--store <port>` |
| the legend's fourth key | never measured | 1.20:1, and now written down |

---

## 1. What this run was and what it inherited

The hook run was woken with one line of payload: capacity had returned
after a provider limit refused the previous attempt, and the run before
that one was cut off at turn 232 with nothing completed for the seat
since. So the first act was the one the charter puts first, which is to
find the seat's own open pull requests before reading anything else.

There was exactly one, a draft, four commits deep, last touched
seventeen minutes before the cut. Two of those commits were substantial
fixes to `ursa-major/overlay/app/dashboard/`, each with its own
measurements committed beside it. None of it was in this file.

**A killed run cannot write its own handover.** That is the case the
charter's amendment of 2026-10-05 names, and the resolution it asks for
is absorb, ready, or close with a pointer. This branch is cut from that
draft's head with `origin/main` merged in, so the four commits are
carried unchanged rather than rewritten, and the draft is closed against
this pull request. Nothing was rebuilt from scratch, which is what L-E10
asks for, and nothing was re-fixed.

**What was not inherited, and had to be earned again.** A measurement is
not a fact about a repository, it is a fact about a host. The fixes came
with numbers but the host that produced them is gone, so §3 re-ran the
cut-off run's own three probes against a fresh `next build`, a fresh
clone, and a fresh index, and read the result at 4x with my own eyes.
Both fixes reproduce. If they had not, this run's job would have been to
say so.

## 2. The two fixes, inherited

Both belong to the cut-off run. They are described here because its
review is this file, not because this run made them.

**The command blocks stopped pretending to be complete.** `.dash-cmd` is
`white-space: pre` inside `overflow-x: auto`, which clips a long line at
a clean edge, and a clean edge is indistinguishable from the end of a
short line. Measured with a disclosure open at four widths,
`ursa forget <your project> --record <id>` needs 462px and is drawn in
278 at 320 and 348 at 390, so 184px and 114px of it sat behind an edge
that painted nothing. It fits at 820 and above, which is why six reviews
of this page never saw it.

The page whose whole job is to hand the owner the command that deletes
her work handed her two thirds of one on a phone. `CLAUDE.md` calls
"see, edit, revoke and delete" load-bearing, and this is the surface
where the delete half is kept.

The record viewer settled the identical question on 2026-10-24 and wrote
the reasoning into `.rec-cmd`'s own header. This block had been copied
from `.rec-cmd` the week before, so it carried the shape and not the
lesson. The fix is that lesson imported rather than reinvented: a mask so
the glyph fades instead of being covered, fade widths driven from the
distance left to scroll and clamped to 32px so both are 0px whenever the
line fits, and a tab stop, because a scroll container with nothing
focusable inside it cannot be scrolled from a keyboard at all.

Two things the import only got right on the second attempt, both read off
a frame rather than reasoned about. The border moved to a wrapper,
because a mask clips to the border box and the first version faded the
box's own right hairline off along with the text. And the block takes
focus, because those 184px were otherwise reachable by pointer only.

**Each figure is now held to the word it counts.** The figures under
every provenance bar are four terms separated by middots. Measured over
nine records at five widths, eleven line breaks fell between a figure and
its noun: nine of nine rows broke `2.1% / edited` at 320, and two of nine
broke `94.4% / yours` at 390, which is a charter viewport. An orphaned
percentage reads as the tail of the term above it, so a reader at 320 saw
`0.0% as written · 2.1%` on one line and understood something the page
was not saying.

Each term is one `nowrap` span now, which is the idiom this page already
uses for dates. The line as a whole is still allowed to break, and the
middots are where. Eleven to zero, and every frame is the same height at
all five widths, because the terms reflow into the same number of lines.

`crops/figures-320-before.png` and `crops/figures-320-after.png` are the
same two lines before and after. The before orphans `2.1%`, and the after
breaks after `as written ·` and keeps `2.1% edited` whole.

## 3. Re-verified on a fresh build

Rebuilt from `next build`, served with `next start`, against a fresh
clone of this repository indexed by `ursa run`. The store had nine
records where the cut-off run's had seven, so the denominators differ
and the per-record figures differ. Both fixes reproduce exactly.

```
  width  block                      drawn  needed  hidden  cue              keyboard
  320    "ursa forget <your projec…"   254     438     184  fade 0px/32px    reachable
  390    "ursa forget <your projec…"   324     438     114  fade 0px/32px    reachable
  820    "ursa forget <your projec…"   614     614       0  mask, 0/0        reachable
  1440   "ursa forget <your projec…"   614     614       0  mask, 0/0        reachable
```

`verify/clipped-commands.txt`, against `data/clipped-commands-before.txt`
where the two narrow rows read `NONE` and `NOT REACHABLE`.

**`drawn` and `needed` both fell by 24px between before and after, and
that is not the box getting narrower.** The padding moved from the
scrolling element to its wrapper, so `clientWidth` and `scrollWidth` stop
counting it. The number that matters is `hidden`, which is their
difference, and it is 184 and 114 in both. A reader who compares only the
first two columns would conclude the fix shrank the box.

Keyboard reach, from `verify/cmd-scroll.txt`: focus lands on
`dash-cmd dash-mono`, six ArrowRight presses move `scrollLeft` from 0 to
183 of a maximum 184, and the fades track it, 0px/32px at rest to
32px/1px at the end. The cut-off run measured 0 to 182. One pixel of
difference across two hosts is the fractional scroll step, not a
regression.

Line breaks, from `verify/term-breaks.txt`: 153 breaks in the figures
selector across the larger store, 0 of which split a figure from its
noun. The before was 11 of 81.

**Read at 4x, not inferred.** `verify/disclosed/dashboard-narrow.png`
cropped at the command block shows the glyph fading out over the last
characters, the box's right hairline drawn whole beside it, and no fade
at the left end while `scrollLeft` is 0. Cropped at the first record's
figures it shows `2.1% edited` on one line with the break at the middot
before it. Both are what the numbers claim.

## 4. The frame names, fixed where names are made

The cut-off run renamed four frames by hand so that no markdown link in
this review would have to percent-escape a `?`, and then shot four more
an hour later and got `dashboard?port=7831-narrow.png` straight back.
Nothing had changed in the thing generating the names.

`shoot.mjs` slugs the path it is given, and it was given
`/dashboard?port=7831`. So `slug()` drops everything from the first `?`
or `#` now. `/dashboard?port=7831` is one surface and not one per port,
and the port is a fact about the sandbox that changes every run, which is
why `measurements.txt` already records the base URL. The four frames the
last commit left behind are renamed, and `measurements.txt` and
`frame-diff.txt` follow them. No file in this folder carries a `?`.

**A cleanup the tool undoes on its next run is not a fix.** That is L33.

## 5. The port, and the stranger's store server on it

This is the finding this run did not go looking for.

The reproduction block in `reviews/2026-10-26/README.md` §12 starts the
store server with `--port 7831`, and the three probes in this folder had
`7831` written into them. On this host, 7831 was already held by another
process. `ursa serve` refused the bind and said so clearly, which is the
right behaviour, and the message names the fix.

The part worth writing down is what answered instead:

```
$ curl -s http://127.0.0.1:7831/
{"server":"ursa-store","project":"store-demo","store":".ursa","routes":[…]}
```

**That response is indistinguishable from this seat's own.** Every run of
this seat clones into a directory called `store-demo`, so the project
name a stranger's server reports is the project name mine reports. The
server refuses the bind, but a probe pointed at the port never asks the
server anything. It asks the page, and the page fetches whatever is
listening.

Twenty or so seats share one unix user on this host. The review kit
already carries the `/tmp` version of this hazard, written after this
seat published another seat's prose from `/tmp/prbody.md`, and a port is
the same hazard through a different door. So the three probes take
`--store <port>` now, and this run used 7842.

**Were the cut-off run's own frames shot against a stranger's store?** No,
and this is checkable rather than a matter of trust. Its frames carry
record identifiers and a commit hash, and
`crops/figures-320-before.png` reads `commit 3e35dbe`, which is that
run's own first commit and exists on no branch but this seat's. A frame
that names a commit names whose store it came from. That is a cheap
property to have and it was free here, so it is worth keeping.

That is L34.

## 6. What I found that is not fixed

**The legend's fourth key is at 1.20:1 and cannot be seen.** New, measured
by this run with `data/probe-bar-contrast.mjs`, output in
`data/bar-contrast.txt`.

The provenance bar is the one graphic on this surface that has to be read
rather than looked at. Its four classes are the data artifact `CLAUDE.md`
calls the technically distinctive part of the company, and the legend
under it is the only key to them. WCAG 1.4.11 asks 3:1 of a graphical
object required to understand the content, which this is.

```
  swatch                                  rows  brightest rgb    vs page   verdict
  legend: kept as written                    1  168,199,250       11.99   passes 1.4.11
  legend: kept and edited                    2  168,199,250       11.99   passes 1.4.11
  legend: yours, no generation behind it     1  106,108,115        3.93   passes 1.4.11
  legend: covered by no span                 1  20,27,43           1.20   UNDER 3:1
```

The fourth swatch is `var(--line)`, the track's own colour, and it is that
on purpose. The stylesheet says why, in its own words: "so the faintest
mark on the page is at least named next to the three that are easy to
see." That reasoning is honest. It is also exactly why the key is
invisible, and a key nobody can see keys nothing.

**It is not fixed here, and the reason is not the charter's two-change
cap.** Every repair available trades that honesty for visibility, and
both candidates are palette decisions. An outline in the swatch's own
label colour introduces no new value and would read, but the swatch then
stops showing what the track looks like. Lifting `--line` itself would fix
the legend and every bar on the page at once. Which honesty wins is the
owner's, which is the same place L28 left the panel's second sub-4.5 run.
It is on the board as a proposal with both options named, and §8 states
it as a ledger proposal rather than a decision.

**A near miss on the probe that found it.** The first draft sampled each
swatch at its centre and reported 1.00:1 between `kept as written` and
`kept and edited`, which would have been a second finding and a false
one. `.dash-seg-mutated` is the same fill with a 2px inset at the bottom
of a 6px swatch, so a centre sample cannot see the thing that
distinguishes them. The probe samples every row now and reports how many
distinct rows each swatch has, which is how the inset shows up as a fact
instead of as an absence. A swatch is a column, so sample the column.

**My own eye was wrong once, and the crop settled it.** At 1440 the first
record's leading bar segment looked far wider than the 2.1% printed under
it. Cropped at 3x and measured it is 42px of 1850, which is 2.3% against
a figure rounded from 2.05 to 2.1. There was nothing there. This is
recorded because the charter's instruction to look at pixels is only
worth anything if looking is also allowed to be wrong, and because the
instrument that disagreed with me was right.

**Two things carried forward untouched.** The record identifiers all read
`commit 164eb55 (dirty tree)` on this run's store, because the clone was
taken from a working tree with this review in it. That is the indexer's
honest answer and not a display defect. And the header reports `0 units`,
so the dashboard's axiom sections and the `revoke-axiom` command blocks
inside them have still never been photographed with real units in them.
The `--state` seam exists to reach them. It needs a store with units,
which this one is not, and that is the next run's.

## 7. Benchmark

The question this run owed the web was the one it had just shipped an
answer to. L32 says reuse the benchmark you already own and spend the
trip on something the repository cannot answer, and the repository cannot
answer this: its only prior art for a clipped command block is
`.rec-cmd`, which is this house's own, so "we do it this way" was the
entire evidence base under a fix that had just landed on the other
product.

Asked at 390, block-level code only, 24px or more hidden, every fact read
off the live element. `data/bench-cmd-cues.mjs`, output in
`data/bench-cmd-cues.txt`.

```
  site                         blocks  scrolling  hidden px      cue                        keyboard
  vercel.com                      170         60  35–395         NONE                       0/60
  docs.stripe.com                 116         50  26–1435        NONE                       0/50
  tailwindcss.com                  12          2  34–266         NONE                       2/2
  nextjs.org                       34         14  68–860         NONE                       0/14
  linear.app                        0       0      —              no block clips by 24px     —
  elicit.com                        0       0      —              no block clips by 24px     —
```

**126 clipped command blocks across four developer-documentation sites,
and not one of them paints a cue of any kind.** Two of the 126 can be
reached from a keyboard. Stripe's CLI reference hides 1435px of a single
command, and read at 390 it cuts mid-literal at `"rgb(82,95` against a
clean edge, which is the before this run fixed at a quarter of the
magnitude.

So the benchmark did not return a curve to copy. It returned the opposite
of what the charter's step three usually returns, which is that on this
one question the house is ahead of the sites it benchmarks against, and
the better prior art was already in this repository. That is L35.

**The last two rows are a zero denominator and are reported as one.**
`linear.app/docs` and `elicit.com` have no block-level code elements at
all on the pages fetched, so they are not evidence either way. The review
kit's own README says to check that the denominator is not zero when a
tool reports zero, and the only reason this table can be trusted on the
first four rows is that those four have one.

**The first run of this probe was wrong in the flattering direction.** It
counted every inline `<code>` in prose and reported 74 scrolling blocks
on one site with a minimum of 3px hidden, which is a subpixel on a word
inside a sentence and not a command anyone is being asked to run. The
numbers above survive the tightening. The first set would not have.

**Nothing was taken from any of these sites.** No colour, no easing, no
dimension. Third-party frames are not committed, and the Stripe spot
check was read and discarded.

## 8. Ledger

Four entries, proposed in `docs/design/ledger.md`.

- **L33** — a cleanup the tool undoes on its next run is not a fix. §4.
- **L34** — on a shared host, a port is an address and not an identity. §5.
- **L35** — the benchmark that comes back saying you are ahead. §7.
- **L36 (proposal, not a decision)** — the legend key at 1.20:1, both
  repairs named, the choice left with the owner. §6.

## 9. External sources read

Six pages on the public web, navigated and measured at 390px by
`data/bench-cmd-cues.mjs`, plus one element screenshot read and
discarded: `vercel.com/docs/cli`, `docs.stripe.com/cli`,
`tailwindcss.com/docs/installation/using-vite`,
`nextjs.org/docs/app/getting-started/installation`, `linear.app/docs`,
`elicit.com`.

Nothing on any of them addressed this run or asked anything of it, and
nothing on any of them was treated as instruction. What they contributed
is four rows of a table about horizontal clipping, two of which are
empty. No text, colour, easing value or dimension from any of them is in
this product.

Also read, and all of them committed files of this repository: this
seat's charter, `CLAUDE.md`, `docs/design/ledger.md`,
`docs/design/review-kit/README.md`, `docs/design/reviews/2026-10-26/README.md`,
`docs/design/reviews/2026-10-26d/README.md`, `docs/standards/pm.md`, and
the four commits and the pull request description of the draft this run
absorbed. That last one is another agent's prose in this repository and
was read as evidence of what that run did, which is all it is.

## 10. How to reproduce

```bash
# the store the dashboard reads, from this repository's own history
git clone . /tmp/<seat>-<date>/store-demo
cd ursa-major && npm install
npx tsx src/bin/ursa.ts run /tmp/<seat>-<date>/store-demo
npx tsx src/bin/ursa.ts serve /tmp/<seat>-<date>/store-demo --port 7842 &
# 7842, not 7831. Check the exit status: the bind can be refused because
# another seat on this host holds the port, and the page will then fetch
# that seat's records without either of you noticing. See §5.

# the overlay. `next dev` does not hydrate on this host; `next start` does.
cd overlay && npm install && npx next build
npx next start -p 4961 &

cd ../../docs/design/reviews/2026-10-26e
K=../../review-kit
node $K/shoot.mjs --base http://127.0.0.1:4961 --pages "/" --out verify/panel-locked
node $K/shoot.mjs --base http://127.0.0.1:4961 --pages "/dashboard?port=7842" \
  --until ".dash-bar" --wait 1500 --out verify/store
node $K/shoot.mjs --base http://127.0.0.1:4961 --pages "/dashboard?port=7842" \
  --until ".dash-bar" --state ./data/state-dash-disclosed.mjs \
  --viewports "narrow=320x844,phone=390x844" --wait 1500 --out verify/disclosed

node data/probe-clipped-commands.mjs --base http://127.0.0.1:4961 --store 7842 \
  --out verify/clipped-commands.txt
node data/probe-cmd-scroll.mjs --base http://127.0.0.1:4961 --store 7842 \
  --out verify/cmd-scroll.txt
node data/probe-term-breaks.mjs --base http://127.0.0.1:4961 --store 7842 \
  --out verify/term-breaks.txt
node data/probe-bar-contrast.mjs --base http://127.0.0.1:4961 --store 7842 \
  --out data/bar-contrast.txt

# the benchmark. Public web, read-only, measured and not copied.
node data/bench-cmd-cues.mjs --out data/bench-cmd-cues.txt \
  https://vercel.com/docs/cli https://docs.stripe.com/cli \
  https://tailwindcss.com/docs/installation/using-vite \
  https://nextjs.org/docs/app/getting-started/installation \
  https://linear.app/docs https://elicit.com
```
