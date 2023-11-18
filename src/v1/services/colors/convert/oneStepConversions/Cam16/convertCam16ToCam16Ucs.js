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
 * Convert Color from CAM16 color space to CAM16 UCS color space (uniform color space)
 * Default viewing conditions (as in color space CAM16):
 * white point D65 specified in Rec BT.2020. xyY (Y = 1): (0.31270, 0.32900), XYZ ~ [0.9505, 1.0000, 1.0890]
 * Adapting Luminance = 11.72 (as in Material Design 3 default viewing conditions)
 * Background Luminance = 18.42 (~ as in Material Design 3 default viewing conditions, Y for Lab Lightness = 50)
 * surround = 2 (average)
 * discounting = false
 * @param {number[]} colorCam16 - Array of Cam16 values: J, C, h and Q, M, s: J (Lightness) as 0..100, C (Chroma) as 0..100 (unbound, could be 140-150),
 * h (hue) as 0..360 (360 - excluded), Q (Brightness) as 0..100, M (Colorfulness) as 0..100, s (saturation) as 0..100
 * @param {boolean} [isDiffViewCond = false] - flag to use different viewing conditions, not default
 * @param {number} [adaptingLuminance = 11.72] - (if isDiffViewCond = true) Adapting field Luminance: the average luminance of the environment in cd/m2 (a.k.a. nits). Default: 11.72 (as in Material Design 3 default viewing conditions)
 * @return {number[]} Array of values for color in CAM16 UCS color space: J (Lightness) as 0..100, M (colorfulness) as 0..100,  h (hue) as 0..360 (360 - excluded),
 * a (how green/red the color is) as -50..50 , b (how blue/yellow the color is) as -50..50
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

export function convertCam16ToCam16Ucs(colorCam16, {isDiffViewCond = false, adaptingLuminance = 11.72 } = {}) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    let Fl = 0.3884814537800353; // for Default Viewing conditions

    let J, hue, M, C, Q, s;
    let isAllInputCam16 = false;
    if (colorCam16.length = 6) { // M is given in colorCam16
        [J, C, hue, M, s, Q] = colorCam16;             // J - lightness, C - Chroma, h - hue, M - colorfulness
        isAllInputCam16 = true;
    }
    else { // calculate M from C
        [J, C, hue] = colorCam16;

        if (isDiffViewCond) {
            const adaptLum = adaptingLuminance; // Adapting field Luminance: the average luminance of the environment in cd/m2 (a.k.a. nits). Under a “gray world” assumption this is 20% of the luminance of a white reference (often taken to be 20% of the luminance of a white object in the scene)
            // const adaptLum = 11.72;
            const k = 1.0 / (5.0 * adaptLum + 1.0);
            // const k = 0.01677053504695467;
            const k4 = k ** 4;
            const k4F = 1.0 - k4;
            Fl = k4 * adaptLum + 0.1 * (k4F ** 2) * Math.cbrt(5.0 * adaptLum);
        }
        M = C * Math.pow(Fl, 0.25); // colorfulness (M)
    }

    // Colorfulness in CAM16 UCS (Uniform Color Space)
    const M_cam16_UCS = Math.log(1 + 0.0228 * M) / 0.0228;  // in polar coordinates similar to Chroma in Oklab

    // const J_cam16Ucs = (1.0 + 100.0 * 0.007) * J / (1.0 + 0.007 * J);
    const J_cam16Ucs = 1.7 * J / (1.0 + 0.007 * J);
    const a = M_cam16_UCS * Math.cos(toRadians(hue));
    const b = M_cam16_UCS * Math.sin(toRadians(hue));

    const colorCam16Ucs = isAllInputCam16 ? [J_cam16Ucs, M_cam16_UCS, hue, a, b, C, Q, s]
                                          : [J_cam16Ucs, M_cam16_UCS, hue, a, b, C]; // J - lightness, M - colorfulness (could be used as Chroma ?), h - hue, a - how green/red the color is, b - how blue/yellow the color is

    return colorCam16Ucs;
}