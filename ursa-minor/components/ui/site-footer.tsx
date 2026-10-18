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
 * `measure` names which of the site's three column widths this footer has to
 * agree with, because the rule that closes a page has to take the measure of
 * the content it closes.
 *
 *   "page"    the page's own left edge. The 404 needs this: it has no centred
 *             column for a footer to agree with.
 *   "reading" the home page's centred reading column above lg, matching that
 *             page's `main` exactly.
 *   "wide"    the record routes' centred column above xl. Added 2026-10-18,
 *             after the first screenshot pass of those routes: at 1440 the
 *             content hairlines ran 210 to 1050 and the footer ran 84 to 1178,
 *             so the page ended on a rule a third wider than every rule above
 *             it. This is the same defect the paragraph below describes, in
 *             the one measure that did not exist when it was fixed.
 *
 * The rule sits on the padded box rather than on the <footer>, so it takes
 * the measure of the content it closes. Measured on 2026-10-08: as a child of
 * <footer> it was full bleed on both routes, so the home page ran four 608px
 * section rules and then one 1440px rule beneath them at desktop, and the
 * same disagreement at every other width (390: 326 against 390; 820: 689
 * against 820; 1920: 608 against 1920). Now every hairline on a page shares
 * one measure.
 */
const MEASURE = {
  page: "",
  reading: "lg:mx-auto lg:max-w-2xl lg:px-8",
  wide: "xl:mx-auto xl:max-w-6xl",
} as const;

export function SiteFooter({
  measure = "page",
  className = "",
}: {
  measure?: keyof typeof MEASURE;
  className?: string;
}) {
  return (
    <footer className={className}>
      <div className={`w-full px-[clamp(2rem,8vw,6rem)] ${MEASURE[measure]}`}>
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
