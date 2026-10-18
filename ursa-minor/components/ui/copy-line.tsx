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
 */
export function CopyLine({ command, label }: { command: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "refused">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

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
      <div className="flex items-start gap-4 border border-[var(--line)] p-4 sm:p-5">
        <pre className="rec-doc min-w-0 flex-1 font-mono text-[0.72rem] leading-[1.8] text-[var(--star)] sm:text-[0.76rem]">
          {command}
        </pre>
        <button
          type="button"
          onClick={() => void copy()}
          className="cta shrink-0 border border-[rgba(168,199,250,0.4)] px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--polar)]"
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
