'use strict';
/* =========================================================================
 * js/screens.js — every piece of interface that is not the cabinet itself.
 *
 * The play HUD, the arcade floor, the 252-entry collection book, the shop, the
 * trophy case, the result card and the pause menu.  All of it is canvas 2-D:
 * rounded panels, neon edges, and the same procedural prize art the machine
 * uses, so a prize looks identical in the cabinet and in the book.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C, ART = NS.ART, LAYOUT = NS.LAYOUT;
  var TAU = Math.PI * 2;

  var DISPLAY = '"Arial Black", Impact, "Microsoft JhengHei", "PingFang TC", sans-serif';
  var BODY = '"Segoe UI", "Microsoft JhengHei", "PingFang TC", Arial, sans-serif';
  var MONO = 'ui-monospace, Consolas, "Courier New", monospace';

  var THEME = {
    ink: '#020202',
    panel: '#242832',
    panel2: '#171a21',
    edge: '#020202',
    edgeHot: '#FEC82A',
    text: '#FDFEFD',
    dim: '#9BA6B4',
    dimmer: '#6C7789',
    gold: '#FEC82A',
    green: '#AAD387',
    red: '#F389A0',
    blue: '#6AC9CD',
    teal: '#6AC9CD',
    pink: '#F389A0',
    purple: '#C099C6',
    lime: '#A3FF61',
    mint: '#73FFC7',
    lilac: '#C491FF',
    neonPink: '#FF6BD4'
  };
  /* Rarity reads as the toy line's own colour coding: the further up the line
   * a monster is, the more saturated its card gets. */
  var RARITY_TINT = {
    common: '#9BA6B4', uncommon: '#AAD387', rare: '#6AC9CD',
    epic: '#C099C6', legend: '#FEC82A'
  };

  /* ---------------- small toolkit ---------------------------------------- */

  function font(ctx, size, weight, family) {
    ctx.font = (weight || 700) + ' ' + size + 'px ' + (family || BODY);
  }

  function text(ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.weight || 600) + ' ' + (o.size || 16) + 'px ' + (o.family || BODY);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.blur || 12; }
    ctx.fillStyle = o.color || THEME.text;
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /* Panels and buttons are stickers: a flat fill, a heavy black outline and a
   * hard offset shadow.  No gradients, no glows — that is the whole look.    */
  function inkStroke(ctx, x, y, w, h, r, lw) {
    roundRectPath(ctx, x + lw / 2, y + lw / 2, w - lw, h - lw, Math.max(0, r - lw / 2));
    ctx.strokeStyle = THEME.ink;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function panel(ctx, x, y, w, h, o) {
    o = o || {};
    var r = o.r === undefined ? 14 : o.r;
    var lw = o.edgeWidth === undefined ? 3 : o.edgeWidth;
    if (o.shadow !== false) {
      roundRectPath(ctx, x + 5, y + 6, w, h, r);
      ctx.fillStyle = 'rgba(2,2,2,.45)';
      ctx.fill();
    }
    roundRectPath(ctx, x, y, w, h, r);
    ctx.fillStyle = o.flat || THEME.panel;
    ctx.fill();
    if (o.edge !== false) inkStroke(ctx, x, y, w, h, r, lw);
    if (o.glow) {
      roundRectPath(ctx, x + 1, y + 1, w - 2, h - 2, r);
      ctx.save();
      ctx.strokeStyle = o.glow;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }
    if (o.title || o.titleZh) {
      var label = o.titleZh || o.title;
      /* a coloured tab across the top, like a sticker header */
      ctx.save();
      roundRectPath(ctx, x, y, w, 34, r);
      ctx.clip();
      ctx.fillStyle = o.tab || THEME.gold;
      ctx.fillRect(x, y, w, 34);
      ctx.restore();
      roundRectPath(ctx, x, y, w, 34, r);
      ctx.strokeStyle = THEME.ink;
      ctx.lineWidth = lw;
      ctx.stroke();
      text(ctx, label, x + w / 2, y + 23, {
        size: 15, weight: 900, family: DISPLAY, align: 'center', color: THEME.ink
      });
    }
  }

  function button(ctx, r, label, o) {
    o = o || {};
    var hot = o.hot, dis = o.disabled;
    var rad = o.r === undefined ? 10 : o.r;
    var lw = o.lw === undefined ? 3 : o.lw;
    var fill = dis ? '#3A3F4A' : (hot ? THEME.gold : (o.fill || '#FDFEFD'));
    ctx.save();
    roundRectPath(ctx, r.x + 4, r.y + 5, r.w, r.h, rad);
    ctx.fillStyle = 'rgba(2,2,2,.45)';
    ctx.fill();
    roundRectPath(ctx, r.x, r.y, r.w, r.h, rad);
    ctx.fillStyle = fill;
    ctx.fill();
    inkStroke(ctx, r.x, r.y, r.w, r.h, rad, lw);
    ctx.restore();
    text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + (o.size || 15) * 0.36, {
      size: o.size || 15, weight: 900, family: DISPLAY, align: 'center',
      color: dis ? '#8A9099' : (hot ? THEME.ink : (o.color || THEME.ink))
    });
  }

  function stars(ctx, n, x, y, size, colour) {
    for (var i = 0; i < 5; i++) {
      ctx.save();
      ctx.translate(x + i * (size * 1.7), y);
      ctx.beginPath();
      for (var k = 0; k < 10; k++) {
        var rr = (k % 2 === 0) ? size : size * 0.44;
        var a = (k / 10) * TAU - Math.PI / 2;
        var px = Math.cos(a) * rr, py = Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = i < n ? (colour || THEME.gold) : 'rgba(255,255,255,.13)';
      ctx.fill();
      ctx.restore();
    }
  }

  function bar(ctx, x, y, w, h, frac, colA, colB, o) {
    o = o || {};
    ctx.save();
    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = o.track || 'rgba(0,0,0,.45)';
    ctx.fill();
    ctx.save();
    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.clip();
    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, colA);
    g.addColorStop(1, colB || colA);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
    ctx.restore();
    roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, h / 2);
    ctx.strokeStyle = o.edge || 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function wrap(ctx, str, x, y, maxW, lineH, o) {
    o = o || {};
    ctx.save();
    ctx.font = (o.weight || 600) + ' ' + (o.size || 14) + 'px ' + (o.family || BODY);
    var words = String(str).split(/(\s+)/);
    var line = '', lines = [];
    for (var i = 0; i < words.length; i++) {
      var probe = line + words[i];
      if (ctx.measureText(probe).width > maxW && line) { lines.push(line); line = words[i].trim(); }
      else line = probe;
    }
    if (line.trim()) lines.push(line);
    /* CJK has no spaces: fall back to per-character wrapping */
    if (lines.length === 1 && ctx.measureText(lines[0]).width > maxW) {
      lines = []; line = '';
      for (var j = 0; j < str.length; j++) {
        if (ctx.measureText(line + str[j]).width > maxW) { lines.push(line); line = ''; }
        line += str[j];
      }
      if (line) lines.push(line);
    }
    ctx.restore();
    for (var k = 0; k < lines.length; k++) {
      text(ctx, lines[k], x, y + k * lineH, o);
    }
    return lines.length;
  }

  function prizeIcon(ctx, prize, cx, cy, r, o) {
    o = o || {};
    if (!prize) return;
    if (o.dim) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.filter = 'grayscale(1) brightness(0.55)';
      ART.draw(ctx, prize, cx, cy, r, { t: o.t || 0, phase: o.phase || 0, shadow: false });
      ctx.filter = 'none';
      ctx.restore();
      return;
    }
    ART.draw(ctx, prize, cx, cy, r, { t: o.t || 0, phase: o.phase || 0, shadow: false });
  }

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  /* ---------------- the shared page frame -------------------------------- */

  function page(ctx, game, titleEn, titleZh, subtitle) {
    var g = ctx.createLinearGradient(0, 0, 0, C.GAME_H);
    g.addColorStop(0, '#20242E');
    g.addColorStop(0.5, '#151820');
    g.addColorStop(1, '#0C0E13');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);

    /* a faint halftone, like the backing card of a blister pack */
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = THEME.lilac;
    for (var hy = 0; hy < C.GAME_H; hy += 22) {
      for (var hx = (hy / 22 % 2) * 11; hx < C.GAME_W; hx += 22) {
        ctx.beginPath();
        ctx.arc(hx, hy, 2.2, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();

    /* header: a flat FURI band with an ink rule under it */
    ctx.fillStyle = '#FDFEFD';
    ctx.fillRect(0, 0, C.GAME_W, 66);
    ctx.fillStyle = THEME.ink;
    ctx.fillRect(0, 66, C.GAME_W, 4);
    /* the mini crown wordmark, so every menu is on-brand */
    ART.wordmark(ctx, 96, 33, 150);

    text(ctx, game.T(titleEn), 196, 43, {
      size: 26, weight: 900, family: DISPLAY, color: THEME.ink
    });
    if (titleZh) {
      text(ctx, game.T(titleZh), C.GAME_W / 2, 43, {
        size: 22, weight: 900, family: DISPLAY, align: 'center', color: THEME.pink });
    }
    if (subtitle) {
      text(ctx, subtitle, C.GAME_W / 2, 59, { size: 11.5, weight: 700, align: 'center', color: '#5C6672' });
    }

    /* the wallet, always visible in the corner */
    var p = game.player;
    text(ctx, money(p.money), C.GAME_W - 250, 30, { size: 21, weight: 900, family: MONO, color: THEME.ink });
    text(ctx, game.T('money'), C.GAME_W - 250, 48, { size: 11, weight: 800, color: '#6C7789' });
    text(ctx, String(p.credits), C.GAME_W - 120, 30, { size: 21, weight: 900, family: MONO, color: THEME.ink });
    text(ctx, game.T('credits'), C.GAME_W - 120, 48, { size: 11, weight: 800, color: '#6C7789' });

    /* footer hints */
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(0, C.GAME_H - 30, C.GAME_W, 30);
  }

  function footer(ctx, game, hints) {
    var x = 24;
    for (var i = 0; i < hints.length; i++) {
      var key = hints[i][0], label = hints[i][1];
      ctx.save();
      ctx.font = '800 11px ' + MONO;
      var kw = ctx.measureText(key).width + 14;
      roundRectPath(ctx, x, C.GAME_H - 24, kw, 18, 5);
      ctx.fillStyle = '#FDFEFD';
      ctx.fill();
      ctx.strokeStyle = THEME.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      text(ctx, key, x + kw / 2, C.GAME_H - 11, { size: 11, weight: 900, family: MONO, align: 'center', color: THEME.ink });
      text(ctx, label, x + kw + 8, C.GAME_H - 11, { size: 12, color: THEME.dim });
      x += kw + 16 + ctx.measureText(label).width + 22;
    }
  }

  /* ---------------- the play HUD ----------------------------------------- */

  function drawHUD(ctx, game) {
    var m = game.machine, p = game.player, claw = m.claw;
    var diff = C.DIFF[game.player.diffId];

    /* ---- left panel: the wallet and the machine --------------------- */
    var L = LAYOUT.leftPanel;
    panel(ctx, L.x, L.y, L.w, L.h, { title: game.T('machinePanel'), tab: THEME.teal });

    var y = L.y + 56;
    text(ctx, NS.I18N.pick(m.def.name, game.lang), L.x + 14, y, {
      size: 17, weight: 900, family: DISPLAY, color: m.def.art.trim,
      glow: ART.rgba(m.def.art.led, 0.6), blur: 10
    });
    y += 20;
    text(ctx, NS.I18N.pick(m.def.sub, game.lang), L.x + 14, y, { size: 11, color: THEME.dimmer });
    y += 30;

    stat(ctx, L.x + 14, y, L.w - 28, game.T('credits'), String(p.credits), THEME.gold); y += 34;
    stat(ctx, L.x + 14, y, L.w - 28, game.T('money'), money(p.money), THEME.green); y += 34;
    stat(ctx, L.x + 14, y, L.w - 28, game.T('difficulty'),
      NS.I18N.pick(diff.label, game.lang), diff.id === 'real' ? THEME.red : THEME.blue); y += 34;

    text(ctx, game.T('stats'), L.x + 14, y + 8, { size: 12, weight: 800, color: THEME.dim }); y += 26;
    stat(ctx, L.x + 14, y, L.w - 28, game.T('plays'), String(p.stats.plays), THEME.text); y += 30;
    stat(ctx, L.x + 14, y, L.w - 28, game.T('wins'), String(p.stats.wins), THEME.text); y += 30;
    stat(ctx, L.x + 14, y, L.w - 28, game.T('streak'), String(p.stats.streak), p.stats.streak > 0 ? THEME.gold : THEME.dimmer); y += 30;
    stat(ctx, L.x + 14, y, L.w - 28, game.T('unique'),
      p.uniqueCount() + '/' + NS.CAT.PRIZES.length, THEME.text); y += 30;
    stat(ctx, L.x + 14, y, L.w - 28, game.T('trophies'),
      p.achievementCount() + '/' + C.ACHIEVEMENTS.length, THEME.text);

    /* ---- right panel: the attempt ------------------------------------- */
    var R = LAYOUT.rightPanel;
    panel(ctx, R.x, R.y, R.w, R.h, { title: game.T('statusPanel'), tab: THEME.pink });

    var ry = R.y + 58;
    var phase = m.phase;
    var phaseLabel = game.T(phaseName(phase));
    var phaseCol = phase === 'move' ? THEME.green : (phase === 'result' ? THEME.gold : THEME.blue);
    text(ctx, NS.I18N.pick({ en: phase.toUpperCase(), zh: phaseLabel }, game.lang), R.x + 14, ry, {
      size: 20, weight: 900, family: DISPLAY, color: phaseCol, glow: ART.rgba(phaseCol, 0.5), blur: 12
    });
    ry += 12;

    /* the move timer */
    if (phase === 'move') {
      var frac = C.clamp(m.moveTimer / 45, 0, 1);
      bar(ctx, R.x + 14, ry + 8, R.w - 28, 12, frac,
        frac < 0.25 ? '#ff6b6b' : '#5fd18a', frac < 0.25 ? '#ff9f43' : '#a8e86a');
      text(ctx, Math.ceil(m.moveTimer) + 's', R.x + R.w - 14, ry + 18, {
        size: 11, weight: 800, family: MONO, align: 'right', color: THEME.dim });
      ry += 32;
    } else {
      ry += 22;
    }

    /* the grip meter — the single most important readout in the game */
    text(ctx, game.T('grabStrength'), R.x + 14, ry + 14, { size: 12, weight: 800, color: THEME.dim });
    ry += 26;

    var integ = C.clamp(claw.integrity, -0.2, 1.35);
    var show = C.clamp(integ, 0, 1);
    var holding = !!claw.held;
    bar(ctx, R.x + 14, ry, R.w - 28, 26, show,
      !holding ? '#4a5872' : (show > 0.6 ? '#5fd18a' : (show > 0.3 ? '#ffd166' : '#ff6b6b')),
      !holding ? '#33405a' : (show > 0.6 ? '#a8e86a' : (show > 0.3 ? '#ffa62b' : '#ff3b3b')),
      { edge: 'rgba(255,255,255,.22)' });

    /* a marker showing where the demand currently sits */
    if (holding) {
      var need = claw.ratio;
      var mx = R.x + 14 + C.clamp(need, 0, 1.4) / 1.4 * (R.w - 28);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(mx, ry - 3); ctx.lineTo(mx + 6, ry - 11); ctx.lineTo(mx - 6, ry - 11);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();
    }
    var gripText = !holding ? game.T('ready')
      : (claw.firm ? game.T('firmGrab')
        : (show > 0.75 ? game.T('gripOk') : (show > 0.2 ? game.T('gripWeak') : game.T('gripLost'))));
    text(ctx, gripText, R.x + R.w / 2, ry + 43, {
      size: 12, weight: 800, align: 'center',
      color: !holding ? THEME.dimmer : (show > 0.6 ? THEME.green : (show > 0.3 ? THEME.gold : THEME.red))
    });
    ry += 62;

    /* what is in the claw, or what is sitting under it right now */
    var heldPrize = claw.held ? claw.held.prize : null;
    var targetPrize = heldPrize || bestUnderClaw(m);
    text(ctx, heldPrize ? game.T('prizeValue') : game.T('atStake'), R.x + 14, ry + 12,
      { size: 12, weight: 800, color: THEME.dim });
    ry += 24;
    ctx.save();
    roundRectPath(ctx, R.x + 14, ry, R.w - 28, 92, 10);
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.fill();
    ctx.strokeStyle = heldPrize ? 'rgba(255,210,110,.35)' : 'rgba(255,255,255,.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    if (targetPrize) {
      prizeIcon(ctx, targetPrize, R.x + 52, ry + 46, 30, { t: game.t, phase: 1, dim: !heldPrize });
      text(ctx, NS.I18N.pick(targetPrize.name, game.lang), R.x + 92, ry + 34, {
        size: 14, weight: 800, color: RARITY_TINT[targetPrize.rarity],
        alpha: heldPrize ? 1 : 0.8 });
      stars(ctx, targetPrize.stars, R.x + 92, ry + 44, 6, RARITY_TINT[targetPrize.rarity]);
      text(ctx, money(targetPrize.value) + '   ' + targetPrize.mass + game.T('weightG'), R.x + 92, ry + 74,
        { size: 13, weight: 800, family: MONO, color: THEME.text });
    } else {
      text(ctx, '—', R.x + R.w / 2, ry + 52, { size: 26, align: 'center', color: 'rgba(255,255,255,.18)' });
    }
    ry += 108;

    stat(ctx, R.x + 14, ry, R.w - 28, game.T('catalogue'),
      game.player.uniqueCount() + '/' + NS.CAT.PRIZES.length, THEME.text);
    ry += 28;
    stat(ctx, R.x + 14, ry, R.w - 28, game.T('prizes'),
      String(m.world.bodies.length), THEME.text);

    /* ---- the on-screen controls --------------------------------------- */
    drawControls(ctx, game);
  }

  function phaseName(p) {
    return {
      ready: 'ready', move: 'moveClaw', drop: 'dropping', close: 'closing',
      lift: 'lifting', return: 'returning', release: 'releasing',
      settle: 'releasing', result: 'ready'
    }[p] || 'ready';
  }

  function stat(ctx, x, y, w, label, value, colour) {
    text(ctx, label, x, y, { size: 12, color: THEME.dimmer });
    text(ctx, value, x + w, y, { size: 14, weight: 800, family: MONO, align: 'right', color: colour || THEME.text });
  }

  /* the most valuable toy the claw could currently take, so the player can see
   * what a drop would be going for before committing the credit              */
  function bestUnderClaw(m) {
    var claw = m.claw, reach = claw.captureRadius();
    var fingerY = claw.y - claw.fingerDrop();
    var best = null;
    for (var i = 0; i < m.world.bodies.length; i++) {
      var b = m.world.bodies[i];
      if (!b.alive || b.held) continue;
      var dx = b.x - claw.x, dz = b.z - claw.z;
      if (dx * dx + dz * dz > Math.pow(reach * 1.7 + b.r, 2)) continue;
      if (!best || b.prize.value > best.value) best = b.prize;
    }
    return best;
  }

  function drawControls(ctx, game) {
    var st = LAYOUT.stick, dp = LAYOUT.drop;
    var inp = game.input;

    /* the stick */
    ctx.save();
    ctx.beginPath();
    ctx.arc(st.cx, st.cy, st.r, 0, TAU);
    var g = ctx.createRadialGradient(st.cx, st.cy - 12, 6, st.cx, st.cy, st.r);
    g.addColorStop(0, 'rgba(52,64,90,.95)');
    g.addColorStop(1, 'rgba(16,22,34,.95)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(150,190,240,.30)';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* gate marks */
    ctx.strokeStyle = 'rgba(255,255,255,.09)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 8; i++) {
      var a = i / 8 * TAU;
      ctx.beginPath();
      ctx.moveTo(st.cx + Math.cos(a) * (st.r - 9), st.cy + Math.sin(a) * (st.r - 9));
      ctx.lineTo(st.cx + Math.cos(a) * (st.r - 2), st.cy + Math.sin(a) * (st.r - 2));
      ctx.stroke();
    }
    var kx = st.cx + (inp ? inp.stick.x : 0) * (st.r - st.knob - 6);
    var ky = st.cy + (inp ? inp.stick.y : 0) * (st.r - st.knob - 6);
    ctx.beginPath();
    ctx.arc(kx, ky, st.knob, 0, TAU);
    var kg = ctx.createRadialGradient(kx - 8, ky - 10, 3, kx, ky, st.knob);
    kg.addColorStop(0, '#dfe8f8');
    kg.addColorStop(0.55, '#98a6c0');
    kg.addColorStop(1, '#4d5772');
    ctx.fillStyle = kg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,14,22,.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    text(ctx, 'X / Z', st.cx, st.cy + st.r + 20, { size: 11, weight: 800, align: 'center', color: THEME.dimmer });

    /* the drop button: while the machine is idle it is the coin slot instead */
    var phase = game.machine.phase;
    var ready = phase === 'ready' && !game.machine.result;
    var armed = phase === 'move';
    var col = ready ? THEME.gold : THEME.green;
    ctx.save();
    ctx.beginPath();
    ctx.arc(dp.cx, dp.cy, dp.r + 6, 0, TAU);
    ctx.fillStyle = 'rgba(12,16,24,.9)';
    ctx.fill();
    ctx.strokeStyle = (armed || ready) ? ART.rgba(col, 0.85) : 'rgba(255,255,255,.14)';
    ctx.lineWidth = 2;
    ctx.stroke();

    var press = (game.dropFlash || 0) > 0 ? 3 : 0;
    ctx.beginPath();
    ctx.arc(dp.cx, dp.cy + press, dp.r, 0, TAU);
    var dg = ctx.createRadialGradient(dp.cx - dp.r * 0.3, dp.cy - dp.r * 0.4, 4, dp.cx, dp.cy, dp.r);
    if (ready) { dg.addColorStop(0, '#fff3c8'); dg.addColorStop(0.5, '#ffc23d'); dg.addColorStop(1, '#a06a10'); }
    else if (armed) { dg.addColorStop(0, '#ff9a8a'); dg.addColorStop(0.5, '#ef4b3f'); dg.addColorStop(1, '#8f1f18'); }
    else { dg.addColorStop(0, '#6a7387'); dg.addColorStop(0.5, '#454d5f'); dg.addColorStop(1, '#242a36'); }
    ctx.fillStyle = dg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (armed || ready) {
      ctx.save();
      ctx.shadowColor = ART.rgba(col, 0.9);
      ctx.shadowBlur = 20 + 10 * Math.sin(game.t * 5);
      ctx.beginPath();
      ctx.arc(dp.cx, dp.cy, dp.r, 0, TAU);
      ctx.strokeStyle = ART.rgba(col, 0.7);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    var afford = game.player.credits >= game.creditCost();
    var main = ready ? (afford ? 'COIN' : 'BUY') : 'DROP';
    text(ctx, main, dp.cx, dp.cy + 6, {
      size: ready ? 18 : 17, weight: 900, family: DISPLAY, align: 'center',
      color: (armed || ready) ? (ready ? '#2a1c02' : '#2a0a06') : 'rgba(255,255,255,.35)'
    });
    text(ctx, 'SPACE', dp.cx, dp.cy + dp.r + 19, { size: 11, weight: 800, align: 'center', color: THEME.dimmer });
    if (ready) {
      text(ctx, game.creditCost() + ' ' + game.T('credit') + '  ·  ' + game.player.credits,
        dp.cx, dp.cy + dp.r + 38, {
          size: 11, weight: 800, family: MONO, align: 'center',
          color: afford ? THEME.gold : THEME.red
        });
    }

    /* the small utility buttons */
    var smalls = [
      [LAYOUT.menu, '☰ ' + game.T('pause'), 0],
      [LAYOUT.mute, (game.player.sfx ? '♪ ' : '✕ ') + game.T('sfx'), 1],
      [LAYOUT.lang, game.player.lang === 'zh' ? 'EN' : '繁中', 2],
      [LAYOUT.help, '? ' + game.T('help'), 3]
    ];
    for (var s = 0; s < smalls.length; s++) {
      button(ctx, smalls[s][0], smalls[s][1], { size: 12, hot: false });
    }
  }

  /* ---------------- the result card -------------------------------------- */

  function drawResult(ctx, game) {
    var r = game.machine.result;
    if (!r) return;
    var a = game.resultAnim === undefined ? 1 : game.resultAnim;
    ctx.save();
    ctx.fillStyle = 'rgba(3,5,10,' + (0.72 * a) + ')';
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);

    var w = 700, h = r.win ? 400 : 320;
    var x = (C.GAME_W - w) / 2, y = (C.GAME_H - h) / 2 - 10 + (1 - a) * 30;
    ctx.globalAlpha = a;

    if (r.win && r.prizes.length) {
      /* a white sticker card, the way the toy line's packaging looks */
      panel(ctx, x, y, w, h, { flat: '#FDFEFD', edgeWidth: 5, r: 20 });
      ctx.save();
      roundRectPath(ctx, x, y, w, 62, 20);
      ctx.fillStyle = THEME.gold;
      ctx.fill();
      ctx.restore();
      roundRectPath(ctx, x, y, w, 62, 20);
      ctx.strokeStyle = THEME.ink;
      ctx.lineWidth = 5;
      ctx.stroke();
      text(ctx, game.T('won'), C.GAME_W / 2, y + 44, {
        size: 36, weight: 900, family: DISPLAY, align: 'center', color: THEME.ink
      });
      var n = r.prizes.length;
      var step = Math.min(180, (w - 120) / n);
      for (var i = 0; i < n; i++) {
        var p = r.prizes[i];
        var cx = C.GAME_W / 2 + (i - (n - 1) / 2) * step;
        var bob = Math.sin(game.t * 2.4 + i) * 5;
        prizeIcon(ctx, p, cx, y + 168 + bob, 56, { t: game.t, phase: i });
        text(ctx, NS.I18N.pick(p.name, game.lang), cx, y + 246, {
          size: 14, weight: 900, align: 'center', color: THEME.ink });
        stars(ctx, p.stars, cx - 5 * 1.7 * 6 / 2, y + 258, 6, RARITY_TINT[p.rarity]);
        text(ctx, money(p.value), cx, y + 290, {
          size: 17, weight: 900, family: MONO, align: 'center', color: THEME.ink });
        var owned = game.player.countOf(p.id);
        if (owned > 1) {
          text(ctx, '×' + owned, cx, y + 312, {
            size: 12, weight: 900, align: 'center', color: '#5C6672' });
        } else {
          ctx.save();
          roundRectPath(ctx, cx - 42, y + 298, 84, 20, 8);
          ctx.fillStyle = THEME.pink;
          ctx.fill();
          ctx.strokeStyle = THEME.ink;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
          text(ctx, game.T('newPrize'), cx, y + 312, {
            size: 12, weight: 900, align: 'center', color: THEME.ink });
        }
      }
      if (r.nudgedWin) {
        text(ctx, game.T('nudgewin') + '  +' + (r.nudgedCount || 1), C.GAME_W / 2, y + h - 48, {
          size: 13, weight: 900, align: 'center', color: THEME.teal });
      }
      footerHint(ctx, game, y + h - 18, THEME.ink);
    } else {
      panel(ctx, x, y, w, h, { flat: '#FDFEFD', edgeWidth: 5, r: 20 });
      text(ctx, game.T('noPrize'), C.GAME_W / 2, y + 68, {
        size: 34, weight: 900, family: DISPLAY, align: 'center', color: THEME.ink
      });
      var msg = r.slipped ? game.T('slipped') : (r.grabbed ? game.T('gripLost') : game.T('emptyClaw'));
      text(ctx, msg, C.GAME_W / 2, y + 110, {
        size: 18, weight: 900, align: 'center', color: THEME.pink });
      if (r.grabbedPrize) {
        var q = r.grabbedPrize;
        prizeIcon(ctx, q, C.GAME_W / 2, y + 190, 44, { t: game.t, dim: true });
        text(ctx, NS.I18N.pick(q.name, game.lang), C.GAME_W / 2, y + 250, {
          size: 14, weight: 900, align: 'center', color: '#5C6672' });
      }
      text(ctx, game.T('betterLuck'), C.GAME_W / 2, y + h - 46, {
        size: 14, weight: 900, align: 'center', color: '#5C6672' });
      footerHint(ctx, game, y + h - 18, THEME.ink);
    }
    ctx.restore();
  }

  function footerHint(ctx, game, y, colour) {
    var pulse = 0.55 + 0.45 * Math.sin(game.t * 5);
    ctx.save();
    ctx.globalAlpha = colour ? pulse : 1;
    text(ctx, game.T('keepGoing') + '  ▸  ENTER', C.GAME_W / 2, y, {
      size: 15, weight: 900, family: DISPLAY, align: 'center',
      color: colour || 'rgba(255,235,180,1)',
      glow: colour ? null : 'rgba(255,200,90,.7)', blur: 14
    });
    ctx.restore();
  }

  /* ---------------- the title screen ------------------------------------- */

  function drawTitle(ctx, game) {
    var t = game.t;
    /* the backing card: a flat brand colour with the halftone over it */
    var g = ctx.createLinearGradient(0, 0, 0, C.GAME_H);
    g.addColorStop(0, '#6AC9CD');
    g.addColorStop(0.45, '#4FA8AE');
    g.addColorStop(1, '#2E7C82');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#FDFEFD';
    for (var hy = 0; hy < C.GAME_H; hy += 26) {
      for (var hx = (hy / 26 % 2) * 13; hx < C.GAME_W; hx += 26) {
        ctx.beginPath(); ctx.arc(hx, hy, 4, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();

    /* a big ink sunburst behind the logo */
    ctx.save();
    ctx.translate(C.GAME_W / 2, 250);
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#020202';
    for (var si = 0; si < 16; si++) {
      ctx.save();
      ctx.rotate(si / 16 * TAU + t * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1400, -110);
      ctx.lineTo(1400, 110);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    /* the six guardians along the bottom, bobbing. This list must stay in
     * sync with js/catalogue.js — it used to name the invented line's designs,
     * which silently drew nothing once the real six replaced them. */
    var showcase = ['furi-prince', 'pinki', 'winggo', 'fluffu', 'boxo', 'bubi'];
    for (var k = 0; k < showcase.length; k++) {
      var pr = null;
      var want = 'classic';
      for (var q = 0; q < NS.CAT.PRIZES.length; q++) {
        if (NS.CAT.PRIZES[q].design === showcase[k] && NS.CAT.PRIZES[q].colorway === want) { pr = NS.CAT.PRIZES[q]; break; }
      }
      if (!pr) {
        for (var q2 = 0; q2 < NS.CAT.PRIZES.length; q2++) {
          if (NS.CAT.PRIZES[q2].design === showcase[k]) { pr = NS.CAT.PRIZES[q2]; break; }
        }
      }
      if (!pr) continue;
      /* centred: 6 figures across 1280 leaves 290px of margin each side */
      var px = 290 + k * 140;
      var py = 580 + Math.sin(t * 1.6 + k * 0.8) * 9;
      prizeIcon(ctx, pr, px, py, 46 + (k % 3) * 5, { t: t, phase: k });
    }

    /* the logo, in its own white sticker */
    ctx.save();
    roundRectPath(ctx, C.GAME_W / 2 - 430, 96, 860, 190, 22);
    ctx.fillStyle = 'rgba(2,2,2,.45)';
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRectPath(ctx, C.GAME_W / 2 - 436, 90, 860, 190, 22);
    ctx.fillStyle = '#FDFEFD';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = THEME.ink;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    ART.wordmark(ctx, C.GAME_W / 2, 200, 700);

    /* the game's own name, on its own little sticker underneath */
    ctx.save();
    roundRectPath(ctx, C.GAME_W / 2 - 250, 296, 500, 74, 16);
    ctx.fillStyle = 'rgba(2,2,2,.45)';
    ctx.fill();
    roundRectPath(ctx, C.GAME_W / 2 - 254, 292, 500, 74, 16);
    ctx.fillStyle = THEME.gold;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = THEME.ink;
    ctx.stroke();
    ctx.restore();
    text(ctx, '夾 公 仔 機', C.GAME_W / 2, 342, {
      size: 38, weight: 900, family: DISPLAY, align: 'center', color: THEME.ink
    });
    text(ctx, NS.I18N.T('subtitle', game.lang), C.GAME_W / 2, 392, {
      size: 16, weight: 900, align: 'center', color: '#FDFEFD',
      glow: 'rgba(2,2,2,.55)', blur: 8
    });

    var pulse = 0.55 + 0.45 * Math.sin(t * 3.4);
    var r = { x: C.GAME_W / 2 - 170, y: 424, w: 340, h: 62 };
    button(ctx, r, NS.I18N.T('pressStart', game.lang), { hot: true, size: 22 });

    text(ctx, NS.I18N.T('anyKey', game.lang), C.GAME_W / 2, 508, {
      size: 12, weight: 800, family: MONO, align: 'center',
      color: 'rgba(255,230,170,' + pulse.toFixed(2) + ')'
    });

    var p = game.player;
    text(ctx, NS.I18N.T('collection', game.lang) + '  ' + p.uniqueCount() + ' / ' + NS.CAT.PRIZES.length +
           '      ' + NS.I18N.T('trophies', game.lang) + '  ' + p.achievementCount() + ' / ' + C.ACHIEVEMENTS.length +
           '      ' + NS.I18N.T('money', game.lang) + '  ' + money(p.money) +
           '      ' + NS.I18N.T('credits', game.lang) + '  ' + p.credits,
      C.GAME_W / 2, 686, { size: 13, weight: 800, family: MONO, align: 'center', color: THEME.ink });

    footer(ctx, game, [['ENTER', game.T('pressStart')], ['L', game.T('language')], ['M', game.T('sfx')]]);
  }

  /* ---------------- the arcade floor ------------------------------------- */

  function drawFloor(ctx, game) {
    page(ctx, game, 'floor', null, game.T('ctrlHome'));

    var list = NS.CAT.MACHINES;
    var cw = 236, gap = 16;
    var totalW = list.length * cw + (list.length - 1) * gap;
    var x0 = (C.GAME_W - totalW) / 2;
    var top = 110, ch = 470;

    for (var i = 0; i < list.length; i++) {
      var def = list[i];
      var x = x0 + i * (cw + gap);
      var sel = i === game.sel;
      var won = !!game.player.machinesWon[def.id];
      var owned = countOwnedFor(game.player, def);
      var cost = def.creditCost;

      panel(ctx, x, top + (sel ? -8 : 0), cw, ch + (sel ? 16 : 0), {
        glow: sel ? ART.rgba(def.art.led, 0.85) : null,
        edgeColor: sel ? ART.rgba(def.art.led, 0.6) : null,
        top: sel ? '#1d2740' : THEME.panel,
        r: 14
      });

      /* marquee strip */
      var mg = ctx.createLinearGradient(x, top, x + cw, top + 70);
      mg.addColorStop(0, def.art.body);
      mg.addColorStop(1, def.art.body2);
      ctx.save();
      roundRectPath(ctx, x + 10, top + 12 + (sel ? -8 : 0), cw - 20, 60, 8);
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = ART.rgba(def.art.led, 0.7);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
      text(ctx, NS.I18N.pick(def.name, game.lang), x + cw / 2, top + 40 + (sel ? -8 : 0), {
        size: 15, weight: 900, family: DISPLAY, align: 'center', color: def.art.trim,
        glow: ART.rgba(def.art.led, 0.7), blur: 10
      });
      text(ctx, NS.I18N.pick(def.sub, game.lang), x + cw / 2, top + 60 + (sel ? -8 : 0), {
        size: 10, weight: 700, align: 'center', color: 'rgba(255,255,255,.7)'
      });

      /* three preview toys */
      var t = game.t;
      var pool = previewFor(def, 3);
      var cy = top + 150 + (sel ? -8 : 0);
      for (var k = 0; k < pool.length; k++) {
        prizeIcon(ctx, pool[k], x + cw / 2 + (k - 1) * 76, cy + Math.sin(t * 1.7 + k + i) * 5, 33,
          { t: t, phase: k + i });
      }

      var yy = cy + 62;
      text(ctx, game.T('credits'), x + 14, yy, { size: 11, color: THEME.dimmer });
      text(ctx, String(cost), x + cw - 14, yy, { size: 15, weight: 800, family: MONO, align: 'right', color: THEME.gold });
      yy += 26;
      text(ctx, game.T('catalogue'), x + 14, yy, { size: 11, color: THEME.dimmer });
      text(ctx, owned + ' / ' + NS.CAT.PRIZES.length, x + cw - 14, yy,
        { size: 13, weight: 800, family: MONO, align: 'right', color: THEME.text });
      yy += 22;
      var frac = owned / NS.CAT.PRIZES.length;
      bar(ctx, x + 14, yy, cw - 28, 8, frac, def.art.body, def.art.led);
      yy += 30;

      if (won) {
        text(ctx, '✔ ' + game.T('wins'), x + 14, yy, { size: 12, weight: 800, color: THEME.green });
      }
      yy += 22;
      text(ctx, game.T('attempts') + '  ' + (game.playsByMachine[def.id] || 0), x + 14, yy,
        { size: 11, color: THEME.dimmer });

      /* the difficulty is a global setting; show it on every card */
      var diff = C.DIFF[game.player.diffId];
      var dy = top + ch - 52 + (sel ? -8 : 0);
      text(ctx, game.T('difficulty'), x + 14, dy, { size: 11, color: THEME.dimmer });
      text(ctx, NS.I18N.pick(diff.label, game.lang), x + cw - 14, dy, {
        size: 13, weight: 900, family: DISPLAY, align: 'right',
        color: diff.id === 'real' ? THEME.red : THEME.blue
      });
      button(ctx, { x: x + 14, y: dy + 10, w: cw - 28, h: 34 },
        sel ? '▶ ' + game.T('play') : game.T('play'), { hot: sel, size: 13 });
    }

    footer(ctx, game, [
      ['←  →', 'SELECT'], ['ENTER', game.T('play')],
      ['D', game.T('difficulty')], ['C', game.T('collection')],
      ['S', game.T('shop')], ['T', game.T('trophies')], ['ESC', game.T('back')]
    ]);
  }

  /* Three toys that actually belong in this cabinet: one for each tier the
   * machine stocks, so the cards read differently from one another.          */
  function previewFor(def, n) {
    var out = [];
    var tiers = [];
    for (var t = 0; t < def.mix.length; t++) if (def.mix[t] > 0) tiers.push(t);
    tiers.sort(function (a, b) { return def.mix[b] - def.mix[a]; });
    for (var i = 0; i < tiers.length && out.length < n; i++) {
      for (var k = 0; k < NS.CAT.PRIZES.length; k++) {
        var p = NS.CAT.PRIZES[k];
        if (p.colorway !== 'classic') continue;
        if (p.tier !== tiers[i]) continue;
        if (def.tags.indexOf(p.tags[0]) < 0) continue;
        out.push(p);
        break;
      }
    }
    /* top up with anything the machine could hold */
    for (var j = 0; j < NS.CAT.PRIZES.length && out.length < n; j++) {
      var q = NS.CAT.PRIZES[j];
      if (q.colorway !== 'classic') continue;
      if (def.tags.indexOf(q.tags[0]) < 0) continue;
      if (out.indexOf(q) >= 0) continue;
      out.push(q);
    }
    return out;
  }

  function countOwnedFor(player, def) {
    var n = 0;
    for (var i = 0; i < NS.CAT.PRIZES.length; i++) {
      var p = NS.CAT.PRIZES[i];
      if (def.tags.indexOf(p.tags[0]) < 0) continue;
      if (player.isOwned(p.id)) n++;
    }
    return n;
  }

  /* ---------------- the collection book ---------------------------------- */

  var GRID = { x: 36, y: 132, cols: 15, rows: 5, cw: 78, chh: 78, gap: 3 };

  function drawCollection(ctx, game) {
    page(ctx, game, 'collection', null,
      game.T('unique') + '  ' + game.player.uniqueCount() + ' / ' + NS.CAT.PRIZES.length);

    var filtered = game.filteredList();
    var perPage = GRID.cols * GRID.rows;
    var pages = Math.max(1, Math.ceil(filtered.length / perPage));
    game.collPage = C.clamp(game.collPage, 0, pages - 1);
    var start = game.collPage * perPage;
    var cells = filtered.slice(start, start + perPage);

    for (var i = 0; i < cells.length; i++) {
      var p = cells[i];
      var cx = GRID.x + (i % GRID.cols) * (GRID.cw + GRID.gap);
      var cy = GRID.y + Math.floor(i / GRID.cols) * (GRID.chh + GRID.gap);
      var owned = game.player.isOwned(p.id);
      var sel = (i === game.collSel);
      ctx.save();
      roundRectPath(ctx, cx, cy, GRID.cw, GRID.chh, 8);
      var bg = ctx.createLinearGradient(0, cy, 0, cy + GRID.chh);
      if (owned) {
        bg.addColorStop(0, ART.rgba(RARITY_TINT[p.rarity], 0.30));
        bg.addColorStop(1, 'rgba(10,14,22,.9)');
      } else {
        bg.addColorStop(0, '#161c27');
        bg.addColorStop(1, '#0d1218');
      }
      ctx.fillStyle = bg;
      ctx.fill();
      if (sel) {
        ctx.strokeStyle = THEME.gold;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = THEME.gold;
        ctx.shadowBlur = 14;
      } else {
        ctx.strokeStyle = owned ? ART.rgba(RARITY_TINT[p.rarity], 0.6) : 'rgba(255,255,255,.07)';
        ctx.lineWidth = 1.2;
      }
      ctx.stroke();
      ctx.restore();

      prizeIcon(ctx, p, cx + GRID.cw / 2, cy + GRID.chh * 0.46, 26, {
        t: game.t, phase: i, dim: !owned
      });
      if (owned) {
        var count = game.player.countOf(p.id);
        if (count > 1) {
          text(ctx, '×' + count, cx + GRID.cw - 5, cy + GRID.chh - 5, {
            size: 10, weight: 800, family: MONO, align: 'right', color: THEME.gold });
        }
      } else {
        text(ctx, '?', cx + GRID.cw / 2, cy + GRID.chh * 0.5, {
          size: 22, weight: 900, align: 'center', color: 'rgba(255,255,255,.13)' });
      }
    }

    /* pager */
    text(ctx, (game.collPage + 1) + ' / ' + pages + '   PAGE', C.GAME_W - 36, 112, {
      size: 14, weight: 800, family: MONO, align: 'right', color: THEME.dim });
    text(ctx, game.filterRarity ? NS.I18N.pick(NS.C.RARITY[game.filterRarity], game.lang) : game.T('catalogue'),
      C.GAME_W - 36, 92, { size: 12, weight: 800, align: 'right', color: THEME.gold });

    /* the detail card for the highlighted prize */
    var sel0 = filtered[game.collSel];
    drawPrizeDetail(ctx, game, sel0);

    footer(ctx, game, [
      ['←↑↓→', 'BROWSE'], ['Q/E', 'PAGE'],
      ['F', game.T('rarity')], ['G', game.T('display')],
      ['X', game.T('sellDup')], ['ESC', game.T('back')]
    ]);
  }

  function drawPrizeDetail(ctx, game, p) {
    var x = 36, y = 552, w = C.GAME_W - 72, h = 138;
    panel(ctx, x, y, w, h, { r: 12, flat: '#20242E' });
    var owned = p ? game.player.isOwned(p.id) : false;
    if (!p) {
      text(ctx, '—', x + w / 2, y + h / 2, { size: 20, align: 'center', color: THEME.dimmer });
      return;
    }
    prizeIcon(ctx, p, x + 80, y + h / 2, 46, { t: game.t, dim: !owned });
    text(ctx, owned ? NS.I18N.pick(p.name, game.lang) : '???',
      x + 152, y + 40, { size: 22, weight: 900, family: DISPLAY,
        color: owned ? RARITY_TINT[p.rarity] : THEME.dimmer });
    stars(ctx, owned ? p.stars : 0, x + 152, y + 58, 8, RARITY_TINT[p.rarity]);

    text(ctx, NS.I18N.pick(NS.C.RARITY[p.rarity], game.lang), x + 152, y + 96, {
      size: 13, weight: 800, color: RARITY_TINT[p.rarity] });

    var cols = [
      [game.T('value'), owned ? money(p.value) : '—'],
      [game.T('weight'), owned ? p.mass + game.T('weightG') : '—'],
      [game.T('grip'), owned ? p.slip.toFixed(2) : '—'],
      [game.T('owned'), String(game.player.countOf(p.id))]
    ];
    for (var i = 0; i < cols.length; i++) {
      var cx = x + 392 + i * 168;
      text(ctx, cols[i][0], cx, y + 44, { size: 11, color: THEME.dimmer });
      text(ctx, cols[i][1], cx, y + 70, { size: 18, weight: 800, family: MONO, color: THEME.text });
    }

    /* the shelf slot */
    var onShelf = game.player.shelf.indexOf(p.id) >= 0;
    button(ctx, { x: x + w - 190, y: y + 26, w: 164, h: 36 },
      onShelf ? game.T('remove') : game.T('display'), { hot: false, size: 13, disabled: !owned });
    text(ctx, game.T('shelf') + '  ' + game.player.shelf.length + ' / ' + NS.SHELF_SIZE,
      x + w - 108, y + 84, { size: 12, weight: 700, align: 'center', color: THEME.dim });
    text(ctx, game.T('sellDup') + ': ' + money(dupeValue(game.player)),
      x + w - 108, y + 106, { size: 12, weight: 700, align: 'center', color: THEME.green });
  }

  function dupeValue(player) {
    var list = player.duplicateList(), total = 0;
    for (var i = 0; i < list.length; i++) total += player.sellPrice(list[i].prize) * list[i].count;
    return total;
  }

  /* ---------------- the shop --------------------------------------------- */

  function drawShop(ctx, game) {
    page(ctx, game, 'shop', null,
      game.T('spent') + ' ' + money(game.player.stats.spent) + '   ·   ' +
      game.T('earned') + ' ' + money(game.player.stats.earned));

    var p = game.player;
    var cols = 3, cw = 320, chh = 152, gap = 18;
    var x0 = (C.GAME_W - (cols * cw + (cols - 1) * gap)) / 2;

    for (var i = 0; i < C.UPGRADES.length; i++) {
      var u = C.UPGRADES[i];
      var lvl = p.upgradeLevel(u.id);
      var maxed = lvl >= u.max;
      var cost = maxed ? 0 : u.cost(lvl);
      var afford = !maxed && p.money >= cost;
      var cx = x0 + (i % cols) * (cw + gap);
      var cy = 96 + Math.floor(i / cols) * (chh + gap);
      var sel = i === game.shopSel;

      panel(ctx, cx, cy, cw, chh, {
        glow: sel ? 'rgba(255,210,110,.7)' : null,
        edgeColor: sel ? THEME.edgeHot : null,
        top: sel ? '#1e2842' : THEME.panel
      });
      text(ctx, NS.I18N.pick(u.name, game.lang), cx + 16, cy + 34, {
        size: 18, weight: 900, family: DISPLAY, color: THEME.gold });
      text(ctx, game.T('level') + ' ' + lvl + ' / ' + u.max, cx + cw - 16, cy + 32, {
        size: 12, weight: 800, family: MONO, align: 'right', color: THEME.dim });

      /* level pips */
      for (var k = 0; k < u.max; k++) {
        ctx.save();
        roundRectPath(ctx, cx + 16 + k * 30, cy + 44, 24, 8, 4);
        ctx.fillStyle = k < lvl ? THEME.gold : 'rgba(255,255,255,.10)';
        if (k < lvl) { ctx.shadowColor = THEME.gold; ctx.shadowBlur = 8; }
        ctx.fill();
        ctx.restore();
      }

      wrap(ctx, NS.I18N.pick(u.desc, game.lang), cx + 16, cy + 78, cw - 32, 17,
        { size: 12.5, color: THEME.dim });

      button(ctx, { x: cx + 16, y: cy + chh - 44, w: cw - 32, h: 32 },
        maxed ? game.T('maxed') : (game.T('buy') + '   ' + money(cost)),
        { hot: afford, disabled: maxed || !afford, size: 13 });
    }

    /* the counter: credits and a cash-out */
    var cy2 = 96 + 2 * (chh + gap) + 8;
    panel(ctx, x0, cy2, cols * cw + (cols - 1) * gap, 116, { r: 12 });
    text(ctx, game.T('buyCredits'), x0 + 20, cy2 + 34, {
      size: 16, weight: 900, family: DISPLAY, color: THEME.text });
    text(ctx, money(C.ECON.creditPrice) + ' / ' + game.T('credit'), x0 + 20, cy2 + 56,
      { size: 12, color: THEME.dimmer });
    button(ctx, { x: x0 + 20, y: cy2 + 68, w: 200, h: 34 },
      game.T('buyCredits') + '  ' + money(C.ECON.creditPrice * 5),
      { hot: p.canAffordCredits(5), disabled: !p.canAffordCredits(5), size: 13 });

    var dv = dupeValue(p);
    text(ctx, game.T('cashOut'), x0 + 470, cy2 + 34, {
      size: 16, weight: 900, family: DISPLAY, color: THEME.text });
    text(ctx, game.T('cashOutHint'), x0 + 470, cy2 + 56, { size: 12, color: THEME.dimmer });
    button(ctx, { x: x0 + 470, y: cy2 + 68, w: 260, h: 34 },
      game.T('cashOut') + '  ' + money(dv), { hot: dv > 0, disabled: dv <= 0, size: 13 });

    var totLvl = p.totalUpgradeLevels();
    text(ctx, game.T('grabStrength'), x0 + 790, cy2 + 34, { size: 12, color: THEME.dimmer });
    text(ctx, (C.DIFF[p.diffId].grip + p.statBag().grip).toFixed(1), x0 + 790, cy2 + 62, {
      size: 24, weight: 900, family: MONO, color: THEME.gold, glow: 'rgba(255,200,80,.5)', blur: 12 });
    text(ctx, game.T('level') + ' ' + totLvl, x0 + 790, cy2 + 84, { size: 12, color: THEME.dim });

    footer(ctx, game, [
      ['↑↓←→', 'SELECT'], ['ENTER', game.T('buy')],
      ['B', game.T('buyCredits')], ['X', game.T('cashOut')], ['ESC', game.T('back')]
    ]);
  }

  /* ---------------- trophies --------------------------------------------- */

  function drawTrophies(ctx, game) {
    var p = game.player;
    page(ctx, game, 'trophies', null,
      game.T('achProgress') + '  ' + p.achievementCount() + ' / ' + C.ACHIEVEMENTS.length);

    var cols = 3, cw = 388, chh = 66, gap = 10;
    var x0 = (C.GAME_W - (cols * cw + (cols - 1) * gap)) / 2;
    var rows = Math.ceil(C.ACHIEVEMENTS.length / cols);
    var y0 = 92;
    var scale = Math.min(1, (C.GAME_H - 150) / (rows * (chh + gap)));
    ctx.save();
    ctx.translate(C.GAME_W / 2, y0);
    ctx.scale(scale, scale);
    ctx.translate(-C.GAME_W / 2, 0);

    for (var i = 0; i < C.ACHIEVEMENTS.length; i++) {
      var a = C.ACHIEVEMENTS[i];
      var unlocked = !!p.achievements[a.id];
      var cx = x0 + (i % cols) * (cw + gap);
      var cy = Math.floor(i / cols) * (chh + gap);
      ctx.save();
      roundRectPath(ctx, cx, cy, cw, chh, 10);
      var bg = ctx.createLinearGradient(0, cy, 0, cy + chh);
      if (unlocked) { bg.addColorStop(0, 'rgba(60,48,16,.95)'); bg.addColorStop(1, 'rgba(28,22,8,.95)'); }
      else { bg.addColorStop(0, '#141a25'); bg.addColorStop(1, '#0c1119'); }
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = unlocked ? 'rgba(255,200,80,.65)' : 'rgba(255,255,255,.08)';
      ctx.lineWidth = unlocked ? 1.8 : 1;
      if (unlocked) { ctx.shadowColor = 'rgba(255,190,60,.5)'; ctx.shadowBlur = 12; }
      ctx.stroke();
      ctx.restore();

      /* the medal */
      var mx = cx + 40, my = cy + chh / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(mx, my, 21, 0, TAU);
      var mg = ctx.createRadialGradient(mx - 6, my - 8, 2, mx, my, 21);
      if (unlocked) { mg.addColorStop(0, '#fff3c0'); mg.addColorStop(0.5, '#ffc23d'); mg.addColorStop(1, '#9a6a10'); }
      else { mg.addColorStop(0, '#39415a'); mg.addColorStop(1, '#1b2130'); }
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = unlocked ? '#ffe9a8' : 'rgba(255,255,255,.10)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      text(ctx, unlocked ? '★' : '·', mx, my + 8, {
        size: 22, weight: 900, align: 'center',
        color: unlocked ? '#5a3c04' : 'rgba(255,255,255,.20)' });

      text(ctx, NS.I18N.pick({ en: a.en, zh: a.zh }, game.lang), cx + 74, cy + 28, {
        size: 14, weight: 800, color: unlocked ? THEME.gold : THEME.dim });
      wrap(ctx, NS.I18N.pick(a.hint, game.lang), cx + 74, cy + 48, cw - 90, 15,
        { size: 11.5, color: unlocked ? 'rgba(255,235,190,.75)' : THEME.dimmer });
      if (unlocked && p.achievements[a.id]) {
        var d = new Date(p.achievements[a.id]);
        text(ctx, d.toLocaleDateString(), cx + cw - 12, cy + 24, {
          size: 10, weight: 700, family: MONO, align: 'right', color: 'rgba(255,220,150,.5)' });
      }
    }
    ctx.restore();

    footer(ctx, game, [['ESC', game.T('back')], ['T', game.T('trophies')]]);
  }

  /* ---------------- the pause menu --------------------------------------- */

  function drawPause(ctx, game) {
    ctx.fillStyle = 'rgba(3,5,10,.72)';
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);
    var w = 460, h = 420;
    var x = (C.GAME_W - w) / 2, y = (C.GAME_H - h) / 2;
    panel(ctx, x, y, w, h, { glow: 'rgba(150,190,255,.5)', r: 16 });
    text(ctx, game.T('pause'), C.GAME_W / 2, y + 58, {
      size: 36, weight: 900, family: DISPLAY, align: 'center', color: THEME.text,
      glow: 'rgba(140,190,255,.6)', blur: 20 });

    var items = game.pauseItems();
    for (var i = 0; i < items.length; i++) {
      button(ctx, { x: x + 50, y: y + 92 + i * 54, w: w - 100, h: 44 },
        items[i].label, { hot: i === game.pauseSel, size: 15 });
    }

    var p = game.player;
    var info = [
      [game.T('music'), p.music ? game.T('on') : game.T('off')],
      [game.T('sfx'), p.sfx ? game.T('on') : game.T('off')],
      [game.T('language'), p.lang === 'zh' ? NS.I18N.T('chinese', 'zh') : 'ENGLISH'],
      [game.T('difficulty'), NS.I18N.pick(C.DIFF[p.diffId].label, game.lang)]
    ];
    for (var k = 0; k < info.length; k++) {
      var yy = y + h - 108 + k * 24;
      text(ctx, info[k][0], x + 52, yy, { size: 12, color: THEME.dimmer });
      text(ctx, info[k][1], x + w - 52, yy, { size: 12, weight: 800, family: MONO, align: 'right', color: THEME.text });
    }
    footerHint(ctx, game, y + h - 12);
  }

  /* ---------------- controls help ---------------------------------------- */

  function drawHelp(ctx, game) {
    ctx.fillStyle = 'rgba(3,5,10,.80)';
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);
    var w = 760, h = 470;
    var x = (C.GAME_W - w) / 2, y = (C.GAME_H - h) / 2;
    panel(ctx, x, y, w, h, { glow: 'rgba(150,220,255,.4)', r: 16 });
    text(ctx, game.T('help'), C.GAME_W / 2, y + 56, {
      size: 30, weight: 900, family: DISPLAY, align: 'center', color: THEME.gold,
      glow: 'rgba(255,200,80,.6)', blur: 18 });

    var rows = [
      ['← → ↑ ↓  /  W A S D', game.T('ctrlMove')],
      ['SPACE', game.T('ctrlDrop')],
      ['SHIFT', game.T('ctrlAlt')],
      ['ENTER', game.T('ctrlGrab')],
      ['ESC / M / L', game.T('ctrlPause')]
    ];
    for (var i = 0; i < rows.length; i++) {
      var yy = y + 116 + i * 54;
      ctx.save();
      roundRectPath(ctx, x + 40, yy - 22, 260, 34, 8);
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      text(ctx, rows[i][0], x + 170, yy, { size: 14, weight: 800, family: MONO, align: 'center', color: '#cfe0ff' });
      wrap(ctx, rows[i][1], x + 322, yy - 4, w - 370, 16, { size: 13, color: THEME.dim });
    }

    wrap(ctx, NS.I18N.T('ctrlHome', game.lang), x + 40, y + 400, w - 80, 18,
      { size: 13, color: 'rgba(255,220,150,.8)' });
    footerHint(ctx, game, y + h - 14);
  }

  NS.UI = {
    THEME: THEME,
    RARITY_TINT: RARITY_TINT,
    text: text,
    panel: panel,
    button: button,
    bar: bar,
    stars: stars,
    wrap: wrap,
    prizeIcon: prizeIcon,
    money: money,
    roundRectPath: roundRectPath,
    font: font,
    drawHUD: drawHUD,
    drawResult: drawResult,
    drawTitle: drawTitle,
    drawFloor: drawFloor,
    drawCollection: drawCollection,
    drawShop: drawShop,
    drawTrophies: drawTrophies,
    drawPause: drawPause,
    drawHelp: drawHelp,
    footerHint: footerHint,
    GRID: GRID
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = NS.UI;
})(typeof globalThis !== 'undefined' ? globalThis : this);
