/*
  pixel.js — pixel-art icons and the mascot "Bit".
  Each picture is a list of text rows. One letter = one pixel colour.
*/
(function (ST) {
  'use strict';

  const COLORS = {
    k: 'var(--ink)', w: '#ffffff', y: 'var(--yellow)', r: 'var(--red)',
    b: 'var(--blue)', t: 'var(--teal)', o: 'var(--orange)', g: 'var(--grey)',
    n: 'var(--navy)', p: 'var(--paper)', s: 'var(--sky)'
  };

  // Turn rows of letters into an SVG string. Runs of the same colour
  // in a row become one rectangle, so the SVG stays small.
  function pixel(rows, opts) {
    opts = opts || {};
    const hgt = rows.length;
    let wid = 0;
    rows.forEach(function (r) { wid = Math.max(wid, r.length); });
    let rects = '';
    rows.forEach(function (row, y) {
      let x = 0;
      while (x < row.length) {
        const c = row[x];
        if (c === '.' || c === ' ') { x++; continue; }
        let run = 1;
        while (x + run < row.length && row[x + run] === c) run++;
        const fill = (opts.mono && c !== 'w') ? opts.mono : (COLORS[c] || c);
        rects += '<rect x="' + x + '" y="' + y + '" width="' + run + '" height="1" fill="' + fill + '"/>';
        x += run;
      }
    });
    const cls = opts.cls ? ' class="' + opts.cls + '"' : '';
    let size = opts.size ? ' width="' + opts.size + '" height="' + Math.round(opts.size * hgt / wid) + '"' : '';
    if (opts.px) size = ' width="' + wid * opts.px + '" height="' + hgt * opts.px + '"';
    return '<svg' + cls + size + ' viewBox="0 0 ' + wid + ' ' + hgt + '" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + rects + '</svg>';
  }

  const ICONS = {
    basics: [
      '............',
      '............',
      'kkkkkkkkkkkk',
      'kyykwwkwwkwk',
      'kyykwwkwwkwk',
      'kyykwwkwwkwk',
      'kkkkkkkkkkkk',
      '............',
      '.kk.........',
      'kkkk........',
      '.kk.........',
      '............'
    ],
    search: [
      '...kkkk.....',
      '..kwwwwk....',
      '.kwyywwwk...',
      '.kwywwwwk...',
      '.kwwwwwwk...',
      '.kwwwwwwk...',
      '..kwwwwk....',
      '...kkkkkk...',
      '.......kkk..',
      '........kkk.',
      '.........kkk',
      '..........k.'
    ],
    stackqueue: [
      '............',
      '...kkkkkk...',
      '...kyyyyk...',
      '...kkkkkk...',
      '...kttttk...',
      '...kkkkkk...',
      '...krrrrk...',
      '...kkkkkk...',
      '...kbbbbk...',
      '...kkkkkk...',
      '..kkkkkkkk..',
      '............'
    ],
    linkedlist: [
      '............',
      '............',
      '............',
      'kkkk....kkkk',
      'kyyk....kttk',
      'kyykkkk.kttk',
      'kyykkkkkkttk',
      'kyykkkk.kttk',
      'kyyk....kttk',
      'kkkk....kkkk',
      '............',
      '............'
    ],
    sorting: [
      '............',
      '..........kk',
      '..........kk',
      '.......kk.kk',
      '.......kk.kk',
      '....kk.kk.kk',
      '....kk.kk.kk',
      '.kk.kk.kk.kk',
      '.kk.kk.kk.kk',
      '.kk.kk.kk.kk',
      'kkkkkkkkkkkk',
      '............'
    ],
    recursion: [
      'kkkkkkkkkkkk',
      'kwwwwwwwwwwk',
      'kwkkkkkkkkwk',
      'kwkyyyyyykwk',
      'kwkykkkkykwk',
      'kwkykrrkykwk',
      'kwkykrrkykwk',
      'kwkykkkkykwk',
      'kwkyyyyyykwk',
      'kwkkkkkkkkwk',
      'kwwwwwwwwwwk',
      'kkkkkkkkkkkk'
    ],
    trees: [
      '....kkkk....',
      '....kyyk....',
      '....kkkk....',
      '...k....k...',
      '..k......k..',
      'kkkk....kkkk',
      'kttk....kttk',
      'kkkk....kkkk',
      '.k..k...k..k',
      'kkk.kkk.kkk.',
      'kwk.kwk.kwk.',
      'kkk.kkk.kkk.'
    ],
    heaps: [
      '.....kk.....',
      '....kyyk....',
      '....kyyk....',
      '...kkkkkk...',
      '...kttttk...',
      '..kkkkkkkk..',
      '..kttkkttk..',
      '.kkkkkkkkkk.',
      '.kwwkwwkwwk.',
      'kkkkkkkkkkkk',
      'kwwkwwkwwkwk',
      'kkkkkkkkkkkk'
    ],
    hashing: [
      '...kk...kk..',
      '...kk...kk..',
      'kkkkkkkkkkkk',
      'kkkkkkkkkkkk',
      '..kk...kk...',
      '..kk...kk...',
      '..kk...kk...',
      'kkkkkkkkkkkk',
      'kkkkkkkkkkkk',
      '.kk...kk....',
      '.kk...kk....',
      '............'
    ],
    graphs: [
      'kkk.......kk',
      'kyk......kk.',
      'kkkk....kk..',
      '...kk..kk...',
      '....kkkk....',
      '....ktkk....',
      '....kkkk....',
      '...kk..kk...',
      '..kk....kkkk',
      'kkk......kwk',
      'kwk......kkk',
      'kkk.........'
    ],
    weighted: [
      'kkk.........',
      'kyk.........',
      'kkkkk.......',
      '...kkkk.....',
      '.....kkkkkkk',
      '.......kk.kk',
      '.rrr....k.kk',
      '.r......k...',
      '.rrr...kkk..',
      '...r...kwk..',
      '.rrr...kkk..',
      '............'
    ],
    greedy: [
      '...kkkkkk...',
      '..kyyyyyyk..',
      '.kyyyyyyyyk.',
      'kyyykkkkyyyk',
      'kyykyyyyyyyk',
      'kyykyyyyyyyk',
      'kyykyykkkyyk',
      'kyykyyyykyyk',
      'kyyykkkkyyyk',
      '.kyyyyyyyyk.',
      '..kyyyyyyk..',
      '...kkkkkk...'
    ]
  };

  const MASCOT = {
    idle: [
      '......kk......',
      '......ky......',
      '.....kkkk.....',
      '..kkkkkkkkkk..',
      '..kyyyyyyyyk..',
      '..kywwyywwyk..',
      '..kywkyywkyk..',
      '..kyyyyyyyyk..',
      '..kyyykkyyyk..',
      '..kyyyyyyyyk..',
      '..kkkkkkkkkk..',
      '...kk....kk...',
      '...kk....kk...',
      '..kkk....kkk..'
    ],
    happy: [
      '......kk......',
      '......ky......',
      '.....kkkk.....',
      '..kkkkkkkkkk..',
      '..kyyyyyyyyk..',
      '..kykkyykkyk..',
      '..kyyyyyyyyk..',
      '..kykyyyykyk..',
      '..kyykkkkyyk..',
      '..kyyyyyyyyk..',
      '..kkkkkkkkkk..',
      'k..kk....kk..k',
      '.kkkk....kkkk.',
      '..kkk....kkk..'
    ],
    oops: [
      '......kk......',
      '......kr......',
      '.....kkkk.....',
      '..kkkkkkkkkk..',
      '..kyyyyyyyyk..',
      '..kywwyywwyk..',
      '..kywkyykwyk..',
      '..kyyyyyyyyk..',
      '..kyyykkyyyk..',
      '..kyykyykyyk..',
      '..kkkkkkkkkk..',
      '...kk....kk...',
      '...kk....kk...',
      '..kkk....kkk..'
    ]
  };

  const CONTROLS = {
    first: ['k....k.k', 'k...kk.k', 'k..kkk.k', 'k.kkkk.k', 'k..kkk.k', 'k...kk.k', 'k....k.k'],
    prev: ['....k.k', '...kk.k', '..kkk.k', '.kkkk.k', '..kkk.k', '...kk.k', '....k.k'],
    play: ['k......', 'kkk....', 'kkkkk..', 'kkkkkkk', 'kkkkk..', 'kkk....', 'k......'],
    pause: ['kk..kk', 'kk..kk', 'kk..kk', 'kk..kk', 'kk..kk', 'kk..kk', 'kk..kk'],
    next: ['k.k....', 'k.kk...', 'k.kkk..', 'k.kkkk.', 'k.kkk..', 'k.kk...', 'k.k....'],
    last: ['k.k....k', 'k.kk...k', 'k.kkk..k', 'k.kkkk.k', 'k.kkk..k', 'k.kk...k', 'k.k....k'],
    reset: ['..kkk..', '.k...k.', 'k......', 'k...kkk', 'k....kk', '.k...k.', '..kkk..'],
    sound: ['...k...', '..kk.k.', 'kkkk..k', 'kkkk..k', 'kkkk..k', '..kk.k.', '...k...'],
    mute: ['...k...', '..kk...', 'kkkk.k.k', 'kkkk..k.', 'kkkk.k.k', '..kk...', '...k...'],
    coin: ['..kkk..', '.kyyyk.', 'kyykyyk', 'kyykyyk', 'kyykyyk', '.kyyyk.', '..kkk..'],
    star: ['...k...', '...k...', 'kkkkkkk', '.kkkkk.', '..kkk..', '.kk.kk.', 'k.....k'],
    arrowL: ['...k...', '..kk...', '.kkkkkk', 'kkkkkkk', '.kkkkkk', '..kk...', '...k...'],
    arrowR: ['...k...', '...kk..', 'kkkkkk.', 'kkkkkkk', 'kkkkkk.', '...kk..', '...k...']
  };

  ST.pixel = pixel;
  ST.icon = function (name, opts) { return pixel(ICONS[name] || ICONS.basics, opts); };
  ST.mascot = function (mood, opts) { return pixel(MASCOT[mood] || MASCOT.idle, opts); };
  ST.ctrl = function (name, opts) { return pixel(CONTROLS[name], opts); };
})(window.ST);
