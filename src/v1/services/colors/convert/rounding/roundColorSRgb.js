/**
 * Round up sRGB color to a given precision
 * @param {*} colorSRgb - original sRGB color to round up
 * @param {*} [mpPrcSRgb = 0] as 0..17 (integer) - precision for r, g, b in sRGB color (red, green and blue color components)
 * @return {number[] | undefined[]} rounded sRGB color
 */

export function roundColorSRgb(colorSRgb, {mpPrcSRgb = 0} = {}) {
    const prcSRgb = 10 ** mpPrcSRgb; // precision for red, green and blue color component

    return colorSRgb.map( val => ( Math.round(val * prcSRgb + Number.EPSILON) / prcSRgb ) + 0 ); // `+ 0` to make -0 to +0 (https://stackoverflow.com/questions/7223359/are-0-and-0-the-same)
}