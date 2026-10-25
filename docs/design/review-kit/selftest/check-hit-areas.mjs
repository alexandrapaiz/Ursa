/**
 * Prove that `measure-hit-areas.mjs` can still fail.
 *
 * On 2026-10-25b that tool grew a third category and its headline on the
 * real site went from "6 of 60 standalone controls under 44px" to zero.
 * Zero is the right answer there, and it is also what a tool that had
 * stopped looking would print, so the two cannot be told apart from the
 * site alone. This serves `hit-areas.html`, whose right answers are
 * known because they are built in, and asserts each of the four verdicts
 * actually fires.
 *
 * usage: node check-hit-areas.mjs [port]
 * exit 0 on pass, 1 on fail, and it says which expectation missed.
 */
import { spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const port = process.argv[2] ?? "4971";
const out = join(tmpdir(), `hit-selftest-${process.pid}.json`);

const server = spawn("python3", ["-m", "http.server", port, "-d", here], {
  stdio: "ignore",
});
const stop = () => {
  server.kill();
  try { rmSync(out); } catch {}
};

try {
  // wait for the fixture to answer rather than sleeping a guess
  const url = `http://127.0.0.1:${port}/hit-areas.html`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
    if (i === 59) throw new Error(`fixture never answered at ${url}`);
  }

  const run = spawn(
    process.execPath,
    [
      join(here, "..", "measure-hit-areas.mjs"),
      "--base", `http://127.0.0.1:${port}`,
      "--pages", "selftest=/hit-areas.html",
      "--only", "desktop",
      "--out", join(tmpdir(), `hit-selftest-${process.pid}.txt`),
      "--json", out,
    ],
    { stdio: "ignore" },
  );
  const code = await new Promise((r) => run.on("exit", r));
  if (code !== 0) throw new Error(`measure-hit-areas.mjs exited ${code}`);

  const rows = Object.values(JSON.parse(readFileSync(out, "utf8"))).flat();
  const standalone = rows.filter((r) => !r.inline && !r.doc);
  const docs = rows.filter((r) => r.doc);

  // Each expectation names the case in the fixture it is reading, so a
  // failure says which half is wrong rather than only that a count moved.
  const want = [
    ["targets seen", rows.length, 7],
    ["standalone controls (cases 1 and 2)", standalone.length, 2],
    ["of those, short — the floor still bites", standalone.filter((r) => r.short).length, 2],
    ["inline and exempt (case 3), 2.5.8 survived the third category", rows.filter((r) => r.inline).length, 1],
    ["document spans (cases 4 to 7)", docs.length, 4],
    ["document spans covering their own line (4 and 5)", docs.filter((r) => r.coversLine === true).length, 2],
    ["document spans under their own line (case 6)", docs.filter((r) => r.coversLine === false).length, 1],
    ["document spans covered outright (case 7)", docs.filter((r) => r.hitH === null).length, 1],
    ["document spans wrongly counted against the floor", docs.filter((r) => r.short).length, 0],
  ];

  let bad = 0;
  for (const [what, got, exp] of want) {
    const ok = got === exp;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"}  ${String(got).padStart(2)} (want ${exp})  ${what}`);
  }
  console.log(bad ? `\n${bad} of ${want.length} expectations failed` : `\nall ${want.length} expectations hold`);
  stop();
  process.exit(bad ? 1 : 0);
} catch (err) {
  console.error(String(err));
  stop();
  process.exit(1);
}
