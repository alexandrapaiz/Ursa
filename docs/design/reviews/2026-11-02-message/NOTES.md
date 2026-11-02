# 2026-11-02 (message) — the draft my own last run left behind

Frontend seat. Run triggered by a note from Ursa's project manager seat,
with a standing condition attached to the wake naming one of this seat's
pull requests as an open draft with no live run behind it.

## 0. The inherited draft, and which of the three acts it was

The standing condition offered three: ready it, close it and re-declare
what it owed, or write in it which clause keeps it a draft. It also said
the right choice cannot be made from the outside, because a stub and a
finished report look the same there. So this run read the diff first.

`GET /api/standing?company=Ursa&seat=frontend` confirmed the condition
rather than taking it on the wake's word, which is what that endpoint is
for: a wake queued behind a run carries conditions older than itself.

What the branch held, on three commits and 509 lines:

| file | what it is |
|---|---|
| `review-kit/measure-floor.py` | the instrument the ledger's L48 rule asks for: N independent shoots, not a pair |
| `reviews/2026-11-02c/data/probe-*.mjs` | four probes that walked from "two loads disagree" to the element responsible |
| `components/ui/pixel-sky.tsx` | a one-line guard, with the measurement that justifies it written above it |

That is finished work for the item it took, with one thing missing. The
pull request body was still the run-opening placeholder, and the
after-measurement, the half that shows the repair did what the cause
analysis predicts, was never taken. The run was cut between finding the
cause and proving the fix.

So the act is neither a clean ready nor a close with nothing owed. This
run absorbs the branch, pays what it owed, and closes the draft against
this pull request, which is the org rule's own remedy for a seat holding
two versions of one change: merge it into your branch, build on top, and
say which pull request yours subsumes so the owner closes them as one
decision.

## 1. What this run owes, then

1. The after-measurement, with repeats rather than a pair, because the
   rule the absorbed work exists to serve is exactly that one.
2. The fifteen-frame sweep, read by eye, which is the charter's step 1
   and which the absorbed run recorded that it had not done.
3. The ledger line, because a floor nobody wrote down is
   indistinguishable from a repair when the next run diffs over it.

Results are written into this file as they are measured. A number that is
not here was not taken.

## 2. Fixing the build was most of this run

The charter says that if the build fails, fixing the build is the run. It
failed four times, and the first failure was mine.

I started `npm install` in `ursa-minor` in the background and then, before
it had finished, ran the review kit's own install line in the same package.
Both lines are in the kit's README. Neither mentions the other. Together
they leave a tree where `node_modules/next` exists and
`node_modules/next/package.json` does not, and the build says this:

> Could not find the Next.js package (next/package.json)

followed by five possible causes, the nearest of which is "node_modules is
being reorganized by a concurrent install" and the loudest of which
suggests the workspace root is misconfigured. None of them names the two
commands I had actually issued.

| attempt | what happened |
|---|---|
| 1 | `next build` against the half-written tree, `next/package.json` missing |
| 2 | `npm ci` while the first install was still alive, same failure |
| 3 | the first install killed, `npm cache verify` garbage-collecting one 31 MB corrupted content entry, build then failed on a half-unpacked `@swc/helpers` with a different message |
| 4 | one install, nothing else touching the tree, `require('next/package.json')` and `require('@swc/helpers/package.json')` both resolving before the build started |

The repair was already in the code and in no document. `PW_ROOT` is the
first entry in `lib/browser.mjs`'s search order, so the kit can live in a
prefix neither site's installer owns. Verified this run: chromium launches
through the kit with nothing playwright-shaped inside either site. That is
the install block in `review-kit/README.md` now, and the ledger's L51.

The second thing it bought is a test. `measure-floor.py` arrived with no
selftest, and its headline is not a pixel count but a pair count, which is
the kind of number that is wrong in a way that reads as good news.
`selftest/check-floor.py` is twelve assertions over fixtures written under
`tmpdir()` and committed nowhere. The one that matters is the arithmetic:
six shoots split four and two report seven blind pairs of fifteen, which
no product page can check, because on a real page nobody knows the true
split.

## 3. The after-measurement, which is what the inherited draft owed

The repair is one line in `PixelSky`: a resize that lays the canvas out
smaller than one shader pixel leaves the raster alone, instead of being
turned into a legitimate 1x1 raster by `Math.max(1, …)` and costing a
full refill in each direction.

The server this was measured against is identified rather than assumed.
Port 4493 on this host was already answering 200 when the run started and
is not mine, which is L34 exactly, so the measurement runs on 4511 and
the chunk the page asks for was fetched back and compared byte for byte
against the `.next` this run built. `IDENTITY_OK`.

| | shoots | frames with one state | frames with a floor |
|---|---|---|---|
| before, measured by the run that was cut | 6 | 13 of 15 | home at desktop and home at tablet, two states each |
| after, measured this run | 6 | **15 of 15** | **none** |

Every frame is bit-identical across all six shoots, so no pair drawn from
them could have been blind to a floor, because there is no floor left to
be blind to.

**What this does not claim**, in the instrument's own words: six shoots
bound each floor from below and none of them from above. A frame
reporting one state is a frame no sample this size could separate, which
is not the same sentence as a deterministic frame.

**And one thing I did not re-take.** The before row is the cut run's own
measurement, re-stated from its commit message rather than re-measured.
Re-taking it means reverting the guard, a second production build and six
more shoots, and the build alone cost most of an hour this run. So the
before number carries that run's name and not this one's, which is the
honest way to print a number you did not watch being taken.

## 4. The fifteen-frame sweep, read by eye

The charter's step 1, which the cut run recorded it had not done. All
fifteen frames read at 1x, plus one magnified crop.

No frame overflows its viewport. Nothing is clipped, no wrap is broken,
and no page has anything on it that would stop an Apple design review.

Two things I looked at hard and then left alone:

- **The third command on the home page is cut off mid-URL.** It is not a
  bug. `CopyLine` scrolls the command sideways and `.rec-cmd` fades
  whichever edge still has content behind it, which is the affordance,
  decided and measured on 2026-10-24. The crop confirms the fade is
  drawing. I am recording that I checked rather than that I found
  something.
- **The right-hand gutter on `/record` at desktop.** The measure stops
  well short of the rules. That is a measure, not a defect.

## 5. The one thing the eye found that the instruments had not

On phone and on tablet the home page's first sentence is **below the
fold**, and the code says it should not be.

| viewport | fold | top of the sentence | |
|---|---|---|---|
| phone 390x844 | 844 | 887 | 43px below |
| tablet 820x1180 | 1180 | 1196 | 16px below |
| desktop 1440x900 | 900 | 452 | in view |

The hero copy carries `portrait:mt-[92svh]`, and the comment above it
says in so many words that portrait is untouched because the copy
already sits 92svh below the mark. 92svh is 776 at phone and 1086 at
tablet. The sentence is at 887 and 1196, which is 105svh and 101svh, and
the gap is the same 110px at both, because the margin starts below the
header rather than at the top of the viewport.

So the intent is legible and the number does not deliver it. 92svh is a
choice to let the copy peek above the fold and invite the scroll. What
the page does instead is show a full screen of sky with nothing of the
sentence in it, at both portrait sizes, by 43px and by 16px. Sixteen
pixels is the worst distance to miss by, because it reads as an accident
rather than a decision.

**I did not change it.** The hero's geometry is identity, the charter
says the identity is mine to protect and not to reinvent, and moving the
first sentence on every portrait device is a decision for the owner and
not for a polish run. It is a ledger proposal, L52, with the measurement
attached.
