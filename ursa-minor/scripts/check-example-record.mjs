#!/usr/bin/env node
/**
 * Two checks on the record this site publishes, both of which exist
 * because this site holds a second copy of something the resolver owns.
 *
 * 1. BYTES. `public/records/mini-fixture.json` must be byte-identical to
 *    `ursa-major/fixtures/mini/record/outcome_record.json`, the record the
 *    resolver generates and commits. The copy is here because a Vercel
 *    project rooted at `ursa-minor/` cannot read a file above its own
 *    root, so the alternative to a checked copy is a build that works on
 *    one machine. A copy nobody checks is how a page starts showing a
 *    record that no resolver in this repository would produce.
 *
 * 2. THE ELICITING RULE. `lib/record/provenance.ts` reimplements the rule
 *    that decides which of the person's messages elicited a given
 *    assistant turn, because this site cannot import from `ursa-major`
 *    across a deploy root boundary. `ursa-major/src/viewer.ts` inlines its
 *    own answer for the same record into the committed fixture viewer as
 *    the `id="elicited"` JSON block, so the two implementations can be
 *    compared on real data. They must agree exactly. If they ever
 *    disagree, this page is attributing words to a person that the
 *    resolver does not attribute to them, which is the worst thing this
 *    surface could get wrong.
 *
 * Run it from `ursa-minor/`:  npm run check:example-record
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const here = process.cwd()
const copy = path.join(here, 'public/records/mini-fixture.json')
const origin = path.join(here, '../ursa-major/fixtures/mini/record/outcome_record.json')
const viewer = path.join(here, '../ursa-major/fixtures/mini/record/outcome_record.html')

const fail = []

const copyBytes = readFileSync(copy)
const originBytes = readFileSync(origin)
const digest = (b) => createHash('sha256').update(b).digest('hex').slice(0, 12)
if (!copyBytes.equals(originBytes)) {
  fail.push(
    `bytes differ: public/records/mini-fixture.json is ${digest(copyBytes)}, ` +
      `the resolver's committed record is ${digest(originBytes)}. ` +
      `Fix with: cp ${path.relative(here, origin)} ${path.relative(here, copy)}`,
  )
} else {
  console.log(`bytes: identical (sha256 ${digest(copyBytes)}, ${copyBytes.length} bytes)`)
}

const record = JSON.parse(copyBytes.toString('utf8'))

const html = readFileSync(viewer, 'utf8')
const block = html.match(/id="elicited"[^>]*>([\s\S]*?)<\/script>/)
if (!block) {
  fail.push('no id="elicited" block in the resolver\'s committed viewer, so the rule cannot be compared')
} else {
  const theirs = JSON.parse(block[1])
  const { elicitingPrompts } = await import(
    pathToFileURL(path.join(here, 'lib/record/provenance.ts')).href
  ).catch(async () => {
    // tsx is not a dependency of this package, so the rule is read as
    // source and evaluated rather than imported. It is eleven lines of
    // plain JavaScript inside TypeScript annotations; stripping the
    // annotations is cheaper and more honest than adding a build step to
    // a check whose whole job is to not trust a second copy.
    const src = readFileSync(path.join(here, 'lib/record/provenance.ts'), 'utf8')
    const js = src
      .replace(/^import[\s\S]*?from '\.\/types'\n/m, '')
      .replace(/: Array<UserPrompt \| null>/g, '')
      .replace(/: UserPrompt \| null/g, '')
      .replace(/: ConversationMeta\[\]/g, '')
      .replace(/: OutcomeRecord/g, '')
      .replace(/: string/g, '')
      .replace(/: number/g, '')
      .replace(/export (function|interface|const)/g, '$1')
    const mod = new Function(
      `${js}\nreturn { elicitingPrompts }`,
    )
    return { elicitingPrompts: mod().elicitingPrompts }
  })
  const mine = elicitingPrompts(record)
  const norm = (a) => JSON.stringify(a.map((p) => (p ? { step: p.step, text: p.text } : null)))
  if (norm(mine) !== norm(theirs)) {
    fail.push(
      `the eliciting rule disagrees with the resolver's own answer.\n` +
        `  this site: ${norm(mine)}\n  ursa-major: ${norm(theirs)}`,
    )
  } else {
    console.log(
      `eliciting rule: agrees with ursa-major on all ${theirs.length} generations of the fixture`,
    )
  }
}

if (fail.length) {
  console.error(`\n${fail.length} problem${fail.length === 1 ? '' : 's'}:`)
  for (const f of fail) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('the published example record and the viewer agree with the resolver.')
