'use strict';
/* =========================================================================
 * js/renderer.js — the cabinet, in perspective.
 *
 * Everything inside the machine is real 3-D: prizes, the claw, the chute and
 * its rim live at the positions the physics put them, projected through a
 * pinhole camera that sits in front of the glass and looks slightly down.  The
 * eight corners of the playfield are projected once per frame and every panel
 * of the cabinet is built from those points, so the frame can never drift out
 * of alignment with the inside.
 *
 * Draw order is: back wall, side walls, ceiling, floor, chute -> shadows ->
 * prizes and claw sorted back-to-front -> glass -> frame -> marquee and
 * control panel.  The interior is clipped to the front opening, which is
 * exactly the silhouette of the box.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C, ART = NS.ART;
  var TAU = Math.PI * 2;

  /* ---------------- camera ------------------------------------------------ */

  function Camera(cam) {
    cam = cam || C.CAM;
    this.x = cam.x; this.y = cam.y; this.z = cam.z;
    this.pitch = cam.pitch;
    this.cp = Math.cos(cam.pitch);
    this.sp = Math.sin(cam.pitch);
    this.f = (C.GAME_H / 2) / Math.tan(cam.fovY / 2);
    this.ox = cam.ox === undefined ? 0 : cam.ox;
    this.oy = cam.oy === undefined ? 0 : cam.oy;
    this.scale = cam.scale || 1;
  }

  Camera.prototype.at = function (x, y, z) {
    var dx = x - this.x, dy = y - this.y, dz = z - this.z;
    var d = dy * -this.sp + dz * -this.cp;
    if (d < 0.12) d = 0.12;
    var vy = dy * this.cp + dz * -this.sp;
    var s = this.f / d * this.scale;
    return { x: C.GAME_W / 2 + this.ox + dx * s, y: C.GAME_H / 2 + this.oy - vy * s, d: d, s: s };
  };

  /* ---------------- polygon helpers -------------------------------------- */

  function quad(ctx, a, b, c, d, fill) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }

  function poly(ctx, pts, fill) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }

  /* a gradient that runs along the screen projection of an edge */
  function edgeGrad(ctx, a, b, stops) {
    var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    return g;
  }

  /* ---------------- cabinet geometry ------------------------------------- */

  function buildFrame(cam) {
    var B = C.BOX, A = cam.at.bind(cam);
    var F = {
      /* back wall */
      btl: A(-B.hx, B.top, -B.hz), btr: A(B.hx, B.top, -B.hz),
      bbl: A(-B.hx, 0, -B.hz), bbr: A(B.hx, 0, -B.hz),
      /* front opening */
      ftl: A(-B.hx, B.top, B.hz), ftr: A(B.hx, B.top, B.hz),
      fbl: A(-B.hx, 0, B.hz), fbr: A(B.hx, 0, B.hz),
      /* mid-height points for the ceiling line and the chute */
      mid: A(0, B.top, 0)
    };
    return F;
  }

  /* ---------------- the inside ------------------------------------------- */

  function drawBackWall(ctx, F, machine, lang) {
    var art = machine.def.art;
    var g = ctx.createLinearGradient(0, F.btl.y, 0, F.bbl.y);
    g.addColorStop(0, ART.shade(art.body, -0.22));
    g.addColorStop(0.55, art.body);
    g.addColorStop(1, art.body2);
    quad(ctx, F.btl, F.btr, F.bbr, F.bbl, g);

    /* the poster: diagonal stripes and the machine's name, in perspective */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(F.btl.x, F.btl.y); ctx.lineTo(F.btr.x, F.btr.y);
    ctx.lineTo(F.bbr.x, F.bbr.y); ctx.lineTo(F.bbl.x, F.bbl.y);
    ctx.closePath();
    ctx.clip();

    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#ffffff';
    var stripeW = (F.btr.x - F.btl.x) / 7;
    for (var i = -2; i < 9; i += 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(F.btl.x + i * stripeW, F.bbl.y);
      ctx.lineTo(F.btl.x + (i + 1) * stripeW, F.btl.y);
      ctx.lineTo(F.btl.x + (i + 1.7) * stripeW, F.btl.y);
      ctx.lineTo(F.btl.x + (i + 0.7) * stripeW, F.bbl.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    /* The back wall carries the FURI MONSTER lockup with the cabinet's own
     * name under it, so every machine in the arcade is on-brand. */
    var plateH = (F.bbl.y - F.btl.y) * 0.36;
    var plateY = F.btl.y + (F.bbl.y - F.btl.y) * 0.24;
    var plateW = (F.btr.x - F.btl.x) * 0.80;
    var plateX = (F.btl.x + F.btr.x) / 2 - plateW / 2;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.beginPath();
    ctx.moveTo(plateX, plateY);
    ctx.lineTo(plateX + plateW, plateY);
    ctx.lineTo(plateX + plateW * 0.94, plateY + plateH);
    ctx.lineTo(plateX + plateW * 0.06, plateY + plateH);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    var cx = (F.btl.x + F.btr.x) / 2;
    ART.wordmark(ctx, cx, plateY + plateH * 0.40, plateW * 0.60, { ink: '#FDFEFD' });

    var name = NS.I18N.pick(machine.def.name, lang);
    var size = Math.max(11, plateH * 0.25);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 ' + size.toFixed(0) + 'px "Arial Black", Impact, "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = art.trim;
    ctx.fillText(name, cx, plateY + plateH * 0.84);
    ctx.restore();
    ctx.restore();
  }

  function drawSideWalls(ctx, F, machine) {
    var art = machine.def.art;
    var left = edgeGrad(ctx, F.fbl, F.bbl, [
      [0, ART.shade(art.body2, 0.10)], [1, ART.shade(art.body2, -0.42)]]);
    quad(ctx, F.ftl, F.fbl, F.bbl, F.btl, left);
    var right = edgeGrad(ctx, F.fbr, F.bbr, [
      [0, ART.shade(art.body2, 0.02)], [1, ART.shade(art.body2, -0.50)]]);
    quad(ctx, F.ftr, F.fbr, F.bbr, F.btr, right);

    /* the LED strip running up each side of the cabinet */
    ctx.save();
    ctx.lineCap = 'round';
    var pulse = 0.55 + 0.45 * Math.sin(performance0() * 2.6);
    ctx.strokeStyle = ART.rgba(art.led, 0.85);
    ctx.shadowColor = art.led;
    ctx.shadowBlur = 16 * pulse;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(F.fbl.x + (F.bbl.x - F.fbl.x) * 0.06, F.fbl.y + (F.bbl.y - F.fbl.y) * 0.06);
    ctx.lineTo(F.ftl.x + (F.btl.x - F.ftl.x) * 0.06, F.ftl.y + (F.btl.y - F.ftl.y) * 0.06);
    ctx.moveTo(F.fbr.x + (F.bbr.x - F.fbr.x) * 0.06, F.fbr.y + (F.bbr.y - F.fbr.y) * 0.06);
    ctx.lineTo(F.ftr.x + (F.btr.x - F.ftr.x) * 0.06, F.ftr.y + (F.btr.y - F.ftr.y) * 0.06);
    ctx.stroke();
    ctx.restore();
  }

  function drawCeiling(ctx, F, machine) {
    quad(ctx, F.ftl, F.ftr, F.btr, F.btl, ART.shade(machine.def.art.body2, -0.55));
  }

  /* the floor, the grid and the prize hole */
  function drawFloor(ctx, F, machine, cam) {
    var B = C.BOX;
    var g = ctx.createLinearGradient(0, F.bbl.y, 0, F.fbl.y);
    g.addColorStop(0, '#241f2c');
    g.addColorStop(1, '#3a3346');
    quad(ctx, F.bbl, F.bbr, F.fbr, F.fbl, g);

    /* a soft repeating tile grid, drawn in projection */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(F.bbl.x, F.bbl.y); ctx.lineTo(F.bbr.x, F.bbr.y);
    ctx.lineTo(F.fbr.x, F.fbr.y); ctx.lineTo(F.fbl.x, F.fbl.y);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,.055)';
    ctx.lineWidth = 1;
    var i, t, a, b;
    for (i = -3; i <= 3; i++) {
      a = cam.at(i * 0.3, 0, -B.hz); b = cam.at(i * 0.3, 0, B.hz);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (i = -2; i <= 2; i++) {
      a = cam.at(-B.hx, 0, i * 0.3); b = cam.at(B.hx, 0, i * 0.3);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    /* a warm pool of light from the cabinet's own lamp */
    t = cam.at(0, 0, -0.1);
    var lamp = ctx.createRadialGradient(t.x, t.y, 10, t.x, t.y, (F.fbr.x - F.fbl.x) * 0.72);
    lamp.addColorStop(0, 'rgba(255,240,205,.20)');
    lamp.addColorStop(1, 'rgba(255,240,205,0)');
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);
    ctx.restore();
  }

  /* The prize chute.  Reading a hole in a floor at a shallow angle comes down
   * to three cues: the floor must visibly stop, the interior must be genuinely
   * dark, and the near rim must catch a hard highlight.  A bright frame does
   * the opposite and turns the hole into a raised platform, so the rim here is
   * deliberately dark.
   *
   * Everything inside the pit is clipped to the projected opening, because at
   * this camera angle you can only ever see the far wall and a sliver of the
   * side walls — drawing the rest would paint over the floor in front of the
   * hole and make it look like a box sitting on the floor.                   */
  function drawChute(ctx, F, cam, machine) {
    var ch = C.CHUTE, H = C.CHUTE_LIP, W = 0.05;
    var deep = -0.34;
    var g = machine.def.art;

    var a0 = cam.at(ch.x0, 0, ch.z0), b0 = cam.at(ch.x1, 0, ch.z0);
    var c0 = cam.at(ch.x1, 0, ch.z1), d0 = cam.at(ch.x0, 0, ch.z1);

    ctx.save();
    /* clip to the opening, so nothing can spill onto the surrounding floor */
    ctx.beginPath();
    ctx.moveTo(a0.x, a0.y); ctx.lineTo(b0.x, b0.y);
    ctx.lineTo(c0.x, c0.y); ctx.lineTo(d0.x, d0.y);
    ctx.closePath();
    ctx.clip();

    /* the pit floor */
    var pa = cam.at(ch.x0, deep, ch.z0), pb = cam.at(ch.x1, deep, ch.z0);
    var pc = cam.at(ch.x1, deep, ch.z1), pd = cam.at(ch.x0, deep, ch.z1);
    quad(ctx, pa, pb, pc, pd, '#0a0c12');

    /* The far wall.  At this camera angle it is the only surface you actually
     * see through the opening, so it is a brushed steel chute catching the
     * machine's lamp — which is what real prize chutes look like, and what
     * makes the opening read as "inside the machine" rather than as a slab.
     * It starts at floor level, not at the rim height, so the lit top of the
     * gradient is inside the opening rather than clipped away above it.     */
    var ta = cam.at(ch.x0, 0, ch.z0), tb = cam.at(ch.x1, 0, ch.z0);
    var steel = ctx.createLinearGradient(0, ta.y, 0, pa.y);
    steel.addColorStop(0, '#cdd7ea');
    steel.addColorStop(0.18, '#98a3b9');
    steel.addColorStop(0.46, '#5c6679');
    steel.addColorStop(0.76, '#2c3444');
    steel.addColorStop(1, '#0d1118');
    quad(ctx, ta, tb, pb, pa, steel);
    /* vertical ribs pressed into the steel */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.13)';
    ctx.lineWidth = 1;
    for (var rb = 1; rb < 8; rb++) {
      var rx0 = C.lerp(ch.x0, ch.x1, rb / 8);
      var r1 = cam.at(rx0, 0, ch.z0), r2 = cam.at(rx0, deep, ch.z0);
      ctx.beginPath(); ctx.moveTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.stroke();
    }
    ctx.restore();

    /* The lamp catching the steel right at the far lip.  This band is the cue
     * that actually makes the opening read as a recess, so it is deliberately
     * strong and sits exactly under the far edge of the floor.             */
    var lip = ctx.createLinearGradient(0, ta.y, 0, ta.y + 34);
    lip.addColorStop(0, 'rgba(240,247,255,.9)');
    lip.addColorStop(0.35, 'rgba(200,216,242,.38)');
    lip.addColorStop(1, 'rgba(200,216,242,0)');
    ctx.fillStyle = lip;
    ctx.fillRect(0, ta.y, C.GAME_W, 36);
    ctx.save();
    ctx.strokeStyle = 'rgba(248,252,255,.92)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(ta.x, ta.y + 0.5); ctx.lineTo(tb.x, tb.y + 0.5);
    ctx.stroke();
    ctx.restore();

    /* side walls of the chute, darker steel */
    quad(ctx, cam.at(ch.x0, 0, ch.z0), cam.at(ch.x0, 0, ch.z1), pd, pa, '#39414f');
    quad(ctx, cam.at(ch.x1, 0, ch.z0), cam.at(ch.x1, 0, ch.z1), pc, pb, '#4a5364');

    /* the machine's lamp, glowing out of the chute */
    var lc = cam.at((ch.x0 + ch.x1) / 2, -0.06, (ch.z0 + ch.z1) / 2);
    var lamp = ctx.createRadialGradient(lc.x, lc.y, 1, lc.x, lc.y, Math.abs(b0.x - a0.x) * 0.75);
    lamp.addColorStop(0, ART.rgba(g.led, 0.38));
    lamp.addColorStop(0.45, ART.rgba(g.led, 0.12));
    lamp.addColorStop(1, ART.rgba(g.led, 0));
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);

    /* A strip curtain across the near lip: the plastic fingers a prize pushes
     * through on its way into the bin.  It sits only at the near edge so the
     * lit steel behind it stays visible — a full flap would simply cover the
     * opening and turn the chute back into a dark slab.                     */
    var strips = 5;
    for (var st = 0; st < strips; st++) {
      var t0 = st / strips + 0.035, t1 = (st + 1) / strips - 0.035;
      var zc = ch.z1 - 0.015;
      var g1a = cam.at(C.lerp(ch.x0, ch.x1, t0), H - 0.004, zc);
      var g1b = cam.at(C.lerp(ch.x0, ch.x1, t1), H - 0.004, zc);
      var g2a = cam.at(C.lerp(ch.x0, ch.x1, t0), -0.10, zc - 0.06);
      var g2b = cam.at(C.lerp(ch.x0, ch.x1, t1), -0.10, zc - 0.06);
      quad(ctx, g1a, g1b, g2b, g2a, 'rgba(150,168,200,0.20)');
      ctx.save();
      ctx.strokeStyle = 'rgba(214,230,255,.34)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(g1a.x, g1a.y); ctx.lineTo(g2a.x, g2a.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    /* The rim: a dark lip, with the near edge catching the light.  Only the
     * bars whose inner face actually looks back at the camera draw it — the
     * near and right bars' inner faces are hidden behind the floor, and
     * painting them would smear a dark band across the floor in front of the
     * hole and turn the whole thing into a slab lying on the ground.        */
    rimBar(ctx, cam, ch.x0, ch.z0, ch.x1, ch.z0, 0, -W, H, deep, false, true);    // back
    rimBar(ctx, cam, ch.x0, ch.z1, ch.x1, ch.z1, 0, W, H, deep, true, false);     // front
    rimBar(ctx, cam, ch.x0, ch.z0, ch.x0, ch.z1, -W, 0, H, deep, false, true);    // left
    rimBar(ctx, cam, ch.x1, ch.z0, ch.x1, ch.z1, W, 0, H, deep, false, false);    // right

    /* a hard specular along the near inner edge */
    ctx.save();
    ctx.strokeStyle = 'rgba(214,228,255,.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cam.at(ch.x0, H + 0.002, ch.z1).x, cam.at(ch.x0, H + 0.002, ch.z1).y);
    ctx.lineTo(cam.at(ch.x1, H + 0.002, ch.z1).x, cam.at(ch.x1, H + 0.002, ch.z1).y);
    ctx.stroke();
    ctx.restore();

    /* a floor decal in front of the chute */
    var dec = cam.at((ch.x0 + ch.x1) / 2, 0.004, ch.z1 + 0.22);
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 20px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#cfe0ff';
    ctx.fillText('▼', dec.x, dec.y - 8);
    ctx.font = '700 11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('PRIZE', dec.x, dec.y + 10);
    ctx.restore();
  }

  /* one bar of the raised rim: the shaft wall inside, the top face, and the
   * outer face that stands on the floor                                      */
  function rimBar(ctx, cam, ax, az, bx, bz, ox, oz, h, deep, lit, inner) {
    var iA = cam.at(ax, h, az), iB = cam.at(bx, h, bz);
    var iAd = cam.at(ax, deep, az), iBd = cam.at(bx, deep, bz);
    var oA = cam.at(ax + ox, h, az + oz), oB = cam.at(bx + ox, h, bz + oz);
    var oAf = cam.at(ax + ox, 0, az + oz), oBf = cam.at(bx + ox, 0, bz + oz);

    /* the outer face, standing on the floor */
    quad(ctx, oA, oB, oBf, oAf, lit ? '#4a4553' : '#33303c');
    /* the top face of the lip: brushed, dark, with the light coming from the
     * front so only the near bar really shines                              */
    var g = ctx.createLinearGradient(oA.x, oA.y, iA.x, iA.y);
    if (lit) {
      g.addColorStop(0, '#7d879b');
      g.addColorStop(0.5, '#aab4c8');
      g.addColorStop(1, '#5e677a');
    } else {
      g.addColorStop(0, '#3b3f4c');
      g.addColorStop(0.55, '#565b6b');
      g.addColorStop(1, '#2c2f3a');
    }
    quad(ctx, oA, oB, iB, iA, g);
    /* the inner face, which only exists on the bars facing the camera */
    if (inner) {
      var s = ctx.createLinearGradient(0, iA.y, 0, iAd.y);
      s.addColorStop(0, lit ? '#1d2230' : '#12151d');
      s.addColorStop(1, '#030408');
      quad(ctx, iA, iB, iBd, iAd, s);
    }
  }

  /* ---------------- prizes and the claw ---------------------------------- */

  var shadows = [];

  function pushShadow(pos, r, s) {
    shadows.push({ p: pos, r: r, s: s });
  }

  function drawShadows(ctx, cam) {
    ctx.save();
    for (var i = 0; i < shadows.length; i++) {
      var sh = shadows[i];
      var p = cam.at(sh.p.x, 0.004, sh.p.z);
      var rr = sh.s * sh.r;
      /* a toy that is high up casts a softer, wider shadow */
      var lift = C.clamp((sh.p.y - sh.r) / 0.7, 0, 1);
      ctx.globalAlpha = 0.30 * (1 - lift * 0.65);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rr * (1 + lift * 0.45), rr * 0.34 * (1 + lift * 0.45), 0, 0, TAU);
      ctx.fillStyle = '#05060a';
      ctx.fill();
    }
    ctx.restore();
  }

  function prizeItem(ctx, b, cam, t) {
    var p = cam.at(b.x, b.y, b.z);
    var s = b.r * p.s;              // half-size in pixels
    return {
      d: p.d,
      draw: function () {
        ART.draw(ctx, b.prize, p.x, p.y, s, {
          rot: b.rot * 0.35,
          lean: b.lean,
          t: t,
          phase: b.id,
          squash: b.support > 0 ? 0.03 : 0,
          shadow: false
        });
      }
    };
  }

  function drawClaw(ctx, claw, cam, t) {
    var items = [];
    var y = claw.y;
    var tips = claw.tips();
    var hub = cam.at(claw.x, y, claw.z);
    var hubR = C.CLAW.hubR * hub.s;

    /* ---- the carriage and its cables, drawn first (they are above) ---- */
    var cw = 0.15;
    var c0 = cam.at(claw.x - cw, C.BOX.top - 0.02, claw.z);
    var c1 = cam.at(claw.x + cw, C.BOX.top - 0.02, claw.z);
    var c2 = cam.at(claw.x + cw, C.BOX.top - 0.16, claw.z);
    var c3 = cam.at(claw.x - cw, C.BOX.top - 0.16, claw.z);

    /* cables from the four corners of the carriage down to the hub */
    ctx.save();
    ctx.lineCap = 'round';
    var cbl = [[-cw, 0.14], [cw, 0.14], [-cw * 0.7, -0.10], [cw * 0.7, -0.10]];
    for (var i = 0; i < cbl.length; i++) {
      var top = cam.at(claw.x + cbl[i][0], C.BOX.top - 0.14, claw.z + cbl[i][1]);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(hub.x, hub.y);
      ctx.strokeStyle = i % 2 ? '#4b5266' : '#5d657c';
      ctx.lineWidth = Math.max(1.2, hub.s * 0.010);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(hub.x, hub.y);
      ctx.strokeStyle = 'rgba(255,255,255,.20)';
      ctx.lineWidth = Math.max(0.5, hub.s * 0.003);
      ctx.stroke();
    }
    ctx.restore();

    /* prongs: two behind the hub, one in front */
    var order = [];
    for (var k = 0; k < 3; k++) {
      var tip = tips[k];
      var tp = cam.at(tip.x, tip.y, tip.z);
      order.push({ tip: tip, p: tp, front: tp.d < hub.d, k: k });
    }
    order.sort(function (a, b) { return (a.front ? 1 : 0) - (b.front ? 1 : 0); });

    /* A real crane finger is a hooked strip of steel: out from the hub, down
     * and outward to a knuckle, then curling back inwards at the tip so the
     * claw actually cradles what it is holding.  Four points in 3-D, projected,
     * then given a tapering width.                                           */
    function prong(o) {
      var tip = o.tip;
      var dx = tip.x - claw.x, dz = tip.z - claw.z;
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      dx /= len; dz /= len;
      var R = len, D = claw.y - tip.y;
      var pts3 = [
        [claw.x + dx * C.CLAW.hubR * 0.7, claw.y - D * 0.02, claw.z + dz * C.CLAW.hubR * 0.7],
        [claw.x + dx * R * 0.56, claw.y - D * 0.34, claw.z + dz * R * 0.56],
        [claw.x + dx * R * 0.96, claw.y - D * 0.76, claw.z + dz * R * 0.96],
        [claw.x + dx * R * 0.62, claw.y - D * 1.12, claw.z + dz * R * 0.62]
      ];
      var pp = [], i;
      for (i = 0; i < pts3.length; i++) pp.push(cam.at(pts3[i][0], pts3[i][1], pts3[i][2]));
      var wid = [C.CLAW.hubR * 0.78, C.CLAW.hubR * 0.62, C.CLAW.tipR * 0.90, C.CLAW.tipR * 0.26];

      var left = [], right = [];
      for (i = 0; i < pp.length; i++) {
        var a = pp[Math.max(0, i - 1)], b = pp[Math.min(pp.length - 1, i + 1)];
        var tx = b.x - a.x, ty = b.y - a.y;
        var tl = Math.sqrt(tx * tx + ty * ty) || 1;
        var nx = -ty / tl, ny = tx / tl;
        var w = Math.max(0.7, wid[i] * pp[i].s);
        left.push({ x: pp[i].x + nx * w, y: pp[i].y + ny * w });
        right.push({ x: pp[i].x - nx * w, y: pp[i].y - ny * w });
      }
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
      ctx.quadraticCurveTo(pp[3].x, pp[3].y, right[3].x, right[3].y);
      for (i = right.length - 2; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
      ctx.closePath();
      var g = ctx.createLinearGradient(left[1].x, left[1].y, right[1].x, right[1].y);
      g.addColorStop(0, '#eef2fa');
      g.addColorStop(0.28, '#b6bfd2');
      g.addColorStop(0.55, '#848fa6');
      g.addColorStop(0.80, '#5b6478');
      g.addColorStop(1, '#333a49');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(14,16,22,.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      /* specular running down the outside of the finger */
      ctx.beginPath();
      ctx.moveTo(left[0].x, left[0].y);
      for (i = 1; i < left.length; i++) ctx.lineTo(left[i].x, left[i].y);
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.lineWidth = Math.max(0.8, pp[0].s * 0.004);
      ctx.stroke();
    }

    for (i = 0; i < order.length; i++) if (!order[i].front) prong(order[i]);

    /* the hub */
    ctx.save();
    var hg = ctx.createLinearGradient(hub.x - hubR, 0, hub.x + hubR, 0);
    hg.addColorStop(0, '#e6ebf5');
    hg.addColorStop(0.35, '#a8b1c4');
    hg.addColorStop(0.65, '#79839a');
    hg.addColorStop(1, '#4a5266');
    ctx.beginPath();
    ctx.ellipse(hub.x, hub.y, hubR, hubR * 0.92, 0, 0, TAU);
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,18,26,.6)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(hub.x, hub.y - hubR * 0.28, hubR * 0.62, hubR * 0.30, 0, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fill();
    ctx.restore();

    for (i = 0; i < order.length; i++) if (order[i].front) prong(order[i]);

    /* the grippy pads on the inside of the fingers */
    if (claw.open < 0.55) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      for (i = 0; i < 3; i++) {
        var tp2 = cam.at(tips[i].x * 0.86 + claw.x * 0.14, tips[i].y + 0.03, tips[i].z * 0.86 + claw.z * 0.14);
        ctx.beginPath();
        ctx.arc(tp2.x, tp2.y, Math.max(1.2, hub.s * 0.012), 0, TAU);
        ctx.fillStyle = '#2b2f3c';
        ctx.fill();
      }
      ctx.restore();
    }

    /* the carriage block, drawn last so it overlaps the cables */
    ctx.save();
    poly(ctx, [c0, c1, c2, c3], '#6d768c');
    poly(ctx, [cam.at(claw.x - cw, C.BOX.top - 0.02, claw.z),
               cam.at(claw.x + cw, C.BOX.top - 0.02, claw.z),
               cam.at(claw.x + cw, C.BOX.top - 0.02, claw.z + 0.24),
               cam.at(claw.x - cw, C.BOX.top - 0.02, claw.z + 0.24)], '#828ca4');
    ctx.restore();

    return { d: hub.d };
  }

  /* ---------------- glass, frame, furniture ------------------------------ */

  function drawGlass(ctx, F, machine, t) {
    var art = machine.def.art;
    var g = ctx.createLinearGradient(F.ftl.x, F.ftl.y, F.fbl.x, F.fbl.y);
    g.addColorStop(0, 'rgba(190,225,255,.16)');
    g.addColorStop(0.30, 'rgba(190,225,255,.045)');
    g.addColorStop(0.62, 'rgba(190,225,255,.02)');
    g.addColorStop(1, 'rgba(190,225,255,.075)');
    quad(ctx, F.ftl, F.ftr, F.fbr, F.fbl, g);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(F.ftl.x, F.ftl.y); ctx.lineTo(F.ftr.x, F.ftr.y);
    ctx.lineTo(F.fbr.x, F.fbr.y); ctx.lineTo(F.fbl.x, F.fbl.y);
    ctx.closePath();
    ctx.clip();
    /* two long diagonal reflections that slide as the machine "moves" */
    ctx.globalAlpha = 0.075;
    var slide = (t * 14) % ((F.fbr.x - F.fbl.x) * 1.6);
    for (var i = 0; i < 2; i++) {
      var x0 = F.fbl.x - (F.fbr.x - F.fbl.x) * 0.5 + slide + i * 300;
      ctx.beginPath();
      ctx.moveTo(x0, F.fbl.y);
      ctx.lineTo(x0 + 110, F.fbl.y);
      ctx.lineTo(x0 + 260, F.ftl.y);
      ctx.lineTo(x0 + 150, F.ftl.y);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    /* the cabinet's own light spilling onto the glass */
    var lamp = ctx.createRadialGradient(
      (F.ftl.x + F.ftr.x) / 2, F.ftl.y + 20, 8,
      (F.ftl.x + F.ftr.x) / 2, F.ftl.y + 20, (F.fbr.x - F.fbl.x) * 0.62);
    lamp.addColorStop(0, ART.rgba(art.led, 0.16));
    lamp.addColorStop(1, ART.rgba(art.led, 0));
    ctx.fillStyle = lamp;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);
    ctx.restore();

    /* edge highlight where the glass meets the frame */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(F.ftl.x, F.ftl.y); ctx.lineTo(F.ftr.x, F.ftr.y);
    ctx.stroke();
    ctx.restore();
  }

  function drawFrame(ctx, F, machine, t) {
    var art = machine.def.art;
    var W = 30;                       // frame thickness in screen pixels

    /* left and right pillars */
    var lw = [
      { x: F.ftl.x, y: F.ftl.y }, { x: F.fbl.x, y: F.fbl.y },
      { x: F.fbl.x - W, y: F.fbl.y + 10 }, { x: F.ftl.x - W, y: F.ftl.y + 6 }
    ];
    var rw = [
      { x: F.ftr.x, y: F.ftr.y }, { x: F.fbr.x, y: F.fbr.y },
      { x: F.fbr.x + W, y: F.fbr.y + 10 }, { x: F.ftr.x + W, y: F.ftr.y + 6 }
    ];
    var lg = ctx.createLinearGradient(F.ftl.x - W, 0, F.ftl.x, 0);
    lg.addColorStop(0, ART.shade(art.body2, -0.45));
    lg.addColorStop(0.55, ART.shade(art.body, -0.12));
    lg.addColorStop(1, ART.shade(art.body, 0.10));
    poly(ctx, lw, lg);
    var rg = ctx.createLinearGradient(F.ftr.x, 0, F.ftr.x + W, 0);
    rg.addColorStop(0, ART.shade(art.body, 0.10));
    rg.addColorStop(0.45, ART.shade(art.body, -0.12));
    rg.addColorStop(1, ART.shade(art.body2, -0.45));
    poly(ctx, rw, rg);

    /* top rail */
    var tg = ctx.createLinearGradient(0, F.ftl.y - 26, 0, F.ftl.y + 8);
    tg.addColorStop(0, ART.shade(art.body, 0.16));
    tg.addColorStop(1, ART.shade(art.body2, -0.20));
    poly(ctx, [
      { x: F.ftl.x - W, y: F.ftl.y + 6 }, { x: F.ftr.x + W, y: F.ftr.y + 6 },
      { x: F.ftr.x + W, y: F.ftr.y - 26 }, { x: F.ftl.x - W, y: F.ftl.y - 26 }
    ], tg);

    /* a chrome inlay along the top rail */
    poly(ctx, [
      { x: F.ftl.x - W + 4, y: F.ftl.y - 6 }, { x: F.ftr.x + W - 4, y: F.ftr.y - 6 },
      { x: F.ftr.x + W - 4, y: F.ftr.y - 13 }, { x: F.ftl.x - W + 4, y: F.ftl.y - 13 }
    ], ART.shade(art.trim, -0.05));

    /* the base plinth below the glass, which carries the controls */
    var baseTop = F.fbl.y + 10;
    var bh = C.GAME_H - baseTop - 6;
    var bg = ctx.createLinearGradient(0, baseTop, 0, C.GAME_H);
    bg.addColorStop(0, ART.shade(art.body, -0.06));
    bg.addColorStop(0.18, ART.shade(art.body2, -0.18));
    bg.addColorStop(1, ART.shade(art.body2, -0.52));
    poly(ctx, [
      { x: F.fbl.x - W, y: baseTop }, { x: F.fbr.x + W, y: baseTop },
      { x: F.fbr.x + W, y: C.GAME_H }, { x: F.fbl.x - W, y: C.GAME_H }
    ], bg);

    /* the control-panel top surface, a lighter shelf */
    poly(ctx, [
      { x: F.fbl.x - W, y: baseTop }, { x: F.fbr.x + W, y: baseTop },
      { x: F.fbr.x + W, y: baseTop + 16 }, { x: F.fbl.x - W, y: baseTop + 16 }
    ], ART.shade(art.body, 0.22));

    /* the prize door on the left of the plinth */
    var dw = (F.fbr.x - F.fbl.x) * 0.30;
    var dx = F.fbl.x + 24;
    var dy = baseTop + 46;
    var dh = Math.min(96, C.GAME_H - dy - 26);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dx, dy); ctx.lineTo(dx + dw, dy);
    ctx.lineTo(dx + dw, dy + dh); ctx.lineTo(dx, dy + dh);
    ctx.closePath();
    var dg = ctx.createLinearGradient(dx, dy, dx, dy + dh);
    dg.addColorStop(0, '#171a22');
    dg.addColorStop(1, '#0b0d13');
    ctx.fillStyle = dg; ctx.fill();
    ctx.strokeStyle = ART.shade(art.body, 0.35);
    ctx.lineWidth = 3; ctx.stroke();
    /* the flap */
    ctx.beginPath();
    ctx.moveTo(dx + 6, dy + 8); ctx.lineTo(dx + dw - 6, dy + 8);
    ctx.lineTo(dx + dw - 6, dy + dh * 0.42); ctx.lineTo(dx + 6, dy + dh * 0.42);
    ctx.closePath();
    ctx.fillStyle = 'rgba(150,160,180,.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
    label(ctx, dx + dw / 2, dy + dh * 0.62, C.GAME_H > 0 ? '↓' : '', 22, 'rgba(255,255,255,.30)');

    /* the coin slot on the right */
    var sx = F.fbr.x - 70, sy = baseTop + 40;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, TAU);
    ctx.fillStyle = ART.shade(art.body2, -0.30);
    ctx.fill();
    ctx.strokeStyle = ART.rgba(art.led, 0.9);
    ctx.lineWidth = 2.5;
    ctx.shadowColor = art.led;
    ctx.shadowBlur = 12 + 6 * Math.sin(t * 3);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(sx - 5, sy - 13, 10, 26, 3) : ctx.rect(sx - 5, sy - 13, 10, 26);
    ctx.fillStyle = '#0a0c12';
    ctx.fill();
    ctx.restore();
  }

  function label(ctx, x, y, text, size, colour) {
    if (!text) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + size + 'px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = colour;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* the illuminated header above the cabinet */
  function drawMarquee(ctx, F, machine, t, lang) {
    var art = machine.def.art;
    var W = 30;
    var top = F.ftl.y - 26;
    var h = Math.max(52, top - 2);
    var x0 = F.ftl.x - W - 26, x1 = F.ftr.x + W + 26;
    var y1 = top;

    var g = ctx.createLinearGradient(0, y1 - h, 0, y1);
    g.addColorStop(0, ART.shade(art.body, 0.05));
    g.addColorStop(0.5, art.body2);
    g.addColorStop(1, ART.shade(art.body2, -0.35));
    poly(ctx, [{ x: x0, y: y1 - h }, { x: x1, y: y1 - h }, { x: x1, y: y1 }, { x: x0, y: y1 }], g);

    /* neon tube around the header */
    ctx.save();
    ctx.strokeStyle = ART.rgba(art.led, 0.95);
    ctx.shadowColor = art.led;
    ctx.shadowBlur = 18 + 8 * Math.sin(t * 2.2);
    ctx.lineWidth = 3;
    ctx.strokeRect(x0 + 7, y1 - h + 7, (x1 - x0) - 14, h - 14);
    ctx.restore();

    /* title: the cabinet's name on a white plate, FURI-branded, with the
     * crown badge either side of it.  Name and subtitle both live on the
     * plate so nothing spills onto the cabinet's top rail. */
    var name = NS.I18N.pick(machine.def.name, lang);
    var plateW = Math.min((x1 - x0) - 70, 640);
    var plateX = (x0 + x1) / 2 - plateW / 2;
    var plateTop = y1 - h + 8;
    var plateH = h - 14;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(plateX, plateTop);
    ctx.lineTo(plateX + plateW, plateTop);
    ctx.lineTo(plateX + plateW, plateTop + plateH);
    ctx.lineTo(plateX, plateTop + plateH);
    ctx.closePath();
    ctx.fillStyle = '#FDFEFD';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#020202';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    ART.crownLogo(ctx, plateX + plateW * 0.075, plateTop + plateH * 0.44, plateH * 0.34);
    ART.crownLogo(ctx, plateX + plateW * 0.925, plateTop + plateH * 0.44, plateH * 0.34);

    var size = Math.min(plateH * 0.46, (plateW * 0.76) / Math.max(6, name.length * 0.60));
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 ' + size.toFixed(0) + 'px "Arial Black", Impact, "Microsoft JhengHei", sans-serif';
    ctx.fillStyle = art.body2;
    ctx.fillText(name, (x0 + x1) / 2, plateTop + plateH * 0.40);
    ctx.restore();

    var sub = NS.I18N.pick(machine.def.sub, lang);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.max(9, plateH * 0.24).toFixed(0) + 'px "Segoe UI", "Microsoft JhengHei", Arial, sans-serif';
    ctx.fillStyle = '#5C6672';
    ctx.fillText(sub, (x0 + x1) / 2, plateTop + plateH * 0.78);
    ctx.restore();
  }

  /* ---------------- the assembled cabinet -------------------------------- */

  /* `opts`: {t, lang, dim, showClaw, mask} */
  function drawCabinet(ctx, machine, opts) {
    opts = opts || {};
    var t = opts.t || 0;
    var lang = opts.lang || 'zh';
    var cam = opts.cam || new Camera();

    var F = buildFrame(cam);
    F._cam = cam;

    /* the room behind everything */
    var room = ctx.createRadialGradient(C.GAME_W / 2, C.GAME_H * 0.30, 40,
                                        C.GAME_W / 2, C.GAME_H * 0.55, C.GAME_W * 0.75);
    room.addColorStop(0, '#1a2030');
    room.addColorStop(0.55, '#0d1119');
    room.addColorStop(1, '#05070b');
    ctx.fillStyle = room;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);

    /* the interior, clipped to the front opening */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(F.ftl.x, F.ftl.y); ctx.lineTo(F.ftr.x, F.ftr.y);
    ctx.lineTo(F.fbr.x, F.fbr.y); ctx.lineTo(F.fbl.x, F.fbl.y);
    ctx.closePath();
    ctx.clip();

    drawBackWall(ctx, F, machine, lang);
    drawSideWalls(ctx, F, machine);
    drawCeiling(ctx, F, machine);
    drawFloor(ctx, F, machine, cam);
    drawChute(ctx, F, cam, machine);

    /* gantry rails across the ceiling */
    var railY = C.BOX.top - 0.10;
    for (var s = -1; s <= 1; s += 2) {
      var a = cam.at(-C.BOX.hx + 0.10, railY, s * 0.30);
      var b = cam.at(C.BOX.hx - 0.10, railY, s * 0.30);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = '#7d879c';
      ctx.lineWidth = Math.max(2, a.s * 0.016);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(a.x, a.y - Math.max(1, a.s * 0.006));
      ctx.lineTo(b.x, b.y - Math.max(1, a.s * 0.006));
      ctx.strokeStyle = 'rgba(255,255,255,.30)';
      ctx.lineWidth = Math.max(1, a.s * 0.005);
      ctx.stroke();
    }
    /* the rail the claw runs along in z */
    var ra = cam.at(machine.claw.x, railY, -0.30);
    var rb = cam.at(machine.claw.x, railY, 0.30);
    ctx.beginPath();
    ctx.moveTo(ra.x, ra.y); ctx.lineTo(rb.x, rb.y);
    ctx.strokeStyle = '#8f98ac';
    ctx.lineWidth = Math.max(2, ra.s * 0.014);
    ctx.stroke();

    /* ---- shadows on the floor ---- */
    shadows.length = 0;
    for (var i = 0; i < machine.world.bodies.length; i++) {
      var b = machine.world.bodies[i];
      var pp = cam.at(b.x, 0, b.z);
      pushShadow(b, b.r, pp.s);
    }
    drawShadows(ctx, cam);

    /* ---- prizes and the claw, sorted back to front ---- */
    var items = [];
    for (i = 0; i < machine.world.bodies.length; i++) {
      items.push(prizeItem(ctx, machine.world.bodies[i], cam, t));
    }
    /* the claw joins the same sorted list, so a prize hanging in front of it
     * is drawn in front of it and one behind it is drawn behind it */
    items.push({
      d: cam.at(machine.claw.x, machine.claw.y, machine.claw.z).d,
      draw: function () { drawClaw(ctx, machine.claw, cam, t); }
    });
    items.sort(function (a, b) { return b.d - a.d; });
    for (i = 0; i < items.length; i++) items[i].draw();

    /* ---- interior atmosphere ---- */
    /* ---- depth haze and vignette ------------------------------------- *
     * A shallow-angle view of a deep box loses depth fast.  The back of the
     * cabinet is higher up the screen, so a vertical haze gradient reads as
     * atmospheric perspective and makes the pile sit inside a volume rather
     * than on a flat backdrop.                                              */
    var top = F.btl.y - 10, bot = F.fbl.y;
    var haze = ctx.createLinearGradient(0, top, 0, bot);
    haze.addColorStop(0, 'rgba(8,10,20,.55)');
    haze.addColorStop(0.42, 'rgba(8,10,20,.22)');
    haze.addColorStop(0.78, 'rgba(8,10,20,.03)');
    haze.addColorStop(1, 'rgba(8,10,20,0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);

    var vig = ctx.createRadialGradient(C.GAME_W / 2, F.ftl.y + (F.fbl.y - F.ftl.y) * 0.45, 60,
                                       C.GAME_W / 2, F.ftl.y + (F.fbl.y - F.ftl.y) * 0.45,
                                       (F.fbr.x - F.fbl.x) * 0.95);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);

    ctx.restore();

    drawGlass(ctx, F, machine, t);
    drawFrame(ctx, F, machine, t);
    drawMarquee(ctx, F, machine, t, lang);

    if (opts.dim) {
      ctx.fillStyle = 'rgba(4,6,10,' + opts.dim + ')';
      ctx.fillRect(0, 0, C.GAME_W, C.GAME_H);
    }
    return F;
  }

  function performance0() { return (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000); }

  NS.Renderer = {
    Camera: Camera,
    drawCabinet: drawCabinet,
    buildFrame: buildFrame,
    quad: quad,
    poly: poly,
    drawClaw: drawClaw
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = NS.Renderer;
})(typeof globalThis !== 'undefined' ? globalThis : this);
