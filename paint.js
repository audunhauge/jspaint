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
    console.log("drawme must be implemented in subclass", this);
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

// Static class to store current state of active tool
// This works much like AT = { tool:"pointer", ...}
// used here to show alternative to object
// Gives error if you try to get/set properties not defined in class
class AT {
  static tool = "pointer";
  static points = [];
  static start = null;
  static end = null;
  static color = "blue";
  static fill = "transparent";
}

// can only push Shape (or subclasses) into drawings
/**  @type {Array.<Shape>}  */
let drawings = [ ];

function setup() {
  const divTools = g("tools");
  // cast from html-element to canvas
  const canCanvas = /** @type {HTMLCanvasElement} */ (g("canvas"));
  const canGhost = /** @type {HTMLCanvasElement} */ (g("ghost"));
  const divColors = g("colors");
  const divFill = g("fill");
  const ctx = canCanvas.getContext("2d");
  const gtx = canGhost.getContext("2d"); // preview next drawing operation
  const B = canCanvas.getBoundingClientRect(); // x,y for ø.v.hjørne på canvas

  divTools.addEventListener("click", activateTool);
  divColors.addEventListener("click", chooseColor);
  divFill.addEventListener("click", chooseFill);

  /* tool-use activated by mouse-down */
  canCanvas.addEventListener("mousedown", startAction);
  canCanvas.addEventListener("mouseup", endAction);

  function startAction(e) {
    const x = e.clientX - B.x;
    const y = e.clientY - B.y;
    AT.start = { x, y };
    canCanvas.addEventListener("mousemove", showGhost);
  }

  function endAction(e) {
    if (AT.start) {
      // must have valid start
      {
        const x = e.clientX - B.x;
        const y = e.clientY - B.y;
        AT.end = { x, y };
      }
      {
        const shape = makeShape(ctx, AT.start, AT.end);
        if (shape) {
          drawings.push(shape);
        }
      }
    }
    canCanvas.removeEventListener("mousemove", showGhost);
    if (AT.tool !== "pgon") {
      gtx.clearRect(0, 0, 1024, 800);
      AT.start = null;
    }
  }

  function showGhost(e) {
    if (AT.start) {
      // must have valid start
      {
        const x = e.clientX - B.x;
        const y = e.clientY - B.y;
        AT.end = { x, y };
      }
      const P = new Vector(AT.start);
      const Q = new Vector(AT.end);
      const delta = P.sub(Q).length;
      if (delta > 2) {
        gtx.clearRect(0, 0, 1024, 800);
        makeShape(gtx, AT.start, AT.end);
      }
    }
  }

  function chooseColor(e) {
    const t = e.target;
    if (t.title) {
      AT.color = t.title;
    }
  }

  function chooseFill(e) {
    const t = e.target;
    if (t.title) {
      AT.fill = t.title;
    }
  }

  function activateTool(e) {
    const t = e.target;
    if (t.title) {
      AT.tool = t.title;
      // some tools have a simple action
      // some have no submenues
      switch (t.title) {
        case "erase":
          ctx.clearRect(0, 0, 1024, 800);
          AT.fill = "transparent";
          AT.color = "blue";
          AT.tool = "pointer";
          break;
        case "polygon":
        case "polyline":
          // just so they dont reach default
          break;
        default:
          // all others are subtools
          // so we set parent radio to checked
          {
            if (t.dataset && t.dataset.parent) {
              const p = document.getElementById(t.dataset.parent);
              /**  @type {HTMLInputElement} */
              (p).checked = true;
            }
          }
          break;
      }
    }
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} start Starting point
   * @param {number} start.x xpos
   * @param {number} start.y ypos
   * @param {Object} end Ending point
   * @param {number} end.x xpos
   * @param {number} end.y ypos
   * @returns {Shape}
   */
  function makeShape(ctx, start, end) {
    let shape;
    const c = AT.color;
    const f = AT.fill;
    switch (AT.tool) {
      case "square":
        {
          const { x, y } = start;
          const P = new Vector(start);
          const Q = new Vector(end);
          const wh = P.sub(Q);
          const w = Math.abs(wh.x);
          const h = Math.abs(wh.y);
          if (h > 0 && w > 0) {
            shape = new Square({ x, y, w, h, c, f });
            shape.render(ctx);
          }
        }
        break;
      case "circle":
        {
          const { x, y } = start;
          const P = new Vector(start);
          const Q = new Vector(end);
          const wh = P.sub(Q);
          const r = Math.round(wh.length * 10) / 10;
          if (r > 1) {
            shape = new Circle({ x, y, r, c, f });
            shape.render(ctx);
          }
        }
        break;
      default:
        break;
    }
    return shape;
  }
}
