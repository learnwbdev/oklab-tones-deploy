/**
 * Calculate color difference deltaEz in color space JzCzHz (JzAzBz in polar coordinates)
 * @param {number[] | string} colorReference - Array of values for the color or HEX string. For JzCzHz: Jz (Lightness) as 0..1, Cz (Chroma) as 0..0.5 (unbound), Hz (hue) as 0..360 (360 excluded)
 * @param {number[] | string} colorSample - Array of values for the color or HEX string. For JzCzHz: Jz (Lightness) as 0..1, Cz (Chroma) as 0..0.5 (unbound), Hz (hue) as 0..360 (360 excluded)
 * @param {string} [ colorSpaceRefSamp = colorSpaces.JzCzHz ] - color space for the colors: colorReference, colorSample
 * @return {number} deltaE - how different a color colorSample is from colorReference
 */

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

export function deltaEz (colorReference, colorSample, colorSpaceRefSamp = colorSpaces.JzCzHz) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    // colors are in the different color space ( not in the JzCzHz color space) -> convert colors to JzCzHz
    if (colorSpaceRefSamp !== colorSpaces.JzCzHz) {
        colorReference = convertColor(colorReference, colorSpaceRefSamp, colorSpaces.JzCzHz, {isRound: false});
        colorSample = convertColor(colorSample, colorSpaceRefSamp, colorSpaces.JzCzHz, {isRound: false});
    }

    const [Jz1, Cz1, Hz1] = colorReference;
    const [Jz2, Cz2, Hz2] = colorSample;

    const deltaJz = Jz2 - Jz1;  // delta for Jz (lightness)
    const deltaCz = Cz2 - Cz1;  // delta for Cz (Chroma)
    const deltaHz = Hz2 - Hz1;    // delta for Hz (Hue) before recalculation

    const deltaHz_2 = 2 * Cz1 * Cz2 * (1 - Math.cos(toRadians(deltaHz))); // (new delta for Hz) squared (in power ** 2)

    const deltaE = Math.sqrt(deltaJz ** 2 + deltaCz ** 2 + deltaHz_2); // delta Hz is already in ** 2

    return deltaE;
}