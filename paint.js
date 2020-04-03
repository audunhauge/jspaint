// @ts-check

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
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.translate(-this.x, -this.y);
    this.drawme(ctx);
    ctx.stroke();
    ctx.fill();
  }
  /**
   * Subclass shape drawing function - must override
   * @abstract
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  drawme(ctx) {
    // virtual function - override in subclass
    console.log("drawme must be implemented in subclass",this);
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
  }
  /**
   * Draw the figure on given canvas
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  drawme(ctx) {
    ctx.strokeRect(this.x, this.y, this.w, this.h);
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
  }
  /**
   * Draw the figure on given canvas
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  drawme(ctx) {
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
  }
}

/**
 * Get element from html id
 * @param {string} id html-element id
 */
const g = id => document.getElementById(id);

function setup() {
  const divTools = g("tools");
  // cast from html- to canvas- element
  const canCanvas = /** @type {HTMLCanvasElement} */ (g("canvas"));
  const divColors = g("colors");
  const divFill = g("fill"); // topp av setup
  const ctx = canCanvas.getContext("2d");

  let color = "blue";
  let fill = "transparent";

  const test = new Shape({x:10,y:20,c:"blue",f:"red"});
  test.render(ctx);

  divTools.addEventListener("click", activateTool);
  divColors.addEventListener("click", chooseColor);
  divFill.addEventListener("click", chooseFill); 

  function chooseColor(e) {
    const t = e.target;
    if (t.title) {
      color = t.title;
    }
  }

  function chooseFill(e) {
    const t = e.target;
    if (t.title) {
      fill = t.title;
    }
  }

  function activateTool(e) {
    const t = e.target;
    if (t.title) {
      switch (t.title) {
        case "pointer":
          break;
        case "square":
          {
            const shape = new Square({
              x: 200,
              y: 200,
              w: 50,
              h: 50,
              c: color,
              f: fill
            });
            shape.render(ctx);
          }
          break;
        case "circle":
          const shape = new Circle({
            x: 200,
            y: 200,
            r: 50,
            c: color,
            f: fill
          });
          shape.render(ctx);
          break;
        case "polygon":
          break;
        case "polyline":
          break;
        case "erase":
          ctx.clearRect(0, 0, 500, 500);
          fill = "transparent";
          color = "blue";
          break;
      }
    }
  }

  function drawCircle() {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.arc(200, 200, 50, 0, 2 * Math.PI, false);
    ctx.stroke();
  }
}
