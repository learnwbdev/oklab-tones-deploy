// Convert color spaces

/**
 * @param {number[] | string} colorOrg - original color to convert
 * @param {string} colorSpaceFrom - name of the color space the colorOrg is in
 * @param {string} colorSpaceTo - name of the color space to convert color to
 * @param {boolean} [isRound = true] - flag to round the converted color
 * @param {number} [mpPrcLnRgb = 5] as 0..17 (integer) - precision for r, g, b in linear RGB color (red, green and blue color components)
 * @param {number} [mpPrcL = 5] as 0..17 (integer)  - precision for Lightness in Oklch or Oklab color (digit after decimal point to round Lightness)
 * @param {number} [mpPrcC = 5] as 0..17 (integer)  - precision for Chroma in Oklch color (digit after decimal point to round Chroma)
 * @param {number} [mpPrcH = 2] as 0..17 (integer)  - precision for Hue in Oklch color (digit after decimal point to round Hue)
 * @param {number} [mpPrcAb = 5] as 0..17 (integer) - precision for *a and *b in Oklab (digit after decimal point to round *a, *b)
 * @param {number} [mpPrcSRgb = 0] as 0..17 (integer) - precision for r, g, b in sRGB color (red, green and blue color components)
 * @param {number} [mpPrcDspP3 = 4] as 0..17 (integer) - precision for r, g, b in Display P3 RGB color (red, green and blue color components)
 * @param {boolean} [isSimpleCalcCam16 = true] - flag to use default Viewing conditions (to not recalculate parameters) and to not calculate all values for CAM16 color
 * @return {number[] | string | undefined[]} converted color in colorSpaceTo
 */

import { findColorConvertionPath } from "./findColorConvertionPath.js";
import { convertColorFromTo } from "./convertColorFromTo.js";
import { roundColor } from "./roundColor.js";

export function convertColor(
  colorOrg,
  colorSpaceFrom,
  colorSpaceTo,
  {
    isRound = true,
    mpPrcLnRgb = 5,
    mpPrcL = 5,
    mpPrcC = 5,
    mpPrcH = 2,
    mpPrcAb = 5,
    mpPrcSRgb = 0,
    mpPrcDspP3 = 4,
    isSimpleCalcCam16 = true,
  } = {}
) {
  // return original color if color space From and To are the same
  if (colorSpaceFrom === colorSpaceTo) return colorOrg;

  // find path for the conversion of the color (an array / list of the color spaces for one-step conversion)
  const convertColorPathArr = findColorConvertionPath(
    colorSpaceFrom,
    colorSpaceTo
  );

  // console.log(convertColorPathArr);

  // path for conversion was not found
  if (convertColorPathArr === -1) {
    console.log(`convertColor: not found path for convertion from ${colorSpaceFrom} to ${colorSpaceTo}.\n
                        Color space should be one of these values ${convertColorPathArr}`);
    return [undefined, undefined, undefined];
  }

  let curColor = colorOrg; // current color for one-step convertion
  for (let i = 0; i < convertColorPathArr.length - 1; i++) {
    let curColorFrom = convertColorPathArr[i]; // current color From for one-step convertion
    let curColorTo = convertColorPathArr[i + 1]; // current color To for one-step convertion
    curColor = convertColorFromTo(curColor, curColorFrom, curColorTo, {
      isSimpleCalcCam16: isSimpleCalcCam16,
    }); // convert color by one-step convertion
    // console.log(curColor, curColorFrom, curColorTo);
  }

  // round converted color
  curColor = roundColor(curColor, colorSpaceTo, {
    isRound: isRound,
    mpPrcLnRgb: mpPrcLnRgb,
    mpPrcL: mpPrcL,
    mpPrcC: mpPrcC,
    mpPrcH: mpPrcH,
    mpPrcAb: mpPrcAb,
    mpPrcSRgb: mpPrcSRgb,
    mpPrcDspP3: mpPrcDspP3,
  });

  return curColor;
}
