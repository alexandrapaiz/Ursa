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
const outTxt = join(tmpdir(), `hit-selftest-${process.pid}.txt`);

const server = spawn("python3", ["-m", "http.server", port, "-d", here], {
  stdio: "ignore",
});
const stop = () => {
  server.kill();
  try { rmSync(out); } catch {}
  try { rmSync(outTxt); } catch {}
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
      "--out", outTxt,
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

  // ---- the second fixture: a surface the floor cannot reach ----
  //
  // Everything above reads the classification. This reads the sentence,
  // because the defect found on 2026-10-26 was never in the
  // classification. Every control on the overlay's dashboard is
  // correctly exempt under 2.5.8, and the instrument correctly printed
  // "0 of 0 standalone controls under 44px tall", and that sentence is
  // indistinguishable from the one a surface prints when it was checked
  // and cleared. L19 in the ledger forbids a count that can never be
  // zero; this is the same rule the other way up.
  const outExempt = join(tmpdir(), `hit-selftest-exempt-${process.pid}.txt`);
  const jsonExempt = join(tmpdir(), `hit-selftest-exempt-${process.pid}.json`);
  const run2 = spawn(
    process.execPath,
    [
      join(here, "..", "measure-hit-areas.mjs"),
      "--base", `http://127.0.0.1:${port}`,
      "--pages", "allexempt=/hit-areas-all-exempt.html",
      "--only", "desktop",
      "--out", outExempt,
      "--json", jsonExempt,
    ],
    { stdio: "ignore" },
  );
  const code2 = await new Promise((r) => run2.on("exit", r));
  if (code2 !== 0) throw new Error(`measure-hit-areas.mjs exited ${code2} on the all-exempt fixture`);
  const rows2 = Object.values(JSON.parse(readFileSync(jsonExempt, "utf8"))).flat();
  const text2 = readFileSync(outExempt, "utf8");
  try { rmSync(outExempt); rmSync(jsonExempt); } catch {}

  want.push(
    ["all-exempt fixture: targets seen", rows2.length, 3],
    ["all-exempt fixture: standalone controls", rows2.filter((r) => !r.inline && !r.doc).length, 0],
    ["all-exempt fixture: inline and exempt", rows2.filter((r) => r.inline).length, 3],
    [
      "all-exempt fixture: the headline says the floor reached nothing",
      text2.includes("NOT MEASURED AGAINST THE FLOOR"),
      true,
    ],
    [
      "all-exempt fixture: and never prints a zero denominator as a pass",
      /\b0 of 0 standalone controls/.test(text2),
      false,
    ],
    [
      "all-exempt fixture: the total names the surface the floor could not reach",
      text2.includes("the floor reached no control on: desktop/allexempt"),
      true,
    ],
    [
      "first fixture: its total does NOT claim an unreachable floor",
      readFileSync(join(tmpdir(), `hit-selftest-${process.pid}.txt`), "utf8")
        .includes("the floor reached no control on: no page"),
      true,
    ],
  );

  let bad = 0;
  for (const [what, got, exp] of want) {
    const ok = got === exp;
    if (!ok) bad++;
    console.log(`${ok ? "ok  " : "FAIL"}  ${String(got).padStart(5)} (want ${exp})  ${what}`);
  }
  console.log(bad ? `\n${bad} of ${want.length} expectations failed` : `\nall ${want.length} expectations hold`);
  stop();
  process.exit(bad ? 1 : 0);
} catch (err) {
  console.error(String(err));
  stop();
  process.exit(1);
}
