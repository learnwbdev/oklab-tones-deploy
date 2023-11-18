// Find intersection of the line to project color along with the sRGB gamut
/**
 * @param {number} appxL as 0..1 - approximate clipped Lightness of the Oklch color, that we need project to sRGB gamut
 * @param {number} appxC as 0.. (unbounded) -  approximate clipped Chroma of the original Oklch color, that we need project to sRGB gamut
 * @param {number} origH as 0..360 (360 excluded) - original Hue for Oklch color
 * @param {number} L0prj as 0..1 - Lightness point toward which we project the color
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @param {number} [mpPrcL = 5] as 0..17 - precision for Lightness as integer number 0..17 (digit after decimal point to round Lightness)
 * @param {number} [mpPrcC = 5] as 0..17 - precision for Chroma as integer number 0..17 (digit after decimal point to round Chroma)
 * @return {number} Array of Oklch values for the (L, C) point in sRGB gamut for a given Hue
 */

import { colorSpaces } from "../convert/colorSpaces.js";
import { checkColorInGamut } from "../gamutMapping/checkColorInGamut.js";

export function clipLcAlongPrjLine(appxL, appxC, origH, L0prj, {colorSpaceGamut = colorSpaces.sRgb, mpPrcL = 5, mpPrcC = 5}) {
    const prcL = 10 ** mpPrcL; // precision for Lightness
    const prcC = 10 ** mpPrcC; // precision for Chroma
    const precision = prcC ** (-1); // difference between found Chroma

    // return projection point if appxC = 0
    if (appxC === 0) return [L0prj, 0, origH];

    // equation for the projection line along which we clip chroma and lightness to sRGB gamut
    // line between points (L0prj, 0) and (appxL, appxC)
    const prjLineAlong = (C) => {
        // calculate Lightness for the projection line for a given Chroma C
        let L = ((appxL - L0prj) / appxC) * C + L0prj;
        return L;
    }

    let minChroma = 0;
    let maxChroma = appxC;
    let midChroma, lightn;
    // `+ Number.EPSILON` is needed to not make it infinite loop because of ex.: 0.076-0.075 -> 0.0010000000000000009 > 0.001
    while ((maxChroma - minChroma) > precision + Number.EPSILON) {
        midChroma = (minChroma + maxChroma)/2;
        lightn = prjLineAlong(midChroma);

        // round Chroma to precision (`prcC` defined to not get 1.0010000000000001 instead of 1.001)
        // Number.EPSILON for correct rounding of numbers like 1.0005 (source: https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary)
        midChroma = Math.round((midChroma + Number.EPSILON) * prcC) / prcC;
        // round Lightness to a given precision prcL
        lightn = Math.round((lightn + Number.EPSILON) * prcL) / prcL;
        if (checkColorInGamut([lightn, midChroma, origH], colorSpaces.Oklch, colorSpaceGamut)) {
            minChroma = midChroma;
        } else {
            maxChroma = midChroma;
        }
    }

    return [lightn, minChroma, origH];
}