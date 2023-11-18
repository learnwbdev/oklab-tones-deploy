// Convert OKlab color to Linear RGB

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
 * @param {number[]} colorOklab - Array of OKLab values: L as 0..1, a and b as -0.4 .. 0.4 (max Chroma) (L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is)
 * @return {number[]} Array of linear RGB values: r, g, b as 0..1 (could be outside of the sRGB gamut, that is < 0 or > 1) (r, g, b - red, green and blue color components)
 */

/*   sources:
                https://bottosson.github.io/posts/oklab/#the-oklab-color-space
                https://www.w3.org/TR/css-color-4/#color-conversion-code
*/

import { OKLab__to__LMS_3, LMS__to__lin_sRGB } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';

export function convertOklabToLnSRgb(colorOklab) {

    const colorLms_3 = multiplyMatrices(OKLab__to__LMS_3, colorOklab);
    const colorLms = colorLms_3.map(c => c ** 3); // LMS_3 ** 3
    const colorLinSRgb = multiplyMatrices(LMS__to__lin_sRGB, colorLms); // to linear RGB

    return colorLinSRgb;
  }