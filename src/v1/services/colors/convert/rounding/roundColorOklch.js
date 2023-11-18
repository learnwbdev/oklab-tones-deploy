// round up Oklch color values to a given precisions

/**
 * Round up Oklch color values to a given precisions
 * @param {*} colorOklch - original Oklch color to round up
 * @param {number} [mpPrcL = 5] as 0..17 (integer)  - precision for Lightness in Oklch color (digit after decimal point to round Lightness)
 * @param {number} [mpPrcC = 5] as 0..17 (integer)  - precision for Chroma in Oklch color (digit after decimal point to round Chroma)
 * @param {number} [mpPrcH = 2] as 0..17 (integer)  - precision for Hue in Oklch color (digit after decimal point to round Hue)
 * @return {number[] | undefined[]} rounded Oklch color
 */

export function roundColorOklch(colorOklch, { mpPrcL = 5, mpPrcC = 5, mpPrcH = 2 } = {}) {
    const prcL = 10 ** mpPrcL; // precision for Lightness
    const prcC = 10 ** mpPrcC; // precision for Chroma
    const prcH = 10 ** mpPrcH; // precision for Hue

    return colorOklch.map(
        (val, idx) =>
          idx === 0 ? Math.floor((val + Number.EPSILON) * prcL ) / prcL + 0 : // `+ 0` to convert -0 to +0
          idx === 1 ? Math.floor((val + Number.EPSILON) * prcC ) / prcC + 0 :
          idx === 2 ? Math.round((val + Number.EPSILON) * prcH ) / prcH + 0 :
          val // for CAM16 additional values
        );
}