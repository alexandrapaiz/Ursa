// Turn a frame series from sample-motion.mjs into numbers you can argue
// about: how long the motion took, whether it overshot, and which curve
// or spring it is. Needs no browser, so it can be re-run on committed
// JSON long after the session that captured it is gone.
//
//   node fit-motion.mjs frames.json            # every element that moved
//   node fit-motion.mjs frames.json --index 7  # one element, full detail
//
// The distinction it exists to draw: a CSS transition and a JavaScript
// spring both move an element, and they are told apart by overshoot. A
// transition on any of the standard easings is monotonic, so it arrives
// at its final value and stops. A spring passes the final value, comes
// back, and may do it more than once. Overshoot is therefore not a
// detail of the feel; it is the evidence of the mechanism.

import { readFileSync } from 'node:fs'

const FILE = process.argv[2]
const ONLY = process.argv.includes('--index') ? Number(process.argv[process.argv.indexOf('--index') + 1]) : null
const data = JSON.parse(readFileSync(FILE, 'utf8'))

// ---- curve library -------------------------------------------------------
// Named easings we might find, plus the one this repository already uses.
const CURVES = {
  'linear': [0, 0, 1, 1],
  'ease': [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  'out-quad (house curve)': [0.25, 0.46, 0.45, 0.94],
  'out-cubic': [0.215, 0.61, 0.355, 1],
  'out-quart': [0.165, 0.84, 0.44, 1],
  'out-expo': [0.19, 1, 0.22, 1],
  'in-out-cubic': [0.645, 0.045, 0.355, 1],
}

const bez = (a, b, c, d) => (x) => {
  // cubic-bezier maps time x to progress y through a parameter s.
  const bx = (s) => 3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s ** 2 * c + s ** 3
  const by = (s) => 3 * (1 - s) ** 2 * s * b + 3 * (1 - s) * s ** 2 * d + s ** 3
  let lo = 0, hi = 1
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2
    if (bx(mid) < x) lo = mid; else hi = mid
  }
  return by((lo + hi) / 2)
}

// ---- value extraction ----------------------------------------------------
const num = (s) => { const v = parseFloat(s); return Number.isFinite(v) ? v : null }

function fromMatrix(str) {
  if (!str || str === 'none') return null
  const m = str.match(/matrix(3d)?\(([^)]+)\)/)
  if (!m) return null
  const n = m[2].split(',').map(Number)
  if (m[1]) return { scaleX: n[0], scaleY: n[5], tx: n[12], ty: n[13] }
  return { scaleX: Math.hypot(n[0], n[1]), scaleY: Math.hypot(n[2], n[3]), tx: n[4], ty: n[5] }
}

// A colour transition is three or four scalars moving together, and it is
// the most common animated property on every site this seat has measured,
// so it has to be in here or the instrument reports "nothing moved" about
// pages that are full of motion.
function channels(str) {
  if (!str) return null
  const m = str.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const n = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
  if (n.length < 3) return null
  return { r: n[0], g: n[1], b: n[2], a: n.length > 3 ? n[3] : 1 }
}

/** Every scalar worth tracking, pulled out of a frame. */
function scalars(f) {
  const out = {}
  const m = fromMatrix(f.transform)
  if (m) { out['matrix.scaleX'] = m.scaleX; out['matrix.scaleY'] = m.scaleY; out['matrix.tx'] = m.tx; out['matrix.ty'] = m.ty }
  if (f.scale && f.scale !== 'none') out['scale'] = num(f.scale.split(' ')[0])
  if (f.translate && f.translate !== 'none') out['translate.x'] = num(f.translate.split(' ')[0])
  if (f.rotate && f.rotate !== 'none') out['rotate'] = num(f.rotate)
  if (f.opacity != null) out['opacity'] = num(f.opacity)
  for (const prop of ['color', 'backgroundColor', 'textDecorationColor', 'borderTopColor']) {
    const c = channels(f[prop])
    if (!c) continue
    const short = prop === 'backgroundColor' ? 'bg' : prop === 'textDecorationColor' ? 'ul' : prop === 'borderTopColor' ? 'bd' : 'fg'
    out[`${short}.r`] = c.r; out[`${short}.g`] = c.g; out[`${short}.b`] = c.b; out[`${short}.a`] = c.a
  }
  return out
}

// ---- characterisation ----------------------------------------------------
function analyse(frames, key) {
  const pts = []
  for (const f of frames) { const v = scalars(f)[key]; if (v != null) pts.push([f.t, v]) }
  if (pts.length < 6) return null
  const v0 = pts[0][1]
  // Settled value: the mean of the last fifth, which beats "the last
  // frame" when the last frame lands mid-jitter.
  const tailFrom = Math.floor(pts.length * 0.8)
  const tail = pts.slice(tailFrom).map((p) => p[1])
  const vf = tail.reduce((a, b) => a + b, 0) / tail.length
  const travel = vf - v0
  const span = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]))
  if (span < 1e-4) return null

  // Peak in the direction of travel, measured past the final value.
  const dir = Math.sign(travel) || 1
  let peak = v0, tPeak = 0
  for (const [t, v] of pts) if ((v - peak) * dir > 0) { peak = v; tPeak = t }
  const overshoot = Math.abs(travel) > 1e-6 ? (peak - vf) * dir / Math.abs(travel) : 0

  // Zero crossings of (v - vf): each one is the motion changing which side
  // of its destination it is on, which is what oscillation means.
  let crossings = 0, lastSign = 0, crossTimes = []
  for (const [t, v] of pts) {
    const s = Math.sign(v - vf)
    if (s !== 0 && lastSign !== 0 && s !== lastSign) { crossings++; crossTimes.push(t) }
    if (s !== 0) lastSign = s
  }

  // Settle time: last moment it is more than 2% of travel away from vf.
  let settle = 0
  for (const [t, v] of pts) if (Math.abs(v - vf) > 0.02 * Math.abs(travel)) settle = t

  const dts = pts.slice(1).map((p, i) => p[0] - pts[i][0]).sort((a, b) => a - b)
  const cadence = dts[Math.floor(dts.length / 2)]

  const out = {
    key, frames: pts.length, cadenceMs: +cadence.toFixed(2),
    from: +v0.toFixed(4), to: +vf.toFixed(4), travel: +travel.toFixed(4),
    peak: +peak.toFixed(4), tPeakMs: +tPeak.toFixed(1),
    overshootPct: +(overshoot * 100).toFixed(1),
    crossings, settleMs: +settle.toFixed(1),
  }

  if (overshoot > 0.005 && crossings >= 1) {
    // Second-order underdamped step response. Overshoot fixes the damping
    // ratio; the ringing period fixes the natural frequency.
    const z = -Math.log(overshoot) / Math.sqrt(Math.PI ** 2 + Math.log(overshoot) ** 2)
    // Half-period between consecutive crossings; use the first two if we
    // have them, else twice (tPeak) as the quarter-to-peak estimate.
    const halfPeriod = crossTimes.length >= 2 ? crossTimes[1] - crossTimes[0] : tPeak
    const wd = Math.PI / (halfPeriod / 1000)
    const wn = wd / Math.sqrt(1 - z * z)
    out.spring = {
      dampingRatio: +z.toFixed(3),
      naturalFreqHz: +(wn / (2 * Math.PI)).toFixed(2),
      // Unit mass, which is what motion libraries assume unless told.
      stiffness: Math.round(wn * wn),
      damping: +(2 * z * wn).toFixed(1),
      periodMs: +(1000 * 2 * Math.PI / wd).toFixed(0),
    }
  } else {
    // Monotonic, so it is a transition and not a spring. Fit it.
    //
    // The two things that have to be solved for rather than assumed are
    // when the motion started and how long it ran. There is latency
    // between the pointer arriving and the first frame that moves, and the
    // tail of an ease-out is so flat that any "close enough to done"
    // threshold truncates the duration and makes the curve look faster
    // than it is. An earlier version of this file assumed both and
    // reported `ease-out` for a transition declared on
    // cubic-bezier(0.25, 0.46, 0.45, 0.94); the bias, not the curve, was
    // the finding. So: grid-search start and duration per curve, and let
    // each curve be judged on its own best alignment.
    let t0 = pts[0][0]
    for (const [t, v] of pts) { if (Math.abs(v - v0) > 0.01 * Math.abs(travel)) break; t0 = t }
    const tEnd = pts[pts.length - 1][0]

    const scoreCurve = (c) => {
      const f = bez(...c)
      let best = { rms: Infinity, durationMs: null, startMs: null }
      for (let start = t0 - 20; start <= t0 + 34; start += 4) {
        for (let dur = 40; dur <= Math.min(900, tEnd - start); dur += 4) {
          let se = 0, n = 0
          for (const [t, v] of pts) {
            if (t < start) continue
            const p = t <= start + dur ? f((t - start) / dur) : 1
            se += ((v - (v0 + travel * p)) / travel) ** 2; n++
          }
          if (!n) continue
          const rms = Math.sqrt(se / n)
          if (rms < best.rms) best = { rms: +rms.toFixed(4), durationMs: dur, startMs: +(start - pts[0][0]).toFixed(0) }
        }
      }
      return best
    }

    const scored = Object.entries(CURVES)
      .map(([name, c]) => ({ name, ...scoreCurve(c) }))
      .sort((a, b) => a.rms - b.rms)
    out.monotonic = { bestFit: scored[0], runnerUp: scored[1] }
  }
  return out
}

// ---- report --------------------------------------------------------------
console.log(`# ${data.url}`)
console.log(`sampled ${data.sampledAt} at ${data.viewport.join('x')}, ${data.phaseMs}ms per phase\n`)

for (const r of data.results) {
  if (ONLY != null && r.i !== ONLY) continue
  const keys = new Set()
  for (const f of [...r.enter, ...r.leave]) for (const k of Object.keys(scalars(f))) keys.add(k)
  // A colour fading in from `transparent` reads as rgba(0,0,0,0) at rest,
  // so its r, g and b appear to jump hundreds of units on the first frame
  // while nothing visible happens. When the alpha channel is the one
  // moving, it is the only channel that means anything; drop the rest.
  for (const pre of ['fg', 'bg', 'ul', 'bd']) {
    // Each phase on its own: the two series have independent clocks, so
    // concatenating them hides the travel inside each.
    const moves = ['enter', 'leave'].some((ph) => {
      const a = analyse(r[ph], `${pre}.a`)
      return a && Math.abs(a.travel) > 0.05
    })
    if (moves) for (const ch of ['r', 'g', 'b']) keys.delete(`${pre}.${ch}`)
    else keys.delete(`${pre}.a`)
  }

  const found = []
  for (const k of keys) {
    const e = analyse(r.enter, k)
    if (e) found.push(['enter', e])
    const l = analyse(r.leave, k)
    if (l) found.push(['leave', l])
  }
  if (!found.length) continue
  console.log(`## [${r.i}] <${r.tag}> "${r.text}"  ${r.box.w}x${r.box.h}`)
  console.log(`   declared: ${r.declared.transitionProperty} / ${r.declared.transitionDuration} / ${r.declared.transitionTimingFunction}`)
  for (const [phase, a] of found) {
    const head = `   ${phase.padEnd(5)} ${a.key.padEnd(13)} ${String(a.from).padStart(7)} -> ${String(a.to).padStart(7)}  peak ${String(a.peak).padStart(7)} @${String(a.tPeakMs).padStart(6)}ms  overshoot ${String(a.overshootPct).padStart(6)}%  crossings ${a.crossings}  settle ${String(a.settleMs).padStart(5)}ms  cadence ${a.cadenceMs}ms`
    console.log(head)
    if (a.spring) console.log(`         SPRING  zeta ${a.spring.dampingRatio}  f ${a.spring.naturalFreqHz}Hz  period ${a.spring.periodMs}ms  stiffness ${a.spring.stiffness}  damping ${a.spring.damping}`)
    if (a.monotonic) {
      const b = a.monotonic.bestFit, r = a.monotonic.runnerUp
      console.log(`         CURVE   ${b.name} over ${b.durationMs}ms, starting ${b.startMs}ms after the pointer (rms ${b.rms}); then ${r.name} over ${r.durationMs}ms (rms ${r.rms})`)
    }
  }
  console.log('')
}
