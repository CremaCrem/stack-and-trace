/*
  lesson.js — the lesson: short animated "beats" shown before the labs,
  plus the class-rules box.

  A topic gives:
    lesson: [{ title, frames: [{ nodes, edges, cap }], vb?, trap? }]
    rules:  [{ rule, note }]   (choices made for this course, not laws of the algorithm)

  Each beat loops by itself while it is on screen. Click the picture to pause,
  click a dot to jump to a step.
*/
(function (ST) {
  'use strict';
  const h = ST.h, U = ST.util;
  const VB = [480, 220];
  const STEP = 1600, HOLD = 2800, MS = 520;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- builders for beat frames
  const lk = {
    VB: VB,
    // x centres for n boxes of width w in the stage
    xs: function (n, w, gap, W) { return ST.kit.row(n, W || VB[0], w || 48, gap === undefined ? 6 : gap); },
    // a row of cells. o: { y, w, h, gap, ids, cls(i, v), sub(i, v), top(i, v), t, fs, x }
    cells: function (prefix, vals, o) {
      o = o || {};
      const w = o.w || 48;
      const xs = o.x || lk.xs(vals.length, w, o.gap);
      const call = function (f, i, v) { return typeof f === 'function' ? f(i, v) : (Array.isArray(f) ? f[i] : f); };
      return vals.map(function (v, i) {
        return {
          id: o.ids ? o.ids[i] : prefix + i, t: o.t || 'cell', x: xs[i], y: o.y === undefined ? 110 : o.y,
          w: w, h: o.h || w, label: v, fs: o.fs,
          cls: call(o.cls, i, v) || '', sub: call(o.sub, i, v), top: call(o.top, i, v)
        };
      });
    },
    tag: function (id, x, y, label, cls, fs) { return { id: id, t: 'tag', x: x, y: y, label: label, cls: cls || '', fs: fs }; },
    text: function (id, x, y, label, cls, fs, anchor) { return { id: id, t: 'label', x: x, y: y, label: label, cls: cls || 'pix', fs: fs || 17, anchor: anchor }; },
    // pointer: tip at (x, y). up = points up with label below, down = points down with label above
    ptr: function (id, x, y, label, cls, down) { return { id: id, t: 'ptr', x: x, y: y, label: label, cls: cls || '', down: !!down }; },
    arrow: function (a, b, cls, o) { return Object.assign({ id: a + '>' + b, a: a, b: b, dir: true, cls: cls || '' }, o || {}); }
  };
  ST.lk = lk;

  // ---------------------------------------------------------------- one beat
  function beatView(b, k) {
    const svg = ST.s('svg', { role: 'img', 'aria-label': b.title });
    const cap = h('p', { class: 'beat-cap', 'aria-live': 'polite' });
    const dots = h('div', { class: 'beat-dots', role: 'group', 'aria-label': 'Steps' });
    const playBtn = h('button', { type: 'button', class: 'beat-play', 'aria-label': 'Pause' });
    const el = h('article', { class: 'beat' + (b.trap ? ' beat-trap' : '') },
      h('header', { class: 'beat-h' },
        h('span', { class: 'beat-n' }, b.trap ? '!' : String(k + 1)),
        h('h3', null, b.title)),
      h('div', { class: 'beat-stage' }, svg),
      h('div', { class: 'beat-foot' }, playBtn, cap, dots));
    const sc = new ST.Scene(svg, { vb: b.vb || VB });
    const frames = b.frames;
    let i = 0, timer = null, visible = false, paused = reduceMotion;

    const dotEls = frames.map(function (f, j) {
      return h('button', { type: 'button', class: 'beat-dot', 'aria-label': 'Step ' + (j + 1), onclick: function () { paused = true; show(j); sync(); } });
    });
    dotEls.forEach(function (d) { dots.appendChild(d); });

    function show(j, instant) {
      i = j;
      const f = frames[j];
      sc.draw({ nodes: f.nodes || [], edges: f.edges || [] }, { instant: instant, ms: MS });
      cap.innerHTML = U.rich(f.cap || '');
      dotEls.forEach(function (d, n) { d.classList.toggle('on', n === j); });
    }
    function tick() {
      timer = setTimeout(function () {
        const wrap = i === frames.length - 1;
        show(wrap ? 0 : i + 1, wrap);
        tick();
      }, i === frames.length - 1 ? HOLD : STEP);
    }
    function sync() {
      clearTimeout(timer); timer = null;
      if (visible && !paused && frames.length > 1) tick();
      playBtn.classList.toggle('paused', !timer);
      playBtn.setAttribute('aria-label', timer ? 'Pause' : 'Play');
      U.clear(playBtn).appendChild(h('span', { class: 'pix', html: ST.ctrl(timer ? 'pause' : 'play', { mono: 'currentColor', px: 2 }) }));
    }
    function toggle() { paused = !paused; if (!paused && i === frames.length - 1) show(0, true); sync(); }
    playBtn.addEventListener('click', toggle);
    svg.addEventListener('click', toggle);

    show(0, true);
    sync();
    return {
      el: el,
      setVisible: function (v) { visible = v; sync(); },
      destroy: function () { clearTimeout(timer); }
    };
  }

  // ---------------------------------------------------------------- the lesson section
  ST.lessonView = function (t) {
    if (!t.lesson || !t.lesson.length) return { el: null, destroy: function () {} };
    const beats = t.lesson.map(beatView);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        const b = beats.filter(function (x) { return x.el === e.target; })[0];
        if (b) b.setVisible(e.isIntersecting);
      });
    }, { threshold: 0.45 }) : null;
    beats.forEach(function (b) { if (io) io.observe(b.el); else b.setVisible(true); });
    const el = h('section', { class: 'wrap lesson' },
      h('h2', { class: 'pixel-h' }, 'THE LESSON'),
      h('div', { class: 'beats' }, beats.map(function (b) { return b.el; })));
    return {
      el: el,
      destroy: function () { if (io) io.disconnect(); beats.forEach(function (b) { b.destroy(); }); }
    };
  };

  ST.rulesView = function (t) {
    if (!t.rules || !t.rules.length) return null;
    return h('section', { class: 'wrap rules' },
      h('div', { class: 'rules-box' },
        h('div', { class: 'rules-head' },
          h('span', { class: 'rules-tag' }, 'CLASS RULES'),
          h('p', null, 'Choices this course makes so everyone gets the same answer. They are not part of the algorithm.')),
        h('ul', null, t.rules.map(function (r) {
          return h('li', null, h('b', null, r.rule), r.note ? h('span', null, r.note) : null);
        }))));
  };
})(window.ST);
