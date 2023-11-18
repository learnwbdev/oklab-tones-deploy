/**
 * Convert ICtCp color space to CIE XYZ for D65 CIE 1931
 * XYZ D65 CIE 1931, xyY (Y = 1): (0.31271, 0.32902), https://www.efi-vutek.ru/data/uploads/files/Standardilluminant.pdf (p. 6)
 * @param {number[]} colorXYZCie - Array of ICtCp values: I (Intensity) as 0..1, Ct and Cp as -1 .. 1 (or -0.5..0.5)
 * Ct - tritan, blue-yellow, Cp - protan, red-green (named from protanopia) chroma component
 * @param {boolean} [isRelativeLightness = true] - calculate I as relative lightness instead of absolute lightness (as in the original article).
 * If isRelativeLightness = true - the data is not affected by scale transformations. False - for practical applications
 * @param {number} [display_white_luminance = 1] - scaling of XYZ coordinates before convertion. BT.2048: media white Y=203 at PQ 58 (https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2408-3-2019-PDF-E.pdf, p28)
 * [display_white_luminance = 203] - for absolute lightness, when `isRelativeLightness` = false
 * [display_white_luminance = 1] - for relative lightness (because than display_white_luminance makes no difference to the output Jz)
 * @return {number[]} Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 *
*/

/* sources:
            https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf
            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ictcp.py
            https://en.wikipedia.org/wiki/ICtCp
*/

import { ICtCp__to__LMS_P, LMS_ICtCp__to__XYZ_D65cie } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertICtCpToXyzCie (colorICtCp, {isRelativeLightness = true, display_white_luminance = 1} = {}) {

    // PQ Values (perceptual quantizer)
    // const m1 = 2610 / (2 ** 14);     // n in JzAzBz
    const m1inv = (2 ** 14) / 2610;  // 1 / m1
    // const m2 = 2523 / (2 ** 5);      // p in JzAzBz, only p = 1.7 * m2
    const m2inv = (2 ** 5) / 2523;   // 1 / m2

    const c1 =  107 / (2 ** 7);  // 3424 / 2 ** 12, c1 = c3 - c2 + 1
    const c2 = 2413 / (2 ** 7);  // 32 * (2413 / 2 ** 12),
    const c3 = 2392 / (2 ** 7);  // 32 * (2392 / 2 ** 12), 2 ** 12 = 4096

    const colorLms_P = multiplyMatrices(ICtCp__to__LMS_P, colorICtCp);

    // Decode PQ LMS to LMS
    const colorLms_F = colorLms_P.map(val => Math.pow(val, m2inv) ); // power 1 / m2

    // lms_mlp = 10 ** 4 in the original, but Y should be normalized to [0, 1]
    const lms_mlp = isRelativeLightness ? display_white_luminance : 10 ** 4; // for relative or absolute lightness calculation, 10 ** 4 - maximum lightness for the "absolute lightness"
    const colorLms = colorLms_F.map(val => lms_mlp * Math.pow( (c1 - val) / (c3 * val - c2) , m1inv )); // power 1 / m1

    let colorXYZCie = multiplyMatrices(LMS_ICtCp__to__XYZ_D65cie, colorLms);

    // scale XYZ coordinates by `display_white_luminance`, because I could be an absolute luminance (1 corresponds to a luminance of 10000 cd/m2)
    colorXYZCie = colorXYZCie.map(val => val / display_white_luminance);

    return colorXYZCie;
}