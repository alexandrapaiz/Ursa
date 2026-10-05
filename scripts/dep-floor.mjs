#!/usr/bin/env node
// The dependency floor gate.
//
// Why this exists: on 2026-09-27 the security seat found `next` 16.2.12 in
// ursa-minor carrying a critical unauthenticated RCE in the image
// optimization API, wrote it down, and handed it to another seat. Nothing
// enforced it, so main carried the critical for two more days while eleven
// pull requests were opened against it. A finding in a document is not a
// gate. This is the gate.
//
// What it enforces, per package with a lockfile:
//   - zero critical advisories anywhere, production or development
//   - zero high advisories in the production dependency tree
// Development-only high and moderate advisories are reported and do not
// fail, because a test runner's dev server is not a deployed surface and
// blocking on it would train people to pass --allow-dirty.
//
// Exceptions live in dep-floor.allow.json and every one carries an expiry.
// An expired exception does not quietly keep working; it fails the gate
// with its own message. That is the whole point of the file: a risk the
// owner accepted on a Tuesday should come back and ask again.
//
// Usage:
//   node scripts/dep-floor.mjs            # gate; exit 1 on a violation
//   node scripts/dep-floor.mjs --json     # machine-readable, same exit code
//
// No dependencies. Reads `npm audit --json`, which needs a lockfile and
// network access to the registry.

import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const ALLOWLIST = join(REPO_ROOT, 'dep-floor.allow.json')
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.ursa', 'dist', 'digests'])

/** A package we gate: any directory with both a package.json and a lockfile. */
function findPackages(dir, found = []) {
  if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'package-lock.json'))) {
    found.push(dir)
  }
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.')) continue
    const child = join(dir, name)
    if (statSync(child).isDirectory()) findPackages(child, found)
  }
  return found
}

/** `npm audit` exits 1 when it finds anything, so its exit code is not an error. */
function audit(cwd, omitDev) {
  const args = ['audit', '--json']
  if (omitDev) args.push('--omit=dev')
  let stdout
  try {
    stdout = execFileSync('npm', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (err) {
    if (err.stdout) stdout = err.stdout
    else throw new Error(`npm ${args.join(' ')} in ${cwd} produced no output: ${err.message}`)
  }
  const report = JSON.parse(stdout)
  if (report.error) throw new Error(`npm audit in ${cwd}: ${report.error.summary}`)
  return report
}

/** GHSA ids for one vulnerability entry. `via` mixes advisory objects and package names. */
function advisoryIds(vuln) {
  const ids = new Set()
  for (const via of vuln.via ?? []) {
    if (typeof via === 'object' && via.url) {
      const m = /(GHSA-[0-9a-z-]+)/.exec(via.url)
      if (m) ids.add(m[1])
    }
  }
  return [...ids]
}

function loadAllowlist() {
  if (!existsSync(ALLOWLIST)) return []
  const raw = JSON.parse(readFileSync(ALLOWLIST, 'utf8'))
  const entries = raw.exceptions ?? []
  for (const e of entries) {
    for (const field of ['package', 'advisory', 'scope', 'reason', 'expires', 'approvedBy']) {
      if (!e[field]) throw new Error(`dep-floor.allow.json: an exception is missing "${field}": ${JSON.stringify(e)}`)
    }
    if (!['prod', 'dev', 'any'].includes(e.scope)) {
      throw new Error(`dep-floor.allow.json: scope must be prod, dev or any, got "${e.scope}"`)
    }
    if (Number.isNaN(Date.parse(e.expires))) {
      throw new Error(`dep-floor.allow.json: "expires" must be an ISO date, got "${e.expires}"`)
    }
  }
  return entries
}

const NOW = new Date()

/** Returns the matching exception, or null. An expired one still matches; the caller reports it. */
function findException(allowlist, pkgName, advisories, scope) {
  return allowlist.find(e =>
    e.package === pkgName &&
    (e.scope === 'any' || e.scope === scope) &&
    (e.advisory === '*' || advisories.includes(e.advisory))
  ) ?? null
}

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const violations = []
const warnings = []
const expired = []
const packages = []

// Anything that goes wrong in here is an operator problem — a malformed
// exceptions file, a registry that will not answer — not a dependency
// violation. It still fails the gate, but it says what happened in one line
// instead of a stack trace, because the reader is whoever opened the PR.
try {
  // Read and validate once, before any audit runs: a malformed exceptions
  // file must fail the gate even when every package happens to be clean.
  const allowlist = loadAllowlist()

  for (const dir of findPackages(REPO_ROOT).sort()) {
    const rel = relative(REPO_ROOT, dir) || '.'
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    const full = audit(dir, false)
    const prod = audit(dir, true)
    const prodNames = new Set(Object.keys(prod.vulnerabilities ?? {}))

    packages.push({
      path: rel,
      name: manifest.name ?? rel,
      totals: { all: full.metadata.vulnerabilities, prod: prod.metadata.vulnerabilities },
    })

    for (const [pkgName, vuln] of Object.entries(full.vulnerabilities ?? {})) {
      const inProd = prodNames.has(pkgName)
      const scope = inProd ? 'prod' : 'dev'
      const sev = vuln.severity
      const ids = advisoryIds(vuln)
      const failing = sev === 'critical' || (sev === 'high' && inProd)
      if (!failing) {
        if (sev === 'high' || sev === 'moderate') {
          warnings.push({ package: rel, dependency: pkgName, severity: sev, scope, advisories: ids })
        }
        continue
      }
      const exception = findException(allowlist, pkgName, ids, scope)
      if (exception && Date.parse(exception.expires) >= NOW.getTime()) {
        warnings.push({ package: rel, dependency: pkgName, severity: sev, scope, advisories: ids, allowedUntil: exception.expires, reason: exception.reason })
        continue
      }
      if (exception) {
        expired.push({ package: rel, dependency: pkgName, severity: sev, scope, advisories: ids, expiredOn: exception.expires, approvedBy: exception.approvedBy })
        continue
      }
      violations.push({
        package: rel,
        dependency: pkgName,
        severity: sev,
        scope,
        advisories: ids,
        direct: Boolean(vuln.isDirect),
        fix: vuln.fixAvailable === true ? 'npm audit fix' :
             (vuln.fixAvailable && vuln.fixAvailable.name
               ? `${vuln.fixAvailable.name}@${vuln.fixAvailable.version}${vuln.fixAvailable.isSemVerMajor ? ' (semver-major)' : ''}`
               : 'none published'),
      })
    }
  }
} catch (err) {
  const line = `dep-floor could not run: ${err.message}`
  console.error(process.env.GITHUB_ACTIONS === 'true' ? `::error::${line}` : line)
  process.exit(1)
}

const failed = violations.length > 0 || expired.length > 0

if (asJson) {
  console.log(JSON.stringify({ ok: !failed, packages, violations, expired, warnings }, null, 2))
} else {
  for (const p of packages) {
    const a = p.totals.all, d = p.totals.prod
    console.log(`${p.path} (${p.name}): all critical=${a.critical} high=${a.high} moderate=${a.moderate} | production critical=${d.critical} high=${d.high} moderate=${d.moderate}`)
  }
  const annotate = process.env.GITHUB_ACTIONS === 'true'
  for (const v of violations) {
    const line = `${v.package}: ${v.dependency} is ${v.severity} in the ${v.scope} tree (${v.advisories.join(', ') || 'no GHSA id'}). Fix: ${v.fix}.`
    console.log(annotate ? `::error::${line}` : `FAIL  ${line}`)
  }
  for (const e of expired) {
    const line = `${e.package}: the exception for ${e.dependency} expired on ${e.expiredOn} (approved by ${e.approvedBy}). Fix it or have the owner renew it in dep-floor.allow.json.`
    console.log(annotate ? `::error::${line}` : `FAIL  ${line}`)
  }
  for (const w of warnings) {
    const why = w.allowedUntil ? `allowed until ${w.allowedUntil}: ${w.reason}` : `${w.scope}-only, below the floor`
    const line = `${w.package}: ${w.dependency} is ${w.severity} (${why}).`
    console.log(annotate ? `::warning::${line}` : `warn  ${line}`)
  }
  console.log(failed
    ? '\nDependency floor breached. See scripts/dep-floor.mjs for what the floor is and docs/design/dependency-floor.md for why.'
    : '\nDependency floor holds: no critical anywhere, no high in any production tree.')
}

process.exit(failed ? 1 : 0)
