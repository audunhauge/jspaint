// @ts-check

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
  }
  static any() {
    return Keys._keys.size > 0;
  }
  static many() {
    return Keys._keys.size > 1;
  }
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

  get info() {
    const { x, y, c, f } = this;
    return `<div>${this.constructor.name} {x:${x} y:${y}} 
                <span style="color:${this.c};background:${this.f}">⬜</span>
            </div>`;
  }

  /**
   * Returns true if two shapes overlap, this and b
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
  static tool = "select";
  static points = [];
  static start = null;
  static end = null;
  static color = "blue";
  static fill = "transparent";
  static type = "pointer";
  static abort = false;
}

// Static class for selecting shapes
// Longer name as not so frequent use
class SelectedShapes {
  static list = [];
  /**
   * Show the selected list
   * @param {HTMLElement} elm div to show list in
   */
  static show(elm) {
    const s = SelectedShapes.list.map(e => e.info).join("");
    elm.innerHTML = s;
  }
  /**
   * Hilite selected elements
   * @param {CanvasRenderingContext2D} ctx 
   */
  static ghost(ctx) {
    for (const s of SelectedShapes.list) {
      const { c, f } = s;
      s.c = "red";
      s.f = "rgba(0,0,250,0.2)";
      s.render(ctx);
      s.c = c;
      s.f = f;
    }
  }
  /**
   * 
   * @param {string} what property to update
   * @param {string} color valid css color
   */
  static update(what, color) {
    for (const s of SelectedShapes.list) {
      s[what] = color;
    }
  }
}

// can only push Shape (or subclasses) into drawings
/**  @type {Array.<Shape>}  */
let drawings = [];

function setup() {
  const divTools = g("tools");
  // cast from html-element to canvas
  const canCanvas = /** @type {HTMLCanvasElement} */ (g("canvas"));
  const canGhost = /** @type {HTMLCanvasElement} */ (g("ghost"));
  const divColors = g("colors");
  const divFill = g("fill");
  const divShapelist = g("shapelist");
  const ctx = canCanvas.getContext("2d");
  const gtx = canGhost.getContext("2d"); // preview next drawing operation
  const B = canCanvas.getBoundingClientRect(); // x,y for ø.v.hjørne på canvas

  divTools.addEventListener("click", activateTool);
  divColors.addEventListener("click", chooseColor);
  divFill.addEventListener("click", chooseFill);

  /* tool-use activated by mouse-down */
  canCanvas.addEventListener("mousedown", startAction);
  canCanvas.addEventListener("mouseup", endAction);

  document.addEventListener("keydown", keyAction);

  const cleanGhost = () => gtx.clearRect(0, 0, 1024, 800);
  const cleanCanvas = () => ctx.clearRect(0, 0, 1024, 800);

  function keyAction(e) {
    // only valid if current type is pointer
    // and there is a valid selection
    if (Keys.has("a")) {
      AT.tool = "select";
      AT.type = "pointer";
    }
    if (AT.type === "pointer" && SelectedShapes.list.length > 0) {
      if (Keys.has("Escape")) {
        AT.abort = true;
        canCanvas.classList.remove("move");
        cleanGhost();
      }
      if (Keys.has("g")) {
        AT.tool = "move";
        canCanvas.classList.add("move");
      }
      if (Keys.has("r")) {
        AT.tool = "rotate";
      }
      if (Keys.has("s")) {
        AT.tool = "scale";
      }
      if (Keys.has("x")) {
        drawings = drawings.filter(e => !SelectedShapes.list.includes(e));
        renderAll();
        SelectedShapes.list = [];
        SelectedShapes.show(divShapelist);
      }
      if (Keys.has("u") && SelectedShapes.list.length === 1) {
        // move selected shape UP in drawing stack
        // towards end of drawing array
        const shape = SelectedShapes.list[0];
        const index = drawings.indexOf(shape);
        if (index < drawings.length - 1) {
          // not last ie TOP element
          // swap with next higher element
          const temp = drawings[index + 1];
          drawings[index + 1] = shape;
          drawings[index] = temp;
          renderAll();
        }
      }
      if (Keys.has("Shift") && Keys.has("D")) {
        // duplicate selected elements
        if (SelectedShapes.list.length > 0) {
          const start = drawings.length; // needed later
          // place the clones in drawings
          for (const s of SelectedShapes.list) {
            const clone = Object.assign(
              Object.create(Object.getPrototypeOf(s)),
              s
            );
            drawings.push(clone);
          }
          // make the clones the new selected list
          // const count = SelectedShapes.list.length;
          SelectedShapes.list = drawings.slice(start);
        }
        Keys._keys.delete("D");
      }
      if (Keys.has("d") && SelectedShapes.list.length === 1) {
        // move selected shape DOWN in drawing stack
        // towards start of drawing array
        const shape = SelectedShapes.list[0];
        const index = drawings.indexOf(shape);
        if (index > 0) {
          // not first ie BOTTOM element
          // swap with next lower element
          const temp = drawings[index - 1];
          drawings[index - 1] = shape;
          drawings[index] = temp;
          renderAll();
        }
      }
    }
  }

  function startAction(e) {
    const x = e.clientX - B.x;
    const y = e.clientY - B.y;
    AT.start = { x, y };
    canCanvas.addEventListener("mousemove", showGhost);
  }

  function endAction(e) {
    if (AT.start && !AT.abort) {
      // must have valid start
      {
        const x = e.clientX - B.x;
        const y = e.clientY - B.y;
        AT.end = { x, y };
      }
      switch (AT.type) {
        case "pointer": {
          if (AT.tool === "select") {
            // a select tool has drawn a square
            // find any shape that overlaps
            // and show them in shapelist
            const { x, y } = AT.start;
            const { x: a, y: b } = AT.end;
            const bb = { x, y, w: a - x, h: b - y }; // bounding box
            const inside = drawings.filter(e => e.overlap(bb));
            SelectedShapes.list = inside;
            SelectedShapes.show(divShapelist);
          }
          if (AT.tool === "move") {
            // a move tool has moved from start to end
            const p1 = new Vector(AT.start);
            const p2 = new Vector(AT.end);
            const diff = p2.sub(p1);
            if (diff.length > 1) {
              for (const s of SelectedShapes.list) {
                s.move(diff);
              }
              renderAll();
            }
            AT.tool = "select";
            canCanvas.classList.remove("move");
          }

          break;
        }
        case "shape": {
          const shape = makeShape(ctx, AT.start, AT.end);
          if (shape) {
            drawings.push(shape);
          }
          break;
        }
      }
    }
    canCanvas.removeEventListener("mousemove", showGhost);
    if (AT.tool !== "pgon") {
      cleanGhost();
      AT.start = null;
      AT.abort = false;
    }
    SelectedShapes.ghost(gtx);
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
        cleanGhost();
        makeShape(gtx, AT.start, AT.end);
      }
    }
  }

  function chooseColor(e) {
    const t = e.target;
    if (t.title) {
      AT.color = t.title;
      SelectedShapes.update("c", AT.color);
      if (SelectedShapes.list.length > 0) {
        renderAll();
      }
    }
  }

  function chooseFill(e) {
    const t = e.target;
    if (t.title) {
      AT.fill = t.title;
      SelectedShapes.update("f", AT.fill);
      if (SelectedShapes.list.length > 0) {
        renderAll();
      }
    }
  }

  function renderAll() {
    cleanCanvas();
    cleanGhost();
    for (const shape of drawings) {
      shape.render(ctx);
    }
  }

  function activateTool(e) {
    const t = e.target;
    if (t.title) {
      // some tools have a simple action
      // some have no submenues
      AT.type = "shape"; // assume a shape
      switch (t.title) {
        case "erase":
          cleanGhost();
          cleanCanvas();
          if (drawings.length > 0) {
            drawings.pop();
            renderAll();
            SelectedShapes.list = SelectedShapes.list.filter(e =>
              drawings.includes(e)
            );
            SelectedShapes.show(divShapelist);
            // A deleted shape can't be selected
          }
          break;
        case "new":
          cleanGhost();
          cleanCanvas();
          AT.color = "blue";
          AT.fill = "transparent";
          drawings = [];
          SelectedShapes.list = []; // no selected shapes
          break;
        case "polygon":
        case "polyline":
          // just so they dont reach default
          break;
        case "move":
        case "select":
          AT.type = "pointer"; // don't leave a trace
        default:
          // all others are subtools
          // so we set parent radio to checked
          AT.tool = t.title;
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
      case "move":
        // show move on ghost canvas
        const p1 = new Vector(AT.start);
        const p2 = new Vector(AT.end);
        const diff = p2.sub(p1);
        if (diff.length > 1) {
          cleanGhost();
          for (const s of SelectedShapes.list) {
            const { x, y, c, f } = s;
            // must make a 1 level deeper copy of bb
            let bb;
            {
              const { x, y, w, h } = s.bb;
              bb = { x, y, w, h };
            }
            s.c = "red";
            s.f = "rgba(250,0,0,0.1)";
            s.move(diff);
            s.render(gtx);
            Object.assign(s, { x, y, bb, c, f });
          }
        }
        break;
      case "select":
        {
          const { x, y } = start;
          const P = new Vector(start);
          const Q = new Vector(end);
          const wh = P.sub(Q);
          const w = Math.abs(wh.x);
          const h = Math.abs(wh.y);
          if (h > 0 && w > 0) {
            const marker = new Square({
              x,
              y,
              w,
              h,
              c: "gray",
              f: "transparent"
            });
            marker.render(ctx);
          }
        }
        break;
      default:
        break;
    }
    return shape;
  }
}
