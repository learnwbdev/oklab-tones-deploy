// Convert CIEXYZ to linear sRGB

/**
 * Convert CIEXYZ to linear sRGB
 * @param {number[]} colorXYZ - Array of CIEXYZ values: X, Y, Z as 0..1
 * @return {number[]} Array of linear sRGB values: r, g, b as 0..1 (red, green, blue components of the color)
 */

import { XYZ_D65__to__lin_sRGB } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';
// import { multiplyMatrices } from '/js/colors/utils/multiplyMatrices.js';
// import { XYZ_D65__to__lin_sRGB } from '/js/colors/matrices/colorMatrices.js';

export function convertXyzToLnSRgb(colorXYZ) {
    /*
       matrices from:
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/srgb_linear.py
    */

    const colorLinSRgb = multiplyMatrices(XYZ_D65__to__lin_sRGB, colorXYZ);

    return colorLinSRgb;
}