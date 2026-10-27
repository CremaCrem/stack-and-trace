/* World 2 — Searching: linear and binary search */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;
  const W = 820, H = 270;

  const LIN_CODE = [
    'public int LinearSearch(int[] arr, int target) {',
    '    for (int i = 0; i < arr.Length; i++) {',
    '        if (arr[i] == target) return i;',
    '    }',
    '    return -1;',
    '}'
  ];
  const BIN_CODE = [
    'int BinarySearch(int[] arr, int target) {',
    '    int low = 0, high = arr.Length - 1;',
    '    while (low <= high) {',
    '        int mid = low + (high - low) / 2;',
    '        if (arr[mid] == target) return mid;',
    '        else if (arr[mid] < target)',
    '            low = mid + 1;   // go right',
    '        else',
    '            high = mid - 1;  // go left',
    '    }',
    '    return -1;',
    '}'
  ];

  function cells(arr, f, y) {
    const cell = ST.kit.fit(arr.length, W, 70, 38);
    const xs = ST.kit.row(arr.length, W, cell, 6);
    const nodes = arr.map(function (v, k) {
      return { id: 'c' + k, t: 'cell', x: xs[k], y: y, w: cell, h: cell, label: v, cls: (f.cls && f.cls[k]) || '', sub: '[' + k + ']' };
    });
    const merged = {};
    (f.ptrs || []).forEach(function (p) {
      if (p.at < 0 || p.at >= arr.length) return;
      const key = p.at + (p.down ? 'd' : 'u');
      if (merged[key]) { merged[key].label += '/' + p.label; merged[key].cls = 'ink'; merged[key].id += p.label; return; }
      merged[key] = { id: 'p' + p.label, t: 'ptr', x: xs[p.at], y: p.down ? y - cell / 2 - 8 : y + cell / 2 + 34, label: p.label, cls: p.cls || '', down: !!p.down };
    });
    Object.keys(merged).forEach(function (k) { nodes.push(merged[k]); });
    return { nodes: nodes, xs: xs, cell: cell };
  }

  // ---------------------------------------------------------------- linear
  function linearFrames(arr, target) {
    const F = [];
    const cls = {};
    const found = arr.indexOf(target);
    F.push({ cap: 'Linear search: check the boxes **one by one**, from index 0. Target: **' + target + '**.', cls: {}, ptrs: [], line: 0 });
    for (let i = 0; i < arr.length; i++) {
      const c = Object.assign({}, cls);
      c[i] = 'cur';
      const ask = i === 0 && found >= 0 ? { q: 'Which box will the search stop at? Click it.', pick: 'c' + found, answerText: 'index ' + found } : null;
      if (arr[i] === target) {
        c[i] = 'done';
        F.push({ cap: 'arr[' + i + '] = ' + arr[i] + '. **Found it!** return ' + i + '. Checks: ' + (i + 1) + '.', cls: c, ptrs: [{ at: i, label: 'i' }], line: 2, mood: 'happy', checks: i + 1, ask: ask });
        return F;
      }
      F.push({ cap: 'arr[' + i + '] = ' + arr[i] + '. Not ' + target + '. Move on.', cls: c, ptrs: [{ at: i, label: 'i' }], line: [1, 2], checks: i + 1, ask: ask });
      cls[i] = 'paper';
    }
    F.push({ cap: 'Reached the end. ' + target + ' is not here. **return -1**. Checks: ' + arr.length + ' (the worst case, O(n)).', cls: Object.assign({}, cls), ptrs: [], line: 4, mood: 'oops', checks: arr.length });
    return F;
  }

  function linearLab(root) {
    const L = ST.lab(root, { vb: [W, H], code: LIN_CODE, codeTitle: 'C# — FROM CLASS', alt: 'Linear search animation' });
    const arrIn = ui.field('NUMBERS', '12, 45, 78, 23, 56, 9, 31', { onEnter: run });
    const tIn = ui.field('TARGET', '23', { small: true, onEnter: run });
    L.controls.appendChild(ui.row(arrIn.el, tIn.el, ui.button('SEARCH', run, 'btn-yellow'), ui.button('MISSING NUMBER', function () { tIn.input.value = '50'; run(); })));
    const stat = L.panel('CHECKS', { before: true });
    let arr = [];
    function render(f, i, o) {
      L.scene.draw({ nodes: cells(arr, f, 120).nodes }, { instant: o.instant });
      U.clear(stat);
      stat.appendChild(h('div', { class: 'stats' }, ui.stat('CHECKS', f.checks || 0), ui.stat('BEST', 'O(1)'), ui.stat('WORST', 'O(n)')));
    }
    function run() {
      arr = U.parseNums(arrIn.input.value, { max: 12 });
      if (!arr.length) { arr = [12, 45, 78, 23]; arrIn.input.value = arr.join(', '); }
      const t = parseInt(tIn.input.value, 10);
      L.player.load(linearFrames(arr, isFinite(t) ? t : arr[0]), render);
    }
    run();
    return L;
  }

  // ---------------------------------------------------------------- binary
  function binaryFrames(arr, target) {
    const F = [];
    let low = 0, high = arr.length - 1;
    const out = {};
    const rows = [];
    const mark = function () { const c = {}; Object.keys(out).forEach(function (k) { c[k] = 'dim'; }); return c; };
    F.push({ cap: 'Binary search needs a **sorted** list. Target: **' + target + '**. low = 0, high = ' + high + '.', cls: {}, ptrs: [{ at: low, label: 'LOW', cls: 'blue' }, { at: high, label: 'HIGH', cls: 'red' }], line: 1, rows: [] });
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      rows.push([low, high, mid, arr[mid]]);
      const ptrs = [{ at: low, label: 'LOW', cls: 'blue', dx: low === mid ? -14 : 0 }, { at: high, label: 'HIGH', cls: 'red', dx: high === mid ? 14 : 0 }, { at: mid, label: 'MID', down: true }];
      const c = mark(); c[mid] = 'cur';
      F.push({ cap: 'mid = ' + low + ' + (' + high + ' − ' + low + ') / 2 = **' + mid + '**. arr[mid] = **' + arr[mid] + '**.', cls: c, ptrs: ptrs, line: 3, rows: rows.slice() });
      const opts = ['Found it', 'Go right (low = mid + 1)', 'Go left (high = mid − 1)'];
      if (arr[mid] === target) {
        const d = mark(); d[mid] = 'done';
        F.push({ cap: arr[mid] + ' = ' + target + '. **Found at index ' + mid + '!** Only ' + rows.length + ' check' + (rows.length > 1 ? 's' : '') + '.', cls: d, ptrs: ptrs, line: 4, rows: rows.slice(), mood: 'happy', ask: { q: 'arr[mid] = ' + arr[mid] + ', target = ' + target + '. What next?', options: opts, answer: 0 } });
        return F;
      }
      if (arr[mid] < target) {
        for (let k = low; k <= mid; k++) out[k] = true;
        low = mid + 1;
        F.push({ cap: arr[mid] + ' < ' + target + ' → the target is on the **right**. Drop the left half. low = ' + low + '.', cls: mark(), ptrs: [{ at: low, label: 'LOW', cls: 'blue' }, { at: high, label: 'HIGH', cls: 'red', dx: low === high ? 14 : 0 }], line: [5, 6], rows: rows.slice(), ask: { q: 'arr[mid] = ' + arr[mid] + ', target = ' + target + '. What next?', options: opts, answer: 1 } });
      } else {
        for (let k = mid; k <= high; k++) out[k] = true;
        high = mid - 1;
        F.push({ cap: arr[mid] + ' > ' + target + ' → the target is on the **left**. Drop the right half. high = ' + high + '.', cls: mark(), ptrs: [{ at: low, label: 'LOW', cls: 'blue', dx: low === high ? -14 : 0 }, { at: high, label: 'HIGH', cls: 'red' }], line: [7, 8], rows: rows.slice(), ask: { q: 'arr[mid] = ' + arr[mid] + ', target = ' + target + '. What next?', options: opts, answer: 2 } });
      }
    }
    F.push({ cap: 'low > high. Nothing left to check. **return -1** (not found).', cls: mark(), ptrs: [], line: 10, rows: rows.slice(), mood: 'oops' });
    return F;
  }

  function binaryLab(root) {
    const L = ST.lab(root, { vb: [W, H], code: BIN_CODE, codeTitle: 'C# — FROM CLASS', alt: 'Binary search animation' });
    const arrIn = ui.field('SORTED NUMBERS', '4, 8, 15, 16, 23, 42, 99', { onEnter: run });
    const tIn = ui.field('TARGET', '23', { small: true, onEnter: run });
    L.controls.appendChild(ui.row(arrIn.el, tIn.el, ui.button('SEARCH', run, 'btn-yellow'),
      ui.button('15 NUMBERS', function () { arrIn.input.value = '2, 5, 8, 12, 16, 23, 38, 45, 56, 61, 72, 80, 88, 91, 99'; tIn.input.value = '72'; run(); })));
    const trace = L.panel('POINTER TRACE', { before: true });
    let arr = [];
    function render(f, i, o) {
      L.scene.draw({ nodes: cells(arr, f, 120).nodes }, { instant: o.instant });
      U.clear(trace);
      trace.appendChild(ui.table(['#', 'low', 'high', 'mid', 'arr[mid]'], f.rows.map(function (r, k) { return [k + 1].concat(r); }), { rowCls: function (r, k) { return k === f.rows.length - 1 ? 'hot' : ''; } }));
      if (!f.rows.length) trace.appendChild(h('p', { class: 'panel-note' }, 'Each row is one check.'));
      trace.appendChild(h('p', { class: 'panel-note' }, 'Linear search would need up to ' + arr.length + ' checks. Binary: at most ' + Math.ceil(Math.log2(arr.length + 1)) + '.'));
    }
    function run() {
      let a = U.parseNums(arrIn.input.value, { max: 15 });
      if (!a.length) a = [4, 8, 15, 16, 23, 42, 99];
      const sorted = a.slice().sort(function (x, y) { return x - y; });
      const wasSorted = sorted.join() === a.join();
      arr = sorted;
      arrIn.input.value = arr.join(', ');
      const t = parseInt(tIn.input.value, 10);
      const fr = binaryFrames(arr, isFinite(t) ? t : arr[0]);
      if (!wasSorted) fr[0].cap = 'Your list was not sorted, so I sorted it first. ' + fr[0].cap;
      L.player.load(fr, render);
    }
    run();
    return L;
  }

  // ---------------------------------------------------------------- number hunt game
  function huntLab(root) {
    const L = ST.lab(root, { vb: [W, 230], player: false, side: true, alt: 'Number guessing game' });
    let secret, low, high, guesses, history;
    const gIn = ui.field('YOUR GUESS (1–100)', '', { small: true, onEnter: function () { guess(parseInt(gIn.input.value, 10)); } });
    L.controls.appendChild(ui.row(gIn.el, ui.button('GUESS', function () { guess(parseInt(gIn.input.value, 10)); }, 'btn-yellow'),
      ui.button('GUESS THE MIDDLE', function () { guess(low + Math.floor((high - low) / 2)); }, 'btn-ink'),
      ui.button('NEW GAME', reset)));
    const hist = L.panel('YOUR GUESSES');
    L.panel('GOAL').appendChild(h('p', { class: 'panel-note' }, 'A computer that always guesses the middle needs at most 7 guesses for 1–100, because 2⁷ = 128 ≥ 100.'));
    L.scene.clickFn = function (id) { if (/^n\d+$/.test(id)) guess(Number(id.slice(1))); };
    function reset() { secret = U.randInt(1, 100); low = 1; high = 100; guesses = 0; history = []; draw(); L.say('I picked a secret number from **1 to 100**. Guess it. Click a bar or type a number.', 'idle'); }
    function guess(g) {
      if (!isFinite(g) || g < 1 || g > 100) { L.say('Type a whole number from 1 to 100.', 'oops'); return; }
      if (secret === null) return;
      guesses++;
      let msg;
      if (g === secret) {
        history.push({ v: g, cls: 'done', tag: '✓' });
        msg = '**' + g + ' is correct!** You used ' + guesses + ' guess' + (guesses > 1 ? 'es' : '') + '. ' + (guesses <= 7 ? 'As good as binary search!' : 'Tip: always guess the middle of what is left.');
        low = high = g;
        draw(g);
        L.say(msg, 'happy');
        ST.sound.play('done');
        secret = null;
        return;
      }
      if (g < secret) { history.push({ v: g, tag: 'LOW' }); low = Math.max(low, g + 1); msg = g + ' is **too low**. Drop everything up to ' + g + '.'; }
      else { history.push({ v: g, tag: 'HIGH' }); high = Math.min(high, g - 1); msg = g + ' is **too high**. Drop everything from ' + g + ' up.'; }
      draw(g);
      L.say(msg + ' Left: ' + low + ' to ' + high + ' (' + (high - low + 1) + ' numbers).', 'idle');
      ST.sound.play('step');
      gIn.input.value = '';
    }
    function draw(last) {
      const nodes = [];
      const bw = (W - 110) / 100;
      for (let k = 1; k <= 100; k++) {
        const inWin = k >= low && k <= high;
        nodes.push({ id: 'n' + k, t: 'bar', x: 55 + (k - 0.5) * bw, y: 170, w: bw - 1.5, h: 20 + k * 1.1, label: k % 10 === 0 || k === 1 ? k : '', fs: 11, cls: (k === last ? (secret === null ? 'done' : 'bad') : (inWin ? '' : 'dim')) + ' clickable' });
      }
      nodes.push({ id: 'lo', t: 'ptr', x: 55 + (low - 0.5) * bw, y: 180, label: 'LOW ' + low, cls: 'blue' });
      if (high !== low) nodes.push({ id: 'hi', t: 'ptr', x: 55 + (high - 0.5) * bw, y: 180, label: 'HIGH ' + high, cls: 'red' });
      L.scene.draw({ nodes: nodes });
      U.clear(hist);
      hist.appendChild(ui.strip(history, { empty: 'No guesses yet' }));
      hist.appendChild(h('div', { class: 'stats', style: 'margin-top:8px' }, ui.stat('GUESSES', guesses), ui.stat('NUMBERS LEFT', high - low + 1)));
    }
    reset();
    return L;
  }

  // ================================================================ lesson
  const lk = ST.lk;
  const RULES = [
    { rule: 'mid = low + (high − low) / 2, rounded down', note: 'Integer division, as in C#. Rounding up also works, but the steps change.' }
  ];
  function lesson() {
    const L1 = [8, 3, 6, 1, 9, 4, 7];
    const lin = function (k, cap) {
      return { cap: cap, nodes: lk.cells('c', L1, { w: 52, y: 120, top: function (i) { return '[' + i + ']'; },
        cls: function (i) { return k < 0 ? 'wait' : i === k ? (L1[i] === 9 ? 'done' : 'cur') : (i < k ? 'dim' : ''); } })
        .concat([lk.tag('find', 60, 30, 'FIND 9', 'yellow')]) };
    };
    // one binary-search picture: range lo..hi, mid, optional bad index
    const bs = function (arr, find, lo, hi, mid, cap, o) {
      o = o || {};
      const n = arr.length, w = n > 8 ? 38 : 52, gap = n > 8 ? 4 : 6;
      const xs = lk.xs(n, w, gap);
      const nodes = lk.cells('b', arr, { w: w, gap: gap, y: 110, fs: n > 8 ? 16 : undefined, cls: function (i) {
        if (i === o.bad) return 'bad';
        if (i === mid) return o.found ? 'done' : 'cur';
        return i < lo || i > hi ? 'dim' : '';
      } });
      nodes.push(lk.tag('find', 60, 24, 'FIND ' + find, 'yellow'));
      if (mid >= 0) nodes.push(lk.ptr('M', xs[mid], 110 - w / 2 - 5, 'MID', 'red', true));
      if (lo === hi) nodes.push(lk.ptr('L', xs[lo], 110 + w / 2 + 5, 'LOW = HIGH', 'blue'));
      else if (lo < hi) {
        nodes.push(lk.ptr('L', xs[lo], 110 + w / 2 + 5, 'LOW', 'blue'));
        nodes.push(lk.ptr('H', xs[hi], 110 + w / 2 + 5, 'HIGH', 'blue'));
      }
      return { nodes: nodes, cap: cap };
    };
    const B = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91];
    const U2 = [9, 2, 7, 1, 8, 3, 5];
    const halve = function (n, cap) {
      const bn = Math.ceil(Math.log2(n));
      return { cap: cap, nodes: [
        lk.tag('n', 400, 40, 'n = ' + n.toLocaleString('en-US'), 'yellow'),
        { id: 'lin', t: 'bar', x: 180, y: 186, w: 80, h: 150, label: n.toLocaleString('en-US'), sub: 'LINEAR' },
        { id: 'bin', t: 'bar', x: 330, y: 186, w: 80, h: Math.max(4, 150 * bn / n), label: bn, sub: 'BINARY', cls: 'done' }
      ] };
    };
    return [
      { title: 'Linear: check one by one', frames: [
        lin(0, '8? No. Next.'), lin(1, '3? No.'), lin(2, '6? No.'), lin(3, '1? No.'),
        lin(4, '**9**! Found at index 4.'),
        lin(-1, 'Worst case: check **all n**. O(n).')
      ] },
      { title: 'Binary: check the middle', frames: [
        bs(B, 45, 0, 10, -1, 'A **sorted** list. Find 45.'),
        bs(B, 45, 0, 10, 5, '23 < 45 → drop the **left** half.'),
        bs(B, 45, 6, 10, 8, '56 > 45 → drop the **right** half.'),
        bs(B, 45, 6, 7, 6, '38 < 45 → go right.'),
        bs(B, 45, 7, 7, 7, 'Found in **4** checks, not 8.', { found: true })
      ] },
      { title: 'Halving wins big', frames: [
        halve(16, '16 items: 16 checks vs **4**.'),
        halve(1000, '1,000 items: 1,000 vs **10**.'),
        halve(1000000, 'A million items: just **20**. O(log n).')
      ] },
      { title: 'Unsorted? It misses', trap: true, frames: [
        bs(U2, 2, 0, 6, -1, 'Not sorted. Find 2.'),
        bs(U2, 2, 0, 6, 3, '1 < 2 → drop the left half…'),
        bs(U2, 2, 4, 6, -1, '…but **2 was on the left!**', { bad: 1 }),
        bs(U2, 2, 4, 6, 5, '3 > 2 → go left.', { bad: 1 }),
        bs(U2, 2, 4, 4, 4, '"Not found." Wrong. **Sort first.**', { bad: 1 })
      ] }
    ];
  }

  ST.topic({
    id: 'search', n: 2, color: 'yellow', icon: 'search',
    title: 'Searching',
    short: 'Linear search checks every box. Binary search cuts the list in half.',
    blurb: 'Two ways to find a value. One is much faster on sorted data.',
    cheat: {
      head: ['', 'Linear', 'Binary'],
      rows: [
        ['Needs sorted data?', 'No', 'Yes'],
        ['Best case', 'O(1)', 'O(1)'],
        ['Worst case', 'O(n)', 'O(log n)'],
        ['1,000,000 items', '1,000,000 checks', '20 checks']
      ]
    },
    lesson: lesson(),
    rules: RULES,
    labs: [
      { id: 'linear', title: 'Linear search', tag: 'TRACE', setup: linearLab },
      { id: 'binary', title: 'Binary search', tag: 'TRACE', setup: binaryLab },
      { id: 'hunt', title: 'Number hunt', tag: 'GAME', setup: huntLab }
    ]
  });
})(window.ST);
