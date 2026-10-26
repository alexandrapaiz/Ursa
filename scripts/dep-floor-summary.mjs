// The one sentence `scripts/dep-floor.mjs` prints last, as a pure function.
//
// WHY IT IS A SEPARATE FILE. dep-floor.mjs does its work at import time: it
// walks the repository, shells out to `npm audit` twice per package, and
// exits. There is no way to import it and ask it a question, so every string
// it produced was unreachable from a test and the three branches added here
// on 2026-10-26 would have shipped unexercised. tools/ledger/check.mjs has
// the same shape and solved it the same way, by moving the part worth
// asserting into tools/ledger/block-kinds.mjs. This is that split.
//
// WHY THE BRANCHES EXIST AT ALL. `failed` in dep-floor.mjs is
// `violations.length > 0 || expired.length > 0`, and the single message it
// used to print said "Dependency floor breached" for both. Those are not the
// same news and they do not ask for the same repair:
//
//   - A VIOLATION is an advisory above the floor with nothing allowing it.
//     The floor really is breached. Repair: upgrade, or have the owner add an
//     exception to dep-floor.allow.json.
//   - An EXPIRED EXCEPTION is the floor never having been breached. The owner
//     accepted this risk on a Tuesday, with an expiry, and the expiry
//     arrived. Repair: the owner renews it or retires it, and a seat cannot
//     do either. This is dep-floor.allow.json working exactly as its header
//     says it should — "a risk the owner accepted on a Tuesday should come
//     back and ask again" — reported as if someone had broken something.
//
// This is Ursa's skill seat's rule of 2026-10-26, which generalises a finding
// of this seat's: a failure message names the cause its author thought of,
// while the number of ways to reach that branch is a property of the code, so
// one named cause for a condition with several is a hypothesis wearing the
// authority of a measurement.

const WHERE = 'See scripts/dep-floor.mjs for what the floor is and docs/design/dependency-floor.md for why.'

/** `3 advisories`, `1 advisory`. */
function n(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

/**
 * @param {number} violationCount advisories above the floor with no exception
 * @param {number} expiredCount matching exceptions whose `expires` has passed
 * @returns {string} one line, naming which condition fired and whose the fix is
 */
export function summaryLine(violationCount, expiredCount) {
  const advisories = n(violationCount, 'advisory', 'advisories')
  const them = violationCount === 1 ? 'it' : 'them'
  const exceptions = n(expiredCount, 'accepted exception', 'accepted exceptions')
  const have = expiredCount === 1 ? 'has' : 'have'

  if (violationCount > 0 && expiredCount > 0) {
    return (
      `Dependency floor breached, and separately ${exceptions} ${have} expired. ` +
      `${advisories} above the floor with nothing allowing ${them}: upgrade, or have the owner add an ` +
      `exception. The expiries are the owner's to renew or retire. ${WHERE}`
    )
  }
  if (violationCount > 0) {
    return `Dependency floor breached: ${advisories} above the floor with nothing allowing ${them}. ${WHERE}`
  }
  if (expiredCount > 0) {
    return (
      'The floor itself holds: no critical anywhere, no high in any production tree. ' +
      `What failed is paperwork. ${exceptions} ${have} expired, named above with who approved ` +
      `${expiredCount === 1 ? 'it' : 'them'}. Renewing one is the owner's call and not a seat's, ` +
      'which is dep-floor.allow.json doing its job and asking again.'
    )
  }
  return 'Dependency floor holds: no critical anywhere, no high in any production tree.'
}
