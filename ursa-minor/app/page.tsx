import Constellation from "@/components/ui/constellation";
import PixelSky from "@/components/ui/pixel-sky";
import SiteHeader from "@/components/ui/site-header";
import ScrollCue from "@/components/ui/scroll-cue";
import SiteFooter from "@/components/ui/site-footer";

const NORTH_STARS = [
  {
    key: "distributed_intelligence",
    text: "The information a decision needs is dispersed across many individuals. No single observer ever holds it whole.",
  },
  {
    key: "discovery_of_intelligence",
    text: "Generation discovers facts that would otherwise stay unknown. If the result could be specified beforehand, there would be nothing to discover.",
  },
  {
    key: "tacit_intelligence",
    text: "Much of what people know cannot be stated as rules. It shows up only in action, applied to a particular case.",
  },
  {
    key: "pretence_of_intelligence",
    text: "Claims of information sufficient for central assessment always overreach. Systems built on them conform to the measure, not the world.",
  },
];

export default function Home() {
  return (
    <>
      <PixelSky />

      <div className="relative flex min-h-svh flex-col justify-between">
        <Constellation />
        <SiteHeader />

        <ScrollCue />

        <div className="relative z-10 max-w-4xl px-[clamp(2rem,8vw,6rem)] pb-20 portrait:mt-[92svh]">
          {/* landscape:max-w-[46vw] keeps the copy on its own side of the
              sky. Constellation places the dipper at (0.42 + x * 0.52) * w in
              landscape, "floating in the open sky beside the hero text", so
              its leftmost star lands at 0.6155w and Polaris' glow reaches
              36px further left again. The copy was never told to stay on its
              side. Measured 2026-10-08, longest rendered line against the
              mark's left edge: 844x390 overlapped by 210px, 960x540 by 234,
              1024x600 by 61 and 1180x700 by 40, with the dotted edges and two
              stars running straight through "reinforcement learning from
              human feedback". 46vw is the widest flat measure that clears the
              mark at every landscape width, because the clearance the
              geometry allows bottoms out at 46.4% of the viewport, at 844.
              Wide screens bind on nothing: 1440 and 1920 still render five
              lines ending at the same 732.3px. The mark is not moved, and
              portrait is untouched, where the copy already sits 92svh below
              it. */}
          <p className="text-balance text-[clamp(1.7rem,3.8vw,2.7rem)] font-extralight leading-[1.3] tracking-[-0.015em] text-[var(--star)] landscape:max-w-[46vw]">
            <em className="not-italic text-[var(--polar)]">Polaris</em> —
            peer-to-peer supervised fine-tuning; outcome reward for open-ended
            generation. A{"\u00a0"}new approach to reinforcement learning from
            human feedback.
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="cta mt-10 border border-[rgba(168,199,250,0.4)] px-7 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--polar)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            Get Polaris
          </button>
        </div>
      </div>

      <main className="w-full px-[clamp(2rem,8vw,6rem)] lg:mx-auto lg:max-w-2xl lg:px-8">
        <section className="border-t border-[var(--line)] py-22">
          <div className="mb-9 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
            <span className="text-[var(--polar)]">✦</span> North stars
          </div>
          <ul>
            {NORTH_STARS.map((star, i) => (
              <li
                key={star.key}
                className={`grid grid-cols-[13rem_1fr] gap-6 py-6 max-sm:grid-cols-1 max-sm:gap-2 ${
                  i > 0 ? "border-t border-[var(--line)]" : ""
                }`}
              >
                <span className="pt-1 font-mono text-[0.72rem] tracking-[0.06em] text-[var(--polar)]">
                  {star.key}
                </span>
                <span className="text-[#b7c0d4]">{star.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter column className="mt-8" />
    </>
  );
}
