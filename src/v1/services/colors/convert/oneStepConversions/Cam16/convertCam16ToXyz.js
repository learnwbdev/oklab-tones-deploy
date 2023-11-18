 /**
 * Calculation is from Google Material Design 3 Color Utilities
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
 * Convert Color from CAM16 color space (in JCh format) to CIE XYZ color space
 * Default viewing conditions:
 * * white point D65 specified in Rec BT.2020. xyY (Y = 1): (0.31270, 0.32900), XYZ ~ [0.9505, 1.0000, 1.0890]
 * https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.2020-0-201208-S!!PDF-E.pdf
 * * Adapting Luminance = 11.72 (as in Material Design 3 default viewing conditions)
 * For displays Adapting Luminance could be = 40.6; // 20% of 203 cd/m2 = 40.6
 * value 203 cd/m2 from Reference White https://www.itu.int/dms_pub/itu-r/opb/rep/R-REP-BT.2408-3-2019-PDF-E.pdf (p5)
 * (BT.2048 says media white value is 203 cd/m2)
 * value 20% from https://observablehq.com/@jrus/cam16
 * * Background Luminance = 18.42 (~ as in Material Design 3 default viewing conditions, Y for Lab Lightness = 50)
 * (Background Luminance could be = 20)
 * * surround = 2 (average)
 * * discounting = false
 * @param {number[]} colorCam16 - Array of values for color in CAM16 color space in format J, C, h and additional Q, M, s (to convert color to CAM16 Ucs):
 * J (lightness) as 0..100, C (Chroma) as 0..100 (unbound, could be 140-150), h (hue) as 0..360 (360 - excluded)
 * Q (brightness) as 0..100, M (colorfulness) as 0..100, s (saturation) as 0..100
 * @param {boolean} [isSimpleCalcCam16 = true] - flag to use default Viewing conditions (to not recalculate parameters) and to not calculate all values for CAM16 color
 * @param {boolean} [isDiffViewCond = false] - flag to use different viewing conditions, not default
 * @param {number[]} [wpD65XYZ = [3127 / 3290, 1, 3583 / 3290]] - XYZ coordinate of the white point, default: D65 specified in Rec BT.2020
 * @param {number} [adaptingLuminance = 11.72] - Adapting field Luminance: the average luminance of the environment in cd/m2 (a.k.a. nits). Default: 11.72 (as in Material Design 3 default viewing conditions)
 * @param {number} [backgroundLuminance = 18.42] - Background Luminance: the relative luminance of the nearby background (out to 10°), relative to Yw=100. Default: 18.42 (~ as in Material Design 3 default viewing conditions, Y for Lab Lightness = 50)
 * @param {number} [surround = 2.0] - surround (0, 1, or 2): a description of the peripheral area. Default: 2.0. Values: 0.0 (dark) is pitch dark, like watching a movie in a theater. 1.0 (dim) is a dimly light room, like watching TV at home at night. 2.0 (average) means there is no difference between the lighting on the color and around it.
 * @param {boolean} [discounting = false] - Discounting. Default: false. Can be set to true if the eye is assumed to be fully adapted to the illuminant.
 * @return {number[]} Array of CIEXYZ values: X, Y, Z as 0..1 (Y - linear luminance)
 *
 *
 * A color space CAM16 can be constructed of using a subset of attributes: JCh, JMh, Jsh, QCh, QMh, Qsh, etc.
 * J 	Lightness      [0, 100]
 * C 	Chroma         [0, 100] (unbound, could be 140-150)
 * h 	hue            [0, 360]
 * s 	saturation     [0, 100]
 * Q 	Brightness     [0, 100]
 * M 	Colorfulness   [0, 100]
 * H 	Hue Quadrature [0, 400]
 *
 * For CAM16 color could be given:
 * 𝐽 or 𝑄
 * 𝐶, 𝑀, or s
 * 𝐻 or ℎ
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

        https://facelessuser.github.io/coloraide/colors/cam16/
*/

import { convertLabToXyz } from "../Lab/convertLabToXyz.js";
import { RGBforCAM16__to__XYZ, XYZ__to__RGBforCAM16 } from "../../../matrices/colorMatrices.js";
import { multiplyMatrices } from "../../../utils/multiplyMatrices.js";

export function convertCam16ToXyz(colorCam16, {isSimpleCalcCam16 = true, isDiffViewCond = false, wpD65XYZ = [3127 / 3290, 1, 3583 / 3290], adaptingLuminance = 11.72, backgroundLuminance = 18.42, surround = 2.0, discounting = false} = {}) { // Color Cam16, not Cam16UCS
    // clamp function: returns val if its within [min, max], otherwise min if val < min or max if val > max
    const clampNum = (min, val, max) => Math.max(min, Math.min(val, max));

    // lerp function - to find a number between two numbers. The amt parameter can be used to specify the amount to interpolate between the two values.
    const lerpAmt = (start, stop, amt) => {
        amt = clampNum(0, 1, amt);
        return start + (stop - start) * amt;
    }

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    let f, c, Yb, adaptLum, k, D, Fl;
    let n, Nbb, Ncb, Nc, z, Aw;
    let rgbD;
    if (isSimpleCalcCam16) { // saved parameters for the default viewing conditions
        f = 1;
        c = 0.69;
        // Yb = 18.418651851244416;
        // adaptLum = 11.725677948856951;
        // k = 0.01677053504695467;
        // D = 0.8450896328492113;
        Fl = 0.3884814537800353;
        n = 0.18418651851244416;
        Nbb = 1.0169191804458757;
        Ncb = Nbb;
        Nc = f;
        z = 1.909169568483652;
        Aw = 29.980990887425268;
        rgbD = [1.0211931250282205, 0.98629630699647, 0.9338046211456176]; // for white point D65 * 100 ~ [95.05, 100.00, 108.90]. D65:  [3127 / 3290, 1, 3583 / 3290 ]; // ~ [0.9505, 1.0000, 1.0890]
    }
    else {
        // Viewing conditions
        // white point D-65 in XYZ color space
        let wpD65_XYZ = isDiffViewCond ? wpD65XYZ : [3127 / 3290, 1, 3583 / 3290 ]; // ~ [0.9505, 1.0000, 1.0890]

        const discountingIllum = isDiffViewCond ? discounting : false; // discounting, which can be set to true if the eye is assumed to be fully adapted to the illuminant.
        surround = clampNum(0.0, surround, 2.0);
        const surround_calc = isDiffViewCond ? surround : 2.0;  // A general description of the lighting surrounding the color.
        /* 0.0 (dark) is pitch dark, like watching a movie in a theater.
        1.0 (dim) is a dimly light room, like watching TV at home at night.
        2.0 (average) means there is no difference between the lighting on the color and around it.
        */

        Yb = isDiffViewCond ? backgroundLuminance : 100 * convertLabToXyz([50, 0, 0])[1];  // background Luminance,  Y in XYZ color space for L = 50 in CIE Lab color space (Yb background in test conditions)
        // const Yb = 18.42;
        adaptLum = isDiffViewCond ? adaptingLuminance : (2.0 / Math.PI) * Yb ;  // Adapting field Luminance (adaptive Luminance)
        // const adaptNum = 11.72

        // Scale from 1 to 100
        wpD65_XYZ = wpD65_XYZ.map(val => val * 100);

        f = 0.8 + surround_calc / 10.0; // f = 1.0 (average), 0.9 - dim, 0.8 - dark
        c = f >= 0.9 ? lerpAmt(0.59,  0.69, (f - 0.9) * 10.0) :
                            lerpAmt(0.525, 0.59, (f - 0.8) * 10.0);

        n = Yb / wpD65_XYZ[1]; // Yb / Yw
        Nbb = 0.725 / Math.pow(n, 0.2);
        Ncb = Nbb;
        Nc = f;
        z = 1.48 + Math.sqrt(n);

        D = discountingIllum ? 1.0 : f * (1.0 - (1.0 / 3.6) * Math.exp((-adaptLum - 42.0) / 92.0));
        D = clampNum(0, D, 1);

        k = 1.0 / (5.0 * adaptLum + 1.0);
        const k4 = k ** 4;
        const k4F = 1.0 - k4;
        Fl = k4 * adaptLum + 0.1 * (k4F ** 2) * Math.cbrt(5.0 * adaptLum);

        const wpD65_RGBcam = multiplyMatrices(XYZ__to__RGBforCAM16, wpD65_XYZ);
        rgbD = wpD65_RGBcam.map(val => D * (wpD65_XYZ[1]/val) + 1.0 - D);

        // rgbC for white point
        const rgbC_wp = wpD65_RGBcam.map((val, idx) => rgbD[idx] * val); // Ex: Rc = Dr * R
        const rgbAF_wp = rgbC_wp.map(val => Math.pow((Fl * val) / 100.0, 0.42));  // Factor
        const rgbA_wp = rgbAF_wp.map(val => 400.0 * val / (val + 27.13));

        Aw = ((40.0 * rgbA_wp[0] + 20.0 * rgbA_wp[1] + rgbA_wp[2]) / 20.0 ) * Nbb;
    }

    // Convert Color
    const [J, chromaCam16, hue] = colorCam16; // JCh format: J - Lightness, C - Chroma, h - hue, + additional: Q - brightness, M - colorfulness, s - saturation

    const alpha = (chromaCam16 === 0.0 || J === 0.0) ? 0.0 : chromaCam16 / Math.sqrt(J / 100.0);
    const t = Math.pow(alpha / Math.pow(1.64 - Math.pow(0.29, n), 0.73), 1.0 / 0.9);

    const hueRad = toRadians(hue);

    // Step 2
    // const eHue = 0.25 * (Math.cos(hueRad + 2.0) + 3.8);
    const eHue = (1.0 / 4.0) * (Math.cos(hueRad + 2.0) + 3.8);
    const A = Aw * Math.pow(J / 100.0, 1.0 / (c * z));
    const p1 = eHue * (50000.0 / 13.0) * Nc * Ncb;
    const p2 = (A / Nbb);

    // Step 3
    const gamma = 23.0 * (p2 + 0.305) * t /
        (23.0 * p1 + 11 * t * Math.cos(hueRad) + 108.0 * t * Math.sin(hueRad));
    const a = gamma * Math.cos(hueRad);
    const b = gamma * Math.sin(hueRad);

    // Step 4
    const rdbAMatr = [
        [ 460.0,  451.0,   288.0 ],
        [ 460.0, -891.0,  -261.0 ],
        [ 460.0, -220.0, -6300.0 ],
    ];
    let rgbA = multiplyMatrices(rdbAMatr, [p2, a, b]);
    rgbA = rgbA.map(val => val / 1403.0);

    // Step 5
    let rgbC = rgbA.map(val => (27.13 * Math.abs(val)) / (400.0 - Math.abs(val)));
    rgbC = rgbC.map(val => Math.pow( Math.max(val, 0), 100.0 / 42.0 ));
    rgbC = rgbC.map((val, idx) => Math.sign(rgbA[idx]) * (100.0 / Fl) * val );

    // Step 6
    const colorRgbCam = rgbC.map((val, idx) => val / rgbD[idx]); // Ex: R = Rc / Dr)

    // Step 7
    let colorXYZ = multiplyMatrices(RGBforCAM16__to__XYZ, colorRgbCam);

    // Scale from 100 to 1
    colorXYZ = colorXYZ.map(val => val / 100);

    return colorXYZ;
}