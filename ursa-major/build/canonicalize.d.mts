// Hand-written types for `build/canonicalize.mjs`. The build scripts are
// plain `.mjs` on purpose — `build/bundle.mjs` has to run on a bare
// `node` with nothing installed but esbuild, so it is never compiled —
// and `src/bundle-canonical.test.ts` is TypeScript under `tsc --noEmit`.
// This file is the seam between the two.

/** The one field of esbuild's metafile the canonicalizer reads. */
export interface InlinedModuleMetafile {
  inputs: Record<string, unknown>
}

export function canonicalizeInlinedPaths (
  text: string,
  metafile: InlinedModuleMetafile,
): string
