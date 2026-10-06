// Self-contained viewer: one portable HTML file with the record inlined.
// The ownership surface — "here is what AI actually contributed to your work."
// Class identity never rides on color alone: mutated is underlined, human text
// is italic, deleted is struck through; colors are the validated dark palette.
//
// Navigation contract (sprint 2026-09-21 item 3): from any classified span the
// reader reaches two things without leaving the page — the generation that
// produced it, opened and highlighted at the exact source range, and the user's
// own words that elicited that generation. A span with neither says so in words
// rather than showing an empty panel.

import type { OutcomeRecord } from './types'
import { elicitingPrompts } from './audit'

export function renderViewer(record: OutcomeRecord): string {
  const json = JSON.stringify(record).replace(/</g, '\\u003c')
  // eliciting prompt per generationIndex, resolved once here so the browser and
  // the audit agree on the same rule instead of each having their own
  const elicited = JSON.stringify(elicitingPrompts(record)).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Outcome Record — ${escapeHtml(record.task.id)}</title>
<style>
  :root {
    color-scheme: dark;
    --surface-1: #1a1a19;
    --surface-2: #232322;
    --surface-3: #2c2c2a;
    --border: #3a3a37;
    --text-primary: #ffffff;
    --text-secondary: #c3c2b7;
    --text-muted: #8a897e;
    --verbatim: #199e70;
    --mutated: #d95926;
    --human: #3987e5;
    --deleted: #7a7a72;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    background: var(--surface-1);
    color: var(--text-primary);
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    padding: 32px clamp(16px, 4vw, 56px) 80px;
  }
  header .wordmark {
    font-size: 12px; letter-spacing: 0.32em; color: var(--text-muted);
    text-transform: uppercase;
  }
  header h1 { font-size: 26px; font-weight: 600; margin: 6px 0 2px; }
  header .meta { color: var(--text-secondary); font-size: 13px; }
  header .meta .chip {
    display: inline-block; border: 1px solid var(--border); border-radius: 99px;
    padding: 1px 10px; margin-left: 8px; font-size: 12px; color: var(--text-secondary);
  }
  header .meta .chip a { color: inherit; text-decoration: underline; }
  .tiles { display: flex; flex-wrap: wrap; gap: 12px; margin: 26px 0 14px; }
  .tile {
    background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px 16px; min-width: 168px; flex: 0 1 auto;
  }
  .tile .label { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 7px; }
  .tile .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .tile .value { font-size: 24px; font-weight: 650; margin-top: 3px; }
  .tile .sub { font-size: 12px; color: var(--text-muted); }
  .distbar { display: flex; height: 14px; border-radius: 4px; overflow: hidden; gap: 2px; background: var(--surface-1); margin: 6px 0 10px; }
  .distbar div { height: 100%; }
  .legend { display: flex; flex-wrap: wrap; gap: 18px; font-size: 13px; color: var(--text-secondary); margin-bottom: 26px; }
  .legend .sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 6px; vertical-align: baseline; }
  nav.tabs { display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid var(--border); margin-bottom: 18px; }
  nav.tabs button {
    background: none; border: none; border-bottom: 2px solid transparent;
    color: var(--text-secondary); font: inherit; font-size: 13px; padding: 8px 12px; cursor: pointer;
  }
  nav.tabs button.active { color: var(--text-primary); border-bottom-color: var(--human); }
  pre.doc {
    background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px;
    padding: 18px 20px; overflow-x: auto; white-space: pre-wrap; word-break: break-word;
    font: 12.5px/1.6 ui-monospace, "SF Mono", Menlo, monospace; color: var(--text-muted);
  }
  pre.doc .sp { cursor: default; border-radius: 2px; }
  pre.doc .sp:hover { outline: 1px solid var(--border); background: var(--surface-3); }
  .c-verbatim { color: var(--verbatim); }
  .c-mutated { color: var(--mutated); text-decoration: underline dotted; text-underline-offset: 3px; }
  .c-human { color: var(--human); font-style: italic; }
  .c-uncertain { text-decoration: underline dashed; text-underline-offset: 3px; }
  .c-trivial { opacity: 0.72; }
  .c-deleted { color: var(--deleted); text-decoration: line-through; }
  #inspector {
    position: fixed; right: 20px; bottom: 20px; width: min(430px, 90vw);
    max-height: 46vh; overflow: auto; background: var(--surface-3);
    border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px;
    font-size: 12.5px; color: var(--text-secondary); display: none;
    box-shadow: 0 10px 34px rgba(0,0,0,0.5);
  }
  #inspector h3 { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
  #inspector .diff ins { color: var(--human); background: none; text-decoration: none; font-style: italic; }
  #inspector .diff del { color: var(--deleted); text-decoration: line-through; }
  #inspector pre { white-space: pre-wrap; word-break: break-word; font: 11.5px/1.5 ui-monospace, Menlo, monospace; }
  details.gen { border: 1px solid var(--border); border-radius: 10px; margin-bottom: 10px; background: var(--surface-2); }
  details.gen summary { padding: 10px 14px; cursor: pointer; font-size: 13px; color: var(--text-secondary); }
  details.gen summary b { color: var(--text-primary); font-weight: 600; }
  details.gen pre.doc { border: none; border-top: 1px solid var(--border); border-radius: 0 0 10px 10px; margin: 0; }
  .survbar { display: inline-block; width: 90px; height: 7px; border-radius: 3px; background: var(--surface-1); vertical-align: middle; margin: 0 6px; overflow: hidden; }
  .survbar div { height: 100%; background: var(--verbatim); }
  h2.conv { font-size: 15px; margin: 22px 0 10px; color: var(--text-primary); }
  h2.conv .sub { color: var(--text-muted); font-weight: 400; font-size: 12.5px; }
  table.stats { border-collapse: collapse; font-size: 13px; width: 100%; max-width: 900px; }
  table.stats th, table.stats td { text-align: left; padding: 7px 12px; border-bottom: 1px solid var(--border); }
  table.stats th { color: var(--text-muted); font-weight: 500; font-size: 12px; }
  table.stats td { color: var(--text-secondary); }
  table.stats td:first-child { color: var(--text-primary); }
  .num { font-variant-numeric: tabular-nums; }
  .panel { display: none; }
  .panel.active { display: block; }
  .filenote { font-size: 12.5px; color: var(--text-muted); margin: 0 0 8px; }
  .prompt {
    border-left: 2px solid var(--human); background: var(--surface-2);
    border-radius: 0 8px 8px 0; padding: 9px 13px; margin: 0 0 10px;
  }
  .prompt .who { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
  .prompt p { color: var(--text-secondary); font-size: 13px; white-space: pre-wrap; margin-top: 3px; }
  button.jump {
    margin-top: 9px; background: var(--surface-2); color: var(--text-primary);
    border: 1px solid var(--border); border-radius: 7px; font: inherit; font-size: 12px;
    padding: 5px 11px; cursor: pointer;
  }
  button.jump:hover { border-color: var(--human); color: var(--human); }
  .nolink { color: var(--text-muted); margin-top: 6px; }
  pre.doc .hl {
    background: rgba(57, 135, 229, 0.26);
    box-shadow: inset 0 0 0 1px var(--human); border-radius: 2px;
  }
</style>
</head>
<body>
<script id="record" type="application/json">${json}</script>
<script id="elicited" type="application/json">${elicited}</script>
<header>
  <div class="wordmark">Ursa Major ✦ provenance-resolved outcome record</div>
  <h1 id="title"></h1>
  <div class="meta" id="meta"></div>
</header>
<div class="tiles" id="tiles"></div>
<div class="distbar" id="distbar"></div>
<div class="legend" id="legend"></div>
<nav class="tabs" id="tabs"></nav>
<div id="panels"></div>
<aside id="inspector"></aside>
<script>
(function () {
  var R = JSON.parse(document.getElementById('record').textContent);
  // ELICITED[generationIndex] = the user prompt that produced that generation, or null
  var ELICITED = JSON.parse(document.getElementById('elicited').textContent);
  // generationIndex → function(sourcePointer) that opens that generation and
  // highlights the source range. Declared here because the tab loop below builds
  // the Generations panel, which fills it, before any span can call openGeneration.
  var genBuilders = {};
  var COLORS = { survived_verbatim: 'var(--verbatim)', survived_mutated: 'var(--mutated)', no_generation_provenance: 'var(--human)' };
  var LABELS = { survived_verbatim: 'Survived verbatim', survived_mutated: 'Survived mutated', no_generation_provenance: 'No generation provenance', generated_deleted: 'Generated, deleted' };
  var CLS = { survived_verbatim: 'c-verbatim', survived_mutated: 'c-mutated', no_generation_provenance: 'c-human', generated_deleted: 'c-deleted' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function pct(x) { return (x * 100).toFixed(1) + '%'; }

  // header
  document.getElementById('title').textContent = R.task.id;
  var meta = document.getElementById('meta');
  meta.textContent = 'generated ' + R.task.generatedAt.slice(0, 10) + ' · ' + R.files.length + ' files · ' + R.generations.length + ' generations · ' + R.conversations.length + ' conversation' + (R.conversations.length === 1 ? '' : 's');
  meta.appendChild(el('span', 'chip', R.task.finished ? 'finished' : 'abandoned'));
  // What kind of finished thing this record is about. Spelled out rather than
  // abbreviated, because 'hosted' alone is a bare term to anyone outside Ursa.
  var ARTIFACT_KINDS = {
    chat: 'chat trace: the finished work is the conversation',
    repo: 'repository: the finished work is versioned source',
    hosted: 'hosted: the finished work is served at a URL',
    visual: 'visual: the finished work was judged by eye'
  };
  var art = R.artifact || { kind: 'chat' };
  meta.appendChild(el('span', 'chip', ARTIFACT_KINDS[art.kind] || art.kind));
  if (art.renderRef) {
    var ref = el('span', 'chip');
    ref.appendChild(document.createTextNode('rendered at '));
    // Deliberately not a regex literal. This entire function body is one
    // JavaScript template literal (the one opened by renderViewer's return),
    // so a backslash written here is consumed by the template and never
    // reaches the emitted script: /^https?:\\/\\//i arrives in the HTML as
    // /^https?:///i, which is a SyntaxError, and one SyntaxError anywhere in
    // this script means the browser runs none of it and the viewer renders as
    // an empty shell. Scheme matching by string comparison needs no escape.
    var scheme = art.renderRef.toLowerCase();
    if (scheme.indexOf('http://') === 0 || scheme.indexOf('https://') === 0) {
      var a = el('a', '', art.renderRef);
      a.href = art.renderRef;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      ref.appendChild(a);
    } else {
      ref.appendChild(document.createTextNode(art.renderRef));
    }
    meta.appendChild(ref);
  }

  // tiles
  var tiles = document.getElementById('tiles');
  ['survived_verbatim', 'survived_mutated', 'no_generation_provenance'].forEach(function (c) {
    var s = R.stats.byClass[c];
    var t = el('div', 'tile');
    var lab = el('div', 'label');
    var dot = el('span', 'dot'); dot.style.background = COLORS[c];
    lab.appendChild(dot); lab.appendChild(document.createTextNode(LABELS[c]));
    t.appendChild(lab);
    t.appendChild(el('div', 'value num', pct(s.pct)));
    t.appendChild(el('div', 'sub num', fmt(s.chars) + ' chars · ' + fmt(s.spans) + ' spans'));
    tiles.appendChild(t);
  });
  var g = R.stats.generated;
  var t = el('div', 'tile');
  var lab = el('div', 'label');
  var dot = el('span', 'dot'); dot.style.background = 'var(--deleted)';
  lab.appendChild(dot); lab.appendChild(document.createTextNode(LABELS.generated_deleted));
  t.appendChild(lab);
  // Headline the human's own discard, not the gross figure. A merge can
  // destroy generated text with nobody reading it, and that is not a
  // discard; it is reported on its own line so the tile is not a claim
  // about the reader that the record cannot support.
  t.appendChild(el('div', 'value num', pct(g.humanDeletedPct)));
  t.appendChild(el('div', 'sub num', fmt(g.humanDeletedChars) + ' of ' + fmt(g.totalChars) + ' generated chars'));
  if (g.mergeDeletedChars > 0) {
    t.appendChild(el('div', 'sub num', '+ ' + fmt(g.mergeDeletedChars) + ' chars destroyed by a merge, not by you'));
  }
  // A third line only when there is something to say. The record can tell
  // the text is gone and cannot tell what took it, and showing that as part
  // of the discard figure would be the tile claiming more than it knows.
  if (g.unknownDeletedChars > 0) {
    t.appendChild(el('div', 'sub num', '+ ' + fmt(g.unknownDeletedChars) + ' chars gone with no readable cause'));
  }
  tiles.appendChild(t);

  // distribution bar over covered chars
  var bar = document.getElementById('distbar');
  ['survived_verbatim', 'survived_mutated', 'no_generation_provenance'].forEach(function (c) {
    var seg = el('div');
    seg.style.width = (R.stats.byClass[c].pct * 100) + '%';
    seg.style.background = COLORS[c];
    seg.title = LABELS[c] + ' ' + pct(R.stats.byClass[c].pct);
    bar.appendChild(seg);
  });

  // legend
  var legend = document.getElementById('legend');
  [['survived_verbatim', 'kept unchanged'], ['survived_mutated', 'kept, edited (dotted underline)'], ['no_generation_provenance', 'no model was in the running (italic)'], ['generated_deleted', 'produced, not in the final work (struck; hover a span for whether you dropped it or a merge did)']].forEach(function (pair) {
    var item = el('span');
    var sw = el('span', 'sw');
    sw.style.background = pair[0] === 'generated_deleted' ? 'var(--deleted)' : COLORS[pair[0]];
    item.appendChild(sw);
    item.appendChild(document.createTextNode(LABELS[pair[0]] + ' — ' + pair[1]));
    legend.appendChild(item);
  });
  if (R.stats.uncertainSpans > 0) {
    legend.appendChild(el('span', '', 'dashed underline = uncertain (' + R.stats.uncertainSpans + ' spans need adjudication)'));
  }

  // inspector
  var inspector = document.getElementById('inspector');
  function convTitle(id) {
    for (var i = 0; i < R.conversations.length; i++) if (R.conversations[i].id === id) return R.conversations[i].title;
    return id;
  }
  function showSpan(span) {
    inspector.innerHTML = '';
    inspector.style.display = 'block';
    var h = el('h3', '', LABELS[span.class] + (span.uncertain ? ' · uncertain' : '') + (span.trivial ? ' · trivial match' : ''));
    h.style.color = COLORS[span.class];
    inspector.appendChild(h);
    var src = span.source || (span.candidate && span.candidate.source);
    if (span.score !== undefined) inspector.appendChild(el('div', 'num', 'score ' + span.score));
    if (span.candidate) inspector.appendChild(el('div', 'num', 'best rejected candidate · score ' + span.candidate.score));
    // Why it was rejected. Without this a demoted span shows a 0.948
    // candidate and no account of why it is not a match, which reads as
    // the resolver being coy about a near-certainty. The user can always
    // see what was inferred about them (CLAUDE.md §2), and "a commit you
    // did not write already contained this text" is the inference.
    if (span.descent && span.descent.basis === 'rival') {
      var rel = span.descent.relation === 'pre_existing'
        ? 'an earlier commit this generation replaced'
        : 'a branch this generation is not an ancestor of';
      inspector.appendChild(el('div', 'nolink',
        'Not counted as your edit: this exact text is already in commit ' + span.descent.sha
        + ' ("' + span.descent.subject + '"), ' + rel
        + '. You did not reach it by editing the generation above.'));
    }
    if (span.descent && span.descent.basis === 'unverified') {
      inspector.appendChild(el('div', 'nolink',
        'This edit was not checked against the rest of the history ('
        + span.descent.reason.replace(/_/g, ' ') + '), so the label stands unguarded.'));
    }
    if (src) {
      inspector.appendChild(el('div', '', convTitle(src.conversationId) + ' · turn ' + src.turnIndex + ' · ' + src.model));
      var gen = R.generations[src.generationIndex];
      if (gen && gen.filePath) inspector.appendChild(el('div', '', gen.kind + ' → ' + gen.filePath));
      if (gen) {
        var btn = el('button', 'jump', 'Show this generation, highlighted ↓');
        btn.addEventListener('click', function (ev) { ev.stopPropagation(); openGeneration(src); });
        inspector.appendChild(btn);
      } else {
        inspector.appendChild(el('div', 'nolink', 'This pointer names generation ' + src.generationIndex + ', which is not in this record.'));
      }
      var prompt = ELICITED[src.generationIndex];
      var ph = el('h3', '', 'What the user asked for'); ph.style.marginTop = '10px';
      inspector.appendChild(ph);
      if (prompt) {
        inspector.appendChild(el('pre', '', prompt.text));
      } else {
        inspector.appendChild(el('div', 'nolink', 'No user prompt was captured before turn ' + src.turnIndex + ' in this conversation.'));
      }
    } else {
      inspector.appendChild(el('div', 'nolink', 'No generation in this record produced this text, and nothing scored above the floor. It entered the work outside the model loop.'));
    }
    if (span.diff) {
      var dh = el('h3', '', 'Mutation (generation → final)');
      dh.style.marginTop = '10px';
      inspector.appendChild(dh);
      var d = el('pre', 'diff');
      span.diff.forEach(function (part) {
        var node;
        if (part.added) node = document.createElement('ins');
        else if (part.removed) node = document.createElement('del');
        else node = document.createElement('span');
        node.textContent = part.value;
        d.appendChild(node);
      });
      inspector.appendChild(d);
    } else if (span.candidate) {
      var ch = el('h3', '', 'Candidate text'); ch.style.marginTop = '10px';
      inspector.appendChild(ch);
      inspector.appendChild(el('pre', '', span.candidate.text));
    }
  }
  document.addEventListener('click', function (ev) {
    if (!inspector.contains(ev.target) && !(ev.target.classList && ev.target.classList.contains('sp'))) {
      inspector.style.display = 'none';
    }
  });

  // render one text + spans into a <pre>
  function renderDoc(text, spans, fateMode, highlight) {
    var pre = el('pre', 'doc');
    var cursor = 0;
    spans.forEach(function (span) {
      if (span.start > cursor) pre.appendChild(document.createTextNode(text.slice(cursor, span.start)));
      var lit = highlight && span.start < highlight.end && span.end > highlight.start;
      var cls = 'sp ' + CLS[fateMode ? span.fate : span.class]
        + (span.uncertain ? ' c-uncertain' : '') + (span.trivial ? ' c-trivial' : '')
        + (lit ? ' hl' : '');
      var node = el('span', cls, text.slice(span.start, span.end));
      // In the generations panel a deleted span says which kind of
      // deletion it was, so the struck text is never read as a discard
      // the person made when a merge is what destroyed it.
      if (fateMode && span.deletion) {
        node.title = span.deletion.cause === 'merge'
          ? 'destroyed by merge ' + span.deletion.mergeSha + ' (' + span.deletion.mergeSubject + '), not dropped by you'
          : 'you had this and did not keep it';
      }
      if (!fateMode) {
        node.addEventListener('mouseenter', function () { showSpan(span); });
        node.addEventListener('click', function (ev) { ev.stopPropagation(); showSpan(span); });
      }
      pre.appendChild(node);
      cursor = span.end;
    });
    if (cursor < text.length) pre.appendChild(document.createTextNode(text.slice(cursor)));
    return pre;
  }

  // tabs + panels
  var tabs = document.getElementById('tabs');
  var panels = document.getElementById('panels');
  var entries = [];
  R.files.forEach(function (f) { entries.push({ label: f.path, build: function (p) { buildFilePanel(p, f); } }); });
  var genTab = entries.length;
  entries.push({ label: 'Generations', build: buildGenerationsPanel });
  entries.push({ label: 'Sessions', build: buildSessionsPanel });
  if (R.signals) entries.push({ label: 'Signals', build: buildSignalsPanel });
  var tabButtons = [];
  var tabPanels = [];
  function activateTab(i) {
    tabButtons.forEach(function (x, j) { x.classList.toggle('active', i === j); });
    tabPanels.forEach(function (x, j) { x.classList.toggle('active', i === j); });
  }
  entries.forEach(function (e, i) {
    var b = el('button', i === 0 ? 'active' : '', e.label);
    var p = el('div', 'panel' + (i === 0 ? ' active' : ''));
    b.addEventListener('click', function () { activateTab(i); });
    tabButtons.push(b);
    tabPanels.push(p);
    tabs.appendChild(b);
    panels.appendChild(p);
    e.build(p);
  });

  // span → generation: open the Generations tab at the exact source range
  function openGeneration(src) {
    var open = genBuilders[src.generationIndex];
    if (!open) return;
    activateTab(genTab);
    open(src);
  }

  function buildFilePanel(panel, f) {
    var st = null;
    for (var i = 0; i < R.stats.perFile.length; i++) if (R.stats.perFile[i].path === f.path) st = R.stats.perFile[i];
    if (st && st.coveredChars) {
      panel.appendChild(el('p', 'filenote num',
        'verbatim ' + pct(st.byClass.survived_verbatim / st.coveredChars)
        + ' · mutated ' + pct(st.byClass.survived_mutated / st.coveredChars)
        + ' · no provenance ' + pct(st.byClass.no_generation_provenance / st.coveredChars)));
    }
    panel.appendChild(renderDoc(f.text, f.spans, false));
  }

  function promptBlock(p) {
    var box = el('div', 'prompt');
    box.appendChild(el('div', 'who', 'user, before turn ' + (p.step + 1)));
    box.appendChild(el('p', '', p.text));
    return box;
  }

  function buildGenerationsPanel(panel) {
    R.conversations.forEach(function (conv) {
      var gens = R.generations.filter(function (g) { return g.conversationId === conv.id; });
      var prompts = conv.prompts || [];
      if (!gens.length && !prompts.length) return;
      var h = el('h2', 'conv');
      h.appendChild(document.createTextNode(conv.title + ' '));
      h.appendChild(el('span', 'sub', conv.id.slice(0, 8) + ' · ' + gens.length + ' generations · ' + prompts.length + ' user prompts'));
      panel.appendChild(h);

      // one timeline: a prompt at step N sits ahead of the turn it produced (N+1)
      var items = [];
      prompts.forEach(function (p) { items.push({ order: p.step + 0.5, prompt: p }); });
      gens.forEach(function (g) { items.push({ order: g.turnIndex, gen: g }); });
      items.sort(function (a, b) { return a.order - b.order; });

      items.forEach(function (item) {
        if (item.prompt) { panel.appendChild(promptBlock(item.prompt)); return; }
        var gen = item.gen;
        var d = el('details', 'gen');
        var s = document.createElement('summary');
        var head = document.createElement('b');
        head.textContent = 'turn ' + gen.turnIndex + ' · ' + gen.kind + (gen.filePath ? ' · ' + shortPath(gen.filePath) : '');
        s.appendChild(head);
        var barWrap = el('span', 'survbar');
        var barFill = el('div');
        barFill.style.width = (gen.survivalRate * 100) + '%';
        barWrap.appendChild(barFill);
        s.appendChild(barWrap);
        s.appendChild(el('span', 'num', pct(gen.survivalRate) + ' survived · ' + fmt(gen.totalChars) + ' chars · ' + gen.model));
        d.appendChild(s);
        var body = null;
        function buildBody(highlight) {
          if (body) d.removeChild(body);
          body = renderDoc(gen.text, gen.spans, true, highlight);
          d.appendChild(body);
        }
        d.addEventListener('toggle', function () {
          if (d.open && !body) buildBody(null);
        });
        genBuilders[gen.generationIndex] = function (src) {
          d.open = true;
          buildBody(src);
          d.scrollIntoView({ block: 'center' });
        };
        panel.appendChild(d);
      });
    });
  }

  function shortPath(p) {
    var parts = p.split('/');
    return parts.slice(-3).join('/');
  }

  function buildSessionsPanel(panel) {
    var tbl = el('table', 'stats');
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    ['Conversation', 'Generations', 'Generated chars', 'Survived chars', 'Survival', 'Turns to acceptance'].forEach(function (h) { hr.appendChild(el('th', '', h)); });
    thead.appendChild(hr); tbl.appendChild(thead);
    var tb = document.createElement('tbody');
    R.stats.perConversation.forEach(function (c) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', '', c.title));
      tr.appendChild(el('td', 'num', fmt(c.generations)));
      tr.appendChild(el('td', 'num', fmt(c.generatedChars)));
      tr.appendChild(el('td', 'num', fmt(c.survivedChars)));
      tr.appendChild(el('td', 'num', pct(c.survivalRate)));
      tr.appendChild(el('td', 'num', c.turnsToAcceptance === null ? '—' : String(c.turnsToAcceptance)));
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    panel.appendChild(tbl);

    var h2 = el('h2', 'conv', 'By model');
    panel.appendChild(h2);
    var mt = el('table', 'stats');
    var mh = document.createElement('tr');
    ['Model', 'Chars in final', '% of covered'].forEach(function (h) { mh.appendChild(el('th', '', h)); });
    mt.appendChild(mh);
    Object.keys(R.stats.byModel).forEach(function (m) {
      var tr = document.createElement('tr');
      tr.appendChild(el('td', '', m));
      tr.appendChild(el('td', 'num', fmt(R.stats.byModel[m].chars)));
      tr.appendChild(el('td', 'num', pct(R.stats.byModel[m].pctOfCovered)));
      mt.appendChild(tr);
    });
    panel.appendChild(mt);
  }

  function table(panel, title, headers, rows) {
    if (!rows.length) return;
    panel.appendChild(el('h2', 'conv', title));
    var t = el('table', 'stats');
    var hr = document.createElement('tr');
    headers.forEach(function (h) { hr.appendChild(el('th', '', h)); });
    t.appendChild(hr);
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      row.forEach(function (cell) { tr.appendChild(el('td', '', String(cell))); });
      t.appendChild(tr);
    });
    panel.appendChild(t);
  }

  function buildSignalsPanel(panel) {
    var S = R.signals;
    var ep = S.episode;
    // three states, not two: null means the owner was never asked, which is
    // not the same claim as her declaring the work unacceptable.
    var verdict = ep.accepted === null ? 'UNDECLARED' : (ep.accepted ? 'ACCEPTED' : 'NOT ACCEPTED');
    var note = el('p', 'filenote',
      'Episode: ' + fmt(ep.steps) + ' steps · ' + fmt(ep.generations) + ' generations · ' + verdict
      + (ep.acceptanceStatedInChat ? ' (an acceptance was stated in chat, which is not a declaration)' : '')
      + ' · basis: ' + ep.acceptanceBasis
      + ' · labels: ' + S.method);
    panel.appendChild(note);

    table(panel, 'Correction loops (recurrence = agentic failure count)',
      ['Loop', 'Theme', 'Recurrences', 'Every prompt step', 'Opened → closed',
       'Resolution', 'Files it touched', 'Discovered spec'],
      S.correctionLoops.map(function (l) {
        return [l.id, l.theme, l.recurrences, (l.promptSteps || []).join(', '),
          l.openedStep + ' → ' + (l.closedStep === null ? 'not closed' : l.closedStep),
          l.resolution.replace('_', ' '), (l.targetFiles || []).join(', ') || '—',
          l.discoveredSpec];
      }));

    table(panel, 'Feedback → mechanism translations',
      ['Step', 'User said', 'Fault it turned out to be', 'Resolved by'],
      S.feedbackTranslations.map(function (t) {
        return [t.complaintStep, '“' + t.complaint + '”', t.mechanism, 'steps ' + t.resolvedBySteps.join(', ')];
      }));

    table(panel, 'Repair attempts, graded by the artifact',
      ['Loop', 'Strategy', 'Steps', 'Outcome', 'Evidence'],
      S.repairAttempts.map(function (a) {
        return [a.loopId, a.strategy, a.steps.join(', '), a.outcome.toUpperCase(), a.evidence];
      }));

    table(panel, 'Regressions (previously accepted state broken)',
      ['Reported at', 'What broke', 'User words'],
      S.regressions.map(function (g) {
        return [g.step, g.brokenState, '“' + g.evidence + '”'];
      }));

    table(panel, 'Defensive guardrails (trust scar tissue)',
      ['Step', 'Guardrail', 'Prior incident'],
      S.defensiveGuardrails.map(function (g) {
        return [g.step, '“' + g.text + '”', 'step ' + g.priorIncidentStep];
      }));

    table(panel, 'One-shot corrections (the stateable baseline)',
      ['Step', 'Correction', 'Domain'],
      S.oneShotCorrections.map(function (o) {
        return [o.step, '“' + o.text + '”', o.domain];
      }));

    (S.notes || []).forEach(function (n) { panel.appendChild(el('p', 'filenote', n)); });
  }
})();
</script>
</body>
</html>
`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
