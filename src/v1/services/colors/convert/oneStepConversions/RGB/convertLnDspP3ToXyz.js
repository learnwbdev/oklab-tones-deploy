/**
 * Convert linear display P3 (RGB) to CIEXYZ
 * @param {number[]} colorLinDspP3 - Array of linear display P3 RGB values: r, g, b as 0..1 (red, green, blue components of the color)
 * @return {number[]} Array of CIEXYZ values: X, Y, Z as 0..1
 */

import { lin_Display_P3__to__XYZ_D65 } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';

export function convertLnDspP3ToXyz(colorLinDspP3) {
    /*
       matrices from:
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/display_p3_linear.py
    */

    const colorXYZ = multiplyMatrices(lin_Display_P3__to__XYZ_D65, colorLinDspP3);

    return colorXYZ;
}