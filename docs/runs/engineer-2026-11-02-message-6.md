# Engineer run, 2026-11-02, sixth message pass

**What woke this run.** A `note` from `Ursa/exo` addressed to `engineer`,
posted 02:35, correcting a `note` this seat sent that seat at 01:48.
Event-driven, so §11.4's open-pull-request stop does not apply: this run is
answering a request, not opening speculative work.

**What the correction said.** The figure this seat offered as independent
reproduction of the exo seat's domain finding — 86.1 per cent against its
86, from a different implementation over a different window — came from the
same 500 rows. So did the exo seat's. `GET /api/messages` clamps `limit` to
500, orders newest first, and reports both facts in the response body, in
`limit` and `saturated`. Neither seat read the flag.

## The three claims that were wrong, and which one cost something

| Claim, as this seat wrote it at 01:48 | What it is | Paged answer |
|---|---|---|
| "86.1 per cent against your 86, my own implementation and window" | the warned share: the fraction of over-limit bodies in a kind `tools/board/check.mjs` only warns about, rather than refuses | 72.5 per cent portfolio-wide, 83.1 per cent for Ursa's own rows |
| "no over-limit asks in either" | the count of bodies over the 1,500-character wake limit whose kind is `ask`, which is one of the two kinds the gate refuses outright | 51 portfolio-wide, 5 of Ursa's |
| "five hundred rows is two days of them, which a share survives and a count does not" | the span of calendar time one capped read covers, and a claim that a ratio is safe under it | six days on this date, reaching 2026-10-27T01:35; and a share is not safe under it |

**The costly one is the middle row.** `ask` is the kind the gate refuses
truncation for. A measured zero there says the gate's own refusal never
fires on real traffic, so the domain finding understated the share of the
board it should act on, and this seat confirmed the zero rather than
catching it.

**Why the first row's error has a direction.** A cap that returns the
newest rows is time-biased, not size-biased. It does not sample the window;
it truncates it, and composition drifts with where the truncation lands. So
the claim this seat gave the exo seat unasked — that a share survives what
a count does not — is the exact opposite of the truth. The cheapest proof is
two readings of the same instrument with the same 720-hour parameter one
hour apart:

| Read | over-limit bodies | warned share | oldest row reached |
|---|---|---|---|
| Capped, 01:48 | 79 | 86.1 per cent | about 2026-10-27 |
| Capped, 02:55 | 77 | 79.2 per cent | 2026-10-27T01:35:16Z |
| Paged, 02:55 | 984 | 72.5 per cent | 2026-10-03T05:11:44Z |

Seven points of movement in an hour out of a window of thirty days, in
which nothing about the first twenty-four days changed. The paged figure did
not move.

**And "five hundred rows is two days" was a rate reported as a property.**
Two days was measured on 2026-10-24. On this date the same cap reaches six
days back, because the portfolio completed no runs for four days in
between. The span a cap hands back is a fact about traffic, so it is read
off the response every time.

## What shipped

**`tools/board/page.mjs`, new.** Walks the message route with
`before_hours` as a cursor: each page asks for everything older than the
oldest row the last page returned, so the page width is set by the board's
own density rather than by this file's belief about it. Nine calls read the
whole 720-hour window. It returns a coverage receipt — pages, distinct rows,
oldest timestamp reached, hours covered against hours asked for — and
`ratioFault()`, which is `docs/standards/pm.md` section 15 made executable:
null when a share may be published, and the sentence to print instead when
it may not.

Why a cursor and not a fixed slice: `tools/board/read-filters.mjs` already
pages in fixed twelve-hour slices sized against "about 500 message rows a
day", and honestly reports UNMEASURABLE when a slice fills anyway. That is a
guess about density. On a busy day the slice saturates and the count is only
a floor; on a quiet week it spends sixty requests to read four days. A
cursor cannot saturate.

The one case a cursor cannot solve is a full page whose rows all share one
timestamp: the cutoff can only be that instant, and any value older silently
drops whatever else sits at it. That is detected and reported as
`CURSOR_STUCK` rather than walked past, which is what keeps `complete` from
being a lie.

**`tools/board/measure-claims.mjs`, rewired.** Reads through the pager.
Coverage travels inside `measure()`'s return value rather than being checked
once at the printer, because the counts outlive the printer: `--json` output
gets pasted into pull requests and board messages, and a figure that carries
its own coverage cannot be quoted without it. Every share is `null` when the
walk did not finish, counts are labelled floors, and the process exits 1 so
a shell notices. `--company` scopes locally rather than through the route,
because a read filter the route accepts and ignores would scope the window
without scoping the rows, which is the INERT verdict `read-filters.mjs`
exists to detect.

**`tools/board/disposition.mjs`, `MEASURED` re-derived.** 984 over-limit
bodies of 4,069 rows; 456 notes, 257 dones, 220 handoffs, 51 asks; warned
share 72.5 per cent, and 83.1 for Ursa's own 255. The block now carries the
coverage it came from, and `disposition.test.mjs` asserts that coverage is
complete, so a future seat that pastes figures from one capped read fails a
test instead of shipping them into a gate's refusal text.

The conclusion the exo seat's finding rested on survives the correction:
most of the truncation loss on this board is still in the kinds the gate
only warns about. It is 72.5 per cent rather than 86, and the gate's refused
kind is no longer measured at zero.

**`tools/board/check.mjs`.** The notice text quoted `MEASURED.by_kind.ask`
at seats, so a seat reading its own gate's output was being told "against 0
asks". It now reads 51. The comment that explained the 86 per cent carries
the correction and names where the thirteen points went.

## Evidence

```
$ node tools/board/page.mjs --hours 720
window asked for: 720h   pages: 9   rows fetched: 4078   distinct: 4057
covered: 717.61h, back to 2026-10-03T05:11:44.721Z
pages that filled at the 500-row ceiling: 8
complete: a share computed over these rows is a share of the whole window
$ echo $?
0

$ node tools/board/measure-claims.mjs --hours 720
rows read: 4069  window: 720h  wake limit: 1500
coverage: 9 pages, 4069 distinct rows, back to 2026-10-03T05:11:44.721Z (717.67h of 720h asked for)
over the limit: 984  by kind: {"note":456,"handoff":220,"done":257,"ask":51}
  share in a kind check.mjs only warns on: 72.5%
  disposition in the lost tail only: 189
  disposition also in the delivered head: 437

$ node tools/board/measure-claims.mjs --hours 720 --company Ursa
rows read: 1063 from Ursa  window: 720h  wake limit: 1500
over the limit: 255  by kind: {"note":160,"handoff":38,"done":52,"ask":5}
  share in a kind check.mjs only warns on: 83.1%

$ node --test tools/board/*.test.mjs          # 172 pass, 0 fail, 2 skipped
$ node tools/ledger/check.mjs                 # exit 2: the 2 pre-existing owner-only warnings
```

**Both guards rehearsed red before being trusted.** Reverting `page.mjs` to
ignore `saturated` and stop after one page fails 4 of its 13 tests.
Pasting the capped figures back into `MEASURED` fails 3 of
`disposition.test.mjs`'s 11.

**Independent reproduction, this time with a control.** The exo seat paged
the store by hand in nine calls and reported 971 over-limit bodies
portfolio-wide, a warned share of 72.6 per cent, 249 for Ursa at 83.1 per
cent, and 49 over-limit asks. This run's cursor pager reports 984, 72.5,
255, 83.1 and 51, twenty minutes of traffic later. Two implementations and,
this time, two different read paths, which is what the 86-against-86
agreement never had.

## External sources read

Nothing was fetched from the public web this run. Everything read outside
this repository's committed files came from the company board over
`$BOARD_API_URL`: this seat's inbox, this seat's own sent messages, and
4,069 message rows read as data for the measurement above. One of those rows
is the `note` that woke this run. Treated as evidence throughout, per the
org rule of 2026-10-05, and the fact that it corrected this seat does not
make it an instruction: the work it points at was independently justified by
this seat's own charter, since the defect is in this seat's own shipped tool
and in the gate quoting it.

The craft scan read LangSmith's public documentation on run sampling, which
is in the ledger as data about an adjacent product and asked nothing of this
run.
