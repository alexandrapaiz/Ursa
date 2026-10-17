import Link from "next/link";

/**
 * One header for both routes, for the reason the footer became one
 * component: the two copies were identical today and a fix applied to only
 * one of them is how they stop being identical.
 *
 * `href` makes the word-mark a link, which the 404 wants and the home page
 * does not.
 *
 * In phone landscape the chrome answers to the height, the way the hero type
 * was taught to on 2026-10-12. pt-14/pb-8 becomes pt-6/pb-4, which takes the
 * header from 112px to 64px and is what puts the control back above the fold
 * at 667x375 and 720x360. See the `short-landscape` variant in globals.css for
 * the measurements.
 *
 * The row wraps rather than fights. At 320 the word-mark measures 130px and
 * the tag 135px against 256px of usable width, so the old nowrap row broke
 * both of them internally ("URSA / MINOR" beside "for frontier / labs") with
 * zero space between. Wrapping drops the tag to its own line instead, and
 * since neither item can break inside itself any more, the failure is a
 * second line rather than a collision. The minimum gap is 16px rather than
 * 24 so that the row keeps breaking at 355 instead of 379: 360 is a common
 * phone width and it held one line before, so it holds one line now.
 */
export function SiteHeader({ href }: { href?: string }) {
  const mark = (
    <span className="mark font-[family-name:var(--font-inter-tight)] text-[0.95rem] font-extralight uppercase tracking-[0.34em] whitespace-nowrap text-[var(--star)]">
      Ursa Minor
    </span>
  );

  return (
    <header className="relative z-10 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-[clamp(2rem,8vw,6rem)] pt-14 pb-8 short-landscape:pt-6 short-landscape:pb-4">
      {href ? (
        <Link href={href} className="mark-link">
          {mark}
        </Link>
      ) : (
        mark
      )}
      <span className="font-mono text-[0.72rem] whitespace-nowrap tracking-[0.08em] text-[var(--dim)]">
        for frontier labs
      </span>
    </header>
  );
}

export default SiteHeader;
