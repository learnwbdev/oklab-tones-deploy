// Calculate Contrast Ratio
/**
 * @param {number} luminanceColor1 - Relative Luminance of the First color as 0..1 (Y in XYZ color space for D65 white point)
 * @param {number} luminanceColor2 - Relative Luminance of the Second color as 0..1 (Y in XYZ color space for D65 white point)
 * @param {number} [mpPrcCR = 2] as 0..17 (integer)  - precision for Contrast Ratio (digit after decimal point to round Contrast Ratio)
 * @return {number} Contrast ratio as 1 .. 21
 */
export function contrastRatio(luminanceColor1, luminanceColor2, {mpPrcCR = 2} = {}) {
    /* source:
               https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
    */
    const prcCR = 10 ** mpPrcCR; // precision for for the contrast ratio

    // the relative luminance of the lighter of the colors
    const L1 = Math.max(luminanceColor1, luminanceColor2);
    // the relative luminance of the darker of the colors
    const L2 = Math.min(luminanceColor1, luminanceColor2);

    const contrastRatio = (L1 + 0.05)/(L2 + 0.05);
    // Number.EPSILON for correct rounding of numbers like 1.0005 (source: https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary)
    return Math.round((contrastRatio + Number.EPSILON) * prcCR) / prcCR + 0;
}