/*
  scene.js — a tiny SVG "stage" used by every visualizer.

  You describe what the picture should look like right now:
     scene.draw({ nodes: [...], edges: [...] })
  and the scene animates from the old picture to the new one.
  Nodes keep their identity through their id, so a value that moves
  (a swap, a rotation, a level change) slides to its new place.

  Node fields:
    id, x, y, t (type), label, cls, sub, top, badge, ring, w, h, r, fs, from
    types: circle | cell | bar | ll | tag | label | box | ptr
  Edge fields:
    id, a, b (node ids) or pts [{x,y},{x,y}], cls, w (weight label),
    dir (arrow), bend, ap / bp (ports: next, prev, top, bottom, left, right)
*/
(function (ST) {
  'use strict';
  const s = ST.s;

  ST.anim = { ms: 430 };
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function textWidth(str, fs) { return String(str).length * fs * 0.6; }

  function Scene(svg, opts) {
    opts = opts || {};
    this.svg = svg;
    this.vb = opts.vb || [800, 420];
    svg.setAttribute('viewBox', '0 0 ' + this.vb[0] + ' ' + this.vb[1]);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.classList.add('scene');
    this.gBack = s('g', { class: 'layer-back' }, null);
    this.gEdges = s('g', { class: 'layer-edges' });
    this.gNodes = s('g', { class: 'layer-nodes' });
    this.gFront = s('g', { class: 'layer-front' });
    svg.appendChild(this.gBack);
    svg.appendChild(this.gEdges);
    svg.appendChild(this.gNodes);
    svg.appendChild(this.gFront);
    this.nodes = {};
    this.edges = {};
    this.raf = null;
    this.pickFn = null;
    this.hoverFn = null;
    const self = this;
    svg.addEventListener('click', function (e) {
      const g = e.target.closest && e.target.closest('.nd');
      if (!g) return;
      const id = g.getAttribute('data-id');
      if (self.pickFn && g.classList.contains('pickable')) self.pickFn(id);
      if (self.clickFn) self.clickFn(id);
    });
    svg.addEventListener('mouseover', function (e) {
      if (!self.hoverFn) return;
      const g = e.target.closest && e.target.closest('.nd');
      self.hoverFn(g ? g.getAttribute('data-id') : null);
    });
    svg.addEventListener('mouseleave', function () { if (self.hoverFn) self.hoverFn(null); });
  }

  Scene.prototype.resize = function (w, hgt) {
    this.vb = [w, hgt];
    this.svg.setAttribute('viewBox', '0 0 ' + w + ' ' + hgt);
  };

  // ---------- node drawing ----------

  function nodeSize(n) {
    switch (n.t) {
      case 'cell': return { w: n.w || 56, h: n.h || 56 };
      case 'bar': return { w: n.w || 40, h: n.h || 40 };
      case 'll': return { w: n.w || (n.dbl ? 124 : 96), h: n.h || 48 };
      case 'box': return { w: n.w || 100, h: n.h || 60 };
      case 'tag': {
        const fs = n.fs || 15;
        return { w: n.w || Math.max(36, textWidth(n.label, fs) + 18), h: n.h || 26 };
      }
      case 'label': return { w: textWidth(n.label || '', n.fs || 16), h: (n.fs || 16) * 1.2 };
      case 'ptr': return { w: 24, h: 30 };
      default: return { w: (n.r || 24) * 2, h: (n.r || 24) * 2 };
    }
  }

  function buildInner(n) {
    const g = s('g', { class: 'inner' });
    const sz = nodeSize(n);
    const fs = n.fs;
    if (n.t === 'cell' || n.t === 'box') {
      g.appendChild(s('rect', { class: 'shape', x: -sz.w / 2, y: -sz.h / 2, width: sz.w, height: sz.h, rx: n.rx || 0 }));
      if (n.t === 'box' && n.label) {
        const tl = s('text', { class: 'boxlbl', x: -sz.w / 2 + 8, y: -sz.h / 2 + 16 });
        tl.textContent = n.label;
        g.appendChild(tl);
      } else if (n.label !== undefined && n.label !== '') {
        g.appendChild(txt(n.label, 0, 0, 'lbl', fs || (String(n.label).length > 3 ? 17 : 22)));
      }
      if (n.sub !== undefined) g.appendChild(txt(n.sub, 0, sz.h / 2 + 15, 'sub', 13));
      if (n.top !== undefined) g.appendChild(txt(n.top, 0, -sz.h / 2 - 12, 'top', 13));
    } else if (n.t === 'bar') {
      g.appendChild(s('rect', { class: 'shape', x: -sz.w / 2, y: -sz.h, width: sz.w, height: sz.h }));
      g.appendChild(txt(n.label, 0, -sz.h - 12, 'lbl bar-lbl', fs || 16));
      if (n.sub !== undefined) g.appendChild(txt(n.sub, 0, 16, 'sub', 13));
    } else if (n.t === 'll') {
      const w = sz.w, hh = sz.h;
      g.appendChild(s('rect', { class: 'shape', x: -w / 2, y: -hh / 2, width: w, height: hh }));
      const nextW = 30;
      if (n.dbl) {
        g.appendChild(s('line', { class: 'div', x1: -w / 2 + nextW, y1: -hh / 2, x2: -w / 2 + nextW, y2: hh / 2 }));
        g.appendChild(s('rect', { class: 'port', x: -w / 2 + 2, y: -hh / 2 + 2, width: nextW - 4, height: hh - 4 }));
        g.appendChild(s('circle', { class: 'dot', cx: -w / 2 + nextW / 2, cy: 0, r: 4 }));
      }
      g.appendChild(s('line', { class: 'div', x1: w / 2 - nextW, y1: -hh / 2, x2: w / 2 - nextW, y2: hh / 2 }));
      g.appendChild(s('rect', { class: 'port', x: w / 2 - nextW + 2, y: -hh / 2 + 2, width: nextW - 4, height: hh - 4 }));
      g.appendChild(s('circle', { class: 'dot', cx: w / 2 - nextW / 2, cy: 0, r: 4 }));
      const dataX = n.dbl ? 0 : -nextW / 2;
      g.appendChild(txt(n.label, dataX, 0, 'lbl', fs || (String(n.label).length > 4 ? 14 : 20)));
      if (n.sub !== undefined) g.appendChild(txt(n.sub, 0, hh / 2 + 15, 'sub', 12));
      if (n.top !== undefined) g.appendChild(txt(n.top, 0, -hh / 2 - 11, 'top', 12));
    } else if (n.t === 'tag') {
      g.appendChild(s('rect', { class: 'shape', x: -sz.w / 2, y: -sz.h / 2, width: sz.w, height: sz.h, rx: 3 }));
      g.appendChild(txt(n.label, 0, 0, 'lbl', fs || 15));
    } else if (n.t === 'label') {
      g.appendChild(txt(n.label, 0, 0, 'lbl', fs || 16, n.anchor));
    } else if (n.t === 'ptr') {
      const dn = n.down;
      g.appendChild(s('path', { class: 'shape', d: dn ? 'M-9 -14 L9 -14 L0 0 Z' : 'M-9 14 L9 14 L0 0 Z' }));
      g.appendChild(txt(n.label, 0, dn ? -24 : 26, 'lbl', fs || 14));
    } else {
      const r = n.r || 24;
      if (n.ring) g.appendChild(s('circle', { class: 'ring ring-' + n.ring, r: r + 7 }));
      g.appendChild(s('circle', { class: 'shape', r: r }));
      g.appendChild(txt(n.label, 0, 0, 'lbl', fs || (String(n.label).length > 2 ? 15 : 20)));
      if (n.sub !== undefined) g.appendChild(txt(n.sub, 0, r + 17, 'sub', 13));
      if (n.top !== undefined) g.appendChild(txt(n.top, 0, -r - 13, 'top', 13));
    }
    if (n.badge !== undefined && n.badge !== null && n.badge !== '') {
      let bx, by;
      if (n.t === 'circle' || !n.t) { bx = (n.r || 24) * 0.78; by = -(n.r || 24) * 0.78; }
      else { bx = sz.w / 2 - 2; by = -sz.h / 2 + 2; }
      const bg = s('g', { class: 'badge ' + (n.badgeCls || '') });
      const bw = Math.max(22, textWidth(n.badge, 12) + 10);
      bg.appendChild(s('rect', { x: bx - bw / 2, y: by - 11, width: bw, height: 22, rx: 11 }));
      bg.appendChild(txt(n.badge, bx, by, '', 12));
      g.appendChild(bg);
    }
    return g;
  }

  function txt(str, x, y, cls, fs, anchor) {
    const t = s('text', { x: x, y: y, class: cls, 'font-size': fs, 'text-anchor': anchor || 'middle', dy: '.36em' });
    t.textContent = str === undefined ? '' : String(str);
    return t;
  }

  function sig(n) {
    return [n.t, n.label, n.sub, n.top, n.badge, n.badgeCls, n.ring, n.w, n.h, n.r, n.fs, n.dbl, n.down, n.rx, n.anchor].join('|');
  }

  // ---------- geometry ----------

  function anchor(rec, toward, port) {
    const n = rec.spec;
    const p = rec.cur;
    const sz = nodeSize(n);
    if (port === 'next') return { x: p.x + sz.w / 2 - 15, y: p.y };
    if (port === 'prev') return { x: p.x - sz.w / 2 + 15, y: p.y };
    if (port === 'top') return { x: p.x, y: p.y - sz.h / 2 };
    if (port === 'bottom') return { x: p.x, y: p.y + sz.h / 2 };
    if (port === 'left') return { x: p.x - sz.w / 2, y: p.y };
    if (port === 'right') return { x: p.x + sz.w / 2, y: p.y };
    if (port === 'center') return { x: p.x, y: p.y };
    const dx = toward.x - p.x, dy = toward.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    if (!n.t || n.t === 'circle') {
      const r = (n.r || 24) + (n.ring ? 7 : 0) + 2;
      return { x: p.x + dx / len * r, y: p.y + dy / len * r };
    }
    if (n.t === 'label' || n.t === 'ptr') {
      return { x: p.x + dx / len * 12, y: p.y + dy / len * 12 };
    }
    // rectangle: scale the direction until it touches a side
    const hw = sz.w / 2 + 2, hh = sz.h / 2 + 2;
    const sx = dx === 0 ? Infinity : hw / Math.abs(dx);
    const sy = dy === 0 ? Infinity : hh / Math.abs(dy);
    const k = Math.min(sx, sy);
    return { x: p.x + dx * k, y: p.y + dy * k };
  }

  Scene.prototype.edgeGeom = function (e) {
    let A, B, a, b;
    if (e.pts) {
      a = e.pts[0]; b = e.pts[1];
    } else {
      A = this.nodes[e.a]; B = this.nodes[e.b];
      if (!A || !B) return null;
      a = A.cur; b = B.cur;
    }
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const bend = e.bend || 0;
    const c = { x: mx - dy / len * bend, y: my + dx / len * bend };
    let p1 = a, p2 = b;
    if (!e.pts) {
      p1 = anchor(A, bend ? c : b, e.ap);
      p2 = anchor(B, bend ? c : a, e.bp);
      if (e.dy) { p1 = { x: p1.x, y: p1.y + e.dy }; p2 = { x: p2.x, y: p2.y + e.dy }; }
    }
    let d, mid, tdir;
    if (bend) {
      // recompute control point from the trimmed ends so the curve stays smooth
      const mx2 = (p1.x + p2.x) / 2, my2 = (p1.y + p2.y) / 2;
      const ddx = p2.x - p1.x, ddy = p2.y - p1.y;
      const l2 = Math.hypot(ddx, ddy) || 1;
      const c2 = { x: mx2 - ddy / l2 * bend, y: my2 + ddx / l2 * bend };
      d = 'M' + p1.x + ' ' + p1.y + ' Q' + c2.x + ' ' + c2.y + ' ' + p2.x + ' ' + p2.y;
      mid = { x: 0.25 * p1.x + 0.5 * c2.x + 0.25 * p2.x, y: 0.25 * p1.y + 0.5 * c2.y + 0.25 * p2.y };
      tdir = { x: p2.x - c2.x, y: p2.y - c2.y };
    } else {
      d = 'M' + p1.x + ' ' + p1.y + ' L' + p2.x + ' ' + p2.y;
      mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      tdir = { x: p2.x - p1.x, y: p2.y - p1.y };
    }
    return { d: d, mid: mid, end: p2, dir: tdir };
  };

  // ---------- main draw ----------

  Scene.prototype.draw = function (spec, opts) {
    opts = opts || {};
    const self = this;
    const instant = opts.instant || reduceMotion || ST.anim.ms === 0;
    const seenN = {};
    (spec.nodes || []).forEach(function (n, i) {
      if (!n) return;
      seenN[n.id] = true;
      let rec = self.nodes[n.id];
      if (rec && rec.leaving) {
        clearTimeout(rec.leaving);
        rec.leaving = null;
        rec.el.classList.remove('leaving');
      }
      if (!rec) {
        const el = s('g', { class: 'nd', 'data-id': n.id });
        const start = n.from ? { x: n.from.x, y: n.from.y } : { x: n.x, y: n.y };
        rec = { el: el, cur: start, from: start, to: { x: n.x, y: n.y }, spec: n, sig: '' };
        self.nodes[n.id] = rec;
        self.gNodes.appendChild(el);
        if (!instant) el.classList.add('entering');
        setTimeout(function () { el.classList.remove('entering'); }, 400);
      }
      rec.spec = n;
      rec.from = { x: rec.cur.x, y: rec.cur.y };
      rec.to = { x: n.x, y: n.y };
      const sg = sig(n);
      if (sg !== rec.sig) {
        while (rec.el.firstChild) rec.el.removeChild(rec.el.firstChild);
        rec.el.appendChild(buildInner(n));
        rec.sig = sg;
      }
      rec.el.setAttribute('class', 'nd t-' + (n.t || 'circle') + (n.cls ? ' ' + n.cls : '') + (rec.el.classList.contains('entering') ? ' entering' : ''));
    });
    // keep the DOM order the same as the spec order (first = behind)
    const fronts = [];
    (spec.nodes || []).forEach(function (n) {
      if (!n || !self.nodes[n.id]) return;
      if (n.z === 'front') fronts.push(self.nodes[n.id].el);
      else self.gNodes.appendChild(self.nodes[n.id].el);
    });
    fronts.forEach(function (el) { self.gNodes.appendChild(el); });
    Object.keys(self.nodes).forEach(function (id) {
      if (seenN[id]) return;
      const rec = self.nodes[id];
      if (rec.leaving) return;
      if (instant) { rec.el.remove(); delete self.nodes[id]; return; }
      rec.el.classList.add('leaving');
      rec.leaving = setTimeout(function () { rec.el.remove(); delete self.nodes[id]; }, 260);
    });

    const seenE = {};
    (spec.edges || []).forEach(function (e) {
      if (!e) return;
      seenE[e.id] = true;
      let rec = self.edges[e.id];
      if (!rec) {
        const g = s('g', { class: 'ed' });
        const path = s('path', { class: 'line' });
        const head = s('path', { class: 'head' });
        const lab = s('g', { class: 'elabel' });
        const lr = s('rect', { rx: 3 });
        const lt = s('text', { 'text-anchor': 'middle', dy: '.36em' });
        lab.appendChild(lr); lab.appendChild(lt);
        g.appendChild(path); g.appendChild(head); g.appendChild(lab);
        self.gEdges.appendChild(g);
        rec = { el: g, path: path, head: head, lab: lab, lr: lr, lt: lt };
        self.edges[e.id] = rec;
        if (!instant) {
          g.classList.add('entering');
          setTimeout(function () { g.classList.remove('entering'); }, 400);
        }
      }
      if (rec.leaving) { clearTimeout(rec.leaving); rec.leaving = null; }
      rec.spec = e;
      rec.el.setAttribute('class', 'ed' + (e.cls ? ' ' + e.cls : '') + (e.dir ? ' dir' : '') + (rec.el.classList.contains('entering') ? ' entering' : ''));
      if (e.w !== undefined && e.w !== null && e.w !== '') {
        rec.lt.textContent = String(e.w);
        const fs = e.wfs || 14;
        rec.lt.setAttribute('font-size', fs);
        const tw = textWidth(e.w, fs) + 10;
        rec.lr.setAttribute('x', -tw / 2); rec.lr.setAttribute('y', -11);
        rec.lr.setAttribute('width', tw); rec.lr.setAttribute('height', 22);
        rec.lab.style.display = '';
      } else {
        rec.lab.style.display = 'none';
      }
    });
    Object.keys(self.edges).forEach(function (id) {
      if (seenE[id]) return;
      const rec = self.edges[id];
      if (rec.leaving) return;
      if (instant) { rec.el.remove(); delete self.edges[id]; return; }
      rec.el.classList.add('leaving');
      rec.leaving = setTimeout(function () { rec.el.remove(); delete self.edges[id]; }, 260);
    });

    // animate positions
    if (self.raf) cancelAnimationFrame(self.raf);
    const dur = instant ? 0 : (opts.ms || ST.anim.ms);
    const t0 = performance.now();
    function tick(now) {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const k = ease(t);
      Object.keys(self.nodes).forEach(function (id) {
        const r = self.nodes[id];
        if (!r.to) return;
        r.cur = { x: r.from.x + (r.to.x - r.from.x) * k, y: r.from.y + (r.to.y - r.from.y) * k };
        r.el.setAttribute('transform', 'translate(' + r.cur.x.toFixed(2) + ' ' + r.cur.y.toFixed(2) + ')');
      });
      self.layoutEdges();
      if (t < 1) self.raf = requestAnimationFrame(tick);
      else self.raf = null;
    }
    if (dur) self.raf = requestAnimationFrame(tick);
    else tick(t0);
  };

  Scene.prototype.layoutEdges = function () {
    const self = this;
    Object.keys(self.edges).forEach(function (id) {
      const rec = self.edges[id];
      const g = self.edgeGeom(rec.spec);
      if (!g) { rec.el.style.display = 'none'; return; }
      rec.el.style.display = '';
      rec.path.setAttribute('d', g.d);
      if (rec.spec.dir) {
        const len = Math.hypot(g.dir.x, g.dir.y) || 1;
        const ux = g.dir.x / len, uy = g.dir.y / len;
        const L = 12, W = 6;
        const bx = g.end.x - ux * L, by = g.end.y - uy * L;
        rec.head.setAttribute('d', 'M' + g.end.x + ' ' + g.end.y + ' L' + (bx - uy * W) + ' ' + (by + ux * W) + ' L' + (bx + uy * W) + ' ' + (by - ux * W) + ' Z');
      } else {
        rec.head.setAttribute('d', '');
      }
      const off = rec.spec.woff || { x: 0, y: 0 };
      rec.lab.setAttribute('transform', 'translate(' + (g.mid.x + off.x) + ' ' + (g.mid.y + off.y) + ')');
    });
  };

  // Let the user click nodes (used by Predict questions).
  Scene.prototype.setPick = function (ids, fn) {
    this.pickFn = fn || null;
    const self = this;
    Object.keys(self.nodes).forEach(function (id) {
      const ok = fn && (ids === true || ids.indexOf(id) >= 0);
      self.nodes[id].el.classList.toggle('pickable', !!ok);
    });
  };

  Scene.prototype.clearAll = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.gNodes.innerHTML = '';
    this.gEdges.innerHTML = '';
    this.gBack.innerHTML = '';
    this.gFront.innerHTML = '';
    this.nodes = {};
    this.edges = {};
  };

  ST.Scene = Scene;
  ST.textWidth = textWidth;
})(window.ST);
