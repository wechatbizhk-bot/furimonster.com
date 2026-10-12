'use strict';
/* =========================================================================
 * js/input.js — keyboard, mouse and touch, plus the layout of the on-screen
 * control panel that js/screens.js draws.
 *
 * The layout lives here so the thing that draws a button and the thing that
 * decides whether you pressed it can never disagree about where it is.
 * ========================================================================= */
(function (root) {
  var NS = root.CM = root.CM || {};
  var C = NS.C;

  /* screen-space rectangles, in the canvas' 1280x720 coordinate system */
  var LAYOUT = {
    leftPanel:  { x: 14,  y: 84,  w: 286, h: 430 },
    rightPanel: { x: 980, y: 84,  w: 286, h: 430 },
    stick:      { cx: 148, cy: 628, r: 54, knob: 24 },
    drop:       { cx: 1112, cy: 620, r: 46 },
    coin:       { x: 1058, y: 546, w: 108, h: 40 },
    menu:       { x: 14,   y: 524, w: 138, h: 36 },
    mute:       { x: 160,  y: 524, w: 138, h: 36 },
    lang:       { x: 980,  y: 524, w: 138, h: 36 },
    help:       { x: 1128, y: 524, w: 138, h: 36 }
  };

  /* menu screens use a simple vertical list of cards; the geometry is shared
     with the renderer through this helper */
  function cardRect(i, count, top, height, gap) {
    return { x: 190, y: top + i * (height + gap), w: 900, h: height };
  }

  function Input() {
    this.keys = {};          // held
    this.pressed = {};       // pressed since the last poll
    this.released = {};
    this.pointer = { x: -1, y: -1, down: false, inside: false };
    this.stick = { x: 0, y: 0, active: false, id: -1 };
    this.clicks = [];        // {x, y} in canvas coords, consumed each poll
    this.anyPress = false;
    this.lastPressCode = '';
    this.enabled = true;
  }

  Input.prototype.attach = function (canvas) {
    var self = this;

    function toCanvas(e) {
      var r = canvas.getBoundingClientRect();
      var sx = C.GAME_W / (r.width || 1);
      var sy = C.GAME_H / (r.height || 1);
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    }

    function hit(box, p) {
      if (box.r !== undefined) {
        var dx = p.x - box.cx, dy = p.y - box.cy;
        return dx * dx + dy * dy <= box.r * box.r;
      }
      return p.x >= box.x && p.x <= box.x + box.w &&
             p.y >= box.y && p.y <= box.y + box.h;
    }
    this.hit = hit;

    function pokeAudio() {
      if (NS.Audio && NS.Audio.resume) NS.Audio.resume();
    }

    var down = function (e) {
      pokeAudio();
      var p = toCanvas(e);
      self.pointer.x = p.x; self.pointer.y = p.y;
      self.pointer.down = true; self.pointer.inside = true;
      self.anyPress = true;
      self.clicks.push(p);
      /* grabbing the stick anywhere in its half of the panel works */
      if (hit({ cx: LAYOUT.stick.cx, cy: LAYOUT.stick.cy, r: LAYOUT.stick.r * 1.7 }, p)) {
        self.stick.active = true;
        if (e.pointerId !== undefined) self.stick.id = e.pointerId;
      }
      if (e.preventDefault) e.preventDefault();
    };
    var move = function (e) {
      var p = toCanvas(e);
      self.pointer.x = p.x; self.pointer.y = p.y;
      if (self.stick.active && (e.pointerId === undefined || e.pointerId === self.stick.id)) {
        var dx = p.x - LAYOUT.stick.cx, dy = p.y - LAYOUT.stick.cy;
        var r = LAYOUT.stick.r;
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len > r) { dx = dx / len * r; dy = dy / len * r; }
        self.stick.x = dx / r; self.stick.y = dy / r;
      }
      if (e.preventDefault && self.pointer.down) e.preventDefault();
    };
    var up = function (e) {
      self.pointer.down = false;
      if (self.stick.active && (e.pointerId === undefined || e.pointerId === self.stick.id)) {
        self.stick.active = false;
        self.stick.x = self.stick.y = 0;
        self.stick.id = -1;
      }
    };

    root.addEventListener('keydown', function (e) {
      pokeAudio();
      var c = e.code || e.key;
      if (!self.keys[c]) { self.pressed[c] = true; self.anyPress = true; self.lastPressCode = c; }
      self.keys[c] = true;
      /* stop the page scrolling under the game */
      if (c === 'Space' || c === 'ArrowUp' || c === 'ArrowDown' ||
          c === 'ArrowLeft' || c === 'ArrowRight' || c === 'Tab') {
        if (e.preventDefault) e.preventDefault();
      }
    });
    root.addEventListener('keyup', function (e) {
      var c = e.code || e.key;
      self.keys[c] = false;
      self.released[c] = true;
    });
    root.addEventListener('blur', function () { self.keys = {}; self.stick.active = false; self.stick.x = self.stick.y = 0; });

    canvas.addEventListener('pointerdown', down);
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
    canvas.addEventListener('touchstart', function (e) { if (e.preventDefault) e.preventDefault(); }, { passive: false });
    canvas.style.touchAction = 'none';
    this.canvas = canvas;
    return this;
  };

  Input.prototype.held = function () {
    for (var i = 0; i < arguments.length; i++) if (this.keys[arguments[i]]) return true;
    return false;
  };
  Input.prototype.hitOnce = function () {
    for (var i = 0; i < arguments.length; i++) if (this.pressed[arguments[i]]) return true;
    return false;
  };
  Input.prototype.consumeClick = function () {
    return this.clicks.length ? this.clicks.shift() : null;
  };

  /* the movement + action state a machine wants */
  Input.prototype.machineInput = function () {
    var k = this.keys, s = this.stick;
    var dead = 0.28;
    var left = !!(k.ArrowLeft || k.KeyA) || s.x < -dead;
    var right = !!(k.ArrowRight || k.KeyD) || s.x > dead;
    var up = !!(k.ArrowUp || k.KeyW) || s.y < -dead;
    var down = !!(k.ArrowDown || k.KeyS) || s.y > dead;
    var stickDrop = this.pressed.__stickDrop;
    return {
      left: left, right: right, up: up, down: down,
      slow: !!(k.ShiftLeft || k.ShiftRight),
      drop: !!(this.pressed.Space || this.pressed.Enter || this.pressed.KeyJ || this.pressed.NumpadEnter || stickDrop),
      release: !!(this.pressed.Space || this.pressed.Enter || this.pressed.KeyJ || this.pressed.NumpadEnter)
    };
  };

  /* Called at the end of each frame: clears the one-shot edges. */
  Input.prototype.endFrame = function () {
    this.pressed = {};
    this.released = {};
    this.anyPress = false;
    this.stickDrop = false;
    this.clicks.length = 0;
  };

  /* ---- pointer handling for the on-screen buttons ---------------------- */

  /* Returns the first button under a click, or null.  Used by the shell so a
     mouse click means the same as the matching key.                        */
  Input.prototype.buttonAt = function (p) {
    if (this.hit(LAYOUT.drop, p)) return 'drop';
    if (this.hit(LAYOUT.coin, p)) return 'coin';
    if (this.hit(LAYOUT.menu, p)) return 'menu';
    if (this.hit(LAYOUT.mute, p)) return 'mute';
    if (this.hit(LAYOUT.lang, p)) return 'lang';
    if (this.hit(LAYOUT.help, p)) return 'help';
    return null;
  };

  NS.Input = Input;
  NS.LAYOUT = LAYOUT;
  NS.cardRect = cardRect;
  if (typeof module !== 'undefined' && module.exports) module.exports = Input;
})(typeof globalThis !== 'undefined' ? globalThis : this);
