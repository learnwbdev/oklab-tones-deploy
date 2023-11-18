// Convert OKlab color to Oklch

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
 * @return {number[]} Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4 (L - perceived Lightness, C - Chroma, H - Hue)
 */

/*   sources:
                https://bottosson.github.io/posts/oklab/#the-oklab-color-space
                https://www.w3.org/TR/css-color-4/#color-conversion-code
*/

export function convertOklabToOklch(colorOklab) {
    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    const [L, a, b] = colorOklab; // perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is

    // convert to Oklch
    const C = Math.sqrt(a ** 2 + b ** 2) // Chroma
    let H = toDegrees(Math.atan2(b, a));
    H = H >= 0 ? H : H + 360; // Hue, in degrees [0 to 360)

    const colorOklch = [L, C, H]; // perceived Lightness, Chroma, Hue

    return colorOklch;
}