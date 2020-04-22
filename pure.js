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
  return [r, g, b]
     // @ts-ignore
    .map((c) => Math.trunc(c).toString(16).padStart(2, "0"))
    .join("");
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
const scale = ({h,s,v},n,key,m=n) => {
    // generates n values based on hsv
    const d = (key === 'h') ? 360/n: 1/n;
    const base = (key ==='h') ? h : 0;
    return Array(n).fill(0).map((e,i) => {
      const c = {h,s,v};
      c[key] = (base + d*i) % 360;
      return c;
    }).slice(0,m);
}    

const rgb2div = rgb => `<div title="#${rgb2hex(rgb)}" 
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
  s += scale({h:0,s:0,v:0},9,'v',9).map(hsv2rgb).map(rgb2div).join("");
  s += scale({h:start,s:0,v:0.7},9,'s',9).map(hsv2rgb).map(rgb2div).join("");
  s += scale({h:(start+200) % 360,s:1,v:1},9,'h',9).map(hsv2rgb).map(rgb2div).join("");
  s += "</div>";
  return s;
};
