// Convert linear sRGB to CIEXYZ

/**
 * Convert linear sRGB to CIEXYZ
 * @param {number[]} colorLinSRgb - Array of linear RGB values: r, g, b as 0..1 (red, green, blue components of the color)
 * @return {number[]} Array of CIEXYZ values: X, Y, Z as 0..1
 */

import { lin_sRGB__to__XYZ_D65 } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';
// import { multiplyMatrices } from '/js/colors/utils/multiplyMatrices.js';
// import { lin_sRGB__to__XYZ_D65 } from '/js/colors/matrices/colorMatrices.js';

export function convertLnSRgbToXyz(colorLinSRgb) {
    /*
       matrices from:
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/srgb_linear.py
    */

    const colorXYZ = multiplyMatrices(lin_sRGB__to__XYZ_D65, colorLinSRgb);

    return colorXYZ;
}