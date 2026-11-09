// Serving a fixture on a host whose ports belong to eleven seats at once.
//
// WHY THIS EXISTS. docs/agents/runner-facts.md's `tmp-is-shared-between-seats`
// says a charter-named scratch PATH is another seat's path too. The port
// space is the same fact and nobody had written it down: `/tmp` is shared
// because the seats share a host, and so is 0.0.0.0.
//
// MEASURED 2026-11-09 (run ad), on this host, while this run was working.
// `selftest/check-narrow.mjs` binds python3's http.server on a fixed port and
// waits 15 seconds for it to answer. Port 4975 was already held by another
// seat's python3 (pid 1416700), so the bind lost, the fixture never answered,
// and the check exited 1 with `Error: fixture never answered`. Exit 1 is the
// status that check uses for `measure-narrow.mjs` gave the wrong answer. So a
// port collision between two seats publishes as a defect in the instrument
// under test, and the next run to read it goes looking for a bug that is not
// there. Verified on a pristine worktree of the pre-run kit: byte-identical
// failure, so it is the host and not this run's edits.
//
// It is also the exact shape of the rule this run is answering, one layer
// out. The check reserved no code for "I could not look", so its premise and
// its finding share exit 1, and the premise is the one that arrived last: the
// comment above its case 1 says the port was picked high "so a stray server
// from another run cannot turn this case into a pass", which guards the case
// that needs an EMPTY port and not the case that needs to BIND one.
//
// So: ask the operating system for a port instead of naming one, and give a
// premise failure its own code.
import { spawn } from 'node:child_process'
import { connect, createServer } from 'node:net'

// A selftest's reserved refusal code: this check could not look, so it makes
// no claim about the instrument it exists to check. Distinct from 1, which
// these files use for "the instrument under test answered wrongly".
export const CANNOT_LOOK = 2

// Refuse in both channels, because a status is a single value every wrapper
// in a pipeline is entitled to replace and a printed line is content wrappers
// forward by default. Same argument as lib/reached.mjs.
export function cannotLook(why) {
  console.log(`NO VERDICT: ${why}, so this check makes no claim about the instrument it exists to check.`)
  process.exit(CANNOT_LOOK)
}

// A port the operating system says is free, taken by binding it and letting
// it go. There is a race between the release and the caller's bind and it is
// the smallest one available without handing the listening socket over: the
// alternative, a fixed number, loses to any seat that happens to be running.
export async function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.on('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
  })
}

// A port with nothing listening on it, which is what a "could not load" case
// needs. Confirmed empty rather than assumed empty: a high number is not an
// unused number on a host with eleven seats on it.
export async function deadPort() {
  for (let i = 0; i < 20; i++) {
    const p = await freePort()
    if (!(await listening(p))) return p
  }
  cannotLook('no port on this host could be confirmed empty in twenty tries')
}

// A raw TCP connect and not a `fetch`, measured on this host 2026-11-09: a
// `fetch` at a port nothing listens on comes back `TimeoutError: The
// operation was aborted due to timeout` with `err.cause` undefined, so the
// refusal is not distinguishable from a slow service by reading the error. A
// socket gives `ECONNREFUSED` directly. The first version of this file read
// the fetch error and called every empty port occupied, which refused twenty
// times in a row and is the over-refusal trap stated three files over.
function listening(port) {
  return new Promise((resolve) => {
    const s = connect({ port, host: '127.0.0.1' })
    const done = (v) => { try { s.destroy() } catch {} resolve(v) }
    // A port that accepts the socket and says nothing is held by something.
    // The question is whether the port is free, not whether what holds it
    // speaks HTTP.
    s.setTimeout(500, () => done(true))
    s.on('connect', () => done(true))
    s.on('error', (err) => done(err.code !== 'ECONNREFUSED'))
  })
}

// Serve `dir` over HTTP on a port this call chose, and wait until it answers
// `probe`. Refuses with CANNOT_LOOK rather than throwing, because the caller
// is a check whose own premise this is.
// `port` honours a caller that was given one on the command line. These
// checks all take an optional positional port and the first version of this
// repair dropped it, which is L45's defect: a flag accepted and then inert.
export async function serveFixture(dir, probe = '/', { tries = 60, everyMs = 250, port: want = null } = {}) {
  const port = want ? Number(want) : await freePort()
  const proc = spawn('python3', ['-m', 'http.server', String(port), '-d', dir], { stdio: 'ignore' })
  const url = `http://127.0.0.1:${port}${probe}`
  for (let i = 0; i < tries; i++) {
    try { if ((await fetch(url)).ok) return { proc, port, base: `http://127.0.0.1:${port}`, url } } catch {}
    await new Promise((r) => setTimeout(r, everyMs))
  }
  proc.kill()
  cannotLook(`the fixture server this check started never answered at ${url} in ${Math.round((tries * everyMs) / 1000)}s, which on this host usually means another seat holds the port`)
}
