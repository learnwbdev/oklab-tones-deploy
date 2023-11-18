/**
 * Part of calculation is from Google Material Design 3 Color Utilities
    https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/viewing_conditions.ts
    https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/cam16.ts
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
 * Convert Color from CAM16 UCS color space to CAM16 color space (uniform color space)
 * Default viewing conditions (as in color space CAM16):
 * white point D65 specified in Rec BT.2020. xyY (Y = 1): (0.31270, 0.32900), XYZ ~ [0.9505, 1.0000, 1.0890]
 * Adapting Luminance = 11.72 (as in Material Design 3 default viewing conditions)
 * Background Luminance = 18.42 (~ as in Material Design 3 default viewing conditions, Y for Lab Lightness = 50)
 * surround = 2 (average)
 * discounting = false
 * @param {number[]} colorCam16 - Array of values for color in CAM16 UCS color space: J (Lightness) as 0..100, M (colorfulness) as 0..100,  h (hue) as 0..360 (360 - excluded),
 * a (how green/red the color is) as -50..50 , b (how blue/yellow the color is) as -50..50
 * @return {number[]} Array of Cam16 values: J, C, h and Q, M, s: J (Lightness) as 0..100, C (Chroma) as 0..100 (unbound, could be 140-150),
 * h (hue) as 0..360 (360 - excluded), Q (Brightness) as 0..100, M (Colorfulness) as 0..100, s (saturation) as 0..100
 */

/* sources:
        https://arxiv.org/pdf/1802.06067.pdf
        https://observablehq.com/@jrus/cam16
        https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/viewing_conditions.ts
        https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/cam16.ts
        https://github.com/colour-science/colour/blob/develop/colour/appearance/cam16.py

        (CAM 16, CAM16 UCS):
        https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/cam16.py
        https://www.imaging.org/site/PDFS/Papers/2000/PICS-0-81/1611.pdf

        https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/cam16_ucs.py
        https://observablehq.com/@jrus/cam16
        https://arxiv.org/abs/1802.06067
        https://doi.org/10.1002/col.22131
*/

export function convertCam16UcsToCam16(colorCam16Ucs) {
  let J, M, hue, C, Q, s
  let isAllInputCam16Ucs = false
  if (colorCam16Ucs.length === 8) {
    [J, M, hue, , , C, Q, s] = colorCam16Ucs
    isAllInputCam16Ucs = true
  } else {
    [J, M, hue] = colorCam16Ucs
  }

  const M_cam16 = (Math.exp(M * 0.0228) - 1) / 0.0228 // M (colorfulness) in CAM16
  const J_cam16 = J / (1.7 - 0.007 * J) // J (lightness) in CAM16

  const colorCam16 = isAllInputCam16Ucs
    ? [J_cam16, C, hue, M_cam16, s, Q]
    : [J_cam16, C, hue, M_cam16] // JCh format + M, s, Q: J - Lightness, C - Chroma, h - hue,  M - colorfulness, s - saturation, Q - brightness

  return colorCam16 // JCh format + M, s, Q
}
