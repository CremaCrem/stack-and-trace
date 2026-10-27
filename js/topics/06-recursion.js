/* World 6 — Recursion, Merge Sort, Quick Sort */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;

  // ================================================================ call stack
  const FACT_CODE = [
    'static int Factorial(int n)',
    '{',
    '    if (n <= 1)',
    '    {',
    '        return 1;            // base case',
    '    }',
    '    return n * Factorial(n - 1);  // recursive case',
    '}'
  ];
  const FACT_BAD = [
    'static int Factorial(int n)',
    '{',
    '    // base case forgotten!',
    '',
    '',
    '',
    '    return n * Factorial(n - 1);',
    '}'
  ];
  const COUNT_CODE = [
    'static void CountDown(int n)',
    '{',
    '    if (n == 0) return;   // base case',
    '    Console.WriteLine(n);',
    '    CountDown(n - 1);     // recursive case',
    '}'
  ];

  function fact(n) { return n <= 1 ? 1 : n * fact(n - 1); }

  function factFrames(n, noBase) {
    const F = [];
    let stack = [];
    const snap = function (extra) { return Object.assign({ stack: stack.map(function (s) { return Object.assign({}, s); }), out: [] }, extra); };
    stack.push({ id: 'main', label: 'Main()', note: 'calls Factorial(' + n + ')', cls: 'paper' });
    F.push(snap({ cap: '`Main()` calls **Factorial(' + n + ')**. Each call gets its own box on the **call stack**.', line: null }));
    let k = n, depth = 0;
    while (true) {
      depth++;
      stack.forEach(function (s) { if (s.id !== 'main') s.cls = 'wait'; });
      stack.push({ id: 'f' + k + '-' + depth, label: 'Factorial(' + k + ')', note: 'n = ' + k, cls: 'cur', fresh: true });
      F.push(snap({ cap: 'Push **Factorial(' + k + ')**. n = ' + k + '.', line: 0, sound: 'step' }));
      stack[stack.length - 1].fresh = false;
      if (noBase && depth >= 8) {
        stack[stack.length - 1].cls = 'bad';
        F.push(snap({ cap: 'No base case, so it never stops: Factorial(' + k + '), Factorial(' + (k - 1) + ')… The stack runs out of space: **Stack Overflow!**', line: 6, mood: 'oops', overflow: true }));
        return F;
      }
      if (!noBase && k <= 1) {
        stack[stack.length - 1].note = 'returns 1';
        stack[stack.length - 1].cls = 'done';
        F.push(snap({ cap: k + ' <= 1 → **base case**. Return 1. The calls stop here.', line: [2, 4] }));
        break;
      }
      stack[stack.length - 1].note = k + ' × Factorial(' + (k - 1) + ')  waiting…';
      F.push(snap({ cap: k + ' is not <= 1. Compute ' + k + ' × Factorial(' + (k - 1) + '). It must **wait** for the answer.', line: noBase ? 6 : [2, 6] }));
      k--;
    }
    // unwind
    let ret = 1;
    while (stack.length > 2) {
      const done = stack.pop();
      const top = stack[stack.length - 1];
      const kk = parseInt(top.label.match(/\d+/)[0], 10);
      const prev = ret;
      ret = kk * prev;
      top.cls = 'done';
      top.note = kk + ' × ' + prev + ' = ' + ret;
      const opts = [ret, kk + prev, prev, ret * 2].filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 3);
      opts.sort(function (a, b) { return a - b; });
      F.push(snap({ cap: 'Pop ' + done.label + ' (it returned ' + prev + '). Now **Factorial(' + kk + ') = ' + kk + ' × ' + prev + ' = ' + ret + '**.', line: 6, gone: done, sound: 'swap',
        ask: { q: 'Factorial(' + (kk - 1) + ') returned ' + prev + '. What does Factorial(' + kk + ') return?', options: opts.map(String), answer: opts.indexOf(ret) } }));
    }
    const last = stack.pop();
    stack[0].note = 'got ' + ret;
    stack[0].cls = 'done';
    F.push(snap({ cap: 'Pop ' + last.label + '. Main() gets **' + ret + '**. ' + n + '! = ' + ret + '. Last call in, first call out (LIFO).', line: null, gone: last, mood: 'happy' }));
    return F;
  }

  function countFrames(n) {
    const F = [];
    const stack = [{ id: 'main', label: 'Main()', note: 'calls CountDown(' + n + ')', cls: 'paper' }];
    const out = [];
    const snap = function (extra) { return Object.assign({ stack: stack.map(function (s) { return Object.assign({}, s); }), out: out.slice() }, extra); };
    F.push(snap({ cap: '`Main()` calls **CountDown(' + n + ')**.' }));
    for (let k = n; k >= 0; k--) {
      stack.forEach(function (s) { if (s.id !== 'main') s.cls = 'wait'; });
      stack.push({ id: 'c' + k, label: 'CountDown(' + k + ')', note: 'n = ' + k, cls: 'cur', fresh: true });
      F.push(snap({ cap: 'Push **CountDown(' + k + ')**.', line: 0 }));
      stack[stack.length - 1].fresh = false;
      if (k === 0) {
        stack[stack.length - 1].cls = 'done';
        stack[stack.length - 1].note = 'base case: return';
        F.push(snap({ cap: 'n == 0 → **base case**. Return without calling again.', line: 2 }));
        break;
      }
      out.push(k);
      stack[stack.length - 1].note = 'printed ' + k;
      F.push(snap({ cap: 'Print **' + k + '**, then call CountDown(' + (k - 1) + ').', line: [3, 4],
        ask: k === n ? { q: 'What will the screen show at the end?', options: [U.range(n).map(function (i) { return n - i; }).join(' '), U.range(n).map(function (i) { return i + 1; }).join(' '), U.range(n + 1).map(function (i) { return n - i; }).join(' ')], answer: 0 } : null }));
    }
    while (stack.length > 1) {
      const g = stack.pop();
      if (stack.length > 1) stack[stack.length - 1].cls = 'done';
      F.push(snap({ cap: 'Pop ' + g.label + '. ' + (stack.length > 1 ? stack[stack.length - 1].label + ' has nothing left to do.' : 'Back in Main().'), gone: g }));
    }
    F.push(snap({ cap: 'Done. Output: **' + out.join(' ') + '**.', mood: 'happy' }));
    return F;
  }

  function callStackLab(root) {
    const W = 820, H = 470;
    const L = ST.lab(root, { vb: [W, H], code: FACT_CODE, codeTitle: 'C# — FROM CLASS', alt: 'The call stack during recursion' });
    let fn = 'fact', noBase = false;
    const nIn = ui.field('n (1–7)', '5', { small: true, onEnter: run });
    L.controls.appendChild(ui.seg('FUNCTION', [{ v: 'fact', label: 'FACTORIAL(n)' }, { v: 'count', label: 'COUNTDOWN(n)' }, { v: 'bad', label: 'NO BASE CASE' }], fn, function (v) { fn = v; noBase = v === 'bad'; run(); }));
    L.controls.appendChild(ui.row(nIn.el, ui.button('RUN', run, 'btn-yellow')));
    const outBody = L.panel('SCREEN OUTPUT', { before: true });
    function render(f, i, o) {
      const nodes = [];
      const bw = 330, bh = 44, x = 260, base = H - 40;
      nodes.push({ id: 'well', t: 'box', x: x, y: H / 2 + 4, w: bw + 30, h: H - 50, label: 'CALL STACK', cls: f.overflow ? 'red' : 'white' });
      f.stack.forEach(function (s, k) {
        const y = base - k * (bh + 6);
        nodes.push({ id: s.id, t: 'cell', x: x, y: y, w: bw, h: bh, label: s.label, cls: s.cls, fs: 18, from: s.fresh ? { x: x, y: 10 } : null });
        nodes.push({ id: s.id + 'n', t: 'label', x: x + bw / 2 + 24, y: y, label: s.note, anchor: 'start', cls: s.cls === 'done' ? 'teal' : 'ink', fs: 14, from: s.fresh ? { x: x + bw / 2 + 24, y: 10 } : null });
      });
      if (f.gone) nodes.push({ id: f.gone.id, t: 'cell', x: x, y: -40, w: bw, h: bh, label: f.gone.label, cls: 'done dim', fs: 18 });
      const top = f.stack.length - 1;
      nodes.push({ id: 'topTag', t: 'tag', x: 52, y: base - top * (bh + 6), label: 'TOP', cls: 'yellow' });
      L.scene.draw({ nodes: nodes }, { instant: o.instant });
      U.clear(outBody);
      if (fn === 'count') outBody.appendChild(ui.strip(f.out, { empty: 'Nothing printed yet' }));
      else outBody.appendChild(h('p', { class: 'panel-note' }, fn === 'bad' ? 'Without a base case, the calls never stop.' : 'Factorial prints nothing. Watch the return values.'));
    }
    function run() {
      const n = U.clamp(parseInt(nIn.input.value, 10) || 5, 1, 7);
      nIn.input.value = String(n);
      L.setCodeLines(fn === 'count' ? COUNT_CODE : fn === 'bad' ? FACT_BAD : FACT_CODE, 'C# — FROM CLASS');
      L.player.load(fn === 'count' ? countFrames(n) : factFrames(n, noBase), render);
    }
    run();
    return L;
  }

  // ================================================================ merge sort
  const MERGE_CODE = [
    'void MergeSort(int[] a, int lo, int hi) {',
    '  if (lo >= hi) return;  // 1 item',
    '  int mid = (lo + hi) / 2;',
    '  MergeSort(a, lo, mid);      // left',
    '  MergeSort(a, mid + 1, hi);  // right',
    '  Merge(a, lo, mid, hi);      // join',
    '}',
    '// Merge: compare the two fronts,',
    '// copy the smaller one. Repeat.'
  ];

  function mergeFrames(arr) {
    const n = arr.length;
    const F = [];
    const cells = {}; // id -> {d, i, v, cls, from}
    let uid = 0;
    arr.forEach(function (v, i) { cells['r' + i] = { d: 0, i: i, v: v, cls: '' }; });
    let maxD = 0;
    const allCuts = [];
    (function depth(lo, hi, d) { if (d > maxD) maxD = d; if (lo >= hi) return; const m = Math.floor((lo + hi) / 2); allCuts.push({ mid: m, d: d }); depth(lo, m, d + 1); depth(m + 1, hi, d + 1); })(0, n - 1, 0);
    const snap = function (extra) {
      const c = {};
      Object.keys(cells).forEach(function (k) { c[k] = Object.assign({}, cells[k]); cells[k].from = null; });
      return Object.assign({ cells: c, cuts: allCuts, maxD: maxD, range: null }, extra);
    };
    const rowIds = function (d, lo, hi) {
      return Object.keys(cells).filter(function (k) { const c = cells[k]; return c.d === d && c.i >= lo && c.i <= hi && !c.ghost; });
    };
    F.push(snap({ cap: 'Merge Sort: **split** the array in half again and again, then **merge** the halves back in order.', line: 0 }));
    function sort(lo, hi, d) {
      if (lo >= hi) {
        rowIds(d, lo, hi).forEach(function (k) { cells[k].cls = 'done'; });
        F.push(snap({ cap: '[' + cells[rowIds(d, lo, hi)[0]].v + '] has one item. One item is **already sorted** (base case).', line: 1, range: { d: d, lo: lo, hi: hi } }));
        return;
      }
      const mid = Math.floor((lo + hi) / 2);
      rowIds(d, lo, hi).forEach(function (k) { cells[k].cls = 'faint'; });
      for (let i = lo; i <= hi; i++) {
        const src = rowIds(d, i, i)[0];
        const id = 'c' + (uid++);
        cells[id] = { d: d + 1, i: i, v: cells[src].v, cls: '', from: { d: d, i: i } };
      }
      const L1 = [], R1 = [];
      for (let i = lo; i <= hi; i++) (i <= mid ? L1 : R1).push(cells[rowIds(d + 1, i, i)[0]].v);
      F.push(snap({ cap: 'Split [' + L1.concat(R1).join(' ') + '] into **[' + L1.join(' ') + ']** and **[' + R1.join(' ') + ']**.', line: 2, range: { d: d, lo: lo, hi: hi } }));
      sort(lo, mid, d + 1);
      sort(mid + 1, hi, d + 1);
      // merge
      const left = rowIds(d + 1, lo, mid).sort(function (a, b) { return cells[a].i - cells[b].i; });
      const right = rowIds(d + 1, mid + 1, hi).sort(function (a, b) { return cells[a].i - cells[b].i; });
      rowIds(d, lo, hi).forEach(function (k) { cells[k].ghost = true; cells[k].cls = 'ghost'; cells[k].v = ''; });
      left.concat(right).forEach(function (k) { cells[k].cls = 'done'; });
      F.push(snap({ cap: 'Now **merge** [' + left.map(function (k) { return cells[k].v; }).join(' ') + '] and [' + right.map(function (k) { return cells[k].v; }).join(' ') + '] into one sorted row.', line: 5, range: { d: d, lo: lo, hi: hi } }));
      let a = 0, b = 0, out = lo;
      while (a < left.length || b < right.length) {
        let pick, other;
        if (a < left.length && b < right.length) {
          const la = cells[left[a]], rb = cells[right[b]];
          la.cls = 'cur'; rb.cls = 'cur';
          const leftWins = la.v <= rb.v;
          pick = leftWins ? left[a] : right[b];
          other = leftWins ? rb : la;
          const pv = cells[pick].v;
          const id = 'c' + (uid++);
          cells[id] = { d: d, i: out, v: pv, cls: 'cur', from: { d: d + 1, i: cells[pick].i } };
          // remove the ghost at that slot
          Object.keys(cells).forEach(function (k) { const c = cells[k]; if (c.ghost && c.d === d && c.i === out) delete cells[k]; });
          cells[pick].cls = 'dim';
          F.push(snap({ cap: 'Compare **' + la.v + '** and **' + rb.v + '**. ' + pv + ' is smaller → copy ' + pv + '.', line: [7, 8], range: { d: d, lo: lo, hi: hi }, sound: 'swap',
            ask: { q: 'Fronts: ' + la.v + ' and ' + rb.v + '. Which is copied next?', options: [String(la.v), String(rb.v)], answer: leftWins ? 0 : 1 } }));
          cells[id].cls = 'done';
          other.cls = 'done';
          if (leftWins) a++; else b++;
        } else {
          pick = a < left.length ? left[a] : right[b];
          const pv = cells[pick].v;
          const id = 'c' + (uid++);
          cells[id] = { d: d, i: out, v: pv, cls: 'done', from: { d: d + 1, i: cells[pick].i } };
          Object.keys(cells).forEach(function (k) { const c = cells[k]; if (c.ghost && c.d === d && c.i === out) delete cells[k]; });
          cells[pick].cls = 'dim';
          F.push(snap({ cap: 'One half is empty. Copy the rest: **' + pv + '**.', line: [7, 8], range: { d: d, lo: lo, hi: hi } }));
          if (a < left.length) a++; else b++;
        }
        out++;
      }
      // remove the used children
      left.concat(right).forEach(function (k) { delete cells[k]; });
      rowIds(d, lo, hi).forEach(function (k) { cells[k].cls = 'done'; });
      const vals = rowIds(d, lo, hi).sort(function (x, y) { return cells[x].i - cells[y].i; }).map(function (k) { return cells[k].v; });
      F.push(snap({ cap: 'Merged: **[' + vals.join(' ') + ']**.', line: 5, range: { d: d, lo: lo, hi: hi } }));
    }
    sort(0, n - 1, 0);
    F[F.length - 1].cap = 'All merged. **Sorted!** log n levels × n work per level = **O(n log n)** every time.';
    F[F.length - 1].mood = 'happy';
    return F;
  }

  function mergeLab(root) {
    const W = 860, H = 420;
    const L = ST.lab(root, { vb: [W, H], code: MERGE_CODE, codeTitle: 'MERGE SORT', alt: 'Merge sort split and merge tree', minW: 600 });
    const inp = ui.field('NUMBERS (2–10)', '38, 27, 43, 3', { onEnter: run });
    L.controls.appendChild(ui.row(inp.el, ui.button('RUN', run, 'btn-yellow'),
      ui.button('7 NUMBERS', function () { inp.input.value = '38, 27, 43, 3, 9, 82, 10'; run(); }),
      ui.button('8 NUMBERS', function () { inp.input.value = '5, 1, 7, 3, 8, 2, 6, 4'; run(); })));
    L.panel('KEY IDEA', { before: true }).appendChild(h('p', { class: 'panel-note' }, 'Merging is not just joining. Look at the front of each half and copy the smaller value, one at a time.'));
    let n = 4;
    function render(f, i, o) {
      const cell = Math.min(52, Math.floor((W - 80) / (n * 1.35)));
      const G = Math.min(18, cell * 0.4);
      const total = n * cell + (n - 1) * G;
      const x0 = (W - total) / 2 + cell / 2;
      const rowH = Math.min(92, (H - 70) / Math.max(1, f.maxD));
      const X = function (ix, d) {
        let before = 0, row = 0;
        f.cuts.forEach(function (c) { if (c.d < d) { row++; if (c.mid < ix) before++; } });
        return x0 + ix * cell + G * before + G * (n - 1 - row) / 2;
      };
      const Y = function (d) { return 44 + d * rowH; };
      const nodes = [];
      if (f.range) {
        const r = f.range;
        const xa = X(r.lo, r.d) - cell / 2 - 6, xb = X(r.hi, r.d) + cell / 2 + 6;
        nodes.push({ id: 'rng', t: 'box', x: (xa + xb) / 2, y: Y(r.d), w: xb - xa, h: cell + 14, cls: 'yellow' });
      }
      Object.keys(f.cells).forEach(function (k) {
        const c = f.cells[k];
        nodes.push({ id: k, t: 'cell', x: X(c.i, c.d), y: Y(c.d), w: cell, h: cell, label: c.v, cls: c.cls, from: c.from ? { x: X(c.from.i, c.from.d), y: Y(c.from.d) } : null, z: c.from ? 'front' : null });
      });
      for (let d = 0; d <= f.maxD; d++) nodes.push({ id: 'lv' + d, t: 'label', x: 22, y: Y(d), label: 'L' + d, anchor: 'start' });
      L.scene.draw({ nodes: nodes }, { instant: o.instant });
    }
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 10 });
      if (arr.length < 2) arr = [38, 27, 43, 3];
      inp.input.value = arr.join(', ');
      n = arr.length;
      L.player.load(mergeFrames(arr), render);
    }
    run();
    return L;
  }

  // ================================================================ quick sort
  const QUICK_CODE = [
    'void QuickSort(int[] a, int lo, int hi) {',
    '  if (lo >= hi) return;  // 0 or 1 item',
    '  int p = Partition(a, lo, hi);',
    '  QuickSort(a, lo, p - 1);  // left',
    '  QuickSort(a, p + 1, hi);  // right',
    '}',
    'int Partition(int[] a, int lo, int hi) {',
    '  int pivot = a[hi];',
    '  int i = lo - 1;',
    '  for (int j = lo; j < hi; j++)',
    '    if (a[j] < pivot) { i++; Swap(a, i, j); }',
    '  Swap(a, i + 1, hi);  // pivot home',
    '  return i + 1;',
    '}'
  ];

  function quickFrames(arr) {
    const n = arr.length;
    const F = [];
    const slots = arr.map(function (v, k) { return 'q' + k; });
    const vals = {};
    arr.forEach(function (v, k) { vals['q' + k] = v; });
    const final = {};
    const V = function (k) { return vals[slots[k]]; };
    const snap = function (extra) {
      const cls = {};
      Object.keys(final).forEach(function (id) { cls[id] = 'sorted'; });
      const f = Object.assign({ slots: slots.slice(), vals: vals, cls: cls, ptrs: [], range: null }, extra);
      if (extra.mark) Object.keys(extra.mark).forEach(function (id) { f.cls[id] = extra.mark[id]; });
      return f;
    };
    F.push(snap({ cap: 'Quick Sort: pick a **pivot** (the last value), put smaller values on its left and bigger on its right.', line: 0 }));
    function qs(lo, hi) {
      if (lo > hi) return;
      if (lo === hi) {
        final[slots[lo]] = true;
        F.push(snap({ cap: 'Section [' + V(lo) + '] has one item. It is already in place (base case).', line: 1, range: [lo, hi] }));
        return;
      }
      const pivotId = slots[hi];
      const pivot = vals[pivotId];
      let i = lo - 1;
      const mk = function (extra, j) {
        const m = {}; m[pivotId] = 'pivot';
        if (extra.hot) extra.hot.forEach(function (k) { m[slots[k]] = extra.hotCls || 'cur'; });
        for (let k = lo; k <= i; k++) if (!(extra.hot && extra.hot.indexOf(k) >= 0)) m[slots[k]] = 'blue';
        const ptrs = [{ at: i, label: 'i', cls: 'blue' }];
        if (j !== undefined) ptrs.push({ at: j, label: 'j', cls: 'ink' });
        return snap(Object.assign({ range: [lo, hi], mark: m, ptrs: ptrs }, extra));
      };
      F.push(mk({ cap: 'Section ' + lo + '–' + hi + ': pivot = **' + pivot + '** (last item). i starts at ' + (lo - 1) + ' (before the section).', line: [7, 8] }));
      for (let j = lo; j < hi; j++) {
        const vj = V(j);
        F.push(mk({ cap: 'Is **' + vj + '** < pivot ' + pivot + '?', line: [9, 10], hot: [j] }, j));
        if (vj < pivot) {
          i++;
          if (i !== j) {
            const t = slots[i]; slots[i] = slots[j]; slots[j] = t;
            F.push(mk({ cap: 'Yes. i → ' + i + '. Swap **' + V(j) + '** and **' + V(i) + '**. Small values gather on the left.', line: 10, hot: [i, j], hotCls: 'bad', sound: 'swap',
              ask: { q: 'Is ' + vj + ' < ' + pivot + '?', options: ['Yes', 'No'], answer: 0 } }, j));
          } else {
            F.push(mk({ cap: 'Yes. i → ' + i + '. i = j, so the swap changes nothing.', line: 10, hot: [i],
              ask: { q: 'Is ' + vj + ' < ' + pivot + '?', options: ['Yes', 'No'], answer: 0 } }, j));
          }
        } else {
          F.push(mk({ cap: 'No. ' + vj + ' ≥ ' + pivot + '. Leave it. i stays at ' + i + '.', line: 10,
            ask: { q: 'Is ' + vj + ' < ' + pivot + '?', options: ['Yes', 'No'], answer: 1 } }, j));
        }
      }
      const p = i + 1;
      if (p !== hi) { const t = slots[p]; slots[p] = slots[hi]; slots[hi] = t; }
      final[pivotId] = true;
      const left = [], right = [];
      for (let k = lo; k < p; k++) left.push(V(k));
      for (let k = p + 1; k <= hi; k++) right.push(V(k));
      F.push(snap({ cap: 'Swap the pivot into index **' + p + '**. ' + pivot + ' is now in its **final place**. Left: [' + left.join(' ') + '], right: [' + right.join(' ') + '].', line: [11, 12], range: [lo, hi], sound: 'swap',
        ptrs: [{ at: p, label: 'p', cls: 'orange' }],
        ask: { q: 'Where does the pivot ' + pivot + ' go? Click the box it will land on.', pick: slots[p] === pivotId ? (function () { return slots[p]; })() : slots[p], among: slots.slice(lo, hi + 1), answerText: 'index ' + p } }));
      qs(lo, p - 1);
      qs(p + 1, hi);
    }
    // the pick answer must be the box that is at index p BEFORE the swap
    qs(0, n - 1);
    F.push(snap({ cap: 'Every pivot is in place. **Sorted!** Usually O(n log n). Worst case O(n²) when the pivot is always the smallest or largest.', mood: 'happy' }));
    // fix pick answers: a frame's ask refers to the picture BEFORE it, so use the previous frame's slot at p
    for (let k = 1; k < F.length; k++) {
      const a = F[k].ask;
      if (a && a.pick !== undefined && F[k].ptrs[0]) {
        const p = F[k].ptrs[0].at;
        a.pick = F[k - 1].slots[p];
      }
    }
    return F;
  }

  function quickLab(root) {
    const W = 820, H = 280;
    const L = ST.lab(root, { vb: [W, H], code: QUICK_CODE, codeTitle: 'QUICK SORT (LAST ITEM = PIVOT)', alt: 'Quick sort partition animation' });
    const inp = ui.field('NUMBERS (up to 10)', '27, 43, 75, 45, 55', { onEnter: run });
    L.controls.appendChild(ui.row(inp.el, ui.button('RUN', run, 'btn-yellow'),
      ui.button('8 NUMBERS', function () { inp.input.value = '10, 80, 30, 90, 40, 50, 70, 60'; run(); }),
      ui.button('WORST CASE (SORTED)', function () { inp.input.value = '1, 2, 3, 4, 5, 6'; run(); })));
    L.panel('COLORS HERE', { before: true }).appendChild(ui.table(null, [
      [{ v: 'Orange', cls: '' }, 'the pivot'], ['Blue', 'smaller than pivot (left side)'], ['Black', 'final place, never moves again']
    ]));
    function render(f, i, o) {
      const n = f.slots.length;
      const cell = ST.kit.fit(n, W, 64, 40);
      const xs = ST.kit.row(n, W, cell, 10);
      const step = cell + 10;
      const y = 130;
      const nodes = [];
      if (f.range) {
        const xa = xs[f.range[0]] - cell / 2 - 8, xb = xs[f.range[1]] + cell / 2 + 8;
        nodes.push({ id: 'rng', t: 'box', x: (xa + xb) / 2, y: y, w: xb - xa, h: cell + 22, cls: 'yellow', label: '' });
      }
      f.slots.forEach(function (id, k) {
        const out = f.range && (k < f.range[0] || k > f.range[1]) && f.cls[id] !== 'sorted';
        nodes.push({ id: id, t: 'cell', x: xs[k], y: y, w: cell, h: cell, label: f.vals[id], cls: (f.cls[id] || '') + (out ? ' faint' : ''), sub: '[' + k + ']' });
      });
      f.ptrs.forEach(function (p) {
        const px = p.at < 0 ? xs[0] - step : xs[p.at];
        nodes.push({ id: 'p' + p.label, t: 'ptr', x: px, y: y + cell / 2 + 40, label: p.at < 0 && p.label === 'i' ? 'i = -1' : p.label, cls: p.cls });
      });
      L.scene.draw({ nodes: nodes }, { instant: o.instant });
    }
    function run() {
      let arr = U.parseNums(inp.input.value, { max: 10 });
      if (arr.length < 2) arr = [27, 43, 75, 45, 55];
      inp.input.value = arr.join(', ');
      L.player.load(quickFrames(arr), render);
    }
    run();
    return L;
  }

  // ================================================================ lesson
  const lk = ST.lk;
  const RULES = [
    { rule: 'Quick Sort pivot = last item', note: 'Other versions pick the first, the middle, or a random item.' }
  ];
  function lesson() {
    // call stack: list of [id, label, cls], bottom first
    const calls = function (list, cap, extra) {
      const n = [lk.text('csl', 170, 24, 'CALL STACK', 'ink', 13)];
      list.forEach(function (c, k) { n.push({ id: c[0], t: 'cell', x: 170, y: 190 - k * 40, w: 236, h: 34, label: c[1], cls: c[2] || '', fs: 15, from: { x: 170, y: -20 } }); });
      return { nodes: n.concat(extra || []), cap: cap };
    };
    const f3 = 'fact(3) = 3 × fact(2)', f2 = 'fact(2) = 2 × fact(1)';
    const deep = ['fact(3)', 'fact(2)', 'fact(1)', 'fact(0)', 'fact(−1)', 'fact(−2)', 'fact(−3)', 'fact(−4)'];
    const overCaps = ['fact(n) with **no base case**…', '…calls fact(n − 1)…', '…calls again…', '…fact(0)…', '…fact(−1). Never stops…', '…', '…', '**Stack overflow!** Always write the stop rule.'];
    const over = deep.map(function (lbl, k) {
      const n = [lk.text('lim', 170, 12, '— MEMORY LIMIT —', 'red', 12)];
      for (let j = 0; j <= k; j++) n.push({ id: 'o' + j, t: 'cell', x: 170, y: 202 - j * 25, w: 150, h: 21, label: deep[j], fs: 13, cls: k === deep.length - 1 ? 'bad' : (j === k ? 'cur' : ''), from: { x: 170, y: -20 } });
      if (k === deep.length - 1) n.push(lk.tag('so', 370, 110, 'STACK OVERFLOW', 'red'));
      return { nodes: n, cap: overCaps[k] };
    });
    // merge sort: value → [x, y, cls]
    const ms = function (place, cap) {
      return { cap: cap, nodes: Object.keys(place).map(function (v) { const p = place[v]; return { id: 'v' + v, t: 'cell', x: p[0], y: p[1], w: 46, h: 46, label: v, cls: p[2] || '' }; }) };
    };
    const TOP = [162, 214, 266, 318];
    const Q = function (arr, cls, cap, labels) {
      const xs = lk.xs(5, 56);
      const n = lk.cells('q', arr, { w: 56, y: 100, ids: arr.map(function (v) { return 'q' + v; }), cls: function (i, v) { return cls[v] || ''; } });
      if (labels) n.push(lk.text('sm', (xs[0] + xs[1]) / 2, 156, 'SMALLER', 'blue', 13), lk.text('bg', (xs[3] + xs[4]) / 2, 156, 'BIGGER', 'ink', 13));
      return { nodes: n, cap: cap };
    };
    return [
      { title: 'A function that calls itself', frames: [
        calls([['c3', f3]], 'fact(3) needs fact(2)…'),
        calls([['c3', f3], ['c2', f2]], '…which needs fact(1)…'),
        calls([['c3', f3], ['c2', f2], ['c1', 'fact(1) = 1', 'done']], '**Base case**: fact(1) = 1. Stop.'),
        calls([['c3', f3], ['c2', '2 × 1 = 2', 'cur']], 'Return 1. fact(2) = **2**.', [lk.tag('ret', 380, 150, '← 1', 'teal')]),
        calls([['c3', '3 × 2 = 6', 'cur']], 'Return 2. fact(3) = **6**.', [lk.tag('ret', 380, 190, '← 2', 'teal')]),
        calls([], 'The stack **unwinds** back to empty.', [lk.tag('ans', 240, 120, 'fact(3) = 6', 'yellow', 20)])
      ] },
      { title: 'No base case? Overflow', trap: true, frames: over },
      { title: 'Merge Sort: split, then merge', frames: [
        ms({ 38: [162, 40], 27: [214, 40], 43: [266, 40], 3: [318, 40] }, 'Sort [38, 27, 43, 3].'),
        ms({ 38: [120, 110], 27: [172, 110], 43: [308, 110], 3: [360, 110] }, '**Split** in half…'),
        ms({ 38: [70, 180], 27: [170, 180], 43: [310, 180], 3: [410, 180] }, '…until each part has 1 item.'),
        ms({ 27: [120, 110, 'done'], 38: [172, 110, 'done'], 3: [308, 110, 'done'], 43: [360, 110, 'done'] }, '**Merge** pairs back in order.'),
        ms({ 27: [120, 110, 'cur'], 38: [172, 110], 3: [TOP[0], 40, 'done'], 43: [360, 110, 'cur'] }, 'Fronts: 3 < 27 → take **3**.'),
        ms({ 27: [TOP[1], 40, 'done'], 38: [172, 110, 'cur'], 3: [TOP[0], 40, 'done'], 43: [360, 110, 'cur'] }, '27 < 43 → take **27**.'),
        ms({ 27: [TOP[1], 40, 'done'], 38: [TOP[2], 40, 'done'], 3: [TOP[0], 40, 'done'], 43: [360, 110, 'cur'] }, '38 < 43 → take **38**.'),
        ms({ 27: [TOP[1], 40, 'done'], 38: [TOP[2], 40, 'done'], 3: [TOP[0], 40, 'done'], 43: [TOP[3], 40, 'done'] }, 'Sorted. Always **O(n log n)**.')
      ] },
      { title: 'Quick Sort: pivot finds home', frames: [
        Q([7, 2, 9, 4, 5], { 5: 'pivot' }, 'Pivot = the **last** item: 5.'),
        Q([7, 2, 9, 4, 5], { 5: 'pivot', 7: 'cur' }, '7 > 5: leave it.'),
        Q([2, 7, 9, 4, 5], { 5: 'pivot', 2: 'wait' }, '2 < 5 → move it **left**.'),
        Q([2, 7, 9, 4, 5], { 5: 'pivot', 2: 'wait', 9: 'cur' }, '9 > 5: leave it.'),
        Q([2, 4, 9, 7, 5], { 5: 'pivot', 2: 'wait', 4: 'wait' }, '4 < 5 → move it **left**.'),
        Q([2, 4, 5, 7, 9], { 5: 'done', 2: 'wait', 4: 'wait' }, 'Pivot goes between: its **final** spot.'),
        Q([2, 4, 5, 7, 9], { 5: 'done', 2: 'wait', 4: 'wait' }, 'Now repeat on each side.', true)
      ] }
    ];
  }

  ST.topic({
    id: 'recursion', n: 6, color: 'orange', icon: 'recursion',
    title: 'Recursion, Merge & Quick Sort',
    short: 'Functions that call themselves, and two fast divide-and-conquer sorts.',
    blurb: 'Solve a big problem by solving a smaller copy of it.',
    cheat: {
      head: ['', 'Merge Sort', 'Quick Sort'],
      rows: [['Main idea', 'Split & merge', 'Pivot & partition'], ['Best / average', 'O(n log n)', 'O(n log n)'], ['Worst', 'O(n log n)', 'O(n²)'], ['Extra memory', 'More (temp arrays)', 'Less']]
    },
    lesson: lesson(),
    rules: RULES,
    labs: [
      { id: 'callstack', title: 'Call stack', tag: 'TRACE', setup: callStackLab },
      { id: 'merge', title: 'Merge Sort', tag: 'TRACE', setup: mergeLab },
      { id: 'quick', title: 'Quick Sort', tag: 'TRACE', setup: quickLab }
    ]
  });

  ST.recFrames = { merge: mergeFrames, quick: quickFrames, fact: factFrames };
})(window.ST);
