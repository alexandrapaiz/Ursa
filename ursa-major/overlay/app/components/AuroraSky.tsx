'use client'

// The dashboard's sky: the 3D aurora, revealed only around the pointer.
//
// Empty at rest. Moving the pointer over it lights a soft spotlight, about
// 220px in radius, that trails the pointer and fades about 1.5s after it
// stops. `pulse` changing (a reread) sets off a three-second substorm: a
// wider spot at the centre, brighter and faster. The canvas takes no
// pointer events, so the page under it keeps working. With reduced motion
// nothing drifts; without WebGL it falls back to a still gradient.

import { useEffect, useRef, useState } from 'react'
import { AURORA_FRAG, AURORA_VERT } from '../../lib/aurora-shader'

export function AuroraSky({ pulse = 0, className = '' }: { pulse?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const pulseAt = useRef(-10)
  const lastMove = useRef(-10)
  const focus = useRef({ x: 0.5, y: 0.5 })
  const [fallback, setFallback] = useState(false)
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const c = ref.current
      if (!c) return
      const r = c.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
      lastMove.current = performance.now() / 1000
      focus.current = { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height }
      setLit(true)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => { if (pulse) pulseAt.current = performance.now() / 1000 }, [pulse])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const still = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
    if (!gl) { setFallback(true); return }

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s); return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, AURORA_VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, AURORA_FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFallback(true); return }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = u('u_res'), uT = u('u_t'), uPulse = u('u_pulse'), uLevel = u('u_level'), uFocus = u('u_focus'), uRadius = u('u_radius')
    let level = 0
    const shown = { x: 0.5, y: 0.5 }
    let raf = 0
    // Sky time runs at 0.35x real time at rest, and faster only in a substorm.
    let skyT = 58 // starts on a lively stretch of the display
    let last = performance.now() / 1000

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      gl.viewport(0, 0, w, h)
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT)
      const now = performance.now() / 1000
      const since = now - pulseAt.current
      const storm = since < 3 ? Math.sin((since / 3) * Math.PI) : 0
      const dt = Math.min(0.1, now - last)
      last = now
      const moving = now - lastMove.current < 1.2
      const target = Math.max(moving ? 1 : 0, storm)
      level += (target - level) * Math.min(1, dt * (target > level ? 4 : 1.4))
      const f = storm > level * 0.9 ? { x: 0.5, y: 0.55 } : focus.current
      shown.x += (f.x - shown.x) * Math.min(1, dt * 3)
      shown.y += (f.y - shown.y) * Math.min(1, dt * 3)
      if (!still) skyT += dt * (0.35 + 1.4 * storm)
      if (level > 0.003) {
        gl.uniform2f(uRes, w, h)
        gl.uniform1f(uT, skyT)
        gl.uniform1f(uPulse, storm)
        gl.uniform1f(uLevel, level)
        gl.uniform2f(uFocus, shown.x, shown.y)
        gl.uniform1f(uRadius, 220 * dpr * (1 + storm * 0.8))
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  if (fallback) {
    return <div aria-hidden="true" className={`aurora-fallback ${lit ? 'is-lit' : ''} ${className}`} />
  }
  return <canvas ref={ref} aria-hidden="true" className={className} />
}
