/**
 * Correct Oklch Lightness (corrected L, C, H) to correspond to lightness of gray color [L, 0, 0]
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
 * @return {number[]} Array of OKLch values with corrected Lightness: L as 0..1, C as 0.. , H as 0..360 (360 excluded)
 */

import { multiplyMatrices } from "../utils/multiplyMatrices.js";
import { LMS_Oklab__to__XYZ_D65, OKLab__to__LMS_3 } from "../matrices/colorMatrices.js";
import { convertColor } from "../convert/convertColor.js";
import { colorSpaces } from "../convert/colorSpaces.js";
import { solveOklchLightnFromCubicEq } from "../utils/solveOklchLightnFromCubicEq.js";

/*
    1. [L, a, b] = [L, C*cos(h), C*sin(h)], h - H in radians, -from the definition of Oklab color space
    2. [l`, m`, s`] = OKLab__to__LMS_3 . [L, a, b], - matrix multiplication, from the definition of Oklab color space
       Because values in the first column of the matrix OKLab__to__LMS_3 = 1:
       l` = L + OKLab__to__LMS_3[0][1] * a + OKLab__to__LMS_3[0][2] * b   (similar m`, s`, change [0] to [1] and [2] accordingly)
       l` = L + OKLab__to__LMS_3[0][1] * C*cos(h) + OKLab__to__LMS_3[0][2] * C*sin(h), h - H in radians, (similar m`, s`)
       l` = L + C * ( OKLab__to__LMS_3[0][1] * cos(h) + OKLab__to__LMS_3[0][2] * sin(h) )

       aNrm = cos(h),  (a / C if C !== 0, a / 0.00001 if C = 0 )
       bNrm = sin(h),  (b / C if C !== 0, b / 0.00001 if C = 0 )
       l` = L + C * ( OKLab__to__LMS_3[0][1] * aNrm + OKLab__to__LMS_3[0][2] * bNrm )
       l` = L + C * dLms[0], where dLms[0] = OKLab__to__LMS_3[0][1] * aNrm + OKLab__to__LMS_3[0][2] * bNrm
       dLms[1], dLms[2] - similar for m` amd s`

       l` = L + C * dLms[0]
       m` = L + C * dLms[1]
       s` = L + C * dLms[2]

    3. [l, m, s] = [l` ** 3, m` ** 3, s` ** 3 ] - from the definition of Oklab color space
       l = l` ** 3 = ( L + C * dLms[0] ) ** 3
       m = m` ** 3 = ( L + C * dLms[1] ) ** 3
       s = s` ** 3 = ( L + C * dLms[2] ) ** 3

    4. [X, Y, Z] = LMS_Oklab__to__XYZ_D65 . [l, m, s] - from the definition of Oklab color space

    5. Lightness for Oklch color should correspond to lightness of gray Oklch color [L, 0, 0],
       so that when we transform color [L, C, H] to grayscale it would make color [L, 0, 0] (should be the same gray color)
       Y = L ** 3 for color [L, 0, 0], because sum of values in the second row of the matrix LMS_Oklab__to__XYZ_D65 equals = 1
       But color Oklch [L, C, H] doesn't give precise lightness Y = L ** 3 ( it's similar, but not the same)

    6. So to correct LIghtness for color [L, C, H] to form a new color [L_new, C, H],
       we find Y in terms of L_new with a given C and H
       and equals it to Y_tg (Y target), that is L ** 3.

    7. Found solutions for a cubic equation are filtered to be >= 0, because L is >= 0.
       Than it's found L_new within the solutions that has the smallest difference with the original L

    8. New Oklch color [L_new, C, H] than fits in gamut (sRgb or Display P3).
       For hue H and its nearby hues (+- 0.7) C (chroma) is clipped to gamut.
       Find color with the smallest difference of clipped Chroma with the original Chroma

*/

export function correctLightnOklchToGrayLightn(colorOklch) {
    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);
    // min difference between Y to not be different gray color in sRGB (for dark colors it's smaller (differnce), for lighter colors it could be bigger)
    const Ytolerance = 2 ** (-13);  // ~ 0.000122 (more precise when tolerance is in binary) https://dev.to/alldanielscott/how-to-compare-numbers-correctly-in-javascript-1l4i

    let [L, C, H] = colorOklch;

    // find target Y corresponding to gray color [L, 0, 0]
    // let Ytg = convertColor([L, 0, 0], colorSpaces.Oklch, colorSpaces.XYZ)[1];  // = L ** 3
    // let colorRgbTg = convertColor([L, 0, 0], colorSpaces.Oklch, colorSpaces.sRgb);
    // Ytg = convertColor(colorRgbTg, colorSpaces.sRgb, colorSpaces.XYZ)[1];
    let Ytg = L ** 3;
    // find current Y
    let Ycr = convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.XYZ)[1];

    // don't change L if Y is within tolerance level
    if (Math.abs(Ytg - Ycr) <= Ytolerance) return colorOklch;

    // `mp` - multipliers
    const Lms_3_mp = OKLab__to__LMS_3.map(row => row.slice(1)); // only last two columns of the matrix ( for a, b )
    const Y_mp = LMS_Oklab__to__XYZ_D65[1]; // only second row of the matrix ( for Y )

    let aNrm = Math.cos(toRadians(H)); // a / C (Chroma)
    let bNrm = Math.sin(toRadians(H)); // b / C (Chroma)
    let AB_Norm = [aNrm, bNrm];
    let dLms = multiplyMatrices(Lms_3_mp, AB_Norm); // coefficients for Chroma in l', m', s'. Ex: l' = L + dLms[0] * C
    let dLms_s2 = dLms.map(c => c ** 2); // ** 2, coefficients for Chroma ** 2
    let dLms_s3 = dLms.map(c => c ** 3); // ** 3, coefficients for Chroma ** 3

    // coefficients in the formula for Y: Y = L ** 3 + k_C_L2 * C * L ** 2 + k_C2_L * C ** 2 * L + k_C3 * C ** 3
    // coefficient for C ** 3
    let k_C3 = multiplyMatrices(Y_mp, dLms_s3)[0];
    // coefficient for C ** 2 * L
    let k_C2_L = 3 * multiplyMatrices(Y_mp, dLms_s2)[0];
    // coefficient for C * L ** 2
    let k_C_L2 = 3 * multiplyMatrices(Y_mp, dLms)[0];
    let k = [k_C_L2, k_C2_L, k_C3];

    let mC = [C, C ** 2, C ** 3];

    let kC = mC.map((v, i) => v * k[i]); // coefficient for L

    // solve cubic equation for L: L**3 + kC[0] * L**2 + kC[1] * L + ( kC[2] - Ytg ) = 0
    // solutions: z1 >= z2 >= z3 that are greater or equal than zero and smaller than 1 (because L sould be in the interval [0, 1])
    // plus one additional solution if rq === 0
   //  let arrSolL_all = solveCubicEquationForL(kC[0], kC[1], kC[2] - Ytg);
    let L_new = solveOklchLightnFromCubicEq(kC[0], kC[1], kC[2] - Ytg);

   //  let arrSolL = arrSolL_all.filter(v => v >= 0 && v <=1);
   //  let L_new = L;
   //  if (arrSolL.length === 1) {           // only one solution
   //    L_new = arrSolL[0];
   //  }
   //  else if (arrSolL.length === 0) {
   //    L_new = arrSolL_all[0] > 1 ? 1 : 0; // clip solution to 0 or 1
   //  }
   //  else {                                // several solutions
   //    // let deltaL = arrSolL.map(Lnew => Math.abs(Lnew - L)); // min difference between L original and L new
   //    let deltaL = arrSolL.map(Lnew => Math.abs(Lnew ** 3 + kC[0] * Lnew ** 2 + kC[1] * Lnew + kC[2] - Ytg)); // better solution to match Ytg (should be equal zero or be near zero)
   //    let minDelta = Math.min(...deltaL);
   //    let idxMinDelta = deltaL.indexOf(minDelta);
   //    L_new = arrSolL[idxMinDelta];
   //  }

    let colorOklchCorrL = [L_new, C, H];
    return colorOklchCorrL;
}