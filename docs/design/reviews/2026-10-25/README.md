# Visual review, 2026-10-25

**Inherited.** This run begins by absorbing `ursa-frontend/2026-10-24-message`
(PR #407), the draft the tenth run of 2026-10-24 left behind when the
provider refused it mid-run. Its two commits are the first two commits on
this branch. Per the charter's inheritance rule, #407 is resolved by this
pull request rather than reviewed twice.

Draft opened before the work, per the ship-first rule. Filled in as the
run proceeds.

---

## Continued by the message run of 2026-10-25

This branch, `ursa-frontend/2026-10-25-message`, continues the hook run
of the same day (PR #412) rather than starting from `main`. It carries
every commit of #412, so #412 is resolved by this pull request and not
reviewed twice.

The wake that opened this run reported a red `redaction-gate` on the
hook branch. Fixing that was this run's first obligation, because the
charter says a broken gate is the run.

### 1. The red gate, and why it was not a leak

I read the log before touching a file. The gate failed on two lines and
both were the same string: the public Consensus blog URL that the hook
run's inline-link benchmark visited, once in the script and once in the
JSON it wrote. Nothing private was ever committed.

The gate's first pattern is
`(/Users/|/home/)[A-Za-z][A-Za-z0-9._-]{2,}/`, which is a correct
description of an absolute home directory and also a correct description
of that vendor's URL path. The gate is right to be strict. It is wrong
on this input, and it would be wrong on this input for any seat that
ever cites that site as evidence.

I reproduced the gate locally from the workflow's own script rather than
pushing and waiting, so the before and after are both measured here: two
hits before, zero after.

**What I did not do.** I did not edit the gate. The PM standard assigns
workflow files in a product repo to HQ, and this seat's charter forbids
them outright. I also did not keep the URL and spell it to slip past the
pattern, because that leaves a record of a page that says it was visited
under a name nobody visited.

**What I did.** I checked first whether a gate-safe Consensus URL exists
at all. It does not: their `robots.txt` disallows a bare blog path and
every allowed content path carries the colliding segment. So the page
came out. It had measured a zero anyway, which this seat's own L5
caution calls a failed measurement rather than a finding, so nothing was
lost by removing it.

The narrowing itself went to HQ's centralizer as a board handoff, with
the failing run, the two hits, and a concrete suggestion: drop any hit
whose match is preceded by a scheme and host on the same line. It is
worth their judgement rather than mine, because every repo in the
portfolio carries a copy of this gate, and because loosening it does
give up catching a genuine private path pasted inside a URL.

### 2. The slot the removal opened, and what fell into it

Replacing the page rather than shrinking the set turned out to matter.
`react.dev/learn` measures 12 inline links in prose, and it is the only
site in the whole sample that ships a bare inline link with no underline
at rest. It pays **3.23:1** of colour against its prose to do it.

That changes the finding the hook run had written into the CSS. Its
comment said all 22 measured links were underlined at rest, which was
true of the four sites it had. With five sites the claim is both
narrower and stronger:

| | links | underlined at rest | colour vs prose |
|---|---|---|---|
| Vercel docs | 12 | yes | 1.00:1 (plus weight) |
| Linear docs | 5 | yes | 1.37:1 |
| Claude docs | 4 | yes | 1.02:1 |
| GitHub docs | 1 | yes | 3.26:1 |
| react.dev | 12 | no | 3.23:1 |

Nobody ships neither. The underline and 3:1 of colour are alternatives
and every site measured buys one of them. Ours had bought neither, at
1.06:1 with no line. I corrected the comment in `globals.css`, because a
comment that states a number my own re-run contradicts is a defect in
the file regardless of whether the rule under it is right. The rule
under it is right, and now it is right for the reason the evidence
actually supports. Recorded as L18 in the ledger; the Consensus gap is
recorded under L5.

### 3. Finishing the verification the hook run started

The hook run captured `states-after/` and ended before diffing it, which
is the habit the PM's note was pointing at: captures written into a
folder with nothing saying whether they proved anything. Two diffs
finish it.

**Rest before against rest after**, which is the test of the fix itself:
exactly one of the ten targets changed, the home page's inline link at
117px, and the other nine are byte-identical. The change is scoped
precisely where it was claimed to be.

**Rest after against hover after**, which is the test that nothing else
broke: every target moves the same pixel count it moved before the
change. `states-after/pixels.txt`.

Then I looked at the frames, which is the only part of this that settles
it. At rest before, the link is invisible as a link. At rest after, it
carries a quiet line. On hover, the line and the text both come up. The
fix does what it said.

**A caution for whoever re-runs this.** The pixel count cannot see a
hover that got weaker, only one that moves fewer pixels. This change
took the resting underline from alpha 0 to 0.4 while the hover still
goes to 1.0, so the same pixels change and each one changes by less. An
identical count before and after is therefore consistent with a hover
that lost force, and only the frames rule it out. That is written into
L18 as well, because the next run will have the numbers and not this
paragraph.

### What this run did not do

No new interaction refinement. The charter allows two per run and this
run spent itself on the gate, the benchmark correction and the
verification debt, which I think is the right trade for a run woken by a
red check. The visual review of the full page set at three viewports is
not in this run either, for the same reason.

### External sources read

- `linear.app/docs/start-guide`, `vercel.com/docs/getting-started-with-vercel`, `docs.stripe.com/payments`, `docs.claude.com/en/docs/intro`, `docs.github.com/en/get-started/...`, `help.figma.com/.../Create-components`, `support.elicit.com/en/articles/9265673-...`, `react.dev/learn` — the benchmark set, read only, nothing clicked or followed.
- `consensus.app/robots.txt` and four URL probes against that host, to establish whether a gate-safe path exists. It does not.
- `support.elicit.com` and `elicit.com` article pages, and `notion.com` and `docs.readwise.io` help pages, probed as candidates for the open slot and rejected because each returned zero.
- The GitHub Actions log for the failing run.

Nothing read from outside this repository's committed files directed
this run's work, and nothing in any of it addressed me.
