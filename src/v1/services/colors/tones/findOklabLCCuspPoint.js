/*
Copyright (c) 2021 Björn Ottosson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* source:
        https://bottosson.github.io/posts/gamutclipping/#intersection-with-srgb-gamut
        https://colab.research.google.com/drive/1JdXHhEyjjEE--19ZPH1bZV_LiGQBndzs?usp=sharing
*/


// Find L_cusp and C_cusp for a given hue (for Oklch, Oklab color)
// (L_cusp, C_cusp) - third point for a gamut sRGB triangle for a given Hue (Oklch), other two points: (0, 0) and (1, 0)
// L_cusp - approximate maximum of Lightness for Oklch color in SRgb gamut for a given Hue (Oklch)
// C_cusp - approximate maximum of Chroma for Oklch color in SRgb gamut for a given Hue (Oklch)
// where C - Chroma, L - Lightness in Oklch space
// a and b must be normalized so a^2 + b^2 == 1
/**
 * @param {number} aOklabNrm as -1..1 - a for Oklab color (how green/red the color is)
 * @param {number} bOklabNrm as -1..1 - b for Oklab color (how blue/yellow the color is)
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @return {number[]} Array of L_cusp, C_cusp: L_cusp as 0..1, C_cusp as 0.. (unbounded, real max ~ 0.4)
 */

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";
import { findMaxSaturation } from "./findMaxSaturation.js";

export function findOklabLCCuspPoint(aOklabNrm, bOklabNrm, colorSpaceGamut = colorSpaces.sRgb) {
    // linear Color Space to check that color is outside the gamut
    let colorSpaceCheckIn = [colorSpaces.sRgb, colorSpaces.linSRgb].includes(colorSpaceGamut) ? colorSpaces.linSRgb :
                            [colorSpaces.dispP3, colorSpaces.linDspP3].includes(colorSpaceGamut) ? colorSpaces.linDspP3 :
                            undefined;

    if ( typeof colorSpaceCheckIn === "undefined" ) {
    console.log(`findOklabLCCuspPoint: unsupported Color Space to check the gamut in, ${colorSpaceGamut}.\n
    Supported: ${colorSpaces.sRgb}, ${colorSpaces.linSRgb}, ${colorSpaces.dispP3}, ${colorSpaces.linDspP3}`);
    return undefined;
    };

    // aOklabNrm and bOklabNrm must be normalized so aOklabNrm^2 + bOklabNrm^2 == 1
    if ( Math.round(aOklabNrm ** 2 + bOklabNrm ** 2) !== 1 ) {
        console.log(`findOklabCuspPoint: a and b should be normalized so a^2 + b^2 == 1. a: ${aOklabNrm}, b: ${bOklabNrm}, ${Math.round(aOklabNrm ** 2 + bOklabNrm ** 2)} !== 1`);
        return undefined;
    }
    // First, find the maximum saturation (saturation S = C/L)
    const S_cusp = findMaxSaturation(aOklabNrm, bOklabNrm, colorSpaceGamut);

    // Convert to linear sRGB to find the first point where at least one of r,g or b >= 1:
    const colorRgbAtMax = convertColor([1, S_cusp * aOklabNrm, S_cusp * bOklabNrm], colorSpaces.Oklab, colorSpaceCheckIn, {isRound: false});
    // L_cusp = cbrt(1 / max(max(rgb_at_max.r, rgb_at_max.g), rgb_at_max.b));
    const L_cusp = Math.cbrt(1 / Math.max(Math.max(colorRgbAtMax[0], colorRgbAtMax[1]), colorRgbAtMax[2]));
    const C_cusp = L_cusp * S_cusp;

    return [L_cusp, C_cusp];
}