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
  ColorSwatch.state = key; // so c can see
}

/**
 * Static class for keyborad actions - simple means SelectedShapes.list can be empty
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
   * Select color swatch
   * @param {Object} obj not used
   */
  static c(obj) {
    if (ColorSwatch.state && "12345678".includes(ColorSwatch.state)) {
      // prev key was one of 1..8 - so activate this swatch
      ColorSwatch.group = Number(ColorSwatch.state);
      ColorSwatch.row = 0;
      ColorSwatch.cell = 0;
    }
    // cc means get next color cell
    if (ColorSwatch.state === "c") {
      ColorSwatch.cell = (ColorSwatch.cell + 1) % 9;
    }
    // vc means next row
    if (ColorSwatch.state === "v") {
      ColorSwatch.cell = 0;
      ColorSwatch.row = (ColorSwatch.row + 1) % 3;
    }
    ColorSwatch.setColor();
  }

  /**
   * Load image into Picture
   * @param {Object} obj not used
   */
  static l(obj) {
    if (SelectedShapes.list.length === 0) {
      // select shape under pointer
      const p = AT.mouse;
      const inside = drawings.filter((e) => e.contains(p));
      if (inside.length > 0) {
        const maybeTarget = inside[inside.length - 1];
        if (maybeTarget.isa("Picture")) {
          // typecast to Picture
          const target = /** @type {Picture} */ (maybeTarget);
          const np = g("newpage");
          makeForm(
            np,
            "loadpic",
            () => {
              const loader = g("imgloader");
              // place the image loader aprox over the Picture shape
              const {x,y,width,height} = target;
              const left = (x - width/2 + 180) + "px";
              const top = (y - height/2 + 100) + "px";
              const w = Math.max(200,width) ;
              const h = Math.max(100,height) ;
              np.style.left = left ;
              np.style.top = top;
              np.style.width = w + "px";
              np.style.height = 40 + h + "px";
             
              loader.addEventListener("change", (event) => {
                const output = document.createElement("img");
                output.src = URL.createObjectURL(event.target.files[0]);
                np.classList.add("hidden");
                output.onload = function () {
                  const { width: tw, height: th } = target;
                  const { width, height } = output;
                  URL.revokeObjectURL(output.src); // free memory
                  const ctx = target.offscreenCanvas.getContext("2d");
                  ctx.drawImage(output, 0, 0, width, height, 0, 0, tw, th);
                  renderCanvas();
                };
              });
            },
            null
          );
        }
      }
    }
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
    }
  }
  static Delete({ ctx, divShapelist }) {
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
