/* World 10 — Graphs, BFS and DFS */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui, K = ST.kit;
  const W = 860, H = 500;

  // positions are in a 100 × 66 box, scaled to the stage
  const GRAPHS = [
    { v: 'sample', name: 'Class example', pos: { A: [12, 33], B: [37, 13], C: [37, 53], D: [63, 13], E: [63, 53], F: [88, 33] }, edges: 'A-B A-C B-D C-D C-E D-F E-F' },
    { v: 'line', name: 'Straight line', pos: { A: [10, 33], B: [30, 33], C: [50, 33], D: [70, 33], E: [90, 33] }, edges: 'A-B B-C C-D D-E' },
    { v: 'branches', name: 'Branches (a tree)', pos: { A: [50, 6], B: [27, 22], E: [73, 22], C: [12, 42], D: [40, 42], F: [62, 42], G: [88, 42], H: [40, 60] }, edges: 'A-B A-E B-C B-D D-H E-F E-G' },
    { v: 'ring', name: 'Ring', pos: { A: [50, 6], B: [75, 16], C: [84, 40], D: [64, 59], E: [36, 59], F: [16, 40], G: [25, 16] }, edges: 'A-B B-C C-D D-E E-F F-G G-A' },
    { v: 'shortcut', name: 'Shortcut', pos: { A: [8, 54], B: [20, 22], C: [40, 8], D: [62, 8], E: [82, 22], F: [92, 52] }, edges: 'A-B B-C C-D D-E E-F A-E' },
    { v: 'close', name: 'Looks close, is far', pos: { A: [12, 32], F: [24, 50], G: [44, 32], B: [30, 10], C: [56, 8], D: [84, 18], E: [74, 52], H: [92, 46] }, edges: 'A-B B-C C-D D-E E-F A-G G-H' },
    { v: 'messy', name: 'Crossing lines', pos: { A: [10, 8], B: [46, 6], C: [90, 12], D: [46, 36], E: [84, 54], F: [10, 40], G: [26, 22], H: [66, 30], I: [20, 60], J: [56, 58] }, edges: 'A-B A-H B-G B-C C-E C-H D-G D-I D-J E-H E-J F-G F-I G-H' },
    { v: 'apart', name: 'Two parts', pos: { A: [12, 18], B: [36, 10], C: [14, 50], D: [38, 46], X: [68, 16], Y: [90, 30], Z: [70, 52] }, edges: 'A-B A-C B-D C-D X-Y Y-Z X-Z' }
  ];

  function scalePos(pos, w, hh) {
    const out = {};
    Object.keys(pos).forEach(function (v) { out[v] = [36 + pos[v][0] / 100 * (w - 72), 34 + pos[v][1] / 66 * (hh - 68)]; });
    return out;
  }

  // Build a graph from an edge string, keeping preset positions when possible
  function makeGraph(preset, edgeStr) {
    const verts = {};
    String(edgeStr).toUpperCase().split(/[\s,]+/).forEach(function (tok) {
      const m = tok.match(/^([A-Z])-([A-Z])$/);
      if (m) { verts[m[1]] = 1; verts[m[2]] = 1; }
      else if (/^[A-Z]$/.test(tok)) verts[tok] = 1;
    });
    const names = Object.keys(verts).sort();
    const pos = {};
    let missing = [];
    names.forEach(function (v) { if (preset.pos[v]) pos[v] = preset.pos[v]; else missing.push(v); });
    if (missing.length) {
      // circle layout for everything
      names.forEach(function (v, k) { const a = -Math.PI / 2 + 2 * Math.PI * k / names.length; pos[v] = [50 + 40 * Math.cos(a), 33 + 27 * Math.sin(a)]; });
    }
    const clean = String(edgeStr).toUpperCase().split(/[\s,]+/).filter(function (t) { return /^[A-Z]-[A-Z]$/.test(t) && t[0] !== t[2]; }).join(' ');
    return K.graph({ pos: pos, edges: clean });
  }

  function graphNodes(g, f, sp, opts) {
    opts = opts || {};
    const nodes = g.verts.map(function (v) {
      const p = sp[v];
      return { id: v, x: p[0], y: p[1], label: v, r: 23, cls: (f.cls && f.cls[v]) || '', ring: f.ring && f.ring[v], badge: f.badge && f.badge[v], badgeCls: f.badgeCls && f.badgeCls[v] };
    });
    const seen = {};
    const edges = [];
    g.edges.forEach(function (e) {
      const id = K.eid(e.a, e.b);
      if (seen[id]) return;
      seen[id] = 1;
      edges.push({ id: id, a: e.a, b: e.b, cls: (f.ecls && f.ecls[id]) || (opts.dimRest ? 'dim' : ''), w: e.w === null ? undefined : e.w });
    });
    return { nodes: nodes, edges: edges };
  }

  // positions that put each BFS level in its own column
  function levelLayout(g, level, w, hh) {
    const cols = {};
    let maxL = 0;
    g.verts.forEach(function (v) { const L = level[v]; if (L === undefined) return; (cols[L] = cols[L] || []).push(v); if (L > maxL) maxL = L; });
    const pos = {};
    const unseen = g.verts.filter(function (v) { return level[v] === undefined; });
    const ncol = maxL + 1 + (unseen.length ? 1 : 0);
    Object.keys(cols).forEach(function (L) {
      const list = cols[L].sort();
      list.forEach(function (v, k) { pos[v] = [70 + (w - 140) * (Number(L) / Math.max(1, ncol - 1)), hh / 2 + (k - (list.length - 1) / 2) * 76]; });
    });
    unseen.forEach(function (v, k) { pos[v] = [w - 60, 60 + k * 70]; });
    return pos;
  }

  // ================================================================ BFS (whiteboard method)
  function bfsFrames(g, start) {
    const F = [];
    const level = {}, parent = {};
    const queue = [];
    const done = {};
    const log = [];
    let current = null;
    const snap = function (extra) {
      const cls = {}, ring = {}, badge = {}, ecls = {};
      g.verts.forEach(function (v) {
        if (level[v] !== undefined) badge[v] = 'L' + level[v];
        if (done[v]) { cls[v] = 'done'; ring[v] = 'solid'; }
        else if (queue.indexOf(v) >= 0) { cls[v] = 'wait'; ring[v] = 'dash'; }
      });
      if (current) { cls[current] = 'cur'; ring[current] = 'solid'; }
      Object.keys(parent).forEach(function (v) { ecls[K.eid(v, parent[v])] = 'tree'; });
      return Object.assign({ cls: cls, ring: ring, badge: badge, ecls: ecls, queue: queue.map(function (v) { return { v: v, tag: 'L' + level[v] }; }), log: log.slice(), level: Object.assign({}, level), parent: Object.assign({}, parent) }, extra);
    };
    level[start] = 0; queue.push(start);
    log.push('Queue: ' + start + ' L0');
    F.push(snap({ cap: 'Start at **' + start + '**. It is **level 0**. Put it in the queue (dashed circle).' }));
    let step = 0;
    while (queue.length) {
      const front = queue[0];
      step++;
      queue.shift();
      current = front;
      F.push(snap({ cap: 'Dequeue **' + front + '** (L' + level[front] + '). Draw a **solid circle** around it.', ask: { q: 'Which vertex is dequeued next? Click it.', pick: front, among: g.verts, answerText: front } }));
      const nb = g.adj[front].map(function (x) { return x.v; });
      const fresh = nb.filter(function (v) { return level[v] === undefined; });
      const old = nb.filter(function (v) { return level[v] !== undefined; });
      fresh.forEach(function (v) { level[v] = level[front] + 1; parent[v] = front; queue.push(v); });
      const look = {};
      nb.forEach(function (v) { if (!parent[v] || parent[v] !== front) look[K.eid(front, v)] = 'look'; });
      const lvl = level[front] + 1;
      let cap = 'Neighbors of ' + front + ' (A–Z order): ' + (nb.length ? nb.join(', ') : 'none') + '. ';
      if (fresh.length) cap += 'New: **' + fresh.join(', ') + '** → enqueue at **level ' + lvl + '** (dashed circles).';
      else cap += 'No new vertices.';
      if (old.length && fresh.length) cap += ' ' + old.join(', ') + ' already found — skip.';
      log.push('Step ' + step + ': out ' + front + (fresh.length ? ' · in ' + fresh.join(' ') + ' (L' + lvl + ')' : '') + ' · Queue: ' + (queue.length ? queue.map(function (v) { return v + ' L' + level[v]; }).join(', ') : 'empty'));
      const f = snap({ cap: cap });
      Object.keys(look).forEach(function (id) { if (f.ecls[id] !== 'tree') f.ecls[id] = 'look'; });
      F.push(f);
      done[front] = true;
      current = null;
    }
    const unreached = g.verts.filter(function (v) { return level[v] === undefined; });
    const order = Object.keys(level).sort(function (a, b) { return level[a] - level[b] || 0; });
    // visit order = dequeue order; rebuild it from the log order
    const visitOrder = [];
    F.forEach(function (fr) { if (fr.ask && fr.ask.pick) visitOrder.push(fr.ask.pick); });
    F.push(snap({ cap: 'Queue is empty. **BFS order: ' + visitOrder.join(' ') + '**.' + (unreached.length ? ' ' + unreached.join(', ') + ' cannot be reached from ' + start + '.' : '') + ' Read the table on the right.', mood: 'happy', final: true, visitOrder: visitOrder }));
    void order;
    return F;
  }

  // ================================================================ DFS (whiteboard method)
  function dfsFrames(g, start) {
    const F = [];
    const visited = {}, num = {}, parent = {};
    const stack = [];
    const finished = {};
    const order = [];
    const log = [];
    let count = 0;
    // how many vertices can be reached? (the trace stops when all are visited)
    const reach = {};
    (function walk(v) { reach[v] = 1; g.adj[v].forEach(function (x) { if (!reach[x.v]) walk(x.v); }); })(start);
    const total = Object.keys(reach).length;
    const snap = function (extra) {
      const cls = {}, badge = {}, ecls = {}, ring = {};
      g.verts.forEach(function (v) {
        if (num[v]) badge[v] = '#' + num[v];
        if (finished[v]) cls[v] = 'done';
        else if (stack.indexOf(v) >= 0) cls[v] = 'wait';
      });
      if (stack.length) { cls[stack[stack.length - 1]] = 'cur'; ring[stack[stack.length - 1]] = 'solid'; }
      Object.keys(parent).forEach(function (v) { ecls[K.eid(v, parent[v])] = 'tree'; });
      return Object.assign({ cls: cls, badge: badge, ecls: ecls, ring: ring, stack: stack.slice(), order: order.slice(), log: log.slice() }, extra);
    };
    const visit = function (v, from) {
      count++; visited[v] = true; num[v] = count; order.push(v); stack.push(v);
      if (from) parent[v] = from;
      log.push('Push ' + v + ' (#' + count + ') · Stack: ' + stack.join(' '));
    };
    visit(start, null);
    F.push(snap({ cap: 'Start at **' + start + '**. Visit it (#1) and **push** it on the path stack.' }));
    while (stack.length) {
      if (count === total) {
        const missing = g.verts.filter(function (v) { return !reach[v]; });
        F.push(snap({ cap: 'All ' + total + ' vertices ' + (missing.length ? 'that can be reached ' : '') + 'are visited. **Stop here.** (The rest of the stack would just pop.) DFS order: **' + order.join(' ') + '**.' + (missing.length ? ' ' + missing.join(', ') + ' cannot be reached from ' + start + '.' : ''), mood: 'happy', final: true }));
        return F;
      }
      const top = stack[stack.length - 1];
      const nb = g.adj[top].map(function (x) { return x.v; });
      const next = nb.filter(function (v) { return !visited[v]; })[0];
      const seenList = nb.filter(function (v) { return visited[v]; });
      if (next) {
        visit(next, top);
        const f = snap({ cap: 'At ' + top + '. Neighbors (A–Z): ' + nb.join(', ') + '. ' + (seenList.length && nb.indexOf(next) > 0 ? seenList.filter(function (v) { return nb.indexOf(v) < nb.indexOf(next); }).join(', ') + ' already visited. ' : '') + 'First new one: **' + next + '** → visit #' + count + ', push.',
          ask: { q: 'Which vertex does DFS visit next? Click it.', pick: next, among: g.verts, answerText: next } });
        f.ecls[K.eid(top, next)] = 'tree';
        F.push(f);
      } else {
        stack.pop();
        finished[top] = true;
        log.push('Pop ' + top + ' (dead end) · Stack: ' + (stack.length ? stack.join(' ') : 'empty'));
        const back = stack[stack.length - 1];
        F.push(snap({ cap: top + ': every neighbor is visited → **dead end**. **Pop ' + top + '**' + (back ? ' and go back to **' + back + '**.' : '. The stack is empty.'), sound: 'back', mood: 'oops' }));
      }
    }
    const unreached = g.verts.filter(function (v) { return !visited[v]; });
    F.push(snap({ cap: 'Stack is empty. DFS order: **' + order.join(' ') + '**.' + (unreached.length ? ' ' + unreached.join(', ') + ' cannot be reached from ' + start + '.' : ''), mood: 'happy', final: true }));
    return F;
  }

  // ================================================================ shared lab shell for BFS / DFS
  function travLab(kind) {
    return function (root) {
      const L = ST.lab(root, { vb: [W, H], alt: kind.toUpperCase() + ' on a graph', minW: 600 });
      let preset = GRAPHS[0];
      let layout = 'orig';
      const gSel = ui.select('GRAPH', GRAPHS.map(function (g) { return { v: g.v, label: g.name }; }), preset.v, function (v) {
        preset = GRAPHS.filter(function (x) { return x.v === v; })[0];
        eIn.input.value = preset.edges;
        run();
      });
      const eIn = ui.field('EDGES (edit me)', preset.edges, { onEnter: run });
      eIn.input.classList.add('inp-wide');
      const sIn = ui.field('START', 'A', { small: true, onEnter: run });
      L.controls.appendChild(ui.row(gSel.el, eIn.el, sIn.el, ui.button('RUN', run, 'btn-yellow')));
      if (kind === 'bfs') L.controls.appendChild(ui.seg('PICTURE', [{ v: 'orig', label: 'AS DRAWN' }, { v: 'level', label: 'ARRANGE BY LEVEL' }], layout, function (v) { layout = v; L.player.show(L.player.i); }));
      const dsBody = L.panel(kind === 'bfs' ? 'QUEUE (front → back)' : 'PATH STACK (bottom → top)');
      const outBody = L.panel(kind === 'bfs' ? 'RESULT TABLE' : 'VISIT ORDER');
      const logBody = L.panel('WHITEBOARD LOG');
      let g = null, sp = null, start = 'A';
      function render(f, i, o) {
        let pos = sp;
        if (kind === 'bfs' && layout === 'level') pos = levelLayout(g, f.level, W, H);
        const gn = graphNodes(g, f, pos, { dimRest: f.final });
        if (f.final) gn.edges.forEach(function (e) { if (f.ecls[e.id] === 'tree') e.cls = 'tree'; });
        L.scene.draw(gn, { instant: o.instant });
        U.clear(dsBody);
        if (kind === 'bfs') dsBody.appendChild(ui.strip(f.queue.map(function (q, k) { return { v: q.v, tag: q.tag, cls: 'wait' + (k === 0 ? ' cur' : '') }; }), { empty: 'empty' }));
        else dsBody.appendChild(h('div', { class: 'vstack' }, f.stack.slice().reverse().map(function (v, k) { return h('span', { class: 'sbox ' + (k === 0 ? 'cur' : 'wait') }, v); }), f.stack.length ? null : h('span', { class: 'strip-empty' }, 'empty')));
        U.clear(outBody);
        if (kind === 'bfs') {
          const rows = g.verts.filter(function (v) { return f.level[v] !== undefined; }).sort(function (a, b) { return f.level[a] - f.level[b] || (a < b ? -1 : 1); })
            .map(function (v) { return [v, { v: 'L' + f.level[v], cls: 'num' }, f.parent[v] || '— (start)']; });
          outBody.appendChild(ui.table(['Vertex', 'Level', 'Found by'], rows));
        } else {
          outBody.appendChild(ui.strip(f.order.map(function (v, k) { return { v: v, tag: '#' + (k + 1), cls: 'done' }; }), { empty: '—' }));
        }
        U.clear(logBody);
        const ul = h('ol', { class: 'log' });
        f.log.forEach(function (line, k) { ul.appendChild(h('li', { class: k === f.log.length - 1 ? 'hot' : '' }, line)); });
        logBody.appendChild(ul);
        ul.scrollTop = ul.scrollHeight;
      }
      function run() {
        g = makeGraph(preset, eIn.input.value);
        if (!g.verts.length) { eIn.input.value = preset.edges; g = makeGraph(preset, preset.edges); }
        sp = scalePos(g.pos, W, H);
        start = (sIn.input.value.trim().toUpperCase() || 'A')[0];
        if (g.verts.indexOf(start) < 0) start = g.verts[0];
        sIn.input.value = start;
        L.player.load(kind === 'bfs' ? bfsFrames(g, start) : dfsFrames(g, start), render);
      }
      run();
      return L;
    };
  }

  // ================================================================ representation lab
  function repLab(root) {
    const L = ST.lab(root, { vb: [W, H], player: false, alt: 'Graph with adjacency matrix and list', minW: 600 });
    let preset = GRAPHS[0];
    let sel = 'A';
    const gSel = ui.select('GRAPH', GRAPHS.map(function (g) { return { v: g.v, label: g.name }; }), preset.v, function (v) {
      preset = GRAPHS.filter(function (x) { return x.v === v; })[0]; eIn.input.value = preset.edges; sel = 'A'; draw();
    });
    const eIn = ui.field('EDGES (edit me)', preset.edges, { onEnter: draw });
    eIn.input.classList.add('inp-wide');
    L.controls.appendChild(ui.row(gSel.el, eIn.el, ui.button('DRAW', draw, 'btn-yellow')));
    const mBody = L.panel('ADJACENCY MATRIX');
    const lBody = L.panel('ADJACENCY LIST');
    L.scene.clickFn = function (id) { if (/^[A-Z]$/.test(id)) { sel = id; draw(); } };
    function draw() {
      const g = makeGraph(preset, eIn.input.value);
      if (g.verts.indexOf(sel) < 0) sel = g.verts[0];
      const sp = scalePos(g.pos, W, H);
      const nb = g.adj[sel].map(function (x) { return x.v; });
      const f = { cls: {}, ecls: {} };
      g.verts.forEach(function (v) { f.cls[v] = (v === sel ? 'cur' : nb.indexOf(v) >= 0 ? 'wait' : '') + ' clickable'; });
      nb.forEach(function (v) { f.ecls[K.eid(sel, v)] = 'look'; });
      L.scene.draw(graphNodes(g, f, sp));
      U.clear(mBody);
      const rows = g.verts.map(function (r) {
        return [{ v: r, cls: r === sel ? 'hot' : '' }].concat(g.verts.map(function (c) {
          const on = g.adj[r].some(function (x) { return x.v === c; });
          return { v: on ? '1' : '0', cls: 'num' + (r === sel && on ? ' hot' : (on ? ' done' : '')) };
        }));
      });
      mBody.appendChild(h('div', { class: 'matrix-wrap' }, ui.table([''].concat(g.verts), rows, { cls: 'matrix' })));
      U.clear(lBody);
      lBody.appendChild(ui.table(null, g.verts.map(function (v) { return [{ v: v, cls: v === sel ? 'hot' : '' }, { v: g.adj[v].map(function (x) { return x.v; }).join(', ') || '—', cls: v === sel ? 'hot' : '' }]; })));
      const deg = nb.length;
      L.say('Vertex **' + sel + '** has **' + deg + '** neighbor' + (deg === 1 ? '' : 's') + ': ' + (nb.join(', ') || 'none') + '. Click another vertex. Undirected edge = **1 in two places** of the matrix.', 'idle');
    }
    draw();
    return L;
  }

  // ================================================================ lesson
  const lk = ST.lk;
  const RULES = [
    { rule: 'Start at A', note: 'BFS and DFS can start at any vertex.' },
    { rule: 'Check neighbors in A–Z order', note: 'Any order is correct. A fixed order gives everyone the same answer.' },
    { rule: 'BFS: solid circle = dequeued, dashed = waiting', note: 'Our whiteboard notation, plus L0, L1… level labels.' },
    { rule: 'DFS: stop once every vertex is visited', note: 'The leftover pops still happen. We just do not draw them.' }
  ];
  function lesson() {
    const byName = function (v) { return GRAPHS.filter(function (x) { return x.v === v; })[0]; };
    const gOf = function (v) { const p = byName(v); return makeGraph(p, p.edges); };
    const strip = function (title, items) {
      return [lk.text('dsL', 20, 228, title, 'ink', 13, 'start')].concat(items.map(function (it, k) {
        return { id: 'ds' + it.v, t: 'cell', x: 110 + k * 42, y: 228, w: 36, h: 30, label: it.v, fs: 15, cls: it.cls || '', from: { x: 110 + k * 42, y: 270 } };
      }));
    };
    const curOf = function (f) { return Object.keys(f.cls).filter(function (v) { return f.cls[v] === 'cur'; })[0]; };
    // BFS on the class example, one frame per dequeue
    const g1 = gOf('sample'), sp1 = scalePos(g1.pos, 480, 200);
    const bfsAll = bfsFrames(g1, 'A').filter(function (f) { return !f.ask; });
    const bfs = bfsAll.map(function (f, k) {
      const gn = graphNodes(g1, f, sp1, { dimRest: f.final });
      const prevQ = k ? bfsAll[k - 1].queue.map(function (q) { return q.v; }) : [];
      const fresh = f.queue.filter(function (q) { return prevQ.indexOf(q.v) < 0; });
      const cur = curOf(f);
      let cap = 'Start at **A**: level 0. Into the queue.';
      if (f.final) cap = 'Queue empty. BFS order: **' + f.visitOrder.join(' ') + '**.';
      else if (k) cap = cur + ' is out. ' + (fresh.length ? 'Add **' + fresh.map(function (q) { return q.v; }).join(', ') + '** (' + fresh[0].tag + ').' : 'Nothing new.');
      return { nodes: gn.nodes.concat(strip('QUEUE', f.queue.map(function (q, j) { return { v: q.v, cls: j ? 'wait' : 'wait cur' }; }))), edges: gn.edges, cap: cap };
    });
    // DFS on a tree-shaped graph, so the dead ends show
    const br = byName('branches');
    const g2 = makeGraph({ pos: Object.assign({}, br.pos, { C: [8, 40], D: [36, 40], H: [52, 64] }) }, br.edges), sp2 = scalePos(g2.pos, 480, 200);
    const dfsAll = dfsFrames(g2, 'A');
    const dfs = dfsAll.map(function (f, k) {
      const gn = graphNodes(g2, f, sp2, { dimRest: f.final });
      let cap = 'Start at **A**. Visit it, push it.';
      if (f.final) cap = 'All visited: **stop**. Order: **' + f.order.join(' ') + '**.';
      else if (f.ask) cap = 'Go deeper: visit **' + f.ask.pick + '**, push.';
      else if (k) cap = 'Dead end at ' + dfsAll[k - 1].stack[dfsAll[k - 1].stack.length - 1] + ' → **pop**, go back.';
      return { nodes: gn.nodes.concat(strip('STACK', f.stack.map(function (v, j) { return { v: v, cls: j === f.stack.length - 1 ? 'cur' : 'wait' }; }))), edges: gn.edges, cap: cap };
    });
    const basic = function (step, cap) {
      const f = { cls: {}, ecls: {} };
      if (step === 2) { f.cls = { A: 'cur', B: 'wait', C: 'wait' }; f.ecls = { 'A-B': 'look', 'A-C': 'look' }; }
      const gn = graphNodes(g1, f, scalePos(g1.pos, 480, 220));
      return { nodes: gn.nodes, edges: step ? gn.edges : [], cap: cap };
    };
    const spL = scalePos(g1.pos, 300, 220);
    const adj = function (hot, cap) {
      const f = { cls: {}, ecls: {} };
      hot.forEach(function (v) { f.cls[v] = 'cur'; g1.adj[v].forEach(function (x) { f.ecls[K.eid(v, x.v)] = 'look'; }); });
      const gn = graphNodes(g1, f, spL);
      g1.verts.forEach(function (v, k) {
        gn.nodes.push(lk.text('row' + v, 340, 28 + k * 33, v + ':  ' + g1.adj[v].map(function (x) { return x.v; }).join('  '), hot.indexOf(v) >= 0 ? 'red' : 'ink', 17, 'start'));
      });
      return { nodes: gn.nodes, edges: gn.edges, cap: cap };
    };
    const g3 = gOf('close'), sp3 = scalePos(g3.pos, 480, 220);
    const last3 = bfsFrames(g3, 'A').pop();
    const close = function (step, cap) {
      const f = step ? Object.assign({}, last3, { cls: { A: 'cur', F: 'bad' }, ring: {}, ecls: {} }) : { cls: { A: 'cur', F: 'wait' }, ecls: {} };
      if (step === 2) 'A-B B-C C-D D-E E-F'.split(' ').forEach(function (e) { f.ecls[e] = 'path'; });
      const gn = graphNodes(g3, f, sp3);
      return { nodes: gn.nodes, edges: gn.edges, cap: cap };
    };
    return [
      { title: 'Vertices + edges', frames: [
        basic(0, 'Vertices: the **things**.'),
        basic(1, 'Edges: the **links** between them.'),
        basic(2, 'A\'s **neighbors**: B and C.')
      ] },
      { title: 'BFS: ripple out by level', vb: [480, 250], frames: bfs },
      { title: 'DFS: go deep, then back up', vb: [480, 250], frames: dfs },
      { title: 'Store it as a list', vb: [560, 220], frames: [
        adj(['A'], 'Each vertex keeps a list of its **neighbors**.'),
        adj(['D'], 'D: B, C, F.'),
        adj(['D', 'F'], 'Each edge is listed **twice**: D has F, F has D.')
      ] },
      { title: 'Close on screen ≠ close', trap: true, frames: [
        close(0, 'F is drawn **right next to** A…'),
        close(1, '…but BFS finds F at **level 5**.'),
        close(2, 'Level = edges from A, not distance on screen.')
      ] }
    ];
  }

  ST.topic({
    id: 'graphs', n: 10, color: 'yellow', icon: 'graphs',
    title: 'Graphs: BFS & DFS',
    short: 'Explore a graph level by level (BFS) or deep first (DFS) — the whiteboard way.',
    blurb: 'Two ways to explore every vertex. Same graph, different order.',
    cheat: {
      head: ['', 'BFS', 'DFS'],
      rows: [['Uses', 'Queue (FIFO)', 'Stack (LIFO)'], ['Order', 'Level by level', 'Deep first, then back up'], ['Class example', 'A B C D E F', 'A B D C E F'], ['Finds', 'Fewest edges to each vertex', 'A path; full exploration'], ['Time', 'O(V + E)', 'O(V + E)']]
    },
    lesson: lesson(),
    rules: RULES,
    labs: [
      { id: 'bfs', title: 'BFS (whiteboard)', tag: 'TRACE', setup: travLab('bfs') },
      { id: 'dfs', title: 'DFS (whiteboard)', tag: 'TRACE', setup: travLab('dfs') },
      { id: 'represent', title: 'Matrix & list', tag: 'PLAY', setup: repLab }
    ]
  });

  ST.graphKit = { GRAPHS: GRAPHS, scalePos: scalePos, graphNodes: graphNodes, makeGraph: makeGraph, bfs: bfsFrames, dfs: dfsFrames };
})(window.ST);
