// The one place that decides a status and composes the line a reader scans,
// so the two cannot disagree, and the one list of premises, so a premise
// added later is routed by every instrument that already exists.
//
// WHY THIS EXISTS. On 2026-11-09 this seat sent Ursa's exo seat a rule about
// refusal channels: a verdict slot carries the refusal and never a number
// computed over nothing, and the dangerous do-nothing value is the one inside
// the legal range of the real answer. Exo replied with the arm that rule does
// not cover, which is the arm a gate is actually read on.
//
//   "A status channel needs a code RESERVED for the refusal, and reserving
//    one is necessary and not sufficient. Each premise has to be routed to
//    it, and the premise added last is the one that is not."
//
// It measured that on its own file and this run measured it on this kit. The
// numbers are in ../reviews/2026-11-09-message-ad/data/premise-routing.txt.
// Shape of the fault here: `lib/reached.mjs` reserved 2 for "I did not get to
// the subject" on 2026-11-09 and six instruments route to it. `lib/hydrated.mjs`
// reserved the same 2 for "the subject never ran" the SAME DAY, four hours
// later, and two instruments route to it. Seven page-driving instruments
// acquire the hydration premise and do not read it, which is exo's sentence
// with this kit's file names in it: the premise added last is the one that
// is not routed.
//
// WHY A BUNDLE RATHER THAN A SEVENTH CALL SITE. Routing the premise into
// seven files by hand fixes today and not tomorrow, because the eighth
// premise will be added the same way the second was. `PREMISES` below is the
// list, and `premises()` hands back something that acquires every premise on
// it and decides on all of them. Adding an entry there routes it everywhere
// this is used, and `selftest/check-premise-routing.mjs` fails for any
// page-driving instrument that is not.
//
// WHY `decide` RETURNS BOTH. Exo's repair was one function deciding the exit
// and composing the printed line, "so the status and the report cannot
// disagree". This kit had already paid for the split version twice: a run of
// `measure-focus.mjs` over a matrix of not-found pages printed a passing
// headline and then refused on the next line, and three layers of carriage
// above a gate each reported zero while its prose survived. So `decide()`
// hands back `{ code, text }` together and a caller that prints one and exits
// the other cannot get them out of step.
import { tracker, UNREACHED } from './reached.mjs'
import { gate, waitForHydration, NOT_HYDRATED } from './hydrated.mjs'

// Both premises reserve the same value on purpose. 2 is "this run cannot
// answer" for the whole kit, and which premise failed is what the lines say.
// A caller distinguishing them by status would be reading a channel that
// carries one value for a question with two answers.
export const UNDECIDED = 2

// The list. Order is the order a reader needs: a page that was never reached
// cannot be asked whether it hydrated, so reach reports first and its refusal
// replaces everything after it.
//
// To add a premise: give it an entry here with a gate exposing `saw`,
// `lines`, `code`, `nothingRan`/`nothingReached` and `refused`, the same five
// methods the two existing ones already expose, and wire its acquisition into
// `visit` below. Nothing else changes and no instrument is edited.
export const PREMISES = ['reached', 'hydrated']

export function premises({ expect404 = [], label = 'page', hydrate = true } = {}) {
  const reach = tracker({ expect404, label })
  const hydration = gate({ label })
  // `hydrate: false` is for a caller whose subject is not a page that ships a
  // client runtime at all, and it is NOT the same as leaving the premise
  // unrouted: the gate below is narrow by construction, since a page with no
  // runtime is not in its refusal set. The flag exists for the one case the
  // narrowness does not cover, which is a tool that navigates to `about:blank`
  // as scratch space. Everything else should leave it on and let the gate
  // decide. See lib/hydrated.mjs on the too-wide refusal.
  const parts = [
    { name: 'reached', g: reach, empty: () => reach.nothingReached() },
    ...(hydrate ? [{ name: 'hydrated', g: hydration, empty: () => hydration.nothingRan() }] : []),
  ]

  return {
    reach,
    hydration,
    // Acquires every premise on the list in one call, which is the property
    // that makes the list load-bearing. Only the navigation and the probe are
    // inside it; the measuring the caller does afterwards is not, because a
    // refusal scoped one call too wide turns a finding into a non-answer.
    async visit(page, url, path, opts = { waitUntil: 'networkidle' }) {
      const v = await reach.visit(page, url, path, opts)
      if (!v.ok) return v
      if (hydrate) hydration.saw(path, await waitForHydration(page))
      return v
    },
    // For a caller that has its own navigation, usually because it retries or
    // waits for a selector first. Hydration is a race, so ask AFTER the
    // caller's own settling, never before it.
    async probed(page, path) {
      if (!hydrate) return null
      return hydration.saw(path, await waitForHydration(page))
    },
    lines() {
      return parts.flatMap((p) => p.g.lines())
    },
    // Which premise failed, in list order, or null when none did. The caller
    // does not usually need this; `decide` reads it.
    failed() {
      return parts.filter((p) => p.g.code()).map((p) => p.name)
    },
    code() {
      return parts.some((p) => p.g.code()) ? UNDECIDED : 0
    },
    // The composed report. `headline` is the caller's own verdict sentence
    // and `siteCode` the status that goes with it, which stays the caller's
    // call: this kit deliberately holds that a verdict about the SITE can be
    // exit 0 however bad it is, while a verdict about the INSTRUMENT is one
    // no caller can make from outside. A refusal REPLACES the headline and
    // never follows it, because a refusal printed after a pass is read as a
    // pass.
    decide({ headline = '', siteCode = 0 } = {}) {
      const broken = parts.filter((p) => p.g.code())
      const lines = this.lines()
      if (broken.length) {
        const first = broken[0]
        const slot = first.empty() ? first.g.refused() : headlineFor(first, label)
        return {
          code: UNDECIDED,
          headline: slot,
          lines,
          text: [slot, ...lines].join('\n'),
          refused: true,
          premise: first.name,
        }
      }
      return {
        code: siteCode,
        headline,
        lines,
        text: [...(headline ? [headline] : []), ...lines].join('\n'),
        refused: false,
        premise: null,
      }
    },
  }
}

// The headline for a partial refusal: some subjects answered and some did
// not, so there is a number to be had and it is not the one the caller asked
// for. Naming the count rather than printing the caller's headline is the
// whole point; `lines()` below it names the paths.
function headlineFor(part, label) {
  const rows = part.g.rows()
  const bad = part.name === 'reached' ? part.g.unreached() : part.g.dead()
  const what = part.name === 'reached'
    ? 'did not reach their subject'
    : 'shipped a client runtime that never ran'
  return `NO VERDICT HERE: ${bad.length} of ${rows.length} ${label} loads ${what}, so this run's headline is withheld rather than taken over the rest.`
}

export { UNREACHED, NOT_HYDRATED }
