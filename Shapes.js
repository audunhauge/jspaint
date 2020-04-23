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
   * Multiplies two vectors - dot product
   * @param {Point|Vector} v
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
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
  constructor({ x, y, c = "red", f = "transparent" }) {
    super({ x, y });
    this.c = c;
    this.f = f;
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
    ctx.beginPath();
    ctx.strokeStyle = this.c;
    ctx.fillStyle = this.f;
    this.drawme(ctx);
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
    // virtual function - override in subclass
    console.log("move must be implemented in subclass", this);
  }

  rotate(d) {
    console.log("rotate must be implemented in subclass", this);
  }

  /**
   * Returns true if this shape intersects another shape
   * @param {Shape} b the other shape
   * @returns {boolean} true if they intersect
   */
  intersecting(b) {
    console.log("intersecting must be implemented in subclass", this);
    return false;
  }

  /**
   * Returns true if point is inside shape
   * @param {Point} p
   * @returns {boolean} true if they intersect
   */
  contains(p) {
    console.log("contains must be implemented in subclass", this);
    return false;
  }

  get info() {
    const { x, y, c, f } = this;
    return `<div>${this.constructor.name} {x:${x} y:${y}} 
                  <span style="color:${this.c};background:${this.f}">⬜</span>
              </div>`;
  }

  /**
   * Returns true if type === name
   * Used as if (s.isa("Circle")) { ... }
   * @param {string} name
   */
  isa(name) {
    return name === this.type;
  }

  // ****  now some virtual functions
  // ****  expect subclass to override

  centered() {
    console.log("Override in subclass");
  }

  scale(d) {
    console.log("override scale in subclass");
  }

  get type() {
    return "Shape";
  }

  get polygon() {
    return [this.x, this.y];
  }
}

/**
 * A polygon defined by center (see findCentroid pure.js)
 * and a list of points (dx,dy) relative to this center
 */
class Polygon extends Shape {
  constructor({ x, y, points, c = "red", f = "blue" }) {
    super({ x, y, c, f });
    this.points = points;
  }

  drawme(ctx) {
    const { x, y, points } = this;
    const { x: a, y: b } = points[0]; // starting point
    const delta = points2delta(points); // diff between points
    let z =
      `M${x + a} ${y + b} ` +
      delta.map((p) => `l ${p.x} ${p.y}`).join(" ") +
      " Z";
    const p = new Path2D(z);
    ctx.stroke(p);
    ctx.fill(p);
  }

  get polygon() {
    const { x, y } = this;
    return points2xyList(this.points.map((e) => ({ x: x + e.x, y: y + e.y })));
  }

  get type() {
    return "Polygon";
  }

  contains(p) {
    return polygonPoint(this.polygon, p);
  }

  rotate(d) {
    
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
    ctx.stroke();
    ctx.fill();
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
    const s = Math.max(1 + d.x / 100, 1 / this.w, 1 / this.h);
    this.w *= s;
    this.h *= s;
    this.centered();
  }
  get type() {
    return "Square";
  }

  get polygon() {
    const a = this;
    return [a.x, a.y, a.x + a.w, a.y, a.x + a.w, a.y + a.h, a.x, a.y + a.h];
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
    const s = Math.max(1 + d.x / 100, 1 / this.r);
    this.r *= s;
  }
  get type() {
    return "Circle";
  }
}
