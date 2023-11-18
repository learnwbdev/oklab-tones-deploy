/**
 * Convert linear display P3 (RGB, gamma corrected) to non-linear display P3 (RGB) - color in the result could be outside of the Display P3 gamut
 * @param {number[]} colorLinDspP3 - Array of linear display P3 RGB values: r, g, b as 0..1 (red, green, blue components of the color)
 * @return {number[]} Array of non-linear display P3 RGB values: r, g, b as 0..1 (red, green, blue components of the color)
 */

import { convertCompLinearRgbToCompNonlinRgb } from "./convertCompLinearRgbToCompNonlinRgb.js";

export function convertLnDspP3ToDspP3(colorLinDspP3) {
    /*
       matrices from:
               https://www.w3.org/TR/css-color-4/#color-conversion-code
               https://bottosson.github.io/posts/colorwrong/#what-can-we-do%3F
               https://entropymine.com/imageworsener/srgbformula/
    */

    const colorDspP3 = colorLinDspP3.map( c => convertCompLinearRgbToCompNonlinRgb(c) );
        // c < 0 ? 0 : c > 1 ? 1 : // not in Display P3 gamut, return clipped to 0 or 1
        //     convertCompLinearRgbToCompNonlinRgb(c);

    return colorDspP3;
}