/*
  sound.js — optional 8-bit blips made with the Web Audio API.
  Sound is OFF by default (classrooms can be loud enough).
*/
(function (ST) {
  'use strict';

  let ctx = null;
  let enabled = ST.store.get('sound', false);

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    const a = audio();
    if (!a) return;
    const t0 = a.currentTime + start;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.05, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const SOUNDS = {
    step: function () { tone(660, 0, 0.05, 'square', 0.03); },
    back: function () { tone(440, 0, 0.05, 'square', 0.03); },
    swap: function () { tone(520, 0, 0.05); tone(780, 0.05, 0.06); },
    good: function () { tone(660, 0, 0.07); tone(880, 0.07, 0.07); tone(1320, 0.14, 0.12); },
    bad: function () { tone(220, 0, 0.12, 'sawtooth', 0.04); tone(165, 0.1, 0.16, 'sawtooth', 0.04); },
    done: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.08, 0.1); }); },
    click: function () { tone(990, 0, 0.025, 'square', 0.025); }
  };

  ST.sound = {
    play: function (name) {
      if (!enabled || !SOUNDS[name]) return;
      try { SOUNDS[name](); } catch (e) { /* ignore */ }
    },
    isOn: function () { return enabled; },
    toggle: function () {
      enabled = !enabled;
      ST.store.set('sound', enabled);
      if (enabled) SOUNDS.click();
      ST.emit('sound', enabled);
      return enabled;
    }
  };
})(window.ST);
