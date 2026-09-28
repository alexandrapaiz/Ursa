"use client";

import { useEffect, useState } from "react";

/**
 * Portrait viewports offset the hero copy by 92svh, so the first screen
 * is sky alone: no sentence, no control, nothing that says more follows.
 * At 820x1180 that leaves roughly 600px of empty sky below the dipper.
 *
 * A hairline at the text column's left edge, with one pixel falling down
 * it, is the quietest affordance that still reads as "keep going", and it
 * is built from the two marks the page already uses. Landscape never
 * shows it, because there the copy is on screen already.
 */
export function ScrollCue() {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > window.innerHeight * 0.06);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute left-[clamp(2rem,8vw,6rem)] top-[calc(100svh-5rem)] z-10 hidden portrait:block ${
        past ? "opacity-0" : "opacity-100"
      } transition-opacity duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] motion-reduce:transition-none`}
    >
      <span className="scroll-cue relative block h-11 w-px">
        <span className="scroll-cue-pixel absolute left-0 top-0 block size-[2px] bg-[var(--polar)]" />
      </span>
    </div>
  );
}

export default ScrollCue;
