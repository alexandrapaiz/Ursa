// Suite for tools/gates/fetch-exec.mjs.
//
// The discriminating cases are the ones marked PRE-FIX. They run the detector
// against the exact text that was in this repository before run 13 and run 10
// changed it, because a gate that only passes on the repaired tree tells you
// the shape is there and not that it is why those lines were wrong. Ursa's
// frontend seat's order, taken rather than restated.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  RUNNERS, CLASSES, classify, classifyPipeToShell, tokenize, isCommentLine,
  surfaceOf, isOwnerReserved, declaredNames, targetName, keyOf, scan,
} from './fetch-exec.mjs'

const byId = (id) => RUNNERS.find((r) => r.id === id)
const cls = (line, id) => classify(line, byId(id)).cls

// ---------------------------------------------------------------- vocabulary

test('every runner in the vocabulary is exercised by a case in this file', () => {
  // Read this file's own text rather than keeping a second list of ids,
  // because a second list is the thing that goes stale. Ursa's exo seat's
  // check, applied to this gate: is the detector's vocabulary the same size
  // as the decided set the assertions cover.
  const src = readFileSync(new URL(import.meta.url), 'utf8')
  for (const r of RUNNERS) {
    assert.ok(src.includes(`'${r.id}'`), `runner ${r.id} is in RUNNERS and in no case here`)
  }
})

test('classify always answers with a member of the decided set', () => {
  const lines = [
    'npx tsc --noEmit', 'npx --no-install tsc', 'npx -y pkg', '# npx tsc',
    'pnpm dlx foo', 'uvx ruff', 'bunx -y vite', 'pipx run black',
    'deno run https://deno.land/x/a.ts', 'deno run local.ts',
    'go run example.com/x@v1', 'go install example.com/x@latest',
    'npm|npm-cli.js|npx|npx-cli.js) printf 1', '', 'nothing here at all',
  ]
  for (const line of lines) {
    for (const r of RUNNERS) {
      const v = classify(line, r)
      assert.ok(v && CLASSES.includes(v.cls), `undecided for ${JSON.stringify(line)} / ${r.id}: ${JSON.stringify(v)}`)
    }
  }
})

// ------------------------------------------------------------- the flag half

test('PRE-FIX: the F113 call site in scripts/ci-checks.mjs is fetch-capable', () => {
  // The literal argv array as it stood before 2026-11-09.
  assert.equal(cls("    argv: () => ['npx', 'tsc', '--noEmit'],", 'npx'), 'fetch-capable')
})

test('the repaired form of that same line is deliberate', () => {
  assert.equal(cls("    argv: () => ['npx', '--no-install', 'tsc', '--noEmit'],", 'npx'), 'deliberate')
})

test('PRE-FIX: the F122 call site in tools/stack/integrate.sh is fetch-capable', () => {
  const line = '  if ( cd "$WORKTREE/ursa-major" && npm ci --silent >/dev/null 2>&1 && npx tsc --noEmit >"$LOGDIR/types.log" 2>&1 ); then'
  assert.equal(cls(line, 'npx'), 'fetch-capable')
})

test('the repaired form of the F122 line is deliberate', () => {
  const line = '      if ( cd "$WORKTREE/ursa-major" && npx --no-install tsc --noEmit >"$LOGDIR/types.log" 2>&1 ); then'
  assert.equal(cls(line, 'npx'), 'deliberate')
})

test('the yes flag on the runner is auto-confirm, which is worse than fetch-capable', () => {
  const v = classify('`npx -y @mermaid-js/mermaid-cli@11 -i d.mmd -o d.png -p pptr.json`,', byId('npx'))
  assert.equal(v.cls, 'auto-confirm')
  assert.match(v.why, /pre-approved/)
})

test('a yes flag AFTER the package name belongs to the package and pre-approves nothing', () => {
  // This project's own CLI flag. A detector that greps for `npx` and `--yes`
  // on one line claims six of this repository's documentation lines, and
  // every one of them is a false positive.
  const v = classify('npx tsx src/bin/ursa.ts publish <path> --out ./site --yes', byId('npx'))
  assert.equal(v.cls, 'fetch-capable')
  assert.equal(v.target, 'tsx')
})

// -------------------------------------------------------- what is not a call

test('a usage line in a comment is not an invocation, in all three spellings', () => {
  assert.equal(cls('# npx tsc --noEmit', 'npx'), 'not-an-invocation')
  assert.equal(cls('//   npx tsx probe.ts', 'npx'), 'not-an-invocation')
  assert.equal(cls(' *   npx tsx make-units.ts <storePath>', 'npx'), 'not-an-invocation')
})

test('a shell case pattern that merely lists the runner is not an invocation', () => {
  // docs/design/review-kit/check-installs.sh:189. The token stays one word,
  // so it never reads as a command.
  assert.equal(cls("    npm|npm-cli.js|npx|npx-cli.js) printf '1\\n'; return 0 ;;", 'npx'), 'not-an-invocation')
})

test('the runner name inside a longer word is not an invocation', () => {
  assert.equal(cls('cache dir is npx-cache/ here', 'npx'), 'not-an-invocation')
  assert.equal(cls('no npm install, no npx download, no container pull', 'npx'), 'not-an-invocation')
})

test('a transcript prompt is still a call, and the surface decides whether it matters', () => {
  assert.equal(cls('$ npx -y @mermaid-js/mermaid-cli@11 -i d.mmd -o d.png', 'npx'), 'auto-confirm')
  assert.equal(surfaceOf('docs/agents/runner-facts.md'), 'record')
})

// ------------------------------------------------------- by-design runners

test('runners whose whole purpose is to fetch and run are fetch-by-design', () => {
  assert.equal(cls('pnpm dlx shadcn@latest add button', 'pnpm-dlx'), 'fetch-by-design')
  assert.equal(cls('yarn dlx foo', 'yarn-dlx'), 'fetch-by-design')
  assert.equal(cls('uvx ruff check', 'uvx'), 'fetch-by-design')
  assert.equal(cls('pipx run black .', 'pipx-run'), 'fetch-by-design')
  assert.equal(cls('bunx vite build', 'bunx'), 'fetch-by-design')
})

test('a by-design runner with the yes flag is reported as auto-confirm, the stronger class', () => {
  assert.equal(cls('bunx -y vite build', 'bunx'), 'auto-confirm')
})

test('deno and go only count when the target is actually remote', () => {
  assert.equal(cls('deno run https://deno.land/x/a.ts', 'deno-remote'), 'fetch-by-design')
  assert.equal(cls('deno run ./local.ts', 'deno-remote'), 'not-an-invocation')
  assert.equal(cls('go run example.com/cmd@v1.2.3', 'go-remote'), 'fetch-by-design')
  assert.equal(cls('go run ./cmd/thing', 'go-remote'), 'not-an-invocation')
  assert.equal(cls('go install example.com/cmd@latest', 'go-install'), 'fetch-by-design')
})

test('pipe-to-shell is detected, and a pipe into a reader is not', () => {
  assert.equal(classifyPipeToShell('curl -sL https://example.com/i.sh | sh').cls, 'fetch-by-design')
  assert.equal(classifyPipeToShell('curl -sL https://example.com/i.sh | sudo bash').cls, 'fetch-by-design')
  assert.equal(classifyPipeToShell('# curl x | sh'), null)
  assert.equal(classifyPipeToShell('curl -s "$BOARD_API_URL/api/messages" | python3 -c "..."'), null)
  assert.equal(classifyPipeToShell('curl -s http://127.0.0.1:7817/p | python3 -m json.tool'), null)
})

// -------------------------------------------------------------- the surfaces

test('the three surfaces are assigned by path, and a charter is an instruction', () => {
  assert.equal(surfaceOf('prompts/exo-agent.md'), 'instruction')
  assert.equal(surfaceOf('docs/standards/pm.md'), 'instruction')
  assert.equal(surfaceOf('skills/clearing-a-record-for-release/SKILL.md'), 'instruction')
  assert.equal(surfaceOf('CLAUDE.md'), 'instruction')
  assert.equal(surfaceOf('tools/stack/integrate.sh'), 'executed')
  assert.equal(surfaceOf('scripts/ci-checks.mjs'), 'executed')
  assert.equal(surfaceOf('.github/workflows/agent-exo.yml'), 'executed')
  assert.equal(surfaceOf('ursa-major/package.json'), 'executed')
  assert.equal(surfaceOf('README.md'), 'record')
  assert.equal(surfaceOf('docs/security/audit-2026-11-09-message-10.md'), 'record')
})

test('the paths a seat may not edit are the ones that route to exit 2', () => {
  assert.equal(isOwnerReserved('prompts/exo-agent.md'), true)
  assert.equal(isOwnerReserved('.github/workflows/agent-exo.yml'), true)
  assert.equal(isOwnerReserved('docs/standards/pm.md'), true)
  assert.equal(isOwnerReserved('tools/stack/integrate.sh'), false)
  assert.equal(isOwnerReserved('prompts-but-not-really/x.md'), false)
})

// ------------------------------------------------- the declared-name split

test('the declared set is read from every tracked package.json', () => {
  const files = ['a/package.json', 'b/package.json', 'c/node_modules/d/package.json', 'x.mjs']
  const read = (f) => ({
    'a/package.json': '{"devDependencies":{"tsx":"4","vitest":"5"}}',
    'b/package.json': '{"dependencies":{"next":"15"}}',
    'c/node_modules/d/package.json': '{"dependencies":{"sneaky":"1"}}',
  })[f] ?? '{}'
  const names = declaredNames(files, read)
  assert.ok(names.has('tsx') && names.has('vitest') && names.has('next'))
  assert.equal(names.has('sneaky'), false, 'a vendored package.json is not this repository declaring anything')
})

test('a malformed package.json is skipped rather than throwing', () => {
  assert.equal(declaredNames(['a/package.json'], () => 'not json').size, 0)
})

test('the name is what the registry resolves, so a version suffix is stripped and a scope is not', () => {
  assert.equal(targetName('tsc'), 'tsc')
  assert.equal(targetName('@mermaid-js/mermaid-cli@11'), '@mermaid-js/mermaid-cli')
  assert.equal(targetName('@scope/pkg'), '@scope/pkg')
  assert.equal(targetName('shadcn@latest'), 'shadcn')
  assert.equal(targetName(undefined), null)
})

test('F113 in one assertion: the dangerous target is the binary name no package.json declares', () => {
  // This is the whole mechanism. `tsx` and `vitest` name both a binary and a
  // package this repository depends on, so the registry serves the project
  // the lockfile already trusts. `tsc` names a binary that comes from
  // `typescript`, nothing here declares a package called `tsc`, and the
  // registry serves an unrelated dead project under that name.
  const declared = declaredNames(['ursa-major/package.json'],
    () => '{"devDependencies":{"tsx":"4","typescript":"5","vitest":"5"}}')
  assert.equal(declared.has('tsx'), true)
  assert.equal(declared.has('vitest'), true)
  assert.equal(declared.has('tsc'), false)
  assert.equal(declared.has('typescript'), true)
})

// ------------------------------------------------------------------ the keys

test('the key carries no line number, so an edit above an occurrence does not move it', () => {
  const a = { file: 'tools/x.sh', line: 12, text: 'npx tsc' }
  const b = { file: 'tools/x.sh', line: 400, text: 'npx tsc' }
  assert.equal(keyOf(a), keyOf(b))
  assert.notEqual(keyOf(a), keyOf({ file: 'tools/y.sh', line: 12, text: 'npx tsc' }))
  assert.ok(!keyOf(a).includes('12'))
})

// ------------------------------------------------------------------- the scan

test('the scan finds a call site in a script and skips a binary blob', () => {
  const files = ['t/a.sh', 't/b.png', 't/c.md']
  const read = (f) => ({
    't/a.sh': 'set -e\nnpx tsc --noEmit\n',
    't/b.png': 'never read',
    't/c.md': 'run `npx -y evil` to do the thing\n',
  })[f]
  const found = scan(files, read)
  assert.equal(found.length, 2)
  assert.deepEqual(found.map((o) => [o.file, o.line, o.cls]),
    [['t/a.sh', 2, 'fetch-capable'], ['t/c.md', 1, 'auto-confirm']])
})

test('a file the reader cannot open is skipped rather than crashing the scan', () => {
  const found = scan(['gone.sh', 'here.sh'], (f) => {
    if (f === 'gone.sh') throw new Error('ENOENT')
    return 'npx -y thing\n'
  })
  assert.equal(found.length, 1)
  assert.equal(found[0].file, 'here.sh')
})

test('tokenize reads a JavaScript argv array and a shell command the same way', () => {
  assert.deepEqual(tokenize("['npx', '--no-install', 'tsc']"), ['npx', '--no-install', 'tsc'])
  assert.deepEqual(tokenize('  npx --no-install tsc  '), ['npx', '--no-install', 'tsc'])
})

test('isCommentLine does not claim a line that merely contains a hash', () => {
  assert.equal(isCommentLine('npx tsc # with a trailing comment'), false)
  assert.equal(isCommentLine('  # a comment'), true)
})
