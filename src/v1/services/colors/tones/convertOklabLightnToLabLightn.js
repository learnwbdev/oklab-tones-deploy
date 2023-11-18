// Convert Lightness from Oklab / OKlch to CIELab / CIELch Lightness
/**
 * Convert Lightness from Oklab / OKlch to CIELab / CIELch Lightness
 * @param {number}  oklabLightn - as 0..1, (L component/coordinate) Lightness in Oklch/Oklab color space
 * @param {number}  [mpPrcL = 5] - as integer number 0..17, precision for Lightness (digit after decimal point to round Lightness)
 * @param {boolean} [isRound = true] - flag to round the converted lightness
 * @return {number} CIELch/CIELab Lightness as 0..100
 */

export function convertOklabLightnToLabLightn(oklabLightn, {mpPrcL = 3, isRound = true} = {}) {
    // precision for the Lightness
    const prcL = 10 ** mpPrcL;

    // kappa & epsilon from CIELab <-> CIEXYZ conversion
    // epsilon (ε)
    // const eps = 216 / 24389;    // (6 / 29) ^ 3, epsilon
    const eps_3 = 6 / 29;       // cube root of eps
    const kappa = 24389 / 27;   // (29 / 3) ^ 3

    let labLightn = oklabLightn > eps_3 ? (116 * oklabLightn) - 16 : kappa * (oklabLightn ** 3);

    // round up lightness in Lab if `isRound` = true
    labLightn = isRound ? Math.round( labLightn * prcL + Number.EPSILON ) / prcL : labLightn;

    return labLightn;
}