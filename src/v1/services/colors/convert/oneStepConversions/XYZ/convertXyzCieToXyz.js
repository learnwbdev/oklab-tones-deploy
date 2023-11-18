/**
 * Convert CIEXYZ for D65 CIE 1931 to CIEXYZ for D65 specified in Rec BT.2020
 * XYZ D65 CIE 1931, xyY (Y = 1): (0.31272, 0.32903)
 * Rec BT.2020,      xyY (Y = 1): (0.31270, 0.32900)
 * @param {number[]} colorXYZCie - Array of CIEXYZ values for D65 CIE 1931: X, Y, Z as 0..1 (Y - linear luminance)
 * @return {number[]} Array of CIEXYZ values for D65 in Rec BT.2020: X, Y, Z as 0..1 (Y - linear luminance)
*/

/* sources:
        http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
        (example from D50 to D65):
        https://www.w3.org/TR/css-color-4/#color-conversion-code
*/

import { XYZ_D65cie__to__XYZ_D65 } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertXyzCieToXyz(colorXYZCie) {

    const colorXYZ = multiplyMatrices(XYZ_D65cie__to__XYZ_D65, colorXYZCie);

    return colorXYZ;
}