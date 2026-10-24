// Write a spring out as a CSS `linear()` easing.
//
// The inverse of read-spring.mjs. Given a damping ratio and a duration it
// solves the step response of a second-order system and samples it into
// the point list CSS wants, which is how a spring is expressed in a
// stylesheet with no library and no dependency.
//
//   node make-spring.mjs --damping 0.8 --duration 340
//   node make-spring.mjs --damping 0.8 --duration 400 --wnT 8.88 --points 40
//
// `wnT` is the dimensionless product of natural frequency and duration,
// which is what decides how much of the settle fits inside the declared
// time. It is given a default read off a real spring rather than invented;
// see the review that measured it.

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : Number(process.argv[i + 1]) }

const Z = arg('damping', 0.8)
const T = arg('duration', 340)
const WNT = arg('wnT', 8.88)
const N = arg('points', 40)

/** Unit step response of an underdamped second-order system. */
export function step(z, wn, t) {
  const wd = wn * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t))
}

export function makeLinear(z, durationMs, wnT = 8.88, points = 40) {
  const wn = wnT / (durationMs / 1000)
  const pts = []
  for (let i = 0; i < points; i++) {
    const p = i / (points - 1)
    // Pin the last point to exactly 1 so the property lands on its target
    // rather than near it; a hover that settles at 0.9997 of its colour is
    // a rounding error nobody can see and everybody inherits.
    const v = i === points - 1 ? 1 : step(z, wn, (p * durationMs) / 1000)
    pts.push([p, v])
  }
  return pts
}

const pts = makeLinear(Z, T, WNT, N)
const fmt = (v, p) => `${+v.toFixed(4)} ${+(p * 100).toFixed(4)}%`
const css = `linear(${pts.map(([p, v]) => fmt(v, p)).join(', ')})`

let peak = -Infinity, atPeak = 0
for (const [p, v] of pts) if (v > peak) { peak = v; atPeak = p }
let cross = null
for (const [p, v] of pts) if (cross == null && v >= 1) cross = p

console.error(`damping ratio ${Z}, duration ${T}ms, wn*T ${WNT} (wn ${(WNT / (T / 1000)).toFixed(1)} rad/s, ${(WNT / (T / 1000) / 2 / Math.PI).toFixed(2)} Hz)`)
console.error(`overshoot ${((peak - 1) * 100).toFixed(2)}% at ${(atPeak * T).toFixed(0)}ms; first reaches target at ${cross == null ? '-' : (cross * T).toFixed(0) + 'ms'}`)
console.log(css)
