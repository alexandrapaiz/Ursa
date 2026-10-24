import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/ui/site-header";
import SiteFooter from "@/components/ui/site-footer";
import RecordAtAddress from "@/components/record/record-at-address";

/**
 * `/record/at/<address>` — one record, at the address it carries.
 *
 * ## Why the route is shaped like this
 *
 * The address is one slash-separated string in the resolver's grammar,
 * so it is the rest of the path and not a query parameter: that is the
 * form a person types, the form `ursa address` prints, and the form a
 * published index now states for every record it lists. One string, one
 * place, no translation.
 *
 * An **optional** catch-all rather than a required one, because
 * `/record/at` with nothing after it is a real arrival: somebody was
 * sent an address in a chat window and wants somewhere to paste it. That
 * page reads a fragment if there is one, offers a field if there is not,
 * and explains the three forms either way.
 *
 * ## What this page does on a server, which is as close to nothing as
 * the route allows
 *
 * It renders chrome and an address. It does not fetch the record, does
 * not resolve the address, and does not log it anywhere: the fetch is
 * the reader's own browser talking to the host that holds the record,
 * which is the same promise `record-loader.tsx` makes for a file on
 * disk. What a server cannot avoid seeing is the request line, so the
 * page says that out loud once a record is open, and offers the
 * paste-and-resolve path for a reader who would rather it did not.
 */

export const metadata: Metadata = {
  title: "A record at its address — Ursa Minor",
  description:
    "A record address carries its own location: no service resolves it and nothing of ours sits between the address and the bytes. Paste one and read the record in your own browser.",
};

export default async function RecordAtAddressPage({
  params,
}: {
  params: Promise<{ address?: string[] }>;
}) {
  const { address } = await params;
  // Rejoined rather than inspected. The grammar's own parser is the only
  // thing that decides whether these segments are an address, and it
  // lives next to the code that resolves them, so this route stays a
  // route. Segments arrive decoded and with empty ones dropped, which is
  // why `url/https://host/x` reaches the parser as `url/https:/host/x`
  // and the parser repairs the slash.
  const initial = (address ?? []).join("/");

  return (
    <>
      <SiteHeader href="/" />

      <main className="w-full px-[clamp(2rem,8vw,6rem)] pb-4 xl:mx-auto xl:max-w-6xl">
        <div className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
          <span className="text-[var(--polar)]">✦</span> A record at its address
        </div>
        <h1 className="mt-9 text-balance text-[clamp(1.7rem,3.8vw,2.7rem)] font-extralight leading-[1.3] tracking-[-0.015em] text-[var(--star)]">
          The address says where the bytes are. Nothing of ours is in between.
        </h1>
        <p className="mt-8 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
          A record id is a directory name, a date and a short commit, which is unique on the machine
          that made it and namespaced by nothing outside it. Rather than run a service that resolves
          ids to locations, and so hold a register of who published what, an Ursa record address
          carries its own location. Your browser reads it from the host that holds it, directly.
        </p>

        <RecordAtAddress initial={initial} />

        <section className="mt-12 border-t border-[var(--line)] py-12">
          <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.28em] text-[var(--dim)]">
            <span className="text-[var(--polar)]">✦</span> What an address cannot do
          </h2>
          <p className="mt-7 measure text-[0.95rem] leading-[1.7] text-[#b7c0d4]">
            It cannot prove the record is the one that was published. A digest is stated by a site&rsquo;s
            index, and an address names a record and no index, so this page shows the digest of what
            arrived and says plainly that it checked nothing.{" "}
            <Link href="/record" className="rec-action text-[var(--polar)]">
              Opening the same record through its site
            </Link>{" "}
            is the path where the bytes get checked against what the publisher wrote down.
          </p>
        </section>
      </main>

      <SiteFooter measure="wide" />
    </>
  );
}
