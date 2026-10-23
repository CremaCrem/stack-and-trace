/*
  kit.js — layout helpers shared by many labs.
*/
(function (ST) {
  'use strict';

  const kit = {};

  // x positions for n boxes centred in a stage of width W
  kit.row = function (n, W, cell, gap) {
    cell = cell || 56; gap = gap === undefined ? 10 : gap;
    const total = n * cell + (n - 1) * gap;
    const x0 = (W - total) / 2 + cell / 2;
    const xs = [];
    for (let i = 0; i < n; i++) xs.push(x0 + i * (cell + gap));
    return xs;
  };

  // pick a cell size that fits n boxes into width W
  kit.fit = function (n, W, maxCell, minCell) {
    maxCell = maxCell || 60; minCell = minCell || 34;
    const c = Math.floor((W - 40) / (n * 1.18));
    return Math.max(minCell, Math.min(maxCell, c));
  };

  // ---------- binary trees (nodes with left/right) ----------
  // Layout by in-order rank: x = rank, y = depth. Never overlaps,
  // and rotations keep x the same, so they animate cleanly.
  kit.treeLayout = function (root, W, H, opts) {
    opts = opts || {};
    const pos = {};
    const order = [];
    let maxDepth = 0;
    (function walk(n, d) {
      if (!n) return;
      walk(n.left, d + 1);
      order.push({ n: n, d: d });
      if (d > maxDepth) maxDepth = d;
      walk(n.right, d + 1);
    })(root, 0);
    const cnt = order.length;
    const padX = opts.padX || 40, top = opts.top || 44;
    const gapY = Math.min(opts.maxGapY || 80, (H - top - (opts.bottom || 40)) / Math.max(1, maxDepth));
    const stepX = cnt > 1 ? Math.min(opts.maxStep || 90, (W - 2 * padX) / (cnt - 1)) : 0;
    const x0 = (W - stepX * (cnt - 1)) / 2;
    order.forEach(function (o, k) { pos[o.n.id] = { x: x0 + k * stepX, y: top + o.d * gapY, d: o.d }; });
    return { pos: pos, depth: maxDepth, count: cnt };
  };

  // complete binary tree (heap) positions by array index
  kit.heapPos = function (n, W, top, gapY) {
    const pos = [];
    top = top || 40; gapY = gapY || 70;
    for (let i = 0; i < n; i++) {
      const lvl = Math.floor(Math.log2(i + 1));
      const first = Math.pow(2, lvl) - 1;
      const k = i - first;
      const slots = Math.pow(2, lvl);
      pos.push({ x: W * (k + 0.5) / slots, y: top + lvl * gapY, lvl: lvl });
    }
    return pos;
  };

  kit.treeEdges = function (root, cls) {
    const out = [];
    (function walk(n) {
      if (!n) return;
      ['left', 'right'].forEach(function (side) {
        if (n[side]) {
          out.push({ id: 'e' + n.id + '-' + n[side].id, a: n.id, b: n[side].id, cls: typeof cls === 'function' ? cls(n, n[side]) : (cls || '') });
          walk(n[side]);
        }
      });
    })(root);
    return out;
  };

  kit.cloneTree = function (n) {
    if (!n) return null;
    return { id: n.id, v: n.v, left: kit.cloneTree(n.left), right: kit.cloneTree(n.right) };
  };

  kit.height = function (n) { return n ? 1 + Math.max(kit.height(n.left), kit.height(n.right)) : 0; };

  kit.nodesOf = function (root) {
    const out = [];
    (function walk(n) { if (!n) return; out.push(n); walk(n.left); walk(n.right); })(root);
    return out;
  };

  // ---------- graphs ----------
  // def: { pos: {A:[x,y]}, edges: 'A-B A-C' or 'A-B:4 ...', directed }
  kit.graph = function (def, opts) {
    opts = opts || {};
    const verts = Object.keys(def.pos).sort();
    const adj = {};
    verts.forEach(function (v) { adj[v] = []; });
    const edges = [];
    String(def.edges).trim().split(/\s+/).filter(Boolean).forEach(function (tok) {
      const m = tok.match(/^([A-Za-z0-9]+)(->|-)([A-Za-z0-9]+)(?::(-?\d+(?:\.\d+)?))?$/);
      if (!m) return;
      const a = m[1], b = m[3];
      if (!(a in adj) || !(b in adj)) return;
      const directed = def.directed || m[2] === '->';
      const w = m[4] === undefined ? null : Number(m[4]);
      edges.push({ a: a, b: b, w: w, directed: directed, id: a + (directed ? '>' : '-') + b });
      adj[a].push({ v: b, w: w });
      if (!directed) adj[b].push({ v: a, w: w });
    });
    verts.forEach(function (v) { adj[v].sort(function (x, y) { return x.v < y.v ? -1 : x.v > y.v ? 1 : 0; }); });
    return { verts: verts, adj: adj, edges: edges, pos: def.pos, directed: !!def.directed };
  };

  // undirected edge id that does not depend on direction
  kit.eid = function (a, b) { return a < b ? a + '-' + b : b + '-' + a; };

  ST.kit = kit;
})(window.ST);
