// @ts-check

/**
 * @file Shapes - class definitions for drawing shapes on a canvas. Shape is base class for Square and Circle.
 */

/** 
 * Handles keypress - can check if(Keys.has("ArrowDown"))
 */
class Keys {
  static _keys = new Set();
  static _za = document.addEventListener("keydown", Keys._mark);
  static _zb = document.addEventListener("keyup", Keys._unmark);
  static _mark(e) {
    Keys._keys.add(e.key);
  }
  static _unmark(e) {
    Keys._keys.delete(e.key);
    Keys._keys.delete(e.key.toUpperCase());
    // if "d" is released then "D" is released
  }
  static any() {
    return Keys._keys.size > 0;
  }
  static many() {
    return Keys._keys.size > 1;
  }
  /**
   *
   * @param {String} a string name of key "D", "UpArraow","Escape" ..
   * @returns {Boolean} true if this key is pressed just now
   */
  static has(a) {
    return Keys._keys.has(a);
  }
}

/**
 * Simple base class, all figures must be placed at (x,y)
 */
class Point {
  /**
   * Create a point given x,y
   * @param {{x:number,y:number}} point (x,y)
   */
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
  }
}

/**
 * Utility class - add,sub,length of vector
 * Used to find dist between two points
 */
class Vector extends Point {
  constructor({ x, y }) {
    super({ x, y });
  }

  /**
   * Returns u+v where u,v are vectors
   * @param {Point|Vector} v
   * @returns {Vector}
   */
  add(v) {
    return new Vector({ x: this.x + v.x, y: this.y + v.y });
  }

  /**
   * Returns u-v
   * @param {Point|Vector} v
   * @returns {Vector}
   */
  sub(v) {
    return new Vector({ x: this.x - v.x, y: this.y - v.y });
  }

  /**
   * Multiplies (scales) a vector with scalar
   * @param {number} k real number
   */
  mult(k) {
    return new Vector({ x: this.x * k, y: this.y * k });
  }

  /**
   * Calculates length of vector
   * @returns {number}
   */
  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
}

/**
 * A base class for all shapes
 * @extends Point
 */
class Shape extends Point {
  static idx = 1; // every shape gets an id
  /**
   * Construct a Shape given x,y and c=color, f=fill
   * @param {Object} init parameters for the shape
   * @param {number} init.x xpos
   * @param {number} init.y ypos
   * @param {string} init.c color
   * @param {string} init.f color
   */
  constructor({ x, y, c, f }) {
    super({ x, y });
    this.c = c;
    this.f = f;
    this.rot = 0.0; // No rotation - short name bcs save space in file, r=radius
    this.bb = { x, y, w: 0, h: 0 }; // adjust in subclass
    this.id = Shape.idx++;
    this.center = { x, y }; // adjust in subclass
    this.r = 1; // adjust in subclass
  }
  /**
   * Draw the figure on given canvas
   * Calls virtual drawme implemented by subclass
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  render(ctx) {
    ctx.resetTransform();
    ctx.beginPath();
    ctx.strokeStyle = this.c;
    ctx.fillStyle = this.f;
    ctx.save();
    ctx.translate(this.center.x, this.center.y);
    ctx.rotate(this.rot);
    ctx.translate(-this.center.x, -this.center.y);
    this.drawme(ctx);
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }
  /**
   * Subclass shape drawing function - must override
   * @abstract
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  drawme(ctx) {
    // virtual function - override in subclass
    console.log("drawme must be implemented in subclass", this);
  }

  /**
   *
   * @param {Vector} d displacement
   */
  move(d) {
    this.x += d.x;
    this.y += d.y;
    this.bb.x = this.x;
    this.bb.y = this.y;
  }

  centered() {
    console.log("Overide in subclass");
  }

  rotate(d) {
    this.rot += (d.x / 30) % (2 * Math.PI);
  }

  scale(d) {
    console.log("override scale in subclass");
  }

  get info() {
    const { x, y, c, f } = this;
    return `<div>${this.constructor.name} {x:${x} y:${y}} 
                  <span style="color:${this.c};background:${this.f}">⬜</span>
              </div>`;
  }

  /**
   * Returns true if this shape overlaps bounding box b
   * @param {Object} b
   * @param {number} b.x xpos
   * @param {number} b.y xpos
   * @param {number} b.w width
   * @param {number} b.h height
   */
  overlap(b) {
    const a = this.bb; // just for shortform
    return (
      a.x > b.x - a.w && a.x < b.x + b.w && a.y > b.y - a.h && a.y < b.y + b.h
    );
  }

  /**
   * True if this shape touches/overlaps b
   * @param {Object} b other shape
   * @param {Object} b.center
   * @param {number} b.center.x xpos
   * @param {number} b.center.y ypos
   * @param {number} b.r radius
   */
  touching(b) {
    const a = this;
    const diff = new Vector(a.center).sub(new Vector(b.center));
    return diff.length < a.r + b.r;
  }
}

/**
 * A square shape
 * @extends Shape
 */
class Square extends Shape {
  /**
   * Construct a square given x,y and w,h, c is color
   * @param {Object} init parameters for the shape
   * @param {number} init.x xpos
   * @param {number} init.y ypos
   * @param {number} init.w width
   * @param {number} init.h height
   * @param {string} init.c color
   * @param {string} init.f color
   */
  constructor({ x, y, w, h, c, f }) {
    super({ x, y, c, f });
    this.w = w;
    this.h = h;
    this.bb = { x, y, w, h };
    this.centered();
  }
  /**
   * Draw the figure on given canvas
   * Move and Line as strokeRect cant be filled
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  drawme(ctx) {
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.w, this.y);
    ctx.lineTo(this.x + this.w, this.y + this.h);
    ctx.lineTo(this.x, this.y + this.h);
    ctx.closePath();
  }

  /**
   * Calcs center for touching
   */
  centered() {
    const { x, y, w, h } = this;
    const diag = new Vector({ x: w, y: h });
    this.r = diag.length / 2;
    this.center = diag.mult(0.5).add({ x, y });
  }
  scale(d) {
    const s = Math.max(1+d.x / 100,1/this.w,1/this.h);
    this.w *= s;
    this.h *= s;
    this.centered();
  }
}

/**
 * A circle
 * @extends Shape
 */
class Circle extends Shape {
  /**
     * Construct circle given x,y,r and c=color
    /**
     * Construct a square given x,y and w,h, c is color
     * @param {Object} init parameters for the shape
     * @param {number} init.x xpos
     * @param {number} init.y ypos
     * @param {number} init.r radius
     * @param {string} init.c color
     * @param {string} init.f color
     */
  constructor({ x, y, r, c, f }) {
    super({ x, y, c, f });
    this.r = r;
    this.bb = { x: x - r, y: y - r, w: r + r, h: r + r };
    this.center = { x, y };
  }
  /**
   * Draw the figure on given canvas
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  drawme(ctx) {
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
  }
  // must override move as bb needs adjusting for circle
  move(d) {
    this.x += d.x;
    this.y += d.y;
    this.bb.x = this.x - this.r;
    this.bb.y = this.y - this.r;
  }
  centered() {
    const { x, y } = this;
    this.center = { x, y };
  }
  scale(d) {
    const s = Math.max(1 + d.x / 100, 1/this.r);
    this.r *= s;
  }
}
