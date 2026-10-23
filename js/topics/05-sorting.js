/* World 5 — Sorting: Bubble, Selection, Insertion (Week 4) */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;

  const W = 820, H = 330;

  const CODE = {
    bubble: [
      'static void BubbleSort(int[] numbers)',
      '{',
      '    bool swapped;',
      '    do',
      '    {',
      '        swapped = false;',
      '        for (int i = 0; i < numbers.Length - 1; i++)',
      '        {',
      '            if (numbers[i] > numbers[i + 1])',
      '            {',
      '                int temp = numbers[i];',
      '                numbers[i] = numbers[i + 1];',
      '                numbers[i + 1] = temp;',
      '                swapped = true;',
      '            }',
      '        }',
      '    } while (swapped);',
      '}'
    ],
    selection: [
      'static void SelectionSort(int[] numbers)',
      '{',
      '    for (int i = 0; i < numbers.Length - 1; i++)',
      '    {',
      '        int minIndex = i;',
      '        for (int j = i + 1; j < numbers.Length; j++)',
      '        {',
      '            if (numbers[j] < numbers[minIndex])',
      '            {',
      '                minIndex = j;',
      '            }',
      '        }',
      '        int temp = numbers[i];',
      '        numbers[i] = numbers[minIndex];',
      '        numbers[minIndex] = temp;',
      '    }',
      '}'
    ],
    insertion: [
      'static void InsertionSort(int[] numbers)',
      '{',
      '    for (int i = 1; i < numbers.Length; i++)',
      '    {',
      '        int x = numbers[i];',
      '        int j = i - 1;',
      '        while (j >= 0 && numbers[j] > x)',
      '        {',
      '            numbers[j + 1] = numbers[j];',
      '            j--;',
      '        }',
      '        numbers[j + 1] = x;',
      '    }',
      '}'
    ]
  };

  const PRESETS = [
    { v: 'bubble', label: 'Lesson: 5 1 4 2', arr: [5, 1, 4, 2] },
    { v: 'selection', label: 'Lesson: 64 25 12 22 11', arr: [64, 25, 12, 22, 11] },
    { v: 'insertion', label: 'Lesson: 4 3 2 10 12', arr: [4, 3, 2, 10, 12] },
    { v: 'program', label: 'Class program (10 numbers)', arr: [28, 40, 28, 22, 35, 14, 11, 29, 39, 33] },
    { v: 'reverse', label: 'Worst case: 6 5 4 3 2 1', arr: [6, 5, 4, 3, 2, 1] },
    { v: 'almost', label: 'Almost sorted: 1 2 4 3 5 6', arr: [1, 2, 4, 3, 5, 6] }
  ];

  // ---------------------------------------------------------------- frame builders
  function mk(arr) {
    const items = arr.map(function (v, k) { return { id: 'e' + k, v: v }; });
    const vals = {};
    items.forEach(function (it) { vals[it.id] = it.v; });
    return { slots: items.map(function (it) { return it.id; }), vals: vals };
  }

  function snap(st, extra) {
    const f = { slots: st.slots.slice(), vals: st.vals, cls: {}, ptrs: [], boxes: [], lift: null, stats: Object.assign({}, st.stats) };
    Object.keys(st.locked || {}).forEach(function (id) { f.cls[id] = 'done'; });
    return Object.assign(f, extra || {});
  }

  function bubbleFrames(arr) {
    const st = mk(arr);
    st.stats = { pass: 0, compares: 0, swaps: 0 };
    st.locked = {};
    const F = [];
    const n = arr.length;
    const V = function (k) { return st.vals[st.slots[k]]; };
    F.push(snap(st, { cap: 'Bubble Sort compares **neighbors** and swaps them if they are in the wrong order.', line: 0 }));
    let swapped, pass = 0;
    do {
      swapped = false;
      pass++;
      st.stats.pass = pass;
      F.push(snap(st, { cap: '**Pass ' + pass + '** starts. `swapped = false`.', line: 5 }));
      for (let i = 0; i < n - 1; i++) {
        st.stats.compares++;
        const a = V(i), b = V(i + 1);
        const cmp = snap(st, { cap: 'Compare **' + a + '** and **' + b + '**.', line: 8, ptrs: [{ at: i, label: 'i' }, { at: i + 1, label: 'i+1' }] });
        cmp.cls[st.slots[i]] = 'cur'; cmp.cls[st.slots[i + 1]] = 'cur';
        F.push(cmp);
        if (a > b) {
          const t = st.slots[i]; st.slots[i] = st.slots[i + 1]; st.slots[i + 1] = t;
          st.stats.swaps++;
          swapped = true;
          const f = snap(st, { cap: a + ' > ' + b + ' → **swap**.', line: [10, 11, 12, 13], sound: 'swap', ptrs: [{ at: i, label: 'i' }, { at: i + 1, label: 'i+1' }],
            ask: { q: 'Compare ' + a + ' and ' + b + '. Swap them?', options: ['Yes, swap', 'No, keep'], answer: 0 } });
          f.cls[st.slots[i]] = 'bad'; f.cls[st.slots[i + 1]] = 'bad';
          F.push(f);
        } else {
          const f = snap(st, { cap: a + ' ≤ ' + b + ' → no swap.', line: 8, ptrs: [{ at: i, label: 'i' }, { at: i + 1, label: 'i+1' }],
            ask: { q: 'Compare ' + a + ' and ' + b + '. Swap them?', options: ['Yes, swap', 'No, keep'], answer: 1 } });
          F.push(f);
        }
      }
      // after pass p, the last p values are in their final place
      const lockAt = n - pass;
      if (lockAt >= 0 && lockAt < n) {
        const fresh = !st.locked[st.slots[lockAt]];
        st.locked[st.slots[lockAt]] = true;
        if (fresh && swapped) F.push(snap(st, { cap: 'Pass ' + pass + ' done. **' + V(lockAt) + '** bubbled to its final place. A swap happened, so do another pass.', line: 16 }));
      }
      if (!swapped) {
        st.slots.forEach(function (id) { st.locked[id] = true; });
        F.push(snap(st, { cap: 'Pass ' + pass + ' had **no swaps**. The array is sorted!', line: 16, mood: 'happy' }));
      }
    } while (swapped);
    return F;
  }

  function selectionFrames(arr) {
    const st = mk(arr);
    st.stats = { pass: 0, compares: 0, swaps: 0 };
    st.locked = {};
    const F = [];
    const n = arr.length;
    const V = function (k) { return st.vals[st.slots[k]]; };
    F.push(snap(st, { cap: 'Selection Sort finds the **smallest** value and puts it at the front.', line: 0 }));
    for (let i = 0; i < n - 1; i++) {
      st.stats.pass = i + 1;
      let min = i;
      const base = function (extra) {
        const f = snap(st, extra);
        f.cls[st.slots[min]] = 'pivot';
        f.ptrs = [{ at: i, label: 'i' }, { at: min, label: 'min', cls: 'orange', down: true }].concat(extra.ptrs || []);
        return f;
      };
      F.push(base({ cap: '**Pass ' + (i + 1) + '**: `minIndex = ' + i + '`. Smallest so far: **' + V(min) + '**.', line: 4 }));
      for (let j = i + 1; j < n; j++) {
        st.stats.compares++;
        const f = base({ cap: 'Is **' + V(j) + '** smaller than **' + V(min) + '**?', line: 7, ptrs: [{ at: j, label: 'j', cls: 'blue' }] });
        f.cls[st.slots[j]] = 'cur';
        F.push(f);
        if (V(j) < V(min)) {
          const old = V(min);
          min = j;
          F.push(base({ cap: 'Yes. ' + V(min) + ' < ' + old + '. New smallest: **' + V(min) + '**.', line: 9, ptrs: [{ at: j, label: 'j', cls: 'blue' }] }));
        }
      }
      // predict: which is the minimum?
      const minId = st.slots[min];
      const pickAmong = st.slots.slice(i);
      if (min !== i) {
        const a = V(i), b = V(min);
        const t = st.slots[i]; st.slots[i] = st.slots[min]; st.slots[min] = t;
        st.stats.swaps++;
        const f = snap(st, { cap: 'Swap **' + b + '** with **' + a + '** (index ' + i + ').', line: [12, 13, 14], sound: 'swap',
          ask: { q: 'Which value is the smallest in the unsorted part? Click it.', pick: minId, among: pickAmong, answerText: String(b) } });
        f.cls[st.slots[i]] = 'bad'; f.cls[st.slots[min]] = 'bad';
        f.ptrs = [{ at: i, label: 'i' }];
        F.push(f);
      } else {
        st.stats.swaps++;
        const f = snap(st, { cap: '**' + V(i) + '** is already the smallest. It swaps with itself (no change).', line: [12, 13, 14],
          ask: { q: 'Which value is the smallest in the unsorted part? Click it.', pick: minId, among: pickAmong, answerText: String(V(i)) } });
        f.cls[st.slots[i]] = 'cur';
        f.ptrs = [{ at: i, label: 'i' }];
        F.push(f);
      }
      st.locked[st.slots[i]] = true;
      F.push(snap(st, { cap: 'Index ' + i + ' is final: **' + V(i) + '**.', line: 2, boxes: [{ from: 0, to: i, label: 'SORTED', cls: 'teal' }] }));
    }
    st.locked[st.slots[n - 1]] = true;
    F.push(snap(st, { cap: 'The last value is in place too. **Sorted!** Swaps: ' + st.stats.swaps + ' (at most n − 1).', line: 16, mood: 'happy', boxes: [{ from: 0, to: n - 1, label: 'SORTED', cls: 'teal' }] }));
    return F;
  }

  function insertionFrames(arr) {
    const st = mk(arr);
    st.stats = { pass: 0, compares: 0, shifts: 0 };
    st.locked = {};
    const F = [];
    const n = arr.length;
    const sortedBox = function (to) { return [{ from: 0, to: to, label: 'SORTED PART', cls: 'teal' }]; };
    F.push(snap(st, { cap: 'Insertion Sort grows a **sorted part** on the left, one value at a time.', line: 0, boxes: sortedBox(0) }));
    for (let i = 1; i < n; i++) {
      st.stats.pass = i;
      const xId = st.slots[i];
      const x = st.vals[xId];
      st.slots[i] = null;
      let j = i - 1;
      const holding = function (extra) {
        const f = snap(st, extra);
        f.lift = { id: xId, at: extra.liftAt };
        f.cls[xId] = 'pivot';
        return f;
      };
      F.push(holding({ cap: 'Take **x = ' + x + '** (index ' + i + '). Lift it out.', line: [4, 5], liftAt: i, boxes: sortedBox(i - 1), ptrs: [{ at: j, label: 'j', cls: 'blue' }] }));
      while (j >= 0) {
        st.stats.compares++;
        const vj = st.vals[st.slots[j]];
        const cmpF = holding({ cap: 'Is **' + vj + '** > ' + x + '?', line: 6, liftAt: j + 1, boxes: sortedBox(i - 1), ptrs: [{ at: j, label: 'j', cls: 'blue' }] });
        cmpF.cls[st.slots[j]] = 'cur';
        F.push(cmpF);
        if (vj > x) {
          st.slots[j + 1] = st.slots[j];
          st.slots[j] = null;
          st.stats.shifts++;
          const f = holding({ cap: 'Yes → shift **' + vj + '** one step right.', line: 8, liftAt: j, sound: 'swap', boxes: sortedBox(i - 1), ptrs: [{ at: j - 1 >= 0 ? j - 1 : 0, label: j - 1 >= 0 ? 'j' : 'j = -1', cls: 'blue' }],
            ask: { q: 'Is ' + vj + ' > ' + x + '? Shift ' + vj + ' right?', options: ['Yes, shift it', 'No, stop here'], answer: 0 } });
          f.cls[st.slots[j + 1]] = 'bad';
          F.push(f);
          j--;
        } else {
          F.push(holding({ cap: 'No. ' + vj + ' ≤ ' + x + ' → stop.', line: 6, liftAt: j + 1, boxes: sortedBox(i - 1), ptrs: [{ at: j, label: 'j', cls: 'blue' }],
            ask: { q: 'Is ' + vj + ' > ' + x + '? Shift ' + vj + ' right?', options: ['Yes, shift it', 'No, stop here'], answer: 1 } }));
          break;
        }
      }
      st.slots[j + 1] = xId;
      const place = snap(st, { cap: 'Drop **' + x + '** at index ' + (j + 1) + '. Sorted part: 0 to ' + i + '.', line: 11, boxes: sortedBox(i) });
      place.cls[xId] = 'cur';
      F.push(place);
    }
    st.slots.forEach(function (id) { st.locked[id] = true; });
    F.push(snap(st, { cap: 'Every value is inserted. **Sorted!**', line: 13, mood: 'happy', boxes: sortedBox(n - 1) }));
    return F;
  }

  // ---------------------------------------------------------------- render
  function makeRenderer(L, getView, statsBody, statKeys) {
    return function (f, i, o) {
      const n = f.slots.length;
      const view = getView();
      const cell = ST.kit.fit(n, W, 64, 40);
      const xs = ST.kit.row(n, W, cell, Math.round(cell * 0.18));
      const maxV = Math.max.apply(null, Object.keys(f.vals).map(function (k) { return Math.abs(f.vals[k]); }).concat([1]));
      const baseY = view === 'bars' ? 250 : 190;
      const nodes = [];
      // boxes behind cells
      (f.boxes || []).forEach(function (b, k) {
        const x1 = xs[b.from] - cell / 2 - 8, x2 = xs[b.to] + cell / 2 + 8;
        const top = view === 'bars' ? 40 : baseY - cell / 2 - 30;
        const bot = view === 'bars' ? baseY + 32 : baseY + cell / 2 + 28;
        nodes.push({ id: 'box' + k, t: 'box', x: (x1 + x2) / 2, y: (top + bot) / 2, w: x2 - x1, h: bot - top, label: b.label, cls: b.cls });
      });
      Object.keys(f.vals).forEach(function (id) {
        let at = f.slots.indexOf(id);
        let y = baseY;
        if (f.lift && f.lift.id === id) { at = f.lift.at; y = view === 'bars' ? baseY - 0 : baseY - cell - 46; }
        if (at < 0) return;
        const v = f.vals[id];
        if (view === 'bars') {
          const bh = 24 + 170 * Math.abs(v) / maxV;
          const lifted = f.lift && f.lift.id === id;
          nodes.push({ id: id, t: 'bar', x: xs[at], y: lifted ? baseY - 0 : y, w: cell * 0.82, h: bh, label: v, cls: (f.cls[id] || '') + (lifted ? ' faint' : ''), z: 'front' });
        } else {
          nodes.push({ id: id, t: 'cell', x: xs[at], y: y, w: cell, h: cell, label: v, cls: f.cls[id] || '', z: f.lift && f.lift.id === id ? 'front' : null });
        }
      });
      // index labels and empty slots
      for (let k = 0; k < n; k++) {
        nodes.push({ id: 'ix' + k, t: 'label', x: xs[k], y: view === 'bars' ? baseY + 16 : baseY + cell / 2 + 14, label: '[' + k + ']', fs: 12 });
        if (f.slots[k] === null && view !== 'bars') nodes.push({ id: 'gap' + k, t: 'cell', x: xs[k], y: baseY, w: cell, h: cell, label: '', cls: 'ghost' });
      }
      (f.ptrs || []).forEach(function (p, k) {
        if (p.at < 0 || p.at >= n) return;
        const y = p.down ? (view === 'bars' ? 34 : baseY - cell / 2 - 10) : (view === 'bars' ? baseY + 38 : baseY + cell / 2 + 30);
        nodes.push({ id: 'p-' + p.label.replace(/\W/g, '') + k, t: 'ptr', x: xs[p.at], y: y, label: p.label, cls: p.cls || '', down: !!p.down });
      });
      L.scene.draw({ nodes: nodes, edges: [] }, { instant: o.instant });
      if (statsBody) {
        U.clear(statsBody);
        const wrap = h('div', { class: 'stats' });
        statKeys.forEach(function (k) { wrap.appendChild(ui.stat(k.label, f.stats[k.key] || 0)); });
        statsBody.appendChild(wrap);
      }
    };
  }

  function sortLab(kind) {
    return function (root) {
      const L = ST.lab(root, { vb: [W, H], code: CODE[kind], codeTitle: 'C# — FROM CLASS', alt: kind + ' sort animation' });
      let view = 'boxes';
      const def = kind === 'bubble' ? PRESETS[0] : kind === 'selection' ? PRESETS[1] : PRESETS[2];
      const inp = ui.field('NUMBERS (up to 12)', def.arr.join(', '), { onEnter: function () { run(); } });
      const preset = ui.select('EXAMPLES', [{ v: '', label: 'Choose an example…' }].concat(PRESETS), '', function (v) {
        const p = PRESETS.filter(function (x) { return x.v === v; })[0];
        if (p) { inp.input.value = p.arr.join(', '); run(); }
      });
      const viewSeg = ui.seg('VIEW', [{ v: 'boxes', label: 'BOXES' }, { v: 'bars', label: 'BARS' }], view, function (v) { view = v; L.player.show(L.player.i, { instant: true }); });
      L.controls.appendChild(ui.row(inp.el, ui.button('RUN', run, 'btn-yellow'), ui.button('RANDOM', function () {
        inp.input.value = U.randomNums(7, 1, 60).join(', '); run();
      })));
      L.controls.appendChild(ui.row(preset.el, viewSeg));
      const statsBody = L.panel('COUNTERS', { before: true });
      const keys = kind === 'insertion'
        ? [{ key: 'pass', label: 'ROUND' }, { key: 'compares', label: 'COMPARES' }, { key: 'shifts', label: 'SHIFTS' }]
        : [{ key: 'pass', label: 'PASS' }, { key: 'compares', label: 'COMPARES' }, { key: 'swaps', label: 'SWAPS' }];
      const render = makeRenderer(L, function () { return view; }, statsBody, keys);
      function run() {
        let arr = U.parseNums(inp.input.value, { max: 12 });
        if (arr.length < 2) { arr = def.arr.slice(); inp.input.value = arr.join(', '); }
        const frames = kind === 'bubble' ? bubbleFrames(arr) : kind === 'selection' ? selectionFrames(arr) : insertionFrames(arr);
        L.player.load(frames, render);
      }
      run();
      return L;
    };
  }

  function compareLab(root) {
    const L = ST.lab(root, { vb: [W, 300], player: false, side: false, alt: 'Bar chart comparing the three sorts' });
    const inp = ui.field('NUMBERS (up to 12)', '28, 40, 28, 22, 35, 14, 11, 29, 39, 33', { onEnter: function () { run(); } });
    const tableHost = h('div', { class: 'compare-table' });
    L.controls.appendChild(ui.row(inp.el, ui.button('COMPARE', run, 'btn-yellow'),
      ui.button('SORTED INPUT', function () { inp.input.value = '1, 2, 3, 4, 5, 6, 7, 8'; run(); }),
      ui.button('REVERSED INPUT', function () { inp.input.value = '8, 7, 6, 5, 4, 3, 2, 1'; run(); })));
    L.root.querySelector('.lab-main').appendChild(tableHost);
    function count(frames) { return frames[frames.length - 1].stats; }
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 12 });
      if (arr.length < 2) arr = [5, 1, 4, 2];
      const b = count(bubbleFrames(arr)), s = count(selectionFrames(arr)), ins = count(insertionFrames(arr));
      const data = [
        { name: 'BUBBLE', c: b.compares, m: b.swaps, ml: 'swaps' },
        { name: 'SELECTION', c: s.compares, m: s.swaps, ml: 'swaps' },
        { name: 'INSERTION', c: ins.compares, m: ins.shifts, ml: 'shifts' }
      ];
      const max = Math.max.apply(null, data.map(function (d) { return Math.max(d.c, d.m); }).concat([1]));
      const nodes = [];
      data.forEach(function (d, k) {
        const y = 60 + k * 82;
        nodes.push({ id: 'n' + k, t: 'label', x: 20, y: y + 10, label: d.name, anchor: 'start', cls: 'ink', fs: 15 });
        const cw = Math.max(4, 560 * d.c / max), mw = Math.max(4, 560 * d.m / max);
        nodes.push({ id: 'c' + k, t: 'box', x: 180 + cw / 2, y: y, w: cw, h: 24, cls: 'yellow' });
        nodes.push({ id: 'cl' + k, t: 'label', x: 190 + cw, y: y, label: d.c + ' compares', anchor: 'start', cls: 'pix', fs: 14 });
        nodes.push({ id: 'm' + k, t: 'box', x: 180 + mw / 2, y: y + 28, w: mw, h: 24, cls: 'red' });
        nodes.push({ id: 'ml' + k, t: 'label', x: 190 + mw, y: y + 28, label: d.m + ' ' + d.ml, anchor: 'start', cls: 'pix', fs: 14 });
      });
      L.scene.draw({ nodes: nodes });
      const best = data.slice().sort(function (x, y) { return x.c - y.c; })[0];
      L.say('Same numbers, three sorts. Fewest compares here: **' + best.name.toLowerCase() + '**. Try a sorted input: insertion sort wins big.', 'idle');
    }
    run();
    return L;
  }

  ST.topic({
    id: 'sorting', n: 5, week: 'Week 4', color: 'yellow', icon: 'sorting',
    title: 'Sorting',
    short: 'Bubble, Selection and Insertion Sort — one compare at a time.',
    blurb: 'Three simple sorts. Same goal, different moves.',
    remember: [
      { big: 'BUBBLE ⇄', text: 'Compare neighbors. Swap if wrong. The biggest bubbles to the end.' },
      { big: 'SELECTION ↓MIN', text: 'Find the smallest value. Swap it to the front.' },
      { big: 'INSERTION ⤵', text: 'Take the next value. Slide it into the sorted part.' }
    ],
    cheat: {
      head: ['Sort', 'Main move', 'Worst', 'Best', 'Good for'],
      rows: [
        ['Bubble', 'Swap neighbors', 'O(n²)', 'O(n) (no swaps → stop)', 'Learning'],
        ['Selection', 'Find min, swap', 'O(n²)', 'O(n²)', 'Few swaps (n − 1)'],
        ['Insertion', 'Shift and insert', 'O(n²)', 'O(n)', 'Almost sorted lists']
      ]
    },
    mistake: 'Selection Sort swaps once per pass, not after every compare. It only remembers the index of the smallest value.',
    labs: [
      { id: 'bubble', title: 'Bubble Sort', tag: 'TRACE', setup: sortLab('bubble') },
      { id: 'selection', title: 'Selection Sort', tag: 'TRACE', setup: sortLab('selection') },
      { id: 'insertion', title: 'Insertion Sort', tag: 'TRACE', setup: sortLab('insertion') },
      { id: 'compare', title: 'Race all three', tag: 'PLAY', setup: compareLab }
    ]
  });

  ST.sortFrames = { bubble: bubbleFrames, selection: selectionFrames, insertion: insertionFrames };
})(window.ST);
