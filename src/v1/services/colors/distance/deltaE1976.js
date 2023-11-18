/**
 * Calculate color difference deltaE1976
 * @param {number[] | string} colorReference - Array of values for the color or HEX string.For CIE Lab: L as 0..100, a and b as around -150..150
 * @param {number[] | string} colorSample - Array of values for the color or HEX string. For CIE Lab: L as 0..100, a and b as around -150..150
 * @param {string} [ colorSpaceRefSamp = colorSpaces.Lab ] - color space for the colors: colorReference, colorSample
 * @return {number} deltaE - how different a color colorSample is from colorReference
 */

/* source:
            http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE76.html
            https://en.wikipedia.org/wiki/Color_difference#CIE76
*/
/* Standard deltaE values:
 * <= 1.0 	Not perceptible by human eyes.
 * 1 - 2 	Perceptible through close observation.
 * 2 - 10 	Perceptible at a glance.
 * 11 - 49 	Colors are more similar than opposite.
 * 100 	Colors are exact opposite.
 * ≈ 2.3 corresponds to a JND (just noticeable difference)
 */

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";

export function deltaE1976(colorReference, colorSample, colorSpaceRefSamp = colorSpaces.Lab) {

    // colors are in the different color space ( not in the Lab color space) -> convert colors to Lab
    if (colorSpaceRefSamp !== colorSpaces.Lab) {
        colorReference = convertColor(colorReference, colorSpaceRefSamp, colorSpaces.Lab, {isRound: false});
        colorSample = convertColor(colorSample, colorSpaceRefSamp, colorSpaces.Lab, {isRound: false});
    }

    let [L1, a1, b1] = colorReference;
    let [L2, a2, b2] = colorSample;
    let deltaL = L2 - L1;
    let deltaA = a2 - a1;
    let deltaB = b2 - b1;

    const deltaE =  Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2);

    return deltaE;
}