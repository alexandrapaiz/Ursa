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
