/**
 * Convert CIE XYZ for D65 CIE 1931 to ICtCp color space
 * XYZ D65 CIE 1931, xyY (Y = 1): (0.31271, 0.32902), https://www.efi-vutek.ru/data/uploads/files/Standardilluminant.pdf (p. 6)
 * @param {number[]} colorXYZCie - Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 * @param {boolean} [isRelativeLightness = true] - calculate I as relative lightness instead of absolute lightness (as in the original article)
 * If isRelativeLightness = true - the data is not affected by scale transformations. False - for practical applications
 * @param {number} [display_white_luminance = 1] - scaling of XYZ coordinates before convertion. BT.2048: media white Y=203 at PQ 58 (https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2408-3-2019-PDF-E.pdf, p28)
 * [display_white_luminance = 203] - for absolute lightness, when `isRelativeLightness` = false
 * [display_white_luminance = 1] - for relative lightness (because than display_white_luminance makes no difference to the output Jz)
 * @return {number[]} Array of ICtCp values: I (Intensity) as 0..1, Ct and Cp as -1 .. 1 (or -0.5..0.5)
 * Ct - tritan, blue-yellow, Cp - protan, red-green (named from protanopia) chroma component
 *
 * https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf (p5)
 * in PQ Y = Fd / (10 ** 4), where Y - the normalized linear displayed value, in the range [0:1],
 * where Fd is the luminance of the linear component {L, M, S} in cd/m2
 * (with Y = 1 representing the peak luminance of 10000 cd/m2 (peak white))
 * for the luminance of a color cube of BT.2020 colors from 0.005 cd/m2 to 10000 cd/m2
 * as we use XYZ already normalized to [0, 1], so
 * Y = Fd (if we don't want absolute luminance to the maximum of 10000 cd/m2)
 * https://www.researchgate.net/publication/282907873_Encoding_Color_Difference_Signals_for_High_Dynamic_Range_and_Wide_Gamut_Imagery (p 244)
 * instead of Y = 1 they used Y = 10000
 *
*/

/* sources:
            https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf
            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ictcp.py
            https://en.wikipedia.org/wiki/ICtCp
*/

import { LMS_P__to__ICtCp, XYZ_D65cie__to__LMS_ICtCp } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertXyzCieToICtCp (colorXYZCie, {isRelativeLightness = true, display_white_luminance = 1} = {}) {

    // PQ Values (perceptual quantizer)
    const m1 = 2610 / (2 ** 14);  // n in JzAzBz
    const m2 = 2523 / (2 ** 5);  // p in JzAzBz, only p = 1.7 * m2

    const c1 =  107 / (2 ** 7);  // 3424 / 2 ** 12, c1 = c3 - c2 + 1
    const c2 = 2413 / (2 ** 7);  // 32 * (2413 / 2 ** 12),
    const c3 = 2392 / (2 ** 7);  // 32 * (2392 / 2 ** 12), 2 ** 12 = 4096

    // scale XYZ coordinates by `display_white_luminance`
    colorXYZCie = colorXYZCie.map(val => val * display_white_luminance);

    // Calculate LMS
    const colorLms = multiplyMatrices(XYZ_D65cie__to__LMS_ICtCp, colorXYZCie);

    // Applying the Non-Linearity
    // Apply ST 2084 [2] non-linearity: SMPTE ST 2084 defines an EOTF (PQ) designed to
    // match the contrast sensitivity function of the human visual system
    // https://en.wikipedia.org/wiki/Perceptual_quantizer
    // https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf (p5)

    // in PQ Y = Fd / (10 ** 4), where Y - the normalized linear displayed value, in the range [0:1]
    // (with Y = 1 representing the peak luminance of 10000 cd/m2)
    // XYZ is already normalized to 1, so if we don't want absolute lightness to maximum of 10000 cd/m2
    // we should not divide by 10 ** 4

    // / 10 ** 4 in the original color space, but in PQ it's mentioned that Y should be [0, 1]
    // / display_white_luminance - makes relative lightness
    // (denominator)
    const lms_denom = isRelativeLightness ? display_white_luminance : 10 ** 4; // for relative or absolute lightness calculation, 10 ** 4 - maximum lightness for the "absolute lightness"

    // const colorLms_F = colorLms.map(val => Math.pow( val/(10 ** 4), n) ); // factor to use in formula for colorLms_P
    // const colorLms_F = colorLms.map(val => Math.pow( val/display_white_luminance, n) ); // for relative lightness
    const colorLms_F = colorLms.map(val => Math.pow( val/lms_denom, m1) ); // factor to use in formula for colorLms_P

    const colorLms_P = colorLms_F.map(val => Math.pow( (c1 + c2 * val) / (1 + c3 * val), m2) );

    // Calculate ICtCp
    const colorICtCp = multiplyMatrices(LMS_P__to__ICtCp, colorLms_P);

    return colorICtCp;
}