/**
 * color palette format is from Google Material Design 3 Color Utilities:
 * https://github.com/material-foundation/material-color-utilities/blob/main/typescript/palettes/core_palette.ts
 *
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * Create palette similar to Material Design 3 color palette for Oklch color space from a given color
 * @param {string | number[]} colorOrg - color to make tone palette for
 * @param {boolean} [isContent = false] - flag to create palette for the Content ( different Chroma for the palettes ). isContent = false (more saturated), isContent = true (more similar to primary color)
 * @param {string}  [colorSpaceFrom = "Hex"] - name of the color space the colorOrg is in
 * @param {string}  [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @param {boolean} [isDeltaE2000 = true] - flag to use DeltaE2000 instead of DeltaEOk to find color difference between two colors (to find Maximum Chroma for a given color)
 * @param {number[]} [ arrChromaCorr = [48, 16, 24, 4, 8] ] - array of Chroma target values for CAM16. In order of the palettes: primary, secondary, tertiary, neutral, neutral variant, error
 * @param {boolean}  [isFindMaxChroma = true] - flag to find maximum Chroma for the original Color that gives similar color (to compensate possible gamut clipping of the Chroma)
 * @param {number[]} [tones = [0, 1, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100]] - Array of tones to construct Tone Palette
 * @param {number}   [grayColorIptHue = 200] - IPT Hue value (in IPT color space) for the primary color, if the input color is the gray color (with Oklch Chroma === 0). Default: 200 (cyan). IPT Hue = 215 for the gray color in CAM16 or Material Design 3
 * @param {string}   [colorSpaceRgbOut = colorSpaces.Hex] - format of the output color in RGB color space. Default: Hex. Could be: Hex or sRgb.
 * @param {boolean}  [isLog = false] - flag to write log in console
 * @returns {Object[]} Array of palettes: primary tone palette, secondary tone palette, tertiary tone palette, neutral tone palette,
 * neutral variant tone palette, error tone palette
 *
 * One palette is an Array [paletteHex, paletteOklch] - palette in Hex color format, same palette in Oklch color format
 * Hex palette could be slightly different from Oklch, because of the rounding up to Hex color
 *
 * One paletteHex or paletteOklch is an Array in format [[tone, color], [tone, color], ... ].
 * where Tone - is a tone in HCT color space or round up value of L in Lab color space
 *
 * baseHue    - Hue from a given color
 * baseChroma - Chroma from a given color
 *
 * if isContent = true:
 * Primary tone palette base color:         [baseHue,      baseChroma    ]
 * Secondary tone palette base color:       [baseHue,      baseChroma / 3]
 * Tertiary tone palette base color:        [baseHue + 60, baseChroma / 2]
 * Neutral tone palette base color:         [baseHue,      min(baseChroma / 12, 4)], where 4 - Chroma in Cam16 color space
 * Neutral Variant tone palette base color: [baseHue,      min(baseChroma / 6 , 8)], where 8 - Chroma in Cam16 color space
 *
 * if isContent = false:
 * Primary tone palette base color:         [baseHue,      max(baseChroma, 48) ], where 48 - Chroma in Cam16 color space
 * Secondary tone palette base color:       [baseHue,      16], where 16 - Chroma in Cam16 color space
 * Tertiary tone palette base color:        [baseHue + 60, 24], where 24 - Chroma in Cam16 color space
 * Neutral tone palette base color:         [baseHue,      4], where 4 - Chroma in Cam16 color space
 * Neutral Variant tone palette base color: [baseHue,      8], where 8 - Chroma in Cam16 color space
 *
 * Error tone palette base color:           [25, 84], where 84 - Chroma in Cam16 color space, 25 - Hue in Cam16 color space
 *
 * If input color is an gray color (with Oklch C === 0), then primary IPT Hue = 215 (cyan) or value from grayColorIptHu parameter
 *
 * Default: isDeltaE2000 = true with jnd = 0.2
 * DeltaE2000 with jnd = 0.2 and DeltaEOk with jnd = 0.002 mostly give the same results to find maximum Chroma for a similar color,
 * but for color '#f7ecf1' DeltaE2000 gives better results (doesn't rises Chroma too much):
 * 0.95311, 0.01353, 347.95 (before Chroma correction to maximum Chroma of the similar color)
 * 0.95311, 0.01502, 347.95 (DEOK, jnd = 0.002)  -> gives different Hex color, '#f8ecf1'
 * 0.95311, 0.01391, 347.95 (DE2000, jnd = 0.2)  (same Hex color, '#f7ecf1')
 * 0.95311, 0.01469, 347.95 (DE2000, jnd = 0.5)  -> gives different Hex color, '#f8ecf1'
 *
 */

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";
import { correctOklchChromaToCCam16 } from "../tones/correctOklchChromaToCCam16.js";
import { correctOklchHueToGivenHueIPT } from "../tones/correctOklchHueToGivenHueIPT.js";
import { findMaxChroma } from "../tones/findMaxChroma.js";
import { constructOklchTonePalette } from "./constructOklchTonePalette.js";

export function createPaletteOklch(colorOrg,
    {isContent = false, colorSpaceFrom = colorSpaces.Hex, colorSpaceGamut = colorSpaces.sRgb,
     isDeltaE2000 = true, arrChromaCorr = [48, 16, 24, 4, 8, 84], isFindMaxChroma = true,
     tones = [0, 1, 4, 5, 6, 10, 12, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100], grayColorIptHue = 200,
     colorSpaceRgbOut = colorSpaces.Hex, isLog = false } = {}) {

    // convert color to Oklch color space
    let colorOklchPrimary = convertColor(colorOrg, colorSpaceFrom, colorSpaces.Oklch);
    let [L, C, H] = colorOklchPrimary;

    if (isLog) console.log("createPaletteOklch, Oklch color before Chroma corr: ", [...colorOklchPrimary]);

    // correct Chroma to maximum Chroma without noticeable color difference (to level out Chroma clipped to gamut)
    if (isFindMaxChroma && C !== 0) {
        C = findMaxChroma(colorOklchPrimary, colorSpaceGamut, {isDeltaE2000: isDeltaE2000});
        colorOklchPrimary = [L, C, H]; // change to max Chroma
    }

    if (isLog) console.log("createPaletteOklch, Oklch color after Chroma corr: ", [...colorOklchPrimary]);

    // find target IPT Hues to correct Hue to IPT Hue for the color `colorOklchPrimary`
    // if input color is gray color (Oklch C === 0), than make Hue primary = 215 (cyan) (default value), as in CAM16 or Material Design 3
    let tgtIptHuePrimr = C === 0 ? grayColorIptHue : convertColor(colorOklchPrimary, colorSpaces.Oklch, colorSpaces.IPTch, {isRound: false})[2]; // Hue IPTch from IPTch color for the primary OKlch color
    // target IPT hue for the tertiary color
    let tgtIptHueTertr = (tgtIptHuePrimr + 60) % 360;

    // the same CAM16 Chroma corresponds to the different Oklch Chroma for the different Oklch Hues
    // so we find Chroma corresponding to the Hue Oklch primary and Hue Oklch tertiary (IPT Hue correction should not give big Hue differences)
    const colorCam16Primr = convertColor(colorOklchPrimary, colorSpaces.Oklch, colorSpaces.CAM16, {isRound: false}); // Color CAM16 for the primary Oklch color
    const colorCam16Tertr = convertColor([ L, C, (H + 60) % 360 ], colorSpaces.Oklch, colorSpaces.CAM16, {isRound: false}); // Color CAM16 for the primary Oklch color

    // Lightness, Chroma, Hue for CAM16 colors
    // Primary (H)
    const [LcamPrm, CcamPrm, HcamPrm] = colorCam16Primr;
    // Tertiary (H + 60)
    // ----- const [LcamTrt, CcamTrt, HcamTrt] = colorCam16Tertr;
    const [LcamTrt, , HcamTrt] = colorCam16Tertr;

    if (isLog) console.log("createPaletteOklch, CcamPrm: ", CcamPrm);

    let colorOklchSecond, colorOklchTertr, colorOklchNeutr, colorOklchNeutrVar, colorOklchError;
    let tgtCam16CPrimr, tgtCam16CSecnd, tgtCam16CTertr, tgtCam16CNeutr, tgtCam16CNeutrVar, tgtCam16CError;
    let ChrOklchPrm, ChrOklchSnd, ChrOklchTrt, ChrOklchNtr, ChrOklchNtrVr;
    // set Target Chroma CAM16 for the Base Colors (to correct Chroma in Tone Palettes)
    if (isContent) { // more similar to primary color
        tgtCam16CPrimr     = CcamPrm     ;                              // C
        tgtCam16CSecnd     = CcamPrm / 3 ;                              // C / 3
        // ----- tgtCam16CTertr     = CcamTrt / 2 ;                              // C / 2
        tgtCam16CTertr     = CcamPrm / 2 ;                              // C / 2
        tgtCam16CNeutr     = Math.min(CcamPrm / 12 , arrChromaCorr[3]); // HCT, CAM16: C / 12, Chroma = 4
        tgtCam16CNeutrVar  = Math.min(CcamPrm / 6  , arrChromaCorr[4]); // HCT, CAM16: C / 6,  Chroma = 8
    }
    else {           // more saturated colors
        tgtCam16CPrimr     = Math.max(arrChromaCorr[0], CcamPrm);       // HCT, CAM16: Math.max(48, chroma)
        tgtCam16CSecnd     = arrChromaCorr[1];                          // HCT, CAM16: Chroma = 16
        tgtCam16CTertr     = arrChromaCorr[2];                          // HCT, CAM16: Chroma = 24
        tgtCam16CNeutr     = arrChromaCorr[3];                          // HCT, CAM16: Chroma =  4
        tgtCam16CNeutrVar  = arrChromaCorr[4];                          // HCT, CAM16: Chroma =  8
    }

    // find corresponding Oklch Chroma (to the changed CAM16 Chroma) for a given Hue with default rounding
    // (convert CAM16 color to Oklch color)
    ChrOklchPrm   = isContent ? C : convertColor([LcamPrm, tgtCam16CPrimr   , HcamPrm], colorSpaces.CAM16, colorSpaces.Oklch)[1];
    ChrOklchSnd   = convertColor([LcamPrm, tgtCam16CSecnd   , HcamPrm], colorSpaces.CAM16, colorSpaces.Oklch)[1];
    ChrOklchTrt   = convertColor([LcamTrt, tgtCam16CTertr   , HcamTrt], colorSpaces.CAM16, colorSpaces.Oklch)[1];
    ChrOklchNtr   = convertColor([LcamPrm, tgtCam16CNeutr   , HcamPrm], colorSpaces.CAM16, colorSpaces.Oklch)[1];
    ChrOklchNtrVr = convertColor([LcamPrm, tgtCam16CNeutrVar, HcamPrm], colorSpaces.CAM16, colorSpaces.Oklch)[1];

    // Primary Base Color
    colorOklchPrimary  = [L, ChrOklchPrm  , H];
    // Secondary Base Color
    colorOklchSecond   = [L, ChrOklchSnd  , H];
    // Tertiary Base Color
    colorOklchTertr    = [L, ChrOklchTrt  , (H + 60) % 360 ];
    // Neutral Base Color
    colorOklchNeutr    = [L, ChrOklchNtr  , H];
    // Neutral Variant Base Color
    colorOklchNeutrVar = [L, ChrOklchNtrVr, H];

    // Error Base Color
    colorOklchError  = [0.59391, 0.20442, 27.81];    // HCT, CAM16: Hue = 25, Chroma = 84 -> Oklch C ~ 0.2045, for CAM16 L = 42.56, Oklch: [0.59391, 0.20442, 27.81], #de3730
    // set target IPT Hue for the error tone palette
    // let tgtIptHueError = convertColor(colorOklchError, colorSpaces.Oklch, colorSpaces.IPTch, {isRound: false})[2]; // = 32.13
    let tgtIptHueError = 32.13; // IPT target Hue for the error palette, color Oklch [0.59391, 0.20442, 27.81] <- Color CAM16 [42.56, 84, 25]
    // set Target Chroma CAM16 for the error tone palette
    tgtCam16CError   = arrChromaCorr[5]; // HCT, CAM16: Chroma =  84

    // if (isLog) console.log("createPaletteOklch: ", colorOklchTertr, tgtCam16CTertr);
    if (isLog) console.log("createPaletteOklch: ", colorOklchPrimary , tgtCam16CPrimr);

    // Correct Chroma for the Base Colors (except error palette)
    colorOklchPrimary  = correctOklchChromaToCCam16(colorOklchPrimary , tgtCam16CPrimr);
    colorOklchSecond   = correctOklchChromaToCCam16(colorOklchSecond  , tgtCam16CSecnd);
    colorOklchTertr    = correctOklchChromaToCCam16(colorOklchTertr   , tgtCam16CTertr);
    colorOklchNeutr    = correctOklchChromaToCCam16(colorOklchNeutr   , tgtCam16CNeutr);
    colorOklchNeutrVar = correctOklchChromaToCCam16(colorOklchNeutrVar, tgtCam16CNeutrVar);

    // if (isLog) console.log("createPaletteOklch after C corr: ", colorOklchTertr, tgtCam16CTertr);
    if (isLog) console.log("createPaletteOklch after C corr: ", colorOklchPrimary , tgtCam16CPrimr);

    // Correct Hues for the Base Colors (except error palette)
    colorOklchPrimary  = correctOklchHueToGivenHueIPT(colorOklchPrimary , tgtIptHuePrimr); // correct Hue to IPTch Hue of the primary color
    colorOklchSecond   = correctOklchHueToGivenHueIPT(colorOklchSecond  , tgtIptHuePrimr); // correct Hue to IPTch Hue of the primary color
    colorOklchTertr    = correctOklchHueToGivenHueIPT(colorOklchTertr   , tgtIptHueTertr); // correct Hue to IPTch Hue of the primary color + 60
    colorOklchNeutr    = correctOklchHueToGivenHueIPT(colorOklchNeutr   , tgtIptHuePrimr); // correct Hue to IPTch Hue of the primary color
    colorOklchNeutrVar = correctOklchHueToGivenHueIPT(colorOklchNeutrVar, tgtIptHuePrimr); // correct Hue to IPTch Hue of the primary color

    if (isLog) console.log("createPaletteOklch: ", colorOklchTertr, tgtIptHueTertr, tgtCam16CTertr);

    // Construct Tone palettes (with different Lightness) from Base colors
    let paletteOklchPrimary, paletteOklchSecond, paletteOklchTertr, paletteOklchError, paletteOklchNeutr, paletteOklchNeutrVar;
    paletteOklchPrimary  = constructOklchTonePalette(colorOklchPrimary,  { tgtHueIpt: tgtIptHuePrimr, tgtChromaCam16: tgtCam16CPrimr, isFindMaxChroma: isFindMaxChroma,
                                                     colorSpaceFrom: colorSpaces.Oklch, tones: tones, isDeltaE2000: isDeltaE2000, colorSpaceGamut: colorSpaceGamut, colorSpaceRgbOut: colorSpaceRgbOut});
    paletteOklchSecond   = constructOklchTonePalette(colorOklchSecond,   { tgtHueIpt: tgtIptHuePrimr, tgtChromaCam16: tgtCam16CSecnd, isFindMaxChroma: isFindMaxChroma,
                                                     colorSpaceFrom: colorSpaces.Oklch, tones: tones, isDeltaE2000: isDeltaE2000, colorSpaceGamut: colorSpaceGamut, colorSpaceRgbOut: colorSpaceRgbOut});
    paletteOklchTertr    = constructOklchTonePalette(colorOklchTertr,    { tgtHueIpt: tgtIptHueTertr, tgtChromaCam16: tgtCam16CTertr, isFindMaxChroma: isFindMaxChroma,
                                                     colorSpaceFrom: colorSpaces.Oklch, tones: tones, isDeltaE2000: isDeltaE2000, colorSpaceGamut: colorSpaceGamut, colorSpaceRgbOut: colorSpaceRgbOut});
    paletteOklchNeutr    = constructOklchTonePalette(colorOklchNeutr,    { tgtHueIpt: tgtIptHuePrimr, tgtChromaCam16: tgtCam16CNeutr, isFindMaxChroma: isFindMaxChroma,
                                                     colorSpaceFrom: colorSpaces.Oklch, tones: tones, isDeltaE2000: isDeltaE2000, colorSpaceGamut: colorSpaceGamut, colorSpaceRgbOut: colorSpaceRgbOut});
    paletteOklchNeutrVar = constructOklchTonePalette(colorOklchNeutrVar, { tgtHueIpt: tgtIptHuePrimr, tgtChromaCam16: tgtCam16CNeutrVar, isFindMaxChroma: isFindMaxChroma,
                                                     colorSpaceFrom: colorSpaces.Oklch, tones: tones, isDeltaE2000: isDeltaE2000, colorSpaceGamut: colorSpaceGamut, colorSpaceRgbOut: colorSpaceRgbOut});
    paletteOklchError    = constructOklchTonePalette(colorOklchError,    { tgtHueIpt: tgtIptHueError, tgtChromaCam16: tgtCam16CError, isFindMaxChroma: isFindMaxChroma,
                                                     colorSpaceFrom: colorSpaces.Oklch, tones: tones, isDeltaE2000: isDeltaE2000, colorSpaceGamut: colorSpaceGamut, colorSpaceRgbOut: colorSpaceRgbOut});

    // 0 - primary, 1 - secondary, 2 - tertiary, 3 - error, 4 - neutral, 5 - neutral variant (order as in Material Design 3 core palette)
    return [
        [ 'primary'         , ...paletteOklchPrimary  ],
        [ 'secondary'       , ...paletteOklchSecond   ],
        [ 'tertiary'        , ...paletteOklchTertr    ],
        [ 'error'           , ...paletteOklchError    ],
        [ 'neutral'         , ...paletteOklchNeutr    ],
        [ 'neutral-variant' , ...paletteOklchNeutrVar ],
    ];
 }
