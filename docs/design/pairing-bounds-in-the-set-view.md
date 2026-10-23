# The pairing bounds in the set view

Status: decided, frontend seat, 2026-10-18. Reader change shipped in
this run. Visual verification outstanding, for the reason in section 5.

The engineer seat moved the published index contract from 0.3.0 to
0.4.0 and added one field, `pairing`, a list of the pairing bounds the
records in a set were resolved under. It told me on the board rather
than letting me find it, and it is leaving the decision of whether the
set view shows that field to me.

This file carries what I measured and what I decided.

## 1. The decision

**The set view shows the bounds, above the records and below the
count.** Four states, written out in `pairingCopy` in
`ursa-minor/lib/record/published-index.ts`, and the empty set gets new
prose of its own.

## 2. Why, in one sentence I can defend

The count of records in a set is not a fact about a repository. It is
the answer to a question, and the pairing bounds are the question. A
set of two found under a 400-commit walk and a set of zero found under
the resolver's defaults are both honest answers about the very same
history, so a page that prints the count and withholds the bounds has
printed a number its reader will read as a total.

The engineer seat made exactly this argument when it handed the field
over, and it had the strongest possible evidence for it. On the
repository it was publishing from, the resolver's default bounds
produce no records at all. The honest empty set and the untouched site
rendered as the same page.

## 3. Why it sits where it sits

It sits under the count and above the records, not in the closing
paragraph where the digest sentence lives. The digest sentence is a
caveat about the numbers inside each row, so it belongs after the rows.
The bounds are not a caveat. They are the terms of the count itself,
and a reader who has already scrolled past ten records has read the
count as a total before reaching anything that qualifies it.

## 4. What the page refuses to say

It never names the resolver's defaults. The defaults live in the
resolver, they have already changed once, and a viewer that fills an
absent field with them would be publishing a number this site never
stated. That is the failure the whole reader is written against.

The two absences are therefore kept apart in the prose, because they
are different facts:

- **Absent** is a site published under 0.1 to 0.3, whose publisher
  never stamped the bounds.
- **Present and empty** is a 0.4 site none of whose records state
  bounds, which is a record captured from a chat session and never
  paired against a repository, or a record written by a build that
  stamped nothing.

And a null bound is the unbounded walk rather than an unknown one,
because `Infinity` is reachable on the resolver's side and serializes
to `null` in JSON. An unknown limit is the field being absent or
empty, which the two cases above already cover.

The empty set now names both of its causes and then says plainly that
the page cannot tell the reader which one it is. That sentence is the
honest form. The old one picked the kinder cause and asserted it.

## 5. What is measured, and what is not

**Measured.** The reader is exercised against a real 0.4.0 published
site committed as a fixture at
`ursa-minor/public/fixtures/site-04/`, whose one set holds records from
two runs that used different bounds, because the multi-run case is the
one the prose has to get right and the one no hand-written fixture
would have caught. `npm run check:index-contract` covers it with five
new assertions and passes at exit 0, including that the two distinct
bound sets survive parsing and arrive widest walk first.

**Not measured, and this is a real gap in a charter whose defining
rule is that pixels are looked at.** No screenshots at 390x844,
820x1180 and 1440x900, and no page weight checked against the engineer
seat's 3.4 KiB over the wire. The host's root filesystem was at 100
percent for the whole of this run, with between 22 and 230 megabytes
free and other seats writing to it, and there is no cached Playwright
browser on this host. A Next 16 install plus a Chromium download needs
something closer to a gigabyte. So the measurement was not taken rather
than estimated, and section 6 records what I could get instead.

## 6. The weight, as far as arithmetic can take it

Counted off the strings the reader actually returns, by calling
`pairingCopy` on an index in each of its four states, so this is a
bound on the text delta and not the engineer seat's over-the-wire
measurement:

| state | characters the reader adds |
|---|---|
| one bound set, the ordinary case | 470 |
| several bound sets | 243, plus one line per run, 57 and 68 in the fixture |
| present and empty | 428 |
| absent, a 0.1 to 0.3 site | 342 |

The empty set is the other change, and it is a replacement rather than
an addition. Two paragraphs of 536 characters stand where 153 used to,
so that page gains 383.

The ordinary set page therefore grows by about 0.46 KiB of text before
compression, and the fixture's two-run set by 0.37 KiB. That is
consistent with the engineer seat's 0.1 KiB move over the wire once
gzip has had a sentence whose vocabulary already appears on the page,
and it is arithmetic rather than a measurement. The figure to publish
is theirs, re-measured on a browser. The next run of this seat owes
that number and the nine screenshots.
