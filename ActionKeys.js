// @ts-check

/**
 * @file ActionKeys
 * Static classes for handling key-actions
 * Key-activated tools like g(grab) s(scale) r(rotate)
 */

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
  // must have a selection for Extended key action
  if (AT.type === "pointer" && SelectedShapes.list.length > 0) {
    ExtendedKeyAction[key]?.({ canCanvas, ctx, divShapelist });
  }
}

/**
 * Static class to store current state of active tool
 * This works much like AT = { tool:"pointer", ...}.
 * VSCode shows error if you try to get/set properties not defined in class
 * @namespace SimpleKeyAction
 */
class SimpleKeyAction {
  /**
   * Switches to select pointer
   * @param {Object} obj not used
   */
  static a(obj) {
    AT.tool = "select";
    AT.type = "pointer";
    pointerActive();
  }
  /**
   * Cancels current action
   * @param {Object} init
   * @param {HTMLElement} init.canCanvas
   */
  static Escape({ canCanvas }) {
    AT.abort = true;
    canCanvas.classList.remove("move");
    cleanGhost();
  }
  static r({ canCanvas }) {
    startKeyAction(canCanvas, "rotate");
  }
  static s({ canCanvas }) {
    startKeyAction(canCanvas, "scale");
  }
  static g({ canCanvas }) {
    startKeyAction(canCanvas, "move");
  }
  static y({ ctx, divShapelist }) {
    if (AT.tool === "scale") {
      AT.modify = "y";
    }
  }
  static x({ ctx, divShapelist }) {
    if (AT.tool === "scale") {
      AT.modify = "x";
      return;
    }
    drawings = drawings.filter((e) => !SelectedShapes.list.includes(e));
    renderAll(ctx);
    SelectedShapes.list = [];
    SelectedShapes.show(divShapelist);
  }
  // used to adjust color swatches
  static ArrowRight({}) {
    SimpleKeyAction.ArrowLeft({});
  }
  static ArrowLeft({}) {
    const { x, y } = mouse; // global mouse coords
    const d = document.elementFromPoint(x, y);
    if (d?.id === "canvas") {
      console.log("prev-color");
    }
    // @ts-ignore
    if (d?.title) {
      // color-swatches have title
      swatchAdjust();
    }
  }
  // pick up color from swatch under pointer
  // and set as baseColor
  static Home({}) {
    const { x, y } = mouse; // global mouse coords
    const d = document.elementFromPoint(x, y);
    // @ts-ignore
    if (d?.title) {
      // color-swatches have title
      // @ts-ignore
      const rgb = hex2rgb(d.title.substr(1));
      const hsv = rgb2hsv(rgb);
      baseColor = hsv.h;
      swatchAdjust();
    }
  }
}

/**
 * Show that we are moving/scaling/rotating etc
 * @param {HTMLElement} canCanvas
 * @param {string} action
 */
const moveState = (canCanvas, action) => {
  AT.tool = action;
  AT.type = "pointer";
  canCanvas.classList.add("move");
  pointerActive();
};

/**
 * Sets up for a key action - will complete on mouseUp
 * @param {HTMLElement} canCanvas
 * @param {string} action
 */
function startKeyAction(canCanvas, action) {
  const oldTool = AT.tool;
  const oldType = AT.type;
  AT.jarvisHull = null;
  if (SelectedShapes.list.length === 0) {
    // select shape under pointer
    const p = AT.mouse;
    const inside = drawings.filter((e) => e.contains(p));
    if (inside.length > 0) {
      SelectedShapes.list = inside.slice(-1);
      AT.revert = { oldTool, oldType };
      moveState(canCanvas, action);
    }
  } else {
    moveState(canCanvas, action);
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
