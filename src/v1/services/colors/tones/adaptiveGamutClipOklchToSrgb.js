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

// Clip color Oklch to Srgb gamut
// adaptive clipping towards the point dependant on the Hue
/**
* @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
* @param {number} [alpha = 0.05] as 0.. - parameter to control to what extent lightness is preserved: values close to zero will behave as pure chroma compression, and larger values will behave closer to the single point projection methods
* @param {number} [mpPrcL = 5] - precision for Lightness as integer number 0..17 (digit after decimal point to round Lightness)
* @param {number} [mpPrcC = 5] - precision for Chroma as integer number 0..17 (digit after decimal point to round Chroma)
* @param {number} [mpPrcH = 2] - precision for Hue as integer number 0..17 (digit after decimal point to round Hue)
* @param {boolean} [isRound = true] - flag to round Lightness, Chroma and Hue by mpPrcL, mpPrcC, mpPrcH
* @return {boolean} isInGamut: true - given color is inside sRGB gamut
 */

import { fitOklchChromaToGamut } from "../gamutMapping/fitOklchChromaToGamut.js";
import { findGamutIntersectionOklchSrgb } from "./findGamutIntersectionOklchSrgb.js";
import { findOklabLCCuspPoint } from "./findOklabLCCuspPoint.js";
import { normalizeOklabAb } from "./normalizeOklabAB.js";
import { clipLcAlongPrjLine } from "./clipLcAlongPrjLine.js";
import { checkColorInGamut } from "../gamutMapping/checkColorInGamut.js";
import { convertColor } from "../convert/convertColor.js";
import { colorSpaces } from "../convert/colorSpaces.js";

/* source:
        https://bottosson.github.io/posts/gamutclipping/#intersection-with-srgb-gamut
*/

export function adaptiveGamutClipOklchToSrgb(colorOklch, {alpha = 0.05, mpPrcL = 5, mpPrcC = 5, mpPrcH = 2, isRound = true} = {}) {
    const colorOklab = convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.Oklab, {isRoung: false});
    const colorLnRgb = convertColor(colorOklab, colorSpaces.Oklab, colorSpaces.linSRgb, {isRound: false});
    const isInSrgbGamut = !colorLnRgb.some(c => (c < 0) || (c > 1));

    // Return original given color if it's inside sRGB gamut
    if (isInSrgbGamut) return colorOklch;

    const prcL = 10 ** mpPrcL; // precision for Lightness
    const prcC = 10 ** mpPrcC; // precision for Chroma
    const prcH = 10 ** mpPrcH; // precision for Hue
    const [origLightn, origChroma, origHue] = colorOklch; // original Lightness, original Chroma
    const mpNoRnd = 15; // precision, digit after decimal point to find without rounding up, used in function `clipLcAlongPrjLine`

    // normalize *a, *b from Oklab color, so a^2 + b^2 == 1
    const [aOklabNrm, bOklabNrm] = normalizeOklabAb(...colorOklab.slice(1));

    // The cusp is computed here and in findGamutIntersectionOklchSrgb, an optimized solution would only compute it once.
    const [Lcusp, ] = findOklabLCCuspPoint(aOklabNrm, bOklabNrm);

    // Ld = L - cusp.L
    const deltaL = origLightn  - Lcusp;
    const kCoeff = 2 * (deltaL > 0 ? 1 - Lcusp : Lcusp)
    const e1Coeff = 0.5 * kCoeff + Math.abs(deltaL) + alpha * origChroma / kCoeff ;

    // another version to recalculate Chroma from a and b - gives the same Chroma as origChroma, only gives 0.00001 instead of zero
    // const eps = 0.00001; // to not divide by zero (to find a_ and b_)
    // const C = Math.max(eps, Math.sqrt(colorOklab[1] ** 2 + colorOklab[2] ** 2)); // Chroma
    // const e1Coeff = 0.5 * kCoeff + Math.abs(deltaL) + alpha * C / kCoeff ;

    const L0prj = Lcusp + 0.5 * (Math.sign(deltaL) * (e1Coeff - Math.sqrt(e1Coeff ** 2 - 2 * kCoeff * Math.abs(deltaL))));

    const tCoeff = findGamutIntersectionOklchSrgb(aOklabNrm, bOklabNrm, origLightn, origChroma, L0prj);
    const clippedLightn = L0prj * (1 - tCoeff) + tCoeff * origLightn;
    const clippedChroma = tCoeff * origChroma;

    let colorOklchClipped = [clippedLightn, clippedChroma, origHue]; // !! returns color out of Gamut, should return approximately intersection with Gamut
    // another way -recalculate Hue (gives similar result)
    // const colorOklabClipped = [clippedLightn, clippedChroma * aOklabNrm, clippedChroma * bOklabNrm];
    // let colorOklchClipped = convertOklabToOklch(colorOklabClipped);
    // let colorOklchClipped = convertColor(colorOklabClipped, colorSpaces.Oklab, colorSpaces.Oklch, {isRound: false})

    // round Lightness, Chroma and Hue if `isRound` is true
    colorOklchClipped = !isRound ? colorOklchClipped : colorOklchClipped.map(
        (v, i) =>
            i === 0 ? Math.floor((v + Number.EPSILON) * prcL ) / prcL :
            i === 1 ? Math.floor((v + Number.EPSILON) * prcC ) / prcC :
            Math.round((v + Number.EPSILON) * prcH ) / prcH
        );

    // clip the found color to sRGB gamut along the projection line, if the color in outside the sRGB gamut (mostly for upper half of the triangle)
    colorOklchClipped = checkColorInGamut(colorOklchClipped, colorSpaces.Oklch, colorSpaces.sRgb) ?
                        colorOklchClipped :
                        clipLcAlongPrjLine(...colorOklchClipped, L0prj, {mpPrcL: isRound ? mpPrcL : mpNoRnd,
                                                                         mpPrcC: isRound ? mpPrcC : mpNoRnd});
    // check that resulting color is in sRGB gamut, if not - clip the Chroma to sRGB gamut
    colorOklchClipped = fitOklchChromaToGamut(colorOklchClipped, colorSpaces.sRgb);

    return colorOklchClipped;
}