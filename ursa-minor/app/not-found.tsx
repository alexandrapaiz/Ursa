import Link from "next/link";
import PixelSky from "@/components/ui/pixel-sky";
import SiteHeader from "@/components/ui/site-header";
import SiteFooter from "@/components/ui/site-footer";

export default function NotFound() {
  return (
    <>
      <PixelSky />

      <div className="relative flex min-h-svh flex-col justify-between">
        <SiteHeader href="/" />

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

        <SiteFooter className="relative z-10" />
      </div>
    </>
  );
}
