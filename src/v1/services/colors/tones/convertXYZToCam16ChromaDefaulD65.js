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
 * Find Chroma value in CAM16 or CAM16 UCS color space for a given XYZ color
 * for D65 specified in Rec BT.2020. xyY (Y = 1): (0.31270, 0.32900), XYZ ~ [0.9505, 1.0000, 1.0890]
 * @param {number[]} colorXYZ - Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 * @param {boolean} [isReturnChromaCam16Ucs = true] - flag to return Chroma in CAM16 UCS color space instead of CAM16 color space
 * @return {number} Chroma for a given XYZ color in CAM16 or CAM16 UCS color space (depends on the flag `isReturnChromaCam16Ucs`)
 */

/* sources:
            https://arxiv.org/pdf/1802.06067.pdf
            https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/viewing_conditions.ts
            https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/cam16.ts
            https://github.com/colour-science/colour/blob/develop/colour/appearance/cam16.py

        (CAM 16):
        https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/cam16.py
        https://www.imaging.org/site/PDFS/Papers/2000/PICS-0-81/1611.pdf
        https://observablehq.com/@jrus/cam16
        https://arxiv.org/abs/1802.06067
        https://doi.org/10.1002/col.22131

        (CAM16 UCS):
        https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/cam16_ucs.py
        https://observablehq.com/@jrus/cam16
        https://arxiv.org/abs/1802.06067
        https://doi.org/10.1002/col.22131
*/

import { XYZ__to__RGBforCAM16 } from "../matrices/colorMatrices.js";
import { multiplyMatrices } from "../utils/multiplyMatrices.js";

export function convertXYZToCam16ChromaDefaulD65(colorXYZ, {isReturnChromaCam16Ucs = false} = {}) {
    // clamp function: returns val if its within [min, max], otherwise min if val < min or max if val > max
    const clampNum = (min, val, max) => Math.max(min, Math.min(val, max));

    // lerp function - to find a number between two numbers. The amt parameter can be used to specify the amount to interpolate between the two values.
    const lerpAmt = (start, stop, amt) => {
        amt = clampNum(0, 1, amt);
        return start + (stop - start) * amt;
    }

    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const f = 1;
    const c = 0.69;
    // const Yb = 18.418651851244416;
    // const adaptLum = 11.725677948856951;
    // const k = 0.01677053504695467;
    // const D = 0.8450896328492113;
    const Fl = 0.3884814537800353;
    const n = 0.18418651851244416;
    const Nbb = 1.0169191804458757;
    const Ncb = Nbb;
    const Nc = f;
    const z = 1.909169568483652;
    const Aw = 29.980990887425268;
    const rgbD = [1.0211931250282205, 0.98629630699647, 0.9338046211456176]; // for white point D65 * 100 ~ [95.05, 100.00, 108.90]. D65:  [3127 / 3290, 1, 3583 / 3290 ]; // ~ [0.9505, 1.0000, 1.0890]

    // step 1
    // Scale from 1 to 100
    colorXYZ = colorXYZ.map(val => val * 100);
    const colorRgbCam = multiplyMatrices(XYZ__to__RGBforCAM16, colorXYZ);

    // step 2
    const rgbC = colorRgbCam.map((val, idx) => rgbD[idx] * val); // Ex: Rc = Dr * R

    // step 3
    const rgbAF = rgbC.map(val => Math.pow((Fl * Math.abs(val)) / 100.0, 0.42));  // Factor
    const rgbA = rgbAF.map((val, idx) => 400.0 * Math.sign(rgbC[idx]) * val / (val + 27.13));

    // step 4
    const a = ( 11.0 * rgbA[0] - 12.0 * rgbA[1] + rgbA[2]) / 11.0;
    const b = ( rgbA[0] + rgbA[1] - 2.0 * rgbA[2]) / 9.0;
    // auxiliary variables
    const p2 = ( 40.0 * rgbA[0] + 20.0 * rgbA[1] + rgbA[2]) / 20.0;
    const u  = ( 20.0 * rgbA[0] + 20.0 * rgbA[1] + 21.0 * rgbA[2]) / 20.0;
    let hue = toDegrees(Math.atan2(b, a));
    hue = hue >= 0 ? hue : hue + 360; // Hue, in degrees [0 to 360)

    // step 5
    const huePrime = (hue < 20.14) ? hue + 360 : hue;
    const eHue = (1.0 / 4.0) * (Math.cos(toRadians(huePrime) + 2.0) + 3.8);

    // step 6
    // achromatic response
    const A = p2 * Nbb;
    const J = 100.0 * Math.pow(A / Aw, c * z);

    const p1 = ( 50000.0 / 13.0 ) * eHue * Nc * Ncb;
    const t = p1 * Math.sqrt(a ** 2 + b ** 2) / (u + 0.305);

    const alpha = Math.pow(t, 0.9) * Math.pow(1.64 - Math.pow(0.29, n), 0.73);

    // CAM16 chroma
    const chromaCam16 = alpha * Math.sqrt(J / 100.0);
    const M = chromaCam16 * Math.pow(Fl, 0.25);

    // Chroma in CAM16 UCS (Uniform Color Space)
    const chromaCam16_UCS = Math.log(1 + 0.0228 * M) / 0.0228;

    // return [chromaCam16, chromaCam16_UCS];
    return isReturnChromaCam16Ucs ? chromaCam16_UCS : chromaCam16;
}