// What a revocation reaches, in the words every surface that confirms one
// uses.
//
// WHY THIS IS A MODULE AND NOT A SENTENCE IN EACH SURFACE. The claim a
// product makes at the moment a user withdraws something is the one claim
// she believes and cannot check, so it is the one that has to be true. It
// has two halves, and they are true of different things:
//
//   Forward, and enforced: every export and every overlay this tool
//   renders from here on leaves the statement out, and the tombstone stops
//   a later distillation from concluding it again. `src/consent.ts` and
//   `src/tuning/revocation.ts` are the enforcement.
//
//   Backward, and permanently unreachable: a block she already pasted into
//   another vendor's instructions field has no gateway this product can
//   address. It can neither be enumerated nor asked for a receipt, which
//   is also exactly why the paste channel works at all, since it asks the
//   vendor for nothing. See §10.6 of docs/design/consent-and-erasure.md.
//
// The CLI learned to say both halves on 2026-10-24. The dashboard still
// said only the first one on 2026-10-26, in two places, because the words
// lived inside the surface that printed them and there was nothing for a
// second surface to reuse. Two surfaces confirming the same revocation in
// two different scopes is not a copy inconsistency, it is one of them
// telling the user something false. So the words live here, both surfaces
// import them, and `src/tuning/revocation.test.ts` asserts that neither
// has drifted back to the unscoped form.
//
// Placed under overlay/lib/ rather than src/ because that is the direction
// imports already run in this repository: `src/bridge/index.ts` and
// `src/bridge/crypto.ts` import from overlay/lib, and the overlay's own
// tsconfig includes only overlay. No dependencies, no side effects, so
// both a Next client component and a Node CLI can import it.

/**
 * The forward half: what withdrawing does, scoped to what this tool
 * renders. Every word of it is enforced by code in this repository.
 */
export const REVOCATION_HOLDS_FORWARD =
  'It is kept as a tombstone so a later distillation cannot bring it back, and ' +
  'every export and every overlay from here on leaves it out.'

/**
 * The backward half: the copy the tool cannot reach, and the only action
 * that ends it.
 *
 * @param surface how the confirming surface refers to itself, in the
 *   grammatical position of a subject that cannot find something: `'this
 *   command'` from the CLI, `'this page'` from the dashboard. Passed in
 *   rather than branched on here, because the sentence is the contract and
 *   the pronoun is the surface's own business.
 */
export function revocationCannotReachPastedCopies(surface: string): string {
  return (
    'A block you already pasted into another product is outside what this can reach. ' +
    `That copy is a text field in somebody else's settings, ${surface} cannot find it or ` +
    'change it, and it keeps working until you replace it yourself. Run ' +
    '`ursa tuning export` again and paste the new block over the old one everywhere you put it.'
  )
}
