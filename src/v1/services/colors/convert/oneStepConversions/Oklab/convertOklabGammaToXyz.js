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


/**
 * Convert OKlab color (with gamma power instead of 1/3) to CIEXYZ
 * @param {number[]} colorOklab - Array of OKLab values: L as 0..1, a and b as -0.4..0.4 (L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is)
 * @return {number[]} Array of CIEXYZ values: X, Y, Z as 0..1
 */

/*   sources:
                https://bottosson.github.io/posts/oklab/#the-oklab-color-space
                https://www.w3.org/TR/css-color-4/#color-conversion-code
                https://bottosson.github.io/posts/oklab/#how-oklab-was-derived
*/

import { OKLab__to__LMS_3, LMS_Oklab__to__XYZ_D65 } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';

export function convertOklabGammaToXyz(colorOklab) {

    const gamma = 0.323; //  γ for Oklab, from https://bottosson.github.io/posts/oklab/#how-oklab-was-derived
    const colorLms_3 = multiplyMatrices(OKLab__to__LMS_3, colorOklab);
    const colorLms = colorLms_3.map(c => c ** (1 / gamma)); // in final Oklab: LMS_3 ** 3
    const colorXYZ = multiplyMatrices(LMS_Oklab__to__XYZ_D65, colorLms); // to CIEXYZ

    return colorXYZ;
  }