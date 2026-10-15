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
          {/* In landscape the type answers to the height as well as the width.
              The portrait clamp has a 1.7rem floor, which is right when the
              viewport is tall and is exactly what breaks it when the viewport
              is short: the floor holds the type up while the fold comes down,
              so the sentence runs off the bottom edge. Measured 2026-10-12 on
              the rendered page, bottom of the copy against the viewport:
              740x360 clipped by 7px, 844x390 by 13, 896x414 by 7 and 932x430
              by 3, every one of them cut mid-line, with the control 90 to
              100px below the fold and no scroll cue, because the cue is
              portrait-only. 6.4vh is the measured ceiling: a sweep of sizes
              from 16 to 34px put the largest type that keeps the whole
              sentence above the fold at 26px for 844x390, 24 for 740x360 and
              29 for 932x430, which is 6.6 to 6.7vh at each, so 6.4 clears all
              of them with a margin. Nothing that already fits moves: min()
              picks 3.8vw or the 2.7rem ceiling at every landscape size from
              1024x768 up, and 1024x600 changes by half a pixel. */}
          {/* text-balance stops at Chromium's line limit, and this sentence
              crosses it at every size where the box is narrower than about
              550px: measured 2026-10-15, balance, pretty and auto return the
              identical rag at 320, 375, 390, 414, 667x375, 1024x600, 1024x768
              and 1180x820, all of them seven lines or more. Where balance is a
              no-op the sentence ends on "feedback." alone, 101 to 163px of ink
              against a 256 to 543px box, 33 to 45% of the measure. Binding the
              final two words is the same device the sentence already uses on
              "A new": it takes the last line to 58 to 79% at every one of
              those sizes, changes nothing at any size where balance still
              reaches (360, 480, 600, 740, 820, 844, 896, 932, 1280, 1366,
              1440, 1920 are byte-identical before and after), never changes
              the line count, and never overflows the box. */}
          <h1 className="text-balance text-[clamp(1.7rem,3.8vw,2.7rem)] font-extralight leading-[1.3] tracking-[-0.015em] text-[var(--star)] landscape:max-w-[46vw] landscape:text-[min(3.8vw,6.4vh,2.7rem)]">
            <em className="not-italic text-[var(--polar)]">Polaris</em> —
            peer-to-peer supervised fine-tuning; outcome reward for open-ended
            generation. A{"\u00a0"}new approach to reinforcement learning from
            human{"\u00a0"}feedback.
          </h1>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="cta tracked-label mt-10 short-landscape:mt-6 border border-[rgba(168,199,250,0.4)] px-7 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--polar)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            Get Polaris
          </button>
        </div>
      </div>

      <main className="w-full px-[clamp(2rem,8vw,6rem)] lg:mx-auto lg:max-w-2xl lg:px-8">
        <section className="border-t border-[var(--line)] py-22">
          {/* an <h2>, not a <div>: this is the section's heading, and until
              today neither route had a single heading element on it. The
              classes are unchanged and preflight already resets the UA's
              heading font and margin, so nothing moves. */}
          <h2 className="mb-9 font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
            <span className="text-[var(--polar)]">✦</span> North stars
          </h2>
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
