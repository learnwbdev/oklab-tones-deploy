// round up Oklab color values to a given precisions

/**
 * Round up Oklab color values to a given precisions
 * @param {*} colorOklab - original Oklab color to round up
 * @param {number} [mpPrcL = 5] as 0..17 (integer)  - precision for Lightness in Oklab color (digit after decimal point to round Lightness)
 * @param {number} [mpPrcAb = 5] as 0..17 (integer) - precision for *a and *b in Oklab (digit after decimal point to round *a, *b)
 * @return {number[] | undefined[]} rounded Oklab color
 */

export function roundColorOklab(colorOklab, { mpPrcL = 5, mpPrcAb = 5 } = {}) {
    const prcL = 10 ** mpPrcL; // precision for Lightness
    const prcAb = 10 ** mpPrcAb; // precision for *a and *b from Oklab

    return colorOklab.map((val, idx) =>
            idx === 0 ? Math.floor((val + Number.EPSILON) * prcL ) / prcL + 0 :  // `+ 0` to convert -0 to +0
            Math.round((val + Number.EPSILON) * prcAb ) / prcAb + 0
    );
}