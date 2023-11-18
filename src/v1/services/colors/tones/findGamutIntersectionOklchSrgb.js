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
*/

// Find intersection of the line to project color along with the sRGB gamut
/**
 * @param {number} aOklab as -1..1 - a for Oklab color (how green/red the color is)
 * @param {number} bOklab as -1..1 - b for Oklab color (how blue/yellow the color is)
 * @param {number} L1orgc as 0..1 - Lightness of the original Oklch color, that we project to sRGB gamut
 * @param {number} C1orgc as 0.. (unbounded) - Chroma of the original Oklch color, that we project to sRGB gamut
 * @param {number} L0prj as 0..1 - Lightness point toward which we project the color
 * @return {number} coefficient t of the line L = L0 * (1 - t) + t * L1
 */

import { LMS__to__lin_sRGB, OKLab__to__LMS_3 } from "../matrices/colorMatrices.js";
import { multiplyMatrices } from "../utils/multiplyMatrices.js";
import { findOklabLCCuspPoint } from "./findOklabLCCuspPoint.js";

// Find intersection of the line to project color along with the sRGB gamut
// Find intersection of the line defined by
// L = L0 * (1 - t) + t * L1;
// C = t * C1;
// a and b must be normalized so a^2 + b^2 == 1

export function findGamutIntersectionOklchSrgb(aOklabNrm, bOklabNrm, L1orgc, C1orgc, L0prj) {
	// Find the cusp of the gamut triangle
	const [Lcusp, Ccusp] = findOklabLCCuspPoint(aOklabNrm, bOklabNrm);

	// Find the intersection for upper and lower half separately
	let tCoeff;

	// (((L1 - L0) * cusp.C - (cusp.L - L0) * C1) <= 0)
    if (((L1orgc - L0prj) * Ccusp - (Lcusp - L0prj) * C1orgc) <= 0 - Number.EPSILON) {
		// Lower half
		// t = cusp.C * L0 / (C1 * cusp.L + cusp.C * (L0 - L1))
		tCoeff = Ccusp * L0prj / (C1orgc * Lcusp + Ccusp * (L0prj - L1orgc));
	}
	else {
		// Upper half

		// First intersect with the sRGB gamut triangle for a given Hue
		// t = cusp.C * (L0 - 1) / (C1 * (cusp.L - 1) + cusp.C * (L0 - L1))
		tCoeff = Ccusp * (L0prj - 1) / (C1orgc * (Lcusp - 1) + Ccusp * (L0prj - L1orgc));

		// Array of values aOklabNrm, bOklabNrm
		const arrAB = [aOklabNrm, bOklabNrm];
		// get matrix without first column from matrix OKLab__to__LMS_3
		const k_OKLab__to__LMS_3 = OKLab__to__LMS_3.map(row => row.slice(1));

		// Then one step Halley's method
		let deltaL, deltaC;
		let arrKLms, arrLmsDt_dash;
		let L, C;
		let arrLms_3, arrLms, arrLms_dt, arrLms_dt2;
		let arrDtLms, arrDtRgb, arrR, arrG, arrB, arrUrgb, arrRgb, arrTrgb;
		{
			deltaL = L1orgc = L0prj;
			deltaC = C1orgc;

			arrKLms = multiplyMatrices(k_OKLab__to__LMS_3, arrAB);
			arrLmsDt_dash = arrKLms.map(e => deltaL + deltaC * e);

			// If higher accuracy is required, 2 or 3 iterations of the following block can be used:
			{
				L = L0prj * (1 - tCoeff) + tCoeff * L1orgc;
				C = tCoeff * C1orgc;

				arrLms_3 = arrKLms.map(e => L + C*e);
				arrLms = arrLms_3.map(e => e ** 3);

                arrLms_dt  = arrLmsDt_dash.map((e, idx) => 3 * e * (arrLms_3[idx] ** 2) );
                arrLms_dt2 = arrLmsDt_dash.map((e, idx) => 6 * (e **2) * arrLms_3[idx] );

				arrDtLms = [arrLms, arrLms_dt, arrLms_dt2];

				// arrR = multiplyMatrices(arrDtLms, LMS__to__lin_sRGB[0]); // red component
				// arrG = multiplyMatrices(arrDtLms, LMS__to__lin_sRGB[1]); // green component
				// arrB = multiplyMatrices(arrDtLms, LMS__to__lin_sRGB[2]); // blue component

				// red, green, blue components [arrR, arrG, arrB]
				arrDtRgb = LMS__to__lin_sRGB.map(arrE => multiplyMatrices(arrDtLms, arrE));
				// subtract 1 from r, g, b values
				arrDtRgb.map(arrComp => arrComp[0] -= 1);

                arrUrgb = arrDtRgb.map(arrE => arrE[1] / (arrE[1] ** 2 - 0.5 * arrE[0] * arrE[2]) );
				arrRgb = arrDtRgb.map(arrComp => arrComp[0]); // only r, g, b values
				arrTrgb = arrUrgb.map((u, idx) => -arrRgb[idx] * u); // Ex: t_r = -r * u_r

				arrTrgb = arrTrgb.map((t,  idx) => arrUrgb[idx] >= 0 ? t : Number.MAX_VALUE);

				tCoeff += Math.min(...arrTrgb); // min(t_r, min(t_g, t_b))
			}
		}
	}

	return tCoeff;
}

// without matrices, from the original code
export function findGamutIntersectionOklchSrgb_Orig(aOklabNrm, bOklabNrm, L1orgc, C1orgc, L0prj) {
	// Find the cusp of the gamut triangle
	const [Lcusp, Ccusp] = findOklabLCCuspPoint(aOklabNrm, bOklabNrm);

	// Find the intersection for upper and lower half separately
	let tCoeff;

	// (((L1 - L0) * cusp.C - (cusp.L - L0) * C1) <= 0)
    if (((L1orgc - L0prj) * Ccusp - (Lcusp - L0prj) * C1orgc) <= 0 - Number.EPSILON) {
		// Lower half
		// t = cusp.C * L0 / (C1 * cusp.L + cusp.C * (L0 - L1))
		tCoeff = Ccusp * L0prj / (C1orgc * Lcusp + Ccusp * (L0prj - L1orgc));
	}
	else {
		// Upper half

		// First intersect with the sRGB gamut triangle for a given Hue
		// t = cusp.C * (L0 - 1) / (C1 * (cusp.L - 1) + cusp.C * (L0 - L1))
		tCoeff = Ccusp * (L0prj - 1) / (C1orgc * (Lcusp - 1) + Ccusp * (L0prj - L1orgc));


		// Then one step Halley's method
		{
			let deltaL = L1orgc = L0prj;
			let deltaC = C1orgc;

			let k_l = +0.3963377774 * aOklabNrm + 0.2158037573 * bOklabNrm;
			let k_m = -0.1055613458 * aOklabNrm - 0.0638541728 * bOklabNrm;
			let k_s = -0.0894841775 * aOklabNrm - 1.2914855480 * bOklabNrm;

			let l_dt = deltaL + deltaC * k_l;
			let m_dt = deltaL + deltaC * k_m;
			let s_dt = deltaL + deltaC * k_s;

			// If higher accuracy is required, 2 or 3 iterations of the following block can be used:
			// for (let i = 0; i < 3; i++)
			{
				let L = L0prj * (1 - tCoeff) + tCoeff * L1orgc;
				let C = tCoeff * C1orgc;

				let l_ = L + C * k_l;
				let m_ = L + C * k_m;
				let s_ = L + C * k_s;

				let l = l_ * l_ * l_;
				let m = m_ * m_ * m_;
				let s = s_ * s_ * s_;

				let ldt = 3 * l_dt * l_ * l_;
				let mdt = 3 * m_dt * m_ * m_;
				let sdt = 3 * s_dt * s_ * s_;

				let ldt2 = 6 * l_dt * l_dt * l_;
				let mdt2 = 6 * m_dt * m_dt * m_;
				let sdt2 = 6 * s_dt * s_dt * s_;

				let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s - 1;
				let r1 = 4.0767416621 * ldt - 3.3077115913 * mdt + 0.2309699292 * sdt;
				let r2 = 4.0767416621 * ldt2 - 3.3077115913 * mdt2 + 0.2309699292 * sdt2;

				let u_r = r1 / (r1 * r1 - 0.5 * r * r2);
				let t_r = -r * u_r;

				let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s - 1;
				let g1 = -1.2684380046 * ldt + 2.6097574011 * mdt - 0.3413193965 * sdt;
				let g2 = -1.2684380046 * ldt2 + 2.6097574011 * mdt2 - 0.3413193965 * sdt2;

				let u_g = g1 / (g1 * g1 - 0.5 * g * g2);
				let t_g = -g * u_g;

				let b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s - 1;
				let b1 = -0.0041960863 * ldt - 0.7034186147 * mdt + 1.7076147010 * sdt;
				let b2 = -0.0041960863 * ldt2 - 0.7034186147 * mdt2 + 1.7076147010 * sdt2;

				let u_b = b1 / (b1 * b1 - 0.5 * b * b2);
				let t_b = -b * u_b;

				t_r = u_r >= 0 ? t_r : Number.MAX_VALUE;
				t_g = u_g >= 0 ? t_g : Number.MAX_VALUE;
				t_b = u_b >= 0 ? t_b : Number.MAX_VALUE;

				tCoeff += Math.min(t_r, Math.min(t_g, t_b));
			}
		}
	}

	return tCoeff;
}