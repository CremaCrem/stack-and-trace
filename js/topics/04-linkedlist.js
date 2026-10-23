/* World 4 — Linked Lists (Week 3) */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;
  const W = 1000, H = 360, ROWY = 150, NEWY = 285;

  const CODE = {
    search: ['Node current = head;', 'while (current != null) {', '    if (current.Data == target) break; // found!', '    current = current.Next;', '}'],
    head: ['Node newNode = new Node(value);', 'newNode.Next = head;', 'head = newNode;'],
    tail: ['Node current = head;', 'while (current.Next != null)', '    current = current.Next;', 'Node newNode = new Node(value);', 'current.Next = newNode;  // newNode.Next = null'],
    after: ['Node current = head;', 'while (current.Data != after)', '    current = current.Next;', 'Node newNode = new Node(value);', 'newNode.Next = current.Next;  // 1st', 'current.Next = newNode;       // 2nd'],
    del: ['if (head.Data == target) {', '    head = head.Next; return;', '}', 'Node prev = head, current = head.Next;', 'while (current.Data != target) {', '    prev = current;', '    current = current.Next;', '}', 'prev.Next = current.Next;  // bypass'],
    update: ['Node current = head;', 'while (current != null) {', '    if (current.Data == target) {', '        current.Data = newValue;  // links stay', '        break;', '    }', '    current = current.Next;', '}']
  };

  const ADDRS = ['0x1A0', '0x3F4', '0x0D8', '0x7C2', '0x2B6', '0x5E0', '0x4A8', '0x6F1', '0x19C'];

  function List(vals) {
    this.v = {}; this.next = {}; this.addr = {}; this.uid = 0;
    this.head = null;
    let prev = null;
    const self = this;
    vals.forEach(function (x) {
      const id = self.make(x);
      if (prev) self.next[prev] = id; else self.head = id;
      prev = id;
    });
  }
  List.prototype.make = function (x) {
    const id = 'n' + (this.uid++);
    this.v[id] = x; this.next[id] = null; this.addr[id] = ADDRS[(this.uid - 1) % ADDRS.length];
    return id;
  };
  List.prototype.order = function () {
    const out = [];
    let c = this.head, guard = 0;
    while (c && guard++ < 50) { out.push(c); c = this.next[c]; }
    return out;
  };
  List.prototype.find = function (x) { return this.order().filter(function (id) { return String(this.v[id]) === String(x); }, this)[0] || null; };

  function opFrames(vals, op, a, b) {
    const Ls = new List(vals);
    const F = [];
    let row = Ls.order();
    const snap = function (extra) {
      return Object.assign({
        v: Object.assign({}, Ls.v), next: Object.assign({}, Ls.next), addr: Ls.addr, head: Ls.head,
        row: row.slice(), off: {}, cls: {}, ptrs: [], bend: {}
      }, extra);
    };
    const ptr = function (label, id, cls) { return { label: label, at: id, cls: cls }; };
    const c1 = function (id, cls) { const o = {}; if (id) o[id] = cls; return o; };

    if (op === 'search') {
      F.push(snap({ cap: 'Search for **' + a + '**. We can only start at **HEAD** and follow the arrows.', line: 0 }));
      let cur = Ls.head, steps = 0;
      const target = Ls.find(a);
      while (cur) {
        steps++;
        const hit = String(Ls.v[cur]) === String(a);
        F.push(snap({ cap: 'current → ' + Ls.v[cur] + '. ' + (hit ? '**' + a + ' found!** Steps: ' + steps + '.' : Ls.v[cur] + ' ≠ ' + a + '. Follow `Next`.'),
          line: hit ? 2 : [2, 3], cls: c1(cur, hit ? 'done' : 'cur'), ptrs: [ptr('CURRENT', cur, 'yellow')], mood: hit ? 'happy' : null,
          ask: steps === 1 && target ? { q: 'Which node will the search stop at? Click it.', pick: target, answerText: String(a) } : null }));
        if (hit) return F;
        cur = Ls.next[cur];
      }
      F.push(snap({ cap: 'current = **NULL**. We reached the end. ' + a + ' is not in the list.', line: 1, mood: 'oops', ptrs: [] }));
      return F;
    }

    if (op === 'update') {
      F.push(snap({ cap: 'Update **' + a + '** to **' + b + '**. First, find the node.', line: 0 }));
      let cur = Ls.head;
      while (cur) {
        if (String(Ls.v[cur]) === String(a)) {
          F.push(snap({ cap: 'Found ' + a + '.', line: 2, cls: c1(cur, 'cur'), ptrs: [ptr('CURRENT', cur, 'yellow')] }));
          Ls.v[cur] = b;
          F.push(snap({ cap: 'Change only the **data**: ' + a + ' → **' + b + '**. The arrows do not change.', line: 3, cls: c1(cur, 'done'), ptrs: [ptr('CURRENT', cur, 'yellow')], sound: 'swap' }));
          F.push(snap({ cap: 'Done. Same nodes, same links, new value.', line: 4 }));
          return F;
        }
        F.push(snap({ cap: Ls.v[cur] + ' ≠ ' + a + '. Next.', line: 6, cls: c1(cur, 'cur'), ptrs: [ptr('CURRENT', cur, 'yellow')] }));
        cur = Ls.next[cur];
      }
      F.push(snap({ cap: a + ' is not in the list. Nothing to update.', mood: 'oops' }));
      return F;
    }

    if (op === 'head') {
      F.push(snap({ cap: 'Insert **' + a + '** at the front.', line: 0 }));
      const nn = Ls.make(a);
      const offPos = {}; offPos[nn] = { col: -0.5, y: NEWY };
      F.push(snap({ cap: 'Make a new node with **' + a + '**. Its Next is NULL for now.', line: 0, off: offPos, cls: c1(nn, 'cur'), ptrs: [ptr('NEW', nn, 'yellow')] }));
      Ls.next[nn] = Ls.head;
      F.push(snap({ cap: '`newNode.Next = head` → the new node points to **' + (Ls.head ? Ls.v[Ls.head] : 'NULL') + '**.', line: 1, off: offPos, cls: c1(nn, 'cur'), ptrs: [ptr('NEW', nn, 'yellow')] }));
      Ls.head = nn;
      F.push(snap({ cap: '`head = newNode` → HEAD now points to **' + a + '**.', line: 2, off: offPos, cls: c1(nn, 'done'), ptrs: [ptr('NEW', nn, 'yellow')] }));
      row = Ls.order();
      F.push(snap({ cap: 'Done. No shifting needed. Insert at head is **O(1)**.', mood: 'happy' }));
      return F;
    }

    if (op === 'tail') {
      F.push(snap({ cap: 'Insert **' + a + '** at the end. First, walk to the last node.', line: 0 }));
      if (!Ls.head) {
        const nn0 = Ls.make(a);
        Ls.head = nn0; row = Ls.order();
        F.push(snap({ cap: 'The list was empty, so the new node becomes the head.', cls: c1(nn0, 'done') }));
        return F;
      }
      let cur = Ls.head;
      F.push(snap({ cap: 'current = head (' + Ls.v[cur] + ').', line: 0, cls: c1(cur, 'cur'), ptrs: [ptr('CURRENT', cur, 'yellow')] }));
      while (Ls.next[cur]) {
        cur = Ls.next[cur];
        F.push(snap({ cap: 'Next is not NULL. Move to ' + Ls.v[cur] + '.', line: [1, 2], cls: c1(cur, 'cur'), ptrs: [ptr('CURRENT', cur, 'yellow')] }));
      }
      const nn = Ls.make(a);
      const offPos = {}; offPos[nn] = { col: row.length - 0.5, y: NEWY };
      const cl = c1(cur, 'cur'); cl[nn] = 'cur';
      F.push(snap({ cap: '**' + Ls.v[cur] + '** is the last node (Next = NULL). Make the new node.', line: 3, off: offPos, cls: cl, ptrs: [ptr('CURRENT', cur, 'yellow'), ptr('NEW', nn, 'blue')] }));
      Ls.next[cur] = nn;
      const cl2 = c1(cur, 'cur'); cl2[nn] = 'done';
      F.push(snap({ cap: '`current.Next = newNode`. The new node keeps Next = NULL.', line: 4, off: offPos, cls: cl2, ptrs: [ptr('CURRENT', cur, 'yellow'), ptr('NEW', nn, 'blue')] }));
      row = Ls.order();
      F.push(snap({ cap: 'Done. We had to walk the whole list first, so this is **O(n)** (unless we keep a tail pointer).', mood: 'happy' }));
      return F;
    }

    if (op === 'after') {
      const target = Ls.find(a);
      F.push(snap({ cap: 'Insert **' + b + '** right after **' + a + '**.', line: 0 }));
      let cur = Ls.head;
      while (cur && cur !== target) {
        F.push(snap({ cap: Ls.v[cur] + ' is not ' + a + '. Move on.', line: [1, 2], cls: c1(cur, 'cur'), ptrs: [ptr('CURRENT', cur, 'yellow')] }));
        cur = Ls.next[cur];
      }
      if (!target) { F.push(snap({ cap: a + ' is not in the list, so we cannot insert after it.', mood: 'oops' })); return F; }
      F.push(snap({ cap: 'Found **' + a + '**. This is where we insert.', line: 1, cls: c1(cur, 'cur'), ptrs: [ptr('CURRENT', cur, 'yellow')] }));
      const nn = Ls.make(b);
      const col = row.indexOf(cur) + 0.5;
      const offPos = {}; offPos[nn] = { col: col, y: NEWY };
      const cl = c1(cur, 'cur'); cl[nn] = 'cur';
      F.push(snap({ cap: 'Make the new node **' + b + '**.', line: 3, off: offPos, cls: cl, ptrs: [ptr('CURRENT', cur, 'yellow'), ptr('NEW', nn, 'blue')] }));
      const after = Ls.next[cur];
      Ls.next[nn] = after;
      F.push(snap({ cap: 'Step 1: `newNode.Next = current.Next`. ' + b + ' now points to **' + (after ? Ls.v[after] : 'NULL') + '**. Nothing is lost.', line: 4, off: offPos, cls: cl, ptrs: [ptr('CURRENT', cur, 'yellow'), ptr('NEW', nn, 'blue')],
        ask: { q: 'Which line must come first?', options: ['newNode.Next = current.Next', 'current.Next = newNode'], answer: 0 } }));
      Ls.next[cur] = nn;
      const cl3 = c1(cur, 'cur'); cl3[nn] = 'done';
      F.push(snap({ cap: 'Step 2: `current.Next = newNode`. ' + a + ' now points to **' + b + '**.', line: 5, off: offPos, cls: cl3, ptrs: [ptr('CURRENT', cur, 'yellow'), ptr('NEW', nn, 'blue')] }));
      row = Ls.order();
      F.push(snap({ cap: 'Done. Only **2 arrows** changed. No values moved. (If you do step 2 first, you lose the rest of the list!)', mood: 'happy' }));
      return F;
    }

    if (op === 'del') {
      const target = Ls.find(a);
      F.push(snap({ cap: 'Delete **' + a + '**.', line: 0 }));
      if (!Ls.head) { F.push(snap({ cap: 'The list is empty.', mood: 'oops' })); return F; }
      if (target === Ls.head) {
        F.push(snap({ cap: 'The head holds ' + a + '.', line: 0, cls: c1(target, 'bad') }));
        Ls.head = Ls.next[target];
        const cl = c1(target, 'bad dim');
        F.push(snap({ cap: '`head = head.Next`. HEAD skips over ' + a + '. Nothing points to it now.', line: 1, cls: cl, off: (function () { const o = {}; o[target] = { col: 0, y: NEWY }; return o; })() }));
        delete Ls.v[target];
        row = Ls.order();
        F.push(snap({ cap: 'The old node is unreachable, so memory cleans it up (garbage collection). **O(1)**.', mood: 'happy' }));
        return F;
      }
      let prev = Ls.head, cur = Ls.next[Ls.head];
      F.push(snap({ cap: 'prev = head, current = head.Next.', line: 3, cls: (function () { const o = {}; o[prev] = 'wait'; if (cur) o[cur] = 'cur'; return o; })(), ptrs: [ptr('PREV', prev, 'blue')].concat(cur ? [ptr('CURRENT', cur, 'yellow')] : []) }));
      while (cur && cur !== target) {
        prev = cur; cur = Ls.next[cur];
        const o = {}; o[prev] = 'wait'; if (cur) o[cur] = 'cur';
        F.push(snap({ cap: cur ? 'Not ' + a + ' yet. Move both: prev → ' + Ls.v[prev] + ', current → ' + Ls.v[cur] + '.' : 'current = NULL.', line: [5, 6], cls: o, ptrs: [ptr('PREV', prev, 'blue')].concat(cur ? [ptr('CURRENT', cur, 'yellow')] : []) }));
      }
      if (!cur) { F.push(snap({ cap: a + ' is not in the list. Nothing to delete.', mood: 'oops' })); return F; }
      const o1 = {}; o1[prev] = 'wait'; o1[cur] = 'bad';
      F.push(snap({ cap: 'Found **' + a + '**. prev is **' + Ls.v[prev] + '**.', line: 4, cls: o1, ptrs: [ptr('PREV', prev, 'blue'), ptr('CURRENT', cur, 'yellow')] }));
      Ls.next[prev] = Ls.next[cur];
      const bend = {}; bend[prev] = true;
      const o2 = {}; o2[prev] = 'wait'; o2[cur] = 'bad dim';
      F.push(snap({ cap: '`prev.Next = current.Next`. The arrow **jumps over** ' + a + '.', line: 8, cls: o2, bend: bend, ptrs: [ptr('PREV', prev, 'blue')], sound: 'swap',
        ask: { q: 'To delete ' + a + ', which arrow changes?', options: [Ls.v[prev] + '.Next skips over ' + a, a + '.Next becomes NULL', 'HEAD moves to ' + a], answer: 0 } }));
      delete Ls.v[cur];
      row = Ls.order();
      F.push(snap({ cap: 'Done. Nothing points to ' + a + ', so it is cleaned up. No shifting!', mood: 'happy' }));
      return F;
    }
    return F;
  }

  function render(L, f, o) {
    const n = Math.max(1, f.row.length);
    const sp = Math.min(160, (W - 200) / n);
    const x0 = 160;
    const colX = function (c) { return x0 + c * sp; };
    const pos = {};
    f.row.forEach(function (id, k) { pos[id] = { x: colX(k), y: ROWY }; });
    Object.keys(f.off).forEach(function (id) { pos[id] = { x: colX(f.off[id].col), y: f.off[id].y }; });
    const nodes = [], edges = [];
    const ids = Object.keys(pos).filter(function (id) { return id in f.v; });
    ids.forEach(function (id) {
      nodes.push({ id: id, t: 'll', x: pos[id].x, y: pos[id].y, label: f.v[id], cls: f.cls[id] || '', sub: f.addr[id], w: 92 });
      const nx = f.next[id];
      if (nx && pos[nx] && (nx in f.v)) {
        const bypass = f.bend[id];
        edges.push({ id: 'p' + id, a: id, b: nx, ap: 'next', dir: true, bend: bypass ? 75 : 0, cls: bypass ? 'hot' : (f.cls[id] && /cur|done/.test(f.cls[id]) && f.cls[nx] ? '' : '') });
      } else {
        nodes.push({ id: 'null' + id, t: 'tag', x: pos[id].x + Math.min(110, sp * 0.75), y: pos[id].y, label: 'NULL', cls: 'null' });
        edges.push({ id: 'p' + id, a: id, b: 'null' + id, ap: 'next', dir: true });
      }
    });
    nodes.push({ id: 'HEAD', t: 'tag', x: 56, y: ROWY, label: 'HEAD', cls: 'yellow' });
    if (f.head && pos[f.head]) edges.push({ id: 'headp', a: 'HEAD', b: f.head, dir: true, cls: 'look' });
    else { nodes.push({ id: 'nullH', t: 'tag', x: 56, y: ROWY + 60, label: 'NULL', cls: 'null' }); edges.push({ id: 'headp', a: 'HEAD', b: 'nullH', dir: true }); }
    f.ptrs.forEach(function (p) {
      if (!pos[p.at]) return;
      const below = pos[p.at].y === ROWY;
      const px = pos[p.at].x + (p.label === 'PREV' ? -0 : 0);
      const py = below ? ROWY - 72 : pos[p.at].y + 58;
      const shift = (p.label === 'PREV' && f.ptrs.some(function (q) { return q.label === 'CURRENT' && q.at === p.at; })) ? -60 : 0;
      nodes.push({ id: 'ptr' + p.label, t: 'tag', x: px + shift, y: py, label: p.label, cls: p.cls });
      edges.push({ id: 'ptrE' + p.label, a: 'ptr' + p.label, b: p.at, dir: true, cls: 'thin' });
    });
    L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
  }

  function opsLab(root) {
    const L = ST.lab(root, { vb: [W, H], code: CODE.after, codeTitle: 'C# — INSERT AFTER', alt: 'A singly linked list', minW: 640 });
    let op = 'after';
    const listIn = ui.field('LIST', '10, 42, 17, 99, 56', { onEnter: run });
    const aIn = ui.field('VALUE', '17', { small: true, onEnter: run });
    const bIn = ui.field('NEW VALUE', '25', { small: true, onEnter: run });
    const OPS = [
      { v: 'search', label: 'SEARCH', a: 'Find', b: null, code: 'search', title: 'C# — TRAVERSE / SEARCH' },
      { v: 'head', label: 'INSERT AT HEAD', a: 'New value', b: null, code: 'head', title: 'C# — INSERT AT HEAD' },
      { v: 'after', label: 'INSERT AFTER', a: 'After', b: 'New value', code: 'after', title: 'C# — INSERT AFTER' },
      { v: 'tail', label: 'INSERT AT TAIL', a: 'New value', b: null, code: 'tail', title: 'C# — INSERT AT TAIL' },
      { v: 'del', label: 'DELETE', a: 'Delete', b: null, code: 'del', title: 'C# — DELETE' },
      { v: 'update', label: 'UPDATE', a: 'Old value', b: 'New value', code: 'update', title: 'C# — UPDATE' }
    ];
    const seg = ui.seg('OPERATION', OPS, op, function (v) { op = v; sync(); run(); });
    L.controls.appendChild(seg);
    L.controls.appendChild(ui.row(listIn.el, aIn.el, bIn.el, ui.button('RUN', run, 'btn-yellow')));
    const info = L.panel('ARRAY VS LINKED LIST', { before: true });
    info.appendChild(ui.table(['', 'Array', 'Linked list'], [['Insert in middle', 'Shift items O(n)', 'Change 2 arrows'], ['Read item i', 'O(1) jump', 'O(n) walk'], ['Memory', 'Side by side', 'Anywhere']]));
    function sync() {
      const d = OPS.filter(function (x) { return x.v === op; })[0];
      aIn.el.querySelector('.field-lbl').textContent = d.a.toUpperCase();
      bIn.el.style.display = d.b ? '' : 'none';
      if (d.b) bIn.el.querySelector('.field-lbl').textContent = d.b.toUpperCase();
      L.setCodeLines(CODE[d.code], d.title);
      if (op === 'head' || op === 'tail') aIn.input.value = op === 'head' ? '5' : '70';
      if (op === 'after') { aIn.input.value = '17'; bIn.input.value = '25'; }
      if (op === 'del') aIn.input.value = '99';
      if (op === 'search') aIn.input.value = '99';
      if (op === 'update') { aIn.input.value = '42'; bIn.input.value = '7'; }
    }
    function run() {
      let vals = U.parseWords(listIn.input.value, 7);
      if (!vals.length && op !== 'head' && op !== 'tail') { vals = ['10', '42', '17']; listIn.input.value = vals.join(', '); }
      const a = (aIn.input.value.trim() || '1').slice(0, 5), b = (bIn.input.value.trim() || '1').slice(0, 5);
      L.player.load(opFrames(vals, op, a, b), function (f, i, o) { render(L, f, o); });
    }
    sync();
    run();
    return L;
  }

  // ---------------------------------------------------------------- list types
  function typesLab(root) {
    const W2 = 900, H2 = 330;
    const L = ST.lab(root, { vb: [W2, H2], alt: 'Singly, doubly and circular linked lists', minW: 600 });
    let kind = 'singly';
    const seg = ui.seg('TYPE', [{ v: 'singly', label: 'SINGLY' }, { v: 'doubly', label: 'DOUBLY' }, { v: 'circular', label: 'CIRCULAR' }], kind, function (v) { kind = v; run(); });
    L.controls.appendChild(seg);
    const facts = L.panel('THIS TYPE');
    const vals = ['A', 'B', 'C', 'D'];
    function build() {
      const F = [];
      const n = vals.length;
      if (kind === 'singly') {
        F.push({ cap: '**Singly linked list**: each node has one arrow, **Next**. One-way street.', cur: -1 });
        for (let k = 0; k < n; k++) F.push({ cap: 'Walk forward: **' + vals[k] + '**.', cur: k });
        F.push({ cap: 'Next is **NULL**. The trip ends. We cannot walk back.', cur: -1, endNull: true });
      } else if (kind === 'doubly') {
        F.push({ cap: '**Doubly linked list**: each node has **Prev** and **Next**. Two-way street.', cur: -1 });
        for (let k = 0; k < n; k++) F.push({ cap: 'Forward with Next: **' + vals[k] + '**.', cur: k, dir: 1 });
        for (let k = n - 2; k >= 0; k--) F.push({ cap: 'Back with Prev: **' + vals[k] + '**.', cur: k, dir: -1 });
        F.push({ cap: 'Two arrows per node = more memory, but you can go both ways. Example: browser back and forward.', cur: -1 });
      } else {
        F.push({ cap: '**Circular linked list**: the tail points back to the **head**. No NULL.', cur: -1 });
        for (let r = 0; r < 2; r++) for (let k = 0; k < n; k++) F.push({ cap: 'Round ' + (r + 1) + ': **' + vals[k] + '**' + (k === n - 1 ? '. tail.Next = head, so we loop.' : '.'), cur: k, loop: k === n - 1 });
        F.push({ cap: 'It never ends by itself. Stop when you are back at the head. Example: taking turns in a game.', cur: 0 });
      }
      return F;
    }
    function render(f, i, o) {
      const dbl = kind === 'doubly';
      const xs = ST.kit.row(vals.length, W2 - 120, dbl ? 124 : 96, dbl ? 70 : 76).map(function (x) { return x + 40; });
      const y = 150;
      const nodes = [], edges = [];
      vals.forEach(function (v, k) {
        nodes.push({ id: 'n' + k, t: 'll', dbl: dbl, x: xs[k], y: y, label: v, cls: k === f.cur ? 'cur' : '' });
        if (k < vals.length - 1) {
          edges.push({ id: 'nx' + k, a: 'n' + k, b: 'n' + (k + 1), ap: 'next', bp: 'left', dir: true, dy: dbl ? -10 : 0, cls: f.dir === 1 && f.cur === k + 1 ? 'look' : '' });
          if (dbl) edges.push({ id: 'pv' + k, a: 'n' + (k + 1), b: 'n' + k, ap: 'prev', bp: 'right', dir: true, dy: 10, cls: f.dir === -1 && f.cur === k ? 'hot' : 'hot thin' });
        }
      });
      nodes.push({ id: 'HEAD', t: 'tag', x: xs[0], y: 60, label: 'HEAD', cls: 'yellow' });
      edges.push({ id: 'hp', a: 'HEAD', b: 'n0', dir: true, cls: 'look' });
      if (kind === 'circular') {
        edges.push({ id: 'loop', a: 'n' + (vals.length - 1), b: 'n0', ap: 'bottom', bp: 'bottom', dir: true, bend: -110, cls: f.loop ? 'hot' : 'look' });
        nodes.push({ id: 'loopL', t: 'label', x: (xs[0] + xs[vals.length - 1]) / 2, y: 300, label: 'tail.Next = head', cls: 'blue' });
      } else {
        nodes.push({ id: 'nullR', t: 'tag', x: xs[vals.length - 1] + (dbl ? 120 : 100), y: y, label: 'NULL', cls: 'null' + (f.endNull ? ' red' : '') });
        edges.push({ id: 'nr', a: 'n' + (vals.length - 1), b: 'nullR', ap: 'next', dir: true, dy: dbl ? -10 : 0 });
        if (dbl) {
          nodes.push({ id: 'nullL', t: 'tag', x: xs[0] - 110, y: y + 10, label: 'NULL', cls: 'null' });
          edges.push({ id: 'nl', a: 'n0', b: 'nullL', ap: 'prev', dir: true, dy: 10, cls: 'hot thin' });
        }
      }
      if (f.cur >= 0) {
        nodes.push({ id: 'cur', t: 'tag', x: xs[f.cur], y: 240, label: 'CURRENT', cls: 'blue' });
        edges.push({ id: 'cp', a: 'cur', b: 'n' + f.cur, dir: true, cls: 'thin' });
      }
      L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
    }
    function run() {
      U.clear(facts);
      const t = {
        singly: [['Arrows', 'Next only'], ['Go back?', 'No'], ['Ends at', 'NULL'], ['Memory', 'Low'], ['Use', 'Simple task list, playlist']],
        doubly: [['Arrows', 'Prev and Next'], ['Go back?', 'Yes'], ['Ends at', 'NULL (both ends)'], ['Memory', 'Higher'], ['Use', 'Back/forward, undo/redo']],
        circular: [['Arrows', 'Next (tail → head)'], ['Go back?', 'Depends'], ['Ends at', 'Never (loops)'], ['Memory', 'Medium'], ['Use', 'Turn-taking, round robin']]
      }[kind];
      facts.appendChild(ui.table(null, t));
      L.player.load(build(), render);
    }
    run();
    return L;
  }

  ST.topic({
    id: 'linkedlist', n: 4, week: 'Week 3', color: 'teal', icon: 'linkedlist',
    title: 'Linked Lists',
    short: 'Nodes connected by arrows. Insert and delete by changing arrows.',
    blurb: 'A treasure hunt: each clue card says where the next one is.',
    remember: [
      { big: '[ DATA | NEXT ]', text: 'Every node stores a value and an arrow to the next node.' },
      { big: 'HEAD → … → NULL', text: 'Always start at HEAD. Follow the arrows. NULL means the end.' },
      { big: 'ARROWS, NOT SHIFTS', text: 'Insert or delete = change 1 or 2 arrows. Nothing slides over.' }
    ],
    cheat: {
      head: ['Operation', 'Linked list', 'Array'],
      rows: [['Insert at head', 'O(1)', 'O(n)'], ['Insert after a known node', 'O(1)', 'O(n)'], ['Find a value', 'O(n)', 'O(n)'], ['Read the i-th item', 'O(n)', 'O(1)']]
    },
    mistake: 'When inserting, set newNode.Next first. If you change current.Next first, the rest of the list is lost.',
    labs: [
      { id: 'ops', title: 'Insert, delete, search', tag: 'TRACE', setup: opsLab },
      { id: 'types', title: 'Singly, doubly, circular', tag: 'TRACE', setup: typesLab }
    ]
  });
})(window.ST);
