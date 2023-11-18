// Find maximum Chroma for given Oklch color, when JND < 0.02 (just noticeable difference)
// color with this Chroma could be out of sRGB gamut,
// because found Chroma used to make other tones of this color (Chroma would be the same if all tones would be in sRGB gamut)
// so we need to find its' maximum Chroma in Oklch space, not in sRGB
/**
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @param {boolean} [isDeltaE2000 = false] -flag to use DeltaE2000 instead of DeltaEOk to find color difference between two colors
 * @param {number} [mpPrcC = 5] - digit after decimal point to round Chroma
 * @param {number} [maxChroma = 0.4] - maximum limit for Chroma to search maximum Chroma for a given colorOklch
 * @param {number} [jndDeltaE2000 = 0.2] - just noticeable difference (between two colors) for DeltaE2000. Default: 0.2
 * @param {number} [jndDeltaEOk = 0.002] - just noticeable difference (between two colors) for DeltaEOk. Default: 0.002
 * @return {number} maximum Chroma with the same perceived color C 0..0.4 (maxChroma) - could be out of
 */

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";
import { fitOklchChromaToGamut } from "../gamutMapping/fitOklchChromaToGamut.js";
import { deltaEOK } from "../distance/deltaEOK.js";
import { deltaE2000 } from "../distance/deltaE2000.js";

export function findMaxChroma(colorOklch, colorSpaceGamut = colorSpaces.sRgb,
    {isDeltaE2000 = true, mpPrcC = 5, maxChroma = 0.4, jndDeltaE2000 = 0.2, jndDeltaEOk = 0.002} = {}) {
    // function to convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    // function to round up number (num) to precision (prc)
    // Number.EPSILON for correct rounding of numbers like 1.0005 (source: https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary)
    const rndTo = (num, prc)  => Math.round((num + Number.EPSILON) * prc) / prc + 0;

    // precision for the Chroma
    // const mpPrcC = 3; // Ex. for rounded value: 0.091
    const prcC = 10 ** mpPrcC; // precision for Chroma
    const precision = 10 ** (-1*mpPrcC); // difference between found Chroma

    // precision for JND
    const mpPrcJnd = isDeltaE2000 ? 1 : 3; // precision for JND (just noticeable difference for colors)
    const prcJnd = 10 ** mpPrcJnd; // would give 0.1 for DeltaE2000, 0.001 for DeltaEOk

    const jnd = isDeltaE2000 ? jndDeltaE2000 : jndDeltaEOk;

    // find minimum Chroma in gamut for a given color
    const colorOklchMin = fitOklchChromaToGamut(colorOklch, colorSpaceGamut, mpPrcC);
    let [origL, minChroma, origH] = colorOklchMin;

    let midChroma = minChroma;

    // find colorOklab as reference color to find distance between colors
    const colorOklabMin = convertColor(colorOklchMin, colorSpaces.Oklch, colorSpaces.Oklab, {isRound: false});
    // Hue remains the same, so these parts don't need recalculation for color conversion to OKlab
    // (without Chroma multiplication)
    const adash = Math.cos(toRadians(origH));
    const bdash = Math.sin(toRadians(origH));

    // `+ Number.EPSILON` is needed to not make it infinite loop because of ex.: 0.076-0.075 -> 0.0010000000000000009 > 0.001
    while ((maxChroma - minChroma) > precision + Number.EPSILON) {
        midChroma = (minChroma + maxChroma)/2;
        // round Chroma to precision (`prcC` defined to not get 1.0010000000000001 instead of 1.001)
        midChroma = rndTo(midChroma, prcC);
        let colorOklabSample = [origL, midChroma * adash, midChroma * bdash]

        // find distance between colors colorOklabMin and colorOklabSample with deltaEOK or DeltaE2000 algorithm
        let deltaE = isDeltaE2000 ? deltaE2000(colorOklabMin, colorOklabSample, colorSpaces.Oklab)
                                  :   deltaEOK(colorOklabMin, colorOklabSample, colorSpaces.Oklab);
        deltaE = rndTo(deltaE, prcJnd); // round distance for better compare of the colors with Jnd

        if (deltaE < jnd) {
            minChroma = midChroma;
        } else {
            maxChroma = midChroma;
        }
    }

    return minChroma; // maximum Chroma with jnd < 0.002 for DeltaEOk or jnd < 0.2 for DeltaE2000 (or input value `jnd`)
}