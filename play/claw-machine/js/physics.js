'use strict';
/* =========================================================================
 * js/physics.js — the pile.
 *
 * Every prize is a rigid sphere in full 3-D: it falls, rolls, stacks and can
 * be shoved off the pile.  The claw is a set of kinematic colliders (a hub and
 * three finger tips) that push the toys around but are never pushed back,
 * which is what makes a descending claw scatter the pile the way a real one
 * does.  The prize chute is simply a rectangle of floor that is not there.
 *
 * The solver is a small sequential-impulse pass: gravity, then a few passes of
 * positional correction plus a normal/friction impulse.  Plush has almost no
 * bounce, so restitution is tiny and the pile settles in well under a second.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C, P = C.PHYS;

  var nextId = 1;

  function World(seed) {
    this.rng = new C.Rng(seed || 1);
    this.bodies = [];
    this.kin = [];              // kinematic colliders owned by the claw
    this.won = [];              // bodies that dropped through during the last step
    this.wonCount = 0;          // and how many have dropped through in total
    this.time = 0;
    this.contactCount = 0;
  }

  /* ---- construction ------------------------------------------------------ */

  World.prototype.addPrize = function (prize, x, y, z) {
    var mass = Math.max(0.02, prize.mass / 1000);
    var b = {
      id: nextId++,
      prize: prize,
      pid: prize.id,
      x: x, y: y, z: z,
      vx: 0, vy: 0, vz: 0,
      r: prize.r,
      mass: mass,
      slip: prize.slip,
      invM: 1 / mass,
      held: false,          // kinematic while the claw carries it
      ignoreClaw: 0,        // seconds of grace after being let go
      alive: true,
      support: 0,           // how many contacts held it up this step
      rot: this.rng.range(-Math.PI, Math.PI),
      rotV: this.rng.range(-0.6, 0.6),
      lean: 0, leanV: 0,
      spin: this.rng.range(-1, 1),
      grabbedAt: -1
    };
    this.bodies.push(b);
    return b;
  };

  World.prototype.remove = function (b) {
    var i = this.bodies.indexOf(b);
    if (i >= 0) this.bodies.splice(i, 1);
  };

  World.prototype.clearKin = function () { this.kin.length = 0; };

  World.prototype.addKin = function (x, y, z, r, vx, vy, vz) {
    var k = { x: x, y: y, z: z, r: r, vx: vx || 0, vy: vy || 0, vz: vz || 0 };
    this.kin.push(k);
    return k;
  };

  /* ---- helpers ----------------------------------------------------------- */

  /* Distance from a point to the prize chute, with the outward direction.  A
   * distance of zero means the point is inside the hole, which is where the
   * floor stops existing.                                                   */
  World.prototype.hole = function (x, z) {
    var cx = C.clamp(x, C.CHUTE.x0, C.CHUTE.x1);
    var cz = C.clamp(z, C.CHUTE.z0, C.CHUTE.z1);
    var dx = x - cx, dz = z - cz;
    var len = Math.sqrt(dx * dx + dz * dz);
    if (len < 1e-6) return { d: 0, nx: 0, nz: 0 };
    return { d: len, nx: dx / len, nz: dz / len };
  };

  /* is the body's centre over the hole? */
  World.prototype.overHole = function (b) {
    return this.hole(b.x, b.z).d <= 0;
  };

  World.prototype.moveKin = function (k, x, y, z, dt) {
    if (dt > 0) {
      k.vx = (x - k.x) / dt;
      k.vy = (y - k.y) / dt;
      k.vz = (z - k.z) / dt;
    }
    k.x = x; k.y = y; k.z = z;
  };

  /* ---- one contact: positional correction + impulse ---------------------- */

  function contact(w, a, b, nx, ny, nz, pen, dt) {
    var invA = a.held ? 0 : a.invM;
    var invB = b.held ? 0 : b.invM;
    var invSum = invA + invB;
    if (invSum <= 0) return;

    /* Positional correction, with a generous slop so a resting stack is never
     * corrected at all, and a hard cap on how much penetration one pass may
     * chase — an uncapped correction is what turns a settled heap into a
     * boiling one.                                                          */
    var penEff = pen - P.slop;
    if (penEff < 0) penEff = 0;
    var penMax = P.maxCorrection / Math.max(1e-6, P.correction);
    if (penEff > penMax) penEff = penMax;
    var corr = penEff * P.correction / invSum;
    a.x -= nx * corr * invA; a.y -= ny * corr * invA; a.z -= nz * corr * invA;
    b.x += nx * corr * invB; b.y += ny * corr * invB; b.z += nz * corr * invB;

    /* normal impulse */
    var rvx = b.vx - a.vx, rvy = b.vy - a.vy, rvz = b.vz - a.vz;
    var vn = rvx * nx + rvy * ny + rvz * nz;
    if (vn < 0) {
      var jn = -(1 + P.restitution) * vn / invSum;
      a.vx -= nx * jn * invA; a.vy -= ny * jn * invA; a.vz -= nz * jn * invA;
      b.vx += nx * jn * invB; b.vy += ny * jn * invB; b.vz += nz * jn * invB;

      /* Coulomb friction on the tangential part of the relative velocity */
      rvx = b.vx - a.vx; rvy = b.vy - a.vy; rvz = b.vz - a.vz;
      var vn2 = rvx * nx + rvy * ny + rvz * nz;
      var tx = rvx - vn2 * nx, ty = rvy - vn2 * ny, tz = rvz - vn2 * nz;
      var tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (tl > 1e-6) {
        tx /= tl; ty /= tl; tz /= tl;
        var mu = P.friction * (1 / Math.max(0.5, (a.slip + b.slip) * 0.5));
        var jt = tl / invSum;
        var maxJt = mu * jn;
        if (jt > maxJt) jt = maxJt;
        a.vx += tx * jt * invA; a.vy += ty * jt * invA; a.vz += tz * jt * invA;
        b.vx -= tx * jt * invB; b.vy -= ty * jt * invB; b.vz -= tz * jt * invB;
      }
      a.support++; b.support++;
      w.contactCount++;
    }
  }

  function pairContact(w, a, b, dt) {
    var dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    var rs = a.r + b.r;
    var d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= rs * rs) return;
    var d = Math.sqrt(d2);
    var nx, ny, nz;
    if (d < 1e-6) {
      /* exactly coincident: separate along a stable axis */
      nx = 0; ny = 1; nz = 0; d = 1e-6;
    } else { nx = dx / d; ny = dy / d; nz = dz / d; }
    contact(w, a, b, nx, ny, nz, rs - d, dt);
  }

  function kinContact(w, b, k, dt) {
    /* A toy that has just been let go falls out between the fingers.  The
     * fingers are thin wires and the toy is modelled as a fat sphere, so
     * without this grace period the claw's own finger tips would bat the prize
     * sideways on its way down and it would miss a hole it was dropped into. */
    if (b.ignoreClaw > 0) return false;
    var dx = b.x - k.x, dy = b.y - k.y, dz = b.z - k.z;
    var rs = b.r + k.r;
    var d2 = dx * dx + dy * dy + dz * dz;
    if (d2 >= rs * rs) return false;
    var d = Math.sqrt(d2) || 1e-6;
    var nx = dx / d, ny = dy / d, nz = dz / d;
    var pen = rs - d;

    /* push the body out; the claw never moves */
    if (!b.held) {
      b.x += nx * pen * 0.34;
      b.y += ny * pen * 0.34;
      b.z += nz * pen * 0.34;
    }

    /* the claw carries momentum: transfer it, damped */
    var rvx = b.vx - k.vx, rvy = b.vy - k.vy, rvz = b.vz - k.vz;
    var vn = rvx * nx + rvy * ny + rvz * nz;
    if (vn < 0 && !b.held) {
      var push = -vn * (1 + P.restitution);
      b.vx += nx * push; b.vy += ny * push; b.vz += nz * push;
      /* a little sideways drag, so a descending claw rakes the pile */
      var tx = k.vx - (k.vx * nx) * nx, ty = k.vy - (k.vy * ny) * ny, tz = k.vz - (k.vz * nz) * nz;
      b.vx += tx * 0.14; b.vy += ty * 0.14; b.vz += tz * 0.14;
      b.support++;
    }
    return true;
  }

  /* ---- the step ---------------------------------------------------------- */

  World.prototype.step = function (dt) {
    var bodies = this.bodies, i, n, b;
    this.time += dt;
    this.contactCount = 0;
    this.won.length = 0;

    var damp = 1 / (1 + P.linDamp * dt);

    /* 1. gravity and damping */
    var contactDamp = 1 / (1 + P.contactDamp * dt);
    for (i = 0, n = bodies.length; i < n; i++) {
      b = bodies[i];
      b.support = 0;
      if (b.ignoreClaw > 0) b.ignoreClaw -= dt;
      if (b.held || !b.alive) continue;
      b.vy -= P.g * dt;
      b.vx *= damp; b.vy *= damp; b.vz *= damp;
      /* anything that was resting last step gets extra damping: this is what
       * stops a settled pile from slowly churning                         */
      if (b.resting) { b.vx *= contactDamp; b.vy *= contactDamp; b.vz *= contactDamp; }
    }

    /* 2. integrate positions */
    for (i = 0; i < n; i++) {
      b = bodies[i];
      if (b.held || !b.alive) continue;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    }

    /* 3. solve: pile first, then the claw, then the walls and floor */
    for (var it = 0; it < P.iterations; it++) {
      for (i = 0; i < n; i++) {
        var a = bodies[i];
        if (!a.alive) continue;
        for (var j = i + 1; j < n; j++) {
          var bb = bodies[j];
          if (!bb.alive) continue;
          pairContact(this, a, bb, dt);
        }
      }

      for (var ki = 0; ki < this.kin.length; ki++) {
        var k = this.kin[ki];
        for (i = 0; i < n; i++) {
          b = bodies[i];
          if (!b.alive) continue;
          kinContact(this, b, k, dt);
        }
      }

      for (i = 0; i < n; i++) this.bounds(bodies[i], it === 0);
    }

    /* 4. rolling cosmetics, rest clamping and the chute */
    for (i = 0; i < n; i++) {
      b = bodies[i];
      if (!b.alive) continue;

      if (!b.held) {
        /* a hard speed clamp, so nothing can ever run away */
        var sp = Math.sqrt(b.vx * b.vx + b.vz * b.vz + b.vy * b.vy);
        if (sp > P.maxVel) {
          var k = P.maxVel / sp;
          b.vx *= k; b.vy *= k; b.vz *= k;
          sp = P.maxVel;
        }

        b.rot += b.rotV * dt;
        b.rotV += (b.vx * 0.6 - b.rotV) * dt * 1.6;
        b.lean += (C.clamp(-b.vx * 0.45 - b.vz * 0.30, -0.5, 0.5) - b.lean) * Math.min(1, dt * 6);

        if (b.support > 0 && sp < P.restVel) {
          b.vx = 0; b.vy = 0; b.vz = 0;
          b.resting = true;
        } else {
          b.resting = false;
        }
      } else {
        b.resting = false;
      }

      if (b.y < -0.16) {
        b.alive = false;
        this.won.push(b);
        this.wonCount++;
      }
    }

    /* 5. retire the fallen */
    if (this.won.length) {
      for (i = 0; i < this.won.length; i++) this.remove(this.won[i]);
    }
  };

  /* floor, walls and the hole */
  World.prototype.bounds = function (b, first) {
    if (!b.alive || b.held) return;
    var hx = C.BOX.hx - b.r;
    var hz = C.BOX.hz - b.r;

    if (b.x < -hx) { b.x = -hx; if (first && b.vx < 0) b.vx *= -0.15; b.support++; }
    if (b.x > hx) { b.x = hx; if (first && b.vx > 0) b.vx *= -0.15; b.support++; }
    if (b.z < -hz) { b.z = -hz; if (first && b.vz < 0) b.vz *= -0.15; b.support++; }
    if (b.z > hz) { b.z = hz; if (first && b.vz > 0) b.vz *= -0.15; b.support++; }

    /* the ceiling of the playfield keeps a thrown prize in the cabinet */
    var top = C.BOX.top - b.r;
    if (b.y > top) { b.y = top; if (first && b.vy > 0) b.vy = 0; }

    var h = this.hole(b.x, b.z);
    if (h.d <= 0) {
      /* the centre is over the hole: there is no floor here at all, which is
       * what makes shoving the pile toward the chute a real strategy         */
      return;
    }

    /* The raised rim around the chute.  A low toy is held out of the hole, but
     * only weakly: the push is capped per solver pass, so a toy that is shoved
     * fast enough still goes over the edge, while one that is merely resting
     * there leans on the rim instead.                                        */
    var hold = b.r * C.CHUTE_HOLD + 0.012;
    if (b.y < b.r + C.CHUTE_LIP && h.d < hold) {
      var push = hold - h.d;
      if (push > C.CHUTE_PUSH) push = C.CHUTE_PUSH;
      b.x += h.nx * push;
      b.z += h.nz * push;
      b.support++;
    }

    if (b.y < b.r) {
      b.y = b.r;
      if (first) {
        if (b.vy < 0) b.vy *= -P.restitution;
        if (Math.abs(b.vy) < 0.25) b.vy = 0;
      }
      b.support++;
    }
  };

  /* Fill the cabinet the way a real one is filled: more toys than the floor
   * can hold in a single layer, scattered over the whole playfield and left to
   * heap up.  The only place a toy may not start is the chute itself, so a
   * freshly filled machine never begins with a prize already down the hole.
   * Anything that tumbles in while the pile is settling is quietly forgotten
   * rather than awarded.                                                    */
  World.prototype.fill = function (prizes, box, rng) {
    var R = rng || this.rng;
    var list = prizes.slice().sort(function (a, b) { return b.r - a.r; });
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var x = 0, z = 0, tries = 0;
      do {
        x = R.range(box.x0 + p.r, box.x1 - p.r);
        z = R.range(box.z0 + p.r, box.z1 - p.r);
        tries++;
      } while (tries < 24 && C.overChute(x, z, -(p.r * 0.45 + 0.06)));

      /* start some of them high so the heap has a second and third layer */
      var y = p.r + R.range(0, 0.30);
      this.addPrize(p, x, y, z);
    }
    this.settle(4.0);
    this.won.length = 0;         // nothing counts as a win while filling
    return this;
  };

  /* run the solver with no player input until things stop moving */
  World.prototype.settle = function (seconds) {
    var steps = Math.ceil((seconds || 1) / P.dt);
    for (var i = 0; i < steps; i++) this.step(P.dt);
    return this;
  };

  World.prototype.totalMass = function () {
    var m = 0;
    for (var i = 0; i < this.bodies.length; i++) m += this.bodies[i].mass;
    return m;
  };

  World.prototype.movingCount = function (thresh) {
    var t = thresh || 0.09, n = 0;
    for (var i = 0; i < this.bodies.length; i++) {
      var b = this.bodies[i];
      if (Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz) > t) n++;
    }
    return n;
  };

  World.prototype.highestPoint = function (x, z, radius) {
    var best = 0;
    for (var i = 0; i < this.bodies.length; i++) {
      var b = this.bodies[i];
      var dx = b.x - x, dz = b.z - z;
      if (dx * dx + dz * dz < (radius + b.r) * (radius + b.r)) {
        var top = b.y + b.r;
        if (top > best) best = top;
      }
    }
    return best;
  };

  NS.World = World;
  NS.Physics = { World: World };

  if (typeof module !== 'undefined' && module.exports) module.exports = NS.Physics;
})(typeof globalThis !== 'undefined' ? globalThis : this);
