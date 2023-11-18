/**
 * Convert CIEXYZ for D65 specified in Rec BT.2020 to CIEXYZ for D65 defined in IPT
 * D65 in IPT: with XYZ [0.9504, 1.0, 1.0889] (specified in IPT color space, slightly different from xy `0.31270, 0.32900` (D65 white point specified in Rec BT.2020)
 * @param {number[]} colorXYZIpt - Array of CIEXYZ values for D65 in IPT: X, Y, Z as 0..1 (Y - linear luminance)
 * @return {number[]} Array of CIEXYZ values for D65 in Rec BT.2020: X, Y, Z as 0..1 (Y - linear luminance)
*/

/* sources:
        http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
        (example from D50 to D65):
        https://www.w3.org/TR/css-color-4/#color-conversion-code
*/

import { XYZ_D65ipt__to__XYZ_D65 } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertXyzIptToXyz(colorXYZIpt) {

    const colorXYZ = multiplyMatrices(XYZ_D65ipt__to__XYZ_D65, colorXYZIpt);

    return colorXYZ;
}