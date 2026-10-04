// One shared text helper: the excerpt used wherever a signal quotes the
// user's own words or an agent's generation. Kept in its own module so
// signals.ts and loops.ts share one definition of "quoted, truncated"
// instead of two that can drift apart.

/** longest quote a signal entry carries before it is elided with an ellipsis */
export const MAX_EXCERPT = 220

export function excerpt(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim()
  return t.length > MAX_EXCERPT ? t.slice(0, MAX_EXCERPT) + '…' : t
}
