'use strict';
/* =========================================================================
 * js/claw.js — the device itself.
 *
 * Three fingers on a hub, hanging from a gantry that can travel in x and z and
 * winch up and down in y.  The physically interesting part is the grip.
 *
 * When the fingers close they clamp with a finite force.  What they have to
 * hold up is the toy's weight, multiplied by how slippery its fabric is, by
 * how badly off-centre the grab was, by how big the toy is compared with the
 * claw, and by how hard the gantry is currently accelerating.  Supply minus
 * demand becomes `integrity`: at 1.0 the toy is clamped solid, at 0 the toy
 * has squirted out of the fingers.  Between those two numbers the toy visibly
 * sags and swings, which is the whole drama of a claw machine.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C, K = C.CLAW;

  var TAU = Math.PI * 2;

  function Claw(seed) {
    this.rng = new C.Rng(seed || 7);
    this.x = C.HOME.x; this.y = C.HOME.y; this.z = C.HOME.z;
    this.vx = 0; this.vy = 0; this.vz = 0;
    this.ax = 0; this.ay = 0; this.az = 0;
    this.tx = C.HOME.x; this.tz = C.HOME.z;
    this.open = 1;
    this.held = null;
    this.integrity = 1;
    this.gripForce = 3;
    this.centering = 0;
    this.sizeFactor = 1;
    this.firm = false;
    this.swx = 0; this.swz = 0;     // swing offset of the carried toy
    this.swvx = 0; this.swvz = 0;
    this.joltTimer = 1.2;
    this.jolt = 0;
    this.strain = 0;
    this.ratio = 1;                 // supply / demand, for the HUD
    this.speedMul = 1;
    this.softClose = 0;
    this.tipOverride = null;        // renderer hook: last computed tips
    this.slips = 0;
    /* sane defaults, so the claw can be exercised before a shop exists */
    this.stats = { grip: 0, slipResist: 0, aim: 0, luck: 0, speed: 0, softClose: 0 };
    this.diff = C.DIFF.fun;
    this.slipResist = 0;
    this.aim = 0;
    this.luck = 0;
  }

  Claw.prototype.home = function () {
    this.x = this.tx = C.HOME.x;
    this.z = this.tz = C.HOME.z;
    this.y = C.HOME.y;
    this.vx = this.vy = this.vz = 0;
    this.ax = this.ay = this.az = 0;
    this.open = 1;
    this.held = null;
    this.integrity = 1;
    this.swx = this.swz = this.swvx = this.swvz = 0;
    this.strain = 0;
    this.ratio = 1;
  };

  /* Apply the player's upgrades and the machine's difficulty.  `stats` is the
   * bag built by js/player.js from the shop.                                */
  Claw.prototype.configure = function (stats, diff) {
    this.diff = diff || C.DIFF.fun;
    if (stats) this.stats = stats;
    this.gripForce = this.diff.grip + this.stats.grip;
    this.slipResist = this.stats.slipResist;
    this.aim = this.stats.aim;
    this.luck = this.stats.luck;
    this.softClose = this.stats.softClose;
    this.speedMul = 1 + this.stats.speed;
  };

  /* ---- geometry ---------------------------------------------------------- */

  Claw.prototype.reach = function () {
    return C.lerp(K.reachClosed, K.reachOpen, this.open);
  };

  Claw.prototype.fingerDrop = function () {
    return C.lerp(K.fingerDropClosed, K.fingerDropOpen, this.open);
  };

  Claw.prototype.captureRadius = function () {
    return K.reachOpen + K.tipR;
  };

  /* the three finger tip positions in world space */
  Claw.prototype.tips = function () {
    var out = [];
    var rr = this.reach();
    var drop = this.fingerDrop();
    for (var i = 0; i < 3; i++) {
      var a = -Math.PI / 2 + i * TAU / 3;
      out.push({
        x: this.x + Math.cos(a) * rr,
        y: this.y - drop,
        z: this.z + Math.sin(a) * rr * 0.92,
        r: K.tipR
      });
    }
    return out;
  };

  /* ---- kinematics -------------------------------------------------------- */

  Claw.prototype.speedFor = function (base) { return base * this.speedMul; };

  Claw.prototype.stepMove = function (dt, world, phase, input, hooks) {
    var sp = this.speedFor(K.travelSpeed);
    if (input && input.slow) sp *= 0.32;

    var ax = 0, az = 0;
    if (input) {
      if (input.left) ax -= 1;
      if (input.right) ax += 1;
      if (input.up) az -= 1;
      if (input.down) az += 1;
    }
    var len = Math.sqrt(ax * ax + az * az);
    if (len > 0) { ax /= len; az /= len; }

    /* ramp the gantry up rather than snapping to full speed */
    var targetVx = ax * sp, targetVz = az * sp;
    var acc = K.moveAccel * this.speedMul * dt;
    this.vx += C.clamp(targetVx - this.vx, -acc, acc);
    this.vz += C.clamp(targetVz - this.vz, -acc, acc);
    if (len === 0) { this.vx *= 1 / (1 + 8 * dt); this.vz *= 1 / (1 + 8 * dt); }

    this.tx = C.clamp(this.tx + this.vx * dt, C.RAIL.x0, C.RAIL.x1);
    this.tz = C.clamp(this.tz + this.vz * dt, C.RAIL.z0, C.RAIL.z1);
    if (this.tx <= C.RAIL.x0 || this.tx >= C.RAIL.x1) this.vx = 0;
    if (this.tz <= C.RAIL.z0 || this.tz >= C.RAIL.z1) this.vz = 0;

    var px = this.x, pz = this.z;
    this.x = this.tx; this.z = this.tz;
    if (dt > 0) { this.vx = (this.x - px) / dt; this.vz = (this.z - pz) / dt; }
    return this;
  };

  /* horizontal return to the chute, used by the automatic cycle */
  Claw.prototype.stepHome = function (dt, speed, tug, rng) {
    var sp = this.speedFor(speed || K.homeSpeed);
    var dx = C.HOME.x - this.x, dz = C.HOME.z - this.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    var px = this.x, pz = this.z;
    if (d > 1e-4) {
      var stepd = Math.min(d, sp * dt);
      this.x += dx / d * stepd;
      this.z += dz / d * stepd;
      this.tx = this.x; this.tz = this.z;
    }
    if (dt > 0) { this.vx = (this.x - px) / dt; this.vz = (this.z - pz) / dt; }
    return d;
  };

  Claw.prototype.stepWinch = function (dt, dir, speed) {
    var py = this.y;
    var sp = this.speedFor(speed);
    this.y += dir * sp * dt;
    if (this.y < 0.02) this.y = 0.02;
    if (this.y > C.HOME.y) this.y = C.HOME.y;
    if (dt > 0) this.vy = (this.y - py) / dt;
    return this;
  };

  Claw.prototype.stepProngs = function (dt, closing) {
    var rate = K.openRate * (closing ? (1 - this.softClose * 0.45) : 1.4);
    this.open = C.clamp(this.open + (closing ? -1 : 1) * rate * dt, 0, 1);
    return this.open;
  };

  /* ---- the grip ---------------------------------------------------------- */

  /* Score every toy the closed fingers could plausibly take and clamp the best
   * one.  `centering` is how close the claw axis was to the toy's centre, and
   * `sizeFactor` punishes a toy the fingers cannot get around.              */
  Claw.prototype.close = function (world, rng) {
    var R = rng || this.rng;
    var diff = this.diff;
    var reach = this.captureRadius();
    var fingerY = this.y - this.fingerDrop();
    var best = null, bestScore = -1, bestCenter = 0;

    for (var i = 0; i < world.bodies.length; i++) {
      var b = world.bodies[i];
      if (!b.alive || b.held) continue;
      var dx = b.x - this.x, dz = b.z - this.z;
      var horiz = Math.sqrt(dx * dx + dz * dz);
      if (horiz > reach + b.r * 0.55) continue;
      /* the fingers have to arrive somewhere between the toy's waist and just
       * above its head; anywhere else they simply are not touching it        */
      if (fingerY < b.y - b.r * 0.55) continue;
      if (fingerY > b.y + b.r * 1.70) continue;

      /* how well the fingers straddle the toy */
      var span = (reach + b.r * 0.55);
      var centering = C.clamp(1 - horiz / Math.max(1e-4, span), 0, 1);
      centering = Math.pow(centering, 0.75);
      var sizeFactor = C.clamp(1 - Math.abs(b.r - reach * 0.85) / (b.r + reach), 0.1, 1);
      var score = centering * 0.72 + sizeFactor * 0.28;
      if (score > bestScore) { bestScore = score; best = b; bestCenter = centering; }
    }

    if (!best) {
      this.centering = 0;
      this.held = null;
      this.integrity = 1;
      this.firm = false;
      return null;
    }

    this.held = best;
    best.held = true;
    best.grabbedAt = world.time;
    this.centering = bestCenter;
    this.sizeFactor = C.clamp(1 - Math.abs(best.r - reach * 0.85) / (best.r + reach), 0.1, 1);

    /* supply: nominal pressure, cut down by a bad line-up and a bad fit */
    var w = diff.centeringWeight;
    this.gripForce = (diff.grip + this.stats.grip) *
      C.lerp(1, this.centering, w) *
      C.lerp(1, this.sizeFactor, diff.sizeMismatch);

    /* a firm grab is the machine taking pity on you */
    var jackpot = diff.jackpotChance * (1 + this.luck * 0.35);
    this.firm = R.chance(C.clamp(jackpot, 0, 0.65));
    this.integrity = this.firm ? 1.35 : C.clamp(0.72 + this.centering * 0.35, 0, 1.35);
    this.swx = this.swz = this.swvx = this.swvz = 0;
    this.joltTimer = R.range(0.5, 2.6);
    return best;
  };

  Claw.prototype.release = function () {
    if (this.held) {
      this.held.held = false;
      this.held.ignoreClaw = 0.55;      // falls clear of the fingers
      this.held = null;
    }
    this.integrity = 1;
    this.strain = 0;
    this.ratio = 1;
  };

  /* How hard the toy currently pulls on the fingers, as a multiple of the
   * force the fingers can supply.  >1 means it is losing.                    */
  Claw.prototype.demand = function () {
    var b = this.held;
    if (!b) return 0;
    var diff = this.diff;
    var accel = Math.sqrt(this.ax * this.ax + this.ay * this.ay + this.az * this.az);
    var vel = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
    var swing = Math.sqrt(this.swx * this.swx + this.swz * this.swz);

    var slip = Math.max(0.4, b.slip - this.slipResist);
    var load = b.mass * C.PHYS.g * slip;
    var dyn = 1 +
      (accel / C.PHYS.g) * diff.accelPenalty +
      (vel * 0.55) * diff.velPenalty +
      swing * 9 +
      this.jolt * K.joltPower;
    return load * dyn;
  };

  Claw.prototype.integrateHold = function (dt, world, rng) {
    var b = this.held;
    if (!b) return null;

    /* the carried toy swings like a pendulum hanging off the fingers */
    var k = 30, c = 6.4;
    this.swvx += (-k * this.swx - c * this.swvx - this.ax * 0.55) * dt;
    this.swvz += (-k * this.swz - c * this.swvz - this.az * 0.55) * dt;
    this.swx = C.clamp(this.swx + this.swvx * dt, -0.13, 0.13);
    this.swz = C.clamp(this.swz + this.swvz * dt, -0.13, 0.13);

    /* the random hiccup a tired machine makes */
    this.joltTimer -= dt;
    if (this.joltTimer <= 0) {
      this.joltTimer = C.lerp(4.5, 1.1, rng.next()) * (1 / Math.max(0.05, this.diff.jolt));
      this.jolt = rng.chance(C.clamp(K.joltRate * this.diff.jolt * 6, 0, 0.85)) ? rng.range(0.4, 1.0) : 0;
    }
    this.jolt *= 1 / (1 + 3.5 * dt);

    var need = this.demand();
    this.ratio = need > 1e-6 ? this.gripForce / need : 9;
    this.strain = need / Math.max(0.05, this.gripForce);

    if (this.firm) {
      this.integrity = Math.max(this.integrity, 1.05);
    } else if (need <= this.gripForce) {
      this.integrity = Math.min(1.2, this.integrity + K.gripRecover * dt);
    } else {
      var over = (need - this.gripForce) / Math.max(0.05, this.gripForce);
      this.integrity -= over * this.diff.slipCurve * (this.diff.slipRate || 1.2) * dt;
    }
    this.integrity = C.clamp(this.integrity, -0.2, 1.35);

    /* where the toy actually is: under the hub, sagging as the grip fails */
    var sag = Math.max(0, 1 - Math.max(0, this.integrity)) * K.droopMax;
    var tx = this.x + this.swx;
    var tz = this.z + this.swz;
    var ty = this.y - this.fingerDrop() - b.r * 0.42 - sag;

    var px = b.x, py = b.y, pz = b.z;
    b.x = tx; b.y = ty; b.z = tz;
    if (dt > 0) {
      b.vx = (b.x - px) / dt; b.vy = (b.y - py) / dt; b.vz = (b.z - pz) / dt;
    }
    /* the sag also tilts the toy, which reads as "it is about to go" */
    b.lean = C.clamp(-this.swx * 2.2 - this.swz * 1.1, -0.6, 0.6);
    b.rotV = this.swvx * 3;

    if (this.integrity <= 0) {
      var lost = b;
      lost.held = false;
      lost.ignoreClaw = 0.30;             // it has squirted out of the fingers
      lost.vy = -0.35;
      lost.vx = this.swvx * 1.5; lost.vz = this.swvz * 1.5;
      this.held = null;
      this.slips++;
      return lost;                        // the caller learns it dropped
    }
    return null;
  };

  /* Smooth accelerations, needed by the demand model, from the raw velocities
   * the gantry wrote this step.                                             */
  Claw.prototype.trackAccel = function (dt) {
    if (dt <= 0) return;
    var nvx = (this.vx - (this._pvx || 0)) / dt;
    var nvy = (this.vy - (this._pvy || 0)) / dt;
    var nvz = (this.vz - (this._pvz || 0)) / dt;
    var a = 1 - Math.exp(-dt * 12);
    this.ax += (nvx - this.ax) * a;
    this.ay += (nvy - this.ay) * a;
    this.az += (nvz - this.az) * a;
    this._pvx = this.vx; this._pvy = this.vy; this._pvz = this.vz;
  };

  /* Feed the claw's solid parts into the world's kinematic collider list, so
   * that descending into the pile shoves toys around.                       */
  Claw.prototype.publishColliders = function (world, dt) {
    var soft = 1 - this.softClose * 0.5;
    world.clearKin();
    var hubOld = this._hub;
    var hub = world.addKin(this.x, this.y, this.z, K.hubR, 0, 0, 0);
    if (hubOld && dt > 0) {
      hub.vx = (hub.x - hubOld.x) / dt;
      hub.vy = (hub.y - hubOld.y) / dt;
      hub.vz = (hub.z - hubOld.z) / dt;
    }
    this._hub = { x: hub.x, y: hub.y, z: hub.z };

    var tips = this.tips();
    this.tipOverride = tips;
    for (var i = 0; i < tips.length; i++) {
      var t = tips[i];
      var kt = world.addKin(t.x, t.y, t.z, t.r * (1 + this.softClose * 0.15), 0, 0, 0);
      if (this._ptips && this._ptips[i] && dt > 0) {
        kt.vx = (kt.x - this._ptips[i].x) / dt;
        kt.vy = (kt.y - this._ptips[i].y) / dt;
        kt.vz = (kt.z - this._ptips[i].z) / dt;
      }
      /* closing prongs sweep inward, and that sweep is what shoves the pile */
      var sweep = (K.reachOpen - this.reach()) * K.sweepPush * this.diff.nudges * soft;
      kt.vx += (t.x - this.x) * sweep * 8;
      kt.vz += (t.z - this.z) * sweep * 8;
    }
    this._ptips = tips;
  };

  Claw.prototype.state = function () {
    if (this.firm) return 'firm';
    if (this.integrity > 0.82) return 'ok';
    if (this.integrity > 0.35) return 'sag';
    if (this.integrity > 0.02) return 'weak';
    return 'lost';
  };

  NS.Claw = Claw;
  if (typeof module !== 'undefined' && module.exports) module.exports = Claw;
})(typeof globalThis !== 'undefined' ? globalThis : this);
