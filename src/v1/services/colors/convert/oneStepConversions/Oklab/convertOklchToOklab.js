// Convert OKlch color to Oklab

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
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4 (L - perceived Lightness, C - Chroma, H - Hue)
 * @return {number[]} Array of OKLab values: L as 0..1, a and b as -0.4 .. 0.4 (max Chroma)
 * (L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is)
 */

/*   sources:
                https://bottosson.github.io/posts/oklab/#the-oklab-color-space
                https://www.w3.org/TR/css-color-4/#color-conversion-code
*/

export function convertOklchToOklab(colorOklch) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const [L, C, H] = colorOklch; // L - perceived Lightness, C - Chroma, H - Hue

    // convert to Oklab
    const a = C * Math.cos(toRadians(H)); // *a - how green/red the color is
    const b = C * Math.sin(toRadians(H)); // *b - how blue/yellow the color is

    const colorOklab = [L, a, b];

    return colorOklab;
}