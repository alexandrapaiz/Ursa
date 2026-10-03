// Write the synthetic HQ store from fixtures.ts into a directory, so the
// walkthrough in docs/design/hq-briefing.md can be reproduced by anyone
// with a checkout and no private data:
//
//   npx tsx src/hq/seed.ts /tmp/hq-demo
//   npx tsx src/hq/cli.ts brief /tmp/hq-demo --domain motion --files src/app/page.tsx
//
// It writes exactly what `ursa run` and `tuning distill` would have left
// behind: <root>/.ursa/tuning.json and <root>/.ursa/records/<id>.json.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { RECORDS, TUNING } from './fixtures'

export function writeFixtureStore(root: string): string {
  const records = join(root, '.ursa', 'records')
  mkdirSync(records, { recursive: true })
  writeFileSync(join(root, '.ursa', 'tuning.json'), JSON.stringify(TUNING, null, 2) + '\n')
  for (const r of RECORDS) {
    writeFileSync(join(records, `${r.task.id}.json`), JSON.stringify(r, null, 2) + '\n')
  }
  return join(root, '.ursa')
}

const invokedDirectly = process.argv[1]?.endsWith('seed.ts')
if (invokedDirectly) {
  const root = process.argv[2]
  if (!root) {
    console.error('usage: npx tsx src/hq/seed.ts <dir>')
    process.exit(2)
  }
  console.log(`seeded ${writeFixtureStore(root)}`)
}
