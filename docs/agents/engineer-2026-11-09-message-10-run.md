# engineer, 2026-11-09, message wake (tenth) — F93: `ursa-minor`'s dev lockfile

One unit of work, handed to this seat directly as board message
`678be19f` from `Ursa/pm` at 2026-11-09T06:23:45Z: bump `ursa-minor`'s
development-dependency lockfile to clear the 23 npm advisories finding
F93 names, verified by a build, without touching the 33 production
dependencies. The finding is the security seat's, in
`docs/security/audit-2026-11-09-message-4.md` §3 and board message
`c028ba97`. That seat filed rather than fixed it for a stated reason:
`npm audit fix` re-resolves a whole lockfile, and its sandbox's disk had
too little room to install `ursa-minor` and find out whether the result
still builds. A lockfile bump that cannot be built is not a
behaviour-preserving fix.

## 1. The headline numbers, and where each one comes from

| measurement | before | after | command that produced it |
|---|---|---|---|
| Advisories over the whole tree, as `npm audit` counts them | **23**: 7 high, 15 moderate, 1 low | **3**: 0 high, 0 moderate, 3 low | `npm audit --package-lock-only --json` in `ursa-minor/`, reading `metadata.vulnerabilities` |
| Advisories reaching the production dependency tree | 0 | 0 | the same command with `--omit=dev`, and independently by the production-closure diff in row 4 |
| Development packages in the resolved tree | 608 | 555 | the same JSON's `metadata.dependencies.dev` |
| Lock entries npm classifies as production-tree (29 `prod` plus 3 `devOptional`, which is what makes `npm audit`'s "33" when the root package is counted) | 32 | 32, each one identical in `version`, `resolved` and `integrity` | `node /tmp/<your-scratch>/lockclass.mjs package-lock.json`, diffed against the same script run on `git show HEAD:ursa-minor/package-lock.json` |
| Packages in the production closure, meaning every lock entry reachable by walking dependency edges from the root manifest's `dependencies` only | 68 | 68, byte-identical | a closure walk over the lock, diffed the same way |

"Byte-identical" above is the literal claim: the diff of the two
32-row and the two 68-row tables is empty, so no production package
changed version, registry URL or integrity hash.

## 2. What the 23 advisories actually were, as three root causes

The 23 rows `npm audit` printed are not 23 independent problems. They
collapse to three, and the three have different answers.

**Root cause A, the `shadcn` subtree, 14 of the 23.** `shadcn` is a
scaffolding command-line tool listed under `devDependencies`, and
nothing under `app/`, `components/` or `lib/` imports it
(`docs/design/dependency-floor.md` §2 established that). It brings a
registry server with it, which is where `@modelcontextprotocol/sdk`,
`undici`, `hono`, `@hono/node-server`, `body-parser`, `qs`, `fast-uri`,
`ip-address`, `systeminformation` and `zod` enter the tree. Five of the
seven high-severity advisories were in this group. **Answer: an
ordinary forward bump.** `shadcn` 4.23.0 and its subtree carry fixed
versions of all of them, and `npm audit fix` found that without being
forced.

**Root cause B, `minimatch`'s globparts amplification, 8 of the 23.**
Advisory range `7.0.0 - 11.0.0`, fixed in `11.0.1`. Two packages in
this tree carry a vulnerable copy, both nested, both at `10.2.6`:
`@typescript-eslint/typescript-estree` and `@ts-morph/common`. The
other six rows in this group — `@typescript-eslint/eslint-plugin`,
`parser`, `type-utils`, `utils`, `typescript-eslint` and
`eslint-config-next` — are "depends on a vulnerable version of" rows
with no advisory of their own.

**There is no forward bump that clears B, and that is the part worth
writing down.** `@typescript-eslint/typescript-estree` 8.72.1 is the
newest release on the registry at this instant, it is already the
version in the lockfile, and its manifest asks for `minimatch`
`^10.2.2`, which is inside the vulnerable range. So npm reported the
available fix as `eslint-config-next@15.5.29` with
`isSemVerMajor: true` — a **downgrade** from the `16.4.0` this
manifest pins, beside `next` `16.4.3`. Taking npm's offered remedy here
would have moved the lint config a major version backwards and away
from the framework it configures. **Answer: two scoped `overrides`,
written in §3.**

**Root cause C, `deepmerge`'s prototype poisoning, 3 of the 23 and the
3 that remain.** Advisory range `>=4.2.0`, severity low, and there is
no fixed release: every published version at or above 4.2.0 is in
range, so no bump exists in any direction. `npm audit`'s only offered
remedy is `shadcn@1.0.0`, three majors below the `^4.21.0` this
manifest declares, which would remove the tool rather than patch it.
The three surviving rows are `deepmerge` itself and the two
"depends on" rows above it, `@shadcn/registry` and `shadcn`. **Answer:
not fixed, and §5 says what the options are.**

## 3. The two overrides, and why each is scoped rather than blanket

```json
"overrides": {
  "js-yaml": "^4.3.2",
  "@typescript-eslint/typescript-estree": { "minimatch": "^11.0.5" },
  "@ts-morph/common": { "minimatch": "^11.0.5" }
}
```

The `js-yaml` line was already there; the two nested objects are this
run's. The nested form is npm's own syntax for "force this dependency
only underneath this parent" (npm 10.9.8, `npm help config`, the
`overrides` section).

**Why not `"minimatch": "^11.0.5"` at the top level.** Because this
tree also contains a hoisted `node_modules/minimatch` at **3.1.5**,
which is outside the advisory's `7.0.0 - 11.0.0` range and therefore
not a finding, and whose API is not `minimatch` 11's. A blanket
override would have replaced a package that had nothing wrong with it,
across every consumer in the tree, to fix two nested copies. The
scoped form names exactly the two parents that carry a vulnerable copy.

**Why `^11.0.5` is a safe forcing of a package whose parent asks for
`^10.2.2`.** Read off the registry metadata for both versions:

| | `minimatch` 10.2.6 | `minimatch` 11.0.5 |
|---|---|---|
| `engines.node` | `18 \|\| 20 \|\| >=22` | `20 \|\| >=22` — satisfied by this host's Node 22.23.2 and by the `>=20` the rest of this tree already requires |
| `exports` keys, which is the whole public entry surface | `.`, `./package.json` | `.`, `./package.json` — unchanged |
| dependencies | `brace-expansion ^5.0.8` | `brace-expansion ^5.0.12`, plus `@isaacs/nonrecursive-glob-match ^1.1.0` |

The new dependency is the fix itself: version 11 replaced the recursive
matcher whose backtracking is the denial of service with a
non-recursive one. The entry surface is identical, which is why forcing
it across a `^10` range boundary is a version change and not an
interface change. That reasoning is an argument, not a proof, so §4 is
the proof: the two consumers are a TypeScript parser and a TypeScript
AST library, both exercised by the lint and type-check runs below.

## 4. The production tree did not move, and keeping it still took work

This is the part the handoff's constraint actually cost, and it is
worth recording because the next seat to run `npm audit fix` in this
product will hit it.

`npm audit fix` cleared root cause A by raising `shadcn`. The new
`shadcn` asks for `browserslist` `^4.29.3`, so `browserslist` went
4.28.7 → 4.29.5. `browserslist` is a **development** package here. But
`browserslist` 4.29.5 asks for `caniuse-lite` `^1.0.30001819` and
`baseline-browser-mapping` `^2.11.33`, and both of those are **shared
with `next`**, which is production. `next` asks only for
`^1.0.30001579` and `^2.9.19`, so the hoisted copies satisfied `next`
and not the new `browserslist` — and npm resolved that by raising the
hoisted copies:

```
caniuse-lite              1.0.30001806 -> 1.0.30001823
baseline-browser-mapping  2.11.10      -> 2.11.35
```

Two production transitives moved as collateral from a
development-only fix. Nothing in `npm audit fix`'s output says so.

**The repair, and why this particular one.** The two newer copies are
now nested under `node_modules/browserslist/node_modules/` and the
hoisted entries keep the versions `next` resolved before this bump.
That is an ordinary npm tree shape — npm writes nested entries itself
whenever two consumers disagree — so the result is not a hand-crafted
file npm will fight. Measured: a subsequent
`npm install --package-lock-only` over the repaired lockfile changes
**no** entry's class or version, so the lockfile is a fixed point of
npm's own resolver rather than something that reverts on the next
install.

Two alternatives were considered and rejected. Pinning the two names in
`overrides` would have forced `browserslist` 4.29.5 to run against data
tables below its declared range, which is a real semver violation
rather than a nesting. Accepting the two bumps and reporting them would
have been honest but would have broken the handoff's one stated
constraint; the constraint is cheap to honour once the mechanism is
understood, which is the case for writing the mechanism down.

**A control, because "my change moved it" needs a baseline.** Run on
`main`'s own untouched `package.json` and `package-lock.json` in a
scratch directory, `npm install --package-lock-only` also rewrites the
lockfile — it drops six nested `@emnapi`/`@napi-rs` entries under
`@tailwindcss/oxide-wasm32-wasi`. So this lockfile was never a fixed
point of `npm install` to begin with. What the control establishes is
the narrower and relevant claim: on `main`, that rewrite moves **no**
production entry, and before the repair in this section, on this
branch, it moved two. The production movement is attributable to this
change, and it is now gone.

## 5. What is not fixed, stated plainly

Three low-severity advisories remain, all of root cause C, all
development-only, and `npm audit --omit=dev` reports zero. There is no
bump that clears them, so the real options are a product decision
rather than an engineering one, and this seat does not make it:

1. **Leave them.** Severity low, development-only, and the gate in
   `scripts/dep-floor.mjs` does not report `low` at all, so this is
   the status quo and it is already the policy's answer.
2. **Drop `shadcn` from `devDependencies`.** It is a scaffolding CLI
   that no shipped file imports, it is normally run as
   `npx shadcn@latest add <component>` rather than installed, and
   removing it would take the whole `deepmerge` cluster and roughly 300
   development packages with it. `docs/design/dependency-floor.md`
   §2 already identifies it as the package that put six advisories into
   the production tree once before, by being listed under
   `dependencies`. This is the option worth taking and it is a ledger
   entry, not an unasked-for removal inside a lockfile bump.
3. **An entry in `dep-floor.allow.json`.** Only the owner adds those,
   and a `low` does not fail the gate, so there is nothing to suppress.

## 6. Exact commands, in order, as run

```bash
# 1. Observe. Needs no install, which is why security could run it and
#    report 23 from a sandbox too small to fix it.
cd ursa-minor && npm audit --package-lock-only --json > before.json

# 2. The cache. `npm config get cache` resolves under the shared home
#    every seat on this host runs as, so a scratch cache keeps this
#    run's installs out of a concurrent seat's (runner-facts.md §97).
export NPM_CONFIG_CACHE=/tmp/<your-scratch>/npm-cache

# 3. Scoped overrides into package.json, then the bump. No --force: the
#    only fixes --force would add here are the two semver-major
#    DOWNGRADES in §2.
npm audit fix --package-lock-only

# 4. Repair the collateral production movement (§4), then prove the
#    result is a fixed point of npm's own resolver.
npm install --package-lock-only   # lockfile unchanged after the repair

# 5. Verify behaviour is preserved. This is the step security could not
#    take, and the reason the finding was handed over rather than fixed.
npm ci
npx tsc --noEmit
npm run lint
npm run build
npm run check:example-record
npm run check:index-contract
npm run check:address

# 6. Re-observe.
npm audit --package-lock-only --json > after.json
npm audit --package-lock-only --omit=dev
```

## 6b. The verification, with its results

Every line below was run in `ursa-minor/` on this branch's lockfile,
after `npm ci` installed it from scratch. This is the half of F93 the
security seat could not reach, and the reason its finding was handed
over rather than fixed.

| command | result |
|---|---|
| `npm ci` | exit 0. `added 548 packages, and audited 549 packages in 3m`. 28 executables under `node_modules/.bin`, 710 MB on disk |
| `npx tsc --noEmit` | exit 0, no diagnostics |
| `npm run lint` (`eslint` 9, flat config) | exit 0. One pre-existing warning, `'_full' is defined but never used` at `components/ui/pixel-sky.tsx:127:21`, from `@typescript-eslint/no-unused-vars` in a file this branch does not touch. **That rule firing is the evidence for §3:** `no-unused-vars` is a type-aware rule, so reaching it means `@typescript-eslint/typescript-estree` parsed the project with the forced `minimatch` 11.0.5 under it and resolved the `tsconfig.json` globs it was given |
| `npm run build` (`next build`, Turbopack) | exit 0. `Compiled successfully in 28.4s`, TypeScript in 26.9s, 6 of 6 static pages generated, and all six routes present: `/`, `/_not-found`, `/record`, `/record/[id]` with `/record/mini-fixture` prerendered, and the dynamic `/record/at/[[...address]]` |
| `npm run check:example-record` | exit 0. `bytes: identical (sha256 47e59f28a002, 8819 bytes)`, and the eliciting rule `agrees with ursa-major on all 2 generations of the fixture` |
| `npm run check:index-contract` | exit 0. `the viewer reads the published index as its contract says it does.` |
| `npm run check:address` | exit 0. `the viewer resolves a record address as the grammar says it does.` |
| `npm audit` over the installed tree, both scopes | `{"low":3,"moderate":0,"high":0,"critical":0,"total":3}` for everything, and `found 0 vulnerabilities` under `--omit=dev` |
| `node scripts/dep-floor.mjs` from the repository root | exit 0, and the line this run moved is the third: `ursa-minor (ursa-minor-site): all critical=0 high=0 moderate=0 \| production critical=0 high=0 moderate=0`. Before this branch the same gate's `all` scope read `high=7 moderate=15` as warnings. `ursa-major` and `ursa-major/overlay` were already all-zero and are untouched |
| `node tools/ledger/check.mjs` | 607 blocks, `clean as far as a seat can take it`. The 8 reported violations are pre-existing `STATUS_ALLOWED` rows the checker's own message says only the owner can repair |

Two notes on the environment, because both are facts about this host
rather than about this product.

**The install was given its own npm cache.** `npm config get cache`
resolves under `/srv/asc/home`, the shared home every seat on this host
runs as, so a concurrent seat's install and this one would otherwise
share a `_cacache` (`docs/agents/runner-facts.md` §97). This run set
`NPM_CONFIG_CACHE` to a scratch path, ran its installs strictly one at
a time, and deleted the 414 MB cache directory once `npm ci` finished,
which is what gave the build its headroom. Another seat was installing
in the same window; nothing in this run failed.

**The disk was the binding constraint and it held.** `/tmp` went from
3.9 GB free at the start to 1.6 GB at the tightest point, immediately
after `npm ci` wrote 710 MB of `node_modules` beside a 414 MB cache.
That is approximately the 1.6 GB the security seat reported having when
it declined to install, so the constraint it named was real and the
margin was narrow rather than imagined.

**One incidental observation, not fixed here.** Something in this
host's resident runtime ran `npm audit` and then `npm i
--package-lock-only` in the repository root during this run, at
2026-11-09T06:47:17Z and 06:47:20Z by the npm debug logs' own names.
The root has no `package.json`, so the first failed `ENOLOCK` and the
second failed `ENOENT` — after writing a 105-byte
`package-lock.json` with an empty `packages` map into the root. It is
not in this branch; it was deleted. It is harmless to
`scripts/dep-floor.mjs`, whose discovery rule requires both a
`package.json` and a lockfile in the same directory, and the root has
only the latter. It is named here because an untracked lockfile in the
root of a repository eleven seats commit from is the kind of file one
of them eventually `git add -A`s, and because nothing in
`.claude/settings.json` in this repository runs npm, so the invocation
came from outside it.

## 7. Tooling

| tool | version | job here | why it, over what else |
|---|---|---|---|
| `npm` | 10.9.8, the version on this host; 12.2.2 exists and was not installed, because changing the package manager inside a lockfile bump would make the diff unreadable | resolver, advisory lookup, installer | This product's lockfile is `lockfileVersion: 3`, an npm artifact. `pnpm` or `yarn` would replace the lockfile rather than bump it, which is a different and larger change than the one that was asked for. |
| Node.js | 22.23.2 | runs `npm`, `next build` and the three `check:` scripts | Already the host's version. It matters to one decision: `minimatch` 11.0.5 requires `20 \|\| >=22`, which 22.23.2 satisfies. |
| `npm audit --package-lock-only` | part of npm 10.9.8 | the before and after measurement | The `--package-lock-only` flag resolves against the lockfile and never installs, so the measurement is available on a full disk. This is exactly how the security seat produced the number it could not then act on. |
| GitHub Advisory Database | queried live at the instants in §6, through `npm audit` | the advisory set itself | It is the database `npm audit` and `scripts/dep-floor.mjs` already read, so a number produced here is comparable with the gate's. |
| `next` | 16.4.3, unchanged by this run | `npm run build`, the behaviour check | Already this product's framework. Named here because its build is the evidence in §4 and because the version it pins is what made npm's offered `eslint-config-next@15.5.29` remedy wrong. |

## 8. The second half of F93, which this run did not take

Security's finding has two halves. The first is the 23 advisories,
which is this run. The second is that nothing runs the check: it ran
on 2026-11-09 because a charter line asked an agent to remember, and
`ursa-minor` had never been audited at all before that.

That half is already built and already blocked, and the block is not
this seat's to clear. `scripts/dep-floor.mjs` exists, it discovers
every directory holding both a `package.json` and a
`package-lock.json`, it runs `npm audit --json` twice per package to
split production from development, and it has a test suite and an
expiring-exception file. What it does not have is a workflow:
`dep-floor.workflow.yml` is in
`docs/agents/pending-workflow-changes-engineer.md` and not in
`.github/workflows/`, because writing a workflow file is outside every
seat's charter surface. So the gate is one owner-merged workflow file
away from running on every pull request, and until it does, the number
in §1 is a measurement and not an invariant.

## 9. External sources read

- The npm registry, over HTTPS, for published version lists and
  manifest metadata: `eslint-config-next`, `typescript-eslint`,
  `@typescript-eslint/typescript-estree`, `minimatch`. Read as data.
  Nothing in it addressed this run.
- The GitHub Advisory Database, through `npm audit`, which sends
  package names and versions and receives advisory records.
- The company board, `GET /api/messages`, for this seat's inbox. One
  item was addressed to it, `678be19f` from `Ursa/pm`, quoted in the
  preamble. Its request is in this seat's lane and this charter
  independently justifies the work, which is why it was taken.
- No web page was fetched and no third-party README was read.
