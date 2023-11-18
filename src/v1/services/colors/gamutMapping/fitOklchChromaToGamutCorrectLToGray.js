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

// To CSS gamut map a color `origin` in color space `origin color space`
// to be in gamut of a destination color space `destination`
/**
 * Fit Chroma in Gamut, correct Lightness to Gray lightness, correct Hue to the Hue in the cusp point
 * Gray Lightness - lightness for color [L, 0, 0]
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @param {number} [targetL = 0] as 0..1 - target Oklch Lightness for the gray color (original Lightness before changes). If = 0, then target Lightness is L from colorOklch
 * @param {number} [mpPrcL = 5] as 0..17 (integer)  - precision for Lightness in Oklch or Oklab color (digit after decimal point to round Lightness)
 * @param {number} [mpPrcC = 5] as 0..17 (integer)  - precision for Chroma in Oklch color (digit after decimal point to round Chroma)
 * @return {number[]} Array of OKLch values with Chroma reduced to gamut: L as 0..1, C as 0.. , H as 0..360 (360 excluded)
 */

import { colorSpaces } from '../convert/colorSpaces.js';
import { convertColor } from '../convert/convertColor.js';
import { LMS_Oklab__to__XYZ_D65, OKLab__to__LMS_3 } from '../matrices/colorMatrices.js';
import { multiplyMatrices } from '../utils/multiplyMatrices.js';
import { solveOklchLightnFromCubicEq } from '../utils/solveOklchLightnFromCubicEq.js';
import { checkColorInGamut } from './checkColorInGamut.js';

export function fitOklchChromaToGamutCorrectLToGray(colorOklch, colorSpaceGamut = colorSpaces.sRgb, {targetL = 0, mpPrcL = 5, mpPrcC = 5} = {}) {
    /*
       reference sources: https://www.w3.org/TR/css-color-4/#binsearch
                          https://github.com/w3c/csswg-drafts/issues/7135
       but only with chroma reduced to sRgb gamut, hue & lightness stay the same

       sources for convertion of OKlab to sRGB:
               https://bottosson.github.io/posts/gamutclipping/#oklab-to-linear-srgb-conversion
               https://bottosson.github.io/posts/oklab/#the-oklab-color-space
               https://www.w3.org/TR/css-color-4/#color-conversion-code
       matrices from:
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/oklab/__init__.py
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/okhsl.py
    */

    const [origL, origC, origH] = colorOklch;

    // return media white or black, if lightness is out of range
    if (origL >= 1) return [1, 0, 0]; // white color in Oklch
    if (origL <= 0) return [0, 0, 0]; // black color in Oklch

    // function to convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    // clamp function: returns val if its within [min, max], otherwise min if val < min or max if val > max
    const clampNum = (min, val, max) => Math.max(min, Math.min(val, max));

    const prcC = 10 ** mpPrcC; // precision for Chroma
    const prcL = 10 ** mpPrcL; // precision for Lightness
    const precision = prcC ** (-1); // difference between found Chroma

    // min difference between Y to not be different gray color in sRGB (for dark colors it's smaller (differnce), for lighter colors it could be bigger)
    const Ytolerance = 2 ** (-13);  // ~ 0.000122 (more precise when tolerance is in binary) https://dev.to/alldanielscott/how-to-compare-numbers-correctly-in-javascript-1l4i
    // `mp` - multipliers
    const Lms_3_mp = OKLab__to__LMS_3.map(row => row.slice(1)); // only last two columns of the matrix ( for a, b )
    const Y_mp = LMS_Oklab__to__XYZ_D65[1]; // only second row of the matrix ( for Y )

    // bound Hue to 0 .. 360 (360 excluded) -- probably typo in original color
    const boundH = Math.abs(origH) % 360;
    // if (checkColorInGamut([origL, origC * aNrm, origC * bNrm], colorSpaces.Oklab, colorSpaceGamut)) return [origL, origC, boundH];

    // Hue remains the same, so these parts don't need recalculation for color conversion to OKlab
    // (without Chroma multiplication)
    const aNrm = Math.cos(toRadians(boundH)); // a / C (Chroma)
    const bNrm = Math.sin(toRadians(boundH)); // b / C (Chroma)

    let AB_Norm = [aNrm, bNrm];
    let dLms = multiplyMatrices(Lms_3_mp, AB_Norm); // coefficients for Chroma in l', m', s'. Ex: l' = L + dLms[0] * C
    let dLms_p2 = dLms.map(c => c ** 2); // ** 2, coefficients for Chroma ** 2
    let dLms_p3 = dLms.map(c => c ** 3); // ** 3, coefficients for Chroma ** 3

    // coefficients in the formula for Y: Y = L ** 3 + k_C_L2 * C * L ** 2 + k_C2_L * C ** 2 * L + k_C3 * C ** 3
    // coefficient for C ** 3
    let k_C3 = multiplyMatrices(Y_mp, dLms_p3)[0];
    // coefficient for C ** 2 * L
    let k_C2_L = 3 * multiplyMatrices(Y_mp, dLms_p2)[0];
    // coefficient for C * L ** 2
    let k_C_L2 = 3 * multiplyMatrices(Y_mp, dLms)[0];
    let k = [k_C_L2, k_C2_L, k_C3];

    // find target Y corresponding to gray color [origL, 0, 0] or [targetL, 0, 0] (if targetL is not equal to 0)
    // let Ytg = convertColor([origL, 0, 0], colorSpaces.Oklch, colorSpaces.XYZ)[1];  // = origL ** 3
    // let Ytg = origL ** 3;
    // set target Lightness to the Lightness of the gray color for the L from a given color or for the given target L
    targetL = clampNum(0, targetL, 1);
    let Ytg = targetL === 0 ? origL ** 3 : targetL ** 3;
    // current Y from XYZ color space
    let Ycr = convertColor([origL, origC, boundH], colorSpaces.Oklab, colorSpaces.XYZ)[1];

    // correct Lightness to match L for gray color [origL, 0, 0], so that new color will have the same gray color when converted to grayscale
    let L_new = origL;
    if (Math.abs(Ycr - Ytg) > Ytolerance) {
        // solve cubic equation for L for the current C and H to match Y target (target gray lightness)
        let mC = [origC, origC ** 2, origC ** 3];
        let kC = mC.map((v, i) => v * k[i]); // coefficient for L
        // solve cubic equation for L: L**3 + kC[0] * L**2 + kC[1] * L + ( kC[2] - Ytg ) = 0
        L_new = solveOklchLightnFromCubicEq(kC[0], kC[1], kC[2] - Ytg); // the largest solution clamped to [0, 1]
        // round Lightness
        L_new = Math.floor((L_new + Number.EPSILON) * prcL ) / prcL + 0; // `+ 0` to convert -0 to +0
    }
    // return original color with corrected Lightness
    if (checkColorInGamut([L_new, origC, boundH], colorSpaces.Oklch, colorSpaceGamut)) return [L_new, origC, boundH];

    // clip Chroma to gamut with corrected Lightness
    let minChroma = 0;
    let maxChroma = origC;
    let midChroma = 0;
    let L_prev = origL; // previous Lightness to apply if the final Lightness would be outside of the gamut
    // `+ Number.EPSILON` is needed to not make it infinite loop because of ex.: 0.076-0.075 -> 0.0010000000000000009 > 0.001
    while ((maxChroma - minChroma) > precision + Number.EPSILON) {
        midChroma = (minChroma + maxChroma)/2;
        // round Chroma to precision (`prcC` defined to not get 1.0010000000000001 instead of 1.001)
        // Number.EPSILON for correct rounding of numbers like 1.0005 (source: https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary)
        midChroma = Math.floor((midChroma + Number.EPSILON) * prcC) / prcC + 0;

        let colorOklab_cur = [origL, midChroma * aNrm, midChroma * bNrm];
        // find current Y
        let Ycr = convertColor(colorOklab_cur, colorSpaces.Oklab, colorSpaces.XYZ)[1];

        L_new = origL;
        // correct Lightness to match L for gray color [origL, 0, 0], so that new color will have the same gray color when converted to grayscale
        if (Math.abs(Ycr - Ytg) > Ytolerance) {
            // solve cubic equation for L for the current C and H to match Y target (target gray lightness)
            let mC = [midChroma, midChroma ** 2, midChroma ** 3];
            let kC = mC.map((v, i) => v * k[i]); // coefficient for L
            // solve cubic equation for L: L**3 + kC[0] * L**2 + kC[1] * L + ( kC[2] - Ytg ) = 0
            L_new = solveOklchLightnFromCubicEq(kC[0], kC[1], kC[2] - Ytg); // the largest solution clamped to [0, 1]
            // round Lightness
            L_new = Math.floor((L_new + Number.EPSILON) * prcL ) / prcL + 0; // `+ 0` to convert -0 to +0

            colorOklab_cur = [L_new, midChroma * aNrm, midChroma * bNrm];
        }

        if (checkColorInGamut(colorOklab_cur, colorSpaces.Oklab, colorSpaceGamut)) {
            minChroma = midChroma;
            L_prev = L_new;
        } else {
            maxChroma = midChroma;
        }
        // console.log(minChroma, maxChroma, L_new, Ycr - Ytg,
        //     checkColorInGamut(colorOklab_cur, colorSpaces.Oklab, colorSpaceGamut), L_prev
        //     // checkColorInGamut([origL, midChroma * aNrm, midChroma * bNrm], colorSpaces.Oklab, colorSpaceGamut)
        // );
    }

    // new color Oklch should be in gamut (with corrected L to match a gray color and Chroma in Gamut)
    let colorOklch_new = [L_new, minChroma, boundH];
    // if new color is outside the Gamut change Lightness to the previous L inside the Gamut
    if (!checkColorInGamut(colorOklch_new, colorSpaces.Oklch, colorSpaceGamut)) colorOklch_new = [L_prev, minChroma, boundH];

    return colorOklch_new;
}