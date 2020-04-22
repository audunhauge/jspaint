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
 * @property {Object|null} revert  - go back to this tool after single action
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
  static revert = null;
  static showfillAndColor;  // see setup()
}

/**
 * Static class for selecting shapes
 * Longer name as not so frequent use
 * @namespace SelectedShapes
 * @property {Array.<Shape>}  list  - selected shapes
 */
class SelectedShapes {
  static list = [];

  /**
   * Ensures any shape is only selected once
   */
  static _clean() {
    const unique = new Set(SelectedShapes.list);
    SelectedShapes.list = Array.from(unique);
  }

  /**
   * Show the selected list
   * @param {HTMLElement} elm div to show list in
   */
  static show(elm) {
    SelectedShapes._clean(); // remove dupes
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
      const wh = Q.sub(P);
      const r = Math.round(wh.length * 10) / 10;
      if (r > 1) {
        const marker = new Circle({ x, y, r, c: "gray", f: "transparent" });
        marker.render(ctx);
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
        const { x, y, c, f, rot } = s;
        // must make a 1 level deeper copy of bb
        let bb;
        {
          const { x, y, w, h } = s.bb;
          bb = { x, y, w, h };
        }
        s.rot = 0;
        s.c = "red";
        s.f = "rgba(250,0,0,0.1)";
        s.move(diff);
        s.render(gtx);
        Object.assign(s, { x, y, bb, c, f, rot });
        // s should remain unchanged
      }
    }
    return undefined;
  }
  /**
   * @param {Object} init
   * @param {CanvasRenderingContext2D} init.gtx canvas
   * @returns {undefined}
   */
  static rotate({ gtx }) {
    const p1 = new Vector(AT.start);
    const p2 = new Vector(AT.end);
    const diff = p2.sub(p1);
    if (diff.length > 1) {
      cleanGhost();
      for (const s of SelectedShapes.list) {
        const { c, f, rot } = s;
        s.c = "red";
        s.f = "rgba(250,0,0,0.1)";
        s.rotate(diff);
        s.render(gtx);
        Object.assign(s, { c, f, rot });
        // s should remain unchanged
      }
    }
    return undefined;
  }
  static scale({ gtx }) {
    const p1 = new Vector(AT.start);
    const p2 = new Vector(AT.end);
    const diff = p2.sub(p1);
    if (diff.length > 1) {
      cleanGhost();
      for (const s of SelectedShapes.list) {
        const { x, y, c, f, rot, w, h, r } = s;
        // must make a 1 level deeper copy of bb
        let bb;
        {
          const { x, y, w, h } = s.bb;
          bb = { x, y, w, h };
        }
        s.rot = 0;
        s.c = "red";
        s.f = "rgba(250,0,0,0.1)";
        s.scale(diff);
        s.render(gtx);
        Object.assign(s, { x, y, bb, c, f, rot, w, h, r });
        // s should remain unchanged
      }
    }
    return undefined;
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
function activateTool(e, ctx, gtx, divShapelist) {
  const t = /** @type {HTMLElement}*/ (e.target);
  if (t.title) {
    AT.type = "shape"; // assume a shape
    ctx.resetTransform();
    gtx.resetTransform();
    const toolName = t.title;
    if (Tools[toolName]) {
      Tools[toolName]({ t, ctx, divShapelist });
    } else {
      Tools.default(t);
    }
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
          const P = new Vector(AT.start);
          const Q = new Vector(AT.end);
          const wh = Q.sub(P);
          const r = Math.round(wh.length * 10) / 10;
          const bb = { center: AT.start, r };
          const inside = drawings.filter(e => e.touching(bb));
          if (Keys.has("Shift")) {  // extend selection
            SelectedShapes.list = SelectedShapes.list.concat(inside)
          } else  if (Keys.has("Control")) {  // reduce
            SelectedShapes.list = SelectedShapes.list.filter(e => !inside.includes(e));
          } else {  // make new
            SelectedShapes.list = inside;
          }
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
              s.centered();
            }
            renderAll(ctx);
          }
          AT.tool = "select";
          canCanvas.classList.remove("move");
        }
        if (AT.tool === "rotate") {
          // a rotate tool has moved from start to end
          const p1 = new Vector(AT.start);
          const p2 = new Vector(AT.end);
          const diff = p2.sub(p1);
          if (diff.length > 1) {
            for (const s of SelectedShapes.list) {
              s.rotate(diff);
            }
            renderAll(ctx);
          }
          AT.tool = "select";
          canCanvas.classList.remove("move");
        }
        if (AT.tool === "scale") {
            // a scale tool has moved from start to end
            const p1 = new Vector(AT.start);
            const p2 = new Vector(AT.end);
            const diff = p2.sub(p1);
            if (diff.length > 1) {
              for (const s of SelectedShapes.list) {
                s.scale(diff);
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
      default: {
        AT.tool = "select";
      }
    }
  }
  canCanvas.removeEventListener("mousemove", e => showGhost(e, gtx));
  if (AT.tool !== "pgon") {
    cleanGhost();
    AT.start = null;
    AT.abort = false;
    if (AT.revert) {
      // this action was started by key (g) while drawing shapes
      // the action is completed - revert to original tool
      // Also remove all selections
      const { oldType, oldTool } = AT.revert;
      AT.type = oldType;
      AT.tool = oldTool;
      AT.revert = null;
      SelectedShapes.list = [];
      SelectedShapes.show(divShapelist);
      AT.type === "shape" ? shapesActive() : pointerActive();
    }
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
    if (Keys.has("Shift")) {
      AT.fill = t.title;
      document.documentElement.style.setProperty('--fill',AT.fill);
      SelectedShapes.update("f", AT.color);
    } else {
      AT.color = t.title;
      document.documentElement.style.setProperty('--line',AT.color);
      SelectedShapes.update("c", AT.color);
    }
    AT.showfillAndColor();
    if (SelectedShapes.list.length > 0) {
      renderCanvas();
    }
  }
}

function adjustColors(div) {
  if (Keys.has("ArrowLeft")) {
    baseColor = (baseColor + 359) % 360;
  }
  if (Keys.has("ArrowRight")) {
    baseColor = (baseColor + 1) % 360;
  }
  div.innerHTML = makeSwatch(baseColor);
}