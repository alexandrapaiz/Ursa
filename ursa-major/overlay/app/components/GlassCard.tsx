'use client'

// The panel as a pane of real glass, rendered with three.js.
//
// A rounded slab with a physical transmission material refracts the 3D
// aurora (lib/aurora-shader.ts) hung just behind it, splits light slightly
// at its edges and catches a key light as it turns. The panel's HTML sits
// on top and is turned by the same angle with a CSS transform whose
// perspective matches the camera, so text stays crisp and moves with it.
//
// Still by default. It moves only on a trigger, as one short gesture:
//   readKey changes  a run has started: one slow turn to the side and back
//                    (3s), the aurora brightening through the glass
//   landKey changes  new data has landed: a small nod the other way (1s)
// At rest it faces you, flat, the aurora visible at half strength so the
// text on it stays readable. Nothing follows the pointer. With reduced
// motion it never turns; only the brightness says it is working.

import { useEffect, useMemo, useRef, type ReactNode, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, MeshTransmissionMaterial } from '@react-three/drei'
import { AURORA_FRAG } from '../../lib/aurora-shader'

const PX = 100 // CSS px per world unit
const FOV = 30
const INSET = 10 // px between the canvas edge and the slab, room for the turn

type Gesture = 'read' | 'land'
type Angle = { rx: number; ry: number; glow: number }

function easeInOut(p: number) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2 }

// Each gesture starts and ends at rest, so nothing is left tilted.
const GESTURES: Record<Gesture, { duration: number; at: (p: number) => Angle }> = {
  read: { duration: 3.0, at: (p) => { const s = Math.sin(Math.PI * easeInOut(p)); return { rx: 2.5 * s, ry: 12 * s, glow: s } } },
  land: { duration: 1.0, at: (p) => { const s = Math.sin(Math.PI * p) * (1 - p * 0.3); return { rx: -1.5 * s, ry: -4 * s, glow: 0.35 * s } } },
}

const FRAG = AURORA_FRAG
  .replace('uniform vec2 u_res;', 'uniform vec2 u_res;\nuniform float u_alpha;\nvarying vec2 vUv;')
  .replace('vec2 uv = gl_FragCoord.xy / u_res;', 'vec2 uv = vUv;')
  // Inside a panel the night behind the curtains is a hint, not a wash:
  // the glass already reads dark, and a full sky tint drowns the curtains.
  .replace('vec3(0.03, 0.04, 0.14), uv.y) * 0.8;', 'vec3(0.03, 0.04, 0.14), uv.y) * 0.25;')
  // Light adds to what is behind it: the colour itself, scaled. (Scaling by
  // the shader's own alpha as well squared the brightness and left the
  // aurora nearly black through the glass.)
  .replace('gl_FragColor = vec4(col, a);', 'gl_FragColor = vec4(col * u_alpha, 1.0);')
const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'

function Scene({ angle, w, h }: { angle: MutableRefObject<Angle>; w: number; h: number }) {
  const group = useRef<THREE.Group>(null)
  const background = useMemo(() => new THREE.Color('#05070f'), [])
  const uniforms = useMemo(() => ({
    u_res: { value: new THREE.Vector2(w / h, 1) },
    u_t: { value: 58 },
    u_pulse: { value: 0 },
    u_level: { value: 1 },
    u_focus: { value: new THREE.Vector2(0.5, 0.5) },
    u_radius: { value: 1e5 },
    u_alpha: { value: 0.5 },
  }), [w, h])

  useFrame((state) => {
    const { rx, ry, glow } = angle.current
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.degToRad(ry)
      group.current.rotation.x = THREE.MathUtils.degToRad(-rx)
    }
    const t = state.clock.elapsedTime
    uniforms.u_t.value = 58 + t * 0.33
    uniforms.u_alpha.value = Math.min(1.3, 0.8 + 0.05 * Math.sin(t * 0.35) + glow * 0.5)
  })

  const sw = w / PX, sh = h / PX
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 6]} intensity={1.8} color="#e8edf7" />
      <directionalLight position={[-4, -2, 3]} intensity={0.6} color="#a8c7fa" />
      <group ref={group}>
        <mesh position={[0, 0, -0.42]}>
          <planeGeometry args={[sw * 1.06, sh * 1.03]} />
          <shaderMaterial vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <RoundedBox args={[sw, sh, 0.28]} radius={0.18} smoothness={6}>
          <MeshTransmissionMaterial
            transmission={1}
            thickness={0.5}
            roughness={0.07}
            ior={1.4}
            chromaticAberration={0.04}
            anisotropy={0.15}
            distortion={0.05}
            distortionScale={0.3}
            temporalDistortion={0}
            samples={6}
            resolution={512}
            color="#d6e4ff"
            attenuationColor="#bcd2ff"
            attenuationDistance={2.5}
            background={background}
          />
        </RoundedBox>
      </group>
    </>
  )
}

export function GlassCard({
  width, height, readKey = 0, landKey = 0, children,
}: {
  /** The card's size in CSS px; the canvas adds INSET on every side. */
  width: number
  height: number
  /** Changing it plays the read gesture once. */
  readKey?: number
  /** Changing it plays the land gesture once. */
  landKey?: number
  children: ReactNode
}) {
  const angle = useRef<Angle>({ rx: 0, ry: 0, glow: 0 })
  const playing = useRef<{ g: Gesture; start: number } | null>(null)
  const content = useRef<HTMLDivElement>(null)
  const dist = ((height + INSET * 2) / 2 / PX) / Math.tan((FOV / 2) * Math.PI / 180)

  // The canvas mounts after a dynamic import, and its first measurement can
  // land before layout, which leaves three.js drawing into the browser's
  // default 300x150 buffer (measured 2026-11-19: a blank card). One resize
  // event after mount, and one after the next frame, makes it measure again.
  useEffect(() => {
    const kick = () => window.dispatchEvent(new Event('resize'))
    const raf = requestAnimationFrame(kick)
    const t = setTimeout(kick, 300)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  useEffect(() => { if (readKey) playing.current = { g: 'read', start: performance.now() } }, [readKey])
  useEffect(() => { if (landKey) playing.current = { g: 'land', start: performance.now() } }, [landKey])

  useEffect(() => {
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const tick = (now: number) => {
      let next: Angle = { rx: 0, ry: 0, glow: 0 }
      if (playing.current) {
        const { g, start } = playing.current
        const p = (now - start) / 1000 / GESTURES[g].duration
        if (p >= 1) playing.current = null
        else next = GESTURES[g].at(p)
        if (reduced) next = { rx: 0, ry: 0, glow: next.glow }
      }
      angle.current = next
      if (content.current) {
        content.current.style.transform = `perspective(${(dist * PX).toFixed(0)}px) rotateX(${next.rx.toFixed(2)}deg) rotateY(${next.ry.toFixed(2)}deg)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [dist])

  return (
    <div className="glass-card" style={{ width, height }}>
      <div className="glass-card-canvas" style={{ inset: -INSET }} aria-hidden="true">
        <Canvas
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: true }}
          camera={{ fov: FOV, position: [0, 0, dist], near: 0.1, far: 100 }}
        >
          <Scene angle={angle} w={width} h={height} />
        </Canvas>
      </div>
      <div ref={content} className="glass-card-content">{children}</div>
    </div>
  )
}
