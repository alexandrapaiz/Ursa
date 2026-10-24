import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/ui/site-header";
import SiteFooter from "@/components/ui/site-footer";
import RecordView from "@/components/record/record-view";
import { publishedIds, readPublished } from "@/lib/record/published";

/* Static, like every other route here. The records this site publishes
   are committed files, so there is nothing to render per request and
   nothing to run on a server. */
export async function generateStaticParams() {
  return (await publishedIds()).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${id} — an outcome record`,
    description:
      "A finished piece of work joined backward to every model generation that fed it, with each passage classified by what happened to it.",
  };
}

export default async function RecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await readPublished(id);
  if (!record) notFound();

  return (
    <>
      <SiteHeader href="/" />

      <main className="w-full px-[clamp(2rem,8vw,6rem)] pb-4 xl:mx-auto xl:max-w-6xl">
        <div className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
          <span className="text-[var(--polar)]">✦</span> Outcome record
        </div>
        <h1 className="mt-9 text-balance text-[clamp(1.7rem,3.8vw,2.7rem)] font-extralight leading-[1.3] tracking-[-0.015em] text-[var(--star)]">
          {record.task.id}
        </h1>
        <p className="mt-6 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
          The finished work, joined backward to every model generation that fed it. Nobody graded
          any of this. The work either used what a model wrote or it did not, and that is the whole
          label.
        </p>

        <RecordView record={record} />

        <section className="border-t border-[var(--line)] py-12">
          <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
            <span className="text-[var(--polar)]">✦</span> Check it yourself
          </h2>
          <p className="mt-7 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
            Nothing above needs to be taken on this page&rsquo;s word. The record is served as the
            bytes it was built from at{" "}
            <a
              href={`/records/${id}.json`}
              className="rec-action font-mono text-[0.85rem] text-[var(--polar)]"
            >
              /records/{id}.json
            </a>
            , and{" "}
            <Link href="/record" className="rec-action text-[var(--polar)]">
              a record of your own
            </Link>{" "}
            reads in the same viewer.
          </p>
        </section>
      </main>

      <SiteFooter measure="wide" />
    </>
  );
}
