const CREDITS = [
  { name: "Alexandra Paiz Delgado", role: "Systems Engineer" },
  {
    name: "Fatima Michel Giron",
    role: "Computer & Artificial Intelligence Engineer",
  },
];

/**
 * One footer for both routes. It used to be written out twice, and the two
 * copies had drifted: the home page kept the stacked credits and the 404 kept
 * an inline flex-wrap that broke mid-role at 390, and each one carried a
 * different column rule, so each was misaligned at a width where the other
 * was fine.
 *
 * `column` aligns the credits with the home page's centred reading column
 * above lg, matching that page's `main` exactly. Without it the credits stay
 * on the page's own left edge, which is what the 404 needs, because it has no
 * reading column for a centred footer to agree with.
 */
export function SiteFooter({
  column = false,
  className = "",
}: {
  column?: boolean;
  className?: string;
}) {
  return (
    <footer className={`border-t border-[var(--line)] ${className}`}>
      <div
        className={`flex w-full flex-col gap-y-2 px-[clamp(2rem,8vw,6rem)] pb-20 pt-14 font-mono text-[0.7rem] tracking-[0.1em] text-[var(--dim)] ${
          column ? "lg:mx-auto lg:max-w-2xl lg:px-8" : ""
        }`}
      >
        {CREDITS.map((person) => (
          <span key={person.name}>
            <span className="whitespace-nowrap">{person.name}</span>
            <span className="max-sm:hidden"> · </span>
            {/* below sm the role takes its own line: the inline form wrapped
                mid-role ("Systems / Engineer") at 390px. Balanced so a long
                title splits evenly instead of orphaning its last word. */}
            <span className="block text-balance sm:inline">{person.role}</span>
          </span>
        ))}
        <span>© ursa</span>
      </div>
    </footer>
  );
}

export default SiteFooter;
