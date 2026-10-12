'use strict';
/* =========================================================================
 * js/audio.js — every sound is synthesised at runtime.
 *
 * There is not one audio file in this project.  The coin drop, the gantry
 * servo, the claw's solenoid, the slip and the fanfare are all oscillators and
 * filtered noise built on demand; the arcade theme is a small step sequencer
 * driving the same primitives.  Browsers refuse to start audio before a user
 * gesture, which is what the title screen's INSERT COIN button is for.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};

  var ctx = null, master = null, sfxGain = null, musicGain = null;
  var motor = null, motorGain = null, motorTarget = 0;
  var musicTimer = null, musicStep = 0;
  var enabledSfx = true, enabledMusic = true;

  function now() { return ctx ? ctx.currentTime : 0; }

  function init() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.9;
    sfxGain.connect(master);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0;
    musicGain.connect(master);

    /* the gantry servo: a sawtooth whose pitch tracks how fast it is moving */
    motor = ctx.createOscillator();
    motor.type = 'sawtooth';
    motor.frequency.value = 46;
    var mf = ctx.createBiquadFilter();
    mf.type = 'lowpass';
    mf.frequency.value = 420;
    mf.Q.value = 6;
    motorGain = ctx.createGain();
    motorGain.gain.value = 0;
    motor.connect(mf); mf.connect(motorGain); motorGain.connect(sfxGain);
    try { motor.start(); } catch (e) {}
    return ctx;
  }

  /* Must be called from a user-gesture handler. Autoplay policies keep a
   * context suspended until then, and a resume() scheduled on a later frame
   * does not count. Music waits until the context is actually running so the
   * sequencer does not pile notes onto a frozen clock. */
  function resume() {
    init();
    if (!ctx) return null;
    var pending = null;
    if (ctx.state === 'suspended') {
      try { pending = ctx.resume(); } catch (e) { pending = null; }
    }
    var arm = function () {
      if (ctx && ctx.state === 'running' && enabledMusic) startMusic();
    };
    if (ctx.state === 'running') arm();
    else if (pending && typeof pending.then === 'function') pending.then(arm).catch(function () {});
    return pending;
  }

  /* ---- primitives -------------------------------------------------------- */

  function tone(freq, dur, type, gain, when, glideTo, filter) {
    if (!ctx || !enabledSfx) return;
    var t0 = (when === undefined ? now() : when);
    var o = ctx.createOscillator();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t0 + dur);
    var g = ctx.createGain();
    var peak = gain === undefined ? 0.18 : gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    var node = o;
    if (filter) {
      var f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.value = filter.freq || 1200;
      f.Q.value = filter.q || 1;
      o.connect(f); node = f;
    }
    node.connect(g); g.connect(sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
    return o;
  }

  function noise(dur, gain, when, filterFreq, type, sweepTo) {
    if (!ctx || !enabledSfx) return;
    var t0 = (when === undefined ? now() : when);
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.setValueAtTime(filterFreq || 900, t0);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);
    f.Q.value = 1.1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain === undefined ? 0.16 : gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* ---- the sound effects ------------------------------------------------- */

  var SFX = {
    coin: function () {
      var t = now();
      tone(1180, 0.07, 'square', 0.14, t);
      tone(1760, 0.16, 'square', 0.12, t + 0.055);
      noise(0.10, 0.10, t, 2600, 'highpass');
    },
    click: function () { tone(660, 0.05, 'square', 0.10); tone(330, 0.07, 'triangle', 0.07, now() + 0.03); },
    back: function () { tone(420, 0.08, 'square', 0.09); tone(280, 0.10, 'square', 0.07, now() + 0.05); },
    move: function () { tone(220, 0.03, 'square', 0.035); },
    servo: function () { tone(880, 0.30, 'sawtooth', 0.05, now(), 1400, { type: 'lowpass', freq: 2600, q: 3 }); },
    close: function () {
      var t = now();
      tone(1400, 0.34, 'sawtooth', 0.06, t, 320, { type: 'lowpass', freq: 2000, q: 4 });
      noise(0.16, 0.13, t + 0.30, 420, 'lowpass');
      tone(120, 0.14, 'triangle', 0.16, t + 0.31, 70);
    },
    grab: function () {
      var t = now();
      noise(0.09, 0.15, t, 300, 'lowpass');
      tone(180, 0.16, 'triangle', 0.16, t + 0.02, 110);
      tone(880, 0.10, 'square', 0.07, t + 0.05);
    },
    empty: function () { tone(200, 0.16, 'square', 0.10, now(), 120); noise(0.10, 0.07, now(), 500); },
    slip: function () {
      var t = now();
      tone(760, 0.30, 'sawtooth', 0.13, t, 180, { type: 'lowpass', freq: 1600, q: 3 });
      noise(0.22, 0.16, t + 0.10, 1400, 'bandpass', 260);
    },
    plop: function () { tone(140, 0.20, 'triangle', 0.17, now(), 70); noise(0.14, 0.11, now(), 380, 'lowpass'); },
    drop: function () { tone(90, 0.22, 'triangle', 0.20, now(), 55); noise(0.16, 0.14, now(), 320, 'lowpass'); },
    win: function () {
      var t = now();
      var notes = [523, 659, 784, 1046, 1318];
      for (var i = 0; i < notes.length; i++) tone(notes[i], 0.30, 'square', 0.13, t + i * 0.075);
      tone(1568, 0.55, 'triangle', 0.10, t + 0.40);
      noise(0.9, 0.05, t + 0.40, 3000, 'highpass');
    },
    lose: function () {
      var t = now();
      tone(392, 0.22, 'square', 0.11, t);
      tone(311, 0.34, 'square', 0.10, t + 0.18);
      tone(233, 0.55, 'triangle', 0.10, t + 0.36);
    },
    trophy: function () {
      var t = now();
      var n = [880, 1174, 1568, 2093];
      for (var i = 0; i < n.length; i++) tone(n[i], 0.42, 'triangle', 0.12, t + i * 0.06);
      tone(2637, 0.7, 'sine', 0.08, t + 0.26);
    },
    buy: function () {
      var t = now();
      tone(880, 0.08, 'square', 0.12, t);
      tone(1320, 0.14, 'square', 0.11, t + 0.07);
      noise(0.08, 0.08, t, 4000, 'highpass');
    },
    nope: function () { tone(160, 0.14, 'square', 0.13); tone(120, 0.20, 'square', 0.11, now() + 0.12); },
    whoosh: function () { noise(0.34, 0.10, now(), 260, 'bandpass', 2400); },
    tick: function () { tone(1500, 0.02, 'square', 0.05); }
  };

  function play(name, opt) {
    if (!enabledSfx) return;
    if (!ctx) init();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try { ctx.resume(); } catch (e) {}
    }
    var fn = SFX[name];
    if (fn) fn(opt);
  }

  /* ---- the gantry servo -------------------------------------------------- */

  function setMotor(speed, kind) {
    if (!ctx) return;
    motorTarget = Math.max(0, Math.min(1, speed));
    var f = kind === 'winch' ? 62 : 46;
    try {
      motor.frequency.setTargetAtTime(f + motorTarget * 74, ctx.currentTime, 0.05);
      motorGain.gain.setTargetAtTime(motorTarget * 0.055, ctx.currentTime, 0.06);
    } catch (e) {}
  }

  /* ---- the theme -------------------------------------------------------- *
   * A 16-step arcade loop: a walking bass, a bright lead and a hat.  It is
   * intentionally cheap and cheerful, the way an arcade cabinet is.         */
  var LEAD = [0, 7, 12, 7, 3, 10, 15, 10, 5, 12, 17, 12, 7, 14, 19, 14];
  var BASS = [0, 0, 7, 0, 3, 3, 10, 3, 5, 5, 12, 5, 7, 7, 14, 7];
  var ROOT = 196;                       // G3

  function midi(semi) { return ROOT * Math.pow(2, semi / 12); }

  function tickMusic() {
    if (!ctx || !enabledMusic) return;
    var t = now();
    var s = musicStep % 16;
    var bar = Math.floor(musicStep / 16) % 4;
    var lead = midi(LEAD[s] + (bar === 3 ? -5 : 0));
    var bass = midi(BASS[s] - 12);

    musicNote(bass, 0.20, 'triangle', 0.30, t);
    if (s % 2 === 0) musicNote(lead, 0.14, 'square', 0.11, t);
    if (s % 4 === 2) musicNote(lead * 2, 0.09, 'square', 0.05, t);
    if (s % 2 === 1) musicNoise(0.03, 0.035, t);
    if (s % 8 === 0) musicNoise(0.12, 0.07, t, 200);
    musicStep++;
  }

  function musicNote(freq, dur, type, gain, t0) {
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  function musicNoise(dur, gain, t0, freq) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = freq ? 'lowpass' : 'highpass';
    f.frequency.value = freq || 6000;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(musicGain);
    src.start(t0); src.stop(t0 + dur + 0.01);
  }

  function startMusic() {
    if (!enabledMusic || musicTimer || !ctx || ctx.state !== 'running') return;
    musicGain.gain.setTargetAtTime(0.55, ctx.currentTime, 1.2);
    musicTimer = setInterval(tickMusic, 145);        // ~103 BPM in sixteenths
  }

  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (ctx) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  }

  function setMusic(on) {
    enabledMusic = !!on;
    if (!ctx) return;
    if (on) { startMusic(); }
    else { stopMusic(); }
  }

  function setSfx(on) {
    enabledSfx = !!on;
    if (ctx) sfxGain.gain.setTargetAtTime(on ? 0.9 : 0, ctx.currentTime, 0.05);
  }

  NS.Audio = {
    init: init,
    resume: resume,
    play: play,
    setMotor: setMotor,
    music: setMusic,
    sound: setSfx,
    stopMusic: stopMusic,
    isSfxOn: function () { return enabledSfx; },
    isMusicOn: function () { return enabledMusic; },
    _sfx: SFX
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = NS.Audio;
})(typeof globalThis !== 'undefined' ? globalThis : this);
