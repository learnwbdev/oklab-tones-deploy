/**
 * Convert CIEXYZ to linear display P3 (RGB)
 * @param {number[]} colorXYZ - Array of CIEXYZ values: X, Y, Z as 0..1
 * @return {number[]} Array of linear display P3 (RGB) values: r, g, b as 0..1 (red, green, blue components of the color)
 */

import { XYZ_D65__to__lin_Display_P3 } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';

export function convertXyzToLnDspP3(colorXYZ) {
    /*
       matrices from:
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/display_p3_linear.py
    */

    const colorLinDspP3 = multiplyMatrices(XYZ_D65__to__lin_Display_P3, colorXYZ);

    return colorLinDspP3;
}