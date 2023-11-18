/**
 * Convert linear SRGB to SRGB - color in the result could be outside of the sRGB gamut
 * @param {number[]} colorLinSRgb - Array of linear RGB values: r as 0..1, g as 0..1, b as 0..1
 * @return {number[]} Array of sRGB values: R as 0..1, G as 0..1 , B as 0..1
 */

import { convertCompLinearRgbToCompNonlinRgb } from "./convertCompLinearRgbToCompNonlinRgb.js";

export function convertLnSRgbToSRgb(colorLinSRgb) {
    /* sources:
                https://bottosson.github.io/posts/colorwrong/#what-can-we-do%3F
                https://entropymine.com/imageworsener/srgbformula/
    */

   const colorSRgb = colorLinSRgb.map(c => {
            // c = ( c < 0 || c > 1 ) ? c : // not in sRGB gamut, return as it is
            //     convertCompLinearRgbToCompNonlinRgb(c);
            // c =  c < 0 ? 0 : c > 1 ? 1 : // not in sRGB gamut, return clipped to 0 or 1
            //     convertCompLinearRgbToCompNonlinRgb(c);

            c = convertCompLinearRgbToCompNonlinRgb(c);
            return c * 255;
          });

   return colorSRgb;
 };