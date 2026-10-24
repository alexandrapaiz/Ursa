// Read a spring out of a `linear()` easing.
//
// A motion library that animates through the Web Animations API cannot
// hand the browser a spring, because CSS has no spring. What it hands over
// instead is the spring already solved: `linear(0 0%, 0.0235 2.56%, ...)`,
// a few dozen points sampled off the spring's own step response. That is
// the spring written out longhand, and it can be read back.
//
//   node read-spring.mjs frames.json           # every linear() in the file
//   node read-spring.mjs --easing 'linear(...)' --duration 400
//
// What comes back is the overshoot, the damping ratio, the natural
// frequency, and a stiffness and damping pair at unit mass. The arithmetic
// is the standard second-order step response: a known overshoot fixes the
// damping ratio, and the time of the first peak then fixes the frequency.

import { readFileSync } from 'node:fs'

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? null : process.argv[i + 1] }

/** linear(y pct, ...) -> [[progress 0..1, value], ...] */
export function parseLinear(easing) {
  const body = easing.match(/^linear\(([\s\S]*)\)$/)
  if (!body) return null
  const pts = []
  for (const part of body[1].split(',')) {
    const bits = part.trim().split(/\s+/)
    const v = Number(bits[0])
    const pct = bits[1] ? Number(bits[1].replace('%', '')) / 100 : null
    if (!Number.isFinite(v)) return null
    pts.push([pct, v])
  }
  // Points may omit their position, in which case it is spread evenly.
  for (let i = 0; i < pts.length; i++) {
    if (pts[i][0] != null) continue
    pts[i][0] = pts.length === 1 ? 0 : i / (pts.length - 1)
  }
  return pts
}

export function describeSpring(easing, durationMs) {
  const pts = parseLinear(easing)
  if (!pts) return null
  const final = pts[pts.length - 1][1]
  let peak = -Infinity, atPeak = 0
  for (const [p, v] of pts) if (v > peak) { peak = v; atPeak = p }
  let trough = Infinity, atTrough = 0
  for (const [p, v] of pts) if (p > atPeak && v < trough) { trough = v; atTrough = p }

  const overshoot = peak - final
  const out = {
    points: pts.length,
    durationMs,
    finalValue: final,
    peak: +peak.toFixed(4),
    peakAtPct: +(atPeak * 100).toFixed(2),
    peakAtMs: durationMs ? +(atPeak * durationMs).toFixed(0) : null,
    overshootPct: +(overshoot * 100).toFixed(2),
    // A monotone linear() is a plain easing someone generated, not a spring.
    monotone: pts.every((p, i) => i === 0 || p[1] >= pts[i - 1][1] - 1e-9),
  }
  if (overshoot > 1e-4) {
    // One undershoot after the overshoot means the thing rings; none means
    // it passes its target once and is done. Worth separating, because the
    // first is what people mean by bouncy and the second is not.
    out.undershootPct = atTrough > atPeak ? +((final - trough) * 100).toFixed(2) : 0
    const z = -Math.log(overshoot) / Math.sqrt(Math.PI ** 2 + Math.log(overshoot) ** 2)
    // First peak of an underdamped step response is at t = pi / wd.
    const wd = durationMs ? Math.PI / (atPeak * durationMs / 1000) : null
    const wn = wd ? wd / Math.sqrt(1 - z * z) : null
    out.dampingRatio = +z.toFixed(3)
    if (wn) {
      out.naturalFreqHz = +(wn / (2 * Math.PI)).toFixed(2)
      out.stiffness = Math.round(wn * wn)   // unit mass
      out.damping = +(2 * z * wn).toFixed(1)
    }
  }
  return out
}

const E = arg('easing')
if (E) {
  console.log(JSON.stringify(describeSpring(E, Number(arg('duration') || 0)), null, 1))
} else {
  const file = process.argv[2]
  if (!file) throw new Error('give a frames.json, or --easing with --duration')
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const seen = new Set()
  for (const r of data.results || []) {
    for (const [phase, list] of Object.entries(r.animations || {})) {
      for (const a of list) {
        if (!String(a.easing).startsWith('linear(')) continue
        const key = `${a.easing}|${a.duration}`
        if (seen.has(key)) continue
        seen.add(key)
        const props = [...new Set((a.keyframes || []).flatMap((k) => Object.keys(k).filter((x) => !['offset', 'easing', 'composite'].includes(x))))]
        console.log(`[${r.i}] "${r.text}" ${phase}`)
        console.log(`  animates: ${props.join(', ') || '(unreported)'}`)
        console.log(`  ${JSON.stringify(describeSpring(a.easing, a.duration))}`)
        console.log('')
      }
    }
  }
  if (!seen.size) console.log('no linear() easings in this capture')
}
