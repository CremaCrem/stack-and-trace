/* World 12 — Greedy algorithms (Week 14) */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;
  const W = 860, H = 380;

  // ================================================================ coin change
  function bestCoins(coins, target) {
    const dp = [0], pick = [0];
    for (let t = 1; t <= target; t++) {
      dp[t] = Infinity;
      coins.forEach(function (c) { if (c <= t && dp[t - c] + 1 < dp[t]) { dp[t] = dp[t - c] + 1; pick[t] = c; } });
    }
    if (dp[target] === Infinity) return null;
    const out = [];
    let t = target;
    while (t > 0) { out.push(pick[t]); t -= pick[t]; }
    return out.sort(function (a, b) { return b - a; });
  }

  function coinFrames(coins, target) {
    const F = [];
    const taken = [];
    let rem = target;
    const sorted = coins.slice().sort(function (a, b) { return b - a; });
    const snap = function (extra) { return Object.assign({ taken: taken.slice(), rem: rem, coins: sorted, best: null }, extra); };
    F.push(snap({ cap: 'Make **' + target + '** with coins ' + sorted.join(', ') + '. Greedy rule: always take the **biggest coin that fits**.' }));
    let guard = 0;
    while (rem > 0 && guard++ < 60) {
      const c = sorted.filter(function (x) { return x <= rem; })[0];
      if (!c) { F.push(snap({ cap: 'No coin fits the remaining ' + rem + '. Greedy is stuck!', mood: 'oops' })); return F; }
      const fits = sorted.filter(function (x) { return x <= rem; });
      rem -= c;
      taken.push(c);
      F.push(snap({ cap: 'Remaining was ' + (rem + c) + '. Biggest coin that fits: **' + c + '**. Take it. Remaining: ' + rem + '.', hot: c, sound: 'swap',
        ask: { q: 'Remaining: ' + (rem + c) + '. Which coin does greedy take?', options: fits.slice(0, 4).map(String), answer: 0 } }));
    }
    const best = bestCoins(coins, target);
    const ok = best && best.length === taken.length;
    F.push(snap({ cap: 'Greedy used **' + taken.length + ' coins** (' + taken.join(' + ') + '). ' + (ok ? 'That is the best possible. Greedy works for these coins.' : 'But the best answer uses only **' + best.length + '** (' + best.join(' + ') + '). Greedy is **not always right**!'), best: best, mood: ok ? 'happy' : 'oops' }));
    return F;
  }

  function coinLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'Greedy coin change' });
    const cIn = ui.field('COINS', '1, 3, 4', { onEnter: run });
    const tIn = ui.field('TARGET', '6', { small: true, onEnter: run });
    L.controls.appendChild(ui.row(cIn.el, tIn.el, ui.button('RUN', run, 'btn-yellow'),
      ui.button('PESO COINS: 1 5 10 20 → 38', function () { cIn.input.value = '1, 5, 10, 20'; tIn.input.value = '38'; run(); }),
      ui.button('LESSON: 1 3 4 → 6', function () { cIn.input.value = '1, 3, 4'; tIn.input.value = '6'; run(); })));
    L.panel('THE GREEDY LOOP').appendChild(ui.table(null, [['1', 'Look at the choices left'], ['2', 'Take the best one now'], ['3', 'Never take it back'], ['4', 'Repeat until done']]));
    function render(f, i, o) {
      const nodes = [];
      const maxC = Math.max.apply(null, f.coins);
      // coin bank on the left
      f.coins.forEach(function (c, k) {
        nodes.push({ id: 'bank' + c, x: 70, y: 60 + k * 64, r: 16 + 12 * c / maxC, label: c, cls: f.hot === c ? 'cur' : 'paper' });
      });
      nodes.push({ id: 'bankL', t: 'label', x: 70, y: 22, label: 'COINS', cls: 'ink' });
      // taken coins
      f.taken.forEach(function (c, k) {
        nodes.push({ id: 't' + k, x: 220 + k * 66, y: 110, r: 16 + 12 * c / maxC, label: c, cls: 'done', from: { x: 70, y: 60 + f.coins.indexOf(c) * 64 } });
      });
      nodes.push({ id: 'handL', t: 'label', x: 190, y: 50, label: 'GREEDY TOOK: ' + (f.taken.length ? f.taken.join(' + ') : '—'), anchor: 'start', cls: 'ink' });
      nodes.push({ id: 'rem', t: 'tag', x: 260, y: 200, label: 'REMAINING: ' + f.rem, cls: f.rem === 0 ? 'teal' : 'yellow', fs: 17 });
      if (f.best) {
        nodes.push({ id: 'bestL', t: 'label', x: 190, y: 260, label: 'BEST POSSIBLE: ' + f.best.join(' + '), anchor: 'start', cls: 'teal' });
        f.best.forEach(function (c, k) { nodes.push({ id: 'b' + k, x: 220 + k * 66, y: 310, r: 16 + 12 * c / maxC, label: c, cls: f.best.length < f.taken.length ? 'cur' : 'done' }); });
      }
      L.scene.draw({ nodes: nodes }, { instant: o.instant });
    }
    function run() {
      let coins = U.parseNums(cIn.input.value, { max: 6 }).filter(function (c) { return c > 0; });
      if (!coins.length) coins = [1, 3, 4];
      coins = coins.filter(function (c, k, a) { return a.indexOf(c) === k; });
      cIn.input.value = coins.join(', ');
      const t = U.clamp(parseInt(tIn.input.value, 10) || 6, 1, 99);
      tIn.input.value = String(t);
      L.player.load(coinFrames(coins, t), render);
    }
    run();
    return L;
  }

  // ================================================================ activity selection
  const ACTS = [
    { n: 'A', s: 1, f: 3 }, { n: 'B', s: 2, f: 5 }, { n: 'C', s: 4, f: 7 },
    { n: 'D', s: 6, f: 8 }, { n: 'E', s: 5, f: 9 }, { n: 'F', s: 8, f: 10 }
  ];

  function actFrames(acts, rule) {
    const F = [];
    const keyf = { finish: function (a) { return a.f; }, start: function (a) { return a.s; }, short: function (a) { return a.f - a.s; } }[rule];
    const order = acts.slice().sort(function (a, b) { return keyf(a) - keyf(b) || a.f - b.f || (a.n < b.n ? -1 : 1); });
    const status = {};
    const chosen = [];
    const snap = function (extra) { return Object.assign({ order: order, status: Object.assign({}, status), chosen: chosen.slice(), last: chosen.length ? Math.max.apply(null, chosen.map(function (a) { return a.f; })) : null }, extra); };
    const ruleName = { finish: 'earliest **finish** time', start: 'earliest **start** time', short: '**shortest** activity' }[rule];
    F.push(snap({ cap: 'One room, many activities. Goal: the **most** activities with no overlap. Rule: ' + ruleName + '.' }));
    F.push(snap({ cap: 'Sort by ' + ruleName.replace(/\*\*/g, '') + ': ' + order.map(function (a) { return a.n; }).join(', ') + '.', sorted: true }));
    order.forEach(function (a) {
      const clash = chosen.filter(function (c) { return a.s < c.f && c.s < a.f; })[0];
      const opts = ['Take it', 'Skip it'];
      if (clash) {
        status[a.n] = 'SKIP';
        F.push(snap({ cap: a.n + ' (' + a.s + '–' + a.f + ') overlaps ' + clash.n + ' (' + clash.s + '–' + clash.f + '). **Skip.**', hot: a.n, ask: { q: a.n + ' runs ' + a.s + '–' + a.f + '. Take or skip?', options: opts, answer: 1 } }));
      } else {
        status[a.n] = 'TAKE';
        chosen.push(a);
        F.push(snap({ cap: a.n + ' (' + a.s + '–' + a.f + ') does not overlap anything chosen. **Take it.**', hot: a.n, sound: 'swap', ask: { q: a.n + ' runs ' + a.s + '–' + a.f + '. Take or skip?', options: opts, answer: 0 } }));
      }
    });
    // best possible = earliest finish result
    const best = (function () { const o = acts.slice().sort(function (a, b) { return a.f - b.f; }); let last = -Infinity, n = 0; o.forEach(function (a) { if (a.s >= last) { n++; last = a.f; } }); return n; })();
    const ok = chosen.length === best;
    F.push(snap({ cap: 'Chosen: **' + chosen.map(function (a) { return a.n; }).join(', ') + '** = ' + chosen.length + ' activities. ' + (ok ? (rule === 'finish' ? 'This is the maximum. Finishing early leaves the most time for the rest.' : 'Lucky — this set happens to work.') : 'The best possible is **' + best + '**. This rule loses activities!'), mood: ok ? 'happy' : 'oops' }));
    return F;
  }

  function actLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'Activity selection timeline' });
    let rule = 'finish', set = 'lesson';
    const SETS = {
      lesson: ACTS,
      trapStart: [{ n: 'X', s: 1, f: 9 }, { n: 'Y', s: 2, f: 4 }, { n: 'Z', s: 5, f: 8 }],
      trapShort: [{ n: 'X', s: 1, f: 5 }, { n: 'Y', s: 4, f: 6 }, { n: 'Z', s: 5, f: 9 }]
    };
    L.controls.appendChild(ui.seg('GREEDY RULE', [{ v: 'finish', label: 'EARLIEST FINISH ✓' }, { v: 'start', label: 'EARLIEST START' }, { v: 'short', label: 'SHORTEST FIRST' }], rule, function (v) { rule = v; run(); }));
    L.controls.appendChild(ui.seg('ACTIVITIES', [{ v: 'lesson', label: 'LESSON (A–F)' }, { v: 'trapStart', label: 'TRAP FOR "START"' }, { v: 'trapShort', label: 'TRAP FOR "SHORTEST"' }], set, function (v) { set = v; run(); }));
    const tBody = L.panel('TRACE TABLE');
    function render(f, i, o) {
      const acts = SETS[set];
      const tMax = Math.max.apply(null, acts.map(function (a) { return a.f; })) + 1;
      const x0 = 90, x1 = W - 40;
      const X = function (t) { return x0 + (x1 - x0) * t / tMax; };
      const rows = f.sorted || i >= 2 ? f.order : acts;
      const rowH = Math.min(46, (H - 90) / rows.length);
      const nodes = [], edges = [];
      for (let t = 0; t <= tMax; t++) nodes.push({ id: 'tick' + t, t: 'label', x: X(t), y: H - 24, label: String(t), fs: 12 });
      rows.forEach(function (a, k) {
        const y = 40 + k * rowH + rowH / 2;
        const st = f.status[a.n];
        const cls = a.n === f.hot ? (st === 'TAKE' ? 'done' : 'bad') : st === 'TAKE' ? 'done' : st === 'SKIP' ? 'dim' : '';
        nodes.push({ id: 'n' + a.n, t: 'label', x: 30, y: y, label: a.n, cls: 'big', fs: 18 });
        nodes.push({ id: 'bar' + a.n, t: 'cell', x: (X(a.s) + X(a.f)) / 2, y: y, w: X(a.f) - X(a.s), h: rowH - 12, label: a.s + '–' + a.f, cls: cls, fs: 14, rx: 4 });
      });
      if (f.last !== null) {
        nodes.push({ id: 'lastTop', t: 'tag', x: X(f.last), y: 20, label: 'LAST FINISH ' + f.last, cls: 'red', fs: 12 });
        nodes.push({ id: 'lastBot', t: 'label', x: X(f.last), y: H - 44, label: '' });
        edges.push({ id: 'lastLine', a: 'lastTop', b: 'lastBot', cls: 'hot dash' });
      }
      L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
      U.clear(tBody);
      tBody.appendChild(ui.table(['Act', 'Start', 'Finish', 'Decision'], f.order.map(function (a) { const st = f.status[a.n] || ''; return [a.n, { v: a.s, cls: 'num' }, { v: a.f, cls: 'num' }, { v: st, cls: st === 'TAKE' ? 'done' : st === 'SKIP' ? 'bad' : '' }]; }), { rowCls: function (r) { return r[0] === f.hot ? 'hot' : ''; } }));
    }
    function run() { L.player.load(actFrames(SETS[set], rule), render); }
    run();
    return L;
  }

  // ================================================================ fractional knapsack
  const ITEMS = [{ n: 'A', v: 60, w: 10 }, { n: 'B', v: 100, w: 20 }, { n: 'C', v: 120, w: 30 }];

  function knapFrames(items, cap, mode) {
    const F = [];
    const order = items.slice().sort(function (a, b) { return b.v / b.w - a.v / a.w; });
    const taken = [];
    let left = cap, total = 0;
    const snap = function (extra) { return Object.assign({ order: order, taken: taken.map(function (t) { return Object.assign({}, t); }), left: left, total: total, capKg: cap }, extra); };
    F.push(snap({ cap: 'Bag capacity: **' + cap + ' kg**. Greedy rule: best **value per kg** first.' }));
    F.push(snap({ cap: 'Ratios: ' + order.map(function (it) { return it.n + ' = ' + it.v + ' ÷ ' + it.w + ' = ' + (it.v / it.w).toFixed(1).replace('.0', ''); }).join(' · ') + '. Sorted: ' + order.map(function (i) { return i.n; }).join(', ') + '.', showRatio: true }));
    order.forEach(function (it) {
      if (left <= 0) return;
      if (it.w <= left) {
        taken.push({ n: it.n, kg: it.w, val: it.v, frac: '100%' });
        left -= it.w; total += it.v;
        F.push(snap({ cap: 'Take **all of ' + it.n + '** (' + it.w + ' kg, +' + it.v + '). Space left: ' + left + ' kg.', hot: it.n, sound: 'swap', showRatio: true,
          ask: { q: it.n + ' weighs ' + it.w + ' kg. Space left: ' + (left + it.w) + ' kg. What do we take?', options: ['All of ' + it.n, 'Part of ' + it.n, 'Skip ' + it.n], answer: 0 } }));
      } else if (mode === 'frac') {
        const val = it.v * left / it.w;
        taken.push({ n: it.n, kg: left, val: val, frac: left + '/' + it.w });
        F.push(snap({ cap: 'Only ' + left + ' kg left. Take **' + left + ' of ' + it.w + ' kg** of ' + it.n + ': ' + (it.v / it.w) + ' × ' + left + ' = +' + val + '.', hot: it.n, sound: 'swap', showRatio: true,
          ask: { q: it.n + ' weighs ' + it.w + ' kg. Space left: ' + left + ' kg. What do we take?', options: ['All of ' + it.n, 'Part of ' + it.n, 'Skip ' + it.n], answer: 1 } }));
        total += val; left = 0;
        F[F.length - 1].total = total; F[F.length - 1].left = 0;
      } else {
        F.push(snap({ cap: it.n + ' (' + it.w + ' kg) does not fit in ' + left + ' kg, and 0/1 means **all or nothing**. Skip.', hot: it.n, showRatio: true, mood: 'oops',
          ask: { q: it.n + ' weighs ' + it.w + ' kg. Space left: ' + left + ' kg. 0/1 rules. What do we take?', options: ['All of ' + it.n, 'Part of ' + it.n, 'Skip ' + it.n], answer: 2 } }));
      }
    });
    let note = '';
    if (mode === '01') {
      // brute force best
      let best = 0, bestSet = [];
      for (let m = 0; m < (1 << items.length); m++) {
        let wv = 0, vv = 0; const s = [];
        items.forEach(function (it, k) { if (m & (1 << k)) { wv += it.w; vv += it.v; s.push(it.n); } });
        if (wv <= cap && vv > best) { best = vv; bestSet = s; }
      }
      note = best > total ? ' The best 0/1 choice is **' + bestSet.join(' + ') + ' = ' + best + '**. Greedy is not optimal for 0/1!' : ' That is optimal here.';
    } else note = ' For the fractional version, greedy is **always optimal**.';
    F.push(snap({ cap: 'Total value: **' + (Math.round(total * 100) / 100) + '**, using ' + (cap - left) + ' of ' + cap + ' kg.' + note, showRatio: true, mood: mode === '01' && note.indexOf('not optimal') >= 0 ? 'oops' : 'happy' }));
    return F;
  }

  function knapLab(root) {
    const L = ST.lab(root, { vb: [W, H], alt: 'Knapsack bag being filled' });
    let mode = 'frac';
    const capIn = ui.field('CAPACITY (kg)', '50', { small: true, onEnter: run });
    L.controls.appendChild(ui.seg('VERSION', [{ v: 'frac', label: 'FRACTIONAL (split OK)' }, { v: '01', label: '0/1 (all or nothing)' }], mode, function (v) { mode = v; run(); }));
    L.controls.appendChild(ui.row(capIn.el, ui.button('RUN', run, 'btn-yellow')));
    const tBody = L.panel('ITEMS');
    function render(f, i, o) {
      const nodes = [];
      const bx0 = 80, bx1 = W - 80, by = 270;
      const kg = function (k) { return (bx1 - bx0) * k / f.capKg; };
      nodes.push({ id: 'bag', t: 'box', x: (bx0 + bx1) / 2, y: by, w: bx1 - bx0 + 8, h: 74, cls: 'white', label: '' });
      nodes.push({ id: 'bagL', t: 'label', x: bx0, y: by - 56, label: 'BAG: ' + (f.capKg - f.left) + ' / ' + f.capKg + ' kg', anchor: 'start', cls: 'ink' });
      nodes.push({ id: 'valL', t: 'label', x: bx1, y: by - 56, label: 'VALUE: ' + Math.round(f.total * 100) / 100, anchor: 'end', cls: 'pix', fs: 18 });
      let x = bx0;
      const colors = { A: 's-yellow', B: 's-teal', C: 's-sky' };
      f.taken.forEach(function (t) {
        const w = kg(t.kg);
        nodes.push({ id: 'in' + t.n, t: 'box', x: x + w / 2, y: by, w: w, h: 62, cls: colors[t.n] || 's-orange', label: t.n + ' · ' + t.kg + ' kg' + (t.frac !== '100%' ? ' (' + t.frac + ')' : ''), from: { x: 200, y: 90 } });
        x += w;
      });
      f.order.forEach(function (it, k) {
        const tk = f.taken.filter(function (t) { return t.n === it.n; })[0];
        const y = 80;
        const xx = 150 + k * 230;
        const cls = it.n === f.hot ? 'cur' : tk ? 'done' : '';
        nodes.push({ id: 'item' + it.n, t: 'cell', x: xx, y: y, w: 170, h: 70, label: it.n + ' · ' + it.w + ' kg · ' + it.v, cls: cls, fs: 16, sub: f.showRatio ? 'ratio ' + (it.v / it.w).toFixed(1).replace('.0', '') + ' per kg' : undefined });
      });
      L.scene.draw({ nodes: nodes }, { instant: o.instant });
      U.clear(tBody);
      tBody.appendChild(ui.table(['Item', 'Value', 'kg', 'Ratio', 'Taken'], f.order.map(function (it) {
        const tk = f.taken.filter(function (t) { return t.n === it.n; })[0];
        return [it.n, { v: it.v, cls: 'num' }, { v: it.w, cls: 'num' }, { v: f.showRatio ? (it.v / it.w).toFixed(1).replace('.0', '') : '?', cls: 'num' }, { v: tk ? tk.frac : '—', cls: tk ? 'done' : '' }];
      }), { rowCls: function (r) { return r[0] === f.hot ? 'hot' : ''; } }));
    }
    function run() {
      const c = U.clamp(parseInt(capIn.input.value, 10) || 50, 10, 60);
      capIn.input.value = String(c);
      L.player.load(knapFrames(ITEMS, c, mode), render);
    }
    run();
    return L;
  }

  // ================================================================ Huffman
  function huffFrames(freqs) {
    const F = [];
    let uid = 0;
    let pool = freqs.map(function (p) { return { id: 'L' + p.c, ch: p.c, f: p.f, left: null, right: null, order: uid++ }; });
    const sortPool = function () { pool.sort(function (a, b) { return a.f - b.f || a.order - b.order; }); };
    sortPool();
    const snap = function (extra) { return Object.assign({ pool: pool.slice(), hotIds: [], codes: null, pathIds: null }, extra); };
    F.push(snap({ cap: 'Huffman: frequent characters get **short** codes. Put every character in a pool, sorted by frequency.' }));
    while (pool.length > 1) {
      const a = pool[0], b = pool[1];
      F.push(snap({ cap: 'Take the **two smallest**: ' + (a.ch || a.f) + ' (' + a.f + ') and ' + (b.ch || b.f) + ' (' + b.f + ').', hotIds: [a.id, b.id],
        ask: { q: 'Which two nodes are combined next? Click the smallest one.', pick: a.id, among: pool.map(function (n) { return n.id; }), answerText: (a.ch || a.f) + ' (' + a.f + ')' } }));
      pool = pool.slice(2);
      const n = { id: 'N' + (uid), f: a.f + b.f, left: a, right: b, order: uid++ };
      pool.push(n);
      sortPool();
      F.push(snap({ cap: 'Combine them: ' + a.f + ' + ' + b.f + ' = **' + n.f + '**. Put the new node back in the pool.', hotIds: [n.id], sound: 'swap' }));
    }
    const rootN = pool[0];
    const codes = [];
    (function walk(n, code) {
      if (!n.left) { codes.push({ ch: n.ch, f: n.f, code: code || '0', id: n.id }); return; }
      walk(n.left, code + '0'); walk(n.right, code + '1');
    })(rootN, '');
    codes.sort(function (a, b) { return a.ch < b.ch ? -1 : 1; });
    F.push(snap({ cap: 'One node left: the **root** (' + rootN.f + ' = all characters). Now read the codes: **left = 0, right = 1**.', codes: [] }));
    codes.forEach(function (c, k) {
      const pathIds = [];
      (function find(n, trail) { if (n.id === c.id) { trail.forEach(function (x) { pathIds.push(x); }); pathIds.push(n.id); return true; } if (!n.left) return false; return find(n.left, trail.concat(n.id)) || find(n.right, trail.concat(n.id)); })(rootN, []);
      F.push(snap({ cap: c.ch + ': root → ' + c.code.split('').map(function (b) { return b === '0' ? 'left' : 'right'; }).join(' → ') + ' = **' + c.code + '**.', codes: codes.slice(0, k + 1), pathIds: pathIds, hotIds: [c.id] }));
    });
    const bits = codes.reduce(function (s, c) { return s + c.f * c.code.length; }, 0);
    const total = codes.reduce(function (s, c) { return s + c.f; }, 0);
    const fixed = Math.max(1, Math.ceil(Math.log2(codes.length))) * total;
    F.push(snap({ cap: 'Total: **' + bits + ' bits**, instead of ' + fixed + ' with fixed ' + Math.ceil(Math.log2(codes.length)) + '-bit codes (' + Math.round(100 * (1 - bits / fixed)) + '% smaller). No code is the start of another.', codes: codes, mood: 'happy' }));
    return F;
  }

  function huffLab(root) {
    const L = ST.lab(root, { vb: [W, 420], alt: 'Huffman tree being built', minW: 620 });
    const fIn = ui.field('CHAR:FREQUENCY', 'A:5 B:9 C:12 D:13 E:16 F:45', { onEnter: run });
    fIn.input.classList.add('inp-wide');
    L.controls.appendChild(ui.row(fIn.el, ui.button('BUILD', run, 'btn-yellow'), ui.button('BANANA', function () { fIn.input.value = 'B:1 A:3 N:2'; run(); })));
    const cBody = L.panel('CODE TABLE');
    L.panel('POOL').appendChild(h('p', { class: 'panel-note' }, 'The pool is kept sorted, so the two smallest are always at the front. A min-heap does this job.'));
    function render(f, i, o) {
      // layout the forest: leaves get slots in pool order, leaves at the bottom
      const nodes = [], edges = [];
      let slot = 0;
      const leaves = [];
      const place = {};
      const heightOf = function (n) { return n.left ? 1 + Math.max(heightOf(n.left), heightOf(n.right)) : 0; };
      let maxH = 0;
      f.pool.forEach(function (t) { maxH = Math.max(maxH, heightOf(t)); });
      const totalLeaves = (function () { let c = 0; f.pool.forEach(function (t) { (function cnt(n) { if (!n.left) c++; else { cnt(n.left); cnt(n.right); } })(t); }); return c; })();
      const gapX = Math.min(110, (W - 80) / Math.max(1, totalLeaves + f.pool.length * 0.3));
      const gapY = Math.min(70, 300 / Math.max(1, maxH));
      let x = 0;
      f.pool.forEach(function (t, ti) {
        (function lay(n) {
          if (!n.left) { place[n.id] = { x: x, h: 0 }; x += gapX; leaves.push(n); return; }
          lay(n.left); lay(n.right);
          place[n.id] = { x: (place[n.left.id].x + place[n.right.id].x) / 2, h: heightOf(n) };
        })(t);
        x += gapX * 0.3;
        void ti;
      });
      const span = x - gapX * 1.3;
      const off = (W - span) / 2;
      const yOf = function (hh) { return 360 - hh * gapY; };
      const hot = f.hotIds || [];
      const path = f.pathIds || [];
      f.pool.forEach(function (t) {
        (function draw(n) {
          const p = place[n.id];
          const leaf = !n.left;
          nodes.push({ id: n.id, x: off + p.x, y: yOf(p.h), r: leaf ? 22 : 19, label: leaf ? n.ch : n.f, sub: leaf ? String(n.f) : undefined, cls: hot.indexOf(n.id) >= 0 ? 'cur' : (path.indexOf(n.id) >= 0 ? 'wait' : (leaf ? 'done' : 'paper')) });
          if (!leaf) {
            [['left', '0'], ['right', '1']].forEach(function (s) {
              const c = n[s[0]];
              const onPath = path.indexOf(n.id) >= 0 && path.indexOf(c.id) >= 0;
              edges.push({ id: n.id + '-' + c.id, a: n.id, b: c.id, w: s[1], wfs: 13, cls: onPath ? 'path' : '' });
              draw(c);
            });
          }
        })(t);
      });
      L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
      U.clear(cBody);
      if (f.codes && f.codes.length) {
        cBody.appendChild(ui.table(['Char', 'Freq', 'Code', 'Bits'], f.codes.map(function (c) { return [c.ch, { v: c.f, cls: 'num' }, { v: c.code, cls: 'num' }, { v: c.f * c.code.length, cls: 'num' }]; })));
      } else cBody.appendChild(h('p', { class: 'panel-note' }, 'Codes appear when the tree is finished.'));
    }
    function run() {
      const pairs = [];
      String(fIn.input.value).split(/[\s,]+/).forEach(function (tok) {
        const m = tok.match(/^([^:\s]):(\d+)$/);
        if (m && pairs.length < 8 && !pairs.some(function (p) { return p.c === m[1]; })) pairs.push({ c: m[1], f: Math.max(1, Number(m[2])) });
      });
      if (pairs.length < 2) { fIn.input.value = 'A:5 B:9 C:12 D:13 E:16 F:45'; return run(); }
      L.player.load(huffFrames(pairs), render);
    }
    run();
    return L;
  }

  ST.topic({
    id: 'greedy', n: 12, week: 'Week 14', color: 'red', icon: 'greedy',
    title: 'Greedy Algorithms',
    short: 'Take the best choice now and never go back. Sometimes it works.',
    blurb: 'One best step at a time. Fast and simple — but not always right.',
    remember: [
      { big: 'BEST NOW, NO UNDO', text: 'A greedy algorithm takes the best choice right now and never takes it back.' },
      { big: 'LOCAL ≠ GLOBAL', text: 'Best now is not always best overall. Coins 1, 3, 4 for 6 prove it.' },
      { big: 'SAME LOOP', text: 'Huffman, activities, knapsack: same loop, different "best".' }
    ],
    cheat: {
      head: ['Problem', 'Greedy choice', 'Optimal?'],
      rows: [['Huffman coding', 'Join the 2 least frequent', 'Yes'], ['Activity selection', 'Earliest finish', 'Yes'], ['Fractional knapsack', 'Best value per kg', 'Yes'], ['0/1 knapsack', 'Best value per kg', 'No'], ['Coin change', 'Biggest coin', 'Depends on coins']]
    },
    mistake: 'Greedy is not a shortcut for every problem. Always check: can a "best right now" choice block a better answer later?',
    labs: [
      { id: 'coins', title: 'Coin change', tag: 'TRACE', setup: coinLab },
      { id: 'activities', title: 'Activity selection', tag: 'TRACE', setup: actLab },
      { id: 'knapsack', title: 'Knapsack', tag: 'TRACE', setup: knapLab },
      { id: 'huffman', title: 'Huffman coding', tag: 'TRACE', setup: huffLab }
    ]
  });

  ST.greedyFrames = { coin: coinFrames, act: actFrames, knap: knapFrames, huff: huffFrames };
})(window.ST);
