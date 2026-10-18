// The one rule that makes `dist/ursa.cjs` a function of its source
// rather than of the machine that built it. Separated from
// `build/bundle.mjs` so `src/bundle-canonical.test.ts` can import it
// without running a build; `bundle.mjs` is a top-level-await script
// that writes a file when you import it.

const OUT = 'dist/ursa.cjs'

// Rewrite each inlined dependency's annotated path to the
// `node_modules/...` suffix it ends with, so that a bundle built from a
// package whose `node_modules` is hoisted to a parent directory or
// symlinked out of the tree is byte-identical to one built from a
// package that owns its own `node_modules`.
//
// The rewrites are derived from the build's own metafile rather than
// from a regular expression over the output, so the only strings
// touched are paths esbuild reports having read. In the canonical
// layout every input is already relative to the package, every
// candidate is skipped, and this function returns its argument
// unchanged — which is why installing it churns no committed digest.
//
// Two inputs that canonicalize to one string would collide as registry
// keys and one module's initializer would silently overwrite the
// other's, so that case throws instead of shipping.
export function canonicalizeInlinedPaths (text, metafile) {
  const rewrites = new Map()
  for (const input of Object.keys(metafile.inputs)) {
    const at = input.indexOf('node_modules/')
    if (at <= 0) continue                      // -1: not a dependency. 0: already canonical.
    if (input[at - 1] !== '/') continue        // e.g. a directory named `mynode_modules`
    const canonical = input.slice(at)
    const prior = rewrites.get(canonical)
    if (prior !== undefined && prior !== input) {
      throw new Error(
        `two inlined modules canonicalize to the same path, which would collide as ` +
        `registry keys in ${OUT}:\n  ${prior}\n  ${input}\n  both -> ${canonical}`
      )
    }
    rewrites.set(canonical, input)
  }
  // Longest source path first, so one path that is a prefix of another
  // cannot leave the longer one half-rewritten.
  const ordered = [...rewrites].sort((a, b) => b[1].length - a[1].length)
  let out = text
  for (const [canonical, input] of ordered) out = out.split(input).join(canonical)
  return out
}
