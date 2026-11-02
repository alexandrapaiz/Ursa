// Pin the wall clock of a *server* this seat is photographing through.
//
//   URSA_PIN_NOW=2026-11-02T00:00:00.000Z \
//     node --import ./docs/design/review-kit/lib/pin-clock.mjs \
//     ../../ursa-major/node_modules/.bin/tsx src/bin/ursa.ts serve <project>
//
// WHY A SECOND HALF OF THE FREEZE EXISTS AT ALL. L45 proposed `--pin-now` on
// `shoot.mjs`, passed through to `freezeInit`, to stop the overlay dashboard's
// `read at HH:MM:SS` from putting a diff into every before-and-after on that
// page. Built and measured, that proposal does not close it, because the
// string is not computed where the init script runs. `serve.ts` builds the
// payload with `readAt: new Date().toISOString()` in the Node process holding
// the store, and the browser only renders a value it was handed. Neither
// product reads the wall clock client-side at all: one `new Date(…)` in
// `overlay/app/page.tsx` parses a payload field, and `ursa-minor` has none.
// So the page-side pin is correct and future-proof and it moves no pixel on
// any of the fifteen frames. The clock that moves them is this one.
//
// WHY A PRELOAD AND NOT A FLAG ON `serve`. `ursa serve` is the engineer's
// surface, not this seat's, and a review instrument should not need a product
// change to take a measurement. `--import` runs this module before the
// command's own entry point, so `Date` is already pinned by the time any
// route builds a payload. The product ships unchanged and nothing about this
// reaches a user.
//
// WHY IT REFUSES RATHER THAN DEFAULTING. A preload that quietly does nothing
// is the whole defect this file exists to repair: the run believes it pinned
// a clock, the frames still differ, and the difference gets read as the thing
// being reviewed. There is also no instant it could pick for you. `PINNED_MS`
// is 1970, and the dashboard computes ages from record timestamps against
// now, so a 1970 clock draws a page the product never draws. So the instant
// is required, it is named in the error when it cannot be used, and an
// unusable value exits 2, which is this repository's code for a tool that
// cannot do its job rather than one that found a defect.
//
// WHAT IT DOES NOT PIN. Only `Date`. `performance.now()` and the timer
// queue keep running, so the server still answers requests, times out
// sockets and shuts down normally. `ursa run` must have finished before this
// is used, or the records themselves get stamped with the pinned instant;
// the recipe snapshots the store first for the same reason.

import { freezeInit } from './freeze.mjs'

const raw = process.env.URSA_PIN_NOW

if (!raw || raw.trim() === '') {
  console.error(
    'pin-clock.mjs: URSA_PIN_NOW is not set, so there is no instant to pin the clock to.\n' +
      '  set it to an ISO instant, for example URSA_PIN_NOW=2026-11-02T00:00:00.000Z',
  )
  process.exit(2)
}

const ms = Date.parse(raw)

if (Number.isNaN(ms)) {
  // The value is named, not just its absence, because a run told to set a
  // variable it has already set goes looking in the wrong place. This is
  // `live-target.mjs`'s BOARD_URL_SCHEMELESS case in a second tool.
  console.error(
    `pin-clock.mjs: URSA_PIN_NOW is set to "${raw}", which Date.parse cannot read, so the clock was left running.\n` +
      '  it is set; it is not usable. Use an ISO instant, for example 2026-11-02T00:00:00.000Z',
  )
  process.exit(2)
}

freezeInit({ now: ms, clock: false, random: false })

// Printed on stderr, once, to the run's own log rather than to the page: a
// pin nobody can see having happened is a pin the next reader has to take on
// faith. L37's family, where a port answering 200 was not evidence that the
// new build was behind it.
console.error(`pin-clock.mjs: Date pinned to ${new Date(ms).toISOString()} in pid ${process.pid}`)
