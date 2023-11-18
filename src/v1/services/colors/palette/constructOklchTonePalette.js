// Construct Oklch Tone Palette for a given color (default: Hex color)
/**
 * @param {string}   colorOrg - color to make tone palette for
 * @param {string}   [colorSpaceFrom = "Hex"] - name of the color space the colorOrg is in
 * @param {string}   [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @param {number}   [tgtHueIpt = -1] as 0..360 (360 excluded),  -1 if not defined - target Hue in IPT color space (colors in tone palette corrected to the given Hue, if the color is still in gamut). If -1 - not defined, it will be found from colorOrg
 * @param {number}   [tgtChromaCam16 = -1] as 0..150..(unbound), -1 if not defined - target Chroma in CAM16 color space (colors in tone palette corrected to the given Chroma, if the color is still in gamut). If -1 - not defined, it will be found from colorOrg
 * @param {boolean}  [isDeltaE2000 = true] - flag to use DeltaE2000 instead of DeltaEOk to find color difference between two colors (to find Maximum Chroma for a given color)
 * @param {boolean}  [isFindMaxChroma = true] - flag to find maximum Chroma for the original Color that gives similar color (to compensate possible gamut clipping of the Chroma)
 * @param {number}   [mpPrcL = 5] as 0..17 (integer)  - precision for Lightness in Oklch or Oklab color (digit after decimal point to round Lightness)
 * @param {number}   [mpPrcC = 5] as 0..17 (integer)  - precision for Chroma in Oklch color (digit after decimal point to round Chroma)
 * @param {number}   [mpPrcH = 2] as 0..17 (integer)  - precision for Hue in Oklch color (digit after decimal point to round Hue)
 * @param {number[]} [tones = [0, 1, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100]] - Array of tones to construct Tone Palette
 * @param {string}   [colorSpaceRgbOut = colorSpaces.sRgb] - format of the output color in RGB color space. Default: sRgb. Could be: Hex or sRgb.
 * @param {boolean}  [isLog = false] - flag to write log in console
 * @return {Object[]} Array of Objects of colorOklch for the Tone Palette in format 'tone': colorOklch
 */

/*
  1. convert Hex color to Oklch -> colorOklch
  2. colorOklch is in sRGB gamut, so it's Chroma is probably clipped to Gamut
     So we find maximum Chroma for `colorOklch` in Oklch space, when there is no noticeable difference between
     a given color and a new color with maximum Chroma (jnd < 0.002) -> maxChroma
     We consider colorOklch with changed chroma to `maxChroma` - is a given color in Oklch space without clipped Chroma
  3. To make tone palette in Oklch space we don't change Hue and Chroma of the color,
     only change Lightness. But when color is clipped to sRGB gamut Chroma would be clipped and Hue could be changed.
     So in result tone palette will have colors with different Chroma because of the gamut (For example, in sRGB gamut).
     But ideally in tone palette only lightness is changed.
     So for a given `tones` (HCT tones or round up Lab value), we find corresponding Lightness in Oklch color space.
     and construct array `colorOklchTones` with the found Lightness, maximum (for similar color) Chroma and original Hue.
     Construct tone palette with: -> colorOklchTones
     Lightness corresponding to the given HCT tones
     Chroma = `maxChroma` (from step 2)
     Hue = original Hue from a given color (converted to Oklch space, from step 1)
  4. Find target Hue in IPT color space (convert original color to IPT), if target IPT Hue is not given (tgtHueIpt === -1)
  5. Find target Chroma in CAM16 color space (convert original color to CAM16 in default viewing conditions),
     if target CAM16 Chroma is not given (tgtChromaCam16 === -1)
  6. For each color in `colorOklchTones`:
     6.1. Save original L of the color (to correct to the corresponding gray Oklch color later, [L, 0, 0]),
          because for Oklch color [L, C, H] gray color maybe different from color [L, 0, 0]
     6.2. Correct L to the new L that corresponds to the gray color [L, 0, 0]
          and clip Chroma to tha gamut
     6.3. Correct Hue to the target IPT Hue (tgtHueIpt)
     6.4. Correct Chroma to the target CAM16 Chroma (tgtChromaCam16)
     6.5. (again) Correct L to the new L that corresponds to the gray color [L, 0, 0]
          and clip Chroma to tha gamut
          for the new color with corrected Hue and Chroma
     6.6. repeat steps 6.3. -- 6.5.
  7. Convert `colorOklchTonesInGamut` tone palette to Hex colors -> colorHexTones
*/

import { convertLabLightnToOklabLightn } from "../tones/convertLabLightnToOklabLightn.js";
import { findMaxChroma } from "../tones/findMaxChroma.js";
import { convertColor } from "../convert/convertColor.js";
import { colorSpaces } from "../convert/colorSpaces.js";
import { roundColor } from "../convert/roundColor.js";
import { fitOklchChromaToGamutCorrectLToGray } from "../gamutMapping/fitOklchChromaToGamutCorrectLToGray.js";
import { correctOklchChromaToCCam16 } from "../tones/correctOklchChromaToCCam16.js";
import { correctOklchHueToGivenHueIPT } from "../tones/correctOklchHueToGivenHueIPT.js";
import { checkColorInGamut } from "../gamutMapping/checkColorInGamut.js";

export function constructOklchTonePalette(colorOrg, {colorSpaceFrom = colorSpaces.Hex, colorSpaceGamut = colorSpaces.sRgb,
   tgtHueIpt = -1, tgtChromaCam16 = -1, isDeltaE2000 = true, isFindMaxChroma = true, mpPrcL = 5, mpPrcC = 5, mpPrcH = 2,
   tones = [0, 1, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100],
   colorSpaceRgbOut = colorSpaces.sRgb, isLog = false } = {}) {

   // round number `num` to the decimal point `mpPrc`
   const rndTo = (num, mpPrc) => {
      const prc = 10 ** mpPrc;
      return Math.round((num + Number.EPSILON) * prc) / prc + 0;
   }

   // convert colorOrg to colorOklch (with default rounding)
   let colorOklch = convertColor(colorOrg, colorSpaceFrom, colorSpaces.Oklch, {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH});

   // find maximum Chroma for colorOklch (in Oklch color space, not in sRGB gamut) to level out Chroma clipping to gamut of the original color
   // with jnd < 0.002 (for deltaEOk) between original colorOklch and new color with maximum Chroma
   // jnd - just noticeable difference between colors
   if (isFindMaxChroma) {
      const maxChroma = findMaxChroma(colorOklch, colorSpaceGamut, {isDeltaE2000: isDeltaE2000, mpPrcC: mpPrcC});
      colorOklch[1] = maxChroma; // change Chroma to maximum Chroma in the original color
   }

   // construct Oklch colors: lightness for HCT tone (Lab L converted to Oklch L), `maxChroma`, original Hue from `colorOklch`
   let colorOklchTones = tones.map(tone => (tone === 0)   ? [tone, [0, 0, 0]] : // black color
                                           (tone === 100) ? [tone, [1, 0, 0]] : // white color
                                   [tone, roundColor([convertLabLightnToOklabLightn(tone), ...colorOklch.slice(1)], colorSpaces.Oklch,
                                          {mpPrcL: mpPrcL, mpPrcC: mpPrcC, mpPrcH: mpPrcH})
                                    ]);

   // Find target IPT Hue from Oklch color, if target IPT Hue is not given (given if !== -1)
   tgtHueIpt = (tgtHueIpt !== -1) ? tgtHueIpt : convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.IPTch, {isRound: false})[2]; // IPT Hue for the Oklch color
   // Find target CAM16 Chroma from Oklch color, if target CAM16 Chroma is not given (given if !== -1)
   tgtChromaCam16 = (tgtChromaCam16 !== -1) ? tgtChromaCam16 : convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.CAM16, {isRound: false})[1]; // CAM16 Chroma for the Oklch color

   colorOklchTones = colorOklchTones.map(( [tone, color] ) => {
      if (tone === 0)   return [tone, [0, 0, 0]]; // black color
      if (tone === 100) return [tone, [1, 0, 0]]; // white color

      // save original Lightness of the color, color = [L, C, H]
      let [origL] = color;
      // correct L to L of the corresponding gray color [L, 0, 0] and clip Chroma to gamut
      let color_new = fitOklchChromaToGamutCorrectLToGray(color, colorSpaceGamut, {mpPrcL: mpPrcL, mpPrcC: mpPrcC}); // correct L and C

      // for (let i = 0; i < 2; i++) // repeat 2 or more times
      {
         // correct Hue to the target IPT Hue
         color_new = correctOklchHueToGivenHueIPT(color_new, tgtHueIpt, {mpPrcH: mpPrcH});

         if (isLog) console.log('==============================')
         if (isLog) console.log("aft Cor Hue: ", color_new, "Tone: ", tone);

         // correct Chroma to CAM16 Chroma
         color_new = correctOklchChromaToCCam16(color_new, tgtChromaCam16, {mpPrcC: mpPrcC});

         if (isLog) console.log("aft Cor Chr: ", color_new, "Tgt Chr: ", tgtChromaCam16);

         // (correct L and C again, with corrected Hue and Chroma) correct L to L of the corresponding gray color [L, 0, 0] and clip Chroma to gamut
         color_new = fitOklchChromaToGamutCorrectLToGray(color_new, colorSpaceGamut, {targetL: origL, mpPrcL: mpPrcL, mpPrcC: mpPrcC});

         if (isLog) console.log("aft Cor L&C: ", color_new, "Tgt L Gray: ", origL);
      }
      return [tone, color_new];
   });

   // convert colors Oklch to Hex
   // const colorHexTones = colorOklchTones.map(toneArr => [toneArr[0], convertColor(toneArr[1], colorSpaces.Oklch, colorSpaces.Hex)]);

   // // convert colors Oklch to Hex
   // // before convertion round Chroma to 3 digits after decimal point, if the color still stays in Gamut
   // const colorHexTones = colorOklchTones.map(([tone, [L, C, H]]) => {
   //    let colorOklchRndC = [L, rndTo(C, 3), H];
   //    // change color to color with round up chroma if the color is still in Gamut and round Chroma is bigger than original Chroma
   //    let colorOklch = (rndTo(C, 3) > C) && checkColorInGamut(colorOklchRndC, colorSpaces.Oklch, colorSpaceGamut)
   //                      ? colorOklchRndC : [L, C, H];
   //    let colorHex = convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.Hex);
   //    return [tone, colorHex];
   // });

   // convert colors Oklch to Rgb color space in format `colorSpaceRgbOut`
   // before convertion round Chroma to 3 digits after decimal point, if the color still stays in Gamut
   const colorRgbTones = colorOklchTones.map(([tone, [L, C, H]]) => {
      let colorOklchRndC = [L, rndTo(C, 3), H];
      // change color to color with round up chroma if the color is still in Gamut and round Chroma is bigger than original Chroma
      let colorOklch = (rndTo(C, 3) > C) && checkColorInGamut(colorOklchRndC, colorSpaces.Oklch, colorSpaceGamut)
                        ? colorOklchRndC : [L, C, H];
      let colorRgb = convertColor(colorOklch, colorSpaces.Oklch, colorSpaceRgbOut);
      return [tone, colorRgb];
   });

   return [colorRgbTones, colorOklchTones];
}