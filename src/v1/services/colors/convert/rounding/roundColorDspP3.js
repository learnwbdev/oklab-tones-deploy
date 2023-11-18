/**
 * Round up Display P3 (RGB) color to a given precision
 * @param {*} colorDspP3 - original linear RGB color to round up
 * @param {*} [mpPrcDspP3 = 4] as 0..17 (integer) - precision for r, g, b in Display P3 RGB color (red, green and blue color components)
 * @return {number[] | undefined[]} rounded Display P3 (RGB) color
 */

export function roundColorDspP3(colorDspP3, {mpPrcDspP3 = 4} = {}) {
    const prcDspP3 = 10 ** mpPrcDspP3; // precision for red, green and blue color component

    return colorDspP3.map(val => Math.round(val * prcDspP3 + Number.EPSILON) / prcDspP3 + 0); // `+ 0` to make -0 to +0
}