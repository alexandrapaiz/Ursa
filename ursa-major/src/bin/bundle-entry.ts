// The bundle's entrypoint.
//
// src/bin/ursa.ts guards its own self-invocation on the filename ending
// in `ursa.ts`, which is right for `npx tsx src/bin/ursa.ts` and wrong
// for a bundled `dist/ursa.cjs`. This file exists so the bundle has one
// unambiguous place that runs main() and sets the exit code, and so the
// guard in ursa.ts stays exactly as it was for the local path.

import { main } from './ursa'

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err: unknown) => {
    console.error(`ursa: ${(err as Error).message}`)
    process.exit(1)
  })
