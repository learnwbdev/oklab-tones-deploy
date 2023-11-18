// Convert RGB to HEX
/**
 * @param {number[]} colorRgb - Array of RGB values: R as 0..255, G as 0..255 , B as 0..255
 * @return {string} HEX color
 */

import { colorSpaces } from "../../colorSpaces.js";
import { roundColor } from "../../roundColor.js";

/* sources:
            https://learnersbucket.com/examples/interview/convert-rgb-to-hex-color-in-javascript/
            https://ryanclark.me/rgb-to-hex-via-binary-shifting/
*/

export function convertSRgbToHex(colorRgb) {
   colorRgb = roundColor(colorRgb, colorSpaces.sRgb); // to get integer r, g, b values
   const [r, g, b] = colorRgb;
   // `b << 0` to round number, not to get hex as #d6a0f6.fb081bf if rgb colors are not integer
   //    const colorHEX = '#' + ((1 << 24) + (r << 16) + (g << 8) + b << 0).toString(16).slice(1);
   const colorHEX = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

   return colorHEX;
};