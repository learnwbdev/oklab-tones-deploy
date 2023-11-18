/**
 * Convert CIE XYZ for D65 CIE 1931 to JzAzBz color space
 * XYZ D65 CIE 1931, xyY (Y = 1): (0.31271, 0.32902), https://www.efi-vutek.ru/data/uploads/files/Standardilluminant.pdf (p. 6)
 * @param {number[]} colorXYZCie - Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 * @param {boolean} [isRelativeLightness = true] - calculate Jz as relative lightness instead of absolute lightness (as in the original article)
 * If isRelativeLightness = true - the data is not affected by scale transformations. False - for practical applications
 * @param {number} [display_white_luminance = 1] - scaling of XYZ coordinates before convertion. BT.2048: media white Y=203 at PQ 58 (https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2408-3-2019-PDF-E.pdf, p28)
 * [display_white_luminance = 203] - for absolute lightness
 * [display_white_luminance = 1] - for relative lightness (because than display_white_luminance makes no difference to the output Jz)
 * @return {number[]} Array of JzAzBz values: Jz (Lightness) as 0..1, Az (redness–greenness) and Bz (yellowness–blueness) as -1 .. 1
 *
 * Jzazbz determines absolute luminance, not relative luminance. (https://im.snibgo.com/jzazbz.htm)
 * A relative luminance is with respect to the maximum luminance an input device (such as a scanner or camera) can record,
 * or the maximum luminance an output device (such as a screen) can display.
 * So a relative luminance of 100% is the maximum a camera can record or a screen can display.
 * But Jzazbz is designed to accurately record absolute luminances.
 * For example, 100% in the Jz channel corresponds to a luminance of 10000 cd/m2, candelas per square metre.
 *
 * https://www.researchgate.net/publication/282907873_Encoding_Color_Difference_Signals_for_High_Dynamic_Range_and_Wide_Gamut_Imagery (p 244)
 * instead of Y = 1 they used Y = 10000
*/

/* sources:
            https://observablehq.com/@jrus/jzazbz
            https://opg.optica.org/oe/fulltext.cfm?uri=oe-25-13-15131&id=368272

            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/jzazbz.py
            https://github.com/colour-science/colour/blob/develop/colour/models/jzazbz.py
*/

import { LMS_P__to__IzAzBz, XYZabs_D65cie__to__LMS_JzAzBz } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertXyzCieToJzAzBz(colorXYZCie, {isRelativeLightness = true, display_white_luminance = 1} = {}) {

    const b = 1.15;
    const g = 0.66;

    // PQ Values (perceptual quantizer)
    const c1 = 3424 / (2 ** 12);
    const c2 = 2413 / (2 ** 7);
    const c3 = 2392 / (2 ** 7);
    const n = 2610 / (2 ** 14);
    const p = 1.7 * (2523 / (2 ** 5));
    const d = -0.56;
    // const d0 = 1.6295499532821566 * (10 ** (-11));
    const d0 = 1.6295499532821566E-11;

    // Convert from XYZ D65 (CIE 1931) to an absolute XYZ D65
    // scale XYZ coordinates by `display_white_luminance`
    colorXYZCie = colorXYZCie.map(val => val * display_white_luminance);
    const [X, Y, Z] = colorXYZCie;
    let colorXYZabs = colorXYZCie;
    colorXYZabs[0] = b * X - ( (b-1) * Z ); // X abs
    colorXYZabs[1] = g * Y - ( (g-1) * X ); // Y abs
    // Z abs = Z

    // Convert to LMS
    const colorLms = multiplyMatrices(XYZabs_D65cie__to__LMS_JzAzBz, colorXYZabs);

    // PQ encode the LMS
    // / 10 ** 4 in the original article to make Jz as absolute lightness
    // / display_white_luminance - makes relative lightness
    // (denominator)
    const lms_denom = isRelativeLightness ? display_white_luminance : 10 ** 4; // for relative or absolute lightness calculation, 10 ** 4 - maximum lightness for the "absolute lightness"

    // const colorLms_F = colorLms.map(val => Math.pow( val/(10 ** 4), n) ); // factor to use in formula for colorLms_P
    // const colorLms_F = colorLms.map(val => Math.pow( val/display_white_luminance, n) ); // for relative lightness
    const colorLms_F = colorLms.map(val => Math.pow( val/lms_denom, n) ); // factor to use in formula for colorLms_P



    // Calculate Izazbz
    const colorLms_P = colorLms_F.map(val => Math.pow( (c1 + c2 * val) / (1 + c3 * val), p) );
    const colorIzAzBz = multiplyMatrices(LMS_P__to__IzAzBz, colorLms_P);

    const [Iz, Az, Bz] = colorIzAzBz;

    // Calculate Jz
    const Jz = ( ( (1 + d) * Iz ) / (1 + d * Iz) ) - d0;

    const colorJzAzBz = [Jz, Az, Bz];

    return colorJzAzBz;
}