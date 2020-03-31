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
   * (x,y) is a point, c is a color string
   * @param {{x:number,y:number, c:string}} xyc
   */
  constructor({ x, y, c }) {
    super({ x, y });
    this.c = c;
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
   */
  constructor({ x, y, w, h, c }) {
    super({ x, y, c });
    this.w = w;
    this.h = h;
  }
  /**
   * Draw the figure on given canvas
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  render(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = this.c;
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
   * @param {{x:number,y:number,r:number,c:string}} xyrc
   */
  constructor({ x, y, r, c }) {
    super({ x, y, c });
    this.r = r;
  }
  /**
   * Draw the figure on given canvas
   * @param {CanvasRenderingContext2D} ctx canvas to draw on
   */
  render(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = this.c;
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    ctx.stroke();
  }
}

/**
 * Get element from html id
 * @param {string} id
 */
const g = id => document.getElementById(id);

function setup() {
  const divTools = g("tools");
  // cast from html- to canvas- element
  const canCanvas = /** @type {HTMLCanvasElement} */ (g("canvas"));
  const divColors = g("colors");
  const ctx = canCanvas.getContext("2d");

  let color = "blue";

  divTools.addEventListener("click", activateTool);
  divColors.addEventListener("click", chooseColor);

  function chooseColor(e) {
    const t = e.target;
    if (t.title) {
      color = t.title;
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
              c: color
            });
            shape.render(ctx);
          }
          break;
        case "circle":
          const shape = new Circle({ x: 200, y: 200, r: 50, c: color });
          shape.render(ctx);
          break;
        case "polygon":
          break;
        case "polyline":
          break;
        case "erase":
          ctx.clearRect(0, 0, 500, 500);
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
