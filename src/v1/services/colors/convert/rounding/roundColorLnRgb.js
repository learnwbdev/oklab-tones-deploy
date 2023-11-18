/**
 * Round up linear RGB color to a given precision (sRGB, Display P3 linear color)
 * @param {*} colorLinRgb - original linear RGB color to round up
 * @param {*} [mpPrcLnRgb = 5] as 0..17 (integer) - precision for r, g, b in linear RGB color (red, green and blue color components)
 * @return {number[] | undefined[]} rounded linear RGB color
 */

export function roundColorLnRgb(colorLinRgb, {mpPrcLnRgb = 5} = {}) {
    const prcLnRgb = 10 ** mpPrcLnRgb; // precision for red, green and blue color component

    return colorLinRgb.map(val => Math.round(val * prcLnRgb + Number.EPSILON) / prcLnRgb + 0); // `+ 0` to make -0 to +0
}