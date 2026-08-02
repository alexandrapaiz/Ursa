"use client";

import { useEffect, useRef } from "react";

// Each shader pixel is a PIX×PIX block on screen.
const PIX = 2;

// Little Dipper, normalized. Polaris first.
const DIPPER: [number, number][] = [
  [0.76, 0.17], // Polaris
  [0.706, 0.285], // Yildun
  [0.646, 0.395], // ε UMi
  [0.566, 0.49], // ζ UMi
  [0.436, 0.56], // β Kochab
  [0.376, 0.69], // γ Pherkad
  [0.496, 0.685], // η UMi
];
// handle: 0-1-2-3, bowl: 3-4-5-6-3
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 3],
];

const VERT = "attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }";

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res;
uniform float u_time;
uniform float u_motion;
uniform float u_scroll;
uniform vec2 u_star[7];
uniform vec2 u_segA[7];
uniform vec2 u_segB[7];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < 3; i++) {
    v += amp * vnoise(p);
    p *= 2.03;
    amp *= 0.5;
  }
  return v;
}

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * t);
}

void main() {
  vec2 px = floor(gl_FragCoord.xy);
  // flip to y-down so it matches the JS layout coords
  vec2 p = vec2(px.x + 0.5, u_res.y - px.y - 0.5);

  // night ground #020308
  vec3 col = vec3(0.008, 0.012, 0.031);

  // slow nebula haze, barely there — small floor keeps corners from going pitch black
  float n = fbm(p * 0.008 + vec2(u_time * 0.008, u_time * 0.003));
  col += vec3(0.055, 0.085, 0.170) * (0.12 + n * 0.10);

  // faint underlayer of dim stars: denser, so no region of sky reads empty
  float h2 = hash(px + 57.0);
  if (h2 > 0.9945) {
    float tw2 = 0.7 + 0.3 * sin(u_time * (0.4 + hash(px + 11.0)) + hash(px + 19.0) * 6.283);
    col += vec3(0.62, 0.70, 0.86) * tw2 * 0.16;
  }

  // pixel starfield: stars twinkle in place; a fraction of the field
  // regenerates every few seconds (stars die out, new ones appear elsewhere)
  vec2 cell = px;
  float h = hash(cell);
  if (h > 0.9986) {
    float epoch = floor(u_time / 6.0);
    if (hash(cell + epoch * 13.7) > 0.15) {
      float tw = 0.7 + 0.3 * sin(u_time * (0.6 + hash(cell + 7.0) * 1.6) + hash(cell + 3.0) * 6.283);
      float b = (h - 0.9986) / 0.0014;
      float warm = step(0.8, hash(cell + 3.3));
      vec3 tint = mix(vec3(0.75, 0.82, 0.95), vec3(0.95, 0.90, 0.78), warm);
      col += tint * tw * (0.18 + 0.45 * b);
    }
  }

  // pixelated shooting star: one streak roughly every 5s, top edge, falling
  float sEpoch = floor(u_time / 5.0);
  if (u_motion > 0.5 && hash(vec2(sEpoch, 43.0)) < 0.7) {
    float sT = fract(u_time / 5.0);
    float ang = radians(60.0 + 60.0 * hash(vec2(sEpoch, 29.0)));
    vec2 sDir = vec2(cos(ang), sin(ang));
    vec2 sPos = vec2(hash(vec2(sEpoch, 17.0)) * u_res.x, -4.0) + sDir * sT * u_res.y * 1.5;
    for (int k = 0; k < 7; k++) {
      vec2 tp = floor(sPos - sDir * float(k) * 3.0);
      float chs = max(abs(p.x - tp.x - 0.5), abs(p.y - tp.y - 0.5));
      if (chs < (k == 0 ? 1.5 : 1.0)) {
        col += vec3(0.70, 0.85, 1.0) * (1.0 - float(k) / 7.0) * 0.55;
      }
    }
  }

  // constellation belongs to the hero: it fades and rises away as you scroll
  float cFade = 1.0 - clamp(u_scroll * 1.3, 0.0, 1.0);
  vec2 cRise = vec2(0.0, u_scroll * 30.0);

  if (cFade > 0.0) {
    // constellation lines, dotted pixel checker
    for (int i = 0; i < 7; i++) {
      if (segDist(p, u_segA[i] - cRise, u_segB[i] - cRise) < 0.5) {
        if (mod(px.x + px.y, 4.0) < 1.0) {
          col += vec3(0.66, 0.78, 0.98) * 0.11 * cFade;
        }
      }
    }

    // constellation stars as pixel clusters; Polaris gets a soft gradient glow
    for (int i = 0; i < 7; i++) {
      vec2 sp = u_star[i] - cRise;
      vec2 d = abs(p - sp);
      float ch = max(d.x, d.y);
      if (i == 0) {
        float pulse = 0.85 + 0.15 * sin(u_time * 1.1);
        float g = max(0.0, 1.0 - length(p - sp) / (16.0 * pulse));
        g *= g; // smooth quadratic falloff, no hard edge
        col += vec3(0.41, 0.49, 0.68) * g * 0.45 * cFade;
        if (ch < 1.5) col += vec3(0.86, 0.91, 1.0) * cFade;
      } else {
        if (ch < 1.0) col += vec3(0.80, 0.85, 0.93) * 0.65 * cFade;
      }
    }
  }

  // the whole sky settles darker as you scroll into the reading section
  gl_FragColor = vec4(min(col, 1.0) * mix(1.0, 0.55, clamp(u_scroll, 0.0, 1.0)), 1.0);
}`;

export function PixelSky() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;

    // constellation occupies upper-right of hero; coords in shader-pixel space, y down
    const cpos = (i: number): [number, number] => [
      (0.42 + DIPPER[i][0] * 0.52) * w,
      (0.06 + DIPPER[i][1] * 0.62) * h,
    ];

    const gl = canvas.getContext("webgl", { antialias: false });
    const loc: Record<string, WebGLUniformLocation | null> = {};

    if (gl) {
      const compile = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);

      for (const u of ["u_res", "u_time", "u_motion", "u_scroll", "u_star", "u_segA", "u_segB"]) {
        loc[u] = gl.getUniformLocation(prog, u);
      }
      gl.uniform1f(loc.u_motion, reduced ? 0 : 1);
      gl.uniform1f(loc.u_scroll, 0);
    }

    const draw = (t: number) => {
      if (!gl) return;
      gl.uniform1f(loc.u_time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // no WebGL: static pixel sky on a 2D context
    const fallback = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#020308";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "rgba(205,216,238,0.5)";
      for (let i = 0; i < (w * h) / 1100; i++) {
        ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
      }
      ctx.fillStyle = "rgba(168,199,250,0.35)";
      for (const [a, b] of EDGES) {
        const [ax, ay] = cpos(a);
        const [bx, by] = cpos(b);
        const steps = Math.ceil(Math.hypot(bx - ax, by - ay));
        for (let s = 0; s <= steps; s += 2) {
          ctx.fillRect(
            Math.floor(ax + ((bx - ax) * s) / steps),
            Math.floor(ay + ((by - ay) * s) / steps),
            1,
            1,
          );
        }
      }
      for (let i = 0; i < 7; i++) {
        const [x, y] = cpos(i);
        const r = i === 0 ? 1 : 0;
        ctx.fillStyle = i === 0 ? "#dbe8ff" : "rgba(205,216,238,0.8)";
        ctx.fillRect(Math.floor(x) - r, Math.floor(y) - r, 1 + 2 * r, 1 + 2 * r);
      }
    };

    const resize = () => {
      w = Math.max(1, Math.ceil(canvas.clientWidth / PIX));
      h = Math.max(1, Math.ceil(canvas.clientHeight / PIX));
      canvas.width = w;
      canvas.height = h;

      if (gl) {
        gl.viewport(0, 0, w, h);
        gl.uniform2f(loc.u_res, w, h);
        const stars: number[] = [];
        const segA: number[] = [];
        const segB: number[] = [];
        for (let i = 0; i < 7; i++) stars.push(...cpos(i));
        for (const [a, b] of EDGES) {
          segA.push(...cpos(a));
          segB.push(...cpos(b));
        }
        gl.uniform2fv(loc.u_star, stars);
        gl.uniform2fv(loc.u_segA, segA);
        gl.uniform2fv(loc.u_segB, segB);
        draw(reduced ? 40 : 0);
      } else {
        fallback();
      }
    };

    // mouse parallax: the sky leans smoothly toward the pointer.
    // done with a sub-pixel CSS transform on the canvas (not in the shader),
    // so the motion is continuous instead of stepping on the pixel grid.
    const mouseT = { x: 0, y: 0 };
    const mouseS = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => {
      mouseT.x = e.clientX / innerWidth - 0.5;
      mouseT.y = e.clientY / innerHeight - 0.5;
    };

    let scrollS = 0;

    const loop = (t: number) => {
      mouseS.x += (mouseT.x - mouseS.x) * 0.06;
      mouseS.y += (mouseT.y - mouseS.y) * 0.06;
      canvas.style.transform = `scale(1.05) translate(${(mouseS.x * 14).toFixed(2)}px, ${(mouseS.y * 10).toFixed(2)}px)`;

      const scrollTarget = Math.min(scrollY / innerHeight, 1);
      scrollS += (scrollTarget - scrollS) * 0.08;
      if (gl) gl.uniform1f(loc.u_scroll, scrollS);

      // step time at 16 fps for the retro pixel feel
      draw(Math.floor((t / 1000) * 16) / 16);
      raf = requestAnimationFrame(loop);
    };

    // reduced motion: no animation loop, but scroll effects still apply
    const onScrollReduced = () => {
      if (!gl) return;
      gl.uniform1f(loc.u_scroll, Math.min(scrollY / innerHeight, 1));
      draw(40);
    };

    addEventListener("resize", resize);
    addEventListener("mousemove", onMouse);
    resize();
    if (gl && !reduced) raf = requestAnimationFrame(loop);
    if (gl && reduced) addEventListener("scroll", onScrollReduced, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("mousemove", onMouse);
      removeEventListener("scroll", onScrollReduced);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full [image-rendering:pixelated]"
    />
  );
}

export default PixelSky;
