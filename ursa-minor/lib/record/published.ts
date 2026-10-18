import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseRecord } from "./parse";
import type { OutcomeRecord } from "./types";

/**
 * The records this site publishes at an address of its own.
 *
 * They live in `public/records/`, which means each one is served twice:
 * once as the page a person reads at `/record/<id>`, and once as the
 * bytes it was built from at `/records/<id>.json`. Both are deliberate.
 * The page is for the person; the JSON is so that nobody has to take the
 * page's word for what the record says, which is the same reason this
 * project publishes its methodology.
 *
 * Reading from `public/` rather than importing a second copy into the
 * bundle keeps one set of bytes behind both surfaces. The copy that is
 * there is checked against the resolver's own committed fixture by
 * `npm run check:example-record`, so a drifted copy fails a command.
 */
const DIR = path.join(process.cwd(), "public", "records");

/** ids are filenames, so anything that is not plainly one is not an id */
const ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function publishedIds(): Promise<string[]> {
  try {
    const names = await readdir(DIR);
    return names.filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5));
  } catch {
    return [];
  }
}

export async function readPublished(id: string): Promise<OutcomeRecord | null> {
  if (!ID.test(id) || id.includes("..")) return null;
  let raw: string;
  try {
    raw = await readFile(path.join(DIR, `${id}.json`), "utf8");
  } catch {
    return null;
  }
  const parsed = parseRecord(raw);
  return parsed.ok ? parsed.record : null;
}
