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
 *
 * The rule sits on the padded box rather than on the <footer>, so it takes
 * the measure of the content it closes. Measured on 2026-10-08: as a child of
 * <footer> it was full bleed on both routes, so the home page ran four 608px
 * section rules and then one 1440px rule beneath them at desktop, and the
 * same disagreement at every other width (390: 326 against 390; 820: 689
 * against 820; 1920: 608 against 1920). Now every hairline on a page shares
 * one measure.
 */
export function SiteFooter({
  column = false,
  className = "",
}: {
  column?: boolean;
  className?: string;
}) {
  return (
    <footer className={className}>
      <div
        className={`w-full px-[clamp(2rem,8vw,6rem)] ${
          column ? "lg:mx-auto lg:max-w-2xl lg:px-8" : ""
        }`}
      >
        {/* max-sm:gap-y-4 because below sm each credit becomes two or three
            lines and the grouping has to survive that. Measured at 320, 375,
            390 and 414: the leading inside one credit is 17px and the gap
            between two credits was 25px, a ratio of 1.47 that reads as one
            six-line block rather than as three items. 16px of gap takes the
            between-credit step to 33px, near enough to double the leading
            that the groups separate. At and above sm each credit is a single
            line, the rhythm is already uniform, and gap-y-2 stays. */}
        <div className="flex flex-col gap-y-2 border-t border-[var(--line)] pb-20 pt-14 font-mono text-[0.7rem] tracking-[0.1em] text-[var(--dim)] max-sm:gap-y-4">
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
      </div>
    </footer>
  );
}

export default SiteFooter;
