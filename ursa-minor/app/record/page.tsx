import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/ui/site-header";
import SiteFooter from "@/components/ui/site-footer";
import RecordLoader from "@/components/record/record-loader";
import PublishedSite from "@/components/record/published-site";
import { publishedIds } from "@/lib/record/published";
import { CLASS_COPY, SPAN_CLASSES } from "@/lib/record/types";

export const metadata: Metadata = {
  title: "Outcome records — Ursa Minor",
  description:
    "An outcome record is a finished piece of work joined backward to every model generation that fed it, with each passage classified by what happened to it. Read the example, or read your own.",
};

export default async function RecordIndex() {
  const ids = await publishedIds();

  return (
    <>
      <SiteHeader href="/" />

      <main className="w-full px-[clamp(2rem,8vw,6rem)] pb-4 xl:mx-auto xl:max-w-6xl">
        <div className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
          <span className="text-[var(--polar)]">✦</span> Outcome records
        </div>
        <h1 className="mt-9 text-balance text-[clamp(1.7rem,3.8vw,2.7rem)] font-extralight leading-[1.3] tracking-[-0.015em] text-[var(--star)]">
          Nobody judged this output. The work either used it or it didn&rsquo;t.
        </h1>
        <p className="mt-8 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
          An outcome record is not a rating and not a preference pair. It is a finished piece of
          work, joined backward to every model generation that fed it, with each passage of the
          final thing classified by what happened to it.
        </p>

        <section className="border-t border-[var(--line)] py-12">
          <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
            <span className="text-[var(--polar)]">✦</span> What a passage can be
          </h2>
          <ul className="mt-9">
            {SPAN_CLASSES.map((c, i) => (
              <li
                key={c}
                className={`grid grid-cols-[13rem_1fr] gap-6 py-6 max-sm:grid-cols-1 max-sm:gap-2 ${
                  i > 0 ? "border-t border-[var(--line)]" : ""
                }`}
              >
                <span className="pt-1 font-mono text-[0.72rem] tracking-[0.06em] text-[var(--polar)]">
                  {c}
                </span>
                <span className="text-[#b7c0d4]">{CLASS_COPY[c].gloss}</span>
              </li>
            ))}
            <li className="grid grid-cols-[13rem_1fr] gap-6 border-t border-[var(--line)] py-6 max-sm:grid-cols-1 max-sm:gap-2">
              <span className="pt-1 font-mono text-[0.72rem] tracking-[0.06em] text-[var(--polar)]">
                generated_deleted
              </span>
              <span className="text-[#b7c0d4]">
                Produced and thrown away. This one is not in the finished work, so it is read on
                the generation rather than on the document, and the viewer shows it struck through
                in the generation it came from.
              </span>
            </li>
          </ul>
        </section>

        {ids.length ? (
          <section className="border-t border-[var(--line)] py-12">
            <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
              <span className="text-[var(--polar)]">✦</span> Read one now
            </h2>
            <p className="mt-7 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
              Published here, from data that is safe to publish. It is small on purpose: every
              pointer in it can be followed by hand, which is how you check that the viewer is
              showing you what the record says.
            </p>
            <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
              {ids.map((id) => (
                <li key={id}>
                  <Link
                    href={`/record/${id}`}
                    className="rec-action font-mono text-[0.78rem] tracking-[0.06em] text-[var(--polar)]"
                  >
                    {id} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <PublishedSite />

        <RecordLoader />
      </main>

      <SiteFooter measure="wide" />
    </>
  );
}
