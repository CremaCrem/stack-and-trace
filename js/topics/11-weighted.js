/* World 11 — Weighted graphs: Dijkstra, Bellman-Ford, Prim, Kruskal */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui, K = ST.kit;
  const W = 860, H = 440;
  const INF = Infinity;

  const GW = { v: 'w', name: 'Graph W (lesson)', directed: false, start: 'A', pos: { A: [8, 33], B: [38, 8], C: [38, 58], D: [72, 8], E: [72, 58] }, edges: 'A-B:4 A-C:2 B-C:1 B-D:5 C-D:8 C-E:7 D-E:3' };
  const GQ = { v: 'q', name: 'Graph Q (4 vertices)', directed: false, start: 'A', pos: { A: [15, 12], B: [80, 12], C: [15, 56], D: [80, 56] }, edges: 'A-B:5 A-C:2 B-D:3 C-D:4' };
  const GN = { v: 'n', name: 'Graph N (negative edge)', directed: true, start: 'S', pos: { S: [8, 33], A: [42, 8], B: [42, 58], C: [85, 8] }, edges: 'A->C:1 B->A:-4 S->A:2 S->B:5' };
  const GC = { v: 'c', name: 'Negative cycle', directed: true, start: 'A', pos: { A: [50, 6], B: [82, 58], C: [18, 58] }, edges: 'A->B:1 B->C:-3 C->A:1' };

  function fmt(d) { return d === INF ? '∞' : String(d); }
  function sp(pos) {
    const out = {};
    Object.keys(pos).forEach(function (v) { out[v] = [60 + pos[v][0] / 100 * (W - 120), 50 + pos[v][1] / 66 * (H - 100)]; });
    return out;
  }
  function eid(e) { return e.directed ? e.a + '>' + e.b : K.eid(e.a, e.b); }

  function draw(L, def, g, f, o) {
    const p = sp(def.pos);
    const nodes = g.verts.map(function (v) {
      return { id: v, x: p[v][0], y: p[v][1], label: v, r: 25, cls: (f.cls && f.cls[v]) || '', badge: f.badge && f.badge[v], badgeCls: f.badgeCls && f.badgeCls[v], ring: f.ring && f.ring[v] };
    });
    const edges = g.edges.map(function (e) {
      const id = eid(e);
      // two directed edges between the same pair would overlap: bend them
      return { id: id, a: e.a, b: e.b, w: e.w, dir: e.directed, cls: (f.ecls && f.ecls[id]) || (f.dimRest ? 'dim' : ''), wfs: 16 };
    });
    L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
  }

  function distTable(body, g, f, opts) {
    U.clear(body);
    opts = opts || {};
    const head = ['Vertex', 'dist'].concat(opts.prev ? ['via'] : []);
    const rows = g.verts.map(function (v) {
      const cls = f.hotV === v ? 'hot' : (f.final && f.final[v] ? 'done' : '');
      return [{ v: v, cls: cls }, { v: fmt(f.dist[v]), cls: 'num ' + cls }].concat(opts.prev ? [{ v: f.prev && f.prev[v] ? f.prev[v] : '—', cls: cls }] : []);
    });
    body.appendChild(ui.table(head, rows));
  }

  // ================================================================ Dijkstra
  function dijkstraFrames(def) {
    const g = K.graph(def);
    const F = [];
    const dist = {}, prev = {}, final = {};
    g.verts.forEach(function (v) { dist[v] = INF; });
    dist[def.start] = 0;
    const snap = function (extra) {
      const cls = {}, badge = {}, badgeCls = {}, ecls = {};
      g.verts.forEach(function (v) {
        badge[v] = fmt(dist[v]);
        badgeCls[v] = final[v] ? 'b-yellow' : '';
        if (final[v]) cls[v] = 'done';
      });
      Object.keys(prev).forEach(function (v) { const e = g.edges.filter(function (x) { return (x.a === prev[v] && x.b === v) || (!x.directed && x.b === prev[v] && x.a === v); })[0]; if (e) ecls[eid(e)] = 'path'; });
      return Object.assign({ cls: cls, badge: badge, badgeCls: badgeCls, ecls: ecls, dist: Object.assign({}, dist), prev: Object.assign({}, prev), final: Object.assign({}, final) }, extra);
    };
    F.push(snap({ cap: 'Start: dist[' + def.start + '] = **0**. Every other vertex = **∞** (not reached yet).' }));
    while (true) {
      const open = g.verts.filter(function (v) { return !final[v] && dist[v] < INF; });
      if (!open.length) break;
      open.sort(function (a, b) { return dist[a] - dist[b] || (a < b ? -1 : 1); });
      const u = open[0];
      const f0 = snap({ cap: 'Pick the closest unprocessed vertex: **' + u + '** (' + fmt(dist[u]) + ').', hotV: u, ask: { q: 'Which vertex does Dijkstra process next? Click it.', pick: u, among: g.verts.filter(function (v) { return !final[v]; }), answerText: u + ' (' + fmt(dist[u]) + ')' } });
      f0.cls[u] = 'cur';
      F.push(f0);
      g.adj[u].forEach(function (x) {
        const v = x.v, w = x.w;
        const cand = dist[u] + w;
        const e = g.edges.filter(function (y) { return (y.a === u && y.b === v) || (!y.directed && y.a === v && y.b === u); })[0];
        if (final[v]) {
          if (cand < dist[v]) {
            const f = snap({ cap: u + ' → ' + v + ': ' + dist[u] + ' + (' + w + ') = ' + cand + ' is smaller than ' + dist[v] + ', but **' + v + ' is already final**. Dijkstra will not change it ✗', hotV: v, mood: 'oops', wrong: true });
            f.cls[u] = 'cur'; f.cls[v] = 'bad'; f.ecls[eid(e)] = 'hot';
            F.push(f);
          }
          return;
        }
        const better = cand < dist[v];
        const old = dist[v];
        if (better) { dist[v] = cand; prev[v] = u; }
        const f = snap({ cap: u + ' → ' + v + ': ' + dist[u] + ' + ' + w + ' = ' + cand + (better ? (old === INF ? ' < ∞ → **dist[' + v + '] = ' + cand + '**.' : ' beats ' + old + ' → **dist[' + v + '] = ' + cand + '**.') : ', not better than ' + old + '. Keep ' + old + '.'), hotV: v, sound: better ? 'swap' : 'step',
          ask: old !== INF ? { q: u + ' → ' + v + ': ' + dist[u] + ' + ' + w + ' = ' + cand + '. Current dist[' + v + '] = ' + old + '. Update?', options: ['Yes, update to ' + cand, 'No, keep ' + old], answer: better ? 0 : 1 } : null });
        f.cls[u] = 'cur'; f.cls[v] = better ? 'wait' : f.cls[v];
        f.ecls[eid(e)] = better ? 'hot' : 'look';
        F.push(f);
      });
      final[u] = true;
      F.push(snap({ cap: '**' + u + '** is done. Its distance ' + fmt(dist[u]) + ' is final.', hotV: u, doneV: u }));
    }
    const bad = F.some(function (fr) { return fr.wrong; });
    F.push(snap({ cap: bad ? 'Dijkstra finished, but with a negative edge its answer can be **wrong**. Try Bellman-Ford on this graph.' : 'All done. Gold edges = the shortest routes from ' + def.start + '. Badges = final distances.', mood: bad ? 'oops' : 'happy', dimRest: !bad }));
    return { frames: F, g: g };
  }

  const DIJ_CODE = [
    'dist[start] = 0;  dist[others] = ∞;',
    'while (some vertex is not done) {',
    '  u = not-done vertex with smallest dist;',
    '  for each edge u → v with weight w:',
    '    if (dist[u] + w < dist[v])',
    '      dist[v] = dist[u] + w;   // relax',
    '  mark u as done;',
    '}'
  ];

  function dijkstraLab(root) {
    const L = ST.lab(root, { vb: [W, H], code: DIJ_CODE, codeTitle: 'DIJKSTRA (IDEA)', alt: 'Dijkstra shortest paths', minW: 600 });
    let def = GW;
    const sel = ui.select('GRAPH', [GW, GQ, GN].map(function (g) { return { v: g.v, label: g.name }; }), 'w', function (v) { def = [GW, GQ, GN].filter(function (g) { return g.v === v; })[0]; run(); });
    L.controls.appendChild(ui.row(sel.el));
    const tBody = L.panel('DIST TABLE', { before: true });
    let g = null;
    function render(f, i, o) {
      draw(L, def, g, f, o);
      distTable(tBody, g, f, { prev: true });
    }
    function run() { const r = dijkstraFrames(def); g = r.g; L.player.load(r.frames, render); }
    run();
    return L;
  }

  // ================================================================ Bellman-Ford
  function bellmanFrames(def) {
    const g = K.graph(def);
    const F = [];
    const dist = {};
    g.verts.forEach(function (v) { dist[v] = INF; });
    dist[def.start] = 0;
    const V = g.verts.length;
    const snap = function (extra) {
      const badge = {}, cls = {};
      g.verts.forEach(function (v) { badge[v] = fmt(dist[v]); });
      return Object.assign({ badge: badge, cls: cls, ecls: {}, dist: Object.assign({}, dist), edgeList: g.edges, hotE: null }, extra);
    };
    F.push(snap({ cap: 'Start: dist[' + def.start + '] = 0, others ∞. Relax **every edge**, ' + (V - 1) + ' times (V − 1). Then 1 extra check.' }));
    for (let pass = 1; pass <= V; pass++) {
      const check = pass === V;
      let changed = false;
      F.push(snap({ cap: check ? '**Check pass**: if any edge can still improve a distance, there is a **negative cycle**.' : '**Pass ' + pass + '** of ' + (V - 1) + '.', pass: pass }));
      for (let k = 0; k < g.edges.length; k++) {
        const e = g.edges[k];
        const id = eid(e);
        if (dist[e.a] === INF) {
          const f = snap({ cap: e.a + '→' + e.b + ': dist[' + e.a + '] is ∞ → skip.', pass: pass, hotE: k });
          f.ecls[id] = 'look';
          F.push(f);
          continue;
        }
        const cand = dist[e.a] + e.w;
        if (cand < dist[e.b]) {
          changed = true;
          if (check) {
            const f = snap({ cap: e.a + '→' + e.b + ': ' + dist[e.a] + ' + (' + e.w + ') = ' + cand + ' < ' + fmt(dist[e.b]) + '. It still improves → **negative cycle!** There is no shortest path.', pass: pass, hotE: k, mood: 'oops', cycle: true });
            f.ecls[id] = 'hot'; f.cls[e.b] = 'bad';
            F.push(f);
            return { frames: F, g: g };
          }
          const old = dist[e.b];
          dist[e.b] = cand;
          const f = snap({ cap: e.a + '→' + e.b + ': ' + dist[e.a] + ' + (' + e.w + ') = **' + cand + '**' + (old === INF ? ' < ∞' : ' beats ' + old) + '. Update.', pass: pass, hotE: k, sound: 'swap',
            ask: old !== INF ? { q: e.a + '→' + e.b + ': ' + dist[e.a] + ' + (' + e.w + ') = ' + cand + ' vs ' + old + '. Update?', options: ['Yes', 'No'], answer: 0 } : null });
          f.ecls[id] = 'hot'; f.cls[e.b] = 'cur';
          F.push(f);
        } else {
          const f = snap({ cap: e.a + '→' + e.b + ': ' + dist[e.a] + ' + (' + e.w + ') = ' + cand + ', not better than ' + fmt(dist[e.b]) + '.', pass: pass, hotE: k,
            ask: { q: e.a + '→' + e.b + ': ' + dist[e.a] + ' + (' + e.w + ') = ' + cand + ' vs ' + fmt(dist[e.b]) + '. Update?', options: ['Yes', 'No'], answer: 1 } });
          f.ecls[id] = 'look';
          F.push(f);
        }
      }
      if (check && !changed) {
        const fin = snap({ cap: 'No edge improves → **no negative cycle**. Final: ' + g.verts.map(function (v) { return v + ' = ' + fmt(dist[v]); }).join(', ') + '.', pass: pass, mood: 'happy' });
        g.verts.forEach(function (v) { fin.cls[v] = 'done'; });
        F.push(fin);
      }
    }
    return { frames: F, g: g };
  }

  function bellmanLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'Bellman-Ford', minW: 600 });
    let def = GN;
    const sel = ui.select('GRAPH', [GN, GC].map(function (g) { return { v: g.v, label: g.name }; }), 'n', function (v) { def = v === 'n' ? GN : GC; run(); });
    L.controls.appendChild(ui.row(sel.el));
    const eBody = L.panel('EDGE LIST (checked in this order)');
    const tBody = L.panel('DIST TABLE');
    let g = null;
    function render(f, i, o) {
      draw(L, def, g, f, o);
      U.clear(eBody);
      eBody.appendChild(h('div', { class: 'stats', style: 'margin-bottom:8px' }, ui.stat('PASS', f.pass ? (f.pass === g.verts.length ? 'CHECK' : f.pass + '/' + (g.verts.length - 1)) : '—')));
      eBody.appendChild(ui.table(['Edge', 'w'], g.edges.map(function (e) { return [e.a + ' → ' + e.b, { v: e.w, cls: 'num' }]; }), { rowCls: function (r, k) { return k === f.hotE ? 'hot' : ''; } }));
      distTable(tBody, g, f);
    }
    function run() { const r = bellmanFrames(def); g = r.g; L.player.load(r.frames, render); }
    run();
    return L;
  }

  // ================================================================ Prim
  function primFrames(def) {
    const g = K.graph(def);
    const F = [];
    const inT = {};
    const chosen = [];
    let total = 0;
    inT[def.start] = true;
    const snap = function (extra) {
      const cls = {}, ecls = {};
      g.verts.forEach(function (v) { if (inT[v]) cls[v] = 'done'; });
      chosen.forEach(function (e) { ecls[eid(e)] = 'tree'; });
      const cross = g.edges.filter(function (e) { return (inT[e.a] ? 1 : 0) + (inT[e.b] ? 1 : 0) === 1; }).sort(function (a, b) { return a.w - b.w; });
      return Object.assign({ cls: cls, ecls: ecls, cross: cross, total: total, tree: Object.keys(inT).sort() }, extra);
    };
    F.push(snap({ cap: 'Prim: start the tree at **' + def.start + '**. Look only at **crossing edges** (tree → outside).' }));
    while (Object.keys(inT).length < g.verts.length) {
      const s0 = snap({});
      if (!s0.cross.length) break;
      const best = s0.cross[0];
      const f1 = snap({ cap: 'Crossing edges: ' + s0.cross.map(function (e) { return e.a + '–' + e.b + ' ' + e.w; }).join(', ') + '. Cheapest: **' + best.a + '–' + best.b + ' (' + best.w + ')**.', best: best });
      s0.cross.forEach(function (e) { f1.ecls[eid(e)] = 'look'; });
      f1.ecls[eid(best)] = 'path';
      const opts = s0.cross.slice(0, 4).map(function (e) { return e.a + '–' + e.b + ' (' + e.w + ')'; });
      f1.ask = { q: 'Which crossing edge does Prim add next?', options: opts, answer: 0 };
      F.push(f1);
      const nv = inT[best.a] ? best.b : best.a;
      inT[nv] = true; chosen.push(best); total += best.w;
      const f2 = snap({ cap: 'Add ' + best.a + '–' + best.b + '. **' + nv + '** joins the tree. Total = ' + total + '.', sound: 'swap' });
      f2.cls[nv] = 'cur';
      F.push(f2);
    }
    F.push(snap({ cap: 'Done: ' + chosen.length + ' edges (V − 1). **MST total = ' + total + '**.', mood: 'happy', dimRest: true }));
    return { frames: F, g: g };
  }

  function primLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: "Prim's algorithm", minW: 600 });
    let def = GW;
    const sel = ui.select('GRAPH', [GW, GQ].map(function (g) { return { v: g.v, label: g.name }; }), 'w', function (v) { def = v === 'w' ? GW : GQ; run(); });
    L.controls.appendChild(ui.row(sel.el));
    const cBody = L.panel('CROSSING EDGES');
    const tBody = L.panel('TREE');
    let g = null;
    function render(f, i, o) {
      draw(L, def, g, f, o);
      U.clear(cBody);
      cBody.appendChild(f.cross.length ? ui.table(['Edge', 'w'], f.cross.map(function (e) { return [e.a + '–' + e.b, { v: e.w, cls: 'num' }]; }), { rowCls: function (r, k) { return f.best && k === 0 ? 'hot' : ''; } }) : h('p', { class: 'panel-note' }, 'None.'));
      U.clear(tBody);
      tBody.appendChild(ui.strip(f.tree.map(function (v) { return { v: v, cls: 'done' }; })));
      tBody.appendChild(h('div', { class: 'stats', style: 'margin-top:8px' }, ui.stat('TOTAL', f.total)));
    }
    function run() { const r = primFrames(def); g = r.g; L.player.load(r.frames, render); }
    run();
    return L;
  }

  // ================================================================ Kruskal
  function kruskalFrames(def) {
    const g = K.graph(def);
    const F = [];
    const parent = {};
    g.verts.forEach(function (v) { parent[v] = v; });
    const find = function (x) { while (parent[x] !== x) x = parent[x]; return x; };
    const groups = function () {
      const m = {};
      g.verts.forEach(function (v) { const r = find(v); (m[r] = m[r] || []).push(v); });
      return Object.keys(m).map(function (k) { return m[k].sort().join(' '); }).sort();
    };
    const sorted = g.edges.slice().sort(function (a, b) { return a.w - b.w || (eid(a) < eid(b) ? -1 : 1); });
    const status = {};
    const chosen = [];
    let total = 0;
    const snap = function (extra) {
      const ecls = {};
      chosen.forEach(function (e) { ecls[eid(e)] = 'tree'; });
      Object.keys(status).forEach(function (id) { if (status[id] === 'CYCLE ✗') ecls[id] = 'dim dash'; });
      return Object.assign({ cls: {}, ecls: ecls, sorted: sorted, status: Object.assign({}, status), groups: groups(), total: total, hotK: -1 }, extra);
    };
    F.push(snap({ cap: 'Kruskal: sort **all edges** from cheapest to most expensive. Every vertex starts in its own group.' }));
    for (let k = 0; k < sorted.length; k++) {
      const e = sorted[k];
      const id = eid(e);
      if (chosen.length === g.verts.length - 1) {
        for (let j = k; j < sorted.length; j++) status[eid(sorted[j])] = 'not needed';
        break;
      }
      const ra = find(e.a), rb = find(e.b);
      const opts = ['Add it', 'Skip it (cycle)'];
      if (ra === rb) {
        status[id] = 'CYCLE ✗';
        const f = snap({ cap: e.a + '–' + e.b + ' (' + e.w + '): ' + e.a + ' and ' + e.b + ' are **already in the same group** → it would make a cycle. Skip.', hotK: k, mood: 'oops', ask: { q: 'Next edge ' + e.a + '–' + e.b + ' (' + e.w + '). Add or skip?', options: opts, answer: 1 } });
        f.ecls[id] = 'hot';
        F.push(f);
      } else {
        parent[ra] = rb;
        chosen.push(e); total += e.w;
        status[id] = 'ADD';
        const f = snap({ cap: e.a + '–' + e.b + ' (' + e.w + '): different groups → **add it** and join the groups. Total = ' + total + '.', hotK: k, sound: 'swap', ask: { q: 'Next edge ' + e.a + '–' + e.b + ' (' + e.w + '). Add or skip?', options: opts, answer: 0 } });
        f.cls[e.a] = 'cur'; f.cls[e.b] = 'cur';
        F.push(f);
      }
    }
    F.push(snap({ cap: chosen.length + ' edges = V − 1 → **stop**. MST total = **' + total + '**. Same MST as Prim, different route.', mood: 'happy', dimRest: true }));
    return { frames: F, g: g };
  }

  function kruskalLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: "Kruskal's algorithm", minW: 600 });
    let def = GW;
    const sel = ui.select('GRAPH', [GW, GQ].map(function (g) { return { v: g.v, label: g.name }; }), 'w', function (v) { def = v === 'w' ? GW : GQ; run(); });
    L.controls.appendChild(ui.row(sel.el));
    const sBody = L.panel('SORTED EDGES');
    const gBody = L.panel('GROUPS (UNION-FIND)');
    let g = null;
    function render(f, i, o) {
      draw(L, def, g, f, o);
      U.clear(sBody);
      sBody.appendChild(ui.table(['Edge', 'w', ''], f.sorted.map(function (e) { const st = f.status[eid(e)] || ''; return [e.a + '–' + e.b, { v: e.w, cls: 'num' }, { v: st, cls: st === 'ADD' ? 'done' : st === 'CYCLE ✗' ? 'bad' : '' }]; }), { rowCls: function (r, k) { return k === f.hotK ? 'hot' : ''; } }));
      U.clear(gBody);
      gBody.appendChild(ui.strip(f.groups.map(function (s) { return { v: '{' + s + '}' }; })));
      gBody.appendChild(h('div', { class: 'stats', style: 'margin-top:8px' }, ui.stat('TOTAL', f.total)));
    }
    function run() { const r = kruskalFrames(def); g = r.g; L.player.load(r.frames, render); }
    run();
    return L;
  }

  // ================================================================ lesson
  const lk = ST.lk;
  const RULES = [
    { rule: 'Ties: A–Z order', note: 'When two choices cost the same, take the vertex or edge that comes first alphabetically.' },
    { rule: "Prim's starts at A", note: 'Any start gives an MST with the same total.' }
  ];
  function lesson() {
    const P = ST.graphKit.scalePos(GW.pos, 480, 220);
    const gw = K.graph(GW);
    // f: { cls, badge, badgeCls, ecls, dim }
    const pic = function (f, cap) {
      return { cap: cap,
        nodes: gw.verts.map(function (v) { return { id: v, x: P[v][0], y: P[v][1], r: 22, label: v, cls: (f.cls && f.cls[v]) || '', badge: f.badge && f.badge[v], badgeCls: f.badgeCls && f.badgeCls[v] }; }),
        edges: gw.edges.map(function (e) { return { id: eid(e), a: e.a, b: e.b, w: e.w, wfs: 15, cls: (f.ecls && f.ecls[eid(e)]) || (f.dim ? 'dim' : '') }; }) };
    };
    const ec = function (list, cls, base) {
      const o = Object.assign({}, base);
      list.split(' ').forEach(function (id) { if (id) o[id] = cls; });
      return o;
    };
    const dist = function (d) { const b = {}; 'ABCDE'.split('').forEach(function (v, k) { b[v] = d[k] === null ? '∞' : String(d[k]); }); return b; };
    const dij = dijkstraFrames(GW).frames.filter(function (f, k, all) { return k === 0 || f.doneV || k === all.length - 1; });
    const dijk = dij.map(function (f, k) {
      const cap = k === 0 ? 'A = 0. Everyone else **∞**.' : (f.doneV ? 'Closest left: **' + f.doneV + '** (' + f.dist[f.doneV] + '). Lock it in.' : 'Gold = the cheapest route to each vertex.');
      return pic(Object.assign({}, f, { dim: k === dij.length - 1 }), cap);
    });
    const MST = 'B-C A-C D-E B-D';
    const kr = function (n, cap, extra) { return pic({ ecls: Object.assign(ec(MST.split(' ').slice(0, n).join(' '), 'tree'), extra || {}), dim: n === 4 && !extra }, cap); };
    return [
      { title: 'Edges have costs', frames: [
        pic({}, 'Each edge has a **cost** (time, km, money).'),
        pic({ ecls: ec('A-B', 'path'), cls: { B: 'cur' } }, 'A → B straight: **4**.'),
        pic({ ecls: ec('A-C B-C', 'path'), cls: { B: 'cur' } }, 'A → C → B: 2 + 1 = **3**. More edges, cheaper!')
      ] },
      { title: 'Relax: found a cheaper way', frames: [
        pic({ badge: dist([0, null, null, null, null]), cls: { A: 'cur' } }, 'Start: A = 0. The rest **∞**.'),
        pic({ badge: dist([0, 4, 2, null, null]), ecls: ec('A-B A-C', 'look'), cls: { A: 'cur' } }, 'From A: B = 4, C = 2.'),
        pic({ badge: dist([0, 3, 2, null, null]), badgeCls: { B: 'b-red' }, ecls: ec('B-C', 'hot'), cls: { C: 'cur', B: 'wait' } }, 'Via C: 2 + 1 = 3 < 4 → **update** B.'),
        pic({ badge: dist([0, 3, 2, null, null]), cls: { B: 'wait' } }, 'That update is called **relaxing**.')
      ] },
      { title: 'Dijkstra: lock in the closest', frames: dijk },
      { title: 'MST: cheapest edges, no cycle', frames: [
        kr(0, 'Sort edges: 1, 2, 3, 4, 5, 7, 8.'),
        kr(1, 'Take **B–C (1)**.'),
        kr(2, 'Take **A–C (2)**.'),
        kr(3, 'Take **D–E (3)**.'),
        kr(3, 'A–B (4) closes a **cycle** → skip.', { 'A-B': 'hot dash' }),
        kr(4, 'Take **B–D (5)**. That is V − 1 = 4 edges.', { 'A-B': 'dim dash' }),
        kr(4, 'Every vertex joined. Total **11**.')
      ] },
      { title: 'MST ≠ shortest path', trap: true, frames: [
        pic({ ecls: ec(MST, 'tree'), dim: true }, 'The MST of this graph.'),
        pic({ ecls: ec('A-C B-C B-D D-E', 'path'), cls: { E: 'cur' }, dim: true }, 'In the MST, A → E costs **11**.'),
        pic({ ecls: ec('A-C C-E', 'path'), cls: { E: 'done' }, dim: true }, 'Shortest A → C → E: just **9**.'),
        pic({ ecls: ec(MST, 'tree'), dim: true }, 'MST = cheapest **network**, not cheapest **route**.')
      ] }
    ];
  }

  ST.topic({
    id: 'weighted', n: 11, color: 'teal', icon: 'weighted',
    title: 'Shortest Paths & MST',
    short: 'Dijkstra, Bellman-Ford, Prim and Kruskal on weighted graphs.',
    blurb: 'When every edge has a cost: the cheapest route, and the cheapest network.',
    cheat: {
      head: ['Algorithm', 'Question', 'Key move'],
      rows: [['Dijkstra', 'Cheapest route', 'Process the closest vertex'], ['Bellman-Ford', 'Cheapest route (negatives OK)', 'Relax all edges V − 1 times'], ["Prim's", 'Cheapest network', 'Cheapest crossing edge'], ["Kruskal's", 'Cheapest network', 'Cheapest edge with no cycle']]
    },
    lesson: lesson(),
    rules: RULES,
    labs: [
      { id: 'dijkstra', title: 'Dijkstra', tag: 'TRACE', setup: dijkstraLab },
      { id: 'bellman', title: 'Bellman-Ford', tag: 'TRACE', setup: bellmanLab },
      { id: 'prim', title: "Prim's MST", tag: 'TRACE', setup: primLab },
      { id: 'kruskal', title: "Kruskal's MST", tag: 'TRACE', setup: kruskalLab }
    ]
  });

  ST.weightedFrames = { dijkstra: dijkstraFrames, bellman: bellmanFrames, prim: primFrames, kruskal: kruskalFrames, GW: GW, GN: GN, GC: GC };
})(window.ST);
