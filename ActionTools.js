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
 * @property {String}  modify  - "x|y|''"
 * @property {Boolean}  abort  - true if Escape pressed
 * @property {Point|null}  mouse  - Set by mousemove on canvas
 * @property {Object|null} revert  - go back to this tool after single action
 * @property {Shape|null} jarvisHull  - a wrapping around a group of shapes
 */
class AT {
  static tool = "select";
  static points = [];
  static start = null;
  static end = null;
  static color = "blue";
  static fill = "transparent";
  static type = "pointer";
  static modify = "";
  static abort = false;
  static mouse = null;
  static revert = null;
  static jarvisHull = null;
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
   * No shapes selected
   */
  static empty() {
    SelectedShapes.list = [];
  }

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
    const s = SelectedShapes.list.map((e) => e.info).join("");
    elm.innerHTML = s;
  }
  /**
   * Hilite selected elements
   * This is before any action is applied
   * @param {CanvasRenderingContext2D} ctx
   */
  static ghost(ctx) {
    for (const s of SelectedShapes.list) {
      const { c, f } = s;
      s.c = contrast(s.c.substr(1));
      s.f = contrast(s.f.substr(1));
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
  /**
   * If more than 1 element in list
   * then create a bounding box for all
   */
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
 * Show a ghost shape while transforming selected
 * For rotate we show bounding box of selected shapes
 * @param {Vector} diff change in position
 * @param {string} action
 * @param {CanvasRenderingContext2D} gtx
 */
function shapeAction(diff, action, gtx) {
  if (SelectedShapes.list.length > 1 && "moverotatescale".includes(action)) {
    if (!AT.jarvisHull) {
      AT.jarvisHull = makeJarvisHullShape();
    }
    const shape = AT.jarvisHull;
    const { x, y, c, f, points, r } = shape;
    shape.points = points.map(({ x, y }) => ({ x, y }));
    shape[action](diff, AT.modify);
    shape.render(gtx);
    Object.assign(shape, { x, y, c, f, points, r });
  } else {
    for (const s of SelectedShapes.list) {
      const { x, y, c, f, points, r } = s;
      s.points = points.map(({ x, y }) => ({ x, y }));
      s.c = contrast(s.c.substr(1));
      s.f = contrast(s.f.substr(1));
      s[action](diff, AT.modify);
      s.render(gtx);
      Object.assign(s, { x, y, c, f, points, r });
    }
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
  AT.jarvisHull = null;
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
 * Responds to a menu-event from the toolbar
 * @param {CustomEvent} e 
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLElement} divShapelist
 */
function menuAction(e, ctx, gtx, divShapelist) {
  const {detail} = e;
  const text = detail?.text?.toLowerCase();
  Tools[text]?.({ ctx, divShapelist });
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
    g("newpage").classList.remove("hidden");
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
      SelectedShapes.list = SelectedShapes.list.filter((e) =>
        drawings.includes(e)
      );
      SelectedShapes.show(divShapelist);
      // A deleted shape can't remain selected
    }
  }

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
    // ignore event below canvas
    if (AT.end.y < B.height) {
      switch (AT.type) {
        case "pointer": {
          if (AT.tool === "select") {
            // a select tool has drawn a square
            // find any shape that overlaps
            // and show them in shapelist
            const { x, y } = AT.start;
            const P = new Vector(AT.start);
            const Q = new Vector(AT.end);
            const wh = P.sub(Q);
            const w = Math.abs(wh.x);
            const h = Math.abs(wh.y);
            let inside;
            // only use polygon if area not too small
            if (h * w > 9) {
              const capturePolygon = [x, y, x + w, y, x + w, y + h, x, y + h];
              inside = drawings.filter((e) =>
                polygonPolygon(capturePolygon, e.polygon)
              );
            } else {
              // pretend it is a point (area is < 10)
              const p = AT.start;
              inside = drawings.filter((e) => e.contains(p));
            }
            if (Keys.has("Shift")) {
              // extend selection
              SelectedShapes.list = SelectedShapes.list.concat(inside);
            } else if (Keys.has("Control")) {
              // reduce
              SelectedShapes.list = SelectedShapes.list.filter(
                (e) => !inside.includes(e)
              );
            } else {
              // make new
              SelectedShapes.empty();
              SelectedShapes.list = inside;
            }
            SelectedShapes.show(divShapelist);
          } else {
            completeAction(canCanvas, AT.tool);
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
  }
  canCanvas.removeEventListener("mousemove", (e) => showGhost(e, gtx));
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
      SelectedShapes.empty();
      SelectedShapes.show(divShapelist);
      AT.type === "shape" ? shapesActive() : pointerActive();
    }
  }
  SelectedShapes.ghost(gtx);
}

function completeAction(canCanvas, action) {
  const p1 = new Vector(AT.start);
  const p2 = new Vector(AT.end);
  const diff = p2.sub(p1);
  if (diff.length > 1) {
    if (action === "rotate" && SelectedShapes.list.length > 1) {
      rotateGroup(diff);
    }
    if (action === "scale" && SelectedShapes.list.length > 1) {
      scaleGroup(diff);
    }
    for (const s of SelectedShapes.list) {
      s[action](diff, AT.modify);
    }
  }
  renderAll(ctx);
  AT.tool = "select";
  AT.modify = ""; // turn off modify (x|y)
  AT.jarvisHull = null;
  canCanvas.classList.remove("move");
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
      AT.color = t.title;
      document.documentElement.style.setProperty("--line", AT.color);
      SelectedShapes.update("c", AT.color);
    } else {
      AT.fill = t.title;
      document.documentElement.style.setProperty("--fill", AT.fill);
      SelectedShapes.update("f", AT.fill);
    }
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

/**
 * A group of objects are to be rotated
 * Create a polygon that wraps all these shapes
 * Rotate all shapes around this centroid
 */
function rotateGroup(diff) {
  const list = SelectedShapes.list;
  const shapeCenters = list.map((s) => ({ x: s.x, y: s.y }));
  const { x, y } = AT.jarvisHull;
  const points = shapeCenters.map((e) => ({ x: e.x - x, y: e.y - y }));
  // a polygon made up of shape centers - rotate this to get
  // new position for these centers.
  const shape = new Polygon({
    x,
    y,
    points,
    c: "red",
    f: "red",
  });
  shape.rotate(diff, AT.modify);
  const newpoints = shape.points;
  list.forEach((e, i) => {
    e.x = x + newpoints[i].x;
    e.y = y + newpoints[i].y;
  });
}

/**
 * A group of objects are to be scaled
 * Create a polygon that wraps all these shapes
 */
function scaleGroup(diff) {
  const list = SelectedShapes.list;
  const shapeCenters = list.map((s) => ({ x: s.x, y: s.y }));
  const { x, y } = AT.jarvisHull;
  const points = shapeCenters.map((e) => ({ x: e.x - x, y: e.y - y }));
  // a polygon made up of shape centers - scale this to get
  // new position for these centers.
  const shape = new Polygon({
    x,
    y,
    points,
    c: "red",
    f: "red",
  });
  shape.scale(diff, AT.modify);
  const newpoints = shape.points;
  list.forEach((e, i) => {
    e.x = x + newpoints[i].x;
    e.y = y + newpoints[i].y;
  });
}

/**
 * Returns a shape wrapping the selected shapes
 * Uses Jarvis gift wrapping
 */
function makeJarvisHullShape() {
  const list = SelectedShapes.list;
  const allPoints = xyList2Points(
    list.reduce((s, v) => v.polygon.concat(s), [])
  );
  const hull = jarvis(allPoints);
  const { x, y } = findCentroid(hull);
  const points = hull.map((e) => ({ x: e.x - x, y: e.y - y }));
  const shape = new Polygon({
    x,
    y,
    points,
    c: "red",
    f: "rgba(255,0,0,0.1)",
  });
  return shape;
}
