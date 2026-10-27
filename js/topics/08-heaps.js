/* World 8 — Heaps, Priority Queues, Heap Sort */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui, K = ST.kit;
  const W = 860, H = 430;

  const PRESETS = [
    { v: 'class', label: 'Class key: 40 20 30 10 5', arr: [40, 20, 30, 10, 5] },
    { v: 'act4', label: 'Activity 4: 45 20 60 10 30 5 50 15 25 40', arr: [45, 20, 60, 10, 30, 5, 50, 15, 25, 40] },
    { v: 'lesson', label: 'Lesson heapify: 10 30 20 5 40', arr: [10, 30, 20, 5, 40] },
    { v: 'sort', label: 'Lesson heap sort: 4 10 3 5 1', arr: [4, 10, 3, 5, 1] }
  ];

  function better(kind, a, b) { return kind === 'min' ? a < b : a > b; }
  function sym(kind) { return kind === 'min' ? '<' : '>'; }
  function word(kind) { return kind === 'min' ? 'smaller' : 'larger'; }

  // State: heap = ids in heap order, vals, frozen = {index: id}, deleted = id|null
  function State(arr) {
    this.vals = {};
    this.ids = arr.map(function (v, k) { this.vals['v' + k] = v; return 'v' + k; }, this);
    this.heap = [];
    this.frozen = {};
    this.deleted = null;
    this.pending = []; // ids not inserted yet
  }

  function snapOf(st, extra) {
    return Object.assign({ heap: st.heap.slice(), vals: st.vals, frozen: Object.assign({}, st.frozen), deleted: st.deleted, pending: st.pending.slice(), cls: {}, n: st.ids.length }, extra);
  }

  function siftUp(st, F, kind, i, baseCap) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      const a = st.vals[st.heap[i]], b = st.vals[st.heap[p]];
      if (better(kind, a, b)) {
        const c = {}; c[st.heap[i]] = 'bad'; c[st.heap[p]] = 'bad';
        const t = st.heap[i]; st.heap[i] = st.heap[p]; st.heap[p] = t;
        F.push(snapOf(st, { cap: 'Swap **' + a + '** and **' + b + '**. ' + a + ' moves up to index ' + p + '.', cls: c, sound: 'swap', line: 2,
          ask: { q: a + ' (index ' + i + ') vs parent ' + b + ' (index ' + p + '). Swap?', options: ['Yes, swap', 'No, stop'], answer: 0 } }));
        i = p;
      } else {
        const c = {}; c[st.heap[i]] = 'done'; c[st.heap[p]] = 'cur';
        F.push(snapOf(st, { cap: a + ' is not ' + word(kind) + ' than its parent ' + b + '. **No swap.** The rule holds.', cls: c, line: 1,
          ask: { q: a + ' (index ' + i + ') vs parent ' + b + ' (index ' + p + '). Swap?', options: ['Yes, swap', 'No, stop'], answer: 1 } }));
        return;
      }
    }
    if (st.heap.length > 1) {
      const c = {}; c[st.heap[0]] = 'done';
      F.push(snapOf(st, { cap: st.vals[st.heap[0]] + ' reached the **root**. Stop.', cls: c }));
    }
  }

  function siftDown(st, F, kind, i, size, ctx) {
    while (true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l >= size) {
        F.push(snapOf(st, Object.assign({ cap: st.vals[st.heap[i]] + ' has no children. Stop.', cls: (function () { const c = {}; c[st.heap[i]] = 'done'; return c; })() }, ctx)));
        return;
      }
      let best = l;
      if (r < size && better(kind, st.vals[st.heap[r]], st.vals[st.heap[l]])) best = r;
      const v = st.vals[st.heap[i]], bv = st.vals[st.heap[best]];
      const kids = r < size ? st.vals[st.heap[l]] + ' and ' + st.vals[st.heap[r]] : String(st.vals[st.heap[l]]);
      if (better(kind, bv, v)) {
        const c = {}; c[st.heap[i]] = 'bad'; c[st.heap[best]] = 'bad';
        const t = st.heap[i]; st.heap[i] = st.heap[best]; st.heap[best] = t;
        F.push(snapOf(st, Object.assign({ cap: 'Children of ' + v + ': ' + kids + '. The ' + word(kind) + ' child is **' + bv + '** → swap.', cls: c, sound: 'swap',
          ask: { q: v + ' has children ' + kids + '. What happens?', options: ['Swap with ' + st.vals[st.heap[i]], 'No swap, stop'], answer: 0 } }, ctx)));
        i = best;
      } else {
        const c = {}; c[st.heap[i]] = 'done';
        F.push(snapOf(st, Object.assign({ cap: 'Children of ' + v + ': ' + kids + '. ' + v + ' is already ' + word(kind) + '. **No swap.**', cls: c,
          ask: { q: v + ' has children ' + kids + '. What happens?', options: ['Swap with ' + bv, 'No swap, stop'], answer: 1 } }, ctx)));
        return;
      }
    }
  }

  function buildFrames(arr, kind, how) {
    const st = new State(arr);
    const F = [];
    const name = kind === 'min' ? 'MIN heap: parent ≤ children' : 'MAX heap: parent ≥ children';
    if (how === 'insert') {
      st.pending = st.ids.slice();
      F.push(snapOf(st, { cap: 'Build a **' + name + '** by inserting one value at a time.' }));
      st.ids.forEach(function (id) {
        st.pending.shift();
        st.heap.push(id);
        const i = st.heap.length - 1;
        const v = st.vals[id];
        const c = {}; c[id] = 'new';
        if (i === 0) {
          F.push(snapOf(st, { cap: 'Insert **' + v + '** at index 0. It is the root.', cls: c, line: 0 }));
          return;
        }
        const p = Math.floor((i - 1) / 2);
        c[st.heap[p]] = 'cur';
        F.push(snapOf(st, { cap: 'Insert **' + v + '** at the next open spot: index ' + i + ' (' + (i % 2 ? 'left' : 'right') + ' child of ' + st.vals[st.heap[p]] + ').', cls: c, line: 0 }));
        siftUp(st, F, kind, i);
      });
    } else {
      st.heap = st.ids.slice();
      F.push(snapOf(st, { cap: 'Start with the array as it is. Heapify from the **last parent** back to the root.' }));
      for (let i = Math.floor(st.heap.length / 2) - 1; i >= 0; i--) {
        const c = {}; c[st.heap[i]] = 'cur';
        F.push(snapOf(st, { cap: 'Heapify index ' + i + ' (' + st.vals[st.heap[i]] + ').', cls: c }));
        siftDown(st, F, kind, i, st.heap.length, {});
      }
    }
    F.push(snapOf(st, { cap: 'Done! Heap array: **[' + st.heap.map(function (id) { return st.vals[id]; }).join(', ') + ']**. The ' + (kind === 'min' ? 'smallest' : 'largest') + ' value is at the root.', mood: 'happy' }));
    return { frames: F, st: st };
  }

  function sortFrames(arr, kind) {
    const built = buildFrames(arr, kind, 'insert');
    const st = built.st;
    const F = [];
    const n = st.heap.length;
    F.push(snapOf(st, { cap: 'Start: the finished ' + kind + ' heap **[' + st.heap.map(function (id) { return st.vals[id]; }).join(', ') + ']**. Now remove the root again and again.' }));
    let size = n;
    let round = 0;
    while (size > 1) {
      round++;
      const rootId = st.heap[0];
      const lastIdx = size - 1;
      const lastId = st.heap[lastIdx];
      st.deleted = rootId;
      st.heap[0] = lastId;
      st.heap.length = lastIdx;
      size--;
      const c = {}; c[lastId] = 'cur';
      F.push(snapOf(st, { cap: 'Round ' + round + ': remove the root **' + st.vals[rootId] + '** (set it aside as DELETED). Move the last value **' + st.vals[lastId] + '** to the root. Index ' + lastIdx + ' is free.', cls: c, sound: 'swap',
        ask: { q: 'Round ' + round + ': which value leaves the heap now? Click it.', pick: rootId, answerText: String(st.vals[rootId]) } }));
      if (size > 1) siftDown(st, F, kind, 0, size, {});
      st.frozen[lastIdx] = rootId;
      st.deleted = null;
      F.push(snapOf(st, { cap: 'Drop **' + st.vals[rootId] + '** into the free slot, index ' + lastIdx + '. It is **sorted** and frozen.', cls: {} }));
    }
    st.frozen[0] = st.heap[0];
    st.heap = [];
    const out = U.range(n).map(function (k) { return st.vals[st.frozen[k]]; });
    F.push(snapOf(st, { cap: 'One value left, so it is already in place. Result: **[' + out.join(', ') + ']** — ' + (kind === 'min' ? '**descending** (a min heap gives the smallest first, parked at the back).' : '**ascending**.'), mood: 'happy' }));
    return F;
  }

  function render(L, f, o, kind) {
    const nodes = [], edges = [];
    const n = f.n;
    const hn = Math.max(1, f.heap.length);
    const tw = Math.min(W - 60, Math.pow(2, Math.floor(Math.log2(hn))) * 120);
    const tp = K.heapPos(hn, tw, 44, 64).map(function (p) { return { x: p.x + (W - tw) / 2, y: p.y }; });
    f.heap.forEach(function (id, i) {
      nodes.push({ id: 'T' + id, x: tp[i].x, y: tp[i].y, label: f.vals[id], r: 21, cls: f.cls[id] || '', badge: i, badgeCls: 'b-idx' });
      if (i > 0) edges.push({ id: 'e' + i, a: 'T' + f.heap[Math.floor((i - 1) / 2)], b: 'T' + id, cls: f.cls[id] === 'bad' && f.cls[f.heap[Math.floor((i - 1) / 2)]] === 'bad' ? 'hot' : '' });
    });
    // array row
    const cell = Math.min(54, Math.floor((W - 200) / n) - 4);
    const xs = K.row(n, W - 120, cell, 4).map(function (x) { return x; });
    const ay = H - 56;
    for (let k = 0; k < n; k++) {
      nodes.push({ id: 'slot' + k, t: 'cell', x: xs[k], y: ay, w: cell, h: cell, label: '', cls: 'ghost', sub: '[' + k + ']' });
    }
    f.heap.forEach(function (id, i) { nodes.push({ id: 'A' + id, t: 'cell', x: xs[i], y: ay, w: cell, h: cell, label: f.vals[id], cls: f.cls[id] || '', z: 'front' }); });
    Object.keys(f.frozen).forEach(function (k) { const id = f.frozen[k]; nodes.push({ id: 'A' + id, t: 'cell', x: xs[k], y: ay, w: cell, h: cell, label: f.vals[id], cls: 'sorted' }); });
    if (f.deleted) {
      nodes.push({ id: 'delBox', t: 'box', x: W - 62, y: ay - 2, w: 104, h: cell + 38, label: 'DELETED', cls: 'red' });
      nodes.push({ id: 'A' + f.deleted, t: 'cell', x: W - 62, y: ay + 6, w: cell, h: cell, label: f.vals[f.deleted], cls: 'bad', z: 'front' });
    }
    if (f.pending.length) {
      nodes.push({ id: 'pendL', t: 'label', x: W - 20, y: 24, label: 'TO INSERT: ' + f.pending.map(function (id) { return f.vals[id]; }).join(' '), anchor: 'end', cls: 'ink', fs: 14 });
    }
    nodes.push({ id: 'arrL', t: 'label', x: 14, y: ay - cell / 2 - 14, label: 'ARRAY', anchor: 'start', fs: 12 });
    const frozenCount = Object.keys(f.frozen).length;
    if (frozenCount) nodes.push({ id: 'sortL', t: 'label', x: xs[n - 1] + cell / 2, y: ay - cell / 2 - 14, label: 'SORTED →', anchor: 'end', cls: 'ink', fs: 12 });
    L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
  }


  function buildLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'Heap tree and array', minW: 620 });
    let kind = 'min', how = 'insert';
    const inp = ui.field('VALUES', '40, 20, 30, 10, 5', { onEnter: run });
    const preset = ui.select('EXAMPLES', [{ v: '', label: 'Choose an example…' }].concat(PRESETS), '', function (v) {
      const p = PRESETS.filter(function (x) { return x.v === v; })[0];
      if (p) { inp.input.value = p.arr.join(', '); if (p.v === 'lesson') { kind = 'max'; how = 'heapify'; kSeg.set(kind); hSeg.set(how); } run(); }
    });
    const kSeg = ui.seg('TYPE', [{ v: 'min', label: 'MIN HEAP' }, { v: 'max', label: 'MAX HEAP' }], kind, function (v) { kind = v; run(); });
    const hSeg = ui.seg('BUILD BY', [{ v: 'insert', label: 'INSERT ONE BY ONE (CLASS)' }, { v: 'heapify', label: 'HEAPIFY (BOTTOM-UP)' }], how, function (v) { how = v; run(); });
    L.controls.appendChild(ui.row(inp.el, ui.button('BUILD', run, 'btn-yellow'), preset.el));
    L.controls.appendChild(ui.row(kSeg, hSeg));
    const ruleBody = L.panel('THE RULE');
    L.panel('INDEX FORMULAS').appendChild(ui.table(null, [['parent(i)', '(i − 1) / 2'], ['left(i)', '2i + 1'], ['right(i)', '2i + 2']]));
    L.panel('BADGES').appendChild(h('p', { class: 'panel-note' }, 'The small number on each tree node is its array index.'));
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 12 });
      if (!arr.length) arr = [40, 20, 30, 10, 5];
      inp.input.value = arr.join(', ');
      U.clear(ruleBody);
      ruleBody.appendChild(h('div', { class: 'formula' }, kind === 'min' ? 'parent ≤ children' : 'parent ≥ children'));
      ruleBody.appendChild(h('p', { class: 'panel-note' }, 'Fill the tree row by row, left to right (complete tree). Every insert and every swap is its own step, like on paper.'));
      L.player.load(buildFrames(arr, kind, how).frames, function (f, i, o) { render(L, f, o, kind); });
    }
    run();
    return L;
  }

  function sortLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'Heap sort', minW: 620 });
    let kind = 'min';
    const inp = ui.field('VALUES', '40, 20, 30, 10, 5', { onEnter: run });
    const kSeg = ui.seg('HEAP TYPE', [{ v: 'min', label: 'MIN → DESCENDING' }, { v: 'max', label: 'MAX → ASCENDING' }], kind, function (v) { kind = v; run(); });
    L.controls.appendChild(ui.row(inp.el, ui.button('SORT', run, 'btn-yellow'),
      ui.button('ACTIVITY 4 VALUES', function () { inp.input.value = '45, 20, 60, 10, 30, 5, 50, 15, 25, 40'; run(); }),
      ui.button('LESSON: 4 10 3 5 1', function () { inp.input.value = '4, 10, 3, 5, 1'; kind = 'max'; kSeg.set('max'); run(); })));
    L.controls.appendChild(kSeg);
    L.panel('EACH ROUND').appendChild(ui.table(null, [['1', 'Remove the root (DELETED)'], ['2', 'Move the last value to the root'], ['3', 'Heapify down (swap with the better child)'], ['4', 'Put the deleted value in the free slot (SORTED)']]));
    L.panel('SPEED').appendChild(h('p', { class: 'panel-note' }, 'Build: O(n). Sort: O(n log n) in every case. No bad input makes it O(n²).'));
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 12 });
      if (arr.length < 2) arr = [40, 20, 30, 10, 5];
      inp.input.value = arr.join(', ');
      L.player.load(sortFrames(arr, kind), function (f, i, o) { render(L, f, o, kind); });
    }
    run();
    return L;
  }

  function indexLab(root) {
    const L = ST.lab(root, { vb: [W, H], player: false, alt: 'Click a node to see its parent and children', minW: 620 });
    const inp = ui.field('HEAP ARRAY', '50, 30, 40, 10, 20, 35, 25', { onEnter: draw });
    L.controls.appendChild(ui.row(inp.el, ui.button('SHOW', draw, 'btn-yellow')));
    const out = L.panel('FOR THE CLICKED NODE');
    let arr = [], sel = 1;
    L.scene.clickFn = function (id) { const m = id.match(/^[TA](\d+)$/); if (m) { sel = Number(m[1]); draw(true); } };
    function draw(keep) {
      if (keep !== true) { arr = U.parseNums(inp.input.value, { max: 15 }); if (!arr.length) arr = [50, 30, 40, 10, 20, 35, 25]; sel = Math.min(sel, arr.length - 1); }
      const n = arr.length;
      const p = sel > 0 ? Math.floor((sel - 1) / 2) : -1, l = 2 * sel + 1, r = 2 * sel + 2;
      const role = function (i) { return i === sel ? 'cur' : i === p ? 'blue' : (i === l || i === r) ? 'done' : ''; };
      const tw = Math.min(W - 60, Math.pow(2, Math.floor(Math.log2(Math.max(1, n)))) * 120);
      const tp = K.heapPos(n, tw, 44, 70).map(function (q) { return { x: q.x + (W - tw) / 2, y: q.y }; });
      const nodes = [], edges = [];
      arr.forEach(function (v, i) {
        nodes.push({ id: 'T' + i, x: tp[i].x, y: tp[i].y, label: v, r: 21, cls: role(i) + ' clickable', badge: i });
        if (i > 0) edges.push({ id: 'e' + i, a: 'T' + Math.floor((i - 1) / 2), b: 'T' + i, cls: (i === sel && p >= 0) || ((i === l || i === r)) ? 'look' : '' });
      });
      const cell = Math.min(56, Math.floor((W - 100) / n) - 4);
      const xs = K.row(n, W, cell, 4);
      arr.forEach(function (v, i) { nodes.push({ id: 'A' + i, t: 'cell', x: xs[i], y: H - 60, w: cell, h: cell, label: v, cls: role(i) + ' clickable', sub: '[' + i + ']' }); });
      L.scene.draw({ nodes: nodes, edges: edges });
      U.clear(out);
      out.appendChild(ui.table(['', 'Formula', 'Index', 'Value'], [
        [{ v: 'Node', cls: 'hot' }, 'i', sel, arr[sel]],
        ['Parent', '(' + sel + ' − 1) / 2', p >= 0 ? p : '—', p >= 0 ? arr[p] : 'none (root)'],
        ['Left', '2·' + sel + ' + 1', l, l < n ? arr[l] : 'none'],
        ['Right', '2·' + sel + ' + 2', r, r < n ? arr[r] : 'none']
      ]));
      L.say('Click any node or box. Node **' + arr[sel] + '** is at index **' + sel + '**. ' + (p >= 0 ? 'Its parent is at (' + sel + ' − 1) / 2 = ' + p + '.' : 'It is the root, so it has no parent.'), 'idle');
    }
    draw();
    return L;
  }

  // ================================================================ lesson
  const lk = ST.lk;
  const RULES = [
    { rule: 'One insert or one swap = one step', note: 'We draw every move. Many books only show the finished heap.' },
    { rule: 'Heap sort: root → DELETED → SORTED slot', note: 'With a min heap this gives descending order. A max heap gives ascending.' }
  ];
  function lesson() {
    const HP = ST.kit.heapPos(7, 480, 26, 50);
    const AX = lk.xs(7, 40, 6);
    // a heap as an array of values; tree on top, the same array below. o: { cls: {v}, out: v, extra }
    const heap = function (arr, cap, o) {
      o = o || {};
      const n = [], e = [];
      arr.forEach(function (v, i) {
        const c = (o.cls && o.cls[v]) || '';
        n.push({ id: 't' + v, x: HP[i].x, y: HP[i].y, r: 18, label: v, cls: c, fs: 16 });
        n.push({ id: 'a' + v, t: 'cell', x: AX[i], y: 196, w: 40, h: 36, label: v, cls: c, fs: 16, top: o.idx ? String(i) : undefined });
        if (i) e.push({ id: 'h' + i, a: 't' + arr[Math.floor((i - 1) / 2)], b: 't' + v });
      });
      if (o.out !== undefined) n.push({ id: 't' + o.out, x: 440, y: 40, r: 18, label: o.out, cls: 'bad', fs: 16 });
      return { nodes: n.concat(o.extra || []), edges: e, cap: cap };
    };
    const H = [3, 5, 8, 9, 6, 10, 12];
    const look = function (i, cap) {
      const cls = {};
      cls[H[i]] = 'cur';
      [2 * i + 1, 2 * i + 2].forEach(function (c) { if (H[c] !== undefined) cls[H[c]] = 'wait'; });
      return heap(H, cap, { cls: cls, idx: true, extra: [lk.text('f', 470, 18, 'i = ' + i + ' → 2i+1 = ' + (2 * i + 1) + ', 2i+2 = ' + (2 * i + 2), 'ink', 12, 'end')] });
    };
    return [
      { title: 'Fill row by row', frames: [
        heap([3], 'Index 0 is the **root**.'),
        heap([3, 5, 8], 'Next row: left to right.'),
        heap(H, 'No gaps: a **complete** tree.'),
        heap(H, 'Same values, stored as an **array**.', { idx: true })
      ] },
      { title: 'Find kids with index math', frames: [
        look(0, 'Root at 0. Kids at **1** and **2**.'),
        look(1, 'At 1: kids at **3** and **4**.'),
        look(2, 'At 2: kids at **5** and **6**.')
      ] },
      { title: 'Insert: add at end, swap up', frames: [
        heap([3, 5, 8, 9, 6, 10], 'A min heap. Insert **2**.'),
        heap([3, 5, 8, 9, 6, 10, 2], 'Add it at the **end**.', { cls: { 2: 'cur' } }),
        heap([3, 5, 2, 9, 6, 10, 8], '2 < parent 8 → **swap**.', { cls: { 2: 'cur', 8: 'bad' } }),
        heap([2, 5, 3, 9, 6, 10, 8], '2 < parent 3 → **swap**.', { cls: { 2: 'cur', 3: 'bad' } }),
        heap([2, 5, 3, 9, 6, 10, 8], 'At the root. **O(log n)** swaps at most.', { cls: { 2: 'done' } })
      ] },
      { title: 'Remove root: last goes up', frames: [
        heap([2, 5, 3, 9, 6, 10, 8], 'Remove the root (the min).', { cls: { 2: 'cur' } }),
        heap([8, 5, 3, 9, 6, 10], 'Take it out. The **last** value moves up.', { out: 2, cls: { 8: 'cur' } }),
        heap([3, 5, 8, 9, 6, 10], '8 > smaller kid 3 → **swap down**.', { out: 2, cls: { 8: 'cur', 3: 'bad' } }),
        heap([3, 5, 8, 9, 6, 10], '8 < 10. Stop. Heap again.', { cls: { 3: 'done' } })
      ] },
      { title: 'A heap is not sorted', trap: true, frames: [
        heap([1, 4, 2, 9, 5, 3, 7], 'A valid min heap.'),
        heap([1, 4, 2, 9, 5, 3, 7], 'Left kid 4 > right kid 2. **Allowed.**', { cls: { 4: 'bad', 2: 'bad' } }),
        heap([1, 4, 2, 9, 5, 3, 7], 'Only **parent ≤ child** is promised.', { cls: { 1: 'done', 4: 'wait', 2: 'wait' } })
      ] }
    ];
  }

  ST.topic({
    id: 'heaps', n: 8, color: 'red', icon: 'heaps',
    title: 'Heaps & Heap Sort',
    short: 'A complete tree stored in an array. The min or max is always on top.',
    blurb: 'The best item is always at the root. Perfect for priority queues.',
    cheat: {
      head: ['Operation', 'How', 'Time'],
      rows: [['Peek min/max', 'Look at index 0', 'O(1)'], ['Insert', 'Add at end, move up', 'O(log n)'], ['Remove root', 'Last to root, move down', 'O(log n)'], ['Build (heapify)', 'Bottom-up', 'O(n)'], ['Heap sort', 'Remove root n times', 'O(n log n)']]
    },
    lesson: lesson(),
    rules: RULES,
    labs: [
      { id: 'build', title: 'Build a heap', tag: 'TRACE', setup: buildLab },
      { id: 'sort', title: 'Heap sort', tag: 'TRACE', setup: sortLab },
      { id: 'index', title: 'Index explorer', tag: 'PLAY', setup: indexLab }
    ]
  });

  ST.heapFrames = { build: buildFrames, sort: sortFrames };
})(window.ST);
