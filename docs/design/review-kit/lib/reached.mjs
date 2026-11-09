// Did the instrument reach its subject at all, and does it say so in both
// channels a caller can read.
//
// WHY THIS EXISTS. On 2026-11-09 this seat repaired `measure-narrow.mjs`,
// which had reported a pass over a matrix it never loaded, and the repair
// covered the LOUD absence only: nothing listening on the port, which
// makes `page.goto` throw. Ursa's exo seat then sent the general form of
// the fault, which is worth more than the instance: ask what an instrument
// returns when it does nothing, and whether that value is inside the legal
// range of the real answer. In band needs a positive control every time;
// out of band, a thrown error or a null, needs none.
//
// Measured the same day in `../reviews/2026-11-09-message-w/data/`, three
// columns per instrument: the real pages, a dead port, and a server that is
// UP while every requested path answers 404. The third column is the quiet
// absence and it is the one that happens, because routes get renamed and
// ports get reused while a dead port is loud and immediate. Four of six
// instruments were byte-for-byte indistinguishable between column one and
// column three: exit 0 and a passing headline, over Next's not-found page,
// which has text runs to measure, tab stops to walk and no overflow.
//
// Nine of the kit's ten browser-driving tools discarded the navigation
// response entirely. The tenth, `shoot.mjs`, read the status, printed it in
// every row, and never gated on it, so the datum was present and the
// verdict ignored it.
//
// A 404 is not always absence. `shoot.mjs` and `measure-contrast.mjs` both
// ship `/this-page-does-not-exist` in their default page lists on purpose,
// because the not-found page is a page of this site and has to be reviewed
// like any other. So the test cannot be the status alone. It is whether the
// CALLER declared the status it expected, which is what `expect404` carries.
//
//   const reach = tracker({ expect404: EXPECT_404 })
//   const resp = await page.goto(url, { waitUntil: 'networkidle' })
//   reach.saw(path, resp)                 // after every goto, including retries
//   ...
//   console.log(reach.lines().join('\n')) // the words, always printed
//   process.exit(reach.code())            // 2 when anything was unreached
//
// Both channels, because exo's third note of that day is the reason. This
// repository's own gate suite exited 2 and said in words on the next line
// that it was not a verdict, and three layers of carriage above it each
// reported zero: a `tail` in a pipeline, an `echo` of that status, and a
// harness completion notice reading the last command in the chain. The
// prose survived all three. A status is a single value every wrapper is
// entitled to replace and a printed line is content wrappers forward by
// default, so the redundant channel costs one `console.log` and is the one
// that arrives.

// 2, never 1, and the distinction is load-bearing. The kit's selftests run
// these tools over fixtures that deliberately FAIL, and read the findings
// out of the tool's own JSON, so `check-contrast.mjs` treats a non-zero
// status as a broken instrument. A verdict about the SITE stays exit 0
// however bad it is, because the reader of the table makes that call. A
// verdict about the INSTRUMENT is one no caller can make from outside, and
// that is this code. Same reasoning and same value as `measure-narrow.mjs`.
export const UNREACHED = 2

export function tracker({ expect404 = [], label = 'page' } = {}) {
  const expected = new Set(
    (Array.isArray(expect404) ? expect404 : String(expect404).split(','))
      .map((s) => String(s).trim()).filter(Boolean),
  )
  const seen = []

  return {
    // `resp` is whatever `page.goto` returned. It is null for a same-document
    // navigation and for a redirect playwright did not consider a new
    // document, which is not absence, so a null response is recorded as
    // unknown rather than scored. Named because a null read as 0 would be
    // this same fault one level in.
    saw(path, resp) {
      const status = resp && typeof resp.status === 'function' ? resp.status() : null
      seen.push({ path: String(path), status, declared: expected.has(String(path)) })
      return status
    },
    // Anything the caller asked for that answered 400 or worse without
    // having been declared. A declared path that answers 200 is also wrong
    // and is reported, because a 404 page that started returning 200 means
    // a route now shadows it, but it is not absence so it does not gate.
    unreached() {
      return seen.filter((s) => s.status !== null && s.status >= 400 && !s.declared)
    },
    surprises() {
      return seen.filter((s) => s.declared && s.status !== null && s.status < 400)
    },
    lines() {
      const out = []
      const bad = this.unreached()
      const odd = this.surprises()
      const unknown = seen.filter((s) => s.status === null)
      if (bad.length) {
        out.push('')
        out.push(`NOT MEASURED: ${bad.length} of ${seen.length} ${label} loads answered 400 or worse and were not declared, so this run makes no claim about them.`)
        for (const s of bad) out.push(`  ${s.path} -> HTTP ${s.status}`)
        out.push('Declare an intentionally-absent path with --expect-404 <paths> if that status is the subject.')
      } else if (seen.length) {
        out.push('')
        out.push(`every one of the ${seen.length} ${label} loads this run measured was reached: ${seen.map((s) => `${s.path} ${s.status === null ? 'same-document' : s.status}`).join(', ')}.`)
      }
      for (const s of odd) out.push(`REPORTED, not a failure: ${s.path} was declared absent and answered HTTP ${s.status}, so a route may now shadow it.`)
      if (unknown.length) out.push(`${unknown.length} load(s) returned no response object, which is a same-document navigation and not an absence.`)
      return out
    },
    code() {
      return this.unreached().length ? UNREACHED : 0
    },
    rows() { return seen.slice() },
  }
}
