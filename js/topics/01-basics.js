/* World 1 — Arrays, memory and Big-O */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;

  function hex(n) { return '0x' + n.toString(16).toUpperCase(); }

  // ---------------------------------------------------------------- Lab 1: address formula
  function addressLab(root) {
    const W = 820, H = 300;
    const L = ST.lab(root, { vb: [W, H], alt: 'Array cells with memory addresses' });
    const vals = [21, 42, 75, 99, 17, 64];
    let size = 4, target = 3;
    const base = 0x1000;
    const idx = ui.field('INDEX TO READ', String(target), { small: true, onEnter: function () { setT(idx.input.value); } });
    L.controls.appendChild(ui.row(idx.el, ui.button('GO', function () { setT(idx.input.value); }, 'btn-yellow')));
    L.controls.appendChild(ui.seg('ELEMENT SIZE', [{ v: 1, label: '1 BYTE (char)' }, { v: 4, label: '4 BYTES (int)' }, { v: 8, label: '8 BYTES (double)' }], size, function (v) { size = v; run(); }));
    const info = L.panel('THE FORMULA');
    info.appendChild(h('div', { class: 'formula' }, 'Address = Base + (Index × Size)'));
    const calc = L.panel('YOUR NUMBERS');
    L.panel('TRY IT').appendChild(h('p', { class: 'panel-note' }, 'Click any box on the picture to read that index.'));

    function setT(v) {
      const n = parseInt(v, 10);
      target = isFinite(n) ? U.clamp(n, 0, vals.length - 1) : 0;
      idx.input.value = String(target);
      run();
    }
    L.scene.clickFn = function (id) { if (/^c\d+$/.test(id)) setT(id.slice(1)); };

    function frames() {
      const off = target * size;
      const addr = base + off;
      const opts = [addr, base + target, base + off + size, base + (target + 1) * size].filter(function (v, k, a) { return a.indexOf(v) === k; }).slice(0, 3);
      opts.sort(function () { return Math.random() - 0.5; });
      return [
        { cap: 'An array keeps its boxes **side by side** in memory. Each box here uses ' + size + ' byte' + (size > 1 ? 's' : '') + '.', step: 0 },
        { cap: 'The array starts at the **base address**: ' + hex(base) + '.', step: 1 },
        { cap: 'Index ' + target + ' × ' + size + ' bytes = **' + off + ' bytes** from the start.', step: 2 },
        { cap: hex(base) + ' + ' + off + ' = **' + hex(addr) + '**. Jump straight there.', step: 3,
          ask: { q: 'Where is index ' + target + '?', options: opts.map(hex), answer: opts.indexOf(addr) } },
        { cap: 'Read the value: **' + vals[target] + '**. No searching. That is why array access is **O(1)**.', step: 4 }
      ];
    }
    function render(f, i, o) {
      const xs = ST.kit.row(vals.length, W, 76, 0);
      const nodes = [];
      vals.forEach(function (v, k) {
        let cls = '';
        if (f.step >= 1 && k === 0) cls = 'blue';
        if (f.step === 2 && k > 0 && k < target) cls = 'paper';
        if (f.step >= 3 && k === target) cls = 'cur';
        if (f.step >= 4 && k === target) cls = 'done';
        nodes.push({ id: 'c' + k, t: 'cell', x: xs[k], y: 140, w: 76, h: 70, label: v, cls: cls + ' clickable', sub: hex(base + k * size) });
        nodes.push({ id: 'ix' + k, t: 'label', x: xs[k], y: 212, label: '[' + k + ']', fs: 13 });
      });
      if (f.step >= 2) {
        const x1 = xs[0] - 38, x2 = xs[target] - 38;
        if (target > 0) nodes.push({ id: 'span', t: 'box', x: (x1 + x2) / 2, y: 238, w: Math.max(4, x2 - x1), h: 12, cls: 's-yellow' });
        nodes.push({ id: 'spanl', t: 'label', x: (x1 + Math.max(x2, x1 + 40)) / 2, y: 264, label: target + ' × ' + size + ' = ' + (target * size) + ' bytes', cls: 'pix', fs: 15 });
      }
      nodes.push({ id: 'base', t: 'tag', x: xs[0], y: 50, label: 'BASE', cls: f.step >= 1 ? 'blue' : '' });
      if (f.step >= 3) nodes.push({ id: 'cpu', t: 'tag', x: xs[target], y: 50, label: 'CPU READS HERE', cls: 'yellow' });
      L.scene.draw({ nodes: nodes, edges: f.step >= 3 ? [{ id: 'jump', a: 'cpu', b: 'c' + target, dir: true, cls: 'hot' }] : [] }, { instant: o.instant });
      U.clear(calc);
      calc.appendChild(ui.table(null, [
        ['Base', hex(base)], ['Index', String(target)], ['Size', size + ' bytes'],
        [{ v: 'Address', cls: f.step >= 3 ? 'hot' : '' }, { v: f.step >= 3 ? hex(base + target * size) : '?', cls: f.step >= 3 ? 'hot' : '' }]
      ]));
    }
    function run() { L.player.load(frames(), render); }
    run();
    return L;
  }

  // ---------------------------------------------------------------- Lab 2: dynamic array
  function dynamicLab(root) {
    const W = 860, H = 340;
    const L = ST.lab(root, { vb: [W, H], alt: 'A dynamic array growing' });
    const items = 'A B C D E F G H I J'.split(' ');
    const cnt = ui.field('HOW MANY ADDS (1–10)', '9', { small: true, onEnter: run });
    L.controls.appendChild(ui.row(cnt.el, ui.button('RUN', run, 'btn-yellow')));
    const statBody = L.panel('COUNT VS CAPACITY');
    L.panel('WHY IT IS STILL FAST').appendChild(h('p', { class: 'panel-note' }, 'Most adds are one write. Copying is rare, because the capacity doubles each time. Average cost: O(1) (amortized).'));

    function build(nAdds) {
      const F = [];
      let cap = 4, count = 0, gen = 0, copies = 0;
      let vals = []; // ids of values currently in the array (by slot)
      const st = function (extra) {
        return Object.assign({ capa: cap, count: count, gen: gen, vals: vals.slice(), copies: copies, newGen: null, newVals: null, oldFade: false }, extra);
      };
      F.push(st({ cap: 'A dynamic array: **count = 0**, **capacity = 4**. The 4 boxes are already reserved.' }));
      for (let k = 0; k < nAdds; k++) {
        const it = items[k];
        if (count === cap) {
          F.push(st({ cap: 'Add ' + it + '? **Full!** count = capacity = ' + cap + '.', full: true, mood: 'oops', ask: { q: 'count = capacity = ' + cap + '. Can ' + it + ' fit?', options: ['Yes, just write it', 'No, the array must grow'], answer: 1 } }));
          const newCap = cap * 2;
          const nv = [];
          F.push(st({ cap: 'Make a **new array** with double the capacity: ' + newCap + '.', newGen: { cap: newCap }, newVals: nv.slice() }));
          for (let c = 0; c < vals.length; c++) {
            nv.push(vals[c]);
            copies++;
            F.push(st({ cap: 'Copy **' + vals[c].split('-')[1] + '** to the new array.', newGen: { cap: newCap }, newVals: nv.slice(), copies: copies, sound: 'swap' }));
          }
          F.push(st({ cap: 'The old array is not used anymore. It goes to **garbage collection**.', newGen: { cap: newCap }, newVals: nv.slice(), oldFade: true, copies: copies }));
          cap = newCap; gen++; vals = nv.slice();
          F.push(st({ cap: 'Now capacity = **' + cap + '**. There is room again.' }));
        }
        vals.push('v-' + it);
        count++;
        F.push(st({ cap: 'Write **' + it + '** into box [' + (count - 1) + ']. One step. count = ' + count + '.', last: count - 1 }));
      }
      F.push(st({ cap: 'Done. ' + count + ' items, capacity ' + cap + ', ' + copies + ' copies in total. Copies happened only when it was full.' }));
      return F;
    }
    function rowNodes(prefix, cap, vals, y, cls, fadeAll, lastIdx) {
      const cell = Math.min(58, Math.floor((W - 60) / cap) - 4);
      const xs = ST.kit.row(cap, W, cell, 4);
      const out = [];
      for (let k = 0; k < cap; k++) out.push({ id: prefix + 's' + k, t: 'cell', x: xs[k], y: y, w: cell, h: cell, label: '', cls: 'ghost' + (fadeAll ? ' dim' : ''), sub: k === 0 || k === cap - 1 ? '[' + k + ']' : undefined });
      vals.forEach(function (id, k) {
        out.push({ id: prefix + id, t: 'cell', x: xs[k], y: y, w: cell, h: cell, label: id.split('-')[1], cls: (k === lastIdx ? 'cur' : cls) + (fadeAll ? ' dim' : '') });
      });
      return { nodes: out, xs: xs };
    }
    function render(f, i, o) {
      const nodes = [];
      const top = rowNodes('g' + f.gen + '-', f.capa, f.vals, 90, f.full ? 'bad' : '', f.oldFade, f.last);
      nodes.push.apply(nodes, top.nodes);
      nodes.push({ id: 'lblOld', t: 'label', x: 30, y: 40, label: f.newGen ? 'OLD ARRAY (capacity ' + f.capa + ')' : 'ARRAY (capacity ' + f.capa + ')', anchor: 'start', cls: 'ink' });
      if (f.newGen) {
        const bottom = rowNodes('g' + (f.gen + 1) + '-', f.newGen.cap, f.newVals, 250, 'done', false);
        bottom.nodes.forEach(function (n) {
          if (n.cls.indexOf('ghost') < 0) {
            const k = f.newVals.indexOf(n.id.replace('g' + (f.gen + 1) + '-', ''));
            if (k >= 0) n.from = { x: top.xs[k], y: 90 };
          }
        });
        nodes.push.apply(nodes, bottom.nodes);
        nodes.push({ id: 'lblNew', t: 'label', x: 30, y: 200, label: 'NEW ARRAY (capacity ' + f.newGen.cap + ')', anchor: 'start', cls: 'teal' });
      }
      L.scene.draw({ nodes: nodes }, { instant: o.instant });
      U.clear(statBody);
      statBody.appendChild(h('div', { class: 'stats' }, ui.stat('COUNT', f.count), ui.stat('CAPACITY', f.capa, f.full ? 'hot' : ''), ui.stat('COPIES', f.copies)));
    }
    function run() {
      const n = U.clamp(parseInt(cnt.input.value, 10) || 9, 1, 10);
      cnt.input.value = String(n);
      L.player.load(build(n), render);
    }
    run();
    return L;
  }

  // ---------------------------------------------------------------- Lab 3: Big-O race
  function bigoLab(root) {
    const W = 860, H = 380;
    const L = ST.lab(root, { vb: [W, H], player: false, alt: 'Bars showing how much work each Big-O class does' });
    let n = 16;
    const slider = h('input', { type: 'range', min: 1, max: 100, value: n, class: 'prange big-range', 'aria-label': 'Input size n', oninput: function () { n = Number(slider.value); draw(); } });
    const nOut = h('span', { class: 'n-out' }, 'n = ' + n);
    L.controls.appendChild(h('div', { class: 'field grow' }, h('span', { class: 'field-lbl' }, 'INPUT SIZE n (drag me)'), h('div', { class: 'ctl-row' }, slider, nOut)));
    L.controls.appendChild(ui.button('n = 1,000,000', function () { n = 1000000; draw(); }, 'btn-ink'));
    const tbl = L.panel('FAMOUS EXAMPLES');
    tbl.appendChild(ui.table(['Big-O', 'Example'], [
      ['O(1)', 'arr[i] (array index)'], ['O(log n)', 'Binary search'], ['O(n)', 'Linear search'],
      ['O(n log n)', 'Merge sort'], ['O(n²)', 'Bubble sort (nested loops)']
    ]));
    L.panel('THREE BOUNDS').appendChild(ui.table(null, [['O', 'at most (ceiling)'], ['Ω', 'at least (floor)'], ['Θ', 'exactly (tight)']]));
    const rows = [
      { k: 'O(1)', f: function () { return 1; }, cls: 'teal' },
      { k: 'O(log n)', f: function (x) { return Math.max(1, Math.ceil(Math.log2(x))); }, cls: 'teal' },
      { k: 'O(n)', f: function (x) { return x; }, cls: 'yellow' },
      { k: 'O(n log n)', f: function (x) { return Math.round(x * Math.max(1, Math.log2(x))); }, cls: 'yellow' },
      { k: 'O(n²)', f: function (x) { return x * x; }, cls: 'red' }
    ];
    function fmt(v) { return v.toLocaleString('en-US'); }
    function draw() {
      if (n <= 100) { slider.value = n; }
      nOut.textContent = 'n = ' + fmt(n);
      const max = rows[4].f(n);
      const nodes = [];
      rows.forEach(function (r, k) {
        const v = r.f(n);
        const y = 50 + k * 66;
        const w = Math.max(6, 520 * v / max);
        nodes.push({ id: 'k' + k, t: 'label', x: 24, y: y, label: r.k, anchor: 'start', cls: 'big', fs: 20 });
        nodes.push({ id: 'b' + k, t: 'box', x: 170 + w / 2, y: y, w: w, h: 36, cls: 's-' + r.cls });
        nodes.push({ id: 'v' + k, t: 'label', x: 180 + w, y: y, label: fmt(v) + ' steps', anchor: 'start', cls: 'pix', fs: 16 });
      });
      L.scene.draw({ nodes: nodes });
      const lin = n, bin = Math.max(1, Math.ceil(Math.log2(n + 1)));
      L.say('With **n = ' + fmt(n) + '**: linear search may need **' + fmt(lin) + '** checks, binary search only **' + fmt(bin) + '**. Bubble sort: about **' + fmt(n * n) + '** steps.', n >= 1000000 ? 'happy' : 'idle');
    }
    draw();
    return L;
  }

  // ================================================================ lesson
  const lk = ST.lk;
  const RULES = [
    { rule: 'Dynamic arrays grow ×2', note: 'Like C# List<T>. Some languages grow ×1.5. Adding stays O(1) on average either way.' }
  ];
  function lesson() {
    const vals = [7, 3, 9, 4, 6];
    const addr = function (i) { return String(1000 + i * 4); };
    const idx = function (i) { return '[' + i + ']'; };
    const mem = function (o) {
      return lk.cells('m', vals.map(function (v) { return o.empty ? '' : v; }), Object.assign({ w: 62, y: 100, sub: addr, cls: o.empty ? 'ghost' : '' }, o));
    };
    const jump = function (i, cap) {
      const xs = lk.xs(5, 62);
      return { cap: cap, nodes: mem({ top: idx, cls: function (k) { return k === i ? 'cur' : ''; } }).concat([
        lk.tag('base', xs[0], 26, 'BASE 1000', 'blue'),
        lk.text('f', 330, 26, '1000 + ' + i + ' × 4 = ' + addr(i), 'pix', 17),
        lk.ptr('p', xs[i], 158, 'arr[' + i + ']', 'red')
      ]) };
    };
    const grow = function (step, cap) {
      const top = lk.xs(4, 48), bot = lk.xs(8, 48);
      const n = [];
      if (step >= 1) bot.forEach(function (x, k) { n.push({ id: 'g' + k, t: 'cell', x: x, y: 165, w: 48, h: 48, label: '', cls: 'ghost' }); });
      if (step === 2) top.forEach(function (x, k) { n.push({ id: 'o' + k, t: 'cell', x: x, y: 60, w: 48, h: 48, label: 'ABCD'[k], cls: 'ghost' }); });
      if (step < 3) n.push(lk.text('oldl', 240, 22, step === 0 ? 'CAPACITY 4 · FULL' : 'OLD ARRAY', step === 0 ? 'red' : 'ink', 14));
      if (step >= 1) n.push(lk.text('newl', 240, 124, 'NEW ARRAY · CAPACITY 8', 'blue', 14));
      'ABCD'.split('').forEach(function (v, k) {
        n.push({ id: v, t: 'cell', x: step >= 2 ? bot[k] : top[k], y: step >= 2 ? 165 : 60, w: 48, h: 48, label: v, cls: step === 2 ? 'wait' : '' });
      });
      n.push({ id: 'E', t: 'cell', x: step >= 3 ? bot[4] : 430, y: step >= 3 ? 165 : 60, w: 48, h: 48, label: 'E', cls: step >= 3 ? 'cur' : 'new' });
      return { nodes: n, cap: cap };
    };
    const race = function (n, cap) {
      const xs = lk.xs(4, 60, 50);
      const fs = [['O(1)', 1], ['O(log n)', Math.max(1, Math.log2(n))], ['O(n)', n], ['O(n²)', n * n]];
      return { cap: cap, nodes: [lk.tag('n', 50, 24, 'n = ' + n, 'yellow')].concat(fs.map(function (f, k) {
        return { id: 'b' + k, t: 'bar', x: xs[k], y: 186, w: 60, h: Math.max(4, Math.min(150, f[1])), label: Math.round(f[1]), sub: f[0], cls: k === 3 ? 'bad' : (k === 0 ? 'done' : '') };
      })) };
    };
    return [
      { title: 'One block of memory', frames: [
        { nodes: mem({ empty: true }), cap: 'Memory is a row of numbered slots.' },
        { nodes: mem({}), cap: 'An array takes slots **side by side**.' },
        { nodes: mem({ top: idx }), cap: 'Each slot gets an **index**, from 0.' }
      ] },
      { title: 'arr[i] = base + i × size', frames: [
        jump(0, 'arr[0] is the base: **zero** steps away.'),
        jump(3, 'arr[3]: one calculation, **one jump**.'),
        jump(1, 'Any index costs the same: **O(1)**.')
      ] },
      { title: 'Full? Double it and copy', frames: [
        grow(0, 'Full! **E** has no room.'),
        grow(1, 'Make a new array, **twice** as big.'),
        grow(2, 'Copy every value: **O(n)**, but rare.'),
        grow(3, 'E fits. The next 3 adds are cheap.')
      ] },
      { title: 'Big-O = how work grows', frames: [
        race(2, 'Small n: they all look the same.'),
        race(4, 'Double n…'),
        race(8, '…O(n) doubles, O(n²) grows **4×**.'),
        race(12, 'Big-O tells you who wins when n is **big**.')
      ] }
    ];
  }

  ST.topic({
    id: 'basics', n: 1, color: 'blue', icon: 'basics',
    title: 'Arrays & Big-O',
    short: 'Memory, array addresses, growing arrays, and how work grows.',
    blurb: 'Where data lives in memory, and how we measure speed.',
    cheat: {
      head: ['Idea', 'Remember'],
      rows: [
        ['Data structure', 'HOW data is stored (array, linked list)'],
        ['ADT', 'WHAT you can do (push, pop, enqueue)'],
        ['Static array', 'Fixed size. Cannot grow.'],
        ['Dynamic array', 'Grows by making a bigger array and copying'],
        ['Algorithm', 'Finite, clear steps: input → output']
      ]
    },
    lesson: lesson(),
    rules: RULES,
    labs: [
      { id: 'address', title: 'Memory address', tag: 'TRACE', setup: addressLab },
      { id: 'dynamic', title: 'Dynamic array grows', tag: 'TRACE', setup: dynamicLab },
      { id: 'bigo', title: 'Big-O race', tag: 'PLAY', setup: bigoLab }
    ]
  });
})(window.ST);
