#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/pairfinder.ts
function git(repoPath, args, opts = {}) {
  return (0, import_node_child_process.execFileSync)("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // `quiet` drops git's stderr. Used by the blob and commit-presence
    // probes, because a missing path or a missing commit at a given sha is
    // an expected answer there (deploy detection probes for files that may
    // not exist), not a failure worth printing.
    stdio: opts.quiet ? ["ignore", "pipe", "ignore"] : void 0
  });
}
function listCommits(repoPath, range) {
  const out = git(repoPath, [
    "log",
    range ?? "--all",
    "--reverse",
    "--topo-order",
    "--date=iso-strict",
    "--pretty=format:%H%x09%an%x09%ae%x09%aI%x09%P%x09%(trailers:key=Co-Authored-By,valueonly,separator=|)%x09%s"
  ]);
  return out.split("\n").filter(Boolean).map((line) => {
    const [sha, authorName, authorEmail, date, parents, trailers, ...rest] = line.split("	");
    return {
      sha,
      authorName,
      authorEmail,
      date,
      parents: parents ? parents.split(" ").filter(Boolean) : [],
      trailers: trailers ?? "",
      subject: rest.join("	")
    };
  });
}
function commitFiles(repoPath, sha) {
  const out = git(repoPath, ["show", "-m", "--name-only", "--format=", sha]);
  return [...new Set(out.split("\n").filter(Boolean))];
}
function blobLookup(repoPath, sha, path) {
  try {
    return { kind: "present", text: git(repoPath, ["show", `${sha}:${path}`], { quiet: true }) };
  } catch {
    let listed;
    try {
      listed = git(repoPath, ["ls-tree", sha, "--", path], { quiet: true });
    } catch {
      return { kind: "unreadable" };
    }
    return listed.trim() === "" ? { kind: "absent" } : { kind: "unreadable" };
  }
}
function blobAt(repoPath, sha, path) {
  const got = blobLookup(repoPath, sha, path);
  return got.kind === "present" ? got.text : null;
}
function commitsTouchingPath(repoPath, path) {
  let out;
  try {
    out = git(repoPath, [
      "log",
      "--all",
      "--pretty=format:%H%x09%s",
      "--",
      path
    ], { quiet: true });
  } catch {
    return null;
  }
  return out.split("\n").filter((l) => l.includes("	")).map((l) => {
    const [sha, ...rest] = l.split("	");
    return { sha, subject: rest.join("	") };
  });
}
function isAncestor(repoPath, ancestor, descendant) {
  if (ancestor === descendant) return true;
  try {
    git(repoPath, ["merge-base", "--is-ancestor", ancestor, descendant], { quiet: true });
    return true;
  } catch {
    return false;
  }
}
function findCommitPairs(repoPath, opts = {}) {
  return findCommitPairsWithDiagnostics(repoPath, opts).pairs;
}
function findCommitPairsWithDiagnostics(repoPath, opts = {}) {
  const trailerPattern = opts.agentTrailerPattern ?? DEFAULT_TRAILER;
  const authorPattern = opts.agentAuthorPattern ?? DEFAULT_AUTHOR;
  const maxDistance = opts.maxPairDistance ?? DEFAULT_MAX_PAIR_DISTANCE;
  const maxAgeHours = opts.maxPairAgeHours ?? DEFAULT_MAX_PAIR_AGE_HOURS;
  const maxInterposed = opts.maxInterposedGenerations ?? DEFAULT_MAX_INTERPOSED_GENERATIONS;
  const commits = listCommits(repoPath, opts.range);
  const files = /* @__PURE__ */ new Map();
  const touched = (sha) => {
    if (!files.has(sha)) files.set(sha, commitFiles(repoPath, sha));
    return files.get(sha);
  };
  const authorMatchesAll = commits.length >= 2 && commits.every((c) => authorPattern.test(c.authorName));
  const useAuthorFallback = !authorMatchesAll;
  const diagnostics = {
    commitsScanned: commits.length,
    generatedByTrailer: 0,
    generatedByAuthorName: 0,
    authorFallbackSuppressed: authorMatchesAll ? {
      pattern: String(authorPattern),
      authors: [...new Set(commits.map((c) => c.authorName))].sort()
    } : null,
    bounds: {
      maxPairDistance: maxDistance,
      maxPairAgeHours: maxAgeHours,
      maxInterposedGenerations: maxInterposed
    },
    abandoned: { distance: 0, age: 0, interposedGeneration: 0, notDescendant: 0 },
    mergeGenerationsRefused: 0
  };
  const marker = (c) => {
    if (trailerPattern.test(c.trailers)) return c.trailers;
    if (useAuthorFallback && authorPattern.test(c.authorName)) return c.authorName;
    return null;
  };
  for (const c of commits) {
    if (trailerPattern.test(c.trailers)) diagnostics.generatedByTrailer += 1;
    else if (useAuthorFallback && authorPattern.test(c.authorName)) {
      diagnostics.generatedByAuthorName += 1;
    }
  }
  const hoursBetween = (from, to) => (Date.parse(to) - Date.parse(from)) / 36e5;
  const ancestry = /* @__PURE__ */ new Map();
  const descends = (ancestor, descendant) => {
    const key = `${ancestor}..${descendant}`;
    if (!ancestry.has(key)) ancestry.set(key, isAncestor(repoPath, ancestor, descendant));
    return ancestry.get(key);
  };
  const pairs = [];
  for (let i = 0; i < commits.length; i++) {
    const gen = commits[i];
    const agentMarker = marker(gen);
    if (!agentMarker) continue;
    if (gen.parents.length > 1) {
      diagnostics.mergeGenerationsRefused += 1;
      continue;
    }
    const genFiles = new Set(touched(gen.sha));
    if (genFiles.size === 0) continue;
    const interveningMerges = [];
    for (let j = i + 1; j < commits.length; j++) {
      const fin = commits[j];
      if (j - i > maxDistance) {
        diagnostics.abandoned.distance += 1;
        break;
      }
      if (fin.parents.length > 1) {
        const mergeOverlap = touched(fin.sha).filter((p) => genFiles.has(p));
        if (mergeOverlap.length > 0) {
          interveningMerges.push({
            sha: fin.sha,
            parents: fin.parents,
            paths: mergeOverlap,
            author: fin.authorName,
            date: fin.date,
            subject: fin.subject
          });
        }
        continue;
      }
      if (marker(fin)) continue;
      const overlap = touched(fin.sha).filter((p) => genFiles.has(p));
      if (overlap.length === 0) continue;
      if (hoursBetween(gen.date, fin.date) > maxAgeHours) {
        diagnostics.abandoned.age += 1;
        break;
      }
      if (!descends(gen.sha, fin.sha)) {
        diagnostics.abandoned.notDescendant += 1;
        break;
      }
      const interposed = commits.slice(i + 1, j).filter(
        (c) => c.parents.length === 1 && marker(c) && touched(c.sha).some((p) => genFiles.has(p)) && descends(gen.sha, c.sha) && descends(c.sha, fin.sha)
      );
      if (interposed.length > maxInterposed) {
        diagnostics.abandoned.interposedGeneration += 1;
        break;
      }
      pairs.push({
        generatedSha: gen.sha,
        finalSha: fin.sha,
        paths: overlap,
        generatedAuthor: gen.authorName,
        finalAuthor: fin.authorName,
        generatedAt: gen.date,
        finalAt: fin.date,
        agentMarker,
        subject: gen.subject,
        interveningMerges
      });
      break;
    }
  }
  return { pairs, diagnostics };
}
var import_node_child_process, DEFAULT_TRAILER, DEFAULT_MAX_PAIR_DISTANCE, DEFAULT_MAX_PAIR_AGE_HOURS, DEFAULT_MAX_INTERPOSED_GENERATIONS, DEFAULT_AUTHOR;
var init_pairfinder = __esm({
  "src/pairfinder.ts"() {
    "use strict";
    import_node_child_process = require("node:child_process");
    DEFAULT_TRAILER = /claude|codex|cursor|gpt/i;
    DEFAULT_MAX_PAIR_DISTANCE = 25;
    DEFAULT_MAX_PAIR_AGE_HOURS = 168;
    DEFAULT_MAX_INTERPOSED_GENERATIONS = 0;
    DEFAULT_AUTHOR = /claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i;
  }
});

// src/normalize.ts
function normalize(text) {
  let norm = "";
  const map = [];
  let pendingSpace = false;
  let spaceIdx = -1;
  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    if (ch in FOLD) ch = FOLD[ch];
    if (/\s/.test(ch)) {
      if (norm.length > 0) {
        pendingSpace = true;
        if (spaceIdx < 0) spaceIdx = i;
      }
      continue;
    }
    if (pendingSpace) {
      norm += " ";
      map.push(spaceIdx);
      pendingSpace = false;
      spaceIdx = -1;
    }
    for (const c of ch.toLowerCase()) {
      norm += c;
      map.push(i);
    }
  }
  return { norm, map };
}
var FOLD;
var init_normalize = __esm({
  "src/normalize.ts"() {
    "use strict";
    FOLD = {
      "\u2018": "'",
      "\u2019": "'",
      "\u201C": '"',
      "\u201D": '"',
      "\u2013": "-",
      "\u2014": "-",
      "\u2026": "...",
      "\xA0": " "
    };
  }
});

// src/match.ts
function tokens(norm) {
  return norm.split(/[^a-z0-9]+/).filter(Boolean);
}
function levSimilarity(a, b) {
  if (a === b) return 1;
  const m = a.length;
  const n2 = b.length;
  if (m === 0 || n2 === 0) return 0;
  let prev = new Array(n2 + 1);
  let cur = new Array(n2 + 1);
  for (let j = 0; j <= n2; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= n2; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    ;
    [prev, cur] = [cur, prev];
  }
  return 1 - prev[n2] / Math.max(m, n2);
}
function containment(aTokens, bSet) {
  if (aTokens.length === 0) return 0;
  let hit = 0;
  for (const t of aTokens) if (bSet.has(t)) hit++;
  return hit / aTokens.length;
}
function combinedScore(cont, lev) {
  return 0.5 * cont + 0.5 * lev;
}
var THETA_HIGH, THETA_LOW, MIN_VERBATIM_LEN, MAX_TOKEN_DF, FUZZY_TOP_K;
var init_match = __esm({
  "src/match.ts"() {
    "use strict";
    THETA_HIGH = 0.6;
    THETA_LOW = 0.35;
    MIN_VERBATIM_LEN = 12;
    MAX_TOKEN_DF = 500;
    FUZZY_TOP_K = 25;
  }
});

// src/corroborate.ts
function relatives(commits, generatedSha) {
  const parents = /* @__PURE__ */ new Map();
  const children = /* @__PURE__ */ new Map();
  for (const c of commits) {
    parents.set(c.sha, c.parents);
    for (const p of c.parents) {
      let arr = children.get(p);
      if (!arr) children.set(p, arr = []);
      arr.push(c.sha);
    }
  }
  const reach = (edges) => {
    const seen = /* @__PURE__ */ new Set();
    const queue = [...edges.get(generatedSha) ?? []];
    while (queue.length > 0) {
      const sha = queue.pop();
      if (seen.has(sha)) continue;
      seen.add(sha);
      for (const next of edges.get(sha) ?? []) queue.push(next);
    }
    return seen;
  };
  return { ancestors: reach(parents), descendants: reach(children) };
}
function gitDescentCorroborator(projectPath, generatedSha, commits) {
  const { ancestors, descendants } = relatives(commits, generatedSha);
  const rivalCache = /* @__PURE__ */ new Map();
  const rivalsFor = (filePath) => {
    if (rivalCache.has(filePath)) return rivalCache.get(filePath);
    const touching = commitsTouchingPath(projectPath, filePath);
    const rivals = touching === null ? null : touching.filter((c) => c.sha !== generatedSha && !descendants.has(c.sha));
    rivalCache.set(filePath, rivals);
    return rivals;
  };
  const blobCache = /* @__PURE__ */ new Map();
  const read = (sha, path) => {
    const key = `${sha}:${path}`;
    let got = blobCache.get(key);
    if (!got) {
      got = blobLookup(projectPath, sha, path);
      blobCache.set(key, got);
    }
    return got;
  };
  return (filePath, spanText) => {
    const needle = normalize(spanText).norm;
    if (needle.length < MIN_VERBATIM_LEN) {
      return { basis: "unverified", reason: "span_too_short" };
    }
    const rivals = rivalsFor(filePath);
    if (rivals === null) {
      return { basis: "unverified", reason: "path_history_unreadable" };
    }
    let searched = 0;
    let hole = null;
    for (const c of rivals) {
      if (searched >= MAX_RIVAL_BLOBS) {
        return { basis: "unverified", reason: "rival_search_capped" };
      }
      const got = read(c.sha, filePath);
      if (got.kind === "absent") continue;
      if (got.kind === "unreadable") {
        hole ??= c.sha;
        continue;
      }
      searched++;
      if (!normalize(got.text).norm.includes(needle)) continue;
      return {
        basis: "rival",
        sha: c.sha.slice(0, SHORT),
        subject: c.subject,
        relation: ancestors.has(c.sha) ? "pre_existing" : "sibling"
      };
    }
    if (hole !== null) {
      return { basis: "unverified", reason: "unreadable_blob", sha: hole.slice(0, SHORT) };
    }
    return { basis: "corroborated", rivalsSearched: searched };
  };
}
var MAX_RIVAL_BLOBS, SHORT;
var init_corroborate = __esm({
  "src/corroborate.ts"() {
    "use strict";
    init_pairfinder();
    init_normalize();
    init_match();
    MAX_RIVAL_BLOBS = 40;
    SHORT = 7;
  }
});

// src/vendored.ts
function blobOid(repoPath, sha, path) {
  try {
    return (0, import_node_child_process2.execFileSync)("git", ["-C", repoPath, "rev-parse", `${sha}:${path}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim() || null;
  } catch {
    return null;
  }
}
function vendoredPaths(projectPath, ep, paths, commits) {
  const { ancestors, descendants } = relatives(commits, ep.generatedSha);
  const found = [];
  for (const path of paths) {
    const finalOid = blobOid(projectPath, ep.finalSha, path);
    if (finalOid === null || finalOid === EMPTY_BLOB) continue;
    const touching = commitsTouchingPath(projectPath, path);
    if (touching === null) continue;
    let compared = 0;
    for (const c of touching) {
      if (compared >= MAX_CANDIDATE_BLOBS) break;
      if (c.sha === ep.generatedSha || descendants.has(c.sha)) continue;
      const oid = blobOid(projectPath, c.sha, path);
      if (oid === null) continue;
      compared++;
      if (oid !== finalOid) continue;
      found.push({
        path,
        sha: c.sha.slice(0, SHORT2),
        subject: c.subject,
        relation: ancestors.has(c.sha) ? "pre_existing" : "sibling"
      });
      break;
    }
  }
  return found;
}
var import_node_child_process2, MAX_CANDIDATE_BLOBS, SHORT2, EMPTY_BLOB;
var init_vendored = __esm({
  "src/vendored.ts"() {
    "use strict";
    import_node_child_process2 = require("node:child_process");
    init_pairfinder();
    init_corroborate();
    MAX_CANDIDATE_BLOBS = 40;
    SHORT2 = 7;
    EMPTY_BLOB = "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391";
  }
});

// src/text.ts
function excerpt(text) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > MAX_EXCERPT ? t.slice(0, MAX_EXCERPT) + "\u2026" : t;
}
function normalizeForExcerpt(text) {
  return text.replace(/\s+/g, " ").trim();
}
function isExcerptOf(quoted, source) {
  if (quoted.length === 0) return false;
  const normalized = normalizeForExcerpt(source);
  if (quoted.length > MAX_EXCERPT && quoted.endsWith("\u2026")) {
    return normalized.startsWith(quoted.slice(0, -1));
  }
  return normalized.includes(quoted);
}
var MAX_EXCERPT;
var init_text = __esm({
  "src/text.ts"() {
    "use strict";
    MAX_EXCERPT = 220;
  }
});

// src/loops.ts
function hasChatTrace(record) {
  return record.conversations.some((c) => (c.prompts?.length ?? 0) > 0);
}
function contentTerms(text) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const w of tokens(normalize(text).norm)) {
    if (w.length < 3 || STOPWORDS.has(w) || /^\d+$/.test(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}
function roleOf(text, isFirstInConversation) {
  if (ACCEPTANCE_CUE.test(text)) {
    const rest = contentTerms(text).filter((w) => !ACCEPTANCE_VOCAB.has(w));
    if (rest.length <= 1) return "acceptance";
  }
  return isFirstInConversation ? "task_ask" : "correction";
}
function tracePrompts(record) {
  const out = [];
  for (const conv of record.conversations) {
    const prompts = conv.prompts ?? [];
    prompts.forEach((p, index) => {
      out.push({
        conversationId: conv.id,
        step: p.step,
        index,
        text: p.text,
        role: roleOf(p.text, index === 0),
        terms: contentTerms(p.text),
        regressionCue: REGRESSION_CUE.test(p.text)
      });
    });
  }
  return out.sort(
    (a, b) => a.conversationId === b.conversationId ? a.step - b.step || a.index - b.index : a.conversationId < b.conversationId ? -1 : 1
  );
}
function sharedTerms(a, b) {
  const bSet = new Set(b);
  return a.filter((t) => bSet.has(t));
}
function themeScore(p, members) {
  let best = 0;
  for (const m of members) {
    const shared = sharedTerms(p.terms, m.terms).length;
    if (shared < MIN_SHARED_TERMS) continue;
    const overlap = shared / Math.max(1, Math.min(p.terms.length, m.terms.length));
    if (overlap >= THEME_OVERLAP && overlap > best) best = overlap;
  }
  return best;
}
function themeLabel(members) {
  const count = /* @__PURE__ */ new Map();
  members.forEach((m, mi) => {
    for (const t of m.terms) {
      const prev = count.get(t);
      if (prev) prev.n++;
      else count.set(t, { n: 1, first: mi * 1e3 + m.terms.indexOf(t) });
    }
  });
  return [...count.entries()].sort((a, b) => b[1].n - a[1].n || a[1].first - b[1].first).slice(0, MAX_THEME_TERMS).map(([t]) => t).join(" ");
}
function detectTraceSignals(record) {
  const prompts = tracePrompts(record);
  const byConv = /* @__PURE__ */ new Map();
  for (const g of record.generations) {
    let arr = byConv.get(g.conversationId);
    if (!arr) byConv.set(g.conversationId, arr = []);
    arr.push(g);
  }
  const steps = Math.max(
    0,
    ...record.generations.map((g) => g.turnIndex),
    ...prompts.map((p) => p.step)
  );
  const loops = [];
  const regressions = [];
  const oneShotCorrections = [];
  let unresolvedSingleCorrections = 0;
  const notes = [];
  for (const conv of record.conversations) {
    const convPrompts = prompts.filter((p) => p.conversationId === conv.id);
    if (convPrompts.length === 0) continue;
    const gens = (byConv.get(conv.id) ?? []).slice().sort((a, b) => a.turnIndex - b.turnIndex);
    const corrections = convPrompts.filter((p) => p.role === "correction");
    const clusters = [];
    for (const p of corrections) {
      if (p.terms.length === 0) continue;
      let bestIdx = -1;
      let bestScore = 0;
      clusters.forEach((members, i) => {
        const score = themeScore(p, members);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      });
      if (bestIdx >= 0) clusters[bestIdx].push(p);
      else clusters.push([p]);
    }
    const ask = convPrompts.find((p) => p.role === "task_ask");
    if (ask && ask.terms.length > 0) {
      let bestIdx = -1;
      let bestScore = 0;
      clusters.forEach((members, i) => {
        const score = themeScore(ask, members);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      });
      if (bestIdx >= 0) clusters[bestIdx].unshift(ask);
    }
    let loopOrdinal = 0;
    for (const members of clusters) {
      members.sort((a, b) => a.step - b.step || a.index - b.index);
      const promptSteps = members.map((m) => m.step);
      const lastPromptStep = promptSteps[promptSteps.length - 1];
      const theme = themeLabel(members);
      const nextCorrectionStep = corrections.filter((p) => p.step > lastPromptStep).reduce((min, p) => Math.min(min, p.step), Infinity);
      const window = gens.filter((g) => g.turnIndex > lastPromptStep && g.turnIndex <= nextCorrectionStep);
      const resolving = window.filter((g) => g.survivedChars > 0);
      const resolvingSteps = [...new Set(resolving.map((g) => g.turnIndex))].sort((a, b) => a - b);
      const closedStep = resolvingSteps.length > 0 ? resolvingSteps[0] : null;
      if (members.length === 1) {
        if (closedStep === null) {
          unresolvedSingleCorrections++;
          continue;
        }
        const quoted = excerpt(members[0].text);
        oneShotCorrections.push({
          step: members[0].step,
          text: quoted,
          domain: targetFiles(record, conv.id, members[0].step, closedStep, members).join(", ") || theme,
          quotes: [{ of: "user_prompt", conversationId: conv.id, step: members[0].step, text: quoted }]
        });
        continue;
      }
      const statedAcceptance = closedStep !== null && convPrompts.some(
        (p) => p.role === "acceptance" && p.step >= closedStep && p.step <= nextCorrectionStep
      );
      const resolution = closedStep !== null ? statedAcceptance ? "accepted" : "accepted_tacitly" : window.length > 0 ? "abandoned" : "open";
      const regressionMembers = members.filter(
        (m, i) => m.regressionCue && i > 0 && m.role === "correction"
      );
      for (const m of regressionMembers) {
        const prior = members.filter((x) => x.step < m.step).pop();
        const evidence = excerpt(m.text);
        regressions.push({
          conversationId: conv.id,
          step: m.step,
          brokenState: `theme "${theme}" was already raised at step ${prior.step} and is reported broken again here`,
          evidence,
          quotes: [{ of: "user_prompt", conversationId: conv.id, step: m.step, text: evidence }],
          causedBySteps: gens.filter((g) => g.turnIndex > prior.step && g.turnIndex <= m.step).map((g) => g.turnIndex).filter((s, i, a) => a.indexOf(s) === i)
        });
      }
      loopOrdinal++;
      loops.push({
        id: `${conv.id}:L${loopOrdinal}`,
        conversationId: conv.id,
        theme,
        targetFiles: targetFiles(record, conv.id, promptSteps[0], closedStep ?? lastPromptStep, members),
        openedStep: promptSteps[0],
        promptSteps,
        recurrences: promptSteps.length - 1,
        regressionSteps: regressionMembers.map((m) => m.step),
        closedStep,
        resolution,
        resolvingSteps,
        ...specFrom(members, promptSteps, conv.id)
      });
    }
  }
  loops.sort((a, b) => a.openedStep - b.openedStep);
  regressions.sort((a, b) => a.step - b.step);
  oneShotCorrections.sort((a, b) => a.step - b.step);
  const lastCorrectionStep = prompts.filter((p) => p.role === "correction").reduce((max, p) => Math.max(max, p.step), -1);
  const acceptanceStatedInChat = prompts.some(
    (p) => p.role === "acceptance" && p.step >= lastCorrectionStep
  );
  notes.push(
    "trace-stage record: loops, regressions and one-shot corrections are auto-detected from conversations[].prompts[];",
    `every step joins to generations[].turnIndex and conversations[].prompts[].step, so each entry is re-derivable from the trace (theme overlap ${THEME_OVERLAP}, minimum ${MIN_SHARED_TERMS} shared terms).`
  );
  if (unresolvedSingleCorrections > 0) {
    notes.push(
      `${unresolvedSingleCorrections} single correction(s) were raised and answered by no surviving generation; they are counted here, not emitted as one-shot corrections, because nothing closed them.`
    );
  }
  if (acceptanceStatedInChat) {
    notes.push(
      "an acceptance prompt stands after the last correction in the trace. That is an observation about the chat, not the owner's declaration: episode.accepted stays whatever was declared at launch."
    );
  }
  notes.push(
    "feedbackTranslations and repairAttempts stay empty by design: naming the mechanism behind a complaint, or the strategy behind a repair, is a language judgment the detector does not make. The distiller does it downstream."
  );
  return {
    loops,
    regressions,
    oneShotCorrections,
    steps,
    acceptanceStatedInChat,
    unresolvedSingleCorrections,
    notes
  };
}
function specFrom(members, promptSteps, conversationId) {
  const wanted = members.filter((m) => !m.regressionCue);
  const pool = wanted.length > 0 ? wanted : members;
  const chosen = pool[pool.length - 1];
  const others = promptSteps.filter((s) => s !== chosen.step);
  const quoted = excerpt(chosen.text);
  return {
    discoveredSpec: `quoted from step ${chosen.step}, the loop's last statement of what was wanted (regression reports excluded): "${quoted}"` + (others.length > 0 ? ` \u2014 the loop's other statements stand unmerged at conversations[].prompts[].step ${others.join(", ")}` : ""),
    quotes: [{ of: "user_prompt", conversationId, step: chosen.step, text: quoted }]
  };
}
function targetFiles(record, conversationId, fromStep, toStep, members) {
  const out = /* @__PURE__ */ new Set();
  for (const file of record.files) {
    for (const span of file.spans) {
      const s = span.source;
      if (s && s.conversationId === conversationId && s.turnIndex >= fromStep && s.turnIndex <= toStep) {
        out.add(file.path);
        break;
      }
    }
  }
  for (const g of record.generations) {
    if (g.conversationId !== conversationId || !g.filePath) continue;
    if (g.turnIndex >= fromStep && g.turnIndex <= toStep) out.add(g.filePath);
  }
  const said = members.map((m) => m.text.toLowerCase()).join(" \n ");
  for (const file of record.files) {
    const base = file.path.split("/").pop().toLowerCase();
    if (base.includes(".") && said.includes(base)) out.add(file.path);
  }
  return [...out].sort();
}
var THEME_OVERLAP, MIN_SHARED_TERMS, MAX_THEME_TERMS, STOPWORDS, ACCEPTANCE_VOCAB, ACCEPTANCE_CUE, REGRESSION_CUE;
var init_loops = __esm({
  "src/loops.ts"() {
    "use strict";
    init_match();
    init_normalize();
    init_text();
    THEME_OVERLAP = 0.34;
    MIN_SHARED_TERMS = 2;
    MAX_THEME_TERMS = 3;
    STOPWORDS = /* @__PURE__ */ new Set([
      "the",
      "and",
      "but",
      "for",
      "not",
      "you",
      "your",
      "yours",
      "our",
      "ours",
      "its",
      "it",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "this",
      "that",
      "these",
      "those",
      "there",
      "here",
      "with",
      "without",
      "from",
      "into",
      "onto",
      "out",
      "off",
      "over",
      "under",
      "above",
      "below",
      "then",
      "than",
      "them",
      "they",
      "their",
      "have",
      "has",
      "had",
      "can",
      "cant",
      "could",
      "would",
      "should",
      "will",
      "wont",
      "shall",
      "may",
      "might",
      "must",
      "just",
      "only",
      "also",
      "very",
      "too",
      "much",
      "many",
      "more",
      "most",
      "less",
      "least",
      "some",
      "any",
      "all",
      "each",
      "both",
      "other",
      "another",
      "same",
      "such",
      "what",
      "when",
      "where",
      "which",
      "who",
      "whom",
      "why",
      "how",
      "now",
      "get",
      "got",
      "make",
      "made",
      "let",
      "lets",
      "put",
      "use",
      "using",
      "try",
      "trying",
      "want",
      "need",
      "like",
      "please",
      "thanks",
      "thank",
      "okay",
      "yes",
      "yeah",
      "yep",
      "nope",
      "ill",
      "ive",
      "thats",
      "dont",
      "doesnt",
      "didnt",
      "isnt",
      "arent",
      "one",
      "two",
      "three",
      "first",
      "last",
      "next",
      "before",
      "after",
      "again",
      "still",
      "yet",
      "back",
      "broke",
      "broken",
      "keeps",
      "keep",
      "went",
      "longer",
      "used",
      "sure",
      "maybe",
      "about",
      "because",
      "while",
      "between",
      "every",
      "anything",
      "something",
      "nothing",
      "doing",
      "does",
      "did",
      "done",
      "goes",
      "going",
      "see",
      "look",
      "looks"
    ]);
    ACCEPTANCE_VOCAB = /* @__PURE__ */ new Set([
      "perfect",
      "great",
      "nice",
      "good",
      "works",
      "working",
      "work",
      "love",
      "ship",
      "shipped",
      "exactly",
      "correct",
      "right",
      "awesome",
      "beautiful",
      "lovely",
      "cool",
      "fine",
      "better"
    ]);
    ACCEPTANCE_CUE = /\b(perfect|that works|works now|thanks|thank you|looks good|looks great|love it|exactly right|ship it|nailed it|that'?s it|great work|yes[, ]|lgtm)\b/i;
    REGRESSION_CUE = /\b(again|broke|broken|revert(ed)?|undid|undo|regress(ed|ion)?|reappeared|came back|went back|back to|no longer|used to|you removed|disappeared|lost the)\b/i;
  }
});

// src/signals.ts
function mutationCorrections(record) {
  const out = [];
  for (const file of record.files) {
    for (const span of file.spans) {
      if (span.class !== "survived_mutated" || !span.diff || !span.source) continue;
      const gen = record.generations[span.source.generationIndex];
      if (!gen) continue;
      const agent = gen.text.slice(span.source.start, span.source.end);
      const hers = span.text;
      if (!agent.trim() || !hers.trim()) continue;
      const agentQuote = excerpt(agent);
      const finalQuote = excerpt(hers);
      out.push({
        step: span.source.turnIndex,
        text: `AGENT: ${agentQuote}
FINAL: ${finalQuote}`,
        domain: file.path,
        quotes: [
          {
            of: "generation",
            conversationId: span.source.conversationId,
            step: span.source.turnIndex,
            generationIndex: span.source.generationIndex,
            text: agentQuote
          },
          { of: "final_span", filePath: file.path, text: finalQuote }
        ]
      });
    }
  }
  return out;
}
function deriveSignals(record, declaration = UNDECLARED) {
  const base = {
    method: "auto-detected",
    annotatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    episode: {
      steps: record.generations.length,
      generations: record.generations.length,
      accepted: declaration.accepted,
      acceptanceStatedInChat: false,
      acceptanceBasis: declaration.basis
    },
    correctionLoops: [],
    feedbackTranslations: [],
    repairAttempts: [],
    regressions: [],
    defensiveGuardrails: [],
    oneShotCorrections: [],
    notes: []
  };
  if (!hasChatTrace(record)) {
    return {
      ...base,
      oneShotCorrections: mutationCorrections(record),
      notes: [
        "label-stage record (git commit pair): corrections appear once, as edits;",
        "recurrence and loops are unobservable without the chat trace."
      ]
    };
  }
  const trace = detectTraceSignals(record);
  return {
    ...base,
    episode: {
      ...base.episode,
      steps: trace.steps,
      acceptanceStatedInChat: trace.acceptanceStatedInChat
    },
    correctionLoops: trace.loops,
    regressions: trace.regressions,
    oneShotCorrections: trace.oneShotCorrections,
    notes: trace.notes
  };
}
var UNDECLARED;
var init_signals = __esm({
  "src/signals.ts"() {
    "use strict";
    init_loops();
    init_text();
    UNDECLARED = {
      accepted: null,
      basis: "undeclared: no owner declaration surface was offered; retention is NOT acceptance"
    };
  }
});

// src/segment.ts
function modeForPath(p) {
  return /\.(md|mdx|markdown|txt|tex)$/i.test(p) ? "prose" : "code";
}
function segment(text, mode) {
  return mode === "prose" ? segmentProse(text) : segmentLines(text);
}
function segmentLines(text) {
  const out = [];
  const re = /[^\n]+/g;
  let m;
  while (m = re.exec(text)) {
    const raw = m[0];
    const t = raw.trim();
    if (!t) continue;
    const ls = raw.length - raw.trimStart().length;
    out.push({ start: m.index + ls, end: m.index + ls + t.length, text: t });
  }
  return out;
}
function segmentProse(text) {
  const out = [];
  const push = (a, b) => {
    const raw = text.slice(a, b);
    const t = raw.trim();
    if (!t) return;
    const ls = raw.length - raw.trimStart().length;
    out.push({ start: a + ls, end: a + ls + t.length, text: t });
  };
  const lineRe = /[^\n]+/g;
  let lm;
  while (lm = lineRe.exec(text)) {
    const line = lm[0];
    const base = lm.index;
    let s = 0;
    for (let k = 0; k < line.length; k++) {
      if (!".!?".includes(line[k])) continue;
      let e = k + 1;
      while (e < line.length && CLOSERS.includes(line[e])) e++;
      if (e < line.length && line[e] !== " ") continue;
      const next = line.slice(e).trimStart();
      const decimal = /\d/.test(line[k + 1] ?? "");
      if (decimal || next !== "" && /[a-z]/.test(next[0])) continue;
      push(base + s, base + e);
      s = e;
      while (s < line.length && line[s] === " ") s++;
      k = s - 1;
    }
    if (s < line.length) push(base + s, base + line.length);
  }
  return out;
}
var CLOSERS;
var init_segment = __esm({
  "src/segment.ts"() {
    "use strict";
    CLOSERS = `"')\u201D\u2019`;
  }
});

// src/episodes.ts
function buildEpisodes(pairs, projectPath) {
  const slug = (0, import_node_path.basename)(projectPath).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return pairs.map((p) => ({
    id: `${slug}-${p.generatedAt.slice(0, 10)}-${p.generatedSha.slice(0, 7)}`,
    projectPath,
    status: "closed",
    openedAt: p.generatedAt,
    closedAt: p.finalAt,
    closureHeuristic: "git-commit-pair",
    touchedFiles: p.paths,
    generatedSha: p.generatedSha,
    finalSha: p.finalSha,
    agentMarker: p.agentMarker,
    subject: p.subject,
    distilled: false,
    interveningMerges: p.interveningMerges
  }));
}
var import_node_path;
var init_episodes = __esm({
  "src/episodes.ts"() {
    "use strict";
    import_node_path = require("node:path");
  }
});

// src/store.ts
function ursaDir(projectRoot) {
  return (0, import_node_path2.join)(projectRoot, ".ursa");
}
function saveRecord(projectRoot, record) {
  const dir = (0, import_node_path2.join)(ursaDir(projectRoot), "records");
  (0, import_node_fs.mkdirSync)(dir, { recursive: true });
  const path = (0, import_node_path2.join)(dir, `${record.task.id}.json`);
  (0, import_node_fs.writeFileSync)(path, JSON.stringify(record, null, 2) + "\n");
  return path;
}
function saveEpisodes(projectRoot, episodes) {
  (0, import_node_fs.mkdirSync)(ursaDir(projectRoot), { recursive: true });
  const path = (0, import_node_path2.join)(ursaDir(projectRoot), "episodes.json");
  (0, import_node_fs.writeFileSync)(path, JSON.stringify(episodes, null, 2) + "\n");
  return path;
}
var import_node_fs, import_node_path2;
var init_store = __esm({
  "src/store.ts"() {
    "use strict";
    import_node_fs = require("node:fs");
    import_node_path2 = require("node:path");
  }
});

// src/intervals.ts
function mergedLength(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let total = 0;
  let runStart = -1;
  let runEnd = -1;
  for (const [start, end] of sorted) {
    if (end <= start) continue;
    if (start > runEnd) {
      if (runEnd > runStart) total += runEnd - runStart;
      runStart = start;
      runEnd = end;
    } else if (end > runEnd) {
      runEnd = end;
    }
  }
  if (runEnd > runStart) total += runEnd - runStart;
  return total;
}
var init_intervals = __esm({
  "src/intervals.ts"() {
    "use strict";
  }
});

// node_modules/diff/libesm/diff/base.js
var Diff;
var init_base = __esm({
  "node_modules/diff/libesm/diff/base.js"() {
    Diff = class {
      diff(oldStr, newStr, options = {}) {
        let callback;
        if (typeof options === "function") {
          callback = options;
          options = {};
        } else if ("callback" in options) {
          callback = options.callback;
        }
        const oldString = this.castInput(oldStr, options);
        const newString = this.castInput(newStr, options);
        const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
        const newTokens = this.removeEmpty(this.tokenize(newString, options));
        return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
      }
      diffWithOptionsObj(oldTokens, newTokens, options, callback) {
        var _a;
        const done = (value) => {
          value = this.postProcess(value, options);
          if (callback) {
            setTimeout(function() {
              callback(value);
            }, 0);
            return void 0;
          } else {
            return value;
          }
        };
        const newLen = newTokens.length, oldLen = oldTokens.length;
        let editLength = 1;
        let maxEditLength = newLen + oldLen;
        if (options.maxEditLength != null) {
          maxEditLength = Math.min(maxEditLength, options.maxEditLength);
        }
        const maxExecutionTime = (_a = options.timeout) !== null && _a !== void 0 ? _a : Infinity;
        const abortAfterTimestamp = Date.now() + maxExecutionTime;
        const bestPath = [{ oldPos: -1, lastComponent: void 0 }];
        let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
        if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
        }
        let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
        const execEditLength = () => {
          for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
            let basePath;
            const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
            if (removePath) {
              bestPath[diagonalPath - 1] = void 0;
            }
            let canAdd = false;
            if (addPath) {
              const addPathNewPos = addPath.oldPos - diagonalPath;
              canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
            }
            const canRemove = removePath && removePath.oldPos + 1 < oldLen;
            if (!canAdd && !canRemove) {
              bestPath[diagonalPath] = void 0;
              continue;
            }
            if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
              basePath = this.addToPath(addPath, true, false, 0, options);
            } else {
              basePath = this.addToPath(removePath, false, true, 1, options);
            }
            newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
            if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
              return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
            } else {
              bestPath[diagonalPath] = basePath;
              if (basePath.oldPos + 1 >= oldLen) {
                maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
              }
              if (newPos + 1 >= newLen) {
                minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
              }
            }
          }
          editLength++;
        };
        if (callback) {
          (function exec() {
            setTimeout(function() {
              if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
                return callback(void 0);
              }
              if (!execEditLength()) {
                exec();
              }
            }, 0);
          })();
        } else {
          while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
            const ret = execEditLength();
            if (ret) {
              return ret;
            }
          }
        }
      }
      addToPath(path, added, removed, oldPosInc, options) {
        const last = path.lastComponent;
        if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
          return {
            oldPos: path.oldPos + oldPosInc,
            lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
          };
        } else {
          return {
            oldPos: path.oldPos + oldPosInc,
            lastComponent: { count: 1, added, removed, previousComponent: last }
          };
        }
      }
      extractCommon(basePath, newTokens, oldTokens, diagonalPath, options) {
        const newLen = newTokens.length, oldLen = oldTokens.length;
        let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
        while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
          newPos++;
          oldPos++;
          commonCount++;
          if (options.oneChangePerToken) {
            basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
          }
        }
        if (commonCount && !options.oneChangePerToken) {
          basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
        }
        basePath.oldPos = oldPos;
        return newPos;
      }
      equals(left, right, options) {
        if (options.comparator) {
          return options.comparator(left, right);
        } else {
          return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
        }
      }
      removeEmpty(array) {
        const ret = [];
        for (let i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }
        return ret;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      castInput(value, options) {
        return value;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      tokenize(value, options) {
        return Array.from(value);
      }
      join(chars) {
        return chars.join("");
      }
      postProcess(changeObjects, options) {
        return changeObjects;
      }
      get useLongestToken() {
        return false;
      }
      buildValues(lastComponent, newTokens, oldTokens) {
        const components = [];
        let nextComponent;
        while (lastComponent) {
          components.push(lastComponent);
          nextComponent = lastComponent.previousComponent;
          delete lastComponent.previousComponent;
          lastComponent = nextComponent;
        }
        components.reverse();
        const componentLen = components.length;
        let componentPos = 0, newPos = 0, oldPos = 0;
        for (; componentPos < componentLen; componentPos++) {
          const component = components[componentPos];
          if (!component.removed) {
            if (!component.added && this.useLongestToken) {
              let value = newTokens.slice(newPos, newPos + component.count);
              value = value.map(function(value2, i) {
                const oldValue = oldTokens[oldPos + i];
                return oldValue.length > value2.length ? oldValue : value2;
              });
              component.value = this.join(value);
            } else {
              component.value = this.join(newTokens.slice(newPos, newPos + component.count));
            }
            newPos += component.count;
            if (!component.added) {
              oldPos += component.count;
            }
          } else {
            component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
            oldPos += component.count;
          }
        }
        return components;
      }
    };
  }
});

// node_modules/diff/libesm/util/string.js
function longestCommonPrefix(str1, str2) {
  let i;
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[i] != str2[i]) {
      return str1.slice(0, i);
    }
  }
  return str1.slice(0, i);
}
function longestCommonSuffix(str1, str2) {
  let i;
  if (!str1 || !str2 || str1[str1.length - 1] != str2[str2.length - 1]) {
    return "";
  }
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[str1.length - (i + 1)] != str2[str2.length - (i + 1)]) {
      return str1.slice(-i);
    }
  }
  return str1.slice(-i);
}
function replacePrefix(string, oldPrefix, newPrefix) {
  if (string.slice(0, oldPrefix.length) != oldPrefix) {
    throw Error(`string ${JSON.stringify(string)} doesn't start with prefix ${JSON.stringify(oldPrefix)}; this is a bug`);
  }
  return newPrefix + string.slice(oldPrefix.length);
}
function replaceSuffix(string, oldSuffix, newSuffix) {
  if (!oldSuffix) {
    return string + newSuffix;
  }
  if (string.slice(-oldSuffix.length) != oldSuffix) {
    throw Error(`string ${JSON.stringify(string)} doesn't end with suffix ${JSON.stringify(oldSuffix)}; this is a bug`);
  }
  return string.slice(0, -oldSuffix.length) + newSuffix;
}
function removePrefix(string, oldPrefix) {
  return replacePrefix(string, oldPrefix, "");
}
function removeSuffix(string, oldSuffix) {
  return replaceSuffix(string, oldSuffix, "");
}
function maximumOverlap(string1, string2) {
  return string2.slice(0, overlapCount(string1, string2));
}
function overlapCount(a, b) {
  let startA = 0;
  if (a.length > b.length) {
    startA = a.length - b.length;
  }
  let endB = b.length;
  if (a.length < b.length) {
    endB = a.length;
  }
  const map = Array(endB);
  let k = 0;
  map[0] = 0;
  for (let j = 1; j < endB; j++) {
    if (b[j] == b[k]) {
      map[j] = map[k];
    } else {
      map[j] = k;
    }
    while (k > 0 && b[j] != b[k]) {
      k = map[k];
    }
    if (b[j] == b[k]) {
      k++;
    }
  }
  k = 0;
  for (let i = startA; i < a.length; i++) {
    while (k > 0 && a[i] != b[k]) {
      k = map[k];
    }
    if (a[i] == b[k]) {
      k++;
    }
  }
  return k;
}
function segment2(string, segmenter) {
  const parts = [];
  for (const segmentObj of Array.from(segmenter.segment(string))) {
    const segment3 = segmentObj.segment;
    if (parts.length && /\s/.test(parts[parts.length - 1]) && /\s/.test(segment3)) {
      parts[parts.length - 1] += segment3;
    } else {
      parts.push(segment3);
    }
  }
  return parts;
}
function trailingWs(string, segmenter) {
  if (segmenter) {
    return leadingAndTrailingWs(string, segmenter)[1];
  }
  let i;
  for (i = string.length - 1; i >= 0; i--) {
    if (!string[i].match(/\s/)) {
      break;
    }
  }
  return string.substring(i + 1);
}
function leadingWs(string, segmenter) {
  if (segmenter) {
    return leadingAndTrailingWs(string, segmenter)[0];
  }
  const match = string.match(/^\s*/);
  return match ? match[0] : "";
}
function leadingAndTrailingWs(string, segmenter) {
  if (!segmenter) {
    return [leadingWs(string), trailingWs(string)];
  }
  if (segmenter.resolvedOptions().granularity != "word") {
    throw new Error('The segmenter passed must have a granularity of "word"');
  }
  const segments = segment2(string, segmenter);
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];
  const head = /\s/.test(firstSeg) ? firstSeg : "";
  const tail = /\s/.test(lastSeg) ? lastSeg : "";
  return [head, tail];
}
var init_string = __esm({
  "node_modules/diff/libesm/util/string.js"() {
  }
});

// node_modules/diff/libesm/diff/word.js
function diffWords(oldStr, newStr, options) {
  if ((options === null || options === void 0 ? void 0 : options.ignoreWhitespace) != null && !options.ignoreWhitespace) {
    return diffWordsWithSpace(oldStr, newStr, options);
  }
  return wordDiff.diff(oldStr, newStr, options);
}
function dedupeWhitespaceInChangeObjects(startKeep, deletion, insertion, endKeep, segmenter) {
  if (deletion && insertion) {
    const [oldWsPrefix, oldWsSuffix] = leadingAndTrailingWs(deletion.value, segmenter);
    const [newWsPrefix, newWsSuffix] = leadingAndTrailingWs(insertion.value, segmenter);
    if (startKeep) {
      const commonWsPrefix = longestCommonPrefix(oldWsPrefix, newWsPrefix);
      startKeep.value = replaceSuffix(startKeep.value, newWsPrefix, commonWsPrefix);
      deletion.value = removePrefix(deletion.value, commonWsPrefix);
      insertion.value = removePrefix(insertion.value, commonWsPrefix);
    }
    if (endKeep) {
      const commonWsSuffix = longestCommonSuffix(oldWsSuffix, newWsSuffix);
      endKeep.value = replacePrefix(endKeep.value, newWsSuffix, commonWsSuffix);
      deletion.value = removeSuffix(deletion.value, commonWsSuffix);
      insertion.value = removeSuffix(insertion.value, commonWsSuffix);
    }
  } else if (insertion) {
    if (startKeep) {
      const ws = leadingWs(insertion.value, segmenter);
      insertion.value = insertion.value.substring(ws.length);
    }
    if (endKeep) {
      const ws = leadingWs(endKeep.value, segmenter);
      endKeep.value = endKeep.value.substring(ws.length);
    }
  } else if (startKeep && endKeep) {
    const newWsFull = leadingWs(endKeep.value, segmenter), [delWsStart, delWsEnd] = leadingAndTrailingWs(deletion.value, segmenter);
    const newWsStart = longestCommonPrefix(newWsFull, delWsStart);
    deletion.value = removePrefix(deletion.value, newWsStart);
    const newWsEnd = longestCommonSuffix(removePrefix(newWsFull, newWsStart), delWsEnd);
    deletion.value = removeSuffix(deletion.value, newWsEnd);
    endKeep.value = replacePrefix(endKeep.value, newWsFull, newWsEnd);
    startKeep.value = replaceSuffix(startKeep.value, newWsFull, newWsFull.slice(0, newWsFull.length - newWsEnd.length));
  } else if (endKeep) {
    const endKeepWsPrefix = leadingWs(endKeep.value, segmenter);
    const deletionWsSuffix = trailingWs(deletion.value, segmenter);
    const overlap = maximumOverlap(deletionWsSuffix, endKeepWsPrefix);
    deletion.value = removeSuffix(deletion.value, overlap);
  } else if (startKeep) {
    const startKeepWsSuffix = trailingWs(startKeep.value, segmenter);
    const deletionWsPrefix = leadingWs(deletion.value, segmenter);
    const overlap = maximumOverlap(startKeepWsSuffix, deletionWsPrefix);
    deletion.value = removePrefix(deletion.value, overlap);
  }
}
function diffWordsWithSpace(oldStr, newStr, options) {
  return wordsWithSpaceDiff.diff(oldStr, newStr, options);
}
var extendedWordChars, tokenizeIncludingWhitespace, WordDiff, wordDiff, WordsWithSpaceDiff, wordsWithSpaceDiff;
var init_word = __esm({
  "node_modules/diff/libesm/diff/word.js"() {
    init_base();
    init_string();
    extendedWordChars = "a-zA-Z0-9_\\u{AD}\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}";
    tokenizeIncludingWhitespace = new RegExp(`[${extendedWordChars}]+|\\s+|[^${extendedWordChars}]`, "ug");
    WordDiff = class extends Diff {
      equals(left, right, options) {
        if (options.ignoreCase) {
          left = left.toLowerCase();
          right = right.toLowerCase();
        }
        return left.trim() === right.trim();
      }
      tokenize(value, options = {}) {
        let parts;
        if (options.intlSegmenter) {
          const segmenter = options.intlSegmenter;
          if (segmenter.resolvedOptions().granularity != "word") {
            throw new Error('The segmenter passed must have a granularity of "word"');
          }
          parts = segment2(value, segmenter);
        } else {
          parts = value.match(tokenizeIncludingWhitespace) || [];
        }
        const tokens2 = [];
        let prevPart = null;
        parts.forEach((part) => {
          if (/\s/.test(part)) {
            if (prevPart == null) {
              tokens2.push(part);
            } else {
              tokens2.push(tokens2.pop() + part);
            }
          } else if (prevPart != null && /\s/.test(prevPart)) {
            if (tokens2[tokens2.length - 1] == prevPart) {
              tokens2.push(tokens2.pop() + part);
            } else {
              tokens2.push(prevPart + part);
            }
          } else {
            tokens2.push(part);
          }
          prevPart = part;
        });
        return tokens2;
      }
      join(tokens2) {
        return tokens2.map((token, i) => {
          if (i == 0) {
            return token;
          } else {
            return token.replace(/^\s+/, "");
          }
        }).join("");
      }
      postProcess(changes, options) {
        if (!changes || options.oneChangePerToken) {
          return changes;
        }
        let lastKeep = null;
        let insertion = null;
        let deletion = null;
        changes.forEach((change) => {
          if (change.added) {
            insertion = change;
          } else if (change.removed) {
            deletion = change;
          } else {
            if (insertion || deletion) {
              dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change, options.intlSegmenter);
            }
            lastKeep = change;
            insertion = null;
            deletion = null;
          }
        });
        if (insertion || deletion) {
          dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null, options.intlSegmenter);
        }
        return changes;
      }
    };
    wordDiff = new WordDiff();
    WordsWithSpaceDiff = class extends Diff {
      tokenize(value) {
        const regex = new RegExp(`(\\r?\\n)|[${extendedWordChars}]+|[^\\S\\n\\r]+|[^${extendedWordChars}]`, "ug");
        return value.match(regex) || [];
      }
    };
    wordsWithSpaceDiff = new WordsWithSpaceDiff();
  }
});

// node_modules/diff/libesm/index.js
var init_libesm = __esm({
  "node_modules/diff/libesm/index.js"() {
    init_word();
  }
});

// src/stats.ts
function computeStats(files, generations, conversations, exclusions = []) {
  const byClass = Object.fromEntries(
    CLASSES.map((c) => [c, { spans: 0, chars: 0, pct: 0, pctOfFinal: 0 }])
  );
  let coveredChars = 0;
  let finalChars = 0;
  let uncertainSpans = 0;
  let trivialSpans = 0;
  const byModelChars = /* @__PURE__ */ new Map();
  const byConvChars = /* @__PURE__ */ new Map();
  const perFile = files.map((f) => {
    finalChars += f.text.length;
    const fileByClass = Object.fromEntries(CLASSES.map((c) => [c, 0]));
    let fileCovered = 0;
    for (const s of f.spans) {
      const chars = s.end - s.start;
      coveredChars += chars;
      fileCovered += chars;
      byClass[s.class].spans++;
      byClass[s.class].chars += chars;
      fileByClass[s.class] += chars;
      if (s.uncertain) uncertainSpans++;
      if (s.trivial) trivialSpans++;
      if (s.source) {
        byModelChars.set(s.source.model, (byModelChars.get(s.source.model) ?? 0) + chars);
        byConvChars.set(s.source.conversationId, (byConvChars.get(s.source.conversationId) ?? 0) + chars);
      }
    }
    return { path: f.path, coveredChars: fileCovered, byClass: fileByClass };
  });
  for (const c of CLASSES) {
    byClass[c].pct = coveredChars ? r32(byClass[c].chars / coveredChars) : 0;
    byClass[c].pctOfFinal = finalChars ? r32(byClass[c].chars / finalChars) : 0;
  }
  const classifiedPaths = new Set(files.map((f) => f.path));
  for (const x of exclusions) {
    if (classifiedPaths.has(x.path)) continue;
    perFile.push({
      path: x.path,
      coveredChars: 0,
      byClass: Object.fromEntries(CLASSES.map((c) => [c, 0])),
      excluded: x.reason
    });
  }
  const generatedTotal = generations.reduce((a, g) => a + g.totalChars, 0);
  const generatedWritten = generations.reduce((a, g) => a + g.charsWritten, 0);
  const generatedSeparators = generations.reduce((a, g) => a + g.separatorChars, 0);
  const generatedSurvived = generations.reduce((a, g) => a + g.survivedChars, 0);
  const verbatimClaimed = claimedChars(files, "survived_verbatim");
  const deletedCharsWhere = (p) => generations.reduce(
    (a, g) => a + g.spans.filter((s) => s.fate === "generated_deleted" && p(s.deletion?.cause)).reduce((b, s) => b + (s.end - s.start), 0),
    0
  );
  const mergeDeleted = deletedCharsWhere((c) => c === "merge");
  const unknownDeleted = deletedCharsWhere((c) => c === "unknown");
  const generatedDeleted = generatedTotal - generatedSurvived;
  const humanDeleted = generatedDeleted - mergeDeleted - unknownDeleted;
  const perConversation = conversations.map((conv) => {
    const convGens = generations.filter((g) => g.conversationId === conv.id);
    const generatedChars = convGens.reduce((a, g) => a + g.totalChars, 0);
    const survivedChars = convGens.reduce((a, g) => a + g.survivedChars, 0);
    const accepted = convGens.filter((g) => g.survivedChars > 0);
    return {
      conversationId: conv.id,
      title: conv.title,
      generations: convGens.length,
      generatedChars,
      survivedChars,
      survivalRate: generatedChars ? r32(survivedChars / generatedChars) : 0,
      turnsToAcceptance: accepted.length ? Math.max(...accepted.map((g) => g.turnIndex)) : null
    };
  });
  return {
    finalChars,
    coveredChars,
    byClass,
    uncertainSpans,
    trivialSpans,
    byModel: Object.fromEntries(
      [...byModelChars.entries()].map(([m, chars]) => [
        m,
        { chars, pctOfCovered: coveredChars ? r32(chars / coveredChars) : 0 }
      ])
    ),
    generated: {
      totalChars: generatedTotal,
      charsWritten: generatedWritten,
      separatorChars: generatedSeparators,
      verbatimClaimedChars: verbatimClaimed,
      survivedChars: generatedSurvived,
      deletedChars: generatedDeleted,
      deletedPct: generatedTotal ? r32(generatedDeleted / generatedTotal) : 0,
      humanDeletedChars: humanDeleted,
      humanDeletedPct: generatedTotal ? r32(humanDeleted / generatedTotal) : 0,
      mergeDeletedChars: mergeDeleted,
      unknownDeletedChars: unknownDeleted
    },
    perFile,
    perConversation
  };
}
function claimedChars(files, cls) {
  const byGen = /* @__PURE__ */ new Map();
  for (const f of files) {
    for (const s of f.spans) {
      if (s.class !== cls || !s.source) continue;
      const arr = byGen.get(s.source.generationIndex);
      if (arr) arr.push([s.source.start, s.source.end]);
      else byGen.set(s.source.generationIndex, [[s.source.start, s.source.end]]);
    }
  }
  let total = 0;
  for (const intervals of byGen.values()) total += mergedLength(intervals);
  return total;
}
var CLASSES, r32;
var init_stats = __esm({
  "src/stats.ts"() {
    "use strict";
    init_intervals();
    CLASSES = [
      "survived_verbatim",
      "survived_mutated",
      "no_generation_provenance"
    ];
    r32 = (x) => Math.round(x * 1e3) / 1e3;
  }
});

// src/resolve.ts
function resolve(input) {
  const gens = input.generations.map((g, i) => ({ ...g, generationIndex: i }));
  const preps = gens.map((gen) => {
    const mode = gen.filePath ? modeForPath(gen.filePath) : gen.kind === "assistant_text" ? "prose" : "code";
    const sentences = segment(gen.text, mode).map((s) => {
      const norm = normalize(s.text).norm;
      return { ...s, norm, tokenSet: new Set(tokens(norm)) };
    });
    return { gen, mode, norm: normalize(gen.text), sentences };
  });
  const tokenIndex = /* @__PURE__ */ new Map();
  for (const p of preps) {
    p.sentences.forEach((s, sIdx) => {
      for (const t of s.tokenSet) {
        let arr = tokenIndex.get(t);
        if (!arr) tokenIndex.set(t, arr = []);
        arr.push({ p, sIdx });
      }
    });
  }
  const verbatimClaims = /* @__PURE__ */ new Map();
  const mutatedClaims = /* @__PURE__ */ new Map();
  const addClaim = (m, c) => {
    let arr = m.get(c.genIndex);
    if (!arr) m.set(c.genIndex, arr = []);
    arr.push(c);
  };
  const srcPtr = (p, start, end) => ({
    conversationId: p.gen.conversationId,
    model: p.gen.model,
    turnIndex: p.gen.turnIndex,
    generationIndex: p.gen.generationIndex,
    start,
    end
  });
  const files = input.files.map((f) => {
    const mode = modeForPath(f.path);
    const spans = [];
    for (const s of segment(f.text, mode)) {
      const sNorm = normalize(s.text).norm;
      const base = { start: s.start, end: s.end, text: s.text };
      let span = null;
      if (sNorm.length >= MIN_VERBATIM_LEN) {
        for (const p of preps) {
          const idx = p.norm.norm.indexOf(sNorm);
          if (idx < 0) continue;
          const gStart = p.norm.map[idx];
          const gEnd = p.norm.map[idx + sNorm.length - 1] + 1;
          span = { ...base, class: "survived_verbatim", score: 1, source: srcPtr(p, gStart, gEnd) };
          addClaim(verbatimClaims, { genIndex: p.gen.generationIndex, start: gStart, end: gEnd });
          break;
        }
      } else if (sNorm.length > 0) {
        outer: for (const p of preps) {
          for (const g of p.sentences) {
            if (g.norm === sNorm) {
              span = { ...base, class: "survived_verbatim", score: 1, trivial: true, source: srcPtr(p, g.start, g.end) };
              addClaim(verbatimClaims, { genIndex: p.gen.generationIndex, start: g.start, end: g.end });
              break outer;
            }
          }
        }
      }
      if (!span && sNorm.length > 0) {
        const sTokens = tokens(sNorm);
        const seen = /* @__PURE__ */ new Set();
        const candidates = [];
        for (const t of new Set(sTokens)) {
          const bucket = tokenIndex.get(t);
          if (!bucket || bucket.length > MAX_TOKEN_DF) continue;
          for (const cand of bucket) {
            const key = cand.p.gen.generationIndex + ":" + cand.sIdx;
            if (seen.has(key)) continue;
            seen.add(key);
            const sent = cand.p.sentences[cand.sIdx];
            candidates.push({ p: cand.p, sent, cont: containment(sTokens, sent.tokenSet) });
          }
        }
        candidates.sort((a, b) => b.cont - a.cont);
        let best = null;
        for (const c of candidates.slice(0, FUZZY_TOP_K)) {
          const score = combinedScore(c.cont, levSimilarity(sNorm, c.sent.norm));
          if (!best || score > best.score) best = { p: c.p, sent: c.sent, score };
        }
        if (best && best.score >= THETA_HIGH) {
          const descent = input.corroborate?.(f.path, s.text);
          if (descent?.basis === "rival") {
            span = {
              ...base,
              class: "no_generation_provenance",
              uncertain: true,
              candidate: { score: r33(best.score), text: best.sent.text, source: srcPtr(best.p, best.sent.start, best.sent.end) },
              descent
            };
          } else {
            span = {
              ...base,
              class: "survived_mutated",
              score: r33(best.score),
              source: srcPtr(best.p, best.sent.start, best.sent.end),
              diff: diffWords(best.sent.text, s.text).map((d) => ({
                value: d.value,
                ...d.added ? { added: true } : {},
                ...d.removed ? { removed: true } : {}
              })),
              // `uncertain` is deliberately NOT set on an `unverified`
              // verdict. It is stats.uncertainSpans' own definition (a
              // below-threshold candidate awaiting adjudication) and that
              // count is O1 KR1.1's metric; widening it here would move
              // the KR's number without any span changing.
              ...descent ? { descent } : {}
            };
            addClaim(mutatedClaims, { genIndex: best.p.gen.generationIndex, start: best.sent.start, end: best.sent.end });
          }
        } else if (best && best.score >= THETA_LOW) {
          span = {
            ...base,
            class: "no_generation_provenance",
            uncertain: true,
            candidate: { score: r33(best.score), text: best.sent.text, source: srcPtr(best.p, best.sent.start, best.sent.end) }
          };
        }
      }
      spans.push(span ?? { ...base, class: "no_generation_provenance" });
    }
    return { path: f.path, mode, text: f.text, spans: mergeVerbatimRuns(spans, f.text) };
  });
  const overlaps = (claims, s) => !!claims && claims.some((c) => c.start < s.end && c.end > s.start);
  const attribute = input.attributeDeletion ?? (() => ({ cause: "human_edit" }));
  const generations = preps.map((p) => {
    const gi = p.gen.generationIndex;
    const spans = p.sentences.map((gs) => {
      const v = overlaps(verbatimClaims.get(gi), gs);
      const m = !v && overlaps(mutatedClaims.get(gi), gs);
      const fate = v ? "survived_verbatim" : m ? "survived_mutated" : "generated_deleted";
      const base = { start: gs.start, end: gs.end, text: gs.text, fate };
      if (fate !== "generated_deleted") return base;
      return { ...base, deletion: attribute(p.gen.filePath ?? "", gs.text) };
    });
    const totalChars = spans.reduce((a, s) => a + (s.end - s.start), 0);
    const survivedChars = spans.filter((s) => s.fate !== "generated_deleted").reduce((a, s) => a + (s.end - s.start), 0);
    return {
      ...p.gen,
      spans,
      totalChars,
      charsWritten: p.gen.text.length,
      separatorChars: p.gen.text.length - totalChars,
      survivedChars,
      survivalRate: totalChars ? r33(survivedChars / totalChars) : 0
    };
  });
  return {
    schemaVersion: "0.1.0",
    task: {
      id: input.taskId,
      finished: input.finished,
      generatedAt: input.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
    },
    artifact: input.artifact ?? { kind: "chat" },
    files,
    conversations: input.conversations,
    generations,
    stats: computeStats(files, generations, input.conversations, input.exclusions),
    // Spread rather than assigned so a caller that did not ask produces a
    // record with no `exclusions` key, instead of one with the key set to
    // undefined, which `JSON.stringify` drops and a schema check does not.
    ...input.exclusions ? { exclusions: input.exclusions } : {}
  };
}
function mergeVerbatimRuns(spans, text) {
  const out = [];
  for (const s of spans) {
    const prev = out[out.length - 1];
    if (prev && prev.class === "survived_verbatim" && s.class === "survived_verbatim" && prev.source && s.source && prev.source.generationIndex === s.source.generationIndex && s.source.start >= prev.source.end && s.source.start - prev.source.end <= 2 && /^\s*$/.test(text.slice(prev.end, s.start))) {
      prev.end = s.end;
      prev.text = text.slice(prev.start, prev.end);
      prev.source.end = s.source.end;
      if (!(prev.trivial && s.trivial)) delete prev.trivial;
      continue;
    }
    out.push({ ...s });
  }
  return out;
}
var r33;
var init_resolve = __esm({
  "src/resolve.ts"() {
    "use strict";
    init_libesm();
    init_normalize();
    init_segment();
    init_match();
    init_stats();
    r33 = (x) => Math.round(x * 1e3) / 1e3;
  }
});

// src/deploy.ts
function isPublicHost(host) {
  const bare = host.toLowerCase().replace(/\.$/, "");
  if (LOCAL_HOSTS.has(bare)) return false;
  if (bare.endsWith(".local") || bare.endsWith(".localhost")) return false;
  return true;
}
function urlFromHostname(raw) {
  const host = raw.trim().replace(/\.$/, "");
  if (!HOSTNAME.test(host) || !isPublicHost(host)) return null;
  return `https://${host.toLowerCase()}`;
}
function urlFromAbsolute(raw) {
  const value = raw.trim();
  if (!/^https?:\/\//i.test(value)) return null;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (!isPublicHost(parsed.hostname)) return null;
  return parsed.toString().replace(/\/$/, "");
}
function parseJson(text) {
  if (text === null) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}
function detectDeploy(read) {
  for (const path of CNAME_PATHS) {
    const text = read(path);
    if (text === null) continue;
    const first = text.split("\n").map((l) => l.trim()).filter(Boolean)[0];
    if (!first) continue;
    const url = urlFromHostname(first);
    if (url) return { url, evidence: `${path} (GitHub Pages custom domain)` };
  }
  const pkg = parseJson(read("package.json"));
  if (pkg && typeof pkg.homepage === "string") {
    const url = urlFromAbsolute(pkg.homepage);
    if (url) return { url, evidence: 'package.json "homepage"' };
  }
  const vercel = parseJson(read("vercel.json"));
  if (vercel) {
    const alias = vercel.alias;
    const first = typeof alias === "string" ? alias : Array.isArray(alias) && typeof alias[0] === "string" ? alias[0] : null;
    if (first) {
      const url = urlFromAbsolute(first) ?? urlFromHostname(first);
      if (url) return { url, evidence: 'vercel.json "alias"' };
    }
  }
  return null;
}
var CNAME_PATHS, HOSTNAME, LOCAL_HOSTS;
var init_deploy = __esm({
  "src/deploy.ts"() {
    "use strict";
    CNAME_PATHS = ["CNAME", "public/CNAME", "docs/CNAME", "static/CNAME"];
    HOSTNAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
    LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
  }
});

// src/deletion.ts
function unknown(reason, merge) {
  return {
    cause: "unknown",
    unknownReason: reason,
    mergeSha: merge.sha.slice(0, SHORT3),
    ...merge.subject ? { mergeSubject: merge.subject } : {}
  };
}
function gitDeletionAttributor(projectPath, merges, opts = {}) {
  const blind = opts.unreadableMerges ?? [];
  if (merges.length === 0 && blind.length === 0) return () => HUMAN;
  const blindFallback = blind.length > 0 ? unknown("unreadable_merge_commit", { sha: blind[0] }) : HUMAN;
  const lookups = /* @__PURE__ */ new Map();
  const read = (sha, path) => {
    const key = `${sha}:${path}`;
    let got = lookups.get(key);
    if (!got) {
      got = blobLookup(projectPath, sha, path);
      lookups.set(key, got);
    }
    return got;
  };
  const holds = (sha, path, needle) => {
    const got = read(sha, path);
    if (got.kind === "unreadable") return "unreadable";
    if (got.kind === "absent") return false;
    return normalize(got.text).norm.includes(needle);
  };
  return (filePath, spanText) => {
    const needle = normalize(spanText).norm;
    if (needle.length === 0) return HUMAN;
    let pending = null;
    for (const m of merges) {
      if (!m.paths.includes(filePath)) continue;
      const after = holds(m.sha, filePath, needle);
      if (after === true) continue;
      if (m.parents.length === 0) {
        pending ??= unknown("unreadable_merge_parents", m);
        continue;
      }
      const parentHolds = m.parents.map((p) => holds(p, filePath, needle));
      if (parentHolds.some((h) => h === true)) {
        if (after === "unreadable") {
          pending ??= unknown("unreadable_merge_result", m);
          continue;
        }
        return {
          cause: "merge",
          mergeSha: m.sha.slice(0, SHORT3),
          mergeSubject: m.subject
        };
      }
      if (parentHolds.some((h) => h === "unreadable")) {
        pending ??= unknown("unreadable_merge_parents", m);
        continue;
      }
    }
    return pending ?? blindFallback;
  };
}
var HUMAN, SHORT3;
var init_deletion = __esm({
  "src/deletion.ts"() {
    "use strict";
    init_pairfinder();
    init_normalize();
    HUMAN = { cause: "human_edit" };
    SHORT3 = 7;
  }
});

// src/resolve-episode.ts
function resolvablePaths(ep) {
  return ep.touchedFiles.filter(
    (path) => TEXT_EXTS.has((0, import_node_path3.extname)(path)) && !SKIP_FILES.has(path.split("/").pop() ?? "")
  );
}
function artifactFor(projectPath, ep) {
  const deploy = detectDeploy((path) => blobAt(projectPath, ep.finalSha, path));
  if (!deploy) return { artifact: { kind: "repo" }, deploy: null };
  return { artifact: { kind: "hosted", renderRef: deploy.url }, deploy };
}
function resolveEpisode(projectPath, ep, commits) {
  const files = [];
  const generations = [];
  const graph = commits ?? listCommits(projectPath);
  const candidates = resolvablePaths(ep);
  const vendored = ep.vendoredPaths ?? vendoredPaths(projectPath, ep, candidates, graph);
  const imported = new Set(vendored.map((v) => v.path));
  const exclusions = vendored.map((v) => ({
    path: v.path,
    reason: "imported_whole",
    sha: v.sha,
    subject: v.subject,
    relation: v.relation,
    chars: blobAt(projectPath, ep.finalSha, v.path)?.length ?? 0
  }));
  let turn = 0;
  for (const path of candidates) {
    if (imported.has(path)) continue;
    const genText = blobAt(projectPath, ep.generatedSha, path);
    const finText = blobAt(projectPath, ep.finalSha, path);
    if (genText === null || finText === null) continue;
    if (genText.length > MAX_BLOB_CHARS2 || finText.length > MAX_BLOB_CHARS2) continue;
    turn++;
    files.push({ path, text: finText });
    generations.push({
      conversationId: `git-${ep.generatedSha.slice(0, 7)}`,
      model: ep.agentMarker,
      turnIndex: turn,
      kind: "write",
      filePath: path,
      timestamp: ep.openedAt,
      text: genText
    });
  }
  if (files.length === 0 || generations.length === 0) {
    if (exclusions.length === 0) return null;
    return resolve({
      taskId: ep.id,
      files: [],
      conversations: [],
      generations: [],
      exclusions,
      finished: true,
      generatedAt: ep.closedAt,
      artifact: artifactFor(projectPath, ep).artifact
    });
  }
  return resolve({
    taskId: ep.id,
    files,
    exclusions,
    // A merge walked past on the way to ep.finalSha can have destroyed
    // generated text that no human ever chose to drop. Without this the
    // record would call that a discard and name ep.finalSha's author.
    // `unreadableMerges` carries the boundaries this clone cannot test at
    // all, so those deletions come back `unknown` instead of as a discard.
    attributeDeletion: gitDeletionAttributor(projectPath, ep.interveningMerges ?? [], {
      unreadableMerges: ep.unreadableMerges
    }),
    // A fuzzy match above THETA_HIGH says the final text resembles this
    // generation; `survived_mutated` says the person got there by editing
    // it. On the git path the two come apart whenever the text was already
    // in the file before the agent wrote (a generation here is the whole
    // blob) or came off a sibling branch. Without this the record ships a
    // word-level diff nobody performed.
    corroborate: gitDescentCorroborator(projectPath, ep.generatedSha, graph),
    conversations: [{
      id: `git-${ep.generatedSha.slice(0, 7)}`,
      title: ep.subject,
      adapter: "git",
      model: ep.agentMarker,
      date: ep.openedAt,
      turns: turn,
      userTurns: 0
    }],
    generations,
    finished: true,
    generatedAt: ep.closedAt,
    artifact: artifactFor(projectPath, ep).artifact
  });
}
var import_node_path3, TEXT_EXTS, SKIP_FILES, MAX_BLOB_CHARS2;
var init_resolve_episode = __esm({
  "src/resolve-episode.ts"() {
    "use strict";
    import_node_path3 = require("node:path");
    init_pairfinder();
    init_resolve();
    init_deploy();
    init_deletion();
    init_corroborate();
    init_vendored();
    TEXT_EXTS = /* @__PURE__ */ new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".css",
      ".scss",
      ".html",
      ".md",
      ".mdx",
      ".txt",
      ".tex",
      ".json",
      ".yml",
      ".yaml",
      ".toml",
      ".sql"
    ]);
    SKIP_FILES = /* @__PURE__ */ new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);
    MAX_BLOB_CHARS2 = 3e5;
  }
});

// src/tuning/revoke.ts
function forgetRecordInTuning(tuning, recordId, now = (/* @__PURE__ */ new Date()).toISOString()) {
  const axiomsDeleted = [];
  let evidenceStripped = 0;
  const axioms = [];
  for (const axiom of tuning.axioms) {
    const kept = axiom.evidence.filter((e) => e.recordId !== recordId);
    const dropped = axiom.evidence.length - kept.length;
    if (dropped === 0) {
      axioms.push(axiom);
      continue;
    }
    evidenceStripped += dropped;
    if (kept.length === 0) {
      axiomsDeleted.push(axiom.id);
      continue;
    }
    axioms.push({ ...axiom, evidence: kept, evidenceCount: kept.length, lastSeen: now });
  }
  const deleted = new Set(axiomsDeleted);
  const cleaned = axioms.map(
    (a) => a.contradicts.some((c) => deleted.has(c)) ? { ...a, contradicts: a.contradicts.filter((c) => !deleted.has(c)) } : a
  );
  const sources = tuning.sources.filter((s) => s.recordId !== recordId);
  return {
    tuning: { ...tuning, updatedAt: now, sources, axioms: cleaned },
    axiomsDeleted,
    evidenceStripped,
    sourcesRemoved: tuning.sources.length - sources.length
  };
}
function revokeAxiom(tuningPath, unitId, now = (/* @__PURE__ */ new Date()).toISOString()) {
  if (!(0, import_node_fs2.existsSync)(tuningPath)) throw new Error(`No tuning record at ${tuningPath}`);
  const tuning = JSON.parse((0, import_node_fs2.readFileSync)(tuningPath, "utf8"));
  const target = tuning.axioms.find((a) => a.id === unitId);
  if (!target) {
    throw new Error(
      `No axiom ${unitId} in ${tuningPath} (present: ${tuning.axioms.map((a) => a.id).join(", ") || "none"})`
    );
  }
  const updated = {
    ...tuning,
    updatedAt: now,
    axioms: tuning.axioms.map(
      (a) => a.id === unitId ? { ...a, status: "revoked", lastSeen: now } : a
    )
  };
  (0, import_node_fs2.writeFileSync)(tuningPath, JSON.stringify(updated, null, 2) + "\n");
  return updated;
}
var import_node_fs2;
var init_revoke = __esm({
  "src/tuning/revoke.ts"() {
    "use strict";
    import_node_fs2 = require("node:fs");
  }
});

// src/consent.ts
var consent_exports = {};
__export(consent_exports, {
  SCOPES: () => SCOPES,
  consentPath: () => consentPath,
  forget: () => forget,
  grantScope: () => grantScope,
  isForgotten: () => isForgotten,
  isGranted: () => isGranted,
  loadConsent: () => loadConsent,
  revokeScope: () => revokeScope,
  saveConsent: () => saveConsent,
  tuningPathFor: () => tuningPathFor,
  withheldByDefault: () => withheldByDefault
});
function consentPath(projectRoot) {
  return (0, import_node_path4.join)(ursaDir(projectRoot), "consent.json");
}
function tuningPathFor(projectRoot) {
  return (0, import_node_path4.join)(ursaDir(projectRoot), "tuning.json");
}
function withheldByDefault(now = (/* @__PURE__ */ new Date()).toISOString()) {
  return {
    schemaVersion: "0.1.0",
    updatedAt: now,
    scopes: { "minor-aggregate": { state: "withheld", changedAt: null, history: [] } },
    forgotten: []
  };
}
function coerceScope(raw) {
  const o = raw ?? {};
  const state = o.state === "granted" ? "granted" : "withheld";
  return {
    state,
    changedAt: typeof o.changedAt === "string" ? o.changedAt : null,
    history: Array.isArray(o.history) ? o.history : []
  };
}
function loadConsent(projectRoot) {
  const path = consentPath(projectRoot);
  if (!(0, import_node_fs3.existsSync)(path)) return withheldByDefault();
  let parsed;
  try {
    parsed = JSON.parse((0, import_node_fs3.readFileSync)(path, "utf8"));
  } catch {
    return withheldByDefault();
  }
  if (parsed === null || typeof parsed !== "object") return withheldByDefault();
  const o = parsed;
  const scopes = o.scopes ?? {};
  return {
    schemaVersion: "0.1.0",
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : (/* @__PURE__ */ new Date()).toISOString(),
    scopes: { "minor-aggregate": coerceScope(scopes["minor-aggregate"]) },
    forgotten: Array.isArray(o.forgotten) ? o.forgotten : []
  };
}
function saveConsent(projectRoot, consent) {
  (0, import_node_fs3.mkdirSync)(ursaDir(projectRoot), { recursive: true });
  const path = consentPath(projectRoot);
  (0, import_node_fs3.writeFileSync)(path, JSON.stringify(consent, null, 2) + "\n");
  return path;
}
function isGranted(consent, scope) {
  return consent.scopes[scope]?.state === "granted";
}
function isForgotten(consent, recordId) {
  return consent.forgotten.some((t) => t.recordId === recordId);
}
function setState(projectRoot, scope, to, by, now) {
  const consent = loadConsent(projectRoot);
  const current = consent.scopes[scope];
  const next = {
    state: to,
    changedAt: now,
    history: [...current.history, { at: now, from: current.state, to, by }]
  };
  const updated = { ...consent, updatedAt: now, scopes: { ...consent.scopes, [scope]: next } };
  saveConsent(projectRoot, updated);
  return updated;
}
function grantScope(projectRoot, scope, by, now = (/* @__PURE__ */ new Date()).toISOString()) {
  return setState(projectRoot, scope, "granted", by, now);
}
function revokeScope(projectRoot, scope, by, now = (/* @__PURE__ */ new Date()).toISOString()) {
  return setState(projectRoot, scope, "withheld", by, now);
}
function forget(projectRoot, recordId, now = (/* @__PURE__ */ new Date()).toISOString()) {
  const recordFile = (0, import_node_path4.join)(ursaDir(projectRoot), "records", `${recordId}.json`);
  const hadFile = (0, import_node_fs3.existsSync)(recordFile);
  if (hadFile) (0, import_node_fs3.rmSync)(recordFile);
  let axiomsDeleted = [];
  let evidenceStripped = 0;
  let sourcesRemoved = 0;
  const tPath = tuningPathFor(projectRoot);
  if ((0, import_node_fs3.existsSync)(tPath)) {
    const tuning = JSON.parse((0, import_node_fs3.readFileSync)(tPath, "utf8"));
    const result = forgetRecordInTuning(tuning, recordId, now);
    (0, import_node_fs3.writeFileSync)(tPath, JSON.stringify(result.tuning, null, 2) + "\n");
    axiomsDeleted = result.axiomsDeleted;
    evidenceStripped = result.evidenceStripped;
    sourcesRemoved = result.sourcesRemoved;
  }
  const tombstone = {
    recordId,
    forgottenAt: now,
    removed: { recordFile: hadFile, axiomsDeleted, evidenceStripped, sourcesRemoved }
  };
  const consent = loadConsent(projectRoot);
  saveConsent(projectRoot, {
    ...consent,
    updatedAt: now,
    forgotten: [...consent.forgotten.filter((t) => t.recordId !== recordId), tombstone]
  });
  return tombstone;
}
var import_node_fs3, import_node_path4, SCOPES;
var init_consent = __esm({
  "src/consent.ts"() {
    "use strict";
    import_node_fs3 = require("node:fs");
    import_node_path4 = require("node:path");
    init_revoke();
    init_store();
    SCOPES = ["minor-aggregate"];
  }
});

// src/disclosure.ts
function domainOf(path) {
  if (!path) return "other";
  const i = path.lastIndexOf(".");
  if (i < 0) return "other";
  return EXT_TO_BUCKET[path.slice(i).toLowerCase()] ?? "other";
}
function modelIdOf(raw) {
  if (!raw) return null;
  const hay = raw.toLowerCase();
  for (const candidate of MODEL_BY_LENGTH) {
    if (hay.includes(candidate)) return candidate;
  }
  return null;
}
function weekStartOf(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "1970-01-01";
  const day = d.getUTCDay();
  const back = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back));
  return monday.toISOString().slice(0, 10);
}
function round4(n2) {
  return Math.round(n2 * 1e4) / 1e4;
}
function genTimestamp(gen, record) {
  return gen.timestamp ?? record.task.generatedAt;
}
function projectForMinor(records, consent, scope = "minor-aggregate") {
  const withheld = [];
  if (!isGranted(consent, scope)) {
    return {
      batch: null,
      withheld: [{
        kind: "scope-not-granted",
        scope,
        detail: `consent for ${scope} reads "${consent.scopes[scope]?.state ?? "withheld"}"; nothing is disclosable`
      }]
    };
  }
  const buckets = /* @__PURE__ */ new Map();
  const keyOf = (d, m, w) => `${d}\0${m}\0${w}`;
  const rejectedModels = /* @__PURE__ */ new Set();
  for (const record of records) {
    if (isForgotten(consent, record.task.id)) {
      withheld.push({
        kind: "record-forgotten",
        recordId: record.task.id,
        detail: "tombstoned by `ursa forget`; excluded before any aggregation"
      });
      continue;
    }
    for (const gen of record.generations) {
      const model = modelIdOf(gen.model);
      if (!model) {
        if (!rejectedModels.has(`${record.task.id}\0${gen.model}`)) {
          rejectedModels.add(`${record.task.id}\0${gen.model}`);
          withheld.push({
            kind: "model-id-rejected",
            recordId: record.task.id,
            detail: "the captured agent marker matches no member of MODEL_VOCABULARY, so its generations are withheld rather than disclosed under a guessed label"
          });
        }
        continue;
      }
      const key = keyOf(domainOf(gen.filePath), model, weekStartOf(genTimestamp(gen, record)));
      const b = buckets.get(key) ?? { survived: 0, total: 0, generations: 0 };
      b.survived += gen.survivedChars;
      b.total += gen.totalChars;
      b.generations += 1;
      buckets.set(key, b);
    }
  }
  const rows = [...buckets.entries()].map(([key, b]) => {
    const [domain, model, weekStart] = key.split("\0");
    return {
      domain,
      model,
      weekStart,
      contributorCount: 1,
      survivalScalar: b.total > 0 ? round4(b.survived / b.total) : 0,
      sampleGenerations: b.generations
    };
  }).sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.domain.localeCompare(b.domain) || a.model.localeCompare(b.model));
  return { batch: { schemaVersion: "0.1.0", scope, rows }, withheld };
}
function isPermittedString(value) {
  if (value === "0.1.0") return true;
  if (value === "minor-aggregate") return true;
  if (DOMAIN_SET.has(value)) return true;
  if (MODEL_SET.has(value)) return true;
  return ISO_DATE.test(value);
}
function rawStringsOf(record) {
  const out = [];
  for (const f of record.files) {
    out.push(f.path, f.text);
    for (const s of f.spans) {
      out.push(s.text);
      if (s.candidate) out.push(s.candidate.text);
      for (const d of s.diff ?? []) out.push(d.value);
    }
  }
  for (const g of record.generations) {
    out.push(g.text);
    if (g.filePath) out.push(g.filePath);
    for (const s of g.spans) out.push(s.text);
  }
  for (const c of record.conversations) {
    out.push(c.title);
    if (c.source) out.push(c.source);
    for (const p of c.prompts ?? []) out.push(p.text);
  }
  for (const l of record.signals?.correctionLoops ?? []) {
    out.push(l.theme, l.discoveredSpec, ...l.targetFiles);
  }
  for (const t of record.signals?.feedbackTranslations ?? []) out.push(t.complaint, t.mechanism);
  for (const r of record.signals?.regressions ?? []) out.push(r.brokenState, r.evidence);
  for (const c of record.signals?.oneShotCorrections ?? []) out.push(c.text);
  for (const g of record.signals?.defensiveGuardrails ?? []) out.push(g.text);
  return out.filter((s) => typeof s === "string" && s.length > 0);
}
function normalize2(s) {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}
function shinglesOf(text, width = SHINGLE_CHARS) {
  const n2 = normalize2(text);
  const out = /* @__PURE__ */ new Set();
  for (let i = 0; i + width <= n2.length; i++) out.add(n2.slice(i, i + width));
  return out;
}
function auditBatch(batch, records, shingleChars = SHINGLE_CHARS) {
  const findings = [];
  const leafStrings = [];
  const walk = (node, path) => {
    if (typeof node === "number" || typeof node === "boolean" || node === null) return;
    if (typeof node === "string") {
      leafStrings.push(node);
      if (!isPermittedString(node)) {
        findings.push({
          kind: "unpermitted-string",
          path,
          detail: `string value is outside the declared vocabulary: ${JSON.stringify(node.slice(0, 60))}`
        });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        const child = path ? `${path}.${k}` : k;
        if (!PERMITTED_KEYS.has(k)) {
          findings.push({ kind: "unpermitted-key", path: child, detail: `key "${k}" is not a permitted field` });
        }
        walk(v, child);
      }
      return;
    }
  };
  walk(batch, "");
  const separator = "\0".repeat(shingleChars);
  const payload = leafStrings.map(normalize2).join(separator);
  const payloadShingles = shinglesOf(payload, shingleChars);
  if (payloadShingles.size > 0) {
    for (const record of records) {
      for (const raw of rawStringsOf(record)) {
        for (const sh of shinglesOf(raw, shingleChars)) {
          if (payloadShingles.has(sh)) {
            findings.push({
              kind: "raw-text-shingle",
              path: `record:${record.task.id}`,
              detail: `a ${shingleChars}-char window of this record's raw text appears in the payload: ${JSON.stringify(sh)}`
            });
            break;
          }
        }
      }
    }
  }
  return findings;
}
var DOMAIN_BUCKETS, EXT_TO_BUCKET, MODEL_VOCABULARY, MODEL_BY_LENGTH, ISO_DATE, SHINGLE_CHARS, PERMITTED_KEYS, DOMAIN_SET, MODEL_SET;
var init_disclosure = __esm({
  "src/disclosure.ts"() {
    "use strict";
    init_consent();
    DOMAIN_BUCKETS = [
      "code/typescript",
      "code/javascript",
      "code/python",
      "code/web",
      "code/config",
      "code/sql",
      "prose/markdown",
      "prose/text",
      "prose/latex",
      "other"
    ];
    EXT_TO_BUCKET = {
      ".ts": "code/typescript",
      ".tsx": "code/typescript",
      ".js": "code/javascript",
      ".jsx": "code/javascript",
      ".mjs": "code/javascript",
      ".py": "code/python",
      ".css": "code/web",
      ".scss": "code/web",
      ".html": "code/web",
      ".json": "code/config",
      ".yml": "code/config",
      ".yaml": "code/config",
      ".toml": "code/config",
      ".sql": "code/sql",
      ".md": "prose/markdown",
      ".mdx": "prose/markdown",
      ".txt": "prose/text",
      ".tex": "prose/latex"
    };
    MODEL_VOCABULARY = [
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5",
      "claude-opus-4",
      "claude-sonnet-4",
      "claude",
      "gpt-5-codex",
      "gpt-5",
      "gpt-4",
      "codex",
      "gpt",
      "gemini-3-pro",
      "gemini",
      "grok",
      "llama",
      "mistral",
      "deepseek",
      "qwen",
      "copilot",
      "cursor",
      "aider",
      "devin"
    ];
    MODEL_BY_LENGTH = [...MODEL_VOCABULARY].sort((a, b) => b.length - a.length);
    ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
    SHINGLE_CHARS = 16;
    PERMITTED_KEYS = /* @__PURE__ */ new Set([
      "schemaVersion",
      "scope",
      "rows",
      "domain",
      "model",
      "weekStart",
      "contributorCount",
      "survivalScalar",
      "sampleGenerations"
    ]);
    DOMAIN_SET = new Set(DOMAIN_BUCKETS);
    MODEL_SET = new Set(MODEL_VOCABULARY);
  }
});

// src/consent.cli.ts
var consent_cli_exports = {};
__export(consent_cli_exports, {
  loadRecords: () => loadRecords,
  runConsentCommand: () => runConsentCommand,
  runForgetCommand: () => runForgetCommand
});
function loadRecords(projectRoot) {
  const dir = (0, import_node_path5.join)(ursaDir(projectRoot), "records");
  if (!(0, import_node_fs4.existsSync)(dir)) return [];
  return (0, import_node_fs4.readdirSync)(dir).filter((n2) => n2.endsWith(".json")).sort().map((n2) => JSON.parse((0, import_node_fs4.readFileSync)((0, import_node_path5.join)(dir, n2), "utf8")));
}
function flag(argv, name) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : void 0;
}
function scopeFrom(argv, io) {
  const raw = flag(argv, "scope") ?? "minor-aggregate";
  if (!SCOPES.includes(raw)) {
    io.err(`Unknown scope "${raw}". Scopes that exist: ${SCOPES.join(", ")}`);
    return null;
  }
  return raw;
}
function describe(consent, projectRoot, io) {
  io.out(`Consent for ${projectRoot}`);
  io.out("");
  for (const scope of SCOPES) {
    const s = consent.scopes[scope];
    const when = s.changedAt ? ` since ${s.changedAt}` : " (never changed from the default)";
    io.out(`  ${scope}: ${s.state}${when}`);
    for (const h of s.history.slice(-5)) {
      io.out(`      ${h.at}  ${h.from} to ${h.to}  via ${h.by}`);
    }
  }
  io.out("");
  const records = loadRecords(projectRoot);
  io.out(`  ${records.length} record${records.length === 1 ? "" : "s"} on disk, all of them local.`);
  const tPath = tuningPathFor(projectRoot);
  if ((0, import_node_fs4.existsSync)(tPath)) {
    const tuning = JSON.parse((0, import_node_fs4.readFileSync)(tPath, "utf8"));
    const active = tuning.axioms.filter((a) => a.status !== "revoked");
    io.out(`  ${tuning.axioms.length} inferences, ${active.length} active and ${tuning.axioms.length - active.length} revoked.`);
    for (const a of active) {
      io.out(`      ${a.id}  ${a.polarity}: ${a.statement}  (${a.domain}, x${a.evidenceCount})`);
    }
  } else {
    io.out("  No inferences yet. Nothing has been derived about you.");
  }
  if (consent.forgotten.length > 0) {
    io.out("");
    io.out(`  ${consent.forgotten.length} record${consent.forgotten.length === 1 ? "" : "s"} erased, and they stay erased:`);
    for (const t of consent.forgotten) {
      io.out(`      ${t.recordId}  at ${t.forgottenAt}  ${t.removed.axiomsDeleted.length} inferences deleted, ${t.removed.evidenceStripped} evidence entries stripped`);
    }
  }
  io.out("");
  io.out(isGranted(consent, "minor-aggregate") ? "Aggregate survival numbers may leave this machine. Your work, your prompts and your corrections may not, and `ursa consent disclose` proves it before it writes anything." : "Nothing may leave this machine. Run `ursa consent grant` to allow aggregate survival numbers to, and nothing else ever.");
}
async function runConsentCommand(argv, io = stdio) {
  const [sub, project, ...rest] = argv;
  if (!sub || !project) {
    io.err("Usage: ursa consent show|grant|revoke|disclose|revoke-axiom <project> [options]");
    return 2;
  }
  const projectRoot = (0, import_node_path5.resolve)(project);
  if (sub === "show") {
    describe(loadConsent(projectRoot), projectRoot, io);
    return 0;
  }
  if (sub === "grant" || sub === "revoke") {
    const scope = scopeFrom(rest, io);
    if (!scope) return 2;
    const by = `ursa consent ${sub} --scope ${scope}`;
    const consent = sub === "grant" ? grantScope(projectRoot, scope, by) : revokeScope(projectRoot, scope, by);
    io.out(`${scope} is now ${consent.scopes[scope].state}.`);
    io.out(sub === "grant" ? "From here, `ursa consent disclose` can emit aggregate survival numbers. It still refuses to write a file that carries any of your text." : "Nothing may leave this machine. Anything already sent is outside this file's reach, so revoking here is a stop, not an undo. Deletion of what was sent is a request to the aggregation layer.");
    return 0;
  }
  if (sub === "revoke-axiom") {
    const axiom = flag(rest, "axiom");
    if (!axiom) {
      io.err("revoke-axiom needs --axiom <id>, for example --axiom ax-003");
      return 2;
    }
    const tPath = tuningPathFor(projectRoot);
    try {
      const tuning = revokeAxiom(tPath, axiom);
      const target = tuning.axioms.find((a) => a.id === axiom);
      io.out(`Revoked ${axiom}: "${target.statement}"`);
      io.out("It is kept as a tombstone so a later distillation cannot bring it back, and it is excluded from every export and from the overlay.");
      return 0;
    } catch (e) {
      io.err(e.message);
      return 1;
    }
  }
  if (sub === "disclose") {
    const consent = loadConsent(projectRoot);
    const records = loadRecords(projectRoot);
    const { batch, withheld } = projectForMinor(records, consent);
    for (const w of withheld) io.out(`withheld: ${w.kind} \u2014 ${w.detail}`);
    if (!batch) {
      io.out("Nothing disclosed, because nothing is consented. This is the default state and it is not an error.");
      return 0;
    }
    const findings = auditBatch(batch, records);
    if (findings.length > 0) {
      io.err(`The audit found ${findings.length} problem${findings.length === 1 ? "" : "s"} in the payload, so nothing was written.`);
      for (const f of findings.slice(0, 20)) io.err(`  ${f.kind} at ${f.path}: ${f.detail}`);
      return 1;
    }
    const out = flag(rest, "out");
    const json = JSON.stringify(batch, null, 2) + "\n";
    if (out) {
      (0, import_node_fs4.writeFileSync)(out, json);
      io.out(`${batch.rows.length} aggregate row${batch.rows.length === 1 ? "" : "s"} written to ${out}. The audit passed: no key, no string and no fragment of your text is in that file.`);
    } else {
      io.out(json);
    }
    return 0;
  }
  io.err(`Unknown subcommand "${sub}". Try show, grant, revoke, disclose or revoke-axiom.`);
  return 2;
}
async function runForgetCommand(argv, io = stdio) {
  const [project, ...rest] = argv;
  const recordId = flag(rest, "record");
  if (!project || !recordId) {
    io.err("Usage: ursa forget <project> --record <recordId>");
    return 2;
  }
  const projectRoot = (0, import_node_path5.resolve)(project);
  const t = forget(projectRoot, recordId);
  if (!t.removed.recordFile && t.removed.axiomsDeleted.length === 0 && t.removed.evidenceStripped === 0) {
    io.out(`No record ${recordId} was on disk and nothing was derived from it. It is tombstoned anyway, so re-running \`ursa run\` will not create it.`);
    return 0;
  }
  io.out(`Erased ${recordId}.`);
  if (t.removed.recordFile) io.out("  The record file is gone.");
  if (t.removed.axiomsDeleted.length > 0) {
    io.out(`  ${t.removed.axiomsDeleted.length} inference${t.removed.axiomsDeleted.length === 1 ? "" : "s"} deleted outright, because this record was the only evidence for them: ${t.removed.axiomsDeleted.join(", ")}`);
  }
  if (t.removed.evidenceStripped > 0) {
    io.out(`  ${t.removed.evidenceStripped} evidence entr${t.removed.evidenceStripped === 1 ? "y" : "ies"} stripped from inferences that still rest on other records.`);
  }
  if (t.removed.sourcesRemoved > 0) io.out("  It is no longer listed as a source of your tuning.");
  io.out("  Its id is tombstoned, so `ursa run` will not rebuild it from the git history it came from.");
  return 0;
}
var import_node_fs4, import_node_path5, stdio;
var init_consent_cli = __esm({
  "src/consent.cli.ts"() {
    "use strict";
    import_node_fs4 = require("node:fs");
    import_node_path5 = require("node:path");
    init_store();
    init_consent();
    init_disclosure();
    init_revoke();
    stdio = { out: (l) => console.log(l), err: (l) => console.error(l) };
  }
});

// src/tuning/distill.ts
function buildDistillPrompt(record, tuning) {
  const s = record.signals;
  if (!s) throw new Error("Record has no signals block; nothing to distill from");
  const existing = tuning.axioms.filter((a) => a.status !== "revoked").map((a) => ({ id: a.id, statement: a.statement, domain: a.domain, polarity: a.polarity }));
  const revoked = tuning.axioms.filter((a) => a.status === "revoked").map((a) => ({ id: a.id, statement: a.statement }));
  const prompts = record.conversations.flatMap(
    (c) => (c.prompts ?? []).map((p) => ({ step: p.step, text: p.text }))
  );
  return [
    "You are the interpretation pass of a preference-distillation pipeline.",
    "Below is machine-extracted evidence of how one user corrected an AI",
    "assistant during a real finished piece of work: correction loops with",
    "the spec the user could not state in advance, complaint-to-mechanism",
    "translations, regressions, defensive guardrails, and one-shot",
    "corrections, plus the user's verbatim prompts.",
    "",
    "Your task: reverse-engineer the WHYS. State the user's underlying",
    "preferences as short portable rules (axioms) a different AI could",
    "follow from its first message. Rules for your output:",
    "- Every axiom MUST cite the evidence entries that ground it. Never",
    "  invent an axiom no signal supports.",
    '- Prefer the general why over the incident (not "polaris star label',
    '  was removed" but "no explanatory labels on visual elements").',
    '- basis is "stated" only if the user said the rule in words;',
    '  "tacit" if the artifact revealed it; "mixed" if both.',
    "- If an axiom restates an EXISTING axiom below, set matchesExisting",
    "  to that id instead of rewording it into a duplicate.",
    "- Never resurrect a REVOKED axiom: if the evidence points at one,",
    "  drop it.",
    "- If two axioms genuinely conflict (stated preference vs revealed",
    "  behavior), emit both and list each in the other's contradicts.",
    "- 3 to 12 axioms. Quality over count.",
    "- EPISODE.accepted is the owner's own verdict on the finished work.",
    "  false means the owner declared the result unsatisfying: text that",
    "  survived unedited is NOT endorsed, only not yet fixed. Derive axioms",
    "  from the corrections (what the owner changed and the direction of",
    "  the change), never from what was left alone. null means no verdict",
    "  was given; treat survival as weak evidence at most. Only true means",
    "  survived text may count as accepted.",
    "",
    "Return ONLY a JSON object, no markdown fences, matching:",
    '{"axioms": [{"statement": string, "domain": string, "polarity":',
    '"prefer"|"avoid", "basis": "stated"|"tacit"|"mixed",',
    '"matchesExisting": string|null, "contradicts": string[],',
    '"evidence": [{"kind": "correction-loop"|"feedback-translation"|',
    '"regression"|"defensive-guardrail"|"one-shot-correction"|"episode",',
    '"ref": string, "steps": number[], "quote": string (optional,',
    "verbatim user words)}]}]}",
    "",
    `EXISTING AXIOMS: ${JSON.stringify(existing)}`,
    `REVOKED AXIOMS (do not resurrect): ${JSON.stringify(revoked)}`,
    "",
    `EPISODE: ${JSON.stringify(s.episode)}`,
    `CORRECTION LOOPS: ${JSON.stringify(s.correctionLoops)}`,
    `FEEDBACK TRANSLATIONS: ${JSON.stringify(s.feedbackTranslations)}`,
    `REGRESSIONS: ${JSON.stringify(s.regressions)}`,
    `DEFENSIVE GUARDRAILS: ${JSON.stringify(s.defensiveGuardrails)}`,
    `ONE-SHOT CORRECTIONS: ${JSON.stringify(s.oneShotCorrections)}`,
    "",
    `USER PROMPTS (step, text): ${JSON.stringify(prompts)}`
  ].join("\n");
}
function parseDistillOutput(raw) {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  if (start > 0) text = text.slice(start);
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.axioms)) throw new Error("Distill output has no axioms array");
  for (const a of parsed.axioms) validateAxiom(a);
  return parsed;
}
function validateAxiom(a) {
  if (!a.statement || typeof a.statement !== "string") throw new Error("Axiom missing statement");
  if (!["prefer", "avoid"].includes(a.polarity)) throw new Error(`Bad polarity on "${a.statement}"`);
  if (!["stated", "tacit", "mixed"].includes(a.basis)) throw new Error(`Bad basis on "${a.statement}"`);
  if (!Array.isArray(a.evidence) || a.evidence.length === 0) {
    throw new Error(`Axiom without evidence rejected: "${a.statement}"`);
  }
  for (const e of a.evidence) {
    if (!VALID_KINDS.has(e.kind)) throw new Error(`Bad evidence kind "${e.kind}" on "${a.statement}"`);
    if (!Array.isArray(e.steps)) throw new Error(`Evidence without steps on "${a.statement}"`);
  }
}
function distill(record, tuning, model, runner = claudeRunner) {
  const prompt = buildDistillPrompt(record, tuning);
  return parseDistillOutput(runner(prompt, model));
}
var import_node_child_process4, VALID_KINDS, claudeRunner;
var init_distill = __esm({
  "src/tuning/distill.ts"() {
    "use strict";
    import_node_child_process4 = require("node:child_process");
    VALID_KINDS = /* @__PURE__ */ new Set([
      "correction-loop",
      "feedback-translation",
      "regression",
      "defensive-guardrail",
      "one-shot-correction",
      "episode"
    ]);
    claudeRunner = (prompt, model) => {
      const out = (0, import_node_child_process4.execFileSync)("claude", ["-p", "--model", model, "--output-format", "json"], {
        input: prompt,
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
        timeout: 3e5
      });
      const envelope = JSON.parse(out);
      if (envelope.is_error || typeof envelope.result !== "string") {
        throw new Error("claude -p returned an error envelope");
      }
      return envelope.result;
    };
  }
});

// src/tuning/merge.ts
function axiomId(existing) {
  let n2 = existing.length + 1;
  const taken = new Set(existing.map((a) => a.id));
  while (taken.has(`ax-${String(n2).padStart(3, "0")}`)) n2++;
  return `ax-${String(n2).padStart(3, "0")}`;
}
function emptyTuning(owner) {
  return {
    schemaVersion: "0.1.0",
    owner,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    sources: [],
    axioms: []
  };
}
function mergeDistill(tuning, output, record, model, now = (/* @__PURE__ */ new Date()).toISOString()) {
  const recordId = record.task.id;
  const axioms = tuning.axioms.map((a) => ({ ...a, evidence: [...a.evidence], contradicts: [...a.contradicts] }));
  const byId = new Map(axioms.map((a) => [a.id, a]));
  const newIdsByStatement = /* @__PURE__ */ new Map();
  for (const d of output.axioms) {
    const evidence = d.evidence.map((e) => ({ ...e, recordId }));
    const match = d.matchesExisting ? byId.get(d.matchesExisting) : void 0;
    if (d.matchesExisting && !match) {
      throw new Error(`Distill referenced unknown axiom id ${d.matchesExisting}`);
    }
    if (match) {
      if (match.status === "revoked") continue;
      if (match.status !== "user-edited") {
        if (match.basis !== d.basis) match.basis = "mixed";
      }
      match.evidence.push(...evidence);
      match.evidenceCount = match.evidence.length;
      match.lastSeen = now;
    } else {
      const id = axiomId(axioms);
      const created = {
        id,
        statement: d.statement,
        domain: d.domain,
        polarity: d.polarity,
        basis: d.basis,
        evidenceCount: evidence.length,
        evidence,
        contradicts: [],
        firstSeen: now,
        lastSeen: now,
        status: "active"
      };
      axioms.push(created);
      byId.set(id, created);
      newIdsByStatement.set(d.statement, id);
    }
  }
  for (const d of output.axioms) {
    const selfId = d.matchesExisting ?? newIdsByStatement.get(d.statement);
    if (!selfId) continue;
    const self = byId.get(selfId);
    if (!self) continue;
    for (const c of d.contradicts) {
      const otherId = byId.has(c) ? c : newIdsByStatement.get(c);
      const other = otherId ? byId.get(otherId) : void 0;
      if (!other || other.id === self.id) continue;
      if (!self.contradicts.includes(other.id)) self.contradicts.push(other.id);
      if (!other.contradicts.includes(self.id)) other.contradicts.push(self.id);
    }
  }
  return {
    ...tuning,
    updatedAt: now,
    sources: [...tuning.sources, { recordId, distilledAt: now, method: "rlaif-claude", model }],
    axioms
  };
}
var init_merge = __esm({
  "src/tuning/merge.ts"() {
    "use strict";
  }
});

// src/ci/window.ts
function mergeWindow(payload, opts = {}) {
  const pr = payload.pull_request;
  if (!pr) throw new NotAMergedPullRequest("event payload carries no pull_request object");
  if (pr.merged !== true) {
    throw new NotAMergedPullRequest(
      `pull request #${pr.number ?? payload.number ?? 0} closed without merging; nothing was accepted, so nothing is resolved`
    );
  }
  const baseSha = pr.base?.sha;
  const headSha2 = pr.head?.sha;
  if (!baseSha || !headSha2) throw new NotAMergedPullRequest("event payload carries no base.sha or head.sha");
  const prNumber = pr.number ?? payload.number ?? 0;
  const repo = payload.repository?.full_name ?? "";
  const mergeCommitSha = pr.merge_commit_sha ?? null;
  let style = "unknown";
  if (mergeCommitSha && opts.parentCountOf) {
    const parents = opts.parentCountOf(mergeCommitSha);
    style = parents >= 2 ? "merge-commit" : parents === 1 ? "squash" : "unknown";
  }
  if (style === "squash") {
    return {
      prNumber,
      repo,
      baseSha,
      headSha: headSha2,
      mergeCommitSha,
      style,
      range: `${mergeCommitSha}~1..${mergeCommitSha}`,
      note: `squash merge: the branch's commit sequence collapsed into ${String(mergeCommitSha).slice(0, 7)}, so this window is that one commit and recurrence counts inside the branch are unrecoverable`
    };
  }
  return {
    prNumber,
    repo,
    baseSha,
    headSha: headSha2,
    mergeCommitSha,
    style,
    range: `${baseSha}..${headSha2}`,
    note: `${style === "merge-commit" ? "merge commit" : "merge style undetermined"}: window is the pull request's own commits, ${baseSha.slice(0, 7)}..${headSha2.slice(0, 7)}`
  };
}
function parentCountOf(repoPath, sha) {
  try {
    const out = (0, import_node_child_process5.execFileSync)("git", ["-C", repoPath, "rev-list", "--parents", "-n", "1", sha], {
      encoding: "utf8"
    }).trim();
    return out.split(/\s+/).filter(Boolean).length - 1;
  } catch {
    return 0;
  }
}
function mergeWindowFromEvent(eventPath, repoPath) {
  const payload = JSON.parse((0, import_node_fs5.readFileSync)(eventPath, "utf8"));
  return mergeWindow(payload, { parentCountOf: (sha) => parentCountOf(repoPath, sha) });
}
var import_node_fs5, import_node_child_process5, NotAMergedPullRequest;
var init_window = __esm({
  "src/ci/window.ts"() {
    "use strict";
    import_node_fs5 = require("node:fs");
    import_node_child_process5 = require("node:child_process");
    NotAMergedPullRequest = class extends Error {
    };
  }
});

// src/ci/distill-mode.ts
function claudeOnPath() {
  try {
    (0, import_node_child_process6.execFileSync)("claude", ["--version"], { encoding: "utf8", timeout: 2e4, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
function selectDistillMode(env, opts = {}) {
  const probe = opts.claudeOnPath ?? claudeOnPath;
  const model = opts.model ?? env.URSA_DISTILL_MODEL ?? "sonnet";
  if (env.URSA_DISTILL === "off") {
    return { kind: "ci-no-model", reason: "distillation disabled by URSA_DISTILL=off" };
  }
  const credential = CREDENTIAL_VARS.find((name) => (env[name] ?? "").trim().length > 0);
  if (!credential) {
    return {
      kind: "ci-no-model",
      reason: `no model credential in the environment (looked for ${CREDENTIAL_VARS.join(", ")})`
    };
  }
  if (!probe()) {
    return {
      kind: "ci-no-model",
      reason: `${credential} is set but the claude CLI is not on PATH`
    };
  }
  return { kind: "model", model, reason: `${credential} is set and the claude CLI is on PATH` };
}
var import_node_child_process6, CREDENTIAL_VARS;
var init_distill_mode = __esm({
  "src/ci/distill-mode.ts"() {
    "use strict";
    import_node_child_process6 = require("node:child_process");
    CREDENTIAL_VARS = ["ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN"];
  }
});

// src/ci/github.ts
function githubApi(opts) {
  const base = (opts.baseUrl ?? "https://api.github.com").replace(/\/$/, "");
  const doFetch = opts.fetchImpl ?? fetch;
  async function call(method, path, body) {
    const res = await doFetch(`${base}${path}`, {
      method,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${opts.token}`,
        "x-github-api-version": "2022-11-28",
        "user-agent": "ursa-major-action",
        ...body === void 0 ? {} : { "content-type": "application/json" }
      },
      body: body === void 0 ? void 0 : JSON.stringify(body)
    });
    if (!res.ok) {
      throw new GitHubApiError(res.status, `${method} ${path}`, (await res.text()).slice(0, 400));
    }
    return await res.json();
  }
  return {
    // Repository-wide, newest first. One page of 100 is enough: the
    // previous merge's comment is at most a few merges back, and paging
    // the whole history of a busy repository to find it would cost more
    // than the signal is worth.
    listRepoRunComments: () => call("GET", `/repos/${opts.repo}/issues/comments?sort=created&direction=desc&per_page=100`),
    listPrComments: (prNumber) => call("GET", `/repos/${opts.repo}/issues/${prNumber}/comments?per_page=100`),
    listReactions: (commentId) => call("GET", `/repos/${opts.repo}/issues/comments/${commentId}/reactions?per_page=100`),
    postComment: (prNumber, body) => call("POST", `/repos/${opts.repo}/issues/${prNumber}/comments`, { body }),
    patchComment: (commentId, body) => call("PATCH", `/repos/${opts.repo}/issues/comments/${commentId}`, { body })
  };
}
var GitHubApiError;
var init_github = __esm({
  "src/ci/github.ts"() {
    "use strict";
    GitHubApiError = class extends Error {
      constructor(status, endpoint, message) {
        super(`GitHub API ${status} on ${endpoint}: ${message}`);
        this.status = status;
        this.endpoint = endpoint;
      }
      status;
      endpoint;
    };
  }
});

// src/ci/reactions.ts
function findPriorRunComment(comments, marker) {
  const mine = comments.filter((c) => c.body.includes(marker));
  if (mine.length === 0) return null;
  const newest = mine.reduce((a, b) => Date.parse(b.created_at) >= Date.parse(a.created_at) ? b : a);
  return { commentId: newest.id, commentUrl: newest.html_url, postedAt: newest.created_at };
}
function readAcceptance(comment, reactions, now = (/* @__PURE__ */ new Date()).toISOString()) {
  const up = reactions.filter((r) => r.content === "+1");
  const down = reactions.filter((r) => r.content === "-1");
  const stamps = up.map((r) => r.created_at).filter((t) => typeof t === "string").sort();
  return {
    comment,
    thumbsUp: up.length,
    thumbsUpBy: up.map((r) => r.user?.login ?? "unknown").sort(),
    thumbsDown: down.length,
    declaredAt: stamps[0] ?? null,
    mark: up.length > 0 ? { step: 0, polarity: "positive", source: "pr-reaction", recordedAt: stamps[0] ?? now } : null
  };
}
function declarationFromReaction(prior) {
  if (!prior) {
    return {
      accepted: null,
      basis: "undeclared: no previous Ursa run comment existed on this repository, so no reaction could be read. Retention is NOT acceptance."
    };
  }
  if (prior.thumbsUp > 0) {
    const who = prior.thumbsUpBy.join(", ");
    return {
      accepted: true,
      basis: `owner-declared satisfied by a \u{1F44D} reaction from ${who} on the previous Ursa run comment (${prior.comment.commentUrl}), left ${prior.declaredAt ?? "at an unreported time"} (source: pr-reaction)`
    };
  }
  return {
    accepted: null,
    basis: `undeclared: the previous Ursa run comment (${prior.comment.commentUrl}) carries no \u{1F44D}` + (prior.thumbsDown > 0 ? `, and its ${prior.thumbsDown} \u{1F44E} has no verified meaning and is not read as a verdict` : "") + ". Silence stays undeclared; retention is NOT acceptance."
  };
}
var init_reactions = __esm({
  "src/ci/reactions.ts"() {
    "use strict";
  }
});

// src/ci/comment.ts
function runCommentFields(records, episodes, tuningDelta) {
  let charsSurvivedVerbatim = 0;
  let charsSurvivedEdited = 0;
  const mutatedByPath = /* @__PURE__ */ new Map();
  for (const record of records) {
    charsSurvivedVerbatim += record.stats.byClass.survived_verbatim.chars;
    charsSurvivedEdited += record.stats.byClass.survived_mutated.chars;
    for (const file of record.stats.perFile) {
      const mutated = file.byClass.survived_mutated ?? 0;
      if (mutated <= 0) continue;
      mutatedByPath.set(file.path, (mutatedByPath.get(file.path) ?? 0) + mutated);
    }
  }
  let mostCorrectedArtifact = null;
  let mostCorrectedChars = 0;
  for (const [path, chars] of [...mutatedByPath].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    mostCorrectedArtifact = path;
    mostCorrectedChars = chars;
    break;
  }
  return {
    unitsFound: episodes.length,
    unitsResolved: records.length,
    charsSurvivedVerbatim,
    charsSurvivedEdited,
    mostCorrectedArtifact,
    mostCorrectedChars,
    tuningDelta
  };
}
function n(value) {
  return value.toLocaleString("en-US");
}
function renderRunCommentFieldTable(f) {
  const delta = f.tuningDelta;
  const deltaCell = delta.mode === "distilled" ? `${n(delta.unitsAdded)} new, ${n(delta.unitsReinforced)} reinforced` : `${n(delta.unitsAdded)} new, ${n(delta.unitsReinforced)} reinforced (no interpretation ran: ${delta.reason})`;
  const artifactCell = f.mostCorrectedArtifact === null ? "none \u2014 no generated text was edited in this window" : `\`${f.mostCorrectedArtifact}\` (${n(f.mostCorrectedChars)} edited characters)`;
  return [
    "| Field | Value |",
    "| --- | --- |",
    `| Units resolved \u2014 work units found in this merge, and how many became outcome records | ${n(f.unitsResolved)} of ${n(f.unitsFound)} |`,
    `| Characters survived verbatim \u2014 generated text you kept unchanged | ${n(f.charsSurvivedVerbatim)} |`,
    `| Characters survived edited \u2014 generated text you kept after editing it; the edit is the correction | ${n(f.charsSurvivedEdited)} |`,
    `| Most corrected artifact \u2014 the file carrying the most edited characters | ${artifactCell} |`,
    `| Tuning delta \u2014 preference units this run added to, or reinforced in, the tuning store | ${deltaCell} |`
  ].join("\n");
}
function emptyWindowSentence(f, ctx) {
  const opening = "Nothing resolved in this window. That is a reading, not a failure:";
  if (f.unitsFound === 0) {
    return `${opening} no commit here carried an agent marker that a later human commit then edited.`;
  }
  const one = f.unitsFound === 1;
  const found = one ? "1 work unit was found, and it did not become a record." : `${f.unitsFound} work units were found, and none of them became a record.`;
  const d = ctx.dropped;
  if (!d) return `${opening} ${found} This run did not record which bound dropped them.`;
  const because = [];
  if (d.belowMinChars > 0) {
    because.push(`${d.belowMinChars} carried fewer than ${d.minChars} generated characters, the \`--min-chars\` floor, which is small enough that a survival figure over it would be noise`);
  }
  if (d.unresolvable > 0) {
    because.push(`${d.unresolvable} resolved to nothing this clone could stand behind, which is usually a blob the runner could not read or a file over the size ceiling`);
  }
  if (because.length === 0) return `${opening} ${found}`;
  const lead = one ? "The reason:" : "Of those,";
  return `${opening} ${found} ${lead} ${because.join(", and ")}.`;
}
function renderRunComment(f, ctx) {
  const lines = [RUN_COMMENT_MARKER, ""];
  lines.push(`**Ursa Major resolved this merge.** Pull request #${ctx.prNumber} in \`${ctx.repo}\`.`);
  lines.push("");
  lines.push(renderRunCommentFieldTable(f));
  lines.push("");
  lines.push(f.unitsResolved === 0 ? emptyWindowSentence(f, ctx) : "That's the part worth noticing: not what got written, what got kept.");
  lines.push("");
  lines.push("<details><summary>How this run was bounded</summary>");
  lines.push("");
  lines.push(`- Commit window: \`${ctx.range}\``);
  lines.push(`- Why that window: ${ctx.windowNote}`);
  lines.push(`- Acceptance declaration carried into these records: ${ctx.declarationBasis}`);
  lines.push(`- Records written to \`${ctx.recordsPath}\` on this runner. They are not pushed anywhere.`);
  if (ctx.runUrl) lines.push(`- Workflow run: ${ctx.runUrl}`);
  lines.push("");
  lines.push("</details>");
  lines.push("");
  lines.push(
    "React \u{1F44D} on this comment if the merged work is what you wanted. Ursa reads that reaction on the next run and records it as a declared acceptance. Leaving it alone records nothing: silence stays undeclared, and retention is never read as acceptance."
  );
  return lines.join("\n");
}
var RUN_COMMENT_MARKER;
var init_comment = __esm({
  "src/ci/comment.ts"() {
    "use strict";
    RUN_COMMENT_MARKER = "<!-- ursa-major:run-comment:v1 -->";
  }
});

// src/ci/run.ts
var run_exports = {};
__export(run_exports, {
  renderStepOutputs: () => renderStepOutputs,
  runCi: () => runCi
});
async function runCi(opts) {
  const log = opts.log ?? ((line) => console.log(line));
  const env = opts.env ?? process.env;
  const minChars = opts.minChars ?? 200;
  const api = opts.api ?? githubApi({ repo: opts.repo, token: opts.token, baseUrl: opts.apiBaseUrl });
  const mode = selectDistillMode(env);
  let window;
  try {
    window = mergeWindowFromEvent(opts.eventPath, opts.projectPath);
  } catch (err) {
    if (err instanceof NotAMergedPullRequest) {
      log(`ursa ci: nothing to resolve \u2014 ${err.message}`);
      return {
        exitCode: 0,
        window: null,
        fields: null,
        comment: null,
        commentUrl: null,
        priorAcceptance: null,
        declaration: NO_PRIOR,
        mode,
        recordPaths: []
      };
    }
    throw err;
  }
  log(`ursa ci: pull request #${window.prNumber}, window ${window.range} (${window.style})`);
  const canRead = opts.api !== void 0 || opts.token.length > 0;
  const { priorAcceptance, ownAcceptance, ownComment } = canRead ? await readReactions(api, window.prNumber, log) : (log("ursa ci: no token, so no reaction can be read; acceptance stays undeclared"), { priorAcceptance: null, ownAcceptance: null, ownComment: null });
  if (priorAcceptance?.mark) {
    appendAcceptance(opts.projectPath, priorAcceptance);
    log(
      `ursa ci: declared acceptance read \u2014 ${priorAcceptance.thumbsUp} \u{1F44D} from ${priorAcceptance.thumbsUpBy.join(", ")} on ${priorAcceptance.comment.commentUrl}`
    );
  } else {
    log("ursa ci: no declared acceptance to read; silence stays undeclared");
  }
  const declaration = ownAcceptance ? declarationFromReaction(ownAcceptance) : NO_PRIOR;
  const pairs = findCommitPairs(opts.projectPath, { range: window.range });
  const episodes = buildEpisodes(pairs, opts.projectPath);
  const records = [];
  const recordPaths = [];
  const dropped = { unresolvable: 0, belowMinChars: 0, minChars };
  for (const episode of episodes) {
    const record = resolveEpisode(opts.projectPath, episode);
    if (!record) {
      dropped.unresolvable++;
      continue;
    }
    if (record.stats.generated.totalChars < minChars) {
      dropped.belowMinChars++;
      continue;
    }
    const signals = deriveSignals(record, declaration);
    signals.notes = [...signals.notes ?? [], `CI launch: ${window.note}`];
    record.signals = signals;
    recordPaths.push(saveRecord(opts.projectPath, record));
    records.push(record);
  }
  saveEpisodes(opts.projectPath, episodes);
  log(`ursa ci: ${episodes.length} work units found, ${records.length} resolved`);
  const tuningDelta = distillAll(opts.projectPath, records, mode, log);
  const fields = runCommentFields(records, episodes, tuningDelta);
  const comment = renderRunComment(fields, {
    prNumber: window.prNumber,
    repo: opts.repo,
    range: window.range,
    windowNote: window.note,
    declarationBasis: declaration.basis,
    recordsPath: (0, import_node_path6.join)(ursaDir(opts.projectPath), "records"),
    dropped,
    runUrl: opts.runUrl ?? null
  });
  let commentUrl = null;
  if (opts.post === false) {
    log("ursa ci: --no-post, the comment is printed and not written\n");
    log(comment);
  } else {
    const written = ownComment ? await api.patchComment(ownComment.commentId, comment) : await api.postComment(window.prNumber, comment);
    commentUrl = written.html_url;
    log(`ursa ci: run comment ${ownComment ? "updated" : "posted"} \u2014 ${commentUrl}`);
  }
  const outputsPath = opts.outputsPath ?? env.GITHUB_OUTPUT ?? null;
  if (outputsPath) writeStepOutputs(outputsPath, fields, commentUrl);
  return {
    exitCode: 0,
    window,
    fields,
    comment,
    commentUrl,
    priorAcceptance,
    declaration,
    mode,
    recordPaths
  };
}
function renderStepOutputs(fields, commentUrl) {
  const delta = fields.tuningDelta;
  return [
    `units-resolved=${fields.unitsResolved}`,
    `units-found=${fields.unitsFound}`,
    `chars-survived-verbatim=${fields.charsSurvivedVerbatim}`,
    `chars-survived-edited=${fields.charsSurvivedEdited}`,
    `most-corrected-artifact=${fields.mostCorrectedArtifact ?? ""}`,
    `tuning-delta=${delta.unitsAdded}/${delta.unitsReinforced}`,
    `tuning-mode=${delta.mode}`,
    `comment-url=${commentUrl ?? ""}`,
    ""
  ].join("\n");
}
function writeStepOutputs(path, fields, commentUrl) {
  (0, import_node_fs6.appendFileSync)(path, renderStepOutputs(fields, commentUrl));
}
async function readReactions(api, prNumber, log) {
  try {
    const own = findPriorRunComment(await api.listPrComments(prNumber), RUN_COMMENT_MARKER);
    const ownAcceptance = own ? readAcceptance(own, await api.listReactions(own.commentId)) : null;
    const repoWide = (await api.listRepoRunComments()).filter(
      (c) => c.body.includes(RUN_COMMENT_MARKER) && c.id !== own?.commentId
    );
    const prior = findPriorRunComment(repoWide, RUN_COMMENT_MARKER);
    const priorAcceptance = prior ? readAcceptance(prior, await api.listReactions(prior.commentId)) : null;
    return { priorAcceptance, ownAcceptance, ownComment: own };
  } catch (err) {
    log(`ursa ci: could not read reactions (${err.message}); treating acceptance as undeclared`);
    return { priorAcceptance: null, ownAcceptance: null, ownComment: null };
  }
}
function appendAcceptance(projectPath, prior) {
  const dir = ursaDir(projectPath);
  (0, import_node_fs6.mkdirSync)(dir, { recursive: true });
  const entry = {
    schemaVersion: "0.1.0",
    commentUrl: prior.comment.commentUrl,
    commentId: prior.comment.commentId,
    commentPostedAt: prior.comment.postedAt,
    thumbsUp: prior.thumbsUp,
    thumbsUpBy: prior.thumbsUpBy,
    declaredAt: prior.declaredAt,
    mark: prior.mark,
    readAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  (0, import_node_fs6.appendFileSync)((0, import_node_path6.join)(dir, "acceptance.jsonl"), JSON.stringify(entry) + "\n");
}
function distillAll(projectPath, records, mode, log) {
  const base = {
    unitsAdded: 0,
    unitsReinforced: 0,
    mode: mode.kind === "model" ? "distilled" : "ci-no-model",
    reason: mode.reason
  };
  if (mode.kind !== "model") {
    log(`ursa ci: distillation skipped \u2014 ${mode.reason}. Records are written; they distill later, unchanged.`);
    return base;
  }
  if (records.length === 0) return base;
  const tuningPath = (0, import_node_path6.join)(ursaDir(projectPath), "tuning.json");
  let tuning = (0, import_node_fs6.existsSync)(tuningPath) ? JSON.parse((0, import_node_fs6.readFileSync)(tuningPath, "utf8")) : emptyTuning("ci");
  for (const record of records) {
    if (tuning.sources.some((s) => s.recordId === record.task.id)) continue;
    try {
      const output = distill(record, tuning, mode.model);
      const before = tuning.axioms.length;
      tuning = mergeDistill(tuning, output, record, mode.model);
      base.unitsAdded += tuning.axioms.length - before;
      base.unitsReinforced += output.axioms.length - (tuning.axioms.length - before);
    } catch (err) {
      log(`ursa ci: distill failed on ${record.task.id} (${err.message}); continuing`);
    }
  }
  (0, import_node_fs6.writeFileSync)(tuningPath, JSON.stringify(tuning, null, 2) + "\n");
  return base;
}
var import_node_fs6, import_node_path6, NO_PRIOR;
var init_run = __esm({
  "src/ci/run.ts"() {
    "use strict";
    import_node_fs6 = require("node:fs");
    import_node_path6 = require("node:path");
    init_pairfinder();
    init_episodes();
    init_signals();
    init_store();
    init_resolve_episode();
    init_distill();
    init_merge();
    init_window();
    init_distill_mode();
    init_github();
    init_reactions();
    init_comment();
    NO_PRIOR = {
      accepted: null,
      basis: "undeclared: no reaction has been left on this run comment yet. Retention is NOT acceptance."
    };
  }
});

// ursa-stub:ursa:bridge-stub
var ursa_bridge_stub_exports = {};
__export(ursa_bridge_stub_exports, {
  startBridge: () => startBridge
});
function startBridge() {
  throw new Error(
    'ursa bridge is not in the single-file bundle. The bridge tails a local session log on your own machine; run it from the source tree with "npx tsx src/bin/ursa.ts bridge <project>". The bundle exists for the GitHub runner, which has no session log to tail.'
  );
}
var init_ursa_bridge_stub = __esm({
  "ursa-stub:ursa:bridge-stub"() {
  }
});

// src/bin/ursa.ts
var import_node_util = require("node:util");
var import_node_path7 = require("node:path");
init_pairfinder();
init_vendored();
init_signals();

// src/lifespan.ts
var import_node_child_process3 = require("node:child_process");
init_normalize();
init_match();
init_segment();
var MAX_REVISIONS = 50;
var MIN_TRACEABLE_LEN = 24;
var MAX_BLOB_CHARS = 3e5;
function git2(repoPath, args) {
  return (0, import_node_child_process3.execFileSync)("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"]
  });
}
function headSha(repoPath) {
  try {
    return git2(repoPath, ["rev-parse", "HEAD"]).trim();
  } catch {
    return null;
  }
}
function revisionsAfter(repoPath, sha, path, limit = MAX_REVISIONS) {
  let out;
  try {
    out = git2(repoPath, [
      "log",
      "--reverse",
      "--topo-order",
      "--date=iso-strict",
      `--max-count=${limit}`,
      "--pretty=format:%H%x09%aI%x09%an%x09%s",
      `${sha}..HEAD`,
      "--",
      path
    ]);
  } catch {
    return [];
  }
  return out.split("\n").filter(Boolean).map((line) => {
    const [revSha, at, author, ...rest] = line.split("	");
    return { sha: revSha, at, author, subject: rest.join("	") };
  });
}
function blobAt2(repoPath, sha, path) {
  try {
    return git2(repoPath, ["show", `${sha}:${path}`]);
  } catch {
    return null;
  }
}
function spanPresent(spanNorm, fileNorm, fileTokens) {
  if (fileNorm.includes(spanNorm)) return { present: true, basis: "verbatim" };
  if (containment(tokens(spanNorm), fileTokens) >= THETA_HIGH) {
    return { present: true, basis: "token-containment" };
  }
  return { present: false };
}
function traceFile(repoPath, path, spans, closedAt, revisions) {
  const mode = modeForPath(path);
  const closedMs = Date.parse(closedAt);
  const unitsBySpan = /* @__PURE__ */ new Map();
  const live = [];
  for (const span of spans) {
    const units = segment(span.text, mode).map((u) => ({ span, norm: normalize(u.text).norm, chars: u.text.length, diedAt: null })).filter((u) => u.norm.length >= MIN_TRACEABLE_LEN);
    unitsBySpan.set(span, units);
    span.lifespan = {
      revisionsChecked: 0,
      unitsTraced: units.length,
      unitsSurviving: units.length,
      survivingChars: 0,
      decayedChars: 0,
      intactRevisions: 0,
      intactSeconds: 0,
      diedAtSha: null,
      diedAt: null,
      liveAtTip: false,
      fate: "untested",
      basis: null,
      skipped: units.length === 0 ? "too-short" : revisions.length === 0 ? "no-later-revisions" : null
    };
    live.push(...units);
  }
  if (revisions.length === 0) return spans;
  let remaining = live.length;
  for (const rev of revisions) {
    if (remaining === 0) break;
    const text = blobAt2(repoPath, rev.sha, path);
    const fileNorm = text === null || text.length > MAX_BLOB_CHARS ? "" : normalize(text).norm;
    const fileTokens = new Set(tokens(fileNorm));
    const revMs = Date.parse(rev.at);
    const touchedSpans = /* @__PURE__ */ new Set();
    for (const unit of live) {
      if (unit.diedAt) continue;
      touchedSpans.add(unit.span);
      const presence = spanPresent(unit.norm, fileNorm, fileTokens);
      if (presence.present) {
        unit.span.lifespan.basis = presence.basis;
      } else {
        unit.diedAt = rev;
        remaining--;
      }
    }
    for (const span of touchedSpans) {
      const life = span.lifespan;
      life.revisionsChecked++;
      const units = unitsBySpan.get(span);
      if (units.every((u) => !u.diedAt)) {
        life.intactRevisions++;
        life.intactSeconds = Math.max(0, Math.round((revMs - closedMs) / 1e3));
      }
    }
  }
  for (const [span, units] of unitsBySpan) {
    const life = span.lifespan;
    if (units.length === 0) continue;
    const lost = units.filter((u) => u.diedAt);
    life.unitsSurviving = units.length - lost.length;
    life.survivingChars = units.filter((u) => !u.diedAt).reduce((n2, u) => n2 + u.chars, 0);
    life.decayedChars = lost.reduce((n2, u) => n2 + u.chars, 0);
    life.liveAtTip = life.unitsSurviving > 0;
    if (lost.length > 0) {
      const first = lost.reduce((a, b) => revisions.indexOf(a.diedAt) <= revisions.indexOf(b.diedAt) ? a : b);
      life.diedAtSha = first.diedAt.sha;
      life.diedAt = first.diedAt.at;
    }
    life.fate = lost.length === 0 ? "durable" : lost.length === units.length ? "decayed" : "eroded";
  }
  return spans;
}
function median(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}
var SURVIVING = /* @__PURE__ */ new Set(["survived_verbatim", "survived_mutated"]);
function annotateDurability(repoPath, record, closingSha, closedAt, maxRevisions = MAX_REVISIONS) {
  const tip = headSha(repoPath);
  for (const file of record.files) {
    const revisions = revisionsAfter(repoPath, closingSha, file.path, maxRevisions);
    traceFile(repoPath, file.path, file.spans, closedAt, revisions);
  }
  let testedSpans = 0, durableSpans = 0, erodedSpans = 0, decayedSpans = 0;
  let durableChars = 0, decayedChars = 0;
  let baseDurable = 0, baseDecayed = 0;
  const lifetimes = [];
  for (const file of record.files) {
    for (const span of file.spans) {
      const life = span.lifespan;
      if (!life || life.fate === "untested") continue;
      if (SURVIVING.has(span.class)) {
        testedSpans++;
        if (life.fate === "durable") durableSpans++;
        else if (life.fate === "eroded") erodedSpans++;
        else decayedSpans++;
        durableChars += life.survivingChars;
        decayedChars += life.decayedChars;
        if (life.decayedChars > 0) lifetimes.push(life.intactSeconds);
      } else if (span.class === "no_generation_provenance") {
        baseDurable += life.survivingChars;
        baseDecayed += life.decayedChars;
      }
    }
  }
  const baseTotal = baseDurable + baseDecayed;
  const total = durableChars + decayedChars;
  record.durability = {
    method: "git-forward-walk",
    tipSha: tip,
    closingSha,
    testedSpans,
    durableSpans,
    erodedSpans,
    decayedSpans,
    durableChars,
    decayedChars,
    decayRate: total === 0 ? null : decayedChars / total,
    baselineDecayRate: baseTotal === 0 ? null : baseDecayed / baseTotal,
    medianIntactSeconds: median(lifetimes),
    maxRevisionsWalked: maxRevisions,
    minTraceableLen: MIN_TRACEABLE_LEN
  };
  return record;
}

// src/bin/ursa.ts
init_episodes();
init_store();

// src/invariants.ts
init_intervals();
init_text();
var BOUNDS = {
  CLAIM_NOT_WIDER: "a survived_verbatim final span is no wider than the generation extent it claims: span.end - span.start <= source.end - source.start. Verbatim means byte-identical, so the two extents describe the same characters. A survived_mutated span is exempt, because an edit may add text the generation never contained.",
  CLAIM_IN_GENERATION: "a source pointer names a generation that exists and an extent inside that generation's text: 0 <= start < end <= text.length",
  GEN_SPANS_PARTITION_ORDER: "a generation's spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)",
  GEN_CHARS_CONSISTENT: "a generation's character counts agree: totalChars = sum of span extents, charsWritten = text.length, separatorChars = charsWritten - totalChars",
  GEN_SURVIVED_BOUNDED: "a generation's surviving characters are a subset of its segment characters, which are a subset of what it wrote: survivedChars <= totalChars <= charsWritten",
  GEN_CLAIM_BOUNDED: "the characters of one generation claimed by final spans, counted once each, do not exceed what that generation wrote: claimed <= charsWritten",
  DELETION_SPLIT_EXACT: "the deletion split is exact and non-negative: humanDeletedChars + mergeDeletedChars + unknownDeletedChars = deletedChars = totalChars - survivedChars",
  FINAL_SPANS_IN_FILE: "a final file's spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)",
  COVERED_BOUNDED: "classified characters are a subset of the finished work: coveredChars = sum of final span extents <= finalChars",
  RATES_MATCH_FIELDS: "every stored rate equals its own numerator over its own denominator, rounded to three places",
  PCT_DENOMINATORS_ORDERED: "a class's share of the finished work is never larger than its share of the classified part: byClass[c].pctOfFinal <= byClass[c].pct. The two fields differ only in denominator \u2014 coveredChars for pct, finalChars for pctOfFinal \u2014 and COVERED_BOUNDED already holds coveredChars <= finalChars, so the bound is the same-set statement that the wider denominator produced the smaller number. It fires when the two are computed from each other's denominator, which is the one way a reader could be handed the flattering figure under the honest field's name.",
  PERFILE_ENUMERATES_PATHS: "the paths in stats.perFile are exactly the paths in files[] together with the paths in exclusions[], each appearing once. perFile is the array a consuming pipeline iterates, so a path the run read and this array omits is a gap no iteration can see; a path here that the record does not carry under either key is a row pointing at nothing. Exact equality rather than containment in one direction, because both failures are silent in the same way.",
  SIGNAL_QUOTE_GROUNDED: "every QuoteRef a signal carries names raw text that exists in this record, the excerpt appears in that text under excerpt()'s whitespace normalization, and the same excerpt appears in the signal's own prose field. A signal may legitimately carry no QuoteRef at all (a distilled spec quotes nobody); what it may not do is carry one that does not hold.",
  EXCLUSION_NOT_CLASSIFIED: "no path the record excludes appears among its classified files, and every exclusion names a commit and a positive character count. The first clause is the same-set arithmetic this module exists for: `exclusions` and `files` partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and the record simultaneously claims the file is an import and sells labels over its spans. The second catches an exclusion that cannot be reconciled against the figures it moved \u2014 `stats.finalChars` plus the excluded characters is the size of every path the run read, and an entry with no number or no commit breaks that sum silently.",
  DESCENT_CHECKED_UNIFORMLY: "if any span in the record carries a descent verdict, every survived_mutated span carries one, and no span still labelled survived_mutated carries a `rival` verdict. The first clause catches a corroborator wired for some files and not others, which would leave part of the record's mutation labels unguarded while the record as a whole looks checked. The second catches the demotion being computed and then not applied, which is the only way a span can both name the rival that disproves its descent and keep the diff that asserts it."
};
var r3 = (x) => Math.round(x * 1e3) / 1e3;
var abbrev = (s) => s.length > 60 ? s.slice(0, 60) + "\u2026" : s;
function claimsByGeneration(files, include) {
  const byGen = /* @__PURE__ */ new Map();
  for (const f of files) {
    for (const s of f.spans) {
      if (!s.source || !include(s)) continue;
      const arr = byGen.get(s.source.generationIndex);
      if (arr) arr.push([s.source.start, s.source.end]);
      else byGen.set(s.source.generationIndex, [[s.source.start, s.source.end]]);
    }
  }
  return byGen;
}
function* quotingSignals(signals) {
  for (const [i, l] of signals.correctionLoops.entries()) {
    yield {
      where: `signals.correctionLoops[${i}] (${l.id}) discoveredSpec`,
      prose: l.discoveredSpec,
      quotes: l.quotes ?? []
    };
  }
  for (const [i, r] of signals.regressions.entries()) {
    yield {
      where: `signals.regressions[${i}] (step ${r.step}) evidence`,
      prose: r.evidence,
      quotes: r.quotes ?? []
    };
  }
  for (const [i, c] of signals.oneShotCorrections.entries()) {
    yield {
      where: `signals.oneShotCorrections[${i}] (step ${c.step}) text`,
      prose: c.text,
      quotes: c.quotes ?? []
    };
  }
}
function rawTextFor(record, q) {
  if (q.of === "user_prompt") {
    if (q.conversationId === void 0 || q.step === void 0) {
      return new Error("of=user_prompt needs both conversationId and step");
    }
    const conv = record.conversations.find((c) => c.id === q.conversationId);
    if (!conv) {
      return new Error(`no conversation ${q.conversationId} in this record (has ${record.conversations.map((c) => c.id).join(", ") || "none"})`);
    }
    if (!conv.prompts) {
      return new Error(`conversation ${q.conversationId} carries no prompts[], so the quote cannot be re-read from this record`);
    }
    const prompt = conv.prompts.find((p) => p.step === q.step);
    if (!prompt) {
      return new Error(`conversation ${q.conversationId} has no prompt at step ${q.step} (steps present: ${conv.prompts.map((p) => p.step).join(", ") || "none"})`);
    }
    return prompt.text;
  }
  if (q.of === "generation") {
    if (q.generationIndex === void 0) {
      return new Error("of=generation needs generationIndex, the record's own address for a generation");
    }
    const gen = record.generations[q.generationIndex];
    if (!gen || gen.generationIndex !== q.generationIndex) {
      return new Error(`no generation at index ${q.generationIndex} (record has ${record.generations.length})`);
    }
    if (q.step !== void 0 && gen.turnIndex !== q.step) {
      return new Error(`generation ${q.generationIndex} is at turnIndex ${gen.turnIndex}, the quote claims step ${q.step}`);
    }
    return gen.text;
  }
  if (q.filePath === void 0) return new Error("of=final_span needs filePath");
  const file = record.files.find((f) => f.path === q.filePath);
  if (!file) {
    return new Error(`no file ${q.filePath} in this record (has ${record.files.map((f) => f.path).join(", ") || "none"})`);
  }
  return file.text;
}
function checkRecord(record) {
  const out = [];
  const id = record.task.id;
  const push = (code, where, observed) => out.push({ code, invariant: BOUNDS[code], where: `${id} ${where}`.trim(), observed });
  const gens = record.generations;
  for (const f of record.files) {
    let prevEnd = 0;
    for (const [i, s] of f.spans.entries()) {
      const at = `file ${f.path} span ${i} [${s.start},${s.end})`;
      if (s.start < prevEnd || s.start > s.end || s.end > f.text.length) {
        push(
          "FINAL_SPANS_IN_FILE",
          at,
          `previous span ended at ${prevEnd}, file is ${f.text.length} chars`
        );
      } else if (s.text !== f.text.slice(s.start, s.end)) {
        push(
          "FINAL_SPANS_IN_FILE",
          at,
          `span.text is ${s.text.length} chars, text.slice(${s.start}, ${s.end}) is ${f.text.slice(s.start, s.end).length}`
        );
      }
      prevEnd = Math.max(prevEnd, s.end);
      if (!s.source) continue;
      const gi = s.source.generationIndex;
      const gen2 = gens[gi];
      if (!gen2 || gen2.generationIndex !== gi) {
        push(
          "CLAIM_IN_GENERATION",
          at,
          `source.generationIndex ${gi}, record has ${gens.length} generations`
        );
        continue;
      }
      if (s.source.start < 0 || s.source.start >= s.source.end || s.source.end > gen2.text.length) {
        push(
          "CLAIM_IN_GENERATION",
          at,
          `claims [${s.source.start},${s.source.end}) of a generation ${gen2.text.length} chars long`
        );
      }
      if (s.class === "survived_verbatim") {
        const finalLen = s.end - s.start;
        const srcLen = s.source.end - s.source.start;
        if (finalLen > srcLen) {
          push(
            "CLAIM_NOT_WIDER",
            at,
            `${finalLen} final chars credited to a ${srcLen}-char generation extent, ${finalLen - srcLen} too many`
          );
        }
      }
    }
  }
  for (const g of gens) {
    const at = `generation ${g.generationIndex}${g.filePath ? ` (${g.filePath})` : ""}`;
    let prevEnd = 0;
    let segmentChars = 0;
    for (const [i, s] of g.spans.entries()) {
      if (s.start < prevEnd || s.start > s.end || s.end > g.text.length) {
        push(
          "GEN_SPANS_PARTITION_ORDER",
          `${at} span ${i} [${s.start},${s.end})`,
          `previous span ended at ${prevEnd}, generation is ${g.text.length} chars`
        );
      } else if (s.text !== g.text.slice(s.start, s.end)) {
        push(
          "GEN_SPANS_PARTITION_ORDER",
          `${at} span ${i} [${s.start},${s.end})`,
          `span.text is ${s.text.length} chars, text.slice(${s.start}, ${s.end}) is ${g.text.slice(s.start, s.end).length}`
        );
      }
      prevEnd = Math.max(prevEnd, s.end);
      segmentChars += s.end - s.start;
    }
    if (g.totalChars !== segmentChars || g.charsWritten !== g.text.length || g.separatorChars !== g.charsWritten - g.totalChars) {
      push(
        "GEN_CHARS_CONSISTENT",
        at,
        `totalChars ${g.totalChars} vs span extents ${segmentChars}; charsWritten ${g.charsWritten} vs text.length ${g.text.length}; separatorChars ${g.separatorChars} vs ${g.charsWritten - g.totalChars}`
      );
    }
    if (g.survivedChars > g.totalChars || g.totalChars > g.charsWritten) {
      push(
        "GEN_SURVIVED_BOUNDED",
        at,
        `survivedChars ${g.survivedChars}, totalChars ${g.totalChars}, charsWritten ${g.charsWritten}`
      );
    }
    if (r3(g.totalChars ? g.survivedChars / g.totalChars : 0) !== g.survivalRate) {
      push(
        "RATES_MATCH_FIELDS",
        at,
        `survivalRate ${g.survivalRate}, but ${g.survivedChars}/${g.totalChars} is ${r3(g.totalChars ? g.survivedChars / g.totalChars : 0)}`
      );
    }
  }
  const allClaims = claimsByGeneration(record.files, () => true);
  for (const [gi, intervals] of allClaims) {
    const gen2 = gens[gi];
    if (!gen2) continue;
    const claimed = mergedLength(intervals);
    if (claimed > gen2.charsWritten) {
      push(
        "GEN_CLAIM_BOUNDED",
        `generation ${gi}${gen2.filePath ? ` (${gen2.filePath})` : ""}`,
        `${claimed} distinct chars claimed by final spans, generation wrote ${gen2.charsWritten}`
      );
    }
  }
  const st = record.stats;
  const gen = st.generated;
  const split = gen.humanDeletedChars + gen.mergeDeletedChars + gen.unknownDeletedChars;
  const expectedDeleted = gen.totalChars - gen.survivedChars;
  if (split !== gen.deletedChars || gen.deletedChars !== expectedDeleted || gen.humanDeletedChars < 0 || gen.mergeDeletedChars < 0 || gen.unknownDeletedChars < 0) {
    push(
      "DELETION_SPLIT_EXACT",
      "stats.generated",
      `human ${gen.humanDeletedChars} + merge ${gen.mergeDeletedChars} + unknown ${gen.unknownDeletedChars} = ${split}, deletedChars ${gen.deletedChars}, totalChars - survivedChars = ${expectedDeleted}`
    );
  }
  const spanExtentSum = record.files.reduce(
    (a, f) => a + f.spans.reduce((b, s) => b + (s.end - s.start), 0),
    0
  );
  if (st.coveredChars !== spanExtentSum || st.coveredChars > st.finalChars) {
    push(
      "COVERED_BOUNDED",
      "stats",
      `coveredChars ${st.coveredChars}, span extents ${spanExtentSum}, finalChars ${st.finalChars}`
    );
  }
  const rateChecks = [
    ["generated.deletedPct", gen.deletedChars, gen.totalChars, gen.deletedPct],
    ["generated.humanDeletedPct", gen.humanDeletedChars, gen.totalChars, gen.humanDeletedPct]
  ];
  for (const [name, num, den, stored] of rateChecks) {
    const actual = r3(den ? num / den : 0);
    if (actual !== stored) {
      push(
        "RATES_MATCH_FIELDS",
        `stats.${name}`,
        `stored ${stored}, but ${num}/${den} is ${actual}`
      );
    }
  }
  for (const c of record.stats.perConversation) {
    const actual = r3(c.generatedChars ? c.survivedChars / c.generatedChars : 0);
    if (actual !== c.survivalRate) {
      push(
        "RATES_MATCH_FIELDS",
        `stats.perConversation ${c.conversationId}`,
        `survivalRate ${c.survivalRate}, but ${c.survivedChars}/${c.generatedChars} is ${actual}`
      );
    }
  }
  if (record.signals) {
    for (const sig of quotingSignals(record.signals)) {
      for (const [qi, q] of sig.quotes.entries()) {
        const at = `${sig.where} quote ${qi} (of=${q.of})`;
        const raw = rawTextFor(record, q);
        if (raw instanceof Error) {
          push("SIGNAL_QUOTE_GROUNDED", at, `unresolvable: ${raw.message}`);
          continue;
        }
        if (!isExcerptOf(q.text, raw)) {
          push(
            "SIGNAL_QUOTE_GROUNDED",
            at,
            `quote ${JSON.stringify(abbrev(q.text))} does not appear in the ${raw.length}-char text it names`
          );
        }
        if (!sig.prose.includes(q.text)) {
          push(
            "SIGNAL_QUOTE_GROUNDED",
            at,
            `quote ${JSON.stringify(abbrev(q.text))} is not present in the prose field a reader sees, so the two can disagree`
          );
        }
      }
    }
  }
  const classes = ["survived_verbatim", "survived_mutated", "no_generation_provenance"];
  for (const c of classes) {
    const actual = r3(st.coveredChars ? st.byClass[c].chars / st.coveredChars : 0);
    if (actual !== st.byClass[c].pct) {
      push(
        "RATES_MATCH_FIELDS",
        `stats.byClass.${c}.pct`,
        `stored ${st.byClass[c].pct}, but ${st.byClass[c].chars}/${st.coveredChars} is ${actual}`
      );
    }
    const actualOfFinal = r3(st.finalChars ? st.byClass[c].chars / st.finalChars : 0);
    if (actualOfFinal !== st.byClass[c].pctOfFinal) {
      push(
        "RATES_MATCH_FIELDS",
        `stats.byClass.${c}.pctOfFinal`,
        `stored ${st.byClass[c].pctOfFinal}, but ${st.byClass[c].chars}/${st.finalChars} is ${actualOfFinal}`
      );
    }
    if (st.byClass[c].pctOfFinal > st.byClass[c].pct) {
      push(
        "PCT_DENOMINATORS_ORDERED",
        `stats.byClass.${c}`,
        `pctOfFinal ${st.byClass[c].pctOfFinal} > pct ${st.byClass[c].pct}, with coveredChars ${st.coveredChars} and finalChars ${st.finalChars}`
      );
    }
  }
  const readPaths = [...record.files.map((f) => f.path), ...(record.exclusions ?? []).map((x) => x.path)];
  const rowPaths = st.perFile.map((r) => r.path);
  const missing = readPaths.filter((pth) => !rowPaths.includes(pth));
  const extra = rowPaths.filter((pth) => !readPaths.includes(pth));
  const duplicated = rowPaths.filter((pth, i) => rowPaths.indexOf(pth) !== i);
  if (missing.length > 0 || extra.length > 0 || duplicated.length > 0) {
    push(
      "PERFILE_ENUMERATES_PATHS",
      "stats.perFile",
      `${rowPaths.length} row${rowPaths.length === 1 ? "" : "s"} against ${record.files.length} classified + ${(record.exclusions ?? []).length} excluded path${readPaths.length === 1 ? "" : "s"}` + (missing.length > 0 ? `; no row for ${missing.map((pth) => JSON.stringify(pth)).join(", ")}` : "") + (extra.length > 0 ? `; row for unknown path ${extra.map((pth) => JSON.stringify(pth)).join(", ")}` : "") + (duplicated.length > 0 ? `; repeated row for ${duplicated.map((pth) => JSON.stringify(pth)).join(", ")}` : "")
    );
  }
  const descentSpans = [];
  const mutatedWithout = [];
  for (const f of record.files) {
    for (const [i, s] of f.spans.entries()) {
      const at = `file ${f.path} span ${i} [${s.start},${s.end})`;
      if (s.descent) descentSpans.push({ where: at, span: s, descent: s.descent });
      else if (s.class === "survived_mutated") mutatedWithout.push(at);
    }
  }
  if (descentSpans.length > 0 && mutatedWithout.length > 0) {
    push(
      "DESCENT_CHECKED_UNIFORMLY",
      mutatedWithout[0],
      `${descentSpans.length} spans carry a descent verdict, ${mutatedWithout.length} survived_mutated spans carry none`
    );
  }
  for (const d of descentSpans) {
    if (d.span.class === "survived_mutated" && d.descent.basis === "rival") {
      push(
        "DESCENT_CHECKED_UNIFORMLY",
        d.where,
        `labelled survived_mutated while naming ${d.descent.relation} rival ${d.descent.sha} as holding the span's text verbatim`
      );
    }
  }
  const classified = new Set(record.files.map((f) => f.path));
  for (const [i, x] of (record.exclusions ?? []).entries()) {
    const at = `exclusions[${i}] (${x.path})`;
    if (classified.has(x.path)) {
      const f = record.files.find((ff) => ff.path === x.path);
      push(
        "EXCLUSION_NOT_CLASSIFIED",
        at,
        `excluded as ${x.reason} from ${x.sha} and also present in files[] with ${f.spans.length} classified span${f.spans.length === 1 ? "" : "s"} over ${f.text.length} chars`
      );
    }
    if (x.chars <= 0 || x.sha.length === 0) {
      push(
        "EXCLUSION_NOT_CLASSIFIED",
        at,
        `chars=${x.chars}, sha=${x.sha ? x.sha : "(empty)"}; stats.finalChars is ${record.stats.finalChars}, which this entry cannot be added back to`
      );
    }
  }
  return out;
}
function formatViolations(violations) {
  return violations.map((v) => `${v.code}  ${v.where}
    bound:    ${v.invariant}
    observed: ${v.observed}`).join("\n");
}

// src/bin/ursa.ts
init_resolve_episode();
init_resolve_episode();
function renderRunSummary(records, episodes, diagnostics) {
  const lines = [];
  let verbatim = 0, mutated = 0, written = 0, traced = 0, claimed = 0;
  let humanDeleted = 0, mergeDeleted = 0, unknownDeleted = 0;
  for (const r of records) {
    verbatim += r.stats.byClass.survived_verbatim.chars;
    mutated += r.stats.byClass.survived_mutated.chars;
    written += r.stats.generated.charsWritten;
    traced += r.stats.generated.totalChars;
    claimed += r.stats.generated.verbatimClaimedChars;
    humanDeleted += r.stats.generated.humanDeletedChars;
    mergeDeleted += r.stats.generated.mergeDeletedChars;
    unknownDeleted += r.stats.generated.unknownDeletedChars;
  }
  lines.push(`${episodes.length} work unit${episodes.length === 1 ? "" : "s"} found, ${records.length} resolved into record${records.length === 1 ? "" : "s"}.`);
  lines.push(`${verbatim.toLocaleString()} chars survived your editing verbatim, ${mutated.toLocaleString()} survived edited.`);
  lines.push(`That's the part worth noticing: not what got written, what got kept.`);
  if (written > 0) {
    lines.push(`${written.toLocaleString()} chars were generated to get there, and ${claimed.toLocaleString()} of them reached the finished work unedited.`);
  }
  if (traced > 0 && humanDeleted > 0) {
    const pct = Math.round(humanDeleted / traced * 100);
    lines.push(`You discarded ${humanDeleted.toLocaleString()} chars of draft on the way, ${pct}% of the ${traced.toLocaleString()} whose fate this run could trace.`);
  }
  if (mergeDeleted > 0) {
    lines.push(`A further ${mergeDeleted.toLocaleString()} chars were destroyed by merges rather than by you, so they are not counted against you.`);
  }
  if (unknownDeleted > 0) {
    lines.push(`${unknownDeleted.toLocaleString()} more chars are gone with no readable cause, because a merge on the way could not be read from this clone. They are not counted against you either. Run git fetch and ursa run again to settle them.`);
  }
  const edited = records.filter((r) => r.stats.byClass.survived_mutated.chars > 0).length;
  if (edited > 0) lines.push(`${edited} record${edited === 1 ? "" : "s"} ${edited === 1 ? "carries" : "carry"} your corrections \u2014 the whys live there.`);
  const hosted = [...new Set(
    records.filter((r) => r.artifact.kind === "hosted" && r.artifact.renderRef).map((r) => r.artifact.renderRef)
  )];
  for (const url of hosted) {
    lines.push(`This work is also live at ${url}, so the records carry where to go and look at it.`);
  }
  const vendored = [...new Map(
    episodes.flatMap((e) => e.vendoredPaths ?? []).map((v) => [v.path, v])
  ).values()];
  if (vendored.length > 0) {
    const one = vendored[0];
    lines.push("");
    lines.push(
      `${vendored.length} file${vendored.length === 1 ? "" : "s"} came in whole from elsewhere and ${vendored.length === 1 ? "was" : "were"} not read as your work, starting with ${one.path}.`
    );
    lines.push(
      one.relation === "sibling" ? `It is byte-identical to its copy in commit ${one.sha} ("${one.subject}"), which is on a branch this work never contained, so it was brought in rather than written here.` : `It is byte-identical to the version already in commit ${one.sha} ("${one.subject}"), so this work left the file exactly as it found it.`
    );
    lines.push(
      `A file that arrives complete from another commit carries no correction of yours, so its spans were left unclassified rather than classified wrongly.`
    );
  }
  if (diagnostics) {
    const suppressed = diagnostics.authorFallbackSuppressed;
    if (suppressed) {
      const names = suppressed.authors.map((a) => `"${a}"`).join(", ");
      lines.push("");
      lines.push(`Every commit in this history is authored ${names}.`);
      lines.push(
        "That name matches the agent-identity pattern, so on its own it cannot tell a generated commit from one of yours, and it was set aside for this run. Only the Co-Authored-By trailer classified commits."
      );
      lines.push(
        "If your own commits really do carry that name, set a different one for them, or pass a narrower author pattern, and run again."
      );
    }
    if (episodes.length === 0) {
      const looked = diagnostics.generatedByTrailer + diagnostics.generatedByAuthorName;
      lines.push("");
      lines.push(
        `Scanned ${diagnostics.commitsScanned} commit${diagnostics.commitsScanned === 1 ? "" : "s"}. ${looked} looked generated (${diagnostics.generatedByTrailer} by trailer, ${diagnostics.generatedByAuthorName} by author name), and none of those was followed by an edit of the same file without an agent marker.`
      );
    }
    const { abandoned, bounds } = diagnostics;
    const dropped = abandoned.distance + abandoned.age + abandoned.interposedGeneration + abandoned.notDescendant;
    if (dropped > 0) {
      const why = [];
      if (abandoned.interposedGeneration > 0) {
        why.push(
          `${abandoned.interposedGeneration} had the same file rewritten by a later generation before you touched it, so your edit corrected that one and not this`
        );
      }
      if (abandoned.distance > 0) {
        why.push(
          `${abandoned.distance} found no edit within ${bounds.maxPairDistance} commits`
        );
      }
      if (abandoned.age > 0) {
        why.push(`${abandoned.age} found none within ${bounds.maxPairAgeHours} hours`);
      }
      if (abandoned.notDescendant > 0) {
        why.push(
          `${abandoned.notDescendant} were only edited on a branch that never contained them`
        );
      }
      lines.push("");
      lines.push(
        `${dropped} generation${dropped === 1 ? "" : "s"} were left out rather than guessed at: ${why.join("; ")}.`
      );
      lines.push(
        "Those are claims this run could not stand behind, so it did not make them. Raise --max-pair-distance, --max-pair-age-hours or --max-interposed-generations to see them anyway."
      );
    }
    if (diagnostics.mergeGenerationsRefused > 0) {
      lines.push("");
      lines.push(
        `${diagnostics.mergeGenerationsRefused} merge commit${diagnostics.mergeGenerationsRefused === 1 ? "" : "s"} carried an agent marker and were not counted as generations. A merge restates work other commits did; it wrote nothing of its own.`
      );
    }
  }
  const tested = records.reduce((n2, r) => n2 + (r.durability?.testedSpans ?? 0), 0);
  if (tested > 0) {
    let durable = 0, decayed = 0;
    for (const r of records) {
      durable += r.durability?.durableChars ?? 0;
      decayed += r.durability?.decayedChars ?? 0;
    }
    const pct = Math.round(decayed / (durable + decayed || 1) * 100);
    lines.push(`Of what you kept at the time, ${pct}% was gone by the latest commit.`);
    lines.push(`Surviving your first edit is not the same as surviving the work.`);
  }
  return lines.join("\n");
}
async function main(argv) {
  if (argv[0] === "consent") {
    const { runConsentCommand: runConsentCommand2 } = await Promise.resolve().then(() => (init_consent_cli(), consent_cli_exports));
    return runConsentCommand2(argv.slice(1));
  }
  if (argv[0] === "forget") {
    const { runForgetCommand: runForgetCommand2 } = await Promise.resolve().then(() => (init_consent_cli(), consent_cli_exports));
    return runForgetCommand2(argv.slice(1));
  }
  const { positionals, values } = (0, import_node_util.parseArgs)({
    args: argv,
    allowPositionals: true,
    options: {
      limit: { type: "string" },
      "min-chars": { type: "string" },
      "max-pair-distance": { type: "string" },
      "max-pair-age-hours": { type: "string" },
      "max-interposed-generations": { type: "string" },
      declare: { type: "string" },
      "sync-url": { type: "string" },
      session: { type: "string" },
      interval: { type: "string" },
      port: { type: "string" },
      repo: { type: "string" },
      event: { type: "string" },
      "run-url": { type: "string" },
      "no-post": { type: "boolean" }
    }
  });
  const [cmd, project] = positionals;
  if (cmd !== "run" && cmd !== "bridge" && cmd !== "ci" || !project) {
    console.error("Usage: ursa run <projectPath> [--limit N] [--min-chars N]");
    console.error("         pairing bounds: [--max-pair-distance N] [--max-pair-age-hours N] [--max-interposed-generations N]");
    console.error("       ursa bridge <projectPath> [--sync-url URL] [--session FILE] [--interval MS] [--port N]");
    console.error("       ursa consent show|grant|revoke|disclose|revoke-axiom <projectPath> [options]");
    console.error("       ursa forget <projectPath> --record <recordId>");
    console.error("       ursa ci <projectPath> --repo owner/name --event <eventPath> [--run-url URL] [--min-chars N] [--no-post]");
    return 2;
  }
  if (cmd === "ci") {
    const repo = values.repo ?? process.env.GITHUB_REPOSITORY;
    const eventPath = values.event ?? process.env.GITHUB_EVENT_PATH;
    const token = process.env.GITHUB_TOKEN ?? process.env.INPUT_GITHUB_TOKEN ?? "";
    if (!repo) {
      console.error("ursa ci needs --repo owner/name or GITHUB_REPOSITORY");
      return 2;
    }
    if (!eventPath) {
      console.error("ursa ci needs --event <path> or GITHUB_EVENT_PATH");
      return 2;
    }
    if (!token && values["no-post"] !== true) {
      console.error("ursa ci needs GITHUB_TOKEN to post the run comment; pass --no-post to print it instead");
      return 2;
    }
    const { runCi: runCi2 } = await Promise.resolve().then(() => (init_run(), run_exports));
    const result = await runCi2({
      projectPath: (0, import_node_path7.resolve)(project),
      eventPath,
      repo,
      token,
      apiBaseUrl: process.env.GITHUB_API_URL,
      runUrl: values["run-url"] ?? null,
      minChars: values["min-chars"] ? Number(values["min-chars"]) : void 0,
      post: values["no-post"] !== true
    });
    return result.exitCode;
  }
  if (cmd === "bridge") {
    const passphrase = process.env.URSA_PASSPHRASE ?? await promptHidden("passphrase (held in memory only): ");
    if (!passphrase) {
      console.error("a passphrase is required; it derives the key and the blob id");
      return 2;
    }
    const { startBridge: startBridge2 } = await Promise.resolve().then(() => (init_ursa_bridge_stub(), ursa_bridge_stub_exports));
    const handle = await startBridge2({
      projectPath: (0, import_node_path7.resolve)(project),
      passphrase,
      syncUrl: (values["sync-url"] ?? "https://ursa-overlay.vercel.app").replace(/\/$/, ""),
      session: values.session,
      intervalMs: values.interval ? Number(values.interval) : void 0,
      port: values.port ? Number(values.port) : void 0,
      allowOrigins: ["https://ursa-overlay.vercel.app"]
    });
    await new Promise((resolve2) => {
      process.on("SIGINT", () => {
        void handle.stop().then(resolve2);
      });
      process.on("SIGTERM", () => {
        void handle.stop().then(resolve2);
      });
    });
    return 0;
  }
  const projectPath = (0, import_node_path7.resolve)(project);
  const minChars = Number(values["min-chars"] ?? 200);
  const limit = values.limit ? Number(values.limit) : Infinity;
  let declaration = UNDECLARED;
  if (values.declare === "satisfied") {
    declaration = { accepted: true, basis: "owner-declared satisfied at launch (--declare satisfied)" };
  } else if (values.declare === "unsatisfied") {
    declaration = { accepted: false, basis: "owner-declared unsatisfied at launch (--declare unsatisfied): survived text is not endorsed, it is not-yet-fixed" };
  }
  const bound = (flag2) => {
    const raw = values[flag2];
    if (raw === void 0) return void 0;
    const n2 = Number(raw);
    if (!Number.isFinite(n2) && raw !== "Infinity") return void 0;
    return n2;
  };
  const { pairs, diagnostics } = findCommitPairsWithDiagnostics(projectPath, {
    maxPairDistance: bound("max-pair-distance"),
    maxPairAgeHours: bound("max-pair-age-hours"),
    maxInterposedGenerations: bound("max-interposed-generations")
  });
  const commits = listCommits(projectPath);
  const episodes = buildEpisodes(pairs, projectPath).slice(0, limit).map((ep) => ({
    ...ep,
    vendoredPaths: vendoredPaths(projectPath, ep, resolvablePaths(ep), commits)
  }));
  const { isForgotten: isForgotten2, loadConsent: loadConsent2 } = await Promise.resolve().then(() => (init_consent(), consent_exports));
  const consent = loadConsent2(projectPath);
  let suppressed = 0;
  const records = [];
  for (const ep of episodes) {
    if (isForgotten2(consent, ep.id)) {
      suppressed++;
      continue;
    }
    const record = resolveEpisode(projectPath, ep, commits);
    if (!record) continue;
    if (record.stats.generated.totalChars < minChars && (record.exclusions?.length ?? 0) === 0) continue;
    annotateDurability(projectPath, record, ep.finalSha, ep.closedAt);
    record.signals = deriveSignals(record, declaration);
    saveRecord(projectPath, record);
    records.push(record);
  }
  saveEpisodes(projectPath, episodes);
  if (records.length === 0 && suppressed > 0) {
    console.log(`${episodes.length} work unit${episodes.length === 1 ? "" : "s"} found, and ${suppressed === episodes.length ? "every one of them is" : `${suppressed} of them are`} erased. Nothing was rebuilt.`);
  } else {
    console.log(renderRunSummary(records, episodes, diagnostics));
    if (suppressed > 0) {
      console.log(`
${suppressed} work unit${suppressed === 1 ? "" : "s"} you erased stayed erased.`);
    }
  }
  console.log(`
Records: ${projectPath}/.ursa/records/`);
  const violations = records.flatMap((r) => checkRecord(r));
  if (violations.length > 0) {
    console.error(`
${violations.length} record invariant${violations.length === 1 ? "" : "s"} violated. The records are written and are still the evidence, but the numbers above cannot all be true at once, so this run is not reporting success.`);
    console.error(formatViolations(violations));
    return 1;
  }
  return 0;
}
function promptHidden(question) {
  return new Promise((resolve2) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      let buf = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (d) => {
        buf += d;
      });
      stdin.on("end", () => resolve2(buf.trim()));
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const onData = (ch) => {
      const c = ch.toString("utf8");
      if (c === "\n" || c === "\r" || c === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        process.stdout.write("\n");
        resolve2(value);
      } else if (c === "") {
        process.stdout.write("\n");
        process.exit(130);
      } else if (c === "\x7F") {
        value = value.slice(0, -1);
      } else {
        value += c;
      }
    };
    stdin.on("data", onData);
  });
}
var invokedDirectly = process.argv[1]?.endsWith("ursa.ts");
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

// src/bin/bundle-entry.ts
main(process.argv.slice(2)).then((code) => process.exit(code)).catch((err) => {
  console.error(`ursa: ${err.message}`);
  process.exit(1);
});
