// @ts-check
/**
 * Create a shape and render on given context.<br>
 * Also show outline on ghost while selectiong/moving
 */
class MakeShapes {
  /**
   * @param {Object} init
   * @param {CanvasRenderingContext2D} init.ctx canvas
   * @param {Object} init.start startpos
   * @param {Number} init.start.y ypos
   * @param {Number} init.start.x xpos
   * @param {Object} init.end end position
   * @param {Number} init.end.y ypos
   * @param {Number} init.end.x xpos
   * @param {boolean} init.closing true if final point
   * @returns {Shape|undefined}
   */
  static polygon({ ctx, start, end, closing = false }) {
    let shape;
    const c = AT.color;
    const f = AT.fill;
    if (AT.points.length === 0) {
      AT.points.push(start);
    }
    const P = new Vector(start);
    const Q = new Vector(end);
    if (P.sub(Q).length > 2 || closing) {
      const newpoints = AT.points.slice();
      if (!closing) {
        newpoints.push(end);
      }
      const { x, y } = findCentroid(newpoints);
      const points = newpoints.map((e) => ({ x: e.x - x, y: e.y - y }));
      shape = new Polygon({ x, y, points, c, f });
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
    const realpoints = xyList2Points([x, y, x + w, y, x + w, y + h, x, y + h]);
    if (h > 0 && w > 0) {
      const { x, y } = findCentroid(realpoints);
      // points is now delta relative to {x,y}
      const points = realpoints.map((e) => ({ x: e.x - x, y: e.y - y }));
      shape = new Polygon({ x, y, points, c, f });
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
      const w = Math.abs(wh.x);
      const h = Math.abs(wh.y);
      if (h > 0 && w > 0) {
        // dont need to calculate centroid as we wont rotate this square
        const points = xyList2Points([0, 0, w, 0, w, h, 0, h]);
        const marker = new Polygon({
          x,
          y,
          points,
          c: "gray",
          f: "transparent",
        });
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
      shapeAction(diff, "move", gtx);
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
      shapeAction(diff, "rotate", gtx);
    }
    return undefined;
  }
  static scale({ gtx }) {
    const p1 = new Vector(AT.start);
    const p2 = new Vector(AT.end);
    const diff = p2.sub(p1);
    if (diff.length > 1) {
      cleanGhost();
      shapeAction(diff, "scale", gtx);
    }
    return undefined;
  }
}
