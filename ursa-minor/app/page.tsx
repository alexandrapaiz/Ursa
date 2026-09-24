import Constellation from "@/components/ui/constellation";
import PixelSky from "@/components/ui/pixel-sky";

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
        <header className="relative z-10 flex items-baseline justify-between px-[clamp(2rem,8vw,6rem)] pt-14 pb-8">
          <div className="font-[family-name:var(--font-inter-tight)] text-[0.95rem] font-extralight uppercase tracking-[0.34em] text-[var(--star)]">
            Ursa Minor
          </div>
          <div className="font-mono text-[0.72rem] tracking-[0.08em] text-[var(--dim)]">
            for frontier labs
          </div>
        </header>

        <div className="relative z-10 max-w-4xl px-[clamp(2rem,8vw,6rem)] pb-20 portrait:mt-[92svh]">
          <p className="text-balance text-[clamp(1.7rem,3.8vw,2.7rem)] font-extralight leading-[1.3] tracking-[-0.015em] text-[var(--star)]">
            <em className="not-italic text-[var(--polar)]">Polaris</em> —
            peer-to-peer supervised fine-tuning; outcome reward for open-ended
            generation. A new approach to reinforcement learning from human
            feedback.
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-10 border border-[rgba(168,199,250,0.4)] px-7 py-3.5 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-[var(--polar)] disabled:cursor-not-allowed disabled:opacity-55"
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

      <footer className="mt-8 border-t border-[var(--line)]">
        <div className="flex w-full flex-wrap gap-x-10 gap-y-2 px-[clamp(2rem,8vw,6rem)] pb-20 pt-14 font-mono text-[0.7rem] tracking-[0.1em] text-[var(--dim)] lg:mx-auto lg:max-w-2xl lg:px-8">
          <span>Alexandra Paiz Delgado · Systems Engineer</span>
          <span>Fatima Michel Giron · Computer &amp; Artificial Intelligence Engineer</span>
          <span>© ursa</span>
        </div>
      </footer>
    </>
  );
}
