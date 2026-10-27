/*
  app.js — topic registry, pages (home + topic), router, keyboard.
*/
(function (ST) {
  'use strict';
  const h = ST.h;
  const U = ST.util;

  ST.topics = [];
  ST.topic = function (def) { ST.topics.push(def); ST.topics.sort(function (a, b) { return a.n - b.n; }); };
  function findTopic(id) { return ST.topics.filter(function (t) { return t.id === id; })[0]; }

  const played = ST.store.get('played', {});
  function markPlayed(tid, lid) {
    played[tid] = played[tid] || {};
    if (!played[tid][lid]) { played[tid][lid] = true; ST.store.set('played', played); }
  }
  function playedCount(t) { return Object.keys(played[t.id] || {}).filter(function (k) { return t.labs.some(function (l) { return l.id === k; }); }).length; }

  let current = { destroy: function () {} };
  // course details, set in index.html: ST.start({ course, school, term, author })
  let site = {};

  // ---------------------------------------------------------------- top bar
  function topBar() {
    const coins = h('span', { class: 'coins', title: 'Coins from Predict mode' },
      h('span', { class: 'pix', html: ST.ctrl('coin') }), h('span', { class: 'coins-n' }, String(ST.state.coins)));
    ST.on('coins', function (n) { coins.querySelector('.coins-n').textContent = String(n); coins.classList.remove('bump'); void coins.offsetWidth; coins.classList.add('bump'); });
    const soundBtn = h('button', { type: 'button', class: 'top-btn', 'aria-pressed': ST.sound.isOn() ? 'true' : 'false', onclick: function () {
      const on = ST.sound.toggle();
      soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      paintSound();
    } });
    function paintSound() {
      U.clear(soundBtn);
      const on = ST.sound.isOn();
      soundBtn.appendChild(h('span', { class: 'pix', html: ST.ctrl(on ? 'sound' : 'mute', { mono: 'currentColor', px: 2 }) }));
      soundBtn.appendChild(h('span', { class: 'top-btn-l' }, on ? 'SOUND ON' : 'SOUND OFF'));
      soundBtn.title = on ? 'Turn sound off' : 'Turn 8-bit sound on';
    }
    paintSound();
    return h('header', { class: 'topbar' },
      h('a', { class: 'logo', href: '#/' }, h('span', { class: 'logo-mark', html: ST.mascot('idle') }), h('span', { class: 'logo-t' }, 'STACK', h('i', null, '&'), 'TRACE')),
      h('nav', { class: 'topnav', 'aria-label': 'Main' },
        h('a', { href: '#/', class: 'top-link' }, 'MAP'),
        h('a', { href: '#/legend', class: 'top-link' }, 'COLORS'),
        soundBtn,
        coins)
    );
  }

  // ---------------------------------------------------------------- torn edge
  function torn(cls) { return h('div', { class: 'torn ' + (cls || ''), 'aria-hidden': 'true' }); }

  // ---------------------------------------------------------------- legend
  function legendRow() {
    const items = [
      { cls: 'cur', name: 'YELLOW', text: 'Looking at it now' },
      { cls: 'wait', name: 'BLUE, DASHED', text: 'Waiting in line' },
      { cls: 'done', name: 'TEAL', text: 'Finished / in the right place' },
      { cls: 'bad', name: 'RED', text: 'Swap, problem, or removed' }
    ];
    return h('div', { class: 'legend' }, items.map(function (it) {
      const svg = ST.s('svg', { viewBox: '0 0 64 64', class: 'legend-svg', 'aria-hidden': 'true' });
      const sc = new ST.Scene(svg, { vb: [64, 64] });
      sc.draw({ nodes: [{ id: 'x', x: 32, y: 32, label: 'A', cls: it.cls, ring: it.cls === 'wait' ? 'dash' : null, r: 20 }] }, { instant: true });
      return h('div', { class: 'legend-item' }, svg, h('div', null, h('b', null, it.name), h('span', null, it.text)));
    }));
  }

  // ---------------------------------------------------------------- home
  function homePage(app) {
    const total = ST.topics.reduce(function (n, t) { return n + t.labs.length; }, 0);
    const last = ST.store.get('last', null);
    const lastT = last && findTopic(last);

    const demoSvg = ST.s('svg', { class: 'demo-svg', role: 'img', 'aria-label': 'A small graph being explored step by step' });
    const demoCap = h('div', { class: 'demo-cap' }, '');
    const hero = h('section', { class: 'hero' },
      h('div', { class: 'hero-grid wrap' },
        h('div', { class: 'hero-copy' },
          h('p', { class: 'kicker' }, (site.course ? site.course + ' · ' : '') + 'DATA STRUCTURES & ALGORITHMS'),
          h('h1', { class: 'hero-title' }, h('span', null, 'STACK'), h('span', { class: 'amp' }, '&'), h('span', null, 'TRACE')),
          h('p', { class: 'hero-sub' }, 'Every lesson as a picture you can step through. Less reading. More watching.'),
          h('div', { class: 'hero-btns' },
            h('a', { class: 'btn btn-big btn-yellow', href: '#map', onclick: function (e) { e.preventDefault(); document.getElementById('map').scrollIntoView({ behavior: 'smooth' }); } }, '▶ PRESS START'),
            lastT ? h('a', { class: 'btn btn-big btn-paper', href: '#/t/' + lastT.id }, 'CONTINUE: ' + lastT.title.toUpperCase()) : null
          ),
          h('ul', { class: 'hero-stats' },
            h('li', null, h('b', null, String(ST.topics.length)), ' worlds'),
            h('li', null, h('b', null, String(total)), ' labs'),
            h('li', null, h('b', null, '0'), ' walls of text'))
        ),
        h('div', { class: 'hero-art' },
          h('div', { class: 'win win-hero' },
            h('div', { class: 'win-bar' }, h('span', null, 'BFS.EXE'), h('span', { class: 'win-dots' }, h('i'), h('i'), h('i'))),
            h('div', { class: 'win-body' }, demoSvg, demoCap)
          ),
          h('div', { class: 'hero-bit', html: ST.mascot('happy') })
        )
      ),
      torn('torn-paper')
    );

    const cards = ST.topics.map(function (t) {
      const done = playedCount(t);
      return h('a', { class: 'cart c-' + t.color, href: '#/t/' + t.id },
        h('div', { class: 'cart-top' },
          h('span', { class: 'cart-n' }, (t.n < 10 ? '0' : '') + t.n),
          h('span', { class: 'cart-icon', html: ST.icon(t.icon) })),
        h('h3', { class: 'cart-title' }, t.title),
        h('p', { class: 'cart-short' }, t.short),
        h('div', { class: 'cart-foot' },
          h('span', null, t.labs.length + ' LABS'),
          h('span', { class: 'cart-stars', 'aria-label': done + ' of ' + t.labs.length + ' labs opened' },
            t.labs.map(function (l, k) { return h('i', { class: k < done ? 'on' : '' }); })))
      );
    });

    const map = h('section', { class: 'map', id: 'map' },
      h('div', { class: 'wrap' },
        h('div', { class: 'map-head' },
          h('h2', { class: 'giant' }, 'WORLD', h('br'), 'MAP'),
          h('p', { class: 'map-note' }, 'Pick a topic. Watch the lesson, then try the labs.')),
        h('div', { class: 'carts' }, cards)
      )
    );

    const how = h('section', { class: 'how' },
      torn('torn-ink-top'),
      h('div', { class: 'wrap' },
        h('h2', { class: 'giant giant-light' }, 'HOW TO PLAY'),
        h('div', { class: 'how-grid' },
          howCard('1', 'WATCH', 'Pick a topic. The lesson plays itself: small moving pictures, a few words each.'),
          howCard('2', 'STEP', 'Press ▶ or the → key. Watch one small change at a time. Press ← to go back.'),
          howCard('3', 'PREDICT', 'Turn on PREDICT. Guess the next step before you see it. Earn coins.')
        ),
        h('div', { class: 'how-legend' }, h('h3', { class: 'pixel-h' }, 'THE COLOR CODE'), legendRow())
      )
    );

    const foot = footer();
    app.appendChild(hero);
    app.appendChild(map);
    app.appendChild(how);
    app.appendChild(foot);

    // tiny looping BFS demo inside the hero window
    const demo = startDemo(demoSvg, demoCap);
    return { destroy: demo };
  }

  function howCard(n, title, text) {
    return h('div', { class: 'how-card' }, h('span', { class: 'how-n' }, n), h('h3', null, title), h('p', null, text));
  }

  function footer() {
    const made = [site.course, site.school, site.term].filter(Boolean).join(', ');
    return h('footer', { class: 'foot' },
      h('div', { class: 'wrap foot-in' },
        h('span', { class: 'foot-logo', html: ST.mascot('idle') }),
        h('p', null, 'Stack & Trace — a visual study companion for Data Structures and Algorithms.' +
          (made ? ' Made for ' + made + '.' : '') + (site.author ? ' By ' + site.author + '.' : '')),
        h('p', { class: 'foot-small' }, 'Yellow CLASS RULES boxes mark this course\'s conventions (like "start at A"). The algorithms allow other choices.')
      ));
  }

  function startDemo(svg, cap) {
    const sc = new ST.Scene(svg, { vb: [360, 230] });
    const pos = { A: [40, 115], B: [130, 45], C: [130, 185], D: [230, 45], E: [230, 185], F: [320, 115] };
    const edges = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['C', 'E'], ['D', 'F'], ['E', 'F']];
    const order = [['A'], ['B', 'C'], ['D', 'E'], ['F']];
    const frames = [];
    const lvl = {};
    order.forEach(function (row, k) { row.forEach(function (v) { lvl[v] = k; }); });
    // simple frames: reveal level by level
    for (let k = 0; k <= order.length; k++) frames.push(k);
    let i = 0;
    function draw() {
      const k = frames[i];
      sc.draw({
        nodes: Object.keys(pos).map(function (v) {
          const L = lvl[v];
          return { id: v, x: pos[v][0], y: pos[v][1], label: v, r: 21, cls: L < k - 1 ? 'done' : (L === k - 1 ? 'cur' : (L === k ? 'wait' : '')), ring: L === k ? 'dash' : null, badge: L < k ? 'L' + L : null };
        }),
        edges: edges.map(function (e) { return { id: e.join(''), a: e[0], b: e[1], cls: (lvl[e[0]] < k && lvl[e[1]] < k && Math.abs(lvl[e[0]] - lvl[e[1]]) === 1) ? 'tree' : '' }; })
      });
      cap.textContent = k === 0 ? 'Start at A.' : (k <= order.length ? 'Level ' + (k - 1) + ': ' + order[k - 1].join(', ') : '');
      i = (i + 1) % frames.length;
    }
    draw();
    const timer = setInterval(draw, 1300);
    return function () { clearInterval(timer); };
  }

  // ---------------------------------------------------------------- legend page
  function legendPage(app) {
    app.appendChild(h('section', { class: 'band c-blue' },
      h('div', { class: 'wrap' },
        h('a', { class: 'back', href: '#/' }, '← MAP'),
        h('h1', { class: 'band-title' }, 'The color code'),
        h('p', { class: 'band-sub' }, 'Every lab uses the same colors. Learn them once.')),
      torn('torn-paper')));
    app.appendChild(h('section', { class: 'wrap pad' },
      legendRow(),
      h('div', { class: 'keys' },
        h('h3', { class: 'pixel-h' }, 'KEYBOARD'),
        ST.ui.table(['Key', 'What it does'], [['→', 'Next step'], ['←', 'Back one step'], ['Space', 'Play / pause'], ['Home / End', 'First / last step']])
      )));
    app.appendChild(footer());
    return { destroy: function () {} };
  }

  // ---------------------------------------------------------------- topic page
  function topicPage(app, t, labId) {
    ST.store.set('last', t.id);
    const idx = ST.topics.indexOf(t);
    const prevT = ST.topics[idx - 1], nextT = ST.topics[idx + 1];
    let lab = t.labs.filter(function (l) { return l.id === labId; })[0] || t.labs[0];

    const band = h('section', { class: 'band c-' + t.color },
      h('div', { class: 'wrap band-grid' },
        h('div', null,
          h('a', { class: 'back', href: '#/' }, '← MAP'),
          h('div', { class: 'band-meta' }, h('span', { class: 'chip' }, 'WORLD ' + t.n)),
          h('h1', { class: 'band-title' }, t.title),
          h('p', { class: 'band-sub' }, t.blurb)),
        h('div', { class: 'band-icon', html: ST.icon(t.icon) })
      ),
      torn('torn-paper'));

    const lesson = ST.lessonView(t);

    const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Labs' });
    const winTitle = h('span', null, '');
    const labHost = h('div', { class: 'win-body lab-host' });
    const labWin = h('div', { class: 'win win-lab' },
      h('div', { class: 'win-bar' }, winTitle, h('span', { class: 'win-dots' }, h('i'), h('i'), h('i'))),
      labHost);
    let labInst = null;

    function openLab(l, push) {
      if (labInst && labInst.destroy) labInst.destroy();
      lab = l;
      U.clear(labHost);
      Array.prototype.forEach.call(tabs.children, function (b) {
        const on = b.getAttribute('data-id') === l.id;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      winTitle.textContent = 'LAB ' + (t.labs.indexOf(l) + 1) + ' — ' + l.title.toUpperCase();
      labInst = l.setup(labHost) || {};
      markPlayed(t.id, l.id);
      if (push) history.replaceState(null, '', '#/t/' + t.id + '/' + l.id);
    }
    t.labs.forEach(function (l, k) {
      tabs.appendChild(h('button', {
        type: 'button', role: 'tab', class: 'tab', 'data-id': l.id,
        onclick: function () { ST.sound.play('click'); openLab(l, true); }
      }, h('span', { class: 'tab-n' }, String(k + 1)), h('span', null, l.title), l.tag ? h('span', { class: 'tab-tag' }, l.tag) : null));
    });

    const labs = h('section', { class: 'wrap labs' },
      h('h2', { class: 'pixel-h' }, 'LABS'),
      tabs,
      labWin);

    const extra = h('section', { class: 'wrap extra' },
      t.cheat ? h('div', { class: 'cheat' }, h('h3', { class: 'pixel-h' }, 'CHEAT SHEET'), ST.ui.table(t.cheat.head, t.cheat.rows, { cls: 'cheat-t' })) : null
    );

    const nav = h('nav', { class: 'wrap topic-nav', 'aria-label': 'Topics' },
      prevT ? h('a', { class: 'btn btn-paper', href: '#/t/' + prevT.id }, '← ' + prevT.title) : h('span'),
      nextT ? h('a', { class: 'btn btn-yellow', href: '#/t/' + nextT.id }, nextT.title + ' →') : h('a', { class: 'btn btn-yellow', href: '#/' }, 'Back to map'));

    app.appendChild(band);
    if (lesson.el) app.appendChild(lesson.el);
    const rules = ST.rulesView(t);
    if (rules) app.appendChild(rules);
    app.appendChild(labs);
    app.appendChild(extra);
    app.appendChild(nav);
    app.appendChild(footer());
    openLab(lab, false);
    return { destroy: function () { lesson.destroy(); if (labInst && labInst.destroy) labInst.destroy(); } };
  }

  // ---------------------------------------------------------------- router
  function route() {
    const app = document.getElementById('app');
    if (current && current.destroy) current.destroy();
    ST.activePlayer = null;
    U.clear(app);
    const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    if (parts[0] === 't' && findTopic(parts[1])) {
      const t = findTopic(parts[1]);
      document.title = t.title + ' · Stack & Trace';
      current = topicPage(app, t, parts[2]);
    } else if (parts[0] === 'legend') {
      document.title = 'Colors · Stack & Trace';
      current = legendPage(app);
    } else {
      document.title = 'Stack & Trace · DSA visual labs';
      current = homePage(app);
    }
    window.scrollTo(0, 0);
  }

  function keys(e) {
    const p = ST.activePlayer;
    if (!p) return;
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); p.pause(); p.next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); p.prev(); }
    else if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); p.toggle(); }
    else if (e.key === 'Home') { e.preventDefault(); p.go(0); }
    else if (e.key === 'End') { e.preventDefault(); p.go(p.frames.length - 1); }
  }

  ST.start = function (cfg) {
    site = cfg || {};
    document.body.insertBefore(topBar(), document.body.firstChild);
    window.addEventListener('hashchange', function () {
      const parts = (location.hash || '').replace(/^#\/?/, '').split('/');
      if (parts[0] === 'map' || location.hash === '#map') return;
      route();
    });
    document.addEventListener('keydown', keys);
    route();
  };
})(window.ST);
