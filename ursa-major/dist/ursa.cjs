#!/usr/bin/env node
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/pairfinder.ts
function git(repoPath, args) {
  return (0, import_node_child_process.execFileSync)("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
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
      parentCount: parents ? parents.split(" ").length : 0,
      trailers: trailers ?? "",
      subject: rest.join("	")
    };
  });
}
function commitFiles(repoPath, sha) {
  return git(repoPath, ["show", "--name-only", "--format=", sha]).split("\n").filter(Boolean);
}
function blobAt(repoPath, sha, path) {
  try {
    return git(repoPath, ["show", `${sha}:${path}`]);
  } catch {
    return null;
  }
}
function findCommitPairs(repoPath, opts = {}) {
  const trailerPattern = opts.agentTrailerPattern ?? DEFAULT_TRAILER;
  const authorPattern = opts.agentAuthorPattern ?? DEFAULT_AUTHOR;
  const commits = listCommits(repoPath, opts.range);
  const files = /* @__PURE__ */ new Map();
  const touched = (sha) => {
    if (!files.has(sha)) files.set(sha, commitFiles(repoPath, sha));
    return files.get(sha);
  };
  const marker = (c) => {
    if (trailerPattern.test(c.trailers)) return c.trailers;
    if (authorPattern.test(c.authorName)) return c.authorName;
    return null;
  };
  const pairs = [];
  for (let i = 0; i < commits.length; i++) {
    const gen = commits[i];
    const agentMarker = marker(gen);
    if (!agentMarker) continue;
    const genFiles = new Set(touched(gen.sha));
    if (genFiles.size === 0) continue;
    for (let j = i + 1; j < commits.length; j++) {
      const fin = commits[j];
      if (marker(fin)) continue;
      if (fin.parentCount > 1) continue;
      const overlap = touched(fin.sha).filter((p) => genFiles.has(p));
      if (overlap.length === 0) continue;
      pairs.push({
        generatedSha: gen.sha,
        finalSha: fin.sha,
        paths: overlap,
        generatedAuthor: gen.authorName,
        finalAuthor: fin.authorName,
        generatedAt: gen.date,
        finalAt: fin.date,
        agentMarker,
        subject: gen.subject
      });
      break;
    }
  }
  return pairs;
}
var import_node_child_process, DEFAULT_TRAILER, DEFAULT_AUTHOR;
var init_pairfinder = __esm({
  "src/pairfinder.ts"() {
    "use strict";
    import_node_child_process = require("node:child_process");
    DEFAULT_TRAILER = /claude|codex|cursor|gpt/i;
    DEFAULT_AUTHOR = /claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i;
  }
});

// src/signals.ts
function excerpt(text) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > MAX_EXCERPT ? t.slice(0, MAX_EXCERPT) + "\u2026" : t;
}
function deriveSignals(record, declaration = UNDECLARED) {
  const oneShotCorrections = [];
  for (const file of record.files) {
    for (const span of file.spans) {
      if (span.class !== "survived_mutated" || !span.diff || !span.source) continue;
      const agent = span.diff.filter((p) => !p.added).map((p) => p.value).join("");
      const hers = span.diff.filter((p) => !p.removed).map((p) => p.value).join("");
      if (!agent.trim() || !hers.trim()) continue;
      oneShotCorrections.push({
        step: span.source.turnIndex,
        text: `AGENT: ${excerpt(agent)}
FINAL: ${excerpt(hers)}`,
        domain: file.path
      });
    }
  }
  return {
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
    oneShotCorrections,
    notes: [
      "label-stage record (git commit pair): corrections appear once, as edits;",
      "recurrence and loops are unobservable without the chat trace."
    ]
  };
}
var MAX_EXCERPT, UNDECLARED;
var init_signals = __esm({
  "src/signals.ts"() {
    "use strict";
    MAX_EXCERPT = 220;
    UNDECLARED = {
      accepted: null,
      basis: "undeclared: no owner declaration surface was offered; retention is NOT acceptance"
    };
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
    distilled: false
  }));
}
var import_node_path;
var init_episodes = __esm({
  "src/episodes.ts"() {
    "use strict";
    import_node_path = require("node:path");
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
function segment(string, segmenter) {
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
  const segments = segment(string, segmenter);
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
          parts = segment(value, segmenter);
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

// src/segment.ts
function modeForPath(p) {
  return /\.(md|mdx|markdown|txt|tex)$/i.test(p) ? "prose" : "code";
}
function segment2(text, mode) {
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

// src/stats.ts
function computeStats(files, generations, conversations) {
  const byClass = Object.fromEntries(
    CLASSES.map((c) => [c, { spans: 0, chars: 0, pct: 0 }])
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
  for (const c of CLASSES) byClass[c].pct = coveredChars ? r3(byClass[c].chars / coveredChars) : 0;
  const generatedTotal = generations.reduce((a, g) => a + g.totalChars, 0);
  const generatedSurvived = generations.reduce((a, g) => a + g.survivedChars, 0);
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
      survivalRate: generatedChars ? r3(survivedChars / generatedChars) : 0,
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
        { chars, pctOfCovered: coveredChars ? r3(chars / coveredChars) : 0 }
      ])
    ),
    generated: {
      totalChars: generatedTotal,
      survivedChars: generatedSurvived,
      deletedChars: generatedTotal - generatedSurvived,
      deletedPct: generatedTotal ? r3((generatedTotal - generatedSurvived) / generatedTotal) : 0
    },
    perFile,
    perConversation
  };
}
var CLASSES, r3;
var init_stats = __esm({
  "src/stats.ts"() {
    "use strict";
    CLASSES = [
      "survived_verbatim",
      "survived_mutated",
      "no_generation_provenance"
    ];
    r3 = (x) => Math.round(x * 1e3) / 1e3;
  }
});

// src/resolve.ts
function resolve(input) {
  const gens = input.generations.map((g, i) => ({ ...g, generationIndex: i }));
  const preps = gens.map((gen) => {
    const mode = gen.filePath ? modeForPath(gen.filePath) : gen.kind === "assistant_text" ? "prose" : "code";
    const sentences = segment2(gen.text, mode).map((s) => {
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
    for (const s of segment2(f.text, mode)) {
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
          span = {
            ...base,
            class: "survived_mutated",
            score: r32(best.score),
            source: srcPtr(best.p, best.sent.start, best.sent.end),
            diff: diffWords(best.sent.text, s.text).map((d) => ({
              value: d.value,
              ...d.added ? { added: true } : {},
              ...d.removed ? { removed: true } : {}
            }))
          };
          addClaim(mutatedClaims, { genIndex: best.p.gen.generationIndex, start: best.sent.start, end: best.sent.end });
        } else if (best && best.score >= THETA_LOW) {
          span = {
            ...base,
            class: "no_generation_provenance",
            uncertain: true,
            candidate: { score: r32(best.score), text: best.sent.text, source: srcPtr(best.p, best.sent.start, best.sent.end) }
          };
        }
      }
      spans.push(span ?? { ...base, class: "no_generation_provenance" });
    }
    return { path: f.path, mode, text: f.text, spans: mergeVerbatimRuns(spans, f.text) };
  });
  const overlaps = (claims, s) => !!claims && claims.some((c) => c.start < s.end && c.end > s.start);
  const generations = preps.map((p) => {
    const gi = p.gen.generationIndex;
    const spans = p.sentences.map((gs) => {
      const v = overlaps(verbatimClaims.get(gi), gs);
      const m = !v && overlaps(mutatedClaims.get(gi), gs);
      const fate = v ? "survived_verbatim" : m ? "survived_mutated" : "generated_deleted";
      return { start: gs.start, end: gs.end, text: gs.text, fate };
    });
    const totalChars = spans.reduce((a, s) => a + (s.end - s.start), 0);
    const survivedChars = spans.filter((s) => s.fate !== "generated_deleted").reduce((a, s) => a + (s.end - s.start), 0);
    return {
      ...p.gen,
      spans,
      totalChars,
      survivedChars,
      survivalRate: totalChars ? r32(survivedChars / totalChars) : 0
    };
  });
  return {
    schemaVersion: "0.1.0",
    task: {
      id: input.taskId,
      finished: input.finished,
      generatedAt: input.generatedAt ?? (/* @__PURE__ */ new Date()).toISOString()
    },
    files,
    conversations: input.conversations,
    generations,
    stats: computeStats(files, generations, input.conversations)
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
var r32;
var init_resolve = __esm({
  "src/resolve.ts"() {
    "use strict";
    init_libesm();
    init_normalize();
    init_segment();
    init_match();
    init_stats();
    r32 = (x) => Math.round(x * 1e3) / 1e3;
  }
});

// src/resolve-episode.ts
function resolveEpisode(projectPath, ep) {
  const files = [];
  const generations = [];
  let turn = 0;
  for (const path of ep.touchedFiles) {
    if (!TEXT_EXTS.has((0, import_node_path2.extname)(path)) || SKIP_FILES.has(path.split("/").pop() ?? "")) continue;
    const genText = blobAt(projectPath, ep.generatedSha, path);
    const finText = blobAt(projectPath, ep.finalSha, path);
    if (genText === null || finText === null) continue;
    if (genText.length > MAX_BLOB_CHARS || finText.length > MAX_BLOB_CHARS) continue;
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
  if (files.length === 0 || generations.length === 0) return null;
  return resolve({
    taskId: ep.id,
    files,
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
    generatedAt: ep.closedAt
  });
}
var import_node_path2, TEXT_EXTS, SKIP_FILES, MAX_BLOB_CHARS;
var init_resolve_episode = __esm({
  "src/resolve-episode.ts"() {
    "use strict";
    import_node_path2 = require("node:path");
    init_pairfinder();
    init_resolve();
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
    MAX_BLOB_CHARS = 3e5;
  }
});

// src/store.ts
function ursaDir(projectRoot) {
  return (0, import_node_path3.join)(projectRoot, ".ursa");
}
function saveRecord(projectRoot, record) {
  const dir = (0, import_node_path3.join)(ursaDir(projectRoot), "records");
  (0, import_node_fs.mkdirSync)(dir, { recursive: true });
  const path = (0, import_node_path3.join)(dir, `${record.task.id}.json`);
  (0, import_node_fs.writeFileSync)(path, JSON.stringify(record, null, 2) + "\n");
  return path;
}
function saveEpisodes(projectRoot, episodes) {
  (0, import_node_fs.mkdirSync)(ursaDir(projectRoot), { recursive: true });
  const path = (0, import_node_path3.join)(ursaDir(projectRoot), "episodes.json");
  (0, import_node_fs.writeFileSync)(path, JSON.stringify(episodes, null, 2) + "\n");
  return path;
}
var import_node_fs, import_node_path3;
var init_store = __esm({
  "src/store.ts"() {
    "use strict";
    import_node_fs = require("node:fs");
    import_node_path3 = require("node:path");
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
var import_node_child_process2, VALID_KINDS, claudeRunner;
var init_distill = __esm({
  "src/tuning/distill.ts"() {
    "use strict";
    import_node_child_process2 = require("node:child_process");
    VALID_KINDS = /* @__PURE__ */ new Set([
      "correction-loop",
      "feedback-translation",
      "regression",
      "defensive-guardrail",
      "one-shot-correction",
      "episode"
    ]);
    claudeRunner = (prompt, model) => {
      const out = (0, import_node_child_process2.execFileSync)("claude", ["-p", "--model", model, "--output-format", "json"], {
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
  const headSha = pr.head?.sha;
  if (!baseSha || !headSha) throw new NotAMergedPullRequest("event payload carries no base.sha or head.sha");
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
      headSha,
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
    headSha,
    mergeCommitSha,
    style,
    range: `${baseSha}..${headSha}`,
    note: `${style === "merge-commit" ? "merge commit" : "merge style undetermined"}: window is the pull request's own commits, ${baseSha.slice(0, 7)}..${headSha.slice(0, 7)}`
  };
}
function parentCountOf(repoPath, sha) {
  try {
    const out = (0, import_node_child_process3.execFileSync)("git", ["-C", repoPath, "rev-list", "--parents", "-n", "1", sha], {
      encoding: "utf8"
    }).trim();
    return out.split(/\s+/).filter(Boolean).length - 1;
  } catch {
    return 0;
  }
}
function mergeWindowFromEvent(eventPath, repoPath) {
  const payload = JSON.parse((0, import_node_fs2.readFileSync)(eventPath, "utf8"));
  return mergeWindow(payload, { parentCountOf: (sha) => parentCountOf(repoPath, sha) });
}
var import_node_fs2, import_node_child_process3, NotAMergedPullRequest;
var init_window = __esm({
  "src/ci/window.ts"() {
    "use strict";
    import_node_fs2 = require("node:fs");
    import_node_child_process3 = require("node:child_process");
    NotAMergedPullRequest = class extends Error {
    };
  }
});

// src/ci/distill-mode.ts
function claudeOnPath() {
  try {
    (0, import_node_child_process4.execFileSync)("claude", ["--version"], { encoding: "utf8", timeout: 2e4, stdio: "pipe" });
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
var import_node_child_process4, CREDENTIAL_VARS;
var init_distill_mode = __esm({
  "src/ci/distill-mode.ts"() {
    "use strict";
    import_node_child_process4 = require("node:child_process");
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
function renderRunComment(f, ctx) {
  const lines = [RUN_COMMENT_MARKER, ""];
  lines.push(`**Ursa Major resolved this merge.** Pull request #${ctx.prNumber} in \`${ctx.repo}\`.`);
  lines.push("");
  lines.push(renderRunCommentFieldTable(f));
  lines.push("");
  lines.push(
    f.unitsResolved === 0 ? "Nothing resolved in this window. That is a reading, not a failure: no commit here carried an agent marker that a later human commit then edited." : "That's the part worth noticing: not what got written, what got kept."
  );
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
  for (const episode of episodes) {
    const record = resolveEpisode(opts.projectPath, episode);
    if (!record || record.stats.generated.totalChars < minChars) continue;
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
    recordsPath: (0, import_node_path4.join)(ursaDir(opts.projectPath), "records"),
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
  (0, import_node_fs3.appendFileSync)(path, renderStepOutputs(fields, commentUrl));
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
  (0, import_node_fs3.mkdirSync)(dir, { recursive: true });
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
  (0, import_node_fs3.appendFileSync)((0, import_node_path4.join)(dir, "acceptance.jsonl"), JSON.stringify(entry) + "\n");
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
  const tuningPath = (0, import_node_path4.join)(ursaDir(projectPath), "tuning.json");
  let tuning = (0, import_node_fs3.existsSync)(tuningPath) ? JSON.parse((0, import_node_fs3.readFileSync)(tuningPath, "utf8")) : emptyTuning("ci");
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
  (0, import_node_fs3.writeFileSync)(tuningPath, JSON.stringify(tuning, null, 2) + "\n");
  return base;
}
var import_node_fs3, import_node_path4, NO_PRIOR;
var init_run = __esm({
  "src/ci/run.ts"() {
    "use strict";
    import_node_fs3 = require("node:fs");
    import_node_path4 = require("node:path");
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
var import_node_path5 = require("node:path");
init_pairfinder();
init_signals();
init_episodes();
init_resolve_episode();
init_store();
init_resolve_episode();
function renderRunSummary(records, episodes) {
  const lines = [];
  let verbatim = 0, mutated = 0, generated = 0, deleted = 0;
  for (const r of records) {
    verbatim += r.stats.byClass.survived_verbatim.chars;
    mutated += r.stats.byClass.survived_mutated.chars;
    generated += r.stats.generated.totalChars;
    deleted += r.stats.generated.deletedChars;
  }
  lines.push(`${episodes.length} work units found, ${records.length} resolved into records.`);
  lines.push(`${verbatim.toLocaleString()} chars survived your editing verbatim, ${mutated.toLocaleString()} survived edited.`);
  lines.push(`That's the part worth noticing: not what got written, what got kept.`);
  if (generated > 0) {
    const pct = Math.round(deleted / generated * 100);
    lines.push(`${generated.toLocaleString()} chars were generated to get there; ${pct}% were drafts you discarded on the way.`);
  }
  const edited = records.filter((r) => r.stats.byClass.survived_mutated.chars > 0).length;
  if (edited > 0) lines.push(`${edited} record${edited === 1 ? "" : "s"} carry your corrections \u2014 the whys live there.`);
  return lines.join("\n");
}
async function main(argv) {
  const { positionals, values } = (0, import_node_util.parseArgs)({
    args: argv,
    allowPositionals: true,
    options: {
      limit: { type: "string" },
      "min-chars": { type: "string" },
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
    console.error("       ursa bridge <projectPath> [--sync-url URL] [--session FILE] [--interval MS] [--port N]");
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
      projectPath: (0, import_node_path5.resolve)(project),
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
      projectPath: (0, import_node_path5.resolve)(project),
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
  const projectPath = (0, import_node_path5.resolve)(project);
  const minChars = Number(values["min-chars"] ?? 200);
  const limit = values.limit ? Number(values.limit) : Infinity;
  let declaration = UNDECLARED;
  if (values.declare === "satisfied") {
    declaration = { accepted: true, basis: "owner-declared satisfied at launch (--declare satisfied)" };
  } else if (values.declare === "unsatisfied") {
    declaration = { accepted: false, basis: "owner-declared unsatisfied at launch (--declare unsatisfied): survived text is not endorsed, it is not-yet-fixed" };
  }
  const pairs = findCommitPairs(projectPath);
  const episodes = buildEpisodes(pairs, projectPath).slice(0, limit);
  const records = [];
  for (const ep of episodes) {
    const record = resolveEpisode(projectPath, ep);
    if (!record || record.stats.generated.totalChars < minChars) continue;
    record.signals = deriveSignals(record, declaration);
    saveRecord(projectPath, record);
    records.push(record);
  }
  saveEpisodes(projectPath, episodes);
  console.log(renderRunSummary(records, episodes));
  console.log(`
Records: ${projectPath}/.ursa/records/`);
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
