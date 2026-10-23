/*
 * The two published sites §3 weighs: the same record published with and
 * without `task.pairedBy`, which is a 0.4 site beside the 0.3 site it
 * would have been. Run from `ursa-major/`:
 *
 *   npx tsx ../docs/design/reviews/2026-10-23/publish-pair.mts
 */
import { publish } from '../../../../ursa-major/src/publish.ts'
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'

const src = JSON.parse(
  readFileSync(new URL('../../../../ursa-major/fixtures/mini/record/outcome_record.json', import.meta.url), 'utf8'),
)
const BOUNDS = { maxPairDistance: 400, maxPairAgeHours: 720, maxInterposedGenerations: 2 }

for (const [proj, out, stamped] of [
  ['/tmp/proj-a', '/tmp/site-a', false],
  ['/tmp/proj-b', '/tmp/site-b', true],
] as const) {
  rmSync(proj, { recursive: true, force: true })
  rmSync(out, { recursive: true, force: true })
  mkdirSync(`${proj}/.ursa/records`, { recursive: true })
  const r = structuredClone(src)
  if (stamped) r.task.pairedBy = BOUNDS
  else delete r.task.pairedBy
  writeFileSync(`${proj}/.ursa/records/mini-fixture.json`, JSON.stringify(r, null, 2))
  const res = publish({
    projectPath: proj,
    outDir: out,
    acknowledged: true,
    repository: 'someone/their-repo',
    publishedAt: '2026-10-18T00:00:00.000Z',
  })
  console.log(out, res.written.length, 'files')
}
