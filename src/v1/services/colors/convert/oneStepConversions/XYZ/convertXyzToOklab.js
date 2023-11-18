// Convert CIEXYZ to Oklab

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

// from https://www.w3.org/TR/css-color-4/#color-conversion-code
// For clarity, a library is used for matrix multiplication (multiplyMatrices.js)
// The matrices are in column-major order (https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/geometry/row-major-vs-column-major-vector)


/**
 * @param {number[]} colorXYZ - Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 * @return {number[]} Array of OKLab values: L as 0..1, a and b as -0.4 .. 0.4 (max Chroma)
 * L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is
 */

import { LMS_3__to__OKLab, XYZ_D65__to__LMS_Oklab } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';

export function convertXyzToOklab(colorXYZ) {
    /* sources:
               https://bottosson.github.io/posts/gamutclipping/#oklab-to-linear-srgb-conversion
               https://bottosson.github.io/posts/oklab/#the-oklab-color-space
               https://www.w3.org/TR/css-color-4/#color-conversion-code
       matrices from (and slightly corrected):
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/oklab/__init__.py
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/okhsl.py
    */

    const colorLms = multiplyMatrices(XYZ_D65__to__LMS_Oklab, colorXYZ);
    const colorLms_3 = colorLms.map(c => Math.cbrt(c)); // LMS ** 1/3 - a non-linearity is applied
    let colorOklab = multiplyMatrices(LMS_3__to__OKLab, colorLms_3);
    // 1. limit result values to 15 digits after decimal point to not get calculation errors for values like
    // -6.938893903907228e-18 instead of zero (toPrecision output the same -6.938893903907228e-18 instead of zero)
    // 2. `+ 0` to make -0 to +0 (https://stackoverflow.com/questions/7223359/are-0-and-0-the-same)
    // convert -0 to 0 to not get 180 Hue instead of 0 in Oklch color,
    // because Math.atan2(0, -0) = Math.PI and Math.atan2(0, 0) = 0
    colorOklab = colorOklab.map(v => Number.parseFloat(v.toFixed(15)) + 0);

    return colorOklab;
}