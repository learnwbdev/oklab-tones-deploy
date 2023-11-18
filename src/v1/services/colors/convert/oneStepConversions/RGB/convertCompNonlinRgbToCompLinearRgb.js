// Convert non-linear component of RGB color (sRGB or Display P3) to linear component of RGB color (sRGB or Display P3) - color in the result could be outside of the sRGB or display P3 gamut
/**
 * @param {number} compNonlnRgb - non-linear RGB value (r og g or b) as 0..1
 * @return {number} Linear RGB value (r og g or b) as 0..1 (gamma corrected form)
 */

export function convertCompNonlinRgbToCompLinearRgb(compNonlnRgb) {
    /* sources:
                https://bottosson.github.io/posts/colorwrong/#what-can-we-do%3F
                https://entropymine.com/imageworsener/srgbformula/
                https://github.com/w3c/wcag/issues/360#issuecomment-419199254    (about 0.04045)
                https://www.w3.org/TR/css-color-4/#color-conversion-code
    */
    const compLnRgb = ( compNonlnRgb > 0.04045 ) ? ((compNonlnRgb + 0.055)/(1 + 0.055)) ** 2.4
                                                 : compNonlnRgb / 12.92;
    return compLnRgb;
 };