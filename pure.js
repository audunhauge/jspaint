// @ts-check
// only pure functions

/** 
 * @typedef {Object} hsv
 * @property {number} hsv.h
 * @property {number} hsv.s
 * @property {number} hsv.v
 *
 * @typedef {Object} rgb
 * @property {number} rgb.r
 * @property {number} rgb.g
 * @property {number} rgb.b
 */

/**
 * Convert rgb to hsv
 * @param {rgb} rgb red green blue
 * @returns {hsv}
 */
function rgb2hsv({ r = 0, g = 0, b = 0 }) {
  r = r / 255;
  g = g / 255;
  b = b / 255;
  const minRGB = Math.min(r, Math.min(g, b));
  const maxRGB = Math.max(r, Math.max(g, b));
  let h = 0,
    s = 0,
    v = maxRGB;
  if (minRGB !== maxRGB) {
    // Colors other than black-gray-white:
    const d = r == minRGB ? g - b : b == minRGB ? r - g : b - r;
    h = r === minRGB ? 3 : b === minRGB ? 1 : 5;
    h = 60 * (h - d / (maxRGB - minRGB));
    s = (maxRGB - minRGB) / maxRGB;
  }
  return { h, s, v };
}

/**
 * Convert hsv to rgb
 * @param {hsv} hsv
 * @returns {rgb}
 */
function hsv2rgb({ h, s, v }) {
  let f = (n, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return { r: 255 * f(5), g: 255 * f(3), b: 255 * f(1) };
}

/**
 * Convert rgb to hex
 * @param {rgb} rgb
 * @returns {string}
 */
function rgb2hex({ r, g, b }) {
  return (
    [r, g, b]
      // @ts-ignore
      .map((c) => Math.trunc(c).toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Convert hex to rgb
 * TypeError if no parameter (because of slice), NaN values if not valid hex color string
 * @param {string} color assumed to be 6 hex digits like "ffc0a4"
 * @returns {rgb}
 */
const hex2rgb = (color) =>
  // @ts-ignore  vscode thinks this may return {}
  [color.slice(0, 2), color.slice(2, 4), color.slice(4, 6)]
    .map((k) => parseInt(k, 16))
    .reduce((s, v, i) => ((s["rgb".charAt(i)] = v), s), {});

/**
 * Generate a scale from starting hsv
 * @param {hsv} color
 * @param {number} n divide the range into this many slices
 * @param {string} key h,s,v
 * @param {number} m return this many colors m<=n
 */
const scale = ({ h, s, v }, n, key, m = n) => {
  // generates n values based on hsv
  const d = key === "h" ? 360 / n : 1 / n;
  const base = key === "h" ? h : 0;
  return Array(n)
    .fill(0)
    .map((e, i) => {
      const c = { h, s, v };
      c[key] = (base + d * i) % 360;
      return c;
    })
    .slice(0, m);
};

/**
 * Creates a div with given background color and title set to color
 * @param {rgb} rgb background color
 */
const rgb2div = (rgb) => `<div title="#${rgb2hex(rgb)}" 
         style="background-color:#${rgb2hex(rgb)}"></div>`;

/**
 * Creates a color swatch given a base color
 * @param {number} start H part of hsv color, 0..360
 * @returns {string} html-fragment for color swatch
 */
const makeSwatch = (start) => {
  let s = "";
  [0, 20, 40, 60, 80, 180, 200].forEach((h) => {
    s += "<div>";
    h = (start + h) % 360;
    const pq = {
      0: (x) => ({ h, s: 1, v: x / 100 }),
      1: (x) => ({ h, s: x / 100, v: 1 }),
      2: (x) => ({ h: (h + x - 50) % 360, s: 0.9, v: 0.9 }),
    };

    for (let i = 0; i < 3; i++) {
      const p = pq[i % 3];
      s += [100, 90, 80, 70, 60, 50, 40, 30, 20]
        .map(p)
        .map(hsv2rgb)
        .map(rgb2div)
        .join("");
    }
    s += "</div>";
  });
  // create a grayscale, a gray color scale and a neighbour scale
  // grayscale is independent of base color
  // gray color scale takes base color and goes grayish
  // neighbour scale finds four neighbours to left and right around base
  //   the base color will be in the middle
  //   can thus move left/right round the color-ring by
  //   placing pointer on a neighbour and pressing Home-key
  s += "<div>";
  s += scale({ h: 0, s: 0, v: 0 }, 9, "v", 9)
    .map(hsv2rgb)
    .map(rgb2div)
    .join("");
  s += scale({ h: start, s: 0, v: 0.7 }, 9, "s", 9)
    .map(hsv2rgb)
    .map(rgb2div)
    .join("");
  s += scale({ h: (start + 200) % 360, s: 1, v: 1 }, 9, "h", 9)
    .map(hsv2rgb)
    .map(rgb2div)
    .join("");
  s += "</div>";
  return s;
};

/**
 * Returns true if two polygons overlap (both assumed convecs)
 * @param {Array.<number>} points1 [x1,y1,x2,y2,...]
 * @param {Array.<number>} points2 [x1,y1,x2,y2,...]
 * @returns {boolean} true if they overlap
 */
function polygonPolygon(points1, points2) {
  let a = points1;
  let b = points2;
  let polygons = [a, b];
  let minA, maxA, projected, minB, maxB, j;
  for (let i = 0; i < polygons.length; i++) {
    let polygon = polygons[i];
    for (let i1 = 0; i1 < polygon.length; i1 += 2) {
      let i2 = (i1 + 2) % polygon.length;
      let normal = {
        x: polygon[i2 + 1] - polygon[i1 + 1],
        y: polygon[i1] - polygon[i2],
      };
      minA = maxA = null;
      for (j = 0; j < a.length; j += 2) {
        projected = normal.x * a[j] + normal.y * a[j + 1];
        if (minA === null || projected < minA) {
          minA = projected;
        }
        if (maxA === null || projected > maxA) {
          maxA = projected;
        }
      }
      minB = maxB = null;
      for (j = 0; j < b.length; j += 2) {
        projected = normal.x * b[j] + normal.y * b[j + 1];
        if (minB === null || projected < minB) {
          minB = projected;
        }
        if (maxB === null || projected > maxB) {
          maxB = projected;
        }
      }
      if (maxA < minB || maxB < minA) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Finds center of polygon
 * @param {Array.<Point>} pts points of polygon [p1,p2, ... ]
 */
function findCentroid(pts) {
  const off = pts[0];
  let twicearea = 0;
  const nPts = pts.length;
  let x = 0;
  let y = 0;
  let p1, p2;
  let f;
  for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
    p1 = pts[i];
    p2 = pts[j];
    f = (p1.x - off.x) * (p2.y - off.y) - (p2.x - off.x) * (p1.y - off.y);
    twicearea += f;
    x += (p1.x + p2.x - 2 * off.x) * f;
    y += (p1.y + p2.y - 2 * off.y) * f;
  }
  f = twicearea * 3;
  return {
    x: x / f + off.x,
    y: y / f + off.y,
  };
}

/**
 * Convert [x1,y1, x2,y2, ... ] to [ p1, p2, ..]
 * @param {Array.<number>} xys [x1,y1, x2,y2, ...]
 * @returns {Array.<Point>}
 */
function xyList2Points(xys) {
  const points = [];
  for (let i = 0; i < xys.length; i += 2) {
    const [x, y] = xys.slice(i, i + 2);
    const p = new Point({ x, y });
    points.push(p);
  }
  return points;
}

/**
 * Converts array of points to xylist [x1,y1, x2,y2, ...]
 * @param {Array.<Point>} points [p1,p2, ...]
 * @returns {Array.<number>}
 */
function points2xyList(points) {
  return points.reduce((s, p) => s.concat([p.x, p.y]), []);
}

/**
 * Converts array of points to array of deltas between each pair
 * d1 = p2-p1, d2 = p3-p2, ... d(n-1) = p(n)-p(n-1)
 * @param {Array.<Point>} points [p1,p2, ... pn]  total n points
 * @returns {Array.<Point>} [ d1,d2, ... d(n-1) ]  total n-1 deltas
 */
function points2delta(points) {
  const { x: a, y: b } = points[0]; // starting point
  // calculate delta from one point to the next
  const { delta } = points.slice(1).reduce(
    (s, e) => {
      let { x, y } = e;
      let { a, b } = s.prev;
      s.prev = { a: x, b: y };
      x -= a;
      y -= b;
      s.delta.push({ x, y });
      return s;
    },
    { delta: [], prev: { a, b } }
  );
  return delta;
}

/**
 * Check if point is inside polygon
 * Ignores some edge cases for speed  (point on/near edge)
 * @param {Array.<number>} points [x1,y1, x2,y2, ...]
 * @param {Point} p
 */
function polygonPoint(points, { x, y }) {
  const length = points.length;
  let c = false;
  let i, j;
  for (i = 0, j = length - 2; i < length; i += 2) {
    if (
      points[i + 1] > y !== points[j + 1] > y &&
      x <
        ((points[j] - points[i]) * (y - points[i + 1])) /
          (points[j + 1] - points[i + 1]) +
          points[i]
    ) {
      c = !c;
    }
    j = i;
  }
  return c;
}

/**
 * Rotates point p angle rads around origo
 * @param {number} sin Math.sin(angle)
 * @param {number} cos Math.cos(angle)
 * @param {Point} p point to rotate
 */
function rotate(p, sin, cos) {
  let {x,y} = p;
  // translate point back to origin:
  // rotate point and translate back
  const nx = (x * cos - y * sin);
  const ny = (x * sin + y * cos);
  return {x:nx,y:ny};
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

/**
 * Converts hex "string" to rgba contrast color, 0.5 alpha
 * @param {string} rgbHex like "ff0000" for blue
 */
function contrast(rgbHex) {
    const contrast = rgb2hsv(hex2rgb(rgbHex));
    contrast.h = (contrast.h + 180) % 360;
    const { r, g, b } = hsv2rgb(contrast);
    return `rgba(${r},${g},${b},0.5)`; // fill color contrast
}

// extend 2d context with this function
// @ts-ignore
CanvasRenderingContext2D.prototype.roundRect = _roundRect;


/**
 * Given three points returns orientation of turn
 * from p-q to p-r
 * @param {Point} p 
 * @param {Point} q 
 * @param {Point} r 
 * @returns{0|1|2} orientation, 1=right 2=left 0=coincident
 */
const orient = (p, q, r) => {
  const val = (q.y - p.y) * (r.x - q.x) - 
              (q.x - p.x) * (r.y - q.y);
  return val === 0 ? 0 : ((val > 0) ? 1 : 2);
};


/**
 * Wraps a set of points in a bounding polygon
 * @param {Array.<Point>} points to be wrapped
 */
const jarvis = points => {
  const hull = [];
  let leftMost = points.reduce((a, e, i) => {
    return points[a].x < points[i].x ? a : i;
  }, 0);
  let q = 0;
  let p = leftMost;
  
  do {
    hull.push(points[p]);
    q = (p + 1) % points.length;
    
    for (let i = 0; i < points.length; i++) {
       const o = orient(points[p], points[i], points[q]);
      
       if (o === 2) {
         q = i;
       }
    }
    
    p = q;
  } while (p !== leftMost);
  return hull;
};