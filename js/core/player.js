/*
  player.js — the step-by-step player and the standard lab layout.

  A lab builds a list of frames (full snapshots of the picture).
  The player shows one frame at a time: back, next, play, jump.
  PREDICT mode: when a frame has an "ask", the player stops and asks
  the student to guess what happens next before showing it.
*/
(function (ST) {
  'use strict';
  const h = ST.h;
  const U = ST.util;

  const SPEEDS = {
    slow: { step: 1900, anim: 650, label: 'SLOW' },
    normal: { step: 1150, anim: 430, label: 'NORMAL' },
    fast: { step: 560, anim: 250, label: 'FAST' }
  };

  ST.state = {
    predict: ST.store.get('predict', false),
    coins: ST.store.get('coins', 0),
    speed: ST.store.get('speed', 'normal')
  };
  if (!SPEEDS[ST.state.speed]) ST.state.speed = 'normal';
  ST.anim.ms = SPEEDS[ST.state.speed].anim;

  ST.setPredict = function (on) {
    ST.state.predict = on;
    ST.store.set('predict', on);
    ST.emit('predict', on);
  };
  ST.addCoins = function (n) {
    ST.state.coins += n;
    ST.store.set('coins', ST.state.coins);
    ST.emit('coins', ST.state.coins);
  };
  ST.setSpeed = function (name) {
    if (!SPEEDS[name]) return;
    ST.state.speed = name;
    ST.anim.ms = SPEEDS[name].anim;
    ST.store.set('speed', name);
    ST.emit('speed', name);
  };

  ST.activePlayer = null;

  // ---------------------------------------------------------------
  function Player(L, opts) {
    this.L = L;
    this.opts = opts || {};
    this.frames = [];
    this.i = 0;
    this.timer = null;
    this.asking = -1;
    this.answered = {};
    this.render = null;
    this.buildBar();
    const self = this;
    this.offs = [
      ST.on('predict', function () { self.syncButtons(); }),
      ST.on('speed', function () { self.syncButtons(); if (self.timer) { self.pause(); self.play(); } })
    ];
  }

  Player.prototype.buildBar = function () {
    const self = this;
    const bar = this.L.pbar;
    const btn = function (name, label, fn, extra) {
      return h('button', { class: 'pbtn ' + (extra || ''), type: 'button', 'aria-label': label, title: label, onclick: function () { ST.sound.play('click'); fn(); } },
        h('span', { class: 'pix', html: ST.ctrl(name, { mono: 'currentColor', px: 3 }) }));
    };
    this.bFirst = btn('first', 'First step', function () { self.go(0); });
    this.bPrev = btn('prev', 'Back one step (Left arrow)', function () { self.prev(); });
    this.bPlay = btn('play', 'Play (Space)', function () { self.toggle(); }, 'pbtn-play');
    this.bNext = btn('next', 'Next step (Right arrow)', function () { self.next(); }, 'pbtn-next');
    this.bLast = btn('last', 'Last step', function () { self.go(self.frames.length - 1); });
    this.count = h('div', { class: 'pcount', 'aria-live': 'off' }, '0/0');
    this.range = h('input', {
      type: 'range', min: 0, max: 0, value: 0, class: 'prange', 'aria-label': 'Jump to step',
      oninput: function () { self.cancelAsk(); self.pause(); self.show(Number(self.range.value)); }
    });
    this.speedBtns = {};
    const speedWrap = h('div', { class: 'pspeed', role: 'group', 'aria-label': 'Speed' });
    Object.keys(SPEEDS).forEach(function (k) {
      const b = h('button', { type: 'button', class: 'chip-btn', onclick: function () { ST.setSpeed(k); } }, SPEEDS[k].label);
      self.speedBtns[k] = b;
      speedWrap.appendChild(b);
    });
    this.bPredict = h('button', {
      type: 'button', class: 'predict-btn', 'aria-pressed': 'false',
      title: 'Predict mode: guess the next step before you see it',
      onclick: function () { ST.sound.play('click'); ST.setPredict(!ST.state.predict); }
    });
    bar.appendChild(h('div', { class: 'pbar-row' },
      h('div', { class: 'pbtns' }, this.bFirst, this.bPrev, this.bPlay, this.bNext, this.bLast),
      this.count,
      this.range
    ));
    bar.appendChild(h('div', { class: 'pbar-row pbar-row2' }, speedWrap, this.bPredict));
    this.syncButtons();
  };

  Player.prototype.syncButtons = function () {
    const self = this;
    Object.keys(this.speedBtns).forEach(function (k) {
      self.speedBtns[k].classList.toggle('on', ST.state.speed === k);
      self.speedBtns[k].setAttribute('aria-pressed', ST.state.speed === k ? 'true' : 'false');
    });
    const on = ST.state.predict;
    this.bPredict.classList.toggle('on', on);
    this.bPredict.setAttribute('aria-pressed', on ? 'true' : 'false');
    U.clear(this.bPredict);
    this.bPredict.appendChild(h('span', { class: 'pix', html: ST.ctrl('coin') }));
    this.bPredict.appendChild(h('span', null, on ? 'PREDICT: ON' : 'PREDICT: OFF'));
    const n = this.frames.length;
    this.bPrev.disabled = this.i <= 0 && this.asking < 0;
    this.bFirst.disabled = this.i <= 0 && this.asking < 0;
    this.bNext.disabled = this.i >= n - 1;
    this.bLast.disabled = this.i >= n - 1;
    this.bPlay.disabled = n <= 1;
    U.clear(this.bPlay);
    this.bPlay.appendChild(h('span', { class: 'pix', html: ST.ctrl(this.timer ? 'pause' : 'play', { mono: 'currentColor', px: 3 }) }));
    this.bPlay.setAttribute('aria-label', this.timer ? 'Pause (Space)' : 'Play (Space)');
  };

  Player.prototype.load = function (frames, render, opts) {
    opts = opts || {};
    this.pause();
    this.cancelAsk();
    this.frames = frames || [];
    if (render) this.render = render;
    this.answered = {};
    this.range.max = Math.max(0, this.frames.length - 1);
    ST.activePlayer = this;
    this.show(opts.at === 'end' ? this.frames.length - 1 : (opts.at || 0), { instant: opts.instant !== false });
  };

  Player.prototype.show = function (i, o) {
    o = o || {};
    if (!this.frames.length) return;
    i = U.clamp(i, 0, this.frames.length - 1);
    const dir = i > this.i ? 1 : (i < this.i ? -1 : 0);
    this.i = i;
    const f = this.frames[i];
    if (this.render) this.render(f, i, { dir: dir, instant: !!o.instant });
    this.count.textContent = 'STEP ' + (i + 1) + '/' + this.frames.length;
    this.range.value = i;
    this.range.style.setProperty('--pct', this.frames.length > 1 ? (i / (this.frames.length - 1) * 100) + '%' : '0%');
    this.L.setCode(f.line);
    let mood = f.mood || (i === this.frames.length - 1 && this.frames.length > 1 ? 'happy' : 'idle');
    let prefix = '';
    if (o.feedback) { prefix = o.feedback.text; mood = o.feedback.mood; }
    this.L.say(f.cap || '', mood, prefix);
    if (!o.instant && dir !== 0) {
      if (i === this.frames.length - 1 && this.frames.length > 2) ST.sound.play('done');
      else ST.sound.play(f.sound || (dir > 0 ? 'step' : 'back'));
    }
    this.syncButtons();
  };

  Player.prototype.next = function () {
    if (this.asking >= 0) return;
    if (this.i >= this.frames.length - 1) { this.pause(); return; }
    const target = this.i + 1;
    const f = this.frames[target];
    if (ST.state.predict && f.ask && !this.answered[target]) {
      this.ask(target);
      return;
    }
    this.show(target);
  };

  Player.prototype.prev = function () {
    if (this.asking >= 0) { this.cancelAsk(); this.show(this.i, { instant: true }); return; }
    this.pause();
    this.show(this.i - 1);
  };

  Player.prototype.go = function (i) {
    this.cancelAsk();
    this.pause();
    this.show(i);
  };

  Player.prototype.play = function () {
    if (this.frames.length <= 1) return;
    if (this.i >= this.frames.length - 1) this.show(0, { instant: true });
    const self = this;
    this.timer = setInterval(function () {
      if (self.asking >= 0) return;
      if (self.i >= self.frames.length - 1) { self.pause(); return; }
      self.next();
    }, SPEEDS[ST.state.speed].step);
    this.syncButtons();
  };

  Player.prototype.pause = function () {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.bPlay) this.syncButtons();
  };

  Player.prototype.toggle = function () { if (this.timer) this.pause(); else this.play(); };

  Player.prototype.cancelAsk = function () {
    if (this.asking < 0) return;
    this.asking = -1;
    if (this.L.scene) this.L.scene.setPick(null);
    this.L.clearAsk();
  };

  Player.prototype.ask = function (target) {
    const self = this;
    const f = this.frames[target];
    const q = f.ask;
    this.asking = target;
    this.syncButtons();
    function finish(correct, answerText) {
      self.answered[target] = true;
      self.asking = -1;
      if (self.L.scene) self.L.scene.setPick(null);
      self.L.clearAsk();
      if (correct) { ST.addCoins(1); ST.sound.play('good'); }
      else ST.sound.play('bad');
      self.show(target, {
        feedback: correct
          ? { text: 'Correct! +1 coin.', mood: 'happy' }
          : { text: 'Not quite. Answer: ' + answerText + '.', mood: 'oops' }
      });
    }
    if (q.pick !== undefined) {
      const ans = [].concat(q.pick);
      const among = q.among || true;
      this.L.askPick(q.q || 'Click your answer on the picture.', function skip() { finish(false, q.answerText || ans.join(', ')); });
      this.L.scene.setPick(among, function (id) {
        finish(ans.indexOf(id) >= 0, q.answerText || ans.join(', '));
      });
    } else {
      this.L.askChoice(q.q, q.options, function (k) {
        finish(k === q.answer, q.options[q.answer]);
      });
    }
  };

  Player.prototype.destroy = function () {
    this.pause();
    this.offs.forEach(function (off) { off(); });
    if (ST.activePlayer === this) ST.activePlayer = null;
  };

  // ---------------------------------------------------------------
  // Standard lab layout.
  //   cfg.vb      viewBox [w, h] for the stage
  //   cfg.side    true = show the side column
  //   cfg.player  false = no step player (free-play labs)
  //   cfg.code    array of code lines (optional)
  ST.lab = function (root, cfg) {
    cfg = cfg || {};
    const L = { root: root, panels: {} };
    L.controls = h('div', { class: 'lab-controls' });
    L.svg = ST.s('svg', { role: 'img', 'aria-label': cfg.alt || 'Visualization' });
    L.stage = h('div', { class: 'stage' + (cfg.stageClass ? ' ' + cfg.stageClass : '') }, h('div', { class: 'stage-inner', style: cfg.minW ? 'min-width:' + cfg.minW + 'px' : null }, L.svg));
    L.bubbleText = h('div', { class: 'bubble-text', 'aria-live': 'polite' });
    L.bubbleAsk = h('div', { class: 'bubble-ask' });
    L.bubbleFace = h('div', { class: 'bubble-face', html: ST.mascot('idle') });
    L.bubble = h('div', { class: 'bubble' }, L.bubbleFace, h('div', { class: 'bubble-body' }, L.bubbleText, L.bubbleAsk));
    L.pbar = h('div', { class: 'pbar' });
    L.side = h('aside', { class: 'lab-side' });
    const main = h('div', { class: 'lab-main' }, h('p', { class: 'stage-hint', 'aria-hidden': 'true' }, 'SWIPE THE PICTURE SIDEWAYS TO SEE ALL →'), L.stage, L.bubble, cfg.player === false ? null : L.pbar);
    L.grid = h('div', { class: 'lab-grid' + (cfg.side === false ? ' no-side' : '') }, main, cfg.side === false ? null : L.side);
    root.appendChild(h('div', { class: 'lab' }, L.controls, L.grid));
    L.scene = new ST.Scene(L.svg, { vb: cfg.vb || [800, 400] });

    let lastMood = 'idle';
    L.say = function (text, mood, prefix) {
      mood = mood || 'idle';
      if (mood !== lastMood) { L.bubbleFace.innerHTML = ST.mascot(mood); lastMood = mood; }
      L.bubbleText.innerHTML = (prefix ? '<span class="fb fb-' + mood + '">' + U.esc(prefix) + '</span> ' : '') + U.rich(text);
    };
    L.clearAsk = function () { U.clear(L.bubbleAsk); L.bubble.classList.remove('asking'); };
    L.askChoice = function (q, options, cb) {
      L.clearAsk();
      L.bubble.classList.add('asking');
      L.say('', 'idle');
      L.bubbleText.innerHTML = '<span class="ask-tag">PREDICT</span> ' + U.rich(q);
      options.forEach(function (opt, k) {
        L.bubbleAsk.appendChild(h('button', { type: 'button', class: 'ask-opt', onclick: function () { cb(k); } }, opt));
      });
      const first = L.bubbleAsk.querySelector('button');
      if (first) first.focus({ preventScroll: true });
    };
    L.askPick = function (q, skip) {
      L.clearAsk();
      L.bubble.classList.add('asking');
      L.bubbleText.innerHTML = '<span class="ask-tag">PREDICT</span> ' + U.rich(q);
      L.bubbleAsk.appendChild(h('button', { type: 'button', class: 'ask-opt ask-skip', onclick: skip }, 'Show me'));
    };

    // code panel
    L.codeLines = null;
    L.setCodeLines = function (lines, title) {
      if (!lines) return;
      if (!L.codePanel) {
        L.codePre = h('div', { class: 'code' });
        L.codePanel = L.panel(title || 'CODE', { cls: 'panel-code' });
        L.codePanel.appendChild(L.codePre);
      } else if (title) {
        L.codePanel.parentNode.querySelector('.panel-title').textContent = title;
      }
      U.clear(L.codePre);
      L.codeLines = lines.map(function (ln) {
        // 2-space indent keeps code narrow enough for the side panel
        ln = ln.replace(/^( +)/, function (sp) { return sp.slice(0, Math.ceil(sp.length / 2)); });
        const d = h('div', { class: 'ln' }, ln.length ? ln : ' ');
        L.codePre.appendChild(d);
        return d;
      });
    };
    L.setCode = function (line) {
      if (!L.codeLines) return;
      const set = line === undefined || line === null ? [] : [].concat(line);
      L.codeLines.forEach(function (d, k) { d.classList.toggle('hot', set.indexOf(k) >= 0); });
    };

    // side panels: L.panel('QUEUE') returns the body element
    L.panel = function (title, o) {
      o = o || {};
      const body = h('div', { class: 'panel-body' });
      const p = h('section', { class: 'panel ' + (o.cls || '') }, h('h4', { class: 'panel-title' }, title), body);
      if (o.before && L.codePanel) L.side.insertBefore(p, L.codePanel.parentNode);
      else L.side.appendChild(p);
      return body;
    };

    if (cfg.player !== false) L.player = new Player(L);
    if (cfg.code) L.setCodeLines(cfg.code, cfg.codeTitle);
    L.destroy = function () { if (L.player) L.player.destroy(); };
    return L;
  };

  // ---------------------------------------------------------------
  // Small UI builders used by labs.
  ST.ui = {
    // a labelled text input with a "Go" button
    field: function (label, value, opts) {
      opts = opts || {};
      const input = h('input', { type: 'text', value: value, class: 'inp' + (opts.small ? ' inp-sm' : ''), 'aria-label': label, spellcheck: 'false', autocomplete: 'off' });
      if (opts.onEnter) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') opts.onEnter(); });
      const wrap = h('label', { class: 'field' }, h('span', { class: 'field-lbl' }, label), input);
      return { el: wrap, input: input };
    },
    button: function (label, fn, cls) {
      return h('button', { type: 'button', class: 'btn ' + (cls || ''), onclick: function () { ST.sound.play('click'); fn(); } }, label);
    },
    // segmented control: options [{v, label}]
    seg: function (label, options, value, onChange) {
      const wrap = h('div', { class: 'seg', role: 'group', 'aria-label': label });
      const btns = [];
      if (label) wrap.appendChild(h('span', { class: 'field-lbl' }, label));
      const row = h('div', { class: 'seg-row' });
      wrap.appendChild(row);
      options.forEach(function (o) {
        const b = h('button', {
          type: 'button', class: 'seg-btn', 'aria-pressed': o.v === value ? 'true' : 'false',
          onclick: function () {
            ST.sound.play('click');
            btns.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
            onChange(o.v);
          }
        }, o.label);
        if (o.v === value) b.classList.add('on');
        btns.push(b);
        row.appendChild(b);
      });
      wrap.set = function (v) {
        options.forEach(function (o, k) { btns[k].classList.toggle('on', o.v === v); btns[k].setAttribute('aria-pressed', o.v === v ? 'true' : 'false'); });
      };
      return wrap;
    },
    select: function (label, options, value, onChange) {
      const sel = h('select', { class: 'inp sel', 'aria-label': label, onchange: function () { onChange(sel.value); } });
      options.forEach(function (o) {
        const op = h('option', { value: o.v }, o.label);
        if (o.v === value) op.selected = true;
        sel.appendChild(op);
      });
      return { el: h('label', { class: 'field' }, h('span', { class: 'field-lbl' }, label), sel), select: sel };
    },
    row: function () {
      const r = h('div', { class: 'ctl-row' });
      for (let i = 0; i < arguments.length; i++) if (arguments[i]) r.appendChild(arguments[i]);
      return r;
    },
    // horizontal list of boxes, e.g. a queue or an output order
    strip: function (items, opts) {
      opts = opts || {};
      const wrap = h('div', { class: 'strip ' + (opts.cls || '') });
      if (!items.length && opts.empty) wrap.appendChild(h('span', { class: 'strip-empty' }, opts.empty));
      items.forEach(function (it) {
        const o = typeof it === 'object' ? it : { v: it };
        wrap.appendChild(h('span', { class: 'sbox ' + (o.cls || '') }, h('span', { class: 'sbox-v' }, String(o.v)), o.tag !== undefined ? h('span', { class: 'sbox-tag' }, String(o.tag)) : null));
      });
      return wrap;
    },
    // a small table: head [..], rows [[..]], rowCls optional
    table: function (head, rows, opts) {
      opts = opts || {};
      const t = h('table', { class: 'mini ' + (opts.cls || '') });
      if (head) t.appendChild(h('thead', null, h('tr', null, head.map(function (c) { return h('th', null, c); }))));
      const tb = h('tbody');
      rows.forEach(function (r, k) {
        const cls = opts.rowCls ? opts.rowCls(r, k) : '';
        tb.appendChild(h('tr', { class: cls || null }, r.map(function (c) {
          if (c && typeof c === 'object' && !(c instanceof Node)) return h('td', { class: c.cls || null }, c.v);
          return h('td', null, c);
        })));
      });
      t.appendChild(tb);
      return t;
    },
    stat: function (label, value, cls) {
      return h('div', { class: 'stat ' + (cls || '') }, h('span', { class: 'stat-v' }, String(value)), h('span', { class: 'stat-l' }, label));
    }
  };

  ST.Player = Player;
})(window.ST);
