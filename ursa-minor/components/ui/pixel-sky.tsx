"use client";

import { useEffect, useRef } from "react";

// Each shader pixel is a PIX×PIX block on screen.
const PIX = 2;

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
uniform sampler2D u_rand;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
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

void main() {
  vec2 px = floor(gl_FragCoord.xy);
  // flip to y-down so it matches the JS layout coords
  vec2 p = vec2(px.x + 0.5, u_res.y - px.y - 0.5);

  // night ground #020308
  vec3 col = vec3(0.008, 0.012, 0.031);

  // slow nebula haze, barely there — small floor keeps corners from going pitch black
  float n = fbm(p * 0.008 + vec2(u_time * 0.008, u_time * 0.003));
  col += vec3(0.055, 0.085, 0.170) * (0.12 + n * 0.10);

  // background stars begin below a soft diagonal, leaving the constellation's
  // upper-right corner clean; the boundary is roughened with noise so it
  // never reads as a straight line, and dissolves as you scroll away
  float diag = p.x / u_res.x + (1.0 - p.y / u_res.y) + (vnoise(p * 0.015) - 0.5) * 0.5;
  float starVis = mix(1.0 - 0.85 * smoothstep(1.0, 1.5, diag), 0.8, clamp(u_scroll, 0.0, 1.0));

  // star randomness comes from a CPU-generated random texture — placement
  // cannot correlate into lines the way procedural hashes can.
  // r+g = 16-bit placement value for the main layer, b+a for the underlayer;
  // remaining channels drive twinkle phase, speed, and tint.
  vec4 rnd = texture2D(u_rand, (px + 0.5) / u_res);

  // faint underlayer of dim stars: denser, so no region of sky reads empty
  float place2 = dot(vec2(rnd.b, rnd.a), vec2(255.0 / 256.0, 1.0 / 256.0));
  if (place2 > 0.9945) {
    float tw2 = 0.7 + 0.3 * sin(u_time * (0.4 + rnd.r) + rnd.g * 6.283);
    col += vec3(0.62, 0.70, 0.86) * tw2 * 0.16 * starVis;
  }

  // pixel starfield: stars twinkle in place; the texture is partially
  // re-randomized every few seconds so stars die out and appear elsewhere
  float place = dot(vec2(rnd.r, rnd.g), vec2(255.0 / 256.0, 1.0 / 256.0));
  if (place > 0.9986) {
    float tw = 0.7 + 0.3 * sin(u_time * (0.6 + rnd.b * 1.6) + rnd.a * 6.283);
    float b = (place - 0.9986) / 0.0014;
    float warm = step(0.8, fract(rnd.b * 7.31));
    vec3 tint = mix(vec3(0.75, 0.82, 0.95), vec3(0.95, 0.90, 0.78), warm);
    col += tint * tw * (0.18 + 0.45 * b) * starVis;
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

  // the whole sky settles darker as you scroll into the reading section
  gl_FragColor = vec4(min(col, 1.0) * mix(1.0, 0.42, clamp(u_scroll, 0.0, 1.0)), 1.0);
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

    const gl = canvas.getContext("webgl", { antialias: false });
    const loc: Record<string, WebGLUniformLocation | null> = {};
    let randData: Uint8Array | null = null;
    let fillRand = (_full: boolean) => {};

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

      for (const u of ["u_res", "u_time", "u_motion", "u_scroll", "u_rand"]) {
        loc[u] = gl.getUniformLocation(prog, u);
      }
      gl.uniform1f(loc.u_motion, reduced ? 0 : 1);
      gl.uniform1f(loc.u_scroll, 0);
      gl.uniform1i(loc.u_rand, 0);

      // one texel of true randomness per shader pixel
      const randTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, randTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      fillRand = (full: boolean) => {
        if (!randData) return;
        if (full) {
          for (let i = 0; i < randData.length; i++) randData[i] = (Math.random() * 256) | 0;
        } else {
          // regenerate ~12% of the sky
          const n = Math.floor((randData.length / 4) * 0.12);
          for (let k = 0; k < n; k++) {
            const idx = ((Math.random() * (randData.length / 4)) | 0) * 4;
            for (let j = 0; j < 4; j++) randData[idx + j] = (Math.random() * 256) | 0;
          }
        }
        gl.bindTexture(gl.TEXTURE_2D, randTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, randData);
      };
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
    };

    const resize = () => {
      w = Math.max(1, Math.ceil(canvas.clientWidth / PIX));
      h = Math.max(1, Math.ceil(canvas.clientHeight / PIX));
      canvas.width = w;
      canvas.height = h;

      if (gl) {
        gl.viewport(0, 0, w, h);
        gl.uniform2f(loc.u_res, w, h);
        randData = new Uint8Array(w * h * 4);
        fillRand(true);
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
    let lastEpoch = 0;

    const loop = (t: number) => {
      const epoch = Math.floor(t / 6000);
      if (epoch !== lastEpoch) {
        lastEpoch = epoch;
        fillRand(false);
      }
      mouseS.x += (mouseT.x - mouseS.x) * 0.06;
      mouseS.y += (mouseT.y - mouseS.y) * 0.06;
      canvas.style.transform = `scale(1.05) translate(${(mouseS.x * 14).toFixed(2)}px, ${(mouseS.y * 10).toFixed(2)}px)`;

      const scrollTarget = Math.min(scrollY / innerHeight, 1);
      scrollS += (scrollTarget - scrollS) * 0.08;
      if (gl) gl.uniform1f(loc.u_scroll, scrollS);

      draw(t / 1000);
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
