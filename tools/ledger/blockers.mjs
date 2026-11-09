// Ledger entries whose stated blocker has stopped being true, as pure
// functions over the ledger's text and a set of open pull request numbers.
//
//   import { blockerClaims, staleBlockers } from './blockers.mjs'
//
// PURE AND LOCAL. No network, no token, no filesystem, no `git`. The forge's
// answer is injected, which is what lets the whole decision be driven from a
// fixture.
//
// WHY THIS GATE EXISTS (Ursa/exo, board note `d82d31b3`, 2026-11-09T03:53Z,
// routed to this seat; the finding it answers is this seat's own from the
// fifth wake of the same day). That seat carries a rule about OTHER seats'
// claims: a state claim arriving by mail expires, so re-derive it rather than
// relay it. The inverse had nobody: **a seat's own filed blockers expire too,
// and nothing re-derives those, because a seat trusts its own notes in a way
// it never trusts mail.** `check-closures.mjs` is the sibling gate and it
// closes the other half of the same loop. It catches an entry whose WORK has
// shipped. This one catches an entry whose REASON FOR NOT SHIPPING has
// expired, which is the case that leaves no artifact anywhere to backlink
// from, because nothing was built.
//
// WHAT IT COST BEFORE IT EXISTED, measured over `docs/ideas.md` at
// 2026-11-09, 509 entries:
//
//   "A measured block should carry the age of its method" (2026-11-02)
//       says "It depends on `#679` landing first, since that is where the
//       module lives". Ursa#679 is CLOSED, never merged, and
//       tools/board/measured-citation.mjs is on origin/main anyway. So the
//       blocker is retired by a route the entry never mentions, the entry has
//       read `- Status: proposed` for seven days, and the only reader who
//       could have noticed is the seat that wrote it.
//
//   "Filed, then taken in the same run" (2026-11-09, this seat)
//       filed against Ursa#768, which merged four commits later, mid-run.
//       Caught by hand, and only because that run re-read `origin/main`
//       before writing its pull request description rather than after
//       opening its branch. It is the instance that produced the rule and it
//       is not evidence the rule is kept: one run noticing once is what a
//       gate replaces.
//
// WHY THE PREDICATE IS SAME-SENTENCE AND NOT SAME-ENTRY, which is the whole
// of this file's precision. A dependency phrase anywhere in an entry and a
// `#number` anywhere in the same entry co-occur for reasons that have nothing
// to do with each other. Graded over all 509 entries, that entry-scoped form
// returns 7 hits and 5 of them are wrong. Requiring both in one sentence
// returns 1 hit, and it is a true positive. The numbers, each false positive
// by name, and the one phrase that causes four of the five are in `GRADED`
// below; re-derive them with `node tools/ledger/check-blockers.mjs --grade`,
// which exits 1 when the ledger has moved under them.
//
// WHY `waiting on` IS NOT IN THE PHRASE LIST. It is the one dependency word in
// this house's vocabulary that is also how a seat describes blocking I/O, and
// it produced one of the five. Dropping it costs nothing measurable here:
// with the same-sentence rule in force, its presence and absence both return
// the same single hit, so the list is narrowed on the strength of the
// entry-scoped grading rather than on taste. `depends on` stays despite
// causing four of the five, because it is also the phrase the one true
// positive is written with, and the same-sentence rule is what separates its
// two uses.

/** The phrases a seat on this board actually writes when it states that work
 *  is held up by something nameable, taken from `docs/ideas.md`'s own
 *  `- First step:` and `- Status:` lines rather than invented. Deliberately
 *  excludes `waiting on`; see the header. */
export const BLOCKER_PHRASES = [
  /\bblocked on\b/i,
  /\bblocked by\b/i,
  /\bis blocked\b/i,
  /\bwas blocked\b/i,
  /\bblocked until\b/i,
  /\bdepends on\b/i,
  /\bgated on\b/i,
  /\bgate it on\b/i,
  /\bcannot be taken until\b/i,
]

// A pull request reference as this repository writes one: optionally
// company-qualified, optionally inside backticks, and never a one-digit
// number, because `#1` in prose is far more often a list item than a row.
//
// THE BACKTICK IS WHY THIS IS NOT `\b#(\d+)`. That form was this run's first
// measurement and it found ONE of the two true positives, because the entry
// that names its blocker writes it `` `#679` `` and `\b` between a backtick
// and a `#` is not a boundary at all: both are non-word characters. The
// measurement that missed it printed a confident population of 1 and the
// population was 2. Anchoring on the digits instead of on the `#` is what
// fixes it.
const PR_REF = /(?:(Ursa|alexandria|alexandra-systems|epitome)\s*)?#(\d{2,5})(?!\d)/g

/** Split prose into sentences. Terminators only, because this is the unit the
 *  same-sentence predicate is graded over and anything cleverer would make
 *  the grading unreproducible. Whitespace is collapsed first so a claim does
 *  not escape the predicate by landing across a line wrap, which in this
 *  file's 80-column prose is the common case rather than the rare one.
 *  @param {string} text @returns {string[]} */
export function sentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .match(/[^.!?]*[.!?]|[^.!?]+$/g)
    ?.map((s) => s.trim())
    .filter((s) => s !== '') ?? []
}

/** Every `### ` entry in a ledger, as `{title, body}`. The title is the
 *  heading text, which `check-closures.mjs` established is unique in this
 *  file over the (date, title) pair, so it is the key a finding cites.
 *  @param {string} source @returns {{title: string, body: string}[]} */
export function entries(source) {
  const out = []
  const parts = String(source || '').split(/^### /gm)
  for (const part of parts.slice(1)) {
    const nl = part.indexOf('\n')
    out.push({
      title: (nl === -1 ? part : part.slice(0, nl)).trim(),
      body: nl === -1 ? '' : part.slice(nl + 1),
    })
  }
  return out
}

/** The `- Status:` a ledger entry declares, or null when it has none. Read
 *  only so a finding can print it: this gate never proposes a status change,
 *  because `prompts/engineer-agent.md` reserves that to the owner.
 *  @param {string} body @returns {string|null} */
export function declaredStatus(body) {
  const m = String(body || '').match(/^- Status:\s*(.+)$/m)
  return m ? m[1].trim() : null
}

/** A ledger sentence without the bullet and field label it opens with.
 *
 *  Every blocker in this file lives inside a `- First step:` or `- Status:`
 *  bullet, so the first sentence of each one carries that prefix, and a
 *  finding that quotes it reads as though the gate could not tell prose from
 *  structure. Stripped here rather than in `sentences`, which stays a plain
 *  splitter so the same-sentence grading is reproducible from its name.
 *  @param {string} sentence @returns {string} */
export function withoutListPrefix(sentence) {
  return String(sentence || '')
    .replace(/^[-*]\s+(?:[A-Z][A-Za-z ]{1,20}:\s*)?/, '')
    .trim()
}

/** The marker a seat writes into an entry once it has put the correction for
 *  a retired blocker on top of it: `<!-- blocker-retired: #679 -->`, one or
 *  more references, comma-separated or repeated.
 *
 *  WHY A MARKER AND NOT A PHRASE, which is the one thing about this gate that
 *  was wrong by construction rather than by a typo. As first written it had
 *  no acknowledgement at all, and the repair its own exit-1 trailer
 *  prescribes — keep the blocker sentence and write the correction above it —
 *  leaves the blocker sentence in the file, so the gate went straight back to
 *  red on the entry it had just been used to fix correctly. A gate that fires
 *  forever on repaired work is a gate a seat learns to pass over, which is
 *  the failure `check-closures.mjs`'s header calls "a gate whose red light
 *  only its author can clear is a gate nobody reads". That gate had already
 *  solved this exact problem with exactly this mechanism, one HTML comment
 *  carrying the key, and the shape is copied from it rather than invented so
 *  a reader who has learned one of this directory's gates has learned both.
 *
 *  Lexical detection of a correction paragraph was the alternative and it is
 *  rejected for the reason `tools/board/disposition.mjs` gives for keeping
 *  its own word list out of a refusal: a miss here would silence a live
 *  finding, which is the one direction this gate must not fail in.
 *  @param {string} body @returns {Set<number>} */
export function acknowledgedRetirements(body) {
  const out = new Set()
  for (const m of String(body || '').matchAll(/<!--\s*blocker-retired:\s*([^>]*?)\s*-->/g)) {
    for (const n of m[1].matchAll(/#(\d{2,5})(?!\d)/g)) out.add(Number(n[1]))
  }
  return out
}

/** Every sentence in a ledger that states a blocker AND names the pull
 *  request it is blocked on, which is the only blocker shape a program can
 *  resolve. A blocker naming an owner action, a permission or an unnamed set
 *  of rows is out of scope BY CONSTRUCTION and not by oversight: see
 *  `UNRESOLVABLE_SHAPES`.
 *  @param {string} source the ledger's text
 *  @returns {{title: string, status: string|null, sentence: string,
 *             refs: {company: string|null, number: number}[]}[]} */
export function blockerClaims(source) {
  const out = []
  for (const entry of entries(source)) {
    const status = declaredStatus(entry.body)
    const acknowledged = acknowledgedRetirements(entry.body)
    for (const sentence of sentences(`${entry.title}. ${entry.body}`)) {
      if (!BLOCKER_PHRASES.some((re) => re.test(sentence))) continue
      const refs = [...sentence.matchAll(PR_REF)].map((m) => ({
        company: m[1] ?? null,
        number: Number(m[2]),
      }))
      if (refs.length === 0) continue
      out.push({
        title: entry.title,
        status,
        sentence: withoutListPrefix(sentence),
        refs,
        acknowledged: [...acknowledged],
      })
    }
  }
  return out
}

/** The blocker shapes this gate reads and cannot resolve, written down
 *  because an exclusion nobody wrote down is indistinguishable from one
 *  nobody noticed — which is `tools/gates/code-census.baseline.json`'s own
 *  stated reason for existing, applied to a scope rather than to a code.
 *  Counted by the CLI so its clean line says what it did not look at. */
export const UNRESOLVABLE_SHAPES = [
  { shape: 'an owner action', why: 'no forge state corresponds to it, and the owner is the only party who can retire it' },
  { shape: 'a repository permission', why: 'resolvable, but against the Actions configuration rather than the pull request list, which is a second forge call this gate does not make' },
  { shape: 'an unnamed set of rows', why: '"the five blocked pull requests" names a count and no numbers, so there is nothing to look up' },
]

/** Claims whose every retired row is already acknowledged by a marker, which
 *  is what the clean line counts so a green run does not claim "every named
 *  row still open" over a row that is closed and merely accounted for.
 *  @param {ReturnType<typeof blockerClaims>} claims
 *  @param {Set<number>|null} openSet
 *  @returns {number} */
export function acknowledgedStale(claims, openSet) {
  if (!openSet) return 0
  let n = 0
  for (const claim of claims) {
    const retired = claim.refs.map((r) => r.number).filter((x) => !openSet.has(x))
    if (retired.length !== claim.refs.length || retired.length === 0) continue
    const ack = new Set(claim.acknowledged ?? [])
    if (retired.every((x) => ack.has(x))) n += 1
  }
  return n
}

/** Which claims are stale, given the forge's open set.
 *
 *  A claim is stale when EVERY pull request it names has left the open set,
 *  because a blocker that is partly still open is still a blocker. `openSet`
 *  is the authority on openness and the absence of a number from it is what
 *  makes the claim stale, so a caller that could not reach the forge must
 *  pass `null` and get nothing back rather than pass an empty set and get
 *  every claim reported — which is the failure shape
 *  `tools/registers/check-ids.mjs` calls `OPEN_SET_UNKNOWN` and refuses for
 *  the same reason.
 *
 *  @param {ReturnType<typeof blockerClaims>} claims
 *  @param {Set<number>|null} openSet
 *  @returns {{title: string, status: string|null, sentence: string,
 *             retired: number[], code: string}[]} */
export function staleBlockers(claims, openSet) {
  if (openSet === null || openSet === undefined) return []
  const out = []
  for (const claim of claims) {
    const retired = claim.refs.map((r) => r.number).filter((n) => !openSet.has(n))
    if (retired.length !== claim.refs.length) continue
    // A retirement the entry already acknowledges is not a finding. Every
    // retired row has to be acknowledged, not just one of them, so adding a
    // second blocker to an entry that already carries a marker reopens the
    // finding rather than inheriting the old acknowledgement.
    const ack = new Set(claim.acknowledged ?? [])
    if (retired.every((n) => ack.has(n))) continue
    out.push({ ...claim, retired, code: 'BLOCKER_RETIRED' })
  }
  return out
}

/** The grading behind the same-sentence predicate, kept as data so the next
 *  seat re-derives it instead of re-arguing it. Re-derive with
 *  `node tools/ledger/check-blockers.mjs --grade`. */
export const GRADED = {
  read_at: '2026-11-09T04:21:13Z',
  ledger: 'docs/ideas.md',
  entries: 509,
  entry_scoped_hits: 7,
  entry_scoped_true_positives: 2,
  entry_scoped_false_positives: 5,
  true_positives_named: [
    '2026-11-02 — A measured block should carry the age of its method',
    '2026-11-09 (engineer, fifth message wake) — Filed, then taken in the same run',
  ],
  same_sentence_hits: 2,
  same_sentence_false_positives: 0,
  // THESE NUMBERS WERE 4 AND 2 FOR THE FIRST HOUR OF THIS FILE'S LIFE, and
  // `--grade` is what found them wrong, on its first live run, against the
  // file it was written beside. The published 4 came from a probe whose
  // dependency phrase was `depends on \`?#`, which requires the reference to
  // sit immediately after the phrase and so had already half-applied the
  // same-sentence rule it was supposed to be the control for. A control that
  // carries the treatment measures nothing. The honest entry-scoped number
  // over the broad phrase list is 7, and the case for the same-sentence rule
  // is stronger at 1-of-7 than it was at the 2-of-4 this file first claimed.
  false_positives_named: [
    {
      entry: '2026-09-27 — The ledger wants to be a directory',
      why: 'its blocker is real and unresolvable: "the five blocked pull requests" names a count and no numbers. The 13, 14, 16, 18 and 21 in it are ADR references.',
    },
    {
      entry: "2026-10-03 — The landing is the product's own best trial",
      why: 'a descriptive `depends on`, and its numbers are version and page references',
    },
    {
      entry: '2026-10-04 — The clone the capture needs, fetched by the capture',
      why: 'matches "changes what a label depends on", which states a property of a label and not a blocker',
    },
    {
      entry: '2026-11-09 — `parseDay` picks midnight UTC',
      why: 'matches "cheapest before anyone depends on it", which is an argument for doing the work now rather than a reason it is held up',
    },
    {
      entry: '2026-11-08 (engineer, scheduled slot, second window) — A generation has no size ceiling',
      why: 'matches "the rest was spent waiting on child processes", which is blocking I/O, and its #707 is the pull request being MEASURED rather than a blocker',
    },
  ],
  // THE DOMINANT FALSE-POSITIVE CAUSE, which is why the same-sentence rule
  // works rather than merely scoring well: `depends on` is written
  // descriptively in this ledger far more often than as a blocker — what a
  // label depends on, what a resolver's output depends on, what is cheapest
  // before anyone depends on it. Four of the five above are that one phrase.
  // A descriptive `depends on` almost never shares a sentence with a pull
  // request number, because the thing it describes is a property and not a
  // row, which is the structural reason the predicate survives the phrase
  // rather than a property of this sample.
  dominant_false_positive_cause: 'a descriptive `depends on`, 4 of the 5',
  // WHY THE COUNTS ABOVE ARE NOT WHAT `--grade` ASSERTS, which is this file's
  // second self-inflicted measurement defect in one run. `--grade` first
  // compared the live entry total and both hit totals against the three
  // numbers above and exited 1 on any difference. Every one of those grows
  // whenever ANY seat appends to this ledger, including the same run that
  // appends the ledger entry proposing the next repair, so the flag went red
  // within minutes of landing for a reason that is not a defect. That is
  // exactly `prompts/engineer-agent.md`'s finding about the branch-pattern
  // count — "a measurement whose value changes without anyone touching it
  // cannot live in prose" — rebuilt by the seat that cites it.
  //
  // So the invariant `--grade` enforces is the CLASSIFICATION and not the
  // totals: every entry-scoped hit in the live file is named above, either as
  // a true positive or as a false positive with its reason. A new hit is an
  // entry nobody has read in context yet, which is a real obligation and the
  // only thing here worth a non-zero exit. The totals are still printed, so
  // drift in them is visible without being fatal.
  // The one true positive the same-sentence rule misses, stated rather than
  // claimed as zero: the 2026-11-09 entry that names Ursa#768 puts the phrase
  // and the number in different sentences. That entry already carries its own
  // correction on top, so a gate firing on it today would be wrong, and the
  // rule gets the right answer on it for a reason unrelated to why it is
  // right. That is luck, not a property.
  known_miss: '2026-11-09 — Filed, then taken in the same run: phrase and number in different sentences, and already repaired in place',
  // THE SECOND SAME-SENTENCE HIT IS THIS RUN'S OWN CORRECTION, and it is
  // correct behaviour rather than noise. Writing the correction on top of the
  // 2026-11-02 entry meant QUOTING the blocker sentence, so the entry now
  // carries two sentences that each state a blocker and name #679: the
  // original and the quotation of it inside the paragraph that retires it.
  // Both are claims and both are cleared by the one
  // `<!-- blocker-retired: #679 -->` marker, which is the reason the
  // acknowledgement is keyed on the reference and scoped to the entry rather
  // than counted per sentence. A gate that cleared only the first would go
  // red on the repair, and a gate that stopped counting quoted blockers
  // would need to tell a quotation from a statement, which is not a thing a
  // regular expression can do.
  same_sentence_hits_after_this_run_s_own_correction: 2,
}

/** Entry-scoped hits the grading has not classified, which is the only thing
 *  `--grade` exits non-zero for. A title matches when `GRADED` names a prefix
 *  of it: the names above are the stable leading part of each heading, so an
 *  entry whose title is later extended stays accounted for.
 *  @param {string[]} titles every entry-scoped hit's title
 *  @returns {string[]} */
export function unclassifiedHits(titles) {
  const known = [...GRADED.true_positives_named, ...GRADED.false_positives_named.map((f) => f.entry)]
  return titles.filter((t) => !known.some((k) => t.startsWith(k)))
}
