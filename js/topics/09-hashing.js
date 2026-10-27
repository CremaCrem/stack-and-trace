/* World 9 — Hash tables, collisions, maps and sets */
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util, ui = ST.ui;

  function codes(key) { return String(key).split('').map(function (c) { return c.charCodeAt(0); }); }
  function hsum(key) { return codes(key).reduce(function (a, b) { return a + b; }, 0); }

  // ---------------------------------------------------------------- table drawing
  function tableNodes(size, opts) {
    opts = opts || {};
    const nodes = [];
    const rowH = Math.min(56, (opts.H - 60) / size);
    const y0 = opts.y0 || 44;
    const ys = [];
    for (let k = 0; k < size; k++) {
      const y = y0 + k * rowH + rowH / 2;
      ys.push(y);
      nodes.push({ id: 'ix' + k, t: 'cell', x: opts.x || 70, y: y, w: 52, h: rowH - 6, label: k, cls: (opts.hot === k ? 'cur' : 'paper'), fs: 18 });
    }
    return { nodes: nodes, ys: ys, rowH: rowH };
  }

  // ---------------------------------------------------------------- Lab 1: hash function
  function fnLab(root) {
    const W = 860, H = 360;
    const L = ST.lab(root, { vb: [W, H], alt: 'Turning a key into an index' });
    let size = 5;
    const kIn = ui.field('KEY', 'Alice', { onEnter: run });
    L.controls.appendChild(ui.row(kIn.el, ui.button('HASH IT', run, 'btn-yellow'), ui.button('TRY "Celia"', function () { kIn.input.value = 'Celia'; run(); })));
    L.controls.appendChild(ui.seg('TABLE SIZE', [5, 7, 10, 11].map(function (n) { return { v: n, label: String(n) }; }), size, function (v) { size = v; run(); }));
    L.panel('THE HASH FUNCTION').appendChild(h('div', { class: 'formula' }, 'index = (sum of char codes) % size'));
    const good = L.panel('A GOOD HASH FUNCTION');
    good.appendChild(ui.table(null, [['Same key → same index', 'always'], ['Fast', 'a few steps'], ['Spreads keys', 'fewer collisions'], ['Fits the table', '0 to size − 1']]));
    let key = 'Alice';
    function frames() {
      const cs = codes(key);
      const F = [];
      F.push({ cap: 'Key: **"' + key + '"**. A hash function turns it into a number.', upto: -1 });
      let run = 0;
      cs.forEach(function (c, k) {
        run += c;
        F.push({ cap: '"' + key[k] + '" has code **' + c + '**. Running sum: ' + run + '.', upto: k, sum: run });
      });
      const total = run;
      F.push({ cap: 'Hash value = **' + total + '**.', upto: cs.length - 1, sum: total, showSum: true });
      const idx = total % size;
      const opts = [idx, (idx + 1) % size, (idx + size - 1) % size].filter(function (v, i, a) { return a.indexOf(v) === i; });
      opts.sort(function (a, b) { return a - b; });
      F.push({ cap: total + ' % ' + size + ' = **' + idx + '**. Store "' + key + '" in bucket ' + idx + '.', upto: cs.length - 1, sum: total, showSum: true, idx: idx,
        ask: { q: total + ' % ' + size + ' = ?', options: opts.map(String), answer: opts.indexOf(idx) }, mood: 'happy' });
      return F;
    }
    function render(f, i, o) {
      const cs = codes(key);
      const nodes = [], edges = [];
      const cw = Math.min(58, 420 / Math.max(1, cs.length));
      const xs = ST.kit.row(cs.length, 560, cw, 6);
      cs.forEach(function (c, k) {
        nodes.push({ id: 'ch' + k, t: 'cell', x: xs[k], y: 70, w: cw, h: cw, label: key[k], cls: k === f.upto ? 'cur' : (k < f.upto ? 'done' : '') });
        if (k <= f.upto) nodes.push({ id: 'cd' + k, t: 'label', x: xs[k], y: 70 + cw / 2 + 18, label: String(c), cls: 'pix', fs: 15 });
      });
      if (f.sum !== undefined) nodes.push({ id: 'sum', t: 'cell', x: 280, y: 210, w: 200, h: 54, label: (f.showSum ? 'hash = ' : 'sum = ') + f.sum, cls: f.showSum ? 'blue' : '', fs: 20 });
      if (f.idx !== undefined) {
        nodes.push({ id: 'mod', t: 'tag', x: 280, y: 290, label: f.sum + ' % ' + size + ' = ' + f.idx, cls: 'yellow', fs: 17 });
        edges.push({ id: 'toB', a: 'mod', b: 'b' + f.idx, dir: true, cls: 'hot' });
      }
      const t = tableNodes(size, { H: H, x: 650, hot: f.idx });
      t.nodes.forEach(function (n) { nodes.push(n); });
      t.ys.forEach(function (y, k) { nodes.push({ id: 'b' + k, t: 'cell', x: 770, y: y, w: 150, h: t.rowH - 6, label: f.idx === k ? key : '', cls: f.idx === k ? 'done' : '', fs: 15 }); });
      nodes.push({ id: 'tl', t: 'label', x: 710, y: 24, label: 'TABLE (size ' + size + ')', cls: 'ink' });
      L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
    }
    function run() {
      key = (kIn.input.value.trim() || 'Alice').slice(0, 10);
      kIn.input.value = key;
      L.player.load(frames(), render);
    }
    run();
    return L;
  }

  // ---------------------------------------------------------------- Lab 2: put & get with collisions
  function collideLab(root) {
    const W = 900, H = 400;
    const L = ST.lab(root, { vb: [W, H], alt: 'Hash table with collisions', minW: 640 });
    let size = 5, mode = 'chain';
    const kIn = ui.field('PUT THESE KEYS', 'Maria, Pedro, Alice, John, Celia, Juan', { onEnter: run });
    kIn.input.classList.add('inp-wide');
    const gIn = ui.field('THEN GET', 'Juan', { small: true, onEnter: run });
    L.controls.appendChild(ui.seg('COLLISION FIX', [{ v: 'chain', label: 'CHAINING' }, { v: 'probe', label: 'LINEAR PROBING' }], mode, function (v) { mode = v; run(); }));
    L.controls.appendChild(ui.seg('SIZE', [5, 7, 10].map(function (n) { return { v: n, label: String(n) }; }), size, function (v) { size = v; run(); }));
    L.controls.appendChild(ui.row(kIn.el, gIn.el, ui.button('RUN', run, 'btn-yellow')));
    const hashBody = L.panel('KEY → INDEX');
    const cmp = L.panel('CHAINING VS PROBING');
    cmp.appendChild(ui.table(['', 'Chaining', 'Probing'], [['Where', 'List in the bucket', 'Another empty slot'], ['On collision', 'Add to the chain', 'Try the next index'], ['Table full?', 'Chains grow', 'Must resize']]));
    let keys = [];
    function frames() {
      const F = [];
      const table = U.range(size).map(function () { return []; }); // chain: list of keys; probe: [key] or []
      const snap = function (extra) { return Object.assign({ table: table.map(function (b) { return b.slice(); }), hot: null, cls: {}, probe: [] }, extra); };
      F.push(snap({ cap: 'An empty table with ' + size + ' buckets. Collision fix: **' + (mode === 'chain' ? 'chaining' : 'linear probing') + '**.' }));
      keys.forEach(function (key) {
        const hv = hsum(key), idx = hv % size;
        const opts = U.range(size).map(String);
        if (mode === 'chain') {
          const busy = table[idx].length;
          if (table[idx].indexOf(key) >= 0) { F.push(snap({ cap: '"' + key + '" is already in bucket ' + idx + '. Skip.', hot: idx })); return; }
          table[idx].push(key);
          const c = {}; c[key] = 'new';
          F.push(snap({ cap: 'put("' + key + '"): ' + hv + ' % ' + size + ' = **' + idx + '**. ' + (busy ? '**Collision!** Bucket ' + idx + ' is busy, so add "' + key + '" to its **chain**.' : 'Bucket ' + idx + ' is empty. Store it.'),
            hot: idx, cls: c, mood: busy ? 'oops' : null, ask: { q: '"' + key + '" → ' + hv + ' % ' + size + '. Which bucket?', options: opts, answer: idx } }));
        } else {
          let k = idx, tries = 0;
          const probe = [];
          if (table.some(function (b) { return b[0] === key; })) { F.push(snap({ cap: '"' + key + '" is already stored. Skip.' })); return; }
          while (table[k].length && tries < size) {
            probe.push(k);
            F.push(snap({ cap: 'put("' + key + '"): index ' + k + ' is **occupied** by "' + table[k][0] + '". Try ' + ((k + 1) % size) + (k + 1 === size ? ' (wrap around to 0)' : '') + '.', hot: k, probe: probe.slice(), mood: 'oops',
              ask: tries === 0 ? { q: '"' + key + '" → ' + hv + ' % ' + size + '. Which bucket does it try first?', options: opts, answer: idx } : null }));
            k = (k + 1) % size; tries++;
          }
          if (tries >= size) { F.push(snap({ cap: 'Every slot is full! The table must **resize**.', mood: 'oops' })); return; }
          table[k] = [key];
          const c = {}; c[key] = 'new';
          F.push(snap({ cap: (tries ? 'Index ' + k + ' is free. Store "' + key + '" there.' : 'put("' + key + '"): ' + hv + ' % ' + size + ' = **' + idx + '**. Empty. Store it.'), hot: k, cls: c, probe: probe.slice(),
            ask: tries === 0 ? { q: '"' + key + '" → ' + hv + ' % ' + size + '. Which bucket?', options: opts, answer: idx } : null }));
        }
      });
      const g = gIn.input.value.trim();
      if (g) {
        const hv = hsum(g), idx = hv % size;
        F.push(snap({ cap: 'get("' + g + '"): hash ' + hv + ' % ' + size + ' = **' + idx + '**. Jump straight to bucket ' + idx + '.', hot: idx }));
        if (mode === 'chain') {
          const chain = table[idx];
          let found = false;
          for (let k = 0; k < chain.length; k++) {
            const c = {}; c[chain[k]] = chain[k] === g ? 'done' : 'cur';
            F.push(snap({ cap: 'Check "' + chain[k] + '"… ' + (chain[k] === g ? '**match! Found.** Checks: ' + (k + 1) + '.' : 'not it.'), hot: idx, cls: c, mood: chain[k] === g ? 'happy' : null }));
            if (chain[k] === g) { found = true; break; }
          }
          if (!found) F.push(snap({ cap: 'End of the chain. "' + g + '" is **not in the table**.', hot: idx, mood: 'oops' }));
        } else {
          let k = idx, tries = 0, found = false;
          while (table[k].length && tries < size) {
            const c = {}; c[table[k][0]] = table[k][0] === g ? 'done' : 'cur';
            F.push(snap({ cap: 'Index ' + k + ': "' + table[k][0] + '" — ' + (table[k][0] === g ? '**match! Found.**' : 'not it. Follow the probe path to ' + ((k + 1) % size) + '.'), hot: k, cls: c, mood: table[k][0] === g ? 'happy' : null }));
            if (table[k][0] === g) { found = true; break; }
            k = (k + 1) % size; tries++;
          }
          if (!found) F.push(snap({ cap: (tries < size ? 'Index ' + k + ' is empty, so the search stops. ' : '') + '"' + g + '" is **not in the table**.', hot: k, mood: 'oops' }));
        }
      }
      return F;
    }
    function render(f, i, o) {
      const t = tableNodes(size, { H: H, x: 60 });
      const nodes = t.nodes.slice();
      const edges = [];
      if (f.hot !== null) nodes[f.hot] = Object.assign({}, nodes[f.hot], { cls: 'cur' });
      f.table.forEach(function (bucket, k) {
        const y = t.ys[k];
        if (mode === 'chain') {
          if (!bucket.length) nodes.push({ id: 'nul' + k, t: 'label', x: 140, y: y, label: 'null', anchor: 'start', fs: 13 });
          bucket.forEach(function (key, j) {
            nodes.push({ id: 'k-' + key, t: 'cell', x: 175 + j * 150, y: y, w: 118, h: t.rowH - 10, label: key, cls: f.cls[key] || '', fs: 15, from: f.cls[key] === 'new' ? { x: 175 + j * 150, y: -30 } : null });
            edges.push({ id: 'ce' + k + '-' + j, a: j === 0 ? 'ix' + k : 'k-' + bucket[j - 1], b: 'k-' + key, dir: true });
          });
        } else {
          const key = bucket[0];
          nodes.push({ id: 'slot' + k, t: 'cell', x: 190, y: y, w: 150, h: t.rowH - 10, label: '', cls: f.probe.indexOf(k) >= 0 ? 'bad' : 'ghost' });
          if (key) nodes.push({ id: 'k-' + key, t: 'cell', x: 190, y: y, w: 150, h: t.rowH - 10, label: key, cls: f.probe.indexOf(k) >= 0 ? 'bad' : (f.cls[key] || ''), fs: 15, from: f.cls[key] === 'new' ? { x: 190, y: -30 } : null });
        }
      });
      L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
      U.clear(hashBody);
      hashBody.appendChild(ui.table(['Key', 'Sum', '% ' + size], keys.map(function (k) { return [k, hsum(k), hsum(k) % size]; })));
    }
    function run() {
      keys = U.parseWords(kIn.input.value, 9).map(function (k) { return k.slice(0, 9); });
      if (!keys.length) keys = ['Maria', 'Pedro', 'Alice'];
      L.player.load(frames(), render);
    }
    run();
    return L;
  }

  // ---------------------------------------------------------------- Lab 3: map vs set
  function mapSetLab(root) {
    const W = 860, H = 340;
    const L = ST.lab(root, { vb: [W, H], alt: 'Map and set' });
    let kind = 'map';
    const DEF = {
      map: 'put Student01 Jeremy, put Student02 Maria, put Student03 John, get Student02, put Student02 Ana, containsKey Student04, remove Student03',
      set: 'add Apple, add Banana, add Orange, add Apple, contains Banana, remove Orange, add Mango'
    };
    const ops = ui.field('OPERATIONS', DEF.map, { onEnter: run });
    ops.input.classList.add('inp-wide');
    L.controls.appendChild(ui.seg('STRUCTURE', [{ v: 'map', label: 'MAP (HashMap)' }, { v: 'set', label: 'SET (HashSet)' }], kind, function (v) { kind = v; ops.input.value = DEF[v]; run(); }));
    L.controls.appendChild(ui.row(ops.el, ui.button('RUN', run, 'btn-yellow')));
    const sizeBody = L.panel('SIZE');
    L.panel('MAP VS SET').appendChild(ui.table(['', 'Map', 'Set'], [['Stores', 'key → value', 'values only'], ['Duplicates', 'keys unique', 'none'], ['Ask', 'value for key?', 'is it there?'], ['Java', 'HashMap<K,V>', 'HashSet<E>']]));
    const SIZE = 5;
    function frames() {
      const F = [];
      const table = U.range(SIZE).map(function () { return []; }); // [{k, v}]
      const snap = function (extra) { return Object.assign({ table: table.map(function (b) { return b.map(function (e) { return Object.assign({}, e); }); }), hot: null, cls: {} }, extra); };
      F.push(snap({ cap: kind === 'map' ? 'A **map** stores **key → value** pairs. Only the key is hashed.' : 'A **set** stores **unique values**. The value itself is hashed.' }));
      String(ops.input.value).split(',').forEach(function (raw) {
        const p = raw.trim().split(/\s+/);
        const opRaw = p[0] || '';
        const op = opRaw.toLowerCase();
        const key = p[1];
        if (!key) return;
        const idx = hsum(key) % SIZE;
        const bucket = table[idx];
        const at = bucket.map(function (e) { return e.k; }).indexOf(key);
        const c = {};
        if (op === 'put' && kind === 'map') {
          const val = p[2] || '?';
          if (at >= 0) {
            const old = bucket[at].v;
            bucket[at].v = val; c[key] = 'cur';
            F.push(snap({ cap: 'put(' + key + ', ' + val + '): the key already exists. **Replace** "' + old + '" with "' + val + '". One key, one value.', hot: idx, cls: c, sound: 'swap',
              ask: { q: 'put(' + key + ', ' + val + ') but ' + key + ' already maps to ' + old + '. What happens?', options: ['The value is replaced', 'A second ' + key + ' is added', 'Nothing happens'], answer: 0 } }));
          } else {
            bucket.push({ k: key, v: val }); c[key] = 'new';
            F.push(snap({ cap: 'put(' + key + ', ' + val + '): hash(' + key + ') → bucket **' + idx + '**. Store the pair.', hot: idx, cls: c }));
          }
        } else if (op === 'add' && kind === 'set') {
          if (at >= 0) {
            c[key] = 'bad';
            F.push(snap({ cap: 'add(' + key + '): hash → bucket ' + idx + '. **' + key + ' is already there.** Rejected. returns false.', hot: idx, cls: c, mood: 'oops',
              ask: { q: 'add(' + key + ') again. What happens?', options: ['Rejected (returns false)', 'A second ' + key + ' is stored'], answer: 0 } }));
          } else {
            bucket.push({ k: key }); c[key] = 'new';
            F.push(snap({ cap: 'add(' + key + '): hash → bucket **' + idx + '**. New value. returns true.', hot: idx, cls: c }));
          }
        } else if (op === 'get') {
          if (at >= 0) c[key] = 'done';
          F.push(snap({ cap: 'get(' + key + '): hash → bucket ' + idx + ' → ' + (at >= 0 ? '**' + bucket[at].v + '**.' : '**null** (no such key).'), hot: idx, cls: c, mood: at >= 0 ? null : 'oops' }));
        } else if (op === 'containskey' || op === 'contains') {
          if (at >= 0) c[key] = 'done';
          F.push(snap({ cap: opRaw + '(' + key + '): bucket ' + idx + ' → **' + (at >= 0 ? 'true' : 'false') + '**. No full scan needed.', hot: idx, cls: c }));
        } else if (op === 'remove') {
          if (at >= 0) {
            c[key] = 'bad';
            F.push(snap({ cap: 'remove(' + key + '): found in bucket ' + idx + '. Delete it' + (kind === 'map' ? ' with its value.' : '.'), hot: idx, cls: c }));
            bucket.splice(at, 1);
            F.push(snap({ cap: key + ' is gone.', hot: idx }));
          } else F.push(snap({ cap: 'remove(' + key + '): not found. Nothing changes.', hot: idx }));
        }
      });
      const total = table.reduce(function (a, b) { return a + b.length; }, 0);
      F.push(snap({ cap: 'Done. size() = **' + total + '**.', mood: 'happy' }));
      return F;
    }
    function render(f, i, o) {
      const t = tableNodes(SIZE, { H: H, x: 60 });
      const nodes = t.nodes.slice();
      const edges = [];
      if (f.hot !== null) nodes[f.hot] = Object.assign({}, nodes[f.hot], { cls: 'cur' });
      f.table.forEach(function (bucket, k) {
        const y = t.ys[k];
        if (!bucket.length) nodes.push({ id: 'nul' + k, t: 'label', x: 140, y: y, label: 'empty', anchor: 'start', fs: 13 });
        bucket.forEach(function (e, j) {
          const lbl = kind === 'map' ? e.k + ' → ' + e.v : e.k;
          nodes.push({ id: 'e-' + e.k, t: 'cell', x: 210 + j * 220, y: y, w: kind === 'map' ? 196 : 130, h: t.rowH - 10, label: lbl, cls: f.cls[e.k] || '', fs: 14 });
          edges.push({ id: 'me' + k + '-' + j, a: j === 0 ? 'ix' + k : 'e-' + bucket[j - 1].k, b: 'e-' + e.k, dir: true });
        });
      });
      L.scene.draw({ nodes: nodes, edges: edges }, { instant: o.instant });
      U.clear(sizeBody);
      sizeBody.appendChild(h('div', { class: 'stats' }, ui.stat('size()', f.table.reduce(function (a, b) { return a + b.length; }, 0)), ui.stat('BUCKETS', SIZE)));
    }
    function run() { L.player.load(frames(), render); }
    run();
    return L;
  }

  // ================================================================ lesson
  const lk = ST.lk;
  const RULES = [
    { rule: 'hash = (sum of char codes) % size', note: 'Easy to do by hand. Real hash functions mix the bits much more.' },
    { rule: 'Probing: try +1, wrap to 0', note: 'This is linear probing. Others: quadratic probing, double hashing.' }
  ];
  function lesson() {
    const SX = lk.xs(7, 52, 6), SY = 150;
    // keys: { index: key }. o: { hot, bad, done: key, extra: [], edges: [] }
    const table = function (keys, cap, o) {
      o = o || {};
      const n = SX.map(function (x, k) { return { id: 'slot' + k, t: 'cell', x: x, y: SY, w: 52, h: 48, label: '', top: String(k), cls: k === o.hot ? 'cur' : (k === o.bad ? 'bad' : 'ghost') }; });
      Object.keys(keys).forEach(function (k) { n.push({ id: 'k' + keys[k], t: 'cell', x: SX[k], y: SY, w: 52, h: 48, label: keys[k], fs: 15, cls: o.done === keys[k] ? 'done' : (Number(k) === o.bad ? 'bad' : '') }); });
      return { nodes: n.concat(o.extra || []), edges: o.edges || [], cap: cap };
    };
    const key = function (k, x, y, cls) { return { id: 'k' + k, t: 'cell', x: x, y: y, w: 60, h: 36, label: k, fs: 15, cls: cls || 'cur' }; };
    const T3 = { 6: 'CAT', 1: 'DOG', 4: 'OWL' };
    const sum = function (s) { return lk.text('sum', 240, 88, s, 'ink', 15); };
    const pair = function (k, v, y, cls) {
      return [{ id: 'mk' + k, t: 'cell', x: 80, y: y, w: 70, h: 36, label: k, fs: 15 }, { id: 'mv' + k, t: 'cell', x: 160, y: y, w: 80, h: 36, label: v, fs: 15, cls: cls || 'paper' }];
    };
    const mapset = function (step, cap) {
      let n = [lk.text('ml', 120, 24, 'MAP: key → value', 'ink', 14), lk.text('sl', 360, 24, 'SET: keys only', 'ink', 14)];
      n = n.concat(pair('CAT', step >= 3 ? 'purr' : 'meow', 70, step >= 3 ? 'cur' : ''), pair('DOG', 'woof', 115));
      if (step >= 1) n.push({ id: 'sCAT', t: 'cell', x: 360, y: 70, w: 70, h: 36, label: 'CAT', fs: 15 }, { id: 'sDOG', t: 'cell', x: 360, y: 115, w: 70, h: 36, label: 'DOG', fs: 15 });
      if (step === 2) n.push({ id: 'sNew', t: 'cell', x: 360, y: 165, w: 70, h: 36, label: 'CAT', fs: 15, cls: 'bad', from: { x: 360, y: 240 } }, lk.text('dup', 360, 202, 'already in!', 'red', 13));
      return { nodes: n, cap: cap };
    };
    return [
      { title: 'Key → number → index', frames: [
        table({}, 'Store the key **"CAT"**.', { extra: [key('CAT', 240, 36)] }),
        table({}, 'Add up the character codes: **216**.', { extra: [key('CAT', 240, 36), sum('C 67 + A 65 + T 84 = 216')] }),
        table({}, 'Remainder by the table size: index **6**.', { hot: 6, extra: [key('CAT', 240, 36), sum('216 % 7 = 6')] }),
        table({ 6: 'CAT' }, 'Store it at **6**.', { done: 'CAT' })
      ] },
      { title: 'Find it in one jump', frames: [
        table(T3, 'A table with 3 keys.'),
        table(T3, 'get("OWL"): hash again → **4**.', { extra: [lk.tag('q', 240, 30, 'get("OWL")', 'yellow'), sum('O 79 + W 87 + L 76 = 242 → 242 % 7 = 4')] }),
        table(T3, 'Jump straight there: **O(1)** on average.', { done: 'OWL', extra: [lk.tag('q', 240, 30, 'get("OWL")', 'yellow'), lk.ptr('p', SX[4], 108, '', 'red', true)] })
      ] },
      { title: 'Two keys, one slot', trap: true, frames: [
        table(T3, 'Now store **"ACT"**.', { extra: [key('ACT', 240, 36)] }),
        table(T3, 'Same letters, same sum: **216 → 6**.', { extra: [key('ACT', 240, 36), sum('A 65 + C 67 + T 84 = 216 → 6')] }),
        table(T3, 'Slot 6 is taken! A **collision**.', { bad: 6, extra: [key('ACT', SX[6], 76, 'bad')] })
      ] },
      { title: 'Fix 1: chaining', vb: [480, 250], frames: [
        table(T3, 'Collision at 6.', { bad: 6, extra: [key('ACT', SX[6], 76, 'bad')] }),
        table(T3, 'Hang ACT in a **chain** under slot 6.', { extra: [key('ACT', SX[6], 222, 'wait')], edges: [lk.arrow('kCAT', 'kACT')] }),
        table(T3, 'get("ACT"): go to 6, walk the chain.', { done: 'CAT', extra: [key('ACT', SX[6], 222, 'done')], edges: [lk.arrow('kCAT', 'kACT', 'path')] })
      ] },
      { title: 'Fix 2: linear probing', frames: [
        table(T3, 'Collision at 6.', { bad: 6, extra: [key('ACT', SX[6], 76, 'bad')] }),
        table(T3, 'Try the next slot. Past the end? **Wrap to 0**.', { hot: 0, extra: [key('ACT', SX[0], 76, 'cur'), sum('6 is taken → (6 + 1) % 7 = 0')] }),
        table(Object.assign({ 0: 'ACT' }, T3), 'Slot 0 is free. Store ACT there.', { done: 'ACT' })
      ] },
      { title: 'Map vs Set', frames: [
        mapset(0, 'A **map** stores key → value.'),
        mapset(1, 'A **set** stores keys only.'),
        mapset(2, 'Add CAT again? A set keeps **one** copy.'),
        mapset(3, 'Map: same key → the value is **replaced**.')
      ] }
    ];
  }

  ST.topic({
    id: 'hashing', n: 9, color: 'blue', icon: 'hashing',
    title: 'Hash Tables, Maps & Sets',
    short: 'Turn a key into an index and jump straight to it.',
    blurb: 'Find a record in one jump. The key tells you where to look.',
    cheat: {
      head: ['Search method', 'Time'],
      rows: [['Linear search', 'O(n)'], ['Binary search', 'O(log n)'], ['Hash table (average)', 'O(1)'], ['Hash table (worst, many collisions)', 'O(n)']]
    },
    lesson: lesson(),
    rules: RULES,
    labs: [
      { id: 'function', title: 'Hash function', tag: 'TRACE', setup: fnLab },
      { id: 'collisions', title: 'Collisions', tag: 'TRACE', setup: collideLab },
      { id: 'mapset', title: 'Map vs Set', tag: 'TRACE', setup: mapSetLab }
    ]
  });
})(window.ST);
