// Does lib/verdict.mjs decide the way the rule says, over cases that include
// the one no test over today's data catches.
//
// The seventh case is the reason this file exists. Exo's measurement on
// 2026-11-09: its gauge's no-information answer and its right answer
// COINCIDED that day, because the real event happened to be the one the
// broken arm also printed. "No test over today's data can catch that." So
// the cases below are not samples of today's site. They are the premise
// states, each asserted on its own, including the two where the refusal and
// a true verdict agree.
//
// Usage:  node selftest/check-verdict.mjs
// Exits:  0 all cases pass   1 a case failed   2 the module would not load
import { premises, UNDECIDED } from '../lib/verdict.mjs'

const CANNOT_ANSWER = 2
if (typeof premises !== 'function') {
  console.log('NO VERDICT: lib/verdict.mjs exports no premises(), so this check makes no claim.')
  process.exit(CANNOT_ANSWER)
}

const resp = (status) => ({ status: () => status })
const fails = []
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fails.push({ name, got, want })
  console.log(`  ${ok ? 'pass' : 'FAIL'}  ${name}${ok ? '' : `\n          got  ${JSON.stringify(got)}\n          want ${JSON.stringify(want)}`}`)
}

console.log('# lib/verdict.mjs, premise states\n')

// 1. Everything reached and hydrated, no findings. Exit 0 and the caller's
// headline survives verbatim.
{
  const g = premises()
  g.reach.saw('/', resp(200))
  g.hydration.saw('/', { runtime: true, body: true, fibers: 90, els: 100 })
  const v = g.decide({ headline: '0 of 12 below the floor', siteCode: 0 })
  check('reached and hydrated: code', v.code, 0)
  check('reached and hydrated: headline is the caller\'s', v.headline, '0 of 12 below the floor')
  check('reached and hydrated: not refused', v.refused, false)
}

// 2. Everything reached and hydrated, findings present. The SITE verdict is
// the caller's to set and the module does not overrule it.
{
  const g = premises()
  g.reach.saw('/', resp(200))
  g.hydration.saw('/', { runtime: true, body: true, fibers: 90, els: 100 })
  const v = g.decide({ headline: '3 of 12 below the floor', siteCode: 1 })
  check('findings: the caller\'s site code is kept', v.code, 1)
  check('findings: the caller\'s headline is kept', v.headline, '3 of 12 below the floor')
}

// 3. Nothing reached. The refusal REPLACES the headline, and the headline the
// caller passed must not appear anywhere in the composed text, because a
// refusal printed after a pass is read as a pass.
{
  const g = premises()
  g.reach.saw('/a', resp(404))
  g.reach.saw('/b', resp(404))
  const v = g.decide({ headline: '0 of 0 below the floor', siteCode: 0 })
  check('nothing reached: code', v.code, UNDECIDED)
  check('nothing reached: refused', v.refused, true)
  check('nothing reached: which premise', v.premise, 'reached')
  check('nothing reached: headline withheld', v.text.includes('0 of 0 below the floor'), false)
  check('nothing reached: the slot carries the refusal', v.headline.startsWith('NO VERDICT'), true)
}

// 4. Some reached, some not. There IS a number to be had and it is not the
// one the caller asked for, so the headline is still withheld. This is the
// in-band case: "1 of 1 below the floor" over half a matrix is a legal value
// of the real answer.
{
  const g = premises()
  g.reach.saw('/a', resp(200))
  g.reach.saw('/b', resp(404))
  g.hydration.saw('/a', { runtime: true, body: true, fibers: 90, els: 100 })
  const v = g.decide({ headline: '1 of 1 below the floor', siteCode: 1 })
  check('partial reach: code is the refusal, not the finding', v.code, UNDECIDED)
  check('partial reach: headline withheld', v.text.includes('1 of 1 below the floor'), false)
  check('partial reach: the count is named', v.headline.includes('1 of 2'), true)
}

// 5. Reached, served, never ran. The premise added last, on its own. Before
// this module this state was exit 0 with a passing headline in 8 of 9 of
// this kit's page-driving instruments.
{
  const g = premises()
  g.reach.saw('/', resp(200))
  g.hydration.saw('/', { runtime: true, body: false, fibers: 3, els: 114 })
  const v = g.decide({ headline: '0 of 38 tab stops below a floor', siteCode: 0 })
  check('never ran: code', v.code, UNDECIDED)
  check('never ran: which premise', v.premise, 'hydrated')
  check('never ran: headline withheld', v.text.includes('0 of 38 tab stops below a floor'), false)
}

// 6. A page with no client runtime at all, which is every file:// fixture the
// kit's own selftests drive. NOT a refusal, or the gate converts ten passing
// selftests into non-answers. Over-refusal is the failure mode a guard
// written in reaction to a false green reaches for first; exo named it the
// one it nearly shipped.
{
  const g = premises()
  g.reach.saw('fixture.html', null)
  g.hydration.saw('fixture.html', { runtime: false, body: false, fibers: 0, els: 40 })
  const v = g.decide({ headline: '2 of 7 below the floor', siteCode: 1 })
  check('no runtime: not a refusal', v.code, 1)
  check('no runtime: the finding stands', v.headline, '2 of 7 below the floor')
}

// 7. The case no test over today's data catches. Both premises fail AND the
// caller's headline happens to be the true verdict. The status still has to
// be the refusal, because the agreement is luck and not information.
{
  const g = premises()
  g.reach.saw('/a', resp(200))
  g.hydration.saw('/a', { runtime: true, body: false, fibers: 2, els: 102 })
  // Suppose the site really does have 0 defects today. The dead page says 0
  // too. Same number, no information behind it.
  const v = g.decide({ headline: '0 of 38 tab stops below a floor', siteCode: 0 })
  check('right by luck: the status is still the refusal', v.code, UNDECIDED)
  check('right by luck: the number is not published', v.text.includes('0 of 38'), false)
}

// 8. Reach fails and hydration fails together. Reach reports first, because a
// page never reached cannot be asked whether it ran.
{
  const g = premises()
  g.reach.saw('/a', resp(500))
  g.hydration.saw('/a', { runtime: true, body: false, fibers: 0, els: 100 })
  const v = g.decide({ headline: 'x', siteCode: 0 })
  check('both fail: reach reports first', v.premise, 'reached')
}

// 9. hydrate:false leaves the premise unacquired rather than silently passed.
{
  const g = premises({ hydrate: false })
  g.reach.saw('about:blank', resp(200))
  const v = g.decide({ headline: 'y', siteCode: 0 })
  check('hydrate:false: code', v.code, 0)
  check('hydrate:false: no hydration line', v.lines.some((l) => l.includes('hydrat')), false)
}

console.log('')
console.log(fails.length
  ? `FAILED: ${fails.length} case(s) of the module's premise states do not decide as the rule says.`
  : 'every premise state in this file decides as the rule says, including the two where the refusal and a true verdict agree.')
process.exit(fails.length ? 1 : 0)
