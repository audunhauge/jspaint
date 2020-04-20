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
 * Generate a scale from dark to light
 * @param {hsv} start color
 * @param {number} n 
 */
const vscale = ({h,s,v},n) => {
    // generates n values starting at hsv by stepping v from 0 to 1
    const d = 1/n;
    return Array(n).fill(0).map((e,i) => ({h,s,v:d*i}));
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
  s += "<div>";
  s += vscale({h:0,s:0,v:0},9).map(hsv2rgb).map(rgb2div).join("");
  s += "</div>";
  return s;
};
