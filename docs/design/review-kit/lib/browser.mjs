// Launching chromium on a host nobody gave you root on.
//
// Three runs of the frontend seat in a row lost most of a session to this,
// on two different hosts, for the same reason: playwright downloads the
// browser fine and then it will not start, because the system is missing
// shared libraries that `playwright install-deps` would install and that
// needs a privilege the seat does not have.
//
// It does not need one. `apt-get download` writes a .deb into the current
// directory and `dpkg-deb -x` unpacks it into a directory the seat owns.
// So: try to launch, and if the launch fails on a missing library, fetch
// the libraries into a prefix on LD_LIBRARY_PATH and tell the caller to
// re-exec. See docs/design/reviews/2026-10-23/README.md §0 for the run
// that worked this out by hand.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// This kit lives under docs/, which is not a package, so `import
// 'playwright'` from here resolves nothing. playwright is also
// deliberately not a dependency of either site (it is a review tool, not
// a shipped one), so it is installed with `npm i -D --no-save` into
// whichever package the run happened to be in. Find it rather than
// require the caller to have guessed right.
function repoRoot() {
  let d = dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 8; i++) {
    if (existsSync(resolve(d, '.git'))) return d
    d = dirname(d)
  }
  return process.cwd()
}

async function loadChromium() {
  const root = repoRoot()
  const roots = [
    process.env.PW_ROOT,
    resolve(root, 'ursa-minor/node_modules'),
    resolve(root, 'ursa-major/node_modules'),
    resolve(root, 'node_modules'),
    resolve(process.cwd(), 'node_modules'),
  ].filter(Boolean)
  for (const r of roots) {
    const entry = resolve(r, 'playwright/index.js')
    if (!existsSync(entry)) continue
    const mod = await import(pathToFileURL(entry).href)
    return (mod.chromium ?? mod.default?.chromium)
  }
  const mod = await import('playwright')
  return mod.chromium ?? mod.default?.chromium
}

// What was actually missing on the two hosts that failed, in the order
// `ldd` surfaced them. `ldd` only reports what it can reach, so a second
// pass finds more; this is both passes' worth.
export const CHROMIUM_LIBS = [
  'libatk1.0-0t64', 'libatk-bridge2.0-0t64', 'libatspi2.0-0t64',
  'libxcomposite1', 'libxdamage1', 'libxfixes3', 'libxrandr2',
  'libxi6', 'libxrender1', 'libasound2t64', 'libgbm1', 'libcups2t64',
  'libpango-1.0-0', 'libcairo2', 'libnss3',
]

const PREFIX = process.env.PW_LIB_PREFIX || '/tmp/pwlibs'

function archDir() {
  const root = `${PREFIX}/root/usr/lib`
  if (!existsSync(root)) return null
  const hit = readdirSync(root).find((d) => d.endsWith('-linux-gnu'))
  return hit ? `${root}/${hit}` : null
}

/** Download and unpack the libraries chromium needs, with no privileges. */
export function bootstrapLibs(packages = CHROMIUM_LIBS) {
  mkdirSync(`${PREFIX}/debs`, { recursive: true })
  mkdirSync(`${PREFIX}/root`, { recursive: true })
  for (const pkg of packages) {
    try {
      execFileSync('apt-get', ['download', pkg], { cwd: `${PREFIX}/debs`, stdio: 'ignore' })
    } catch {
      // A package name differs between distro versions (the t64 suffix is
      // the usual culprit). Missing one is not fatal; a failed launch is.
    }
  }
  for (const deb of readdirSync(`${PREFIX}/debs`).filter((f) => f.endsWith('.deb'))) {
    execFileSync('dpkg-deb', ['-x', `${PREFIX}/debs/${deb}`, `${PREFIX}/root`], { stdio: 'ignore' })
  }
  return archDir()
}

/**
 * Launch chromium, bootstrapping its libraries if the first attempt fails
 * on one. Returns the browser. Throws with the original error if the
 * bootstrap does not fix it, because then the problem is something else
 * and a second message about libraries would be a lie.
 */
export async function launch(opts = {}) {
  const chromium = await loadChromium()
  if (!chromium) throw new Error("playwright not found; run `npm i -D --no-save playwright && npx playwright install chromium` in ursa-minor/, or set PW_ROOT")
  try {
    return await chromium.launch(opts)
  } catch (err) {
    if (!/error while loading shared libraries|cannot open shared object/.test(String(err))) throw err
    const dir = archDir() || bootstrapLibs()
    if (!dir) throw err
    process.env.LD_LIBRARY_PATH = [dir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':')
    return await chromium.launch(opts)
  }
}

export const VIEWPORTS = [
  ['phone', 390, 844],
  ['tablet', 820, 1180],
  ['desktop', 1440, 900],
]
