// The passphrase is the whole secret, and until 2026-10-26 nothing told
// anyone so.
//
// `src/bridge/crypto.ts` stretches it under a salt that is a fixed
// application constant, and states the reason in the file: the sync server
// must never learn whose blob a blob is, so there is no per-user salt to
// mix in. The same file states the precondition that tradeoff rests on,
// "the passphrase must therefore be strong". The only check that existed
// was `if (!passphrase)`, at the one moment a person chooses it.
//
// What a shared salt costs, and why this is a warning worth shipping on
// its own: one offline table of candidate passphrases serves every user of
// every deployment, and each entry of that table is also a sync URL, since
// the blob id is the other half of the same derivation. So the failure is
// not one weak account. It is enumeration, over a read path that is open
// by design, and the same guess hands over the write capability too.
//
// These tests hold the three things that could rot. That the warning
// exists at all. That it never refuses, because the passphrase is the only
// name an existing blob has and a minimum enforced here would lock out
// whoever already chose something shorter with nobody holding a copy. And
// that the sentence it prints names the shared salt, because a warning
// that says "too short" without saying why reads as pedantry and gets
// ignored.
import { describe, expect, it, vi, afterEach } from 'vitest'
import { WEAK_PASSPHRASE_CHARS, warnIfWeakPassphrase } from './bin/ursa'

function captureStderr(run: () => void): string {
  const lines: string[] = []
  const spy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '))
  })
  try {
    run()
  } finally {
    spy.mockRestore()
  }
  return lines.join('\n')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the weak-passphrase warning', () => {
  it('warns on a short passphrase', () => {
    const out = captureStderr(() => warnIfWeakPassphrase('hunter2'))
    expect(out).toMatch(/warning/)
    expect(out).toMatch(/7 characters/)
  })

  it('says the salt is shared, which is the reason and not an aside', () => {
    const out = captureStderr(() => warnIfWeakPassphrase('short'))
    expect(out).toMatch(/same for everyone/)
    expect(out).toMatch(/offline/)
  })

  // Never prints the passphrase back. A warning that echoes the secret into
  // a terminal, a CI log or a screen recording is worse than no warning.
  it('does not echo the passphrase it is complaining about', () => {
    const secret = 'correcthorse'
    const out = captureStderr(() => warnIfWeakPassphrase(secret))
    expect(out).not.toContain(secret)
  })

  it('is silent at the threshold and above it', () => {
    expect(captureStderr(() => warnIfWeakPassphrase('x'.repeat(WEAK_PASSPHRASE_CHARS)))).toBe('')
    expect(captureStderr(() => warnIfWeakPassphrase('x'.repeat(WEAK_PASSPHRASE_CHARS + 40)))).toBe('')
  })

  it('warns just below the threshold, so the boundary is pinned', () => {
    const out = captureStderr(() => warnIfWeakPassphrase('x'.repeat(WEAK_PASSPHRASE_CHARS - 1)))
    expect(out).toMatch(/warning/)
  })

  // The behaviour-preserving half of the fix, asserted rather than
  // described: it returns, it does not throw, and it does not exit.
  it('refuses nothing', () => {
    expect(() => warnIfWeakPassphrase('a')).not.toThrow()
    expect(warnIfWeakPassphrase('a')).toBeUndefined()
  })

  // Guards the sentence against the number drifting away from the constant,
  // the same reason src/pair-minimum-shared.test.ts exists.
  it('states the threshold it is using, read from the constant', () => {
    const out = captureStderr(() => warnIfWeakPassphrase('tiny'))
    expect(out).toContain(`${WEAK_PASSPHRASE_CHARS} characters or more`)
  })
})
