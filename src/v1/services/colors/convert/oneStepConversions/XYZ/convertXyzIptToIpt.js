/**
 * Convert CIEXYZ for D65 defined IPT to IPT color space
 * D65 in IPT: with XYZ [0.9504, 1.0, 1.0889] (specified in IPT color space, slightly different from xy `0.31270, 0.32900` (D65 white point specified in Rec BT.2020)
 * @param {number[]} colorXYZIpt - Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 * @return {number[]} Array of IPT values: I as 0..1, P and T as -1 .. 1
 * I - intensity, P - protan, red-green (named from protanopia) chroma component, T - tritan, blue-yellow (named from tritanopia) chroma component
 */

import { LMS_P__to__IPT, XYZ_D65ipt__to__LMS_IPT } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';

export function convertXyzIptToIpt(colorXYZIpt) {
    /* sources:
                https://scholarworks.rit.edu/theses/2858/
                https://www.researchgate.net/publication/221677980_Development_and_Testing_of_a_Color_Space_IPT_with_Improved_Hue_Uniformity
       matrices from:
                https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ipt.py
                https://en.wikipedia.org/wiki/ICtCp#In_IPT
                https://github.com/colour-science/colour/blob/develop/colour/models/ipt.py
    */

    const colorLms = multiplyMatrices(XYZ_D65ipt__to__LMS_IPT, colorXYZIpt);
    // const colorLms_P = colorLms.map(c => c >=0 ? c ** 0.43 : (-1) * (-c) ** 0.43); // LMS ** 0.43 - a non-linearity is applied
    const colorLms_P = colorLms.map(c => Math.sign(c) * Math.abs(c) ** 0.43); // LMS ** 0.43 - a non-linearity is applied
    let colorIPT = multiplyMatrices(LMS_P__to__IPT, colorLms_P);

    // 1. limit result values to 15 digits after decimal point to not get calculation errors for values like
    // -6.938893903907228e-18 instead of zero (toPrecision output the same -6.938893903907228e-18 instead of zero)
    // 2. `+ 0` to make -0 to +0 (https://stackoverflow.com/questions/7223359/are-0-and-0-the-same)
    // convert -0 to 0 to not get 180 Hue instead of 0 in Oklch color,
    // because Math.atan2(0, -0) = Math.PI and Math.atan2(0, 0) = 0
    colorIPT = colorIPT.map(v => Number.parseFloat(v.toFixed(15)) + 0);

    return colorIPT;
}