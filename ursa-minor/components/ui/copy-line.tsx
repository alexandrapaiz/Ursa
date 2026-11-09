"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A command, and one control that puts it on the clipboard.
 *
 * The whole point of the line this wraps is that a stranger runs it
 * without typing it, so the copy control is the affordance and not a
 * convenience. Three things it does deliberately:
 *
 * The command stays selectable text. Clipboard access can be refused by
 * the browser, the page can be served without a secure context, and in
 * either case the person must still be able to select the line by hand.
 * So the control is beside the command, never instead of it, and a
 * refusal is reported on the control rather than swallowed.
 *
 * The confirmation replaces the control's own label for two seconds
 * rather than appearing somewhere else on the page. A toast that lands
 * in a corner is the generated-interface reflex, and it answers a
 * question nobody asked in a place nobody was looking.
 *
 * The press beats the hover, the same 90ms against 160ms as the home
 * page's one control, because the whole site's interaction grammar is
 * that rule and a second one here would read as a different product.
 *
 * The control is a 29px box and takes `.rec-hit` to be hittable at 44,
 * which costs 7.6px of overhang at each edge. Both edges have room at
 * every width: the card's own padding is 16px below `sm` and 20px above
 * it, and where the control stacks under the command the gap there is
 * 12px. So the overlay never reaches the command's scrolling box.
 */
export function CopyLine({ command, label }: { command: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "refused">("idle");
  const [scrolls, setScrolls] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  /* The command scrolls sideways, and until 2026-10-24 nothing told a
     reader so. `.rec-cmd` fades whichever edge still has content behind
     it; the widths come from here, because only the element knows how
     far it has left to go. See the note on `.rec-cmd` in globals.css for
     why it is a mask rather than a gradient over the top.

     Measured rather than listened for on a timer: `scroll` fires per
     frame on a trackpad, so the read is deferred to the next animation
     frame and coalesced. A ResizeObserver covers the viewport changing
     and the card reflowing at `sm`; `document.fonts.ready` covers the
     monospace face landing after first paint, which changes scrollWidth
     without resizing anything. */
  useEffect(() => {
    const el = pre.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const max = el.scrollWidth - el.clientWidth;
      const x = el.scrollLeft;
      const clamp = (n: number) => `${Math.max(0, Math.min(32, n))}px`;
      // Both are 0 when the line fits, which is what makes the fade
      // absent rather than decorative.
      el.style.setProperty("--fade-l", clamp(x));
      el.style.setProperty("--fade-r", clamp(max - x));
      // The same `max` decides whether this box is a keyboard stop. See the
      // note on tabIndex below for why that is ours to declare and not the
      // browser's to infer.
      setScrolls(max > 1);
    };
    const schedule = () => void (frame ||= requestAnimationFrame(measure));

    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    void document.fonts?.ready.then(schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("scroll", schedule);
      ro.disconnect();
    };
  }, [command]);

  const copy = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
    } catch {
      setState("refused");
    }
    timer.current = setTimeout(() => setState("idle"), 2000);
  }, [command]);

  return (
    <div className="mt-4">
      {label ? (
        <div className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--dim)]">
          {label}
        </div>
      ) : null}
      {/* Below sm the control sits under the command rather than beside
          it. Measured 2026-10-18 at 390: beside it, the control and its
          gap took 94px of a 326px box, a third of the measure, from the
          one element on the page that has a fixed length and cannot be
          reflowed. */}
      <div className="flex flex-col items-start gap-3 border border-[var(--line)] p-4 sm:flex-row sm:items-start sm:gap-4 sm:p-5">
        {/* The frame carries no mask, and that is its whole job. The focus
            ring is an outline 3px outside its control, and a mask clips
            everything its element paints, the outline included. Measured
            2026-11-09 at 390, with the command box focused from the
            keyboard: 0 indicator pixels as shipped, 694 with the mask
            removed, and 694 again with the ring moved onto an unmasked
            frame around the box. Same number, so the ring lands in exactly
            the geometry the design asks for and the fade keeps working.
            The rule is `.rec-cmd-frame:has()` in globals.css.

            The flex classes live here rather than on the `<pre>` because
            this element is now the flex child. */}
        <div className="rec-cmd-frame w-full min-w-0 sm:flex-1">
          <pre
            ref={pre}
            /* A scroll container is a keyboard stop, and until now nothing
               here said so. Chromium puts an overflowing element in the tab
               ring on its own, which is right, and it was doing it to these
               three boxes while `.tabIndex` read -1: so which commands were
               controls was a fact about the window width and the browser
               version, and not about this component. Firefox and Safari have
               not shipped that behaviour, so there a keyboard could not
               reach the hidden 737px of the Action's curl line at all.

               Declared only when the box actually scrolls, because a
               command that fits is not a thing to land on, and `undefined`
               rather than -1 so this never takes a stop away from a browser
               that was already offering one. */
            tabIndex={scrolls ? 0 : undefined}
            /* `group` and not the implicit role, because a `<pre>` computes
               as `generic` and a generic element cannot be named: asked over
               CDP on 2026-11-09, Chromium answered role `generic`, name ""
               at all three of these stops. So a keyboard arrived somewhere
               the page would not name, and an aria-label alone would have
               been dropped. */
            role={scrolls ? "group" : undefined}
            aria-label={scrolls ? "command, scrolls sideways" : undefined}
            className="rec-cmd w-full font-mono text-[0.72rem] leading-[1.8] text-[var(--star)] sm:text-[0.76rem]"
          >
            {command}
          </pre>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          className="cta rec-hit shrink-0 border border-[rgba(168,199,250,0.4)] px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--polar)]"
        >
          {state === "copied" ? "copied" : state === "refused" ? "select it" : "copy"}
        </button>
      </div>
      {/* Announced once, to a reader who cannot see the label change. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied"
          ? "command copied"
          : state === "refused"
            ? "this browser refused clipboard access; select the command instead"
            : ""}
      </span>
    </div>
  );
}

export default CopyLine;
