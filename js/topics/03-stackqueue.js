/* World 3 — Stacks and Queues (Week 1, ADTs) */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;
  const W = 820, H = 380;

  function parseOps(str, kind) {
    const out = [];
    String(str).split(/[,;\n]+/).forEach(function (tok) {
      const m = tok.trim().match(/^(push|pop|peek|enqueue|dequeue|front|isempty|add|remove)\s*\(?\s*([^)\s]*)\s*\)?$/i);
      if (!m) return;
      let op = m[1].toLowerCase();
      if (op === 'add') op = kind === 'stack' ? 'push' : 'enqueue';
      if (op === 'remove') op = kind === 'stack' ? 'pop' : 'dequeue';
      if (op === 'front') op = 'peek';
      if (kind === 'stack' && (op === 'enqueue')) op = 'push';
      if (kind === 'stack' && (op === 'dequeue')) op = 'pop';
      if (kind === 'queue' && op === 'push') op = 'enqueue';
      if (kind === 'queue' && op === 'pop') op = 'dequeue';
      out.push({ op: op, v: (m[2] || '').slice(0, 4) });
    });
    return out.slice(0, 16);
  }

  function frames(kind, ops) {
    const F = [];
    let items = []; // {id, v}
    let uid = 0;
    const outs = [];
    const isStack = kind === 'stack';
    F.push({ items: [], outs: [], cap: isStack ? 'An empty **stack**. Items go in and out at the **top**.' : 'An empty **queue**. Items join at the **rear** and leave from the **front**.' });
    ops.forEach(function (o) {
      const snap = function (extra) { return Object.assign({ items: items.map(function (x) { return Object.assign({}, x); }), outs: outs.slice() }, extra); };
      if (o.op === 'push' || o.op === 'enqueue') {
        const v = o.v || String.fromCharCode(65 + (uid % 26));
        items.push({ id: 'i' + (uid++), v: v, cls: 'cur', fresh: true });
        F.push(snap({ cap: (isStack ? '`push(' + v + ')`: ' + v + ' goes on the **top**.' : '`enqueue(' + v + ')`: ' + v + ' joins at the **rear**.'), op: o.op }));
        items[items.length - 1].cls = '';
        items[items.length - 1].fresh = false;
      } else if (o.op === 'pop' || o.op === 'dequeue') {
        if (!items.length) {
          F.push(snap({ cap: (isStack ? '`pop()` on an empty stack: **underflow!** Nothing to remove.' : '`dequeue()` on an empty queue: **nothing to remove!**'), mood: 'oops' }));
          return;
        }
        const k = isStack ? items.length - 1 : 0;
        const it = items[k];
        const ask = { q: (isStack ? '`pop()` — which item comes out?' : '`dequeue()` — which item comes out?'), pick: it.id, among: items.map(function (x) { return x.id; }), answerText: it.v };
        it.cls = 'bad';
        F.push(snap({ cap: (isStack ? '`pop()` removes the **top** item: **' + it.v + '**. (Last in, first out.)' : '`dequeue()` removes the **front** item: **' + it.v + '**. (First in, first out.)'), ask: ask }));
        items.splice(k, 1);
        outs.push(it.v);
        F.push(snap({ cap: it.v + ' is out. ' + (items.length ? (isStack ? 'New top: **' + items[items.length - 1].v + '**.' : 'New front: **' + items[0].v + '**.') : 'Now it is empty.'), gone: it }));
      } else if (o.op === 'peek') {
        if (!items.length) { F.push(snap({ cap: '`peek()` on an empty ' + kind + ': nothing to see.', mood: 'oops' })); return; }
        const k = isStack ? items.length - 1 : 0;
        items[k].cls = 'cur';
        F.push(snap({ cap: '`peek()` looks at the ' + (isStack ? 'top' : 'front') + ': **' + items[k].v + '**. It does **not** remove it.' }));
        items[k].cls = '';
      } else if (o.op === 'isempty') {
        F.push(snap({ cap: '`isEmpty()` → **' + (items.length ? 'false' : 'true') + '**.' }));
      }
    });
    F.push({ items: items.map(function (x) { return Object.assign({}, x, { cls: '' }); }), outs: outs.slice(), cap: 'Done. Order of removal: ' + (outs.length ? '**' + outs.join(', ') + '**.' : 'nothing was removed.') });
    return F;
  }

  function render(L, kind, outBody) {
    return function (f, i, o) {
      const nodes = [];
      const isStack = kind === 'stack';
      if (isStack) {
        const cw = 150, chh = 44, baseY = 340;
        nodes.push({ id: 'well', t: 'box', x: 300, y: 340 - 6 * chh / 2 - 8 + chh / 2 - 10, w: cw + 24, h: 6.6 * chh, cls: 'white' });
        f.items.forEach(function (it, k) {
          const y = baseY - chh / 2 - 14 - k * (chh + 4);
          nodes.push({ id: it.id, t: 'cell', x: 300, y: y, w: cw, h: chh, label: it.v, cls: it.cls, from: it.fresh ? { x: 300, y: 20 } : null, sub: undefined });
        });
        if (f.gone) nodes.push({ id: f.gone.id, t: 'cell', x: 620, y: 140, w: cw, h: chh, label: f.gone.v, cls: 'bad dim' });
        const topY = f.items.length ? baseY - chh / 2 - 14 - (f.items.length - 1) * (chh + 4) : baseY - 30;
        nodes.push({ id: 'top', t: 'tag', x: 160, y: topY, label: f.items.length ? 'TOP →' : 'EMPTY', cls: 'yellow' });
        nodes.push({ id: 'in', t: 'label', x: 300, y: 36, label: '↓ push   pop ↑', cls: 'ink', fs: 15 });
      } else {
        const cw = 76, y = 190;
        const xs = ST.kit.row(Math.max(1, f.items.length), W, cw, 8);
        f.items.forEach(function (it, k) {
          nodes.push({ id: it.id, t: 'cell', x: xs[k], y: y, w: cw, h: cw, label: it.v, cls: it.cls, from: it.fresh ? { x: W + 40, y: y } : null });
        });
        if (f.gone) nodes.push({ id: f.gone.id, t: 'cell', x: -60, y: y, w: cw, h: cw, label: f.gone.v, cls: 'bad dim' });
        if (f.items.length) {
          nodes.push({ id: 'front', t: 'tag', x: xs[0], y: y - 70, label: 'FRONT', cls: 'red' });
          nodes.push({ id: 'rear', t: 'tag', x: xs[f.items.length - 1], y: y + 70, label: 'REAR', cls: 'blue' });
        } else {
          nodes.push({ id: 'front', t: 'tag', x: W / 2, y: y, label: 'EMPTY QUEUE', cls: 'null' });
        }
        nodes.push({ id: 'outL', t: 'label', x: 24, y: 330, label: '← leaves (dequeue)', cls: 'red', anchor: 'start' });
        nodes.push({ id: 'inL', t: 'label', x: W - 24, y: 330, label: 'joins (enqueue) ←', cls: 'blue', anchor: 'end' });
      }
      L.scene.draw({ nodes: nodes }, { instant: o.instant });
      U.clear(outBody);
      outBody.appendChild(ui.strip(f.outs.map(function (v, k) { return { v: v, cls: k === f.outs.length - 1 && f.gone ? 'bad new' : '' }; }), { empty: 'Nothing removed yet' }));
    };
  }

  function lab(kind) {
    return function (root) {
      const isStack = kind === 'stack';
      const L = ST.lab(root, { vb: [W, H], alt: isStack ? 'A stack' : 'A queue' });
      const def = isStack ? 'push A, push B, push C, pop, push D, peek, pop, pop' : 'enqueue A, enqueue B, enqueue C, dequeue, enqueue D, peek, dequeue, dequeue';
      const ops = ui.field('OPERATIONS', def, { onEnter: run });
      ops.input.classList.add('inp-wide');
      const val = ui.field('VALUE', 'X', { small: true });
      L.controls.appendChild(ui.row(ops.el, ui.button('RUN', run, 'btn-yellow')));
      L.controls.appendChild(ui.row(val.el,
        ui.button(isStack ? '+ PUSH' : '+ ENQUEUE', function () { addOp((isStack ? 'push ' : 'enqueue ') + (val.input.value.trim() || 'X')); }, 'btn-ink'),
        ui.button(isStack ? '− POP' : '− DEQUEUE', function () { addOp(isStack ? 'pop' : 'dequeue'); }),
        ui.button('PEEK', function () { addOp('peek'); }),
        ui.button('CLEAR', function () { ops.input.value = ''; run(); })));
      const outBody = L.panel('REMOVED, IN ORDER');
      L.panel(isStack ? 'LIFO IN REAL LIFE' : 'FIFO IN REAL LIFE').appendChild(ui.table(null, isStack
        ? [['Undo button'], ['Browser back button'], ['Function call stack'], ['A pile of plates']]
        : [['Line at the bank'], ['Printer jobs'], ['BFS in graphs'], ['Customer service calls']]));
      L.panel('OPERATIONS').appendChild(ui.table(null, isStack
        ? [['push(x)', 'add on top'], ['pop()', 'remove top'], ['peek()', 'look at top'], ['All of them', 'O(1)']]
        : [['enqueue(x)', 'add at rear'], ['dequeue()', 'remove front'], ['peek()', 'look at front'], ['All of them', 'O(1)']]));
      const r = render(L, kind, outBody);
      function addOp(s) {
        const cur = ops.input.value.trim();
        ops.input.value = cur ? cur + ', ' + s : s;
        const fr = frames(kind, parseOps(ops.input.value, kind));
        // show the new step with animation: jump to the step before it, then play it
        L.player.load(fr, r, { at: Math.max(0, fr.length - 3) });
        L.player.show(fr.length - 2);
      }
      function run() { L.player.load(frames(kind, parseOps(ops.input.value, kind)), r); }
      run();
      return L;
    };
  }

  ST.topic({
    id: 'stackqueue', n: 3, week: 'Week 1', color: 'red', icon: 'stackqueue',
    title: 'Stacks & Queues',
    short: 'Two simple ADTs: last in first out, and first in first out.',
    blurb: 'Two ADTs you will see everywhere: in undo buttons, in recursion, in BFS.',
    remember: [
      { big: 'STACK = LIFO', text: 'Last in, first out. push and pop at the top.' },
      { big: 'QUEUE = FIFO', text: 'First in, first out. Join at the rear, leave from the front.' },
      { big: 'ADT ≠ HOW', text: 'An ADT says what it does. An array or linked list says how.' }
    ],
    cheat: {
      head: ['', 'Stack', 'Queue'],
      rows: [['Add', 'push (top)', 'enqueue (rear)'], ['Remove', 'pop (top)', 'dequeue (front)'], ['Look', 'peek (top)', 'peek (front)'], ['Order', 'LIFO', 'FIFO'], ['Used in', 'DFS, recursion', 'BFS, scheduling']]
    },
    mistake: 'peek() only looks. It does not remove the item. pop() and dequeue() remove it.',
    labs: [
      { id: 'stack', title: 'Stack', tag: 'PLAY', setup: lab('stack') },
      { id: 'queue', title: 'Queue', tag: 'PLAY', setup: lab('queue') }
    ]
  });
})(window.ST);
