/**
 * Convert CIE XYZ for D65 CIE 1931 to OSA-UCS color space
 * XYZ D65 CIE 1931, xyY (Y = 1): (0.31271, 0.32902), https://www.efi-vutek.ru/data/uploads/files/Standardilluminant.pdf (p. 6)
 * @param {number[]} colorXYZCie - Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 * @return {number[]} Array of OSA-UCS values: L (Lightness) as ~ -10..8, j (jaune, yellowness–blueness) and g (green, redness–greenness) as ~ -26 .. 20 (could be more negative values)
 * jaune - yellow (in French)
 *
 * L = 0 - neutral gray (correspond to CIE Y = 30 or Lab L = 61.65)
 * L > 0 - lighter (brighter) shades than neutral gray
 * L < 0 - darker shades than neutral gray
 *
 * j > 0 - more yellowish color
 * j < 0 - more bluish color
 *
 * g > 0 - more greenish color
 * g < 0 - more pinkish color
 *
*/

/* sources:
            https://www.researchgate.net/publication/259253763_Comparison_of_the_performance_of_inverse_transformation_methods_from_OSA-UCS_to_CIEXYZ
            https://en.wikipedia.org/wiki/OSA-UCS#cite_note-4
            https://babelcolor.com/index_htm_files/AN-7%20The%20OSA%20UCS.pdf
*/

import { LXYZ_D65__to__RGB_OsaUcs } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertXyzCieToOsaUcs (colorXYZCie) {

    // neutral gray Y in CIE XYZ (Y ~= 30) - assigned L = 0 in OSA-UCS color space
    // should correspond to Lab gray color with L =  61.65, [61.65, 0, 0]
    // should correspond to Munsell N/6
    const Ygray = 30;

    const colorXYZCie_100 = colorXYZCie.map(val => val * 100); // scale from 1 to 100
    const [X, Y, Z] = colorXYZCie_100; // scaled from 1 to 100

    // calculate x and y chromaticity coordinates
    const [x, y] = [ X / (X + Y + Z), Y / (X + Y + Z) ];

    // calculate a factor representing the Helmholtz-Kohlrausch effect
    const K = 4.4934 * (x ** 2) + 4.3034 * (y ** 2) - 4.276 * x * y - 1.3744 * x - 2.5643 * y + 1.8103;
    // determine the modified luminous reflectance
    const Ym = K * Y; // Y0

    // calculate Lightness, modified Semmelroth formula (a compensation for the reference background lightness)
    const L_p_f1 = Math.cbrt(Ym) - (2.0/3.0);
    const L_p_f2 = 0.042 * Math.cbrt(Ym - Ygray);
    const L_p = 5.9 * ( L_p_f1 + L_p_f2 ); // L prime (dash)
    const L = (L_p - 14.3993) / Math.sqrt(2); // L (Lightness)

    // calculate chroma modification factor
    const C = 1 + ( L_p_f2 / L_p_f1 );

    // convert XYZ to RGB
    const colorRgb = multiplyMatrices(LXYZ_D65__to__RGB_OsaUcs, colorXYZCie_100);
    const [R, G, B] = colorRgb;

    // calculate a and b
    const a = -13.7 * Math.cbrt(R) + 17.7 * Math.cbrt(G) -   4 * Math.cbrt(B);
    const b =   1.7 * Math.cbrt(R) +    8 * Math.cbrt(G) - 9.7 * Math.cbrt(B);

    // calculate g and j
    const j = C * b; // j (jaune, yellowness–blueness)
    const g = C * a; // g (green, redness–greenness)

    const colorOsaUcs  = [L, j, g]; // L (Lightness), j (jaune, yellowness–blueness), g (green, redness–greenness)

    return colorOsaUcs;
}