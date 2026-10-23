/*
  util.js — small helpers shared by every page.
  Everything lives on one global object, ST, so the site works
  without a build step and even when index.html is opened directly.
*/
window.ST = window.ST || {};
(function (ST) {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // h('div', {class: 'x', onclick: fn}, 'text', childNode, [more])
  function h(tag, attrs) {
    const node = document.createElement(tag);
    setAttrs(node, attrs);
    for (let i = 2; i < arguments.length; i++) add(node, arguments[i]);
    return node;
  }

  // s('circle', {r: 4}) — SVG version of h()
  function s(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    setAttrs(node, attrs);
    for (let i = 2; i < arguments.length; i++) add(node, arguments[i]);
    return node;
  }

  function setAttrs(node, attrs) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k.slice(0, 2) === 'on' && typeof v === 'function') {
        node.addEventListener(k.slice(2), v);
      } else if (k === 'html') {
        node.innerHTML = v;
      } else if (k === 'text') {
        node.textContent = v;
      } else {
        node.setAttribute(k, v === true ? '' : v);
      }
    });
  }

  function add(parent, child) {
    if (child === undefined || child === null || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { add(parent, c); }); return; }
    if (typeof child === 'string' || typeof child === 'number') {
      parent.appendChild(document.createTextNode(String(child)));
      return;
    }
    parent.appendChild(child);
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Captions may use **bold** and `code`. Everything else is escaped.
  function rich(str) {
    return esc(str)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  // "5, 1 4,2" -> [5, 1, 4, 2]
  function parseNums(str, opts) {
    opts = opts || {};
    const out = String(str).split(/[\s,;]+/).filter(Boolean).map(Number)
      .filter(function (n) { return isFinite(n); })
      .map(function (n) { return opts.int === false ? n : Math.round(n); });
    const max = opts.max || 14;
    return out.slice(0, max);
  }

  function parseWords(str, max) {
    return String(str).split(/[\s,;]+/).filter(Boolean).slice(0, max || 12);
  }

  function range(n) { const a = []; for (let i = 0; i < n; i++) a.push(i); return a; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

  function randomNums(n, lo, hi, unique) {
    const out = [];
    let guard = 0;
    while (out.length < n && guard++ < 999) {
      const v = randInt(lo, hi);
      if (unique && out.indexOf(v) >= 0) continue;
      out.push(v);
    }
    return out;
  }

  // Safe localStorage: never throws, falls back to memory.
  const mem = {};
  const store = {
    get: function (key, fallback) {
      try {
        const raw = window.localStorage.getItem('st.' + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return key in mem ? mem[key] : fallback;
      }
    },
    set: function (key, value) {
      mem[key] = value;
      try { window.localStorage.setItem('st.' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    }
  };

  // Tiny event bus for settings that many widgets care about.
  const listeners = {};
  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return function off() {
      const arr = listeners[evt] || [];
      const k = arr.indexOf(fn);
      if (k >= 0) arr.splice(k, 1);
    };
  }
  function emit(evt, data) { (listeners[evt] || []).forEach(function (fn) { fn(data); }); }

  ST.util = {
    h: h, s: s, clear: clear, esc: esc, rich: rich, setAttrs: setAttrs,
    parseNums: parseNums, parseWords: parseWords, range: range, clamp: clamp,
    copy: copy, randInt: randInt, randomNums: randomNums
  };
  ST.store = store;
  ST.on = on;
  ST.emit = emit;
  ST.h = h;
  ST.s = s;
})(window.ST);
