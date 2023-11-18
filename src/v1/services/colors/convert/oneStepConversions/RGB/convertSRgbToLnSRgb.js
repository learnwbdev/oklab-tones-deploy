/**
 * Convert sRGB color to linear sRGB (gamma corrected)
 * @param {number[]} colorSRGB - Array of sRGB values: R as 0..1, G as 0..1 , B as 0..1
 * @return {number[]} Array of linear sRGB values: r as 0..1, g as 0..1, b as 0..1
 */

import { convertCompNonlinRgbToCompLinearRgb } from "./convertCompNonlinRgbToCompLinearRgb.js";

export function convertSRgbToLnSRgb(colorSRgb) {
    /* sources:
                https://bottosson.github.io/posts/colorwrong/#what-can-we-do%3F
                https://entropymine.com/imageworsener/srgbformula/
                https://github.com/w3c/wcag/issues/360#issuecomment-419199254    (about 0.04045)
    */

   const colorLinSRgb= colorSRgb.map(c => {
       c = c / 255;
       return convertCompNonlinRgbToCompLinearRgb(c);
     });

   return colorLinSRgb;
};