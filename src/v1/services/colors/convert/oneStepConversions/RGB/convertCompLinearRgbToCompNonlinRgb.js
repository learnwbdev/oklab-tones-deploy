// Convert linear component of RGB color (sRGB or Display P3) to non-linear component of RGB color (sRGB or Display P3) - color in the result could be outside of the sRGB or display P3 gamut
/**
 * @param {number} compLnRgb - linear RGB value (r og g or b) as 0..1 (gamma corrected form)
 * @return {number} Non-linear RGB value (r og g or b) as 0..1
 */

export function convertCompLinearRgbToCompNonlinRgb(compLnRgb) {
    /* sources:
                https://bottosson.github.io/posts/colorwrong/#what-can-we-do%3F
                https://entropymine.com/imageworsener/srgbformula/
                https://www.w3.org/TR/css-color-4/#color-conversion-code
    */
    const compNonlnRgb = ( compLnRgb > 0.0031308 ) ? (1.055) * (compLnRgb ** (1.0/2.4)) - 0.055
                                                     : 12.92 * compLnRgb;

    return compNonlnRgb;
 };