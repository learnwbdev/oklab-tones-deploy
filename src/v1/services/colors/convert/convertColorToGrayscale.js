/**
 * Convert color from colorSpaceFrom to grayscale color in colorSpaceTo
 * @param {number[] | string} colorOrg - original color to convert
 * @param {string} colorSpaceFrom - name of the color space the colorOrg is in
 * @param {string} colorSpaceTo - name of the color space to convert color to
 * @param {boolean} [isCalcApprox = false] - flag to calculate gray color approximately by [0.2126, 0.7152, 0.0722] in Ylin = 0.2126*Rlin + 0.7152*Glin + 0.0722*Blin instead of values in the 2nd row of the matrix lin_sRGB__to__XYZ_D65[1]
 * @param {boolean} [isRound = true] - flag to round the converted color
 * @param {number} [mpPrcLnRgb = 5] as 0..17 (integer) - precision for r, g, b in linear RGB color (red, green and blue color components)
 * @param {number} [mpPrcL = 5] as 0..17 (integer)  - precision for Lightness in Oklch or Oklab color (digit after decimal point to round Lightness)
 * @param {number} [mpPrcC = 5] as 0..17 (integer)  - precision for Chroma in Oklch color (digit after decimal point to round Chroma)
 * @param {number} [mpPrcH = 2] as 0..17 (integer)  - precision for Hue in Oklch color (digit after decimal point to round Hue)
 * @param {number} [mpPrcAb = 5] as 0..17 (integer) - precision for *a and *b in Oklab (digit after decimal point to round *a, *b)
 * @return Array of color values or Hex string
 */

import { lin_sRGB__to__XYZ_D65 } from "../matrices/colorMatrices.js";
import { multiplyMatrices } from "../utils/multiplyMatrices.js";
import { colorSpaces } from "./colorSpaces.js";
import { convertColor } from "./convertColor.js";

export function convertColorToGrayscale(
  colorOrg,
  colorSpaceFrom = colorSpaces.linSRgb,
  colorSpaceTo = colorSpaces.Hex,
  {
    isCalcApprox = false,
    isRound = true,
    mpPrcLnRgb = 5,
    mpPrcL = 5,
    mpPrcC = 5,
    mpPrcH = 2,
    mpPrcAb = 5,
  } = {}
) {
  // compute gray component for linear RGB color: ~ 0.2126*Red_lin + 0.7152*Green_lin + 0.0722*Blue_lin
  // Y in CIEXYZ color is the luminance, so we calculate Y
  // `[ lin_Ygray ]` because `multiplyMatrices` returns array of one value
  const colorLinRGB = convertColor(
    colorOrg,
    colorSpaceFrom,
    colorSpaces.linSRgb,
    { isRound: false }
  );

  const arrCoeff = isCalcApprox
    ? [0.2126, 0.7152, 0.0722]
    : lin_sRGB__to__XYZ_D65[1]; // coefficients for r, g, b (approximate or from the matrix)
  const [lin_Ygray] = multiplyMatrices(arrCoeff, colorLinRGB);

  const colorLinRGBGray = [lin_Ygray, lin_Ygray, lin_Ygray];
  const curColor = convertColor(
    colorLinRGBGray,
    colorSpaces.linSRgb,
    colorSpaceTo,
    {
      isRound: isRound,
      mpPrcLnRgb: mpPrcLnRgb,
      mpPrcL: mpPrcL,
      mpPrcC: mpPrcC,
      mpPrcH: mpPrcH,
      mpPrcAb: mpPrcAb,
    }
  );

  return curColor;
}
