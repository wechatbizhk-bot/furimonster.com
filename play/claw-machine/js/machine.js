'use strict';
/* =========================================================================
 * js/machine.js — one cabinet, and one play.
 *
 * A play is a fixed cycle, exactly like a real crane game:
 *
 *   ready  ->  move  ->  drop  ->  close  ->  lift  ->  return  ->  release
 *                ^                                                      |
 *                +----------------------- result <---- settle <---------+
 *
 * The player only ever does one thing: line the claw up and press the button.
 * Everything after that is the machine being honest about friction.  The claw
 * always carries back to the chute above the prize hole, so a play is won or
 * lost entirely in whether the fingers were still holding on when they got
 * there — plus whatever the claw shoved into the hole on the way past.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C, K = C.CLAW;

  var MOVE_LIMIT = 45;                 // seconds you get to line the shot up

  function Machine(def, opts) {
    opts = opts || {};
    this.def = def;
    this.rng = new C.Rng(opts.seed || def.seed || 1);
    this.world = new NS.World(this.rng.next() * 4294967296);
    this.claw = new NS.Claw(Math.floor(this.rng.next() * 1e9));
    this.phase = 'ready';
    this.t = 0;
    this.moveTimer = MOVE_LIMIT;
    this.events = [];
    this.plays = 0;
    this.fillCount = opts.fillCount || 0;
    this.diff = opts.diff || C.DIFF.fun;
    this.stats = opts.stats || { grip: 0, slipResist: 0, aim: 0, luck: 0, speed: 0, softClose: 0 };
    this.attempt = null;
    this.result = null;
    this.shakeT = 0;
    this.shakeMag = 0;
    this.claw.configure(this.stats, this.diff);
    this.refill();
  }

  /* ---- filling ----------------------------------------------------------- */

  Machine.prototype.refill = function () {
    var prizes = NS.CAT.spawnPile(this.def, this.rng, this.stats.luck);
    this.world = new NS.World(Math.floor(this.rng.next() * 4294967296));
    this.world.fill(prizes, { x0: -C.BOX.hx, x1: C.BOX.hx, z0: -C.BOX.hz, z1: C.BOX.hz }, this.rng);
    this.claw.home();
    this.phase = 'ready';
    this.t = 0;
    this.moveTimer = MOVE_LIMIT;
    this.result = null;
    this.attempt = null;
    return this;
  };

  Machine.prototype.configure = function (stats, diff) {
    this.stats = stats || this.stats;
    this.diff = diff || this.diff;
    this.claw.configure(this.stats, this.diff);
    return this;
  };

  /* ---- a play ------------------------------------------------------------ */

  Machine.prototype.canPlay = function () { return this.phase === 'ready'; };

  Machine.prototype.startAttempt = function () {
    if (this.phase !== 'ready') return false;
    this.plays++;
    this.phase = 'move';
    this.t = 0;
    this.moveTimer = MOVE_LIMIT;
    this.wonThisAttempt = [];
    this.attempt = {
      grabbed: false, carriedId: null, slipped: false, firm: false,
      nudgedWin: false, phases: 0, grabbedPrize: null,
      heldIds: {}                     // everything the claw ever picked up
    };
    this.claw.home();
    this.emit('start', {});
    return true;
  };

  Machine.prototype.emit = function (type, data) {
    var e = data || {};
    e.type = type;
    e.t = this.world.time;
    this.events.push(e);
  };

  Machine.prototype.drainEvents = function () {
    var out = this.events;
    this.events = [];
    return out;
  };

  /* Where the fingers will stop if the claw is let go right now.  This uses
   * exactly the same reach test as the grab itself (see Claw#close), so the
   * claw can never come to rest on a toy it then refuses to pick up.        */
  Machine.prototype.dropTargetY = function () {
    var claw = this.claw;
    var reach = claw.captureRadius();
    var top = 0;
    for (var i = 0; i < this.world.bodies.length; i++) {
      var b = this.world.bodies[i];
      if (!b.alive || b.held) continue;
      var dx = b.x - claw.x, dz = b.z - claw.z;
      if (dx * dx + dz * dz > Math.pow(reach + b.r * 0.55, 2)) continue;
      if (b.y + b.r > top) top = b.y + b.r;
    }
    return Math.max(0.012, top + claw.fingerDrop() + 0.006);
  };

  Machine.prototype.update = function (dt, input) {
    var steps = Math.max(1, Math.min(C.PHYS.maxSteps, Math.ceil(dt / C.PHYS.dt)));
    var sub = dt / steps;
    for (var i = 0; i < steps; i++) this.substep(sub, input, i === 0);
    this.shakeT = Math.max(0, this.shakeT - dt);
    return this;
  };

  Machine.prototype.substep = function (dt, input, first) {
    var claw = this.claw, world = this.world;
    this.t += dt;
    var dropPressed = first && input && input.drop;
    var relPressed = first && input && input.release;

    switch (this.phase) {
      /* ---- waiting for a credit ---------------------------------------- */
      case 'ready':
        claw.stepProngs(dt, false);
        break;

      /* ---- the player lines the shot up -------------------------------- */
      case 'move':
        this.moveTimer -= dt;
        claw.stepMove(dt, world, this.phase, input, null);
        claw.stepProngs(dt, false);
        if (this.moveTimer <= 0 || dropPressed) {
          this.emit('drop', { auto: this.moveTimer <= 0 });
          this.phase = 'drop';
          this.t = 0;
          this.dropY = this.dropTargetY();
        }
        break;

      /* ---- down -------------------------------------------------------- */
      case 'drop':
        claw.stepMove(dt, world, this.phase, input, null);
        claw.stepWinch(dt, -1, this.diff.dropSpeed);
        claw.stepProngs(dt, false);
        /* a second press closes early: the classic snatch */
        if (claw.y <= this.dropY || relPressed) {
          if (claw.y > this.dropY) this.emit('snatch', {});
          this.phase = 'close';
          this.t = 0;
        }
        break;

      /* ---- the fingers shut -------------------------------------------- */
      case 'close':
        claw.stepWinch(dt, 0, 0);
        claw.stepProngs(dt, true);
        if (claw.open <= 0.001) {
          var got = claw.close(world, this.rng);
          if (got) {
            this.attempt.grabbed = true;
            this.attempt.carriedId = got.pid;
            this.attempt.heldIds[got.pid] = true;
            this.attempt.grabbedPrize = got.prize;
            this.attempt.firm = claw.firm;
            this.emit('grab', {
              prize: got.prize, centering: claw.centering,
              firm: claw.firm, integrity: claw.integrity
            });
            this.shake(0.12, 0.0015);
          } else {
            this.emit('empty', {});
          }
          this.phase = 'lift';
          this.t = 0;
        }
        break;

      /* ---- up ---------------------------------------------------------- */
      case 'lift':
        claw.stepWinch(dt, 1, K.liftSpeed);
        claw.stepProngs(dt, true);
        if (claw.y >= C.HOME.y - 1e-6) { this.phase = 'return'; this.t = 0; this.emit('carry', {}); }
        break;

      /* ---- back to the chute ------------------------------------------- */
      case 'return':
        claw.stepWinch(dt, 0, 0);
        var left = claw.stepHome(dt, K.homeSpeed, null, this.rng);
        if (left < 0.006) { this.phase = 'release'; this.t = 0; }
        break;

      /* ---- let go ------------------------------------------------------ */
      case 'release':
        claw.stepWinch(dt, 0, 0);
        claw.stepProngs(dt, false);
        /* the moment the fingers are open enough, the toy has nothing left
         * holding it: it drops, and whether it lands in the hole is the
         * whole point of the exercise                                    */
        if (claw.held && claw.open >= 0.70) {
          this.emit('release', { prize: claw.held.prize });
          claw.release();
        }
        if (claw.open >= 0.999 && this.t > 0.24) { this.phase = 'settle'; this.t = 0; }
        break;

      /* ---- everything comes to rest ------------------------------------ */
      case 'settle':
        claw.stepProngs(dt, false);
        if ((this.t > 2.4 && world.movingCount(0.12) === 0) || this.t > 3.4) {
          this.phase = 'result';
          this.t = 0;
          this.finish();
        }
        break;

      case 'result':
        break;
    }

    /* ---- shared: hold, colliders, simulation --------------------------- */
    claw.trackAccel(dt);
    var dropped = claw.integrateHold(dt, world, this.rng);
    if (dropped) {
      this.attempt.slipped = true;
      this.attempt.carriedId = null;
      this.emit('slip', { prize: dropped.prize });
      this.shake(0.22, 0.0022);
    }
    claw.publishColliders(world, dt);
    world.step(dt);

    /* anything that fell through the hole this step is won, whatever the
     * phase — a prize the claw merely shoved in counts just as much          */
    for (var i = 0; i < world.won.length; i++) {
      var b = world.won[i];
      if (!this.wonThisAttempt) this.wonThisAttempt = [];
      this.wonThisAttempt.push(b.prize);
      this.emit('prize', { prize: b.prize, carried: this.attempt && this.attempt.carriedId === b.pid });
      this.shake(0.18, 0.0016);
    }
  };

  Machine.prototype.shake = function (time, mag) {
    this.shakeT = Math.max(this.shakeT, time);
    this.shakeMag = mag;
  };

  /* ---- outcome ----------------------------------------------------------- */

  Machine.prototype.finish = function () {
    var won = (this.wonThisAttempt || []).slice();
    var a = this.attempt || {};
    var held = a.heldIds || {};
    var carriedWon = false, nudged = 0, i;
    for (i = 0; i < won.length; i++) {
      if (held[won[i].id]) carriedWon = true;
      else nudged++;
    }
    this.result = {
      win: won.length > 0,
      prizes: won,
      grabbed: !!a.grabbed,
      grabbedPrize: a.grabbedPrize || null,
      carriedId: a.carriedId || null,
      carriedWon: carriedWon,
      /* won something the claw never even picked up: it was shoved into the
       * hole, either by the descending claw or by the toy it was carrying   */
      nudgedWin: nudged > 0,
      nudgedCount: nudged,
      slipped: !!a.slipped,
      firm: !!a.firm,
      double: won.length > 1,
      best: won.length ? Math.max.apply(null, won.map(function (p) { return p.value; })) : 0,
      heaviest: won.length ? Math.max.apply(null, won.map(function (p) { return p.mass; })) : 0
    };
    this.emit(won.length ? 'win' : 'lose', { result: this.result });
    return this.result;
  };

  /* Called by the shell once the result has been shown.  Won prizes are gone;
   * the machine is topped up so it never runs empty.                        */
  Machine.prototype.conclude = function () {
    this.result = null;
    this.attempt = null;
    this.wonThisAttempt = [];
    var leftovers = this.world.bodies.length;
    if (leftovers < Math.max(6, Math.floor(this.def.count * 0.45))) this.refill();
    else {
      this.claw.home();
      this.phase = 'ready';
      this.t = 0;
      this.moveTimer = MOVE_LIMIT;
    }
    return this;
  };

  /* A tap of the prize pile, used by the attract-mode cameras. */
  Machine.prototype.pileCentre = function () {
    var xs = 0, zs = 0, n = 0;
    for (var i = 0; i < this.world.bodies.length; i++) {
      var b = this.world.bodies[i];
      xs += b.x; zs += b.z; n++;
    }
    if (!n) return { x: 0, z: 0 };
    return { x: xs / n, z: zs / n };
  };

  NS.Machine = Machine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Machine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
