
// Did the page this run photographed actually RUN, or was it only served?
//
// WHY THIS EXISTS. `lib/reached.mjs` beside it asks whether the instrument
// reached its subject: a dead port is loud, a live server whose paths all
// 404 is quiet, and both now refuse. This file is the next layer down, and
// it is quieter still. The server is up. The path answers 200. The HTML is
// the right HTML, with the right text, the right type, the right spacing and
// the right hairlines. Every instrument here measures it happily. And not a
// line of client JavaScript has run, so everything a client component does
// is simply absent from the frame.
//
// MEASURED 2026-11-09 (run ac), ursa-minor at 1440x900, same probe on both
// servers, 3s after networkidle:
//
//                  React fibers    body hydrated   CopyLine's --fade-r
//   next dev           3 / 114         no          (its effect never ran)
//   next start        88 / 103         yes         32px
//
// What that costs, concretely, on the one page this seat reviews most. The
// home page's command boxes carry a fade on the overflowing edge, a tab
// stop, and an aria-label reading "command, scrolls sideways". All three are
// driven by the component measuring its own box. Under `next dev` none of
// them exists: the curl line is cut flush at 536px of hidden text with no
// fade, `tabIndex` is -1, and the label is null. The frame does not look
// broken. It looks like a site that never built the affordance, which is
// exactly what it looked like before that affordance was built.
//
// THE README ALREADY KNEW, WHICH IS THE POINT. Since 2026-10-24 it has said
// `next dev` and `next start` are not interchangeable, with the failed HMR
// handshake and the silent non-hydration named. Two things made that
// insufficient and both are about where the fact lived rather than whether
// it was true. It was scoped to `ursa-major/overlay`, so it read as a fact
// about the other app, and this run measured the same thing in `ursa-minor`.
// And it was prose, so nothing refused: this run shot 15 frames of a dead
// page across three viewports, and every instrument reported success over
// them, including the reach tracker, which was right that all 15 loads were
// reached. A fact that lives only in a README is one every run re-learns at
// its own expense. This one is a gate.
//
// THE REFUSAL IS DELIBERATELY NARROW. A fixture is not a Next app, and the
// kit's own selftests drive hand-written HTML over `file://` where no
// framework ever loads. Refusing there would convert every selftest into a
// non-answer, which is the too-wide-refusal trap `lib/reached.mjs` states as
// an expectation. So the question is only ever asked of a page that SHIPPED
// a client runtime: `window.__next_f` is the flight-data array Next defines
// on any app route, present on both servers above and absent on a plain
// file. No runtime, no claim.
export const NOT_HYDRATED = 2

// Read in the page. Kept as a string because `page.evaluate` takes a
// function that is serialised, and keeping it in one place means the six
// tools cannot each grow their own slightly different idea of the signal.
//
// The signal is a React fiber on the body. Not a fiber count over the whole
// document: 3 of 114 elements carry one even on the dead page, so a count
// with no denominator in front of it reads as "some hydration happened" when
// what happened is that three stray nodes were claimed. The body either was
// hydrated or it was not.
export const PROBE = `(() => {
  const hasFiber = (el) => !!el && Object.keys(el).some((k) => k.startsWith('__react'))
  const all = document.querySelectorAll('*')
  return {
    runtime: typeof window.__next_f !== 'undefined',
    body: hasFiber(document.body),
    root: hasFiber(document.body.firstElementChild),
    fibers: [...all].filter(hasFiber).length,
    els: all.length,
  }
})()`

export function gate({ label = 'page' } = {}) {
  const seen = []
  return {
    // `read` is whatever PROBE returned. Call after the navigation and after
    // whatever settling the tool already does, because hydration is a race
    // this file reports on and does not win: a tool that waits longer should
    // wait before asking, not inside here.
    saw(path, read) {
      seen.push({ path: String(path), ...(read || {}) })
      return read
    },
    // The SAME load, read again after the caller did more waiting. Replaces
    // the row rather than adding one, because two readings of one navigation
    // are one load and a denominator that counts them twice is the fault this
    // gate exists to catch, one level in. Found 2026-11-09 (run ad) by
    // reading the line this file prints: `measure-contrast.mjs`, wired to ask
    // once in `visit` and again after `--until`, reported "every one of the
    // 30 page loads" over fifteen navigations.
    resaw(path, read) {
      const key = String(path)
      for (let i = seen.length - 1; i >= 0; i--) {
        if (seen[i].path === key) { seen[i] = { path: key, ...(read || {}) }; return read }
      }
      return this.saw(path, read)
    },
    // A page that shipped a runtime and did not run it. A page with no
    // runtime is not in this set, and neither is one that was never reached
    // at all, which is `lib/reached.mjs`'s question and not this one.
    dead() {
      return seen.filter((s) => s.runtime && !s.body)
    },
    noRuntime() {
      return seen.filter((s) => !s.runtime)
    },
    lines() {
      const out = []
      const bad = this.dead()
      if (bad.length) {
        out.push('')
        out.push(`NOT HYDRATED: ${bad.length} of ${seen.length} ${label} loads shipped a client runtime that never ran, so every client component on them is absent from this run's frames and no claim here covers one.`)
        for (const s of bad) out.push(`  ${s.path} -> ${s.fibers} of ${s.els} elements carry a React fiber, and the body carries none`)
        out.push('Frames of a page in this state look like frames of a site that never built the behaviour. Shoot `next build && next start`, not `next dev`; see lib/hydrated.mjs.')
      } else if (seen.length) {
        const live = seen.length - this.noRuntime().length
        out.push('')
        out.push(live
          ? `every one of the ${live} ${label} loads that shipped a client runtime had hydrated when this run measured it.`
          : `none of the ${seen.length} ${label} loads shipped a client runtime, so hydration was not a question here.`)
      }
      return out
    },
    refused() {
      return `NO VERDICT: every one of the ${seen.length} ${label} loads was served without ever running, so this run photographed a page that does nothing and its headline is withheld rather than taken over it.`
    },
    nothingRan() {
      return seen.length > 0 && this.dead().length === seen.length
    },
    code() {
      return this.dead().length ? NOT_HYDRATED : 0
    },
    rows() { return seen.slice() },
  }
}

// Convenience for the common call site: navigate however you already do,
// then one line to ask.
export async function probe(page) {
  return page.evaluate(PROBE)
}

// Hydration is a RACE and not only a server setting, which this run learned
// from its own gate: with the gate reporting and not waiting, 1 of 15 frames
// off the PRODUCTION build caught the home page at desktop with 2 of 102
// elements fibered. A tool that merely reports that has correctly refused to
// claim anything about a frame it did not have to take badly.
//
// So wait first, then ask, and let the refusal mean what it should: not
// `hydration had not finished when I looked`, but `it never arrived`. The
// wait is bounded because an unbounded one turns a dead dev server into a
// hang, and a hang is the one failure that reports nothing at all.
//
// Returns the final reading either way, so the caller still records what it
// saw and the gate still decides. This never throws: a page with no client
// runtime returns immediately and is not waited on, which is the same
// narrowness the gate applies.
export async function waitForHydration(page, { timeoutMs = 10000, intervalMs = 100 } = {}) {
  const deadline = Date.now() + timeoutMs
  let read = await probe(page)
  while (read.runtime && !read.body && Date.now() < deadline) {
    await page.waitForTimeout(intervalMs)
    read = await probe(page)
  }
  return read
}
