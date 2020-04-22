// @ts-check

/**
 * @file Paint - draw shapes on a canvas. The shapes are stored in an array and redrawn on change. You can select
 * an existing shape or shapes and move/scale/rotate/delete.
 * <p>
 * <b>drawings</b> is a global array of shapes to draw. This is the
 * main structure that stores all info about the canvas drawing.
 * Picture is repainted by iterating thru this array.
 * </p>
 */

// can only push Shape (or subclasses) into drawings
/**  @type {Array.<Shape>}  */
let drawings = [];

// these need to be given values in setup
// as they connect to the DOM
let cleanGhost; // wipes ghost canvas
let cleanCanvas; // wipes main canvas
let B; // Top Left corner of canvas - used to calculate mouse(x,y)
let pointerActive; // function to check input:radio for pointers
let shapesActive; // ditto for shapes
let swatchAdjust;

const mouse = {}; // stores mouse pos for document

/**
 * Runs renderAll(ctx)<br>
 * Bound to canvas context
 */
let renderCanvas; // specialized version of renderAll - bound to canvas ctx

/**
 * Get element from html id
 * @param {string} id html-element id
 */
const g = (id) => document.getElementById(id);

let baseColor = 0; // starting color for swatches

/**
 * Start/Main function for application
 * Sets up eventlisteners for tools and canvas
 * Connects some utility functions to DOM elements
 */
function setup() {
  cleanGhost = () => gtx.clearRect(0, 0, 1024, 800);
  cleanCanvas = () => ctx.clearRect(0, 0, 1024, 800);

  const current = g("current");
  const divTools = g("tools");
  // cast from html-element to canvas
  const canCanvas = /** @type {HTMLCanvasElement} */ (g("canvas"));
  const canGhost = /** @type {HTMLCanvasElement} */ (g("ghost"));
  const divColors = g("colors");
  const divShapelist = g("shapelist");
  const ctx = canCanvas.getContext("2d");
  const gtx = canGhost.getContext("2d"); // preview next drawing operation
  const inpPointers = g("pointers"); // turned on by keys
  const inpShapes = g("shapes"); // turned on by keys
  B = canCanvas.getBoundingClientRect(); // x,y for top left corner of canvas

  AT.showfillAndColor = () => {
    //current.style.color = AT.color;
    //current.style.backgroundColor = AT.fill;
  };

  divColors.innerHTML = makeSwatch(baseColor);
  swatchAdjust = () => adjustColors(divColors); // bind to divColors

  // set pointers selected
  pointerActive = () =>
    /**  @type {HTMLInputElement} */ (inpPointers).checked = true;
  // set shapes selected
  shapesActive = () =>
    /**  @type {HTMLInputElement} */ (inpShapes).checked = true;

  renderCanvas = () => renderAll(ctx);

  divTools.addEventListener("click", (e) =>
    activateTool(e, ctx, gtx, divShapelist)
  );

  divColors.addEventListener("click", chooseColor);

  /* tool-use activated by mouse-down */
  document.addEventListener("mousedown", startAction);
  document.addEventListener("mouseup", (e) =>
    endAction(e, divShapelist, canCanvas, ctx, gtx)
  );

  /* so we know where mouse is any time */
  canCanvas.addEventListener("mousemove", (e) => {
    const x = e.clientX - B.x;
    const y = e.clientY - B.y;
    AT.mouse = { x, y };
  });

  document.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener("keydown", (e) =>
    keyAction(e, canCanvas, ctx, divShapelist)
  );

  /**
   * Handle mouse-down on canvas
   * @instance test
   * @param {MouseEvent} e
   */
  function startAction(e) {
    const x = e.clientX - B.x;
    const y = e.clientY - B.y;
    AT.start = { x, y };
    canCanvas.addEventListener("mousemove", (e) => showGhost(e, gtx));
  }
}
