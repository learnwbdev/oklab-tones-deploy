// Calculate Relative Luminance (Y in XYZ color space for D65 white point)
/**
 * @param {number[] | string} colorOrg - original color to convert. For example, Array of sRGB values: R as 0..1, G as 0..1 , B as 0..1
 * @param {string} colorSpaceFrom - name of the color space the colorOrg is in
 * @param {boolean} [isCalcApprox = true] - flag to calculate relative luminance by [0.2126, 0.7152, 0.0722] in Ylin = 0.2126*Rlin + 0.7152*Glin + 0.0722*Blin instead of values in the 2nd row of the matrix lin_sRGB__to__XYZ_D65[1]
 * @param {number} [mpPrcRL = 2] as 0..17 (integer)  - precision for Relatice Luminance (digit after decimal point to round Relative luminance)
 * @return {number} Relative Luminance as 0..1 (= Y from XYZ color space for D65 white point)
*/

/* source:
            https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
*/

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";
import { lin_sRGB__to__XYZ_D65 } from "../matrices/colorMatrices.js";
import { multiplyMatrices } from "../utils/multiplyMatrices.js";

export function calcRelLuminanceRGB(colorOrg, colorSpaceFrom = colorSpaces.sRgb, {isCalcApprox = true, mpPrcRL = 2} = {}) {
    const prcRL = 10 ** mpPrcRL; // precision for the relative luminance

    // convert colorOrg to linear RGB
    const colorLinRGB = convertColor(colorOrg, colorSpaceFrom, colorSpaces.linSRgb, { isRound: false });
    const arrCoeff = isCalcApprox ? [0.2126, 0.7152, 0.0722] : lin_sRGB__to__XYZ_D65[1]; // coefficients for r, g, b (approximate or from the matrix)

    // Y in CIEXYZ color is the luminance, so we calculate Y
    // `[ relLuminance ]` because `multiplyMatrices` returns array of one value
    const [ relLuminance ] = multiplyMatrices(arrCoeff, colorLinRGB);

    return Math.round((relLuminance + Number.EPSILON) * prcRL) / prcRL + 0;
}