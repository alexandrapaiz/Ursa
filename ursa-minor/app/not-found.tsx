import Link from "next/link";
import PixelSky from "@/components/ui/pixel-sky";

export default function NotFound() {
  return (
    <>
      <PixelSky />

      <div className="relative flex min-h-svh flex-col justify-between">
        <header className="relative z-10 flex items-baseline justify-between px-[clamp(2rem,8vw,6rem)] pt-14 pb-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-inter-tight)] text-[0.95rem] font-extralight uppercase tracking-[0.34em] text-[var(--star)]"
          >
            Ursa Minor
          </Link>
          <div className="font-mono text-[0.72rem] tracking-[0.08em] text-[var(--dim)]">
            for frontier labs
          </div>
        </header>

        <div className="relative z-10 max-w-4xl px-[clamp(2rem,8vw,6rem)] pb-20">
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
            <span className="text-[var(--polar)]">✦</span> 404
          </div>
          <p className="mt-9 text-balance text-[clamp(1.7rem,3.8vw,2.7rem)] font-extralight leading-[1.3] tracking-[-0.015em] text-[var(--star)]">
            No star at these coordinates.
          </p>
          <Link
            href="/"
            className="quiet-link mt-10 inline-block border border-[rgba(168,199,250,0.4)] px-7 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--polar)]"
          >
            Back to Ursa Minor
          </Link>
        </div>

        <footer className="relative z-10 border-t border-[var(--line)]">
          <div className="flex w-full flex-wrap gap-x-10 gap-y-2 px-[clamp(2rem,8vw,6rem)] pb-20 pt-14 font-mono text-[0.7rem] tracking-[0.1em] text-[var(--dim)] lg:mx-auto lg:max-w-2xl lg:px-8">
            <span>Alexandra Paiz Delgado · Systems Engineer</span>
            <span>Fatima Michel Giron · Computer &amp; Artificial Intelligence Engineer</span>
            <span>© ursa</span>
          </div>
        </footer>
      </div>
    </>
  );
}
