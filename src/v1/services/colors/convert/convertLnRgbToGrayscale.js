/**
 * Convert linear RGB color to linear RGB grayscale color
 * @param {*} colorLinRgb - Array of linear RGB values: r, g, b as 0..1 (red, green, blue components of the color)
 * @return Array of linear RGB values: r, g, b as 0..1 (red, green, blue components of the color) r = g = b for grayscale color
 */

import { lin_sRGB__to__XYZ_D65 } from "../matrices/colorMatrices.js";
import { multiplyMatrices } from "../utils/multiplyMatrices.js";

export function convertLnRgbToGrayscale(colorLinRGB) {

    // compute gray component for linear RGB color: ~ 0.2126*Red_lin + 0.7152*Green_lin + 0.0722*Blue_lin
    // Y in CIEXYZ color is the luminance, so we calculate Y
    // `[ lin_Ygray ]` because `multiplyMatrices` returns array of one value
    const [ lin_Ygray ] = multiplyMatrices(lin_sRGB__to__XYZ_D65[1], colorLinRGB);

    const colorLinRGBGray = [lin_Ygray, lin_Ygray, lin_Ygray];

    return colorLinRGBGray;
}