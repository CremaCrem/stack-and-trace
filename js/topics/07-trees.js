/* World 7 — Trees, BST, traversals, AVL (Week 7) */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui, K = ST.kit;
  const W = 860, H = 400;

  const PRESETS = [
    { v: 'lesson', label: 'Lesson: 50 30 70 20 40 60 80', arr: [50, 30, 70, 20, 40, 60, 80] },
    { v: 'activity', label: 'Class activity: 10 20 30 25 40 15 17 14 45 50 5 55', arr: [10, 20, 30, 25, 40, 15, 17, 14, 45, 50, 5, 55] },
    { v: 'sorted', label: 'Sorted input: 10 20 30 40 50', arr: [10, 20, 30, 40, 50] },
    { v: 'mix', label: 'Mixed: 45 15 79 90 10 55 12 20 50', arr: [45, 15, 79, 90, 10, 55, 12, 20, 50] }
  ];

  function bstInsert(root, v, id) {
    const node = { id: id, v: v, left: null, right: null };
    if (!root) return { root: node, path: [], node: node };
    let cur = root;
    const path = [];
    while (true) {
      path.push({ n: cur, dir: v < cur.v ? 'left' : 'right' });
      if (v === cur.v) return { root: root, path: path, dup: true };
      const side = v < cur.v ? 'left' : 'right';
      if (!cur[side]) { cur[side] = node; return { root: root, path: path, node: node }; }
      cur = cur[side];
    }
  }

  function buildBST(arr) {
    let root = null;
    arr.forEach(function (v, k) { root = bstInsert(root, v, 't' + k).root; });
    return root;
  }

  function drawTree(L, f, o, extra) {
    extra = extra || {};
    const lay = K.treeLayout(f.tree, W, H, { top: extra.top || 48, bottom: extra.bottom || 50, maxGapY: 78, maxStep: 72 });
    const nodes = [];
    const pathE = f.pathE || {};
    K.nodesOf(f.tree).forEach(function (n) {
      const p = lay.pos[n.id];
      const spec = { id: n.id, x: p.x, y: p.y, label: n.v, r: 22, cls: (f.cls && f.cls[n.id]) || '' };
      if (f.badge && f.badge[n.id] !== undefined) { spec.badge = f.badge[n.id]; spec.badgeCls = f.badgeCls && f.badgeCls[n.id]; }
      if (f.top && f.top[n.id] !== undefined) spec.top = f.top[n.id];
      if (f.spawn === n.id && f.spawnFrom && lay.pos[f.spawnFrom]) spec.from = { x: lay.pos[f.spawnFrom].x, y: lay.pos[f.spawnFrom].y };
      nodes.push(spec);
    });
    const edges = K.treeEdges(f.tree, function (a, b) { return pathE[a.id + '-' + b.id] || ''; });
    if (f.ghost) {
      const pp = lay.pos[f.ghost.parent];
      if (pp) {
        const gx = pp.x + (f.ghost.side === 'left' ? -36 : 36), gy = pp.y + 60;
        nodes.push({ id: 'ghost', x: gx, y: gy, r: 18, label: '∅', cls: 'ghost' });
        edges.push({ id: 'ghostE', a: f.ghost.parent, b: 'ghost', cls: 'dash dim' });
      }
    }
    (extra.nodes || []).forEach(function (n) { nodes.push(n); });
    L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
    return lay;
  }

  // ================================================================ BST build & search
  const BST_CODE = [
    'Node Insert(Node n, int v) {',
    '  if (n == null) return new Node{Data = v};',
    '  if (v < n.Data) n.Left = Insert(n.Left, v);',
    '  else n.Right = Insert(n.Right, v);',
    '  return n;',
    '}',
    'bool Search(Node n, int v) {',
    '  if (n == null) return false;',
    '  if (v == n.Data) return true;',
    '  return v < n.Data ? Search(n.Left, v)',
    '                    : Search(n.Right, v);',
    '}'
  ];

  function bstFrames(arr, search) {
    const F = [];
    let root = null;
    const snap = function (extra) { return Object.assign({ tree: K.cloneTree(root), cls: {}, pathE: {} }, extra); };
    F.push(snap({ cap: 'Build a BST. Rule: **smaller → left**, **larger → right**.' }));
    arr.forEach(function (v, k) {
      const id = 't' + k;
      if (!root) {
        root = { id: id, v: v, left: null, right: null };
        const c = {}; c[id] = 'new';
        F.push(snap({ cap: 'Insert **' + v + '**. The tree is empty, so ' + v + ' becomes the **root**.', cls: c, line: 1, spawn: id }));
        return;
      }
      let cur = root;
      const pathE = {};
      const cls = {};
      let prevId = null;
      while (true) {
        cls[cur.id] = 'cur';
        if (prevId) pathE[prevId + '-' + cur.id] = 'look';
        if (v === cur.v) {
          F.push(snap({ cap: v + ' is already in the tree. A BST keeps no duplicates here. Skip.', cls: Object.assign({}, cls), pathE: Object.assign({}, pathE), mood: 'oops' }));
          break;
        }
        const side = v < cur.v ? 'left' : 'right';
        const word = side === 'left' ? '**' + v + ' < ' + cur.v + '** → go left' : '**' + v + ' > ' + cur.v + '** → go right';
        F.push(snap({ cap: 'Insert ' + v + ': ' + word + '.', cls: Object.assign({}, cls), pathE: Object.assign({}, pathE), line: side === 'left' ? 2 : 3,
          ask: { q: 'Insert ' + v + '. At ' + cur.v + ': go left or right?', options: ['Left', 'Right'], answer: side === 'left' ? 0 : 1 } }));
        cls[cur.id] = 'faint';
        if (!cur[side]) {
          const nn = { id: id, v: v, left: null, right: null };
          cur[side] = nn;
          const c2 = Object.assign({}, cls); c2[id] = 'new'; c2[cur.id] = '';
          const pe = Object.assign({}, pathE); pe[cur.id + '-' + id] = 'look';
          F.push(snap({ cap: 'The ' + side + ' spot of ' + cur.v + ' is empty. Put **' + v + '** there.', cls: c2, pathE: pe, line: 1, spawn: id, spawnFrom: cur.id }));
          break;
        }
        prevId = cur.id;
        cur = cur[side];
      }
    });
    const hgt = K.height(root) - 1;
    F.push(snap({ cap: 'BST built. Height = **' + hgt + '** edges. ' + (hgt >= arr.length - 1 && arr.length > 2 ? 'It looks like a linked list! Searching is O(n) now.' : 'Short trees are fast to search.'), mood: 'happy', stat: { h: hgt } }));
    if (search !== null && search !== undefined && root) {
      let cur = root;
      const cls = {}, pathE = {};
      let prevId = null, steps = 0;
      F.push(snap({ cap: 'Now **search for ' + search + '**. Start at the root.', line: 6 }));
      while (cur) {
        steps++;
        cls[cur.id] = 'cur';
        if (prevId) pathE[prevId + '-' + cur.id] = 'path';
        if (search === cur.v) {
          cls[cur.id] = 'done';
          F.push(snap({ cap: search + ' == ' + cur.v + ' → **FOUND** in ' + steps + ' steps.', cls: Object.assign({}, cls), pathE: Object.assign({}, pathE), line: 8, mood: 'happy' }));
          return F;
        }
        const side = search < cur.v ? 'left' : 'right';
        F.push(snap({ cap: search + (side === 'left' ? ' < ' : ' > ') + cur.v + ' → go **' + side + '**.', cls: Object.assign({}, cls), pathE: Object.assign({}, pathE), line: side === 'left' ? 9 : 10,
          ask: { q: 'Search ' + search + '. At ' + cur.v + ': go left or right?', options: ['Left', 'Right'], answer: side === 'left' ? 0 : 1 } }));
        cls[cur.id] = 'faint';
        if (!cur[side]) {
          F.push(snap({ cap: 'The ' + side + ' child of ' + cur.v + ' is empty → **NOT FOUND** (' + steps + ' steps).', cls: Object.assign({}, cls), pathE: Object.assign({}, pathE), line: 7, mood: 'oops', ghost: { parent: cur.id, side: side } }));
          return F;
        }
        prevId = cur.id;
        cur = cur[side];
      }
    }
    return F;
  }

  function bstLab(root) {
    const L = ST.lab(root, { vb: [W, H], code: BST_CODE, codeTitle: 'C# — FROM CLASS', alt: 'Binary search tree insert and search', minW: 620 });
    const inp = ui.field('INSERT IN THIS ORDER', '50, 30, 70, 20, 40, 60, 80', { onEnter: run });
    const sIn = ui.field('THEN SEARCH', '40', { small: true, onEnter: run });
    const preset = ui.select('EXAMPLES', [{ v: '', label: 'Choose an example…' }].concat(PRESETS), '', function (v) {
      const p = PRESETS.filter(function (x) { return x.v === v; })[0];
      if (p) { inp.input.value = p.arr.join(', '); run(); }
    });
    L.controls.appendChild(ui.row(inp.el, sIn.el, ui.button('RUN', run, 'btn-yellow')));
    L.controls.appendChild(ui.row(preset.el, ui.button('SEARCH 45 (MISSING)', function () { sIn.input.value = '45'; run(); })));
    const stats = L.panel('TREE SIZE', { before: true });
    function render(f, i, o) {
      drawTree(L, f, o);
      U.clear(stats);
      const cnt = K.nodesOf(f.tree).length;
      stats.appendChild(h('div', { class: 'stats' }, ui.stat('NODES', cnt), ui.stat('HEIGHT', Math.max(0, K.height(f.tree) - 1))));
      stats.appendChild(h('p', { class: 'panel-note' }, 'Height counts edges from the root down to the deepest leaf.'));
    }
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 15 });
      if (!arr.length) arr = PRESETS[0].arr.slice();
      inp.input.value = arr.join(', ');
      const s = parseInt(sIn.input.value, 10);
      L.player.load(bstFrames(arr, isFinite(s) ? s : null), render);
    }
    run();
    return L;
  }

  // ================================================================ traversals
  function travFrames(root, mode) {
    const F = [];
    const cls = {}, badge = {};
    const out = [];
    let count = 0;
    const stack = [];
    const snap = function (extra) {
      const c = Object.assign({}, cls);
      stack.forEach(function (n) { if (!c[n.id]) c[n.id] = 'wait'; });
      return Object.assign({ tree: root, cls: c, badge: Object.assign({}, badge), badgeCls: {}, out: out.slice(), stack: stack.map(function (n) { return n.v; }), queue: null }, extra);
    };
    const visit = function (n, why) {
      count++;
      badge[n.id] = count;
      cls[n.id] = 'done';
      out.push(n.v);
      const f = snap({ cap: 'Visit **' + n.v + '**' + (why ? ' (' + why + ')' : '') + '. Output: ' + out.join(' ') + '.', ask: { q: 'Which node is visited next? Click it.', pick: n.id, answerText: String(n.v) } });
      f.cls[n.id] = 'cur';
      F.push(f);
    };
    const names = { pre: 'Pre-order: **Node → Left → Right**.', in: 'In-order: **Left → Node → Right**.', post: 'Post-order: **Left → Right → Node**.', level: 'Level-order: **level by level**, left to right. It uses a **queue**.' };
    F.push(snap({ cap: names[mode] }));
    if (mode === 'level') {
      const q = [root];
      F.push(snap({ cap: 'Put the root ' + root.v + ' in the queue.', queue: q.map(function (n) { return n.v; }) }));
      while (q.length) {
        const n = q.shift();
        count++; badge[n.id] = count; cls[n.id] = 'done'; out.push(n.v);
        const kids = [n.left, n.right].filter(Boolean);
        kids.forEach(function (k) { q.push(k); });
        const f = snap({ cap: 'Dequeue and visit **' + n.v + '**. ' + (kids.length ? 'Enqueue its children: ' + kids.map(function (k) { return k.v; }).join(', ') + '.' : 'No children.'), queue: q.map(function (k) { return k.v; }),
          ask: { q: 'Which node is visited next? Click it.', pick: n.id, answerText: String(n.v) } });
        f.cls[n.id] = 'cur';
        q.forEach(function (k) { f.cls[k.id] = 'wait'; });
        F.push(f);
      }
    } else {
      (function walk(n) {
        if (!n) return;
        stack.push(n);
        if (mode === 'pre') { visit(n, 'node first'); }
        else {
          const f = snap({ cap: 'At **' + n.v + '**: ' + (mode === 'in' ? (n.left ? 'go left first.' : 'no left child.') : (n.left || n.right ? 'children first, then the node.' : 'no children.')) });
          f.cls[n.id] = 'cur';
          F.push(f);
        }
        walk(n.left);
        if (mode === 'in') visit(n, n.left ? 'its left side is done' : 'no left child');
        walk(n.right);
        if (mode === 'post') visit(n, 'both sides are done');
        stack.pop();
      })(root);
    }
    F.push(snap({ cap: 'Done. ' + (mode === 'in' ? 'In-order on a BST is always **sorted**: ' : 'Result: ') + '**' + out.join(' ') + '**.', mood: 'happy', queue: mode === 'level' ? [] : null }));
    return F;
  }

  function travLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'Tree traversal animation', minW: 620 });
    let mode = 'in';
    const inp = ui.field('BUILD BST FROM', '50, 30, 70, 20, 40, 60, 80', { onEnter: run });
    const seg = ui.seg('TRAVERSAL', [{ v: 'pre', label: 'PRE-ORDER' }, { v: 'in', label: 'IN-ORDER' }, { v: 'post', label: 'POST-ORDER' }, { v: 'level', label: 'LEVEL-ORDER' }], mode, function (v) { mode = v; run(); });
    L.controls.appendChild(seg);
    L.controls.appendChild(ui.row(inp.el, ui.button('BUILD', run, 'btn-yellow'), ui.button('CLASS ACTIVITY TREE', function () { inp.input.value = PRESETS[1].arr.join(', '); run(); })));
    const outBody = L.panel('OUTPUT');
    const sBody = L.panel('WAITING (CALL STACK / QUEUE)');
    L.panel('RULES').appendChild(ui.table(null, [['Pre', 'Node, Left, Right'], ['In', 'Left, Node, Right'], ['Post', 'Left, Right, Node'], ['Level', 'Row by row (queue)']]));
    function render(f, i, o) {
      drawTree(L, f, o);
      U.clear(outBody);
      outBody.appendChild(ui.strip(f.out.map(function (v, k) { return { v: v, cls: k === f.out.length - 1 ? 'done new' : '' }; }), { empty: 'Nothing visited yet' }));
      U.clear(sBody);
      if (f.queue) { sBody.appendChild(h('div', { class: 'field-lbl' }, 'QUEUE (front → back)')); sBody.appendChild(ui.strip(f.queue.map(function (v) { return { v: v, cls: 'wait' }; }), { empty: 'empty' })); }
      else { sBody.appendChild(h('div', { class: 'field-lbl' }, 'CALL STACK (bottom → top)')); sBody.appendChild(ui.strip(f.stack.map(function (v) { return { v: v, cls: 'wait' }; }), { empty: 'empty' })); }
    }
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 15 });
      if (!arr.length) arr = PRESETS[0].arr.slice();
      inp.input.value = arr.join(', ');
      L.player.load(travFrames(buildBST(arr), mode), render);
    }
    run();
    return L;
  }

  // ================================================================ AVL
  function hgt(n) { return n ? 1 + Math.max(hgt(n.left), hgt(n.right)) : 0; }
  function bf(n) { return hgt(n.left) - hgt(n.right); }

  function rotateRight(z) { const y = z.left; z.left = y.right; y.right = z; return y; }
  function rotateLeft(z) { const y = z.right; z.right = y.left; y.left = z; return y; }

  function avlFrames(arr) {
    const F = [];
    let root = null;
    const info = function () {
      const badge = {}, top = {}, bc = {};
      K.nodesOf(root).forEach(function (n) {
        const b = bf(n);
        badge[n.id] = (b > 0 ? '+' : '') + b;
        bc[n.id] = Math.abs(b) > 1 ? 'b-red' : (b === 0 ? '' : 'b-blue');
        top[n.id] = '(' + hgt(n.left) + ',' + hgt(n.right) + ')';
      });
      return { badge: badge, top: top, badgeCls: bc };
    };
    const snap = function (extra) { return Object.assign({ tree: K.cloneTree(root) }, info(), { cls: {}, pathE: {} }, extra); };
    F.push(snap({ cap: 'AVL tree = BST + **balance check** after every insert. BF = height(left) − height(right). Allowed: −1, 0, +1.' }));
    // replace node z (found by id) with newSub in the tree
    function replace(zId, newSub) {
      if (root.id === zId) { root = newSub; return; }
      (function walk(n) {
        if (!n) return;
        if (n.left && n.left.id === zId) { n.left = newSub; return; }
        if (n.right && n.right.id === zId) { n.right = newSub; return; }
        walk(n.left); walk(n.right);
      })(root);
    }
    arr.forEach(function (v, k) {
      const id = 'a' + k;
      const res = bstInsert(root, v, id);
      if (res.dup) { F.push(snap({ cap: v + ' is already in the tree. Skip.', mood: 'oops' })); return; }
      root = res.root;
      const pathE = {};
      res.path.forEach(function (p, i) { const nx = res.path[i + 1] ? res.path[i + 1].n : res.node; pathE[p.n.id + '-' + nx.id] = 'look'; });
      const c = {}; c[id] = 'new';
      const route = res.path.map(function (p) { return v < p.n.v ? 'L' : 'R'; }).join(' ');
      // lowest unbalanced ancestor
      let z = null;
      for (let i = res.path.length - 1; i >= 0; i--) { if (Math.abs(bf(res.path[i].n)) > 1) { z = res.path[i].n; break; } }
      F.push(snap({ cap: 'Insert **' + v + '**' + (route ? ' (path: ' + route + ')' : ' as the root') + '. ' + (z ? 'Check the balance factors…' : 'All BF are −1, 0 or +1. **Balanced.** No rotation.'),
        cls: c, pathE: pathE, spawn: id, spawnFrom: res.path.length ? res.path[res.path.length - 1].n.id : null }));
      if (!z) return;
      const b = bf(z);
      let kase;
      if (b > 1) kase = v < z.left.v ? 'LL' : 'LR';
      else kase = v > z.right.v ? 'RR' : 'RL';
      const cz = {}; cz[z.id] = 'bad'; cz[id] = 'new';
      const fix = { LL: 'one **right** rotation', RR: 'one **left** rotation', LR: '**left** rotation on the child, then **right** rotation', RL: '**right** rotation on the child, then **left** rotation' }[kase];
      F.push(snap({ cap: 'Node **' + z.v + '** has BF = ' + (b > 0 ? '+' : '') + b + ' → **unbalanced!** This is the **' + kase + '** case. Fix: ' + fix + '.', cls: cz, mood: 'oops',
        ask: { q: 'Node ' + z.v + ' has BF ' + (b > 0 ? '+' : '') + b + ' and ' + v + ' was just added. Which case is it?', options: ['LL', 'RR', 'LR', 'RL'], answer: ['LL', 'RR', 'LR', 'RL'].indexOf(kase) } }));
      if (kase === 'LR') {
        const child = z.left;
        z.left = rotateLeft(child);
        const c1 = {}; c1[z.id] = 'bad'; c1[z.left.id] = 'cur';
        F.push(snap({ cap: 'Step 1: **left rotation** on ' + child.v + '. Now it is a straight LL line.', cls: c1, sound: 'swap' }));
      }
      if (kase === 'RL') {
        const child = z.right;
        z.right = rotateRight(child);
        const c1 = {}; c1[z.id] = 'bad'; c1[z.right.id] = 'cur';
        F.push(snap({ cap: 'Step 1: **right rotation** on ' + child.v + '. Now it is a straight RR line.', cls: c1, sound: 'swap' }));
      }
      const newTop = (kase === 'LL' || kase === 'LR') ? rotateRight(z) : rotateLeft(z);
      replace(z.id, newTop);
      const c2 = {}; c2[newTop.id] = 'done';
      F.push(snap({ cap: (kase.length === 2 && (kase === 'LR' || kase === 'RL') ? 'Step 2: ' : '') + '**' + ((kase === 'LL' || kase === 'LR') ? 'Right' : 'Left') + ' rotation** at ' + z.v + '. **' + newTop.v + '** moves up. Balanced again!', cls: c2, sound: 'swap' }));
    });
    const hh = K.height(root) - 1;
    F.push(snap({ cap: 'All values inserted. AVL height: **' + hh + '** edges. A plain BST with the same order would be height **' + (K.height(buildBST(arr)) - 1) + '**.', mood: 'happy' }));
    return F;
  }

  function avlLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'AVL tree rotations', minW: 620 });
    const inp = ui.field('INSERT IN THIS ORDER', '10, 20, 30, 25, 40, 15, 17, 14, 45, 50, 5, 55', { onEnter: run });
    L.controls.appendChild(ui.row(inp.el, ui.button('RUN', run, 'btn-yellow')));
    L.controls.appendChild(ui.row(
      ui.button('LL: 30 20 10', function () { inp.input.value = '30, 20, 10'; run(); }),
      ui.button('RR: 10 20 30', function () { inp.input.value = '10, 20, 30'; run(); }),
      ui.button('LR: 30 10 20', function () { inp.input.value = '30, 10, 20'; run(); }),
      ui.button('RL: 10 30 20', function () { inp.input.value = '10, 30, 20'; run(); }),
      ui.button('CLASS ACTIVITY', function () { inp.input.value = '10, 20, 30, 25, 40, 15, 17, 14, 45, 50, 5, 55'; run(); })));
    L.panel('HOW TO READ IT').appendChild(ui.table(null, [['(HL,HR)', 'heights of left and right subtrees'], ['Badge', 'BF = HL − HR'], ['Red badge', '|BF| > 1 → rotate'], ['Empty subtree', 'height 0']]));
    L.panel('THE 4 CASES').appendChild(ui.table(['Case', 'Fix'], [['LL', 'Right rotation'], ['RR', 'Left rotation'], ['LR', 'Left, then right'], ['RL', 'Right, then left']]));
    function render(f, i, o) { drawTree(L, f, o, { top: 60 }); }
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 15 });
      if (!arr.length) arr = [10, 20, 30];
      inp.input.value = arr.join(', ');
      L.player.load(avlFrames(arr), render);
    }
    run();
    return L;
  }

  ST.topic({
    id: 'trees', n: 7, week: 'Week 7', color: 'teal', icon: 'trees',
    title: 'Trees, BST & AVL',
    short: 'Build a BST, walk it four ways, and balance it with rotations.',
    blurb: 'Data in a hierarchy: one root on top, branches below.',
    remember: [
      { big: 'LEFT < NODE < RIGHT', text: 'BST rule. It is used to insert and to search.' },
      { big: 'IN-ORDER = SORTED', text: 'Left, Node, Right on a BST always gives sorted values.' },
      { big: 'BF ∈ {−1, 0, +1}', text: 'AVL: if a balance factor leaves this range, rotate.' }
    ],
    cheat: {
      head: ['Traversal', 'Order', 'On 50 30 70 20 40 60 80'],
      rows: [['Pre-order', 'Node, Left, Right', '50 30 20 40 70 60 80'], ['In-order', 'Left, Node, Right', '20 30 40 50 60 70 80'], ['Post-order', 'Left, Right, Node', '20 40 30 60 80 70 50'], ['Level-order', 'Level by level', '50 30 70 20 40 60 80']]
    },
    mistake: 'A balanced BST searches in O(log n), but inserting sorted values makes a "stick" with O(n) search. AVL rotations prevent that.',
    labs: [
      { id: 'bst', title: 'BST insert & search', tag: 'TRACE', setup: bstLab },
      { id: 'traversal', title: 'Traversals', tag: 'TRACE', setup: travLab },
      { id: 'avl', title: 'AVL rotations', tag: 'TRACE', setup: avlLab }
    ]
  });

  ST.treeFrames = { bst: bstFrames, trav: travFrames, avl: avlFrames, buildBST: buildBST };
})(window.ST);
