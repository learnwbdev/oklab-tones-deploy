// Convert Lightness from CIELab / CIELch to Oklab / OKlch Lightness
/**
 * Convert Lightness from CIELab / CIELch to Oklab / OKlch Lightness
 * @param {number} labLightn - as 0..100, (L component/coordinate) Lightness in LCH/LAB color space
 * @param {number} [mpPrcL = 5] - as integer number 0..17, precision for Lightness (digit after decimal point to round Lightness)
 * @param {boolean} [isRound = true] - flag to round the converted lightness
 * @return {number} Oklch/Oklab Lightness as 0..1
 */

export function convertLabLightnToOklabLightn(labLightn, {mpPrcL = 5, isRound = true} = {}) {
    // precision for the Lightness
    const prcL = 10 ** mpPrcL;

    // kappa & epsilon from CIELab <-> CIEXYZ conversion
    // epsilon (ε)
    // const eps = 216 / 24389;    // (6 / 29) ^ 3, epsilon
    // const eps_3 = 6 / 29;       // cube root of eps
    // const kappa = 24389 / 27;   // (29 / 3) ^ 3
    // const kappa_3 = 29 / 3;     // cube root of kappa
    const kappa_3_inv = 3 / 29; // (cube root of kappa) ** (-1)
    const kappaEps = 8;         // kappa * eps = 8

    let oklabLightn = labLightn > kappaEps ? (labLightn + 16) / 116 : kappa_3_inv * Math.cbrt(labLightn);  // or Math.cbrt(labLightn / kappa)
    // round up lightness in Oklab if `isRound` = true
    oklabLightn = isRound ? Math.round(oklabLightn * prcL + Number.EPSILON) / prcL : oklabLightn;

    return oklabLightn;
}