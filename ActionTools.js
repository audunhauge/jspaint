// @ts-check

/**
 * @file ActionTools
 * Mostly static classes for Tools, SelectedShapes, MakeShapes
 * Performs user-selected actions like adding new shapes, moving and deleting.
 */

/**
 * Static class to store current state of active tool
 * This works much like AT = { tool:"pointer", ...}.
 * VSCode shows error if you try to get/set properties not defined in class
 * @namespace ActiveTool
 * @property {String}  tool  - name of active tool
 * @property {Array.<Point>}  points  - points added by this tool
 * @property {Point|null}  start  - Set by mousedown
 * @property {Point|null}  end  - Set by mouseup
 * @property {String}  color  - line color
 * @property {String}  fill  - fill color
 * @property {String}  type  - "pointer"|"shape"
 * @property {Boolean}  abort  - true if Escape pressed
 * @property {Point|null}  mouse  - Set by mousemove on canvas
 */
class AT {
  static tool = "select";
  static points = [];
  static start = null;
  static end = null;
  static color = "blue";
  static fill = "transparent";
  static type = "pointer";
  static abort = false;
  static mouse = null;
}

/**
 * Static class for selecting shapes
 * Longer name as not so frequent use
 */
class SelectedShapes {
  /**  @type {Array.<Shape>}  */
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

/**
 * Create a shape and render on given context.<br>
 * Also show outline on ghost while selectiong/moving
 */
class MakeShapes {
  /**
   * @param {Object} init
   * @param {CanvasRenderingContext2D} init.ctx canvas
   * @param {Object} init.start startpos
   * @param {Object} init.start.y ypos
   * @param {Object} init.start.x xpos
   * @param {Object} init.end end position
   * @param {Object} init.end.y ypos
   * @param {Object} init.end.x xpos
   * @returns {Shape|undefined}
   */
  static square({ ctx, start, end }) {
    let shape;
    const c = AT.color;
    const f = AT.fill;
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
    return shape;
  }
  /**
   * @param {Object} init
   * @param {CanvasRenderingContext2D} init.ctx canvas
   * @param {Object} init.start startpos
   * @param {Object} init.start.y ypos
   * @param {Object} init.start.x xpos
   * @param {Object} init.end end position
   * @param {Object} init.end.y ypos
   * @param {Object} init.end.x xpos
   * @returns {Shape|undefined}
   */
  static circle({ ctx, start, end }) {
    let shape;
    const c = AT.color;
    const f = AT.fill;
    const { x, y } = start;
    const P = new Vector(start);
    const Q = new Vector(end);
    const wh = P.sub(Q);
    const r = Math.round(wh.length * 10) / 10;
    if (r > 1) {
      shape = new Circle({ x, y, r, c, f });
      shape.render(ctx);
    }
    return shape;
  }
  /**
   * @param {Object} init
   * @param {CanvasRenderingContext2D} init.ctx ghost
   * @param {Object} init.start startpos
   * @param {Object} init.start.y ypos
   * @param {Object} init.start.x xpos
   * @param {Object} init.end end position
   * @param {Object} init.end.y ypos
   * @param {Object} init.end.x xpos
   * @returns {undefined}
   */
  static select({ ctx, start, end }) {
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
        marker.render(ctx); // ctx will always be gtx for select
      }
    }
    return undefined;
  }
  /**
   * @param {Object} init
   * @param {CanvasRenderingContext2D} init.gtx canvas
   * @returns {undefined}
   */
  static move({ gtx }) {
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
        // s should remain unchanged
      }
    }
    return undefined;
  }
}

/**
 * All tool methods are static functions of this class.
 * Similar to how Math is used to namespace all math-functions
 */
class Tools {
  /**
   * Starts a new drawing - deletes all shapes - set defaults
   * @param {Object} p parameter object
   * @param {CanvasRenderingContext2D} p.ctx canvas
   * @param {HTMLElement} p.divShapelist div to show selected shapes on
   */
  static new({ ctx, divShapelist }) {
    cleanGhost();
    cleanCanvas();
    AT.color = "blue";
    AT.fill = "transparent";
    drawings = [];
    SelectedShapes.list = []; // no selected shapes
  }

  static erase({ ctx, divShapelist }) {
    cleanGhost();
    cleanCanvas();
    if (drawings.length > 0) {
      drawings.pop();
      renderAll(ctx);
      SelectedShapes.list = SelectedShapes.list.filter(e =>
        drawings.includes(e)
      );
      SelectedShapes.show(divShapelist);
      // A deleted shape can't remain selected
    }
  }

  static polygon({}) {}

  static polyline({}) {}

  static move({ t }) {
    AT.type = "pointer";
    Tools.default(t);
  }

  static select({ t }) {
    Tools.move({ t });
  }

  static default(t) {
    AT.tool = t.title;
    {
      if (t.dataset && t.dataset.parent) {
        const p = document.getElementById(t.dataset.parent);
        /**  @type {HTMLInputElement} */
        (p).checked = true;
      }
    }
  }
}

/**
 * Draws a rounded rect
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function _roundRect(x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  this.beginPath();
  this.moveTo(x + radius, y);
  this.arcTo(x + width, y, x + width, y + height, radius);
  this.arcTo(x + width, y + height, x, y + height, radius);
  this.arcTo(x, y + height, x, y, radius);
  this.arcTo(x, y, x + width, y, radius);
  this.closePath();
  return this;
}

// extend 2d context with this function
// @ts-ignore
CanvasRenderingContext2D.prototype.roundRect = _roundRect;

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasRenderingContext2D} gtx
 * @param {Object} start Starting point
 * @param {number} start.x xpos
 * @param {number} start.y ypos
 * @param {Object} end Ending point
 * @param {number} end.x xpos
 * @param {number} end.y ypos
 * @returns {Shape|undefined}
 */
function makeShape(ctx, gtx, start, end) {
  // using the new Optional chaining operator ?.
  // IF makeshapes has this tool THEN run the function
  // ELSE return undefined
  return MakeShapes[AT.tool]?.({ gtx, ctx, start, end });
}

/**
 * Draws all shapes from drawings onto canvas, cleans ghost
 * @param {CanvasRenderingContext2D} ctx
 */
function renderAll(ctx) {
  cleanCanvas();
  cleanGhost();
  for (const shape of drawings) {
    shape.render(ctx);
  }
}

/**
 * Check if a tool (has a title) was clicked.
 * This event triggered on divTools - so we expect a title on all tool-icons.
 * But if user misses - then click is ignored.
 * Some tools may be mising - thus default action for those.
 * Or they may be the generic tool icon for a group - they have no action
 * @param {MouseEvent} e
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLElement} divShapelist
 */
function activateTool(e, ctx, divShapelist) {
  const t = /** @type {HTMLElement}*/ (e.target);
  if (t.title) {
    AT.type = "shape"; // assume a shape
    const toolName = t.title;
    if (Tools[toolName]) {
      Tools[toolName]({ t, ctx, divShapelist });
    } else {
      Tools.default(t);
    }
  }
}

/**
 * @param {KeyboardEvent} e
 * @param {HTMLElement} canCanvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLElement} divShapelist
 */
function keyAction(e, canCanvas, ctx, divShapelist) {
  const key = e.key;
  // simple and extended are assumed to not overlap
  // a g x r s Escape
  // SelectedList can be empty
  SimpleKeyAction[key]?.({ canCanvas, ctx, divShapelist });
  // u d D
  // must have a selection
  if (AT.type === "pointer" && SelectedShapes.list.length > 0) {
    ExtendedKeyAction[key]?.({ canCanvas, ctx, divShapelist });
  }
}

class SimpleKeyAction {
  static a(obj) {
    AT.tool = "select";
    AT.type = "pointer";
    pointerActive();
  }
  static Escape({ canCanvas }) {
    AT.abort = true;
    canCanvas.classList.remove("move");
    cleanGhost();
  }
  static r(obj) {
    AT.tool = "rotate";
  }
  static s(obj) {
    AT.tool = "scale";
  }
  static g({ canCanvas }) {
    AT.tool = "move";
    AT.type = "pointer";
    canCanvas.classList.add("move");
    pointerActive();
    if (SelectedShapes.list.length === 0) {
      // select shape under pointer
      const { x, y } = AT.mouse;
      const bb = { x, y, w: 1, h: 1 }; // bounding box
      const inside = drawings.filter(e => e.overlap(bb));
      SelectedShapes.list = inside.slice(-1);
    }
  }
  static x({ ctx, divShapelist }) {
    drawings = drawings.filter(e => !SelectedShapes.list.includes(e));
    renderAll(ctx);
    SelectedShapes.list = [];
    SelectedShapes.show(divShapelist);
  }
}

class ExtendedKeyAction {
  static u({ ctx }) {
    const shape = SelectedShapes.list[0];
    const index = drawings.indexOf(shape);
    if (index < drawings.length - 1) {
      // not last ie TOP element
      // swap with next higher element
      const temp = drawings[index + 1];
      drawings[index + 1] = shape;
      drawings[index] = temp;
      renderAll(ctx);
    }
  }
  static d({ ctx }) {
    const shape = SelectedShapes.list[0];
    const index = drawings.indexOf(shape);
    if (index > 0) {
      // not first ie BOTTOM element
      // swap with next lower element
      const temp = drawings[index - 1];
      drawings[index - 1] = shape;
      drawings[index] = temp;
      renderAll(ctx);
    }
  }
  static D(obj) {
    const start = drawings.length; // needed later
    // place the clones in drawings
    for (const s of SelectedShapes.list) {
      const clone = Object.assign(Object.create(Object.getPrototypeOf(s)), s);
      drawings.push(clone);
    }
    // make the clones the new selected list
    // const count = SelectedShapes.list.length;
    SelectedShapes.list = drawings.slice(start);
  }
}

/**
 * Recieved a mouseUp - so now time to do the action.
 * Action is ready - gather {start,end} and complete it
 * @param {MouseEvent} e
 * @param {HTMLElement} divShapelist
 * @param {HTMLElement} canCanvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasRenderingContext2D} gtx
 */
function endAction(e, divShapelist, canCanvas, ctx, gtx) {
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
            renderAll(ctx);
          }
          AT.tool = "select";
          canCanvas.classList.remove("move");
        }
        break;
      }
      case "shape": {
        const shape = makeShape(ctx, gtx, AT.start, AT.end);
        if (shape) {
          drawings.push(shape);
        }
        break;
      }
    }
  }
  canCanvas.removeEventListener("mousemove", e => showGhost(e, gtx));
  if (AT.tool !== "pgon") {
    cleanGhost();
    AT.start = null;
    AT.abort = false;
  }
  SelectedShapes.ghost(gtx);
}

/**
 * Mostly run by mouse move
 * @param {MouseEvent} e
 * @param {CanvasRenderingContext2D} gtx
 */
function showGhost(e, gtx) {
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
      makeShape(gtx, gtx, AT.start, AT.end);
    }
  }
}

/**
 * Click on color-swatch for line color
 * @param {MouseEvent} e
 */
function chooseColor(e) {
  const t = /** @type {HTMLElement}*/ (e.target);
  if (t.title) {
    AT.color = t.title;
    SelectedShapes.update("c", AT.color);
    if (SelectedShapes.list.length > 0) {
      renderCanvas();
    }
  }
}

/**
 * Click on a color-swatch for background
 * @param {MouseEvent} e
 */
function chooseFill(e) {
  const t = /** @type {HTMLElement}*/ (e.target);
  if (t.title) {
    AT.fill = t.title;
    SelectedShapes.update("f", AT.fill);
    if (SelectedShapes.list.length > 0) {
      renderCanvas();
    }
  }
}
