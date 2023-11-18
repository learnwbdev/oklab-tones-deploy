// Because Oklab does not suffer from the hue linearity,
// hue uniformity, and chroma non-linearities of CIE Lab,
// the color difference metric does not need to correct for them
// and so is simply the Euclidean distance in Oklab color space.

/* source:
            https://www.w3.org/TR/css-color-4/#color-difference-OK
*/

/**
 * Calculate color difference deltaE OK using OKlab coordinates, simple root sum of squares (as deltaE1976 only for Oklab color space)
 * @param {number[] | string} colorReference - Array of values for the color or HEX string. For CIE Oklab: L as 0..1, a and b as -1..1
 * @param {number[] | string} colorSample - Array of values for the color or HEX string. For CIE Oklab: L as 0..1, a and b as -1..1
 * @param {string} [ colorSpaceRefSamp = colorSpaces.Oklab ] - color space for the colors: colorReference, colorSample
 * @return {number} deltaE - how different a color colorSample is from colorReference
 */

// Note that, because OKLab lightness is [0-1] while CIE Lab Lightness is [0-100],
// ΔEOK values will be 100 times smaller, other things being equal.
// So a JND of 2.3 will be an OKLab JND of 0.023.
/* standard deltaE values (divided by 100):
 * <= 0.01 	Not perceptible by human eyes.
 * 0.01 - 0.02 	Perceptible through close observation.
 * 0.02 - 0.10 	Perceptible at a glance.
 * 0.11 - 0.49 	Colors are more similar than opposite.
 * 1 	        Colors are exact opposite.
 * ≈ 0.023 corresponds to a JND (just noticeable difference)
*/

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";

export function deltaEOK (colorReference, colorSample, colorSpaceRefSamp = colorSpaces.Oklab) {

    // colors are in the different color space ( not in the Oklab color space) -> convert colors to Oklab
    if (colorSpaceRefSamp !== colorSpaces.Oklab) {
        colorReference = convertColor(colorReference, colorSpaceRefSamp, colorSpaces.Oklab, {isRound: false});
        colorSample = convertColor(colorSample, colorSpaceRefSamp, colorSpaces.Oklab, {isRound: false});
    }

    let [L1, a1, b1] = colorReference;
    let [L2, a2, b2] = colorSample;
    let deltaL = L1 - L2;
    let deltaA = a1 - a2;
    let deltaB = b1 - b2;

    const deltaE =  Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2);

    return deltaE;
}