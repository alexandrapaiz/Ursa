"use client";

import { useEffect, useRef } from "react";

// Each canvas pixel is a PIX×PIX block on screen.
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

// dipper data bounds, for uniform scaling on portrait
const BX = 0.376, BY = 0.17, BW = 0.384, BH = 0.52;

/**
 * The Ursa Minor constellation as its own layer: a 2D pixel canvas that
 * lives inside the hero, so it scrolls with the page and is untouched by
 * the mouse parallax applied to the starfield behind it.
 */
export function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;

    const cpos = (i: number): [number, number] => {
      const portrait = w < h;
      if (portrait) {
        // scenic upper-right, uniform scale so the dipper keeps its shape
        const s = Math.min((w * 0.55) / BW, (h * 0.3) / BH);
        const ox = w * 0.78 - BW * s;
        const oy = h * 0.19;
        return [ox + (DIPPER[i][0] - BX) * s, oy + (DIPPER[i][1] - BY) * s];
      }
      // landscape: center-right at mid-height, floating in the open sky
      // beside the hero text
      return [(0.42 + DIPPER[i][0] * 0.52) * w, (0.29 + DIPPER[i][1] * 0.48) * h];
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // dotted pixel lines
      ctx.fillStyle = "rgba(168, 199, 250, 0.32)";
      for (const [a, b] of EDGES) {
        const [ax, ay] = cpos(a);
        const [bx, by] = cpos(b);
        const steps = Math.ceil(Math.hypot(bx - ax, by - ay));
        for (let s = 0; s <= steps; s += 4) {
          ctx.fillRect(
            Math.round(ax + ((bx - ax) * s) / steps),
            Math.round(ay + ((by - ay) * s) / steps),
            1,
            1,
          );
        }
      }

      // stars; Polaris gets a soft pulsing glow
      for (let i = 0; i < DIPPER.length; i++) {
        const [x, y] = cpos(i);
        if (i === 0) {
          const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 1.1);
          const r = 18 * pulse;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, "rgba(150, 180, 240, 0.75)");
          g.addColorStop(1, "rgba(150, 180, 240, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(x - r, y - r, r * 2, r * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
        } else {
          ctx.fillStyle = "rgba(236, 242, 252, 0.95)";
          ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        }
      }
    };

    const resize = () => {
      w = Math.max(1, Math.ceil(canvas.clientWidth / PIX));
      h = Math.max(1, Math.ceil(canvas.clientHeight / PIX));
      canvas.width = w;
      canvas.height = h;
      draw(0);
    };

    const loop = (t: number) => {
      draw(t / 1000);
      raf = requestAnimationFrame(loop);
    };

    addEventListener("resize", resize);
    resize();
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-svh w-full [image-rendering:pixelated]"
    />
  );
}

export default Constellation;
