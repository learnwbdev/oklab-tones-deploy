/**
 * Round color to specified precision
 * @param {number[] | string} colorOrg - original color to round up
 * @param {string} colorSpaceTo - name of the color space of the color colorOrg
 * @param {boolean} [isRound = true] - flag to round the converted color
 * @param {number} [mpPrcLnRgb = 5] as 0..17 (integer) - precision for r, g, b in linear RGB color (red, green and blue color components)
 * @param {number} [mpPrcL = 5] as 0..17 (integer)  - precision for Lightness in Oklch or Oklab color (digit after decimal point to round Lightness)
 * @param {number} [mpPrcC = 5] as 0..17 (integer)  - precision for Chroma in Oklch color (digit after decimal point to round Chroma)
 * @param {number} [mpPrcH = 2] as 0..17 (integer)  - precision for Hue in Oklch color (digit after decimal point to round Hue)
 * @param {number} [mpPrcAb = 5] as 0..17 (integer) - precision for *a and *b in Oklab (digit after decimal point to round *a, *b)
 * @param {number} [mpPrcSRgb = 0] as 0..17 (integer) - precision for r, g, b in sRGB color (red, green and blue color components)
 * @param {number} [mpPrcDspP3 = 4] as 0..17 (integer) - precision for r, g, b in Display P3 RGB color (red, green and blue color components)
 * @return {number[] | string | undefined[]} rounded color
 */

import { colorSpaces } from "./colorSpaces.js";
import { roundColorOklch } from "./rounding/roundColorOklch.js";
import { roundColorOklab } from "./rounding/roundColorOklab.js";
import { roundColorLnRgb } from "./rounding/roundColorLnRgb.js";
import { roundColorSRgb } from "./rounding/roundColorSRgb.js";
import { roundColorDspP3 } from "./rounding/roundColorDspP3.js";

export function roundColor(colorOrg, colorSpace, {isRound = true, mpPrcLnRgb = 5, mpPrcL = 5, mpPrcC = 5, mpPrcH = 2, mpPrcAb = 5, mpPrcSRgb = 0, mpPrcDspP3 = 4} = {}) {
    return !isRound ? colorOrg : // no need to round color values if isRound = false
        colorSpace === colorSpaces.Oklch      ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorSpace === colorSpaces.Oklab      ? roundColorOklab(colorOrg, {mpPrcL: mpPrcL, mpPrcAb: mpPrcAb}) :
        colorSpace === colorSpaces.sRgb       ? roundColorSRgb(colorOrg,  {mpPrcSRgb: mpPrcSRgb}) :
        colorSpace === colorSpaces.linSRgb    ? roundColorLnRgb(colorOrg, {mpPrcLnRgb: mpPrcLnRgb}) :
        colorSpace === colorSpaces.linDspP3   ? roundColorLnRgb(colorOrg, {mpPrcLnRgb: mpPrcLnRgb}) :
        colorSpace === colorSpaces.Lch        ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorSpace === colorSpaces.Lab        ? roundColorOklab(colorOrg, {mpPrcL: mpPrcL, mpPrcAb: mpPrcAb}) :
        colorSpace === colorSpaces.dispP3     ? roundColorDspP3(colorOrg, {mpPrcDspP3: mpPrcDspP3}) :
        colorSpace === colorSpaces.OklchGamma ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorSpace === colorSpaces.OklabGamma ? roundColorOklab(colorOrg, {mpPrcL: mpPrcL, mpPrcAb: mpPrcAb}) :
        colorSpace === colorSpaces.IPTch      ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorSpace === colorSpaces.IPT        ? roundColorOklab(colorOrg, {mpPrcL: mpPrcL, mpPrcAb: mpPrcAb}) :
        colorSpace === colorSpaces.JzCzHz     ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorSpace === colorSpaces.JzAzBz     ? roundColorOklab(colorOrg, {mpPrcL: mpPrcL, mpPrcAb: mpPrcAb}) :
        colorSpace === colorSpaces.CAM16      ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorSpace === colorSpaces.CAM16Ucs   ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorSpace === colorSpaces.ICtCp      ? roundColorOklab(colorOrg, {mpPrcL: mpPrcL, mpPrcAb: mpPrcAb}) :
        colorSpace === colorSpaces.ICtCpch    ? roundColorOklch(colorOrg, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH}) :
        colorOrg; // for other color spaces - no rounding
}