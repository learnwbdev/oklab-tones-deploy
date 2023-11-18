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
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @param {number} [mpPrcC = 5] - digit after decimal point to round Chroma
 * @return {number[]} Array of OKLch values with Chroma reduced to gamut: L as 0..1, C as 0.. , H as 0..360 (360 excluded)
 */

import { colorSpaces } from '../convert/colorSpaces.js';
import { checkColorInGamut } from './checkColorInGamut.js';

export function fitOklchChromaToGamut(colorOklch, colorSpaceGamut = colorSpaces.sRgb, mpPrcC = 5) {
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

    if (checkColorInGamut(colorOklch, colorSpaces.Oklch, colorSpaceGamut)) return colorOklch;

    // precision for the Chroma
    // const mpPrcC = 3; // Ex. for rounded value: 0.091
    const prcC = 10 ** mpPrcC; // precision for Chroma
    const precision = prcC ** (-1); // difference between found Chroma

    // function to convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const [origL, origC, origH] = colorOklch;

    // returm media white or black, if lightness is out of range
    if (origL >= 1) return [1, 0, 0]; // white color in Oklch
    if (origL <= 0) return [0, 0, 0]; // black color in Oklch

    // bound Hue to 0 .. 360 (360 excluded) -- probably typo in original color
    const boundH = Math.abs(origH) % 360;

    // Hue remains the same, so these parts don't need recalculation for color conversion to OKlab
    // (without Chroma multiplication)
    const adash = Math.cos(toRadians(boundH));
    const bdash = Math.sin(toRadians(boundH));

    // if (checkColorInGamut([origL, origC * adash, origC * bdash], colorSpaces.Oklab, colorSpaceGamut)) return [origL, origC, boundH];

    let minChroma = 0;
    let maxChroma = origC;
    let midChroma = 0;
    // `+ Number.EPSILON` is needed to not make it infinite loop because of ex.: 0.076-0.075 -> 0.0010000000000000009 > 0.001
    while ((maxChroma - minChroma) > precision + Number.EPSILON) {
        midChroma = (minChroma + maxChroma)/2;
        // round Chroma to precision (`prcC` defined to not get 1.0010000000000001 instead of 1.001)
        // Number.EPSILON for correct rounding of numbers like 1.0005 (source: https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary)
        midChroma = Math.round((midChroma + Number.EPSILON) * prcC) / prcC;
        if (checkColorInGamut([origL, midChroma * adash, midChroma * bdash], colorSpaces.Oklab, colorSpaceGamut)) {
            minChroma = midChroma;
        } else {
            maxChroma = midChroma;
        }
    }

    return [origL, minChroma, boundH];
}