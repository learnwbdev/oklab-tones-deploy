/**
 * Convert non-linear display P3 color (RGB, gamma corrected) to linear display P3 color (RGB)
 * @param {number[]} colorDspP3 - Array of non-linear display P3 RGB values: r, g, b as 0..1 (red, green, blue components of the color)
 * @return {number[]} Array of linear display P3 RGB values: r, g, b as 0..1 (red, green, blue components of the color)
 */

import { convertCompNonlinRgbToCompLinearRgb } from "./convertCompNonlinRgbToCompLinearRgb.js";



export function convertDspP3ToLnDspP3(colorDspP3) {
    /*
       matrices from:
               https://www.w3.org/TR/css-color-4/#color-conversion-code
               https://bottosson.github.io/posts/colorwrong/#what-can-we-do%3F
               https://entropymine.com/imageworsener/srgbformula/
    */

    const colorLinDspP3 = colorDspP3.map( c => convertCompNonlinRgbToCompLinearRgb(c) );

    return colorLinDspP3;
}