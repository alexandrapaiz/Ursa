# Engineer run log — 2026-10-06: excerpt grounding

Opened before the work, per L-E3 (open the pull request first, then
build). Appended to as the run proceeds; if the run dies early, what is
written here is what survived.

## Observe (done before this commit)

- `origin/main` moved during this run's first turns. At session start it
  was `cf2f28f` and carried no engineer code since 2026-09-24; by the
  time the survey finished it was `825ffe5`, which contains PR #74 and
  therefore the whole engineer stack from `#43` through `#74`. The
  practical consequence: `ursa-major/src/` on `main` now has
  `consent.ts`, `lifespan.ts`, `loops.ts`, `deletion.ts`, `audit.ts`,
  `adapters/` and `hq/`, none of which were there at the first `ls`.
- Still open and still a draft: PR #77,
  `engineer/2026-10-05-generated-denominator`, which never got its
  `gh pr ready`. It is the only unmerged engineer branch. Today's branch
  is cut from it and merges `origin/main` on top, so #77's content is an
  ancestor here.
- Sprint file on `main` is `docs/sprints/sprint-2026-09-21.md`, 15 days
  stale. Its items 1-3 are built and now merged via the stack; item 4
  belongs to the market seat. PR #93 opens a newer sprint and is still
  unmerged, so there is no startable sprint item on `main`.

## Orient

Falling back per charter to the ledger. The unit is the first step of
yesterday's entry "The gate checks seven of a record's nine top-level
keys" (docs/ideas.md, 2026-10-05): the excerpt-grounding check, as an
eleventh bound. The entry argues its own priority and this run agrees
with the argument: every other bound catches a wrong number, and this
one catches a misquote of the user, which is a trust incident rather
than an arithmetic error.

## Decide

One unit, the entry's own first step: the eleventh bound, no new data,
no new dependency, no decision the owner has not already made. The
`durability` and step-range checks the same entry names after it are
not in today, and §8 of docs/design/signal-grounding.md says they stay
open under the 2026-10-05 entry rather than getting a duplicate one.

## Act — what shipped

- `ursa-major/src/types.ts`: `QuoteRef`, and a required `quotes` field
  on `CorrectionLoop`, `RegressionEvent` and `OneShotCorrection`. The
  quote inside the sentence a lab reads is now also an address into the
  record.
- `ursa-major/src/text.ts`: `isExcerptOf` and `normalizeForExcerpt`.
  The predicate lives beside `excerpt()` so `MAX_EXCERPT` keeps one
  definition and the check cannot drift from the truncation it checks.
- `ursa-major/src/loops.ts`, `ursa-major/src/signals.ts`: the four
  quoting sites populate `quotes`. `specFrom` now returns the prose and
  the quote together instead of a string.
- `ursa-major/src/invariants.ts`: `SIGNAL_QUOTE_GROUNDED`, the eleventh
  bound, in three clauses — the quote resolves, the excerpt is in the
  raw text, and the excerpt is in the prose a reader sees. Plus three
  measurements.
- `ursa-major/src/invariants.cli.ts`: the signal line, printed even at
  zero.
- `ursa-major/src/disclosure.ts`: `rawStringsOf` now reads
  `oneShotCorrections[].text` and `defensiveGuardrails[].text`.
- `docs/design/signal-grounding.md`: the artifact, six elements.
- 375 → 396 passing tests, `tsc --noEmit` clean.

## Three things this run found that it did not set out to find

**The quote `ursa run` ships was a reconstruction, not a quote.** The
bound's first execution against a label-stage record failed on the
test file's own helper: the generation says `holds it whole, and` and
the quote claimed `holds it whole , and`. `mutationCorrections` built
the agent side by joining `span.diff`'s non-added parts, and
`diffWords` tokenizes on whitespace, so an insertion where the old
string had no space carries the new string's spacing into the rebuild.
`oneShotCorrections[].text` is the only signal `ursa run` emits on a
repository, which makes it the most-produced quote in the product.
Both sides now read the extents the record already stores. Measured on
the one real label-stage record this repository's history produces: 4
mutated spans, 0 reconstructions differed, so the defect is latent on
real data and reproduces on demand. The exact opposite shape of
2026-10-04, where real history found what every synthetic fixture
passed.

**Both committed fixtures pass this bound by checking nothing, and one
of them is interesting about it.** `fixtures/mini` carries a
74-character edited span, which is a correction, and reports zero
signals. Its two conversations have one prompt each, so `hasChatTrace`
is true, the trace stage runs and clusters nothing, and
`mutationCorrections` — the function that would have turned that edit
into a signal — is on the other side of the `if`. The two stages are
exclusive and the label-stage signal is the one that needs no trace.
Filed as a ledger entry; what shipped today is the measurement that
makes it visible, because "OK — every stated bound holds" on a record
with no signals reads exactly like a gate that passed.

**The consent audit never read the quote `ursa run` produces.**
`rawStringsOf` in `src/disclosure.ts` is the gate's definition of
"raw", assembled so nothing quoted can cross the device boundary. It
enumerated six blocks and missed `oneShotCorrections[].text`, which is
again the only signal the shipped launch path emits. Two lines, and the
audit is strictly stricter than before.

## Boundaries

No file under `prompts/`, `.github/`, `docs/sprints/`,
`docs/standards/`, `skills/` or `digests/` was touched. Checked with:

    git diff --name-only origin/main...HEAD \
      | grep -E '^(prompts/|\.github/|docs/sprints/|docs/standards/|skills/|digests/)'

which exits 1 with no output. (`git diff` against this branch's own
base, PR #77, does list files under those prefixes; those are the
merge of `origin/main`, which moved during the run, not edits.)

No ledger status was changed; three entries appended with status
`proposed`. No new dependency, service, account or cost:
`ursa-major/package.json` is byte-identical. `docs/decisions.md` was
not touched — the first ledger entry asks for a schema decision rather
than writing one, and ADR numbering is contested on `main`.

Nothing in the artifact or the ledger carries a home path, a username
or a private record id; checked with
`grep -rnE '/(Users|home)/[a-z]' docs/design/signal-grounding.md`,
which exits 1.
