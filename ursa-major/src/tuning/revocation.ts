// The store-side half of the revocation guarantee.
//
// `docs/design/consent-and-erasure.md` §6c promises that a later
// distillation cannot revive a revoked axiom, and it names two
// mechanisms for that: a check in `tuning/merge.ts` and the "REVOKED
// AXIOMS (do not resurrect)" block `tuning/distill.ts` puts in the
// prompt. Only one of those was enforcement. The merge check reads
// `match.status === 'revoked'`, and `match` is resolved from
// `d.matchesExisting`, which the MODEL fills in. A model that restates a
// revoked axiom in new words and leaves `matchesExisting` null never
// reaches that check at all, so the only thing standing between a
// revoked inference and the exported tuning block was a sentence in a
// prompt.
//
// This module is the check that does not ask the model anything. It
// scores a candidate statement against the record's tombstones using the
// repository's own lexical primitives, so every block is explainable
// from the functions in `src/match.ts` and one threshold, the same
// auditability rule the span resolver holds itself to.
//
// Why lexical and not an embedding: the same reason `src/match.ts` gives
// for the span labels. A revocation that the user believes happened and
// which did not is the worst outcome this product has, so the mechanism
// that prevents it has to be inspectable by the user whose revocation it
// is, offline, with no model in the loop.

import { normalize } from '../normalize'
import { containment, tokens } from '../match'
import type { TuningAxiom } from './types'

/**
 * Function words and polarity verbs, dropped before comparison.
 *
 * Two groups, for two reasons. Articles, prepositions, auxiliaries and
 * quantifiers carry no preference content, so leaving them in lets two
 * unrelated statements share tokens and inflates every score. Negation
 * and direction words (`no`, `never`, `avoid`, `prefer`) are dropped
 * because "avoid entrance motion" and "no entrance motion" are the same
 * rule written twice, and the direction of a rule already has its own
 * field on the axiom (`polarity`) which this comparison deliberately
 * ignores — see `revocationSimilarity`.
 */
export const STATEMENT_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'as',
  'is', 'are', 'be', 'been', 'it', 'its', 'this', 'that', 'these', 'those', 'there',
  'do', 'dont', 'does', 'did', 'should', 'must', 'can', 'may', 'will', 'would',
  'no', 'not', 'never', 'any', 'all', 'every', 'each', 'ever',
  'avoid', 'prefer', 'keep', 'use', 'using', 'make', 'put', 'add', 'always',
  'under', 'over', 'less', 'more', 'than', 'then', 'so', 'if', 'when', 'while',
])

/**
 * Crude suffix fold, deliberately not a stemmer.
 *
 * It exists for one measured reason: without it, "explanatory labels on
 * visual elements" and "a label explaining a visual element" share no
 * tokens at all and score 0.17, which is indistinguishable from two
 * unrelated statements. Folding four English suffixes lifts that pair to
 * 0.75. It is wrong on irregular forms, and that is tolerable here
 * because a miss costs a review (the statement is held, not lost)
 * while an over-fold costs nothing at all: both strings fold the same
 * way or they do not.
 */
export function foldSuffix(token: string): string {
  if (token.length <= 3) return token
  return token.replace(/ies$/, 'y').replace(/(ing|ed|es|s)$/, '')
}

/** The content tokens of a statement: normalized, de-stopworded, folded, deduped. */
export function contentTokens(statement: string): string[] {
  const out = new Set<string>()
  for (const t of tokens(normalize(statement).norm)) {
    if (STATEMENT_STOPWORDS.has(t)) continue
    out.add(foldSuffix(t))
  }
  return [...out]
}

/**
 * Order-insensitive similarity of two axiom statements, in [0, 1].
 *
 * The maximum of containment in both directions over content tokens.
 * Both directions matter and they mean different things:
 *
 *   every content word of the REVOKED statement appears in the new one
 *     → the new statement covers the revoked rule and adds qualifiers
 *   every content word of the NEW statement appears in the revoked one
 *     → the new statement is the revoked rule with qualifiers dropped
 *
 * Both are revivals, so the gate takes whichever is larger.
 *
 * This is not `similarity` from `src/match.ts`, and the difference is
 * measured rather than stylistic. That function averages containment
 * with Levenshtein distance, which is the right score for a span of
 * prose that was edited in place and the wrong one for a rule that was
 * reworded, because reordering a clause destroys character alignment
 * while leaving the rule identical. On the calibration set in
 * `docs/design/revocation-store-gate.md` section 4, the combined score
 * put paraphrases as low as 0.317 and unrelated statements as high as
 * 0.477, with no threshold between them. Content-token containment
 * separates the same set at every paraphrase >= 0.600 and every
 * unrelated pair <= 0.500.
 *
 * `polarity` is not consulted. A model that wanted to slip a revoked
 * rule past a polarity check could flip the field and negate the words,
 * and negation words are stopped out here, so a polarity exemption would
 * be an exemption in name only. The blocked entry records the polarity
 * it arrived with, and the user decides.
 */
export function revocationSimilarity(a: string, b: string): number {
  const at = contentTokens(a)
  const bt = contentTokens(b)
  if (at.length === 0 || bt.length === 0) return 0
  return Math.max(containment(at, new Set(bt)), containment(bt, new Set(at)))
}

/**
 * The one threshold a block is explainable from.
 *
 * Calibrated on the statements this repository actually contains: 28
 * pairs of distinct statements and 10 paraphrase pairs
 * (`docs/design/revocation-store-gate.md` §4). Distinct pairs topped out
 * at 0.500, paraphrases bottomed out at 0.600, and this sits between
 * them. It is a calibration on 38 pairs and not an error rate; the
 * harness that would produce an error rate is named as the next slice in
 * that document's §7.
 *
 * It is set low on purpose. The two failure directions do not cost the
 * same thing. A miss revives an inference the user revoked, which is the
 * failure this whole module exists to prevent and which the user cannot
 * see. An over-block parks a legitimately new axiom in
 * `TuningRecord.blockedByRevocation`, where the user can read it and run
 * one command to release it.
 */
export const THETA_REVOKED = 0.55

export interface RevocationBlock {
  /** id of the revoked axiom this statement restates */
  blockedBy: string
  /** revocationSimilarity against that axiom's statement */
  score: number
}

/**
 * Decide whether a candidate statement may become an active axiom.
 *
 * Returns the block when the candidate restates a tombstone, or null
 * when it may be created.
 *
 * The `live` argument is why the gate does not fight the user. Once she
 * releases a blocked statement it becomes a live axiom, and a later
 * pass that emits the same statement without declaring a match would
 * otherwise be blocked again by the same tombstone, forever. So a
 * candidate that sits at least as close to an axiom she still holds as
 * it does to one she revoked is not a revival: it is a duplicate of a
 * rule she has endorsed, and duplicates are what the merge already does
 * with an undeclared match. Exploiting this would require a live axiom
 * that already says the revoked thing, which means the user holds that
 * rule on purpose.
 */
export function findRevocationBlock(
  statement: string,
  tombstones: Pick<TuningAxiom, 'id' | 'statement'>[],
  live: Pick<TuningAxiom, 'id' | 'statement'>[] = []
): RevocationBlock | null {
  let best: RevocationBlock | null = null
  for (const t of tombstones) {
    const score = revocationSimilarity(statement, t.statement)
    if (!best || score > best.score) best = { blockedBy: t.id, score }
  }
  if (!best || best.score < THETA_REVOKED) return null
  for (const a of live) {
    if (revocationSimilarity(statement, a.statement) >= best.score) return null
  }
  return { blockedBy: best.blockedBy, score: Math.round(best.score * 1000) / 1000 }
}
