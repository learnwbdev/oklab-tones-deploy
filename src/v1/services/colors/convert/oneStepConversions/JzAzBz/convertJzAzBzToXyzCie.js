/**
 * Convert JzAzBz color space to CIE XYZ for D65 CIE 1931
 * XYZ D65 CIE 1931, xyY (Y = 1): (0.31271, 0.32902), https://www.efi-vutek.ru/data/uploads/files/Standardilluminant.pdf (p. 6)
 * @param {number[]} colorJzAzBz - Array of JzAzBz values: Jz (Lightness) as 0..1, Az (redness–greenness) and Bz (yellowness–blueness) as -1 .. 1
 * If isRelativeLightness = true - the data is not affected by scale transformations. False - for practical applications
 * @param {boolean} [isRelativeLightness = true] - calculate Jz as relative lightness instead of absolute lightness (as in the original article)
 * @param {number} [display_white_luminance = 1] - scaling of XYZ coordinates before convertion. BT.2048: media white Y=203 at PQ 58 (https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2408-3-2019-PDF-E.pdf, p28)
 * [display_white_luminance = 203] - for absolute lightness
 * [display_white_luminance = 1] - for relative lightness (because than display_white_luminance makes no difference to the output Jz)
 * @return {number[]} Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 *
 * Jzazbz determines absolute luminance, not relative luminance. (https://im.snibgo.com/jzazbz.htm)
 * A relative luminance is with respect to the maximum luminance an input device (such as a scanner or camera) can record,
 * or the maximum luminance an output device (such as a screen) can display.
 * So a relative luminance of 100% is the maximum a camera can record or a screen can display.
 * But Jzazbz is designed to accurately record absolute luminances.
 * For example, 100% in the Jz channel corresponds to a luminance of 10000 cd/m2, candelas per square metre.
*/

/* sources:
            https://observablehq.com/@jrus/jzazbz
            https://opg.optica.org/oe/fulltext.cfm?uri=oe-25-13-15131&id=368272

            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/jzazbz.py
            https://github.com/colour-science/colour/blob/develop/colour/models/jzazbz.py
*/

import { IzAzBz__to__LMS_P, LMS_JzAzBz__to__XYZabs_D65cie } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertJzAzBzToXyzCie(colorJzAzBz, {isRelativeLightness = true, display_white_luminance = 1} = {}) {
    const b = 1.15;
    const g = 0.66;

    // PQ Values (perceptual quantizer)
    const c1 = 3424 / (2 ** 12);
    const c2 = 2413 / (2 ** 7);
    const c3 = 2392 / (2 ** 7);
    // const n = 2610 / (2 ** 14);
    const ninv = (2 ** 14) / 2610; // n ** -1, 1 / n
    // const p = 1.7 * (2523 / (2 ** 5));
    const pinv = (2 ** 5) / (1.7 * 2523); // p ** -1, 1 / p
    const d = -0.56;
    // const d0 = 1.6295499532821566 * (10 ** (-11));
    const d0 = 1.6295499532821566E-11;

    const [Jz, Az, Bz] = colorJzAzBz;
    // Calculate Iz
    const Iz = (Jz + d0) / (1 + d - d * (Jz + d0));

    console.log("here",  Iz, Jz, Az, Bz);

    const colorIzAzBz = [Iz, Az, Bz];
    // Convert to LMS prime
    const colorLms_P = multiplyMatrices(IzAzBz__to__LMS_P, colorIzAzBz);

    // Decode PQ LMS to LMS
    const colorLms_F = colorLms_P.map(val => Math.pow(val, pinv) ); // power 1 / p

    // lms_mlp = 10 ** 4 in the original article
    const lms_mlp = isRelativeLightness ? display_white_luminance : 10 ** 4; // for relative or absolute lightness calculation, 10 ** 4 - maximum lightness for the "absolute lightness"
    const colorLms = colorLms_F.map(val => lms_mlp * Math.pow( (c1 - val) / (c3 * val - c2) , ninv )); // power 1 / n

    // Convert back to absolute XYZ D65
    const colorXYZabs = multiplyMatrices(LMS_JzAzBz__to__XYZabs_D65cie, colorLms);

    // Convert back to normal XYZ D65 (CIE 1931)
    const [Xabs, Yabs, Zabs] = colorXYZabs;
    let colorXYZCie = colorXYZabs;

    colorXYZCie[0] = ( Xabs + (b-1) * Zabs ) / b ; // X
    colorXYZCie[1] = ( Yabs + (g-1) * Xabs ) / g // Y
    // Z = Z abs

    // scale XYZ coordinates by `display_white_luminance`, because Jz is an absolute luminance (1 corresponds to a luminance of 10000 cd/m2)
    colorXYZCie = colorXYZCie.map(val => val / display_white_luminance);

    return colorXYZCie;
}