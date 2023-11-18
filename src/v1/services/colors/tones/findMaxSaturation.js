/*
Copyright (c) 2021 Björn Ottosson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* source:
        https://bottosson.github.io/posts/gamutclipping/#intersection-with-srgb-gamut
        https://colab.research.google.com/drive/1JdXHhEyjjEE--19ZPH1bZV_LiGQBndzs?usp=sharing
*/


// Find the maximum saturation possible for a given hue that fits in sRGB (for Oklch, Oklab color)
// Saturation here is defined as S = C/L
// where C - Chroma, L - Lightness in Oklch space
// a and b must be normalized so a^2 + b^2 == 1
/**
 * @param {number} aOklabNrm as -1..1 - a for Oklab color (how green/red the color is)
 * @param {number} bOklabNrm as -1..1 - b for Oklab color (how blue/yellow the color is)
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @return {number} maximum saturation for a given Hue that fits in sRGB (saturation = Chroma / Lightness)
 */

import { Oklab__to__lin_sRgb_approx, K_coeff_NumFitChromaEdge, Oklab__to__lin_DspP3Rgb_approx, LMS__to__lin_DspP3RGB } from "../matrices/colorMatrices.js";
import { OKLab__to__LMS_3, LMS__to__lin_sRGB } from "../matrices/colorMatrices.js";
import { multiplyMatrices } from "../utils/multiplyMatrices.js";
import { colorSpaces } from "../convert/colorSpaces.js";

export function findMaxSaturation(aOklabNrm, bOklabNrm, colorSpaceGamut = colorSpaces.sRgb) {
    // aOklabNrm and bOklabNrm must be normalized so aOklabNrm^2 + bOklabNrm^2 == 1
    if ( Math.round(aOklabNrm ** 2 + bOklabNrm ** 2) !== 1 ) {
        console.log("findMaxSaturation: a and b should be normalized so a^2 + b^2 == 1");
        return undefined;
    }

    // Select different approximation matrices for different Gamut (for now only for sRGB and Display P3)
    const Oklab__to__lin_Rgb_approx = colorSpaceGamut === colorSpaces.dispP3 ? Oklab__to__lin_DspP3Rgb_approx
                                                                             : Oklab__to__lin_sRgb_approx;
    // different transformation matrices for Display P3 or sRGB
    const LMS__to__lin_RGB = colorSpaceGamut === colorSpaces.dispP3 ? LMS__to__lin_DspP3RGB
                                                                    : LMS__to__lin_sRGB;

    // Max saturation will be when one of r, g or b goes below zero.

    // Select different coefficients depending on which component goes below zero first
    let arrK, arrWLms;
    // Array of values aOklabNrm, bOklabNrm
    const arrAB = [aOklabNrm, bOklabNrm];

    if (multiplyMatrices(Oklab__to__lin_Rgb_approx[0], arrAB) > 1) { // Red component goes below zero first
        // Red component
        arrK = K_coeff_NumFitChromaEdge[0];
        arrWLms = LMS__to__lin_RGB[0];
    }
    else if (multiplyMatrices(Oklab__to__lin_Rgb_approx[1], arrAB) > 1) { // Green component goes below zero first
        // Green component
        arrK = K_coeff_NumFitChromaEdge[1];
        arrWLms = LMS__to__lin_RGB[1];
    }
    else { // Blue component goes below zero first
        // Blue component
        arrK = K_coeff_NumFitChromaEdge[2];
        arrWLms = LMS__to__lin_RGB[2];
    };

    // Approximate max saturation using a polynomial:
    // let S = k0 + k1 * aOklabNrm + k2 * bOklabNrm + k3 * aOklabNrm * aOklabNrm + k4 * aOklabNrm * bOklabNrm;
    let S = multiplyMatrices(arrK, [1, aOklabNrm, bOklabNrm, aOklabNrm ** 2, aOklabNrm * bOklabNrm]);

    // Do one step Halley's method to get closer
    // this gives an error less than 10e6, except for some blue hues where the dS/dh is close to infinite
    // this should be sufficient for most applications, otherwise do two/three steps

    // get matrix without first column from matrix OKLab__to__LMS_3
    const k_OKLab__to__LMS_3 = OKLab__to__LMS_3.map(row => row.slice(1));

    let arrKLms = multiplyMatrices(k_OKLab__to__LMS_3, arrAB);

    let arrLms_3, arrLms, arrLms_dS, arrLms_dS2;
    let arrDLms, arrF;
    {
       arrLms_3 = arrKLms.map(e => 1 + S*e);
       arrLms = arrLms_3.map(e => e **3);

       arrLms_dS  = arrKLms.map(e => 3 * e * ((1 + S*e) ** 2) );
       arrLms_dS2 = arrKLms.map(e => 6 * (e**2) * (1 + S*e));

       arrDLms = [arrLms, arrLms_dS, arrLms_dS2];
       arrF = multiplyMatrices(arrDLms, arrWLms);

       S = S - arrF[0] * arrF[1] / (arrF[1]**2 - 0.5 * arrF[0] * arrF[2]);
    }

    return S;
}


export function findMaxSaturationOrgn(aOklabNrm, bOklabNrm) {
    // Max saturation will be when one of r, g or b goes below zero.

    // Select different coefficients depending on which component goes below zero first
    let k0, k1, k2, k3, k4, wl, wm, ws;

    if (-1.88170328 * aOklabNrm - 0.80936493 * bOklabNrm > 1) {
        // Red component
        k0 = 1.19086277; k1 = 1.76576728; k2 = 0.59662641; k3 = 0.75515197; k4 = 0.56771245;
        wl = 4.0767416621; wm = -3.3077115913; ws = 0.2309699292;
    }
    else if (1.81444104 * aOklabNrm - 1.19445276 * bOklabNrm > 1) {
        // Green component
        k0 = 0.73956515; k1 = -0.45954404; k2 = 0.08285427; k3 = 0.12541070; k4 = 0.14503204;
        wl = -1.2684380046; wm = 2.6097574011; ws = -0.3413193965;
    }
    else {
        // Blue component
        k0 = 1.35733652; k1 = -0.00915799; k2 = -1.15130210; k3 = -0.50559606; k4 = 0.00692167;
        wl = -0.0041960863; wm = -0.7034186147; ws = 1.7076147010;
    }

    // Approximate max saturation using a polynomial:
    let S = k0 + k1 * aOklabNrm + k2 * bOklabNrm + k3 * aOklabNrm * aOklabNrm + k4 * aOklabNrm * bOklabNrm;

    // Do one step Halley's method to get closer
    // this gives an error less than 10e6, except for some blue hues where the dS/dh is close to infinite
    // this should be sufficient for most applications, otherwise do two/three steps

    let k_l = +0.3963377774 * aOklabNrm + 0.2158037573 * bOklabNrm;
    let k_m = -0.1055613458 * aOklabNrm - 0.0638541728 * bOklabNrm;
    let k_s = -0.0894841775 * aOklabNrm - 1.2914855480 * bOklabNrm;

    {
        let l_ = 1 + S * k_l;
        let m_ = 1 + S * k_m;
        let s_ = 1 + S * k_s;

        let l = l_ * l_ * l_;
        let m = m_ * m_ * m_;
        let s = s_ * s_ * s_;

        let l_dS = 3 * k_l * l_ * l_;
        let m_dS = 3 * k_m * m_ * m_;
        let s_dS = 3 * k_s * s_ * s_;

        let l_dS2 = 6 * k_l * k_l * l_;
        let m_dS2 = 6 * k_m * k_m * m_;
        let s_dS2 = 6 * k_s * k_s * s_;

        let f  = wl * l     + wm * m     + ws * s;
        let f1 = wl * l_dS  + wm * m_dS  + ws * s_dS;
        let f2 = wl * l_dS2 + wm * m_dS2 + ws * s_dS2;

        S = S - f * f1 / (f1*f1 - 0.5 * f * f2);
    }

    return S;
}