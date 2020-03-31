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
 * A square shape
 */
class Square extends Point {
    /**
     * 
     * @param {{x:number,y:number,w:number,h:number,c:string}} w=width,h=height
     */
  constructor({ x, y, w, h, c }) {
    super({ x, y });
    this.w = w;
    this.h = h;
    this.c = c;
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
          let f = new Square({ x: 200, y: 200, w: 50, h: 50, c:color});
          f.render(ctx);
          break;
        case "circle":
          drawCircle();
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