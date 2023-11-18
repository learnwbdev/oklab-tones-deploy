/**
 * Check if color from colorSpaceFrom is in gamut of color space colorSpaceGamut (for now only for sRGB and Display P3)
 * @param {number[] | string} colorOrg - Array of Color values or Hex string for a color
 * @param {string} colorSpaceFrom - name of the color space the colorOrg is in
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to check the gamut of
 * @return {boolean} isInGamut: true - given color is inside gamut color space colorSpaceGamut
 */

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";

export function checkColorInGamut(colorOrg, colorSpaceFrom = colorSpaces.Oklch, colorSpaceGamut = colorSpaces.sRgb ) {
  // return linear RGB, because to check if the color is inside sRGB gamut or Display P3,
  // there is no need to convert to non-linear RGB, boundaries should be [0, 1]
  let colorSpaceCheckIn = [colorSpaces.sRgb, colorSpaces.linSRgb].includes(colorSpaceGamut) ? colorSpaces.linSRgb :
                     [colorSpaces.dispP3, colorSpaces.linDspP3].includes(colorSpaceGamut) ? colorSpaces.linDspP3 :
                     undefined;

  if ( typeof colorSpaceCheckIn === "undefined" ) {
    console.log(`checkColorInGamut: unsupported Color Space to check the gamut in, ${colorSpaceGamut}.\n
                 Supported: ${colorSpaces.sRgb}, ${colorSpaces.linSRgb}, ${colorSpaces.dispP3}, ${colorSpaces.linDspP3}`);
    return undefined;
  };

  let colorLnRgb = convertColor(colorOrg, colorSpaceFrom, colorSpaceCheckIn, {isRound: false});
  let isInGamut = !colorLnRgb.some(c => (c < 0) || (c > 1))
  return isInGamut;
}