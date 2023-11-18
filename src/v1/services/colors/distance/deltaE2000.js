/**
 * Calculate color difference delta E2000 with different weighting factors kL, kC and kH (standard factors all = 1)
 * @param {number[] | string} colorReference - Array of values for the color or HEX string. For CIE Lab: L as 0..100, a and b as around -150..150
 * @param {number[] | string} colorSample - Array of values for the color or HEX string. For CIE Lab: L as 0..100, a and b as around -150..150
 * @param {string}   [ colorSpaceRefSamp = colorSpaces.Lab ] - color space for the colors: colorReference, colorSample
 * @param {number[]} [ kLCH = [1, 1, 1] ] - Array of the weighting factors kL, kC and kH. By default (standard) [1, 1, 1]. To match deltaE 1976 (CIE76): [0.67, 0.67, 0.67]
 * @return {number} deltaE - how different a color colorSample is from colorReference
 * With factors [kL, kC, kH] = [1, 1, 1], standard deltaE values:
 * <= 1.0 	Not perceptible by human eyes.
 * 1 - 2 	Perceptible through close observation.
 * 2 - 10 	Perceptible at a glance.
 * 11 - 49 	Colors are more similar than opposite.
 * 100 	Colors are exact opposite.
 * ≈ 2.3 corresponds to a JND (just noticeable difference)
 */

/* sources:
            https://www.w3.org/TR/css-color-4/#color-difference-2000
            http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE2000.html
            https://www.hajim.rochester.edu/ece/sites/gsharma/ciede2000/
            https://en.wikipedia.org/wiki/Color_difference#CIEDE2000

    (offset, about weighting factors kL, kC and kH = 0.67):
            https://cielab.xyz/forum/viewtopic.php?p=2016#2016
*/

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";

export function deltaE2000(colorReference, colorSample, colorSpaceRefSamp = colorSpaces.Lab, {kLCH = [1, 1, 1]} = {}) {
    // Given a colorReference and a colorSample color,
    // both in CIE Lab, (if in different color space -> colors are converted to Lab)
    // calculate deltaE 2000.

    // This implementation assumes the parametric
    // weighting factors kL, kC and kH
    // (for the influence of viewing conditions)
    // standard, by default: are all 1

    // all 0.67 to match deltaE 1976 (CIE76)
    // to bring the dimension ΔE2000 to the usual scale ΔE1976, so if (not really accurate):
    // ΔE2000 >=  ΔE1976 - the difference between two colors is SIGNIFICANT for the eye
    // ΔE2000 < ΔE1976 - the difference between two colors is NOT significant for the eye

    const [kL, kC, kH] = kLCH; // by default: all 0.67 to match deltaE 1976 (CIE76)

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);
    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    // colors are in the different color space ( not in the Lab color space) -> convert colors to Lab
    if (colorSpaceRefSamp !== colorSpaces.Lab) {
        colorReference = convertColor(colorReference, colorSpaceRefSamp, colorSpaces.Lab, {isRound: false});
        colorSample = convertColor(colorSample, colorSpaceRefSamp, colorSpaces.Lab, {isRound: false});
    }

    let [L1, a1, b1] = colorReference;
    let [L2, a2, b2] = colorSample;

    // delLog
    // console.log(L1, a1, b1);
    // console.log(L2, a2, b2);
    let C1 = Math.sqrt(a1 ** 2 + b1 ** 2);
    let C2 = Math.sqrt(a2 ** 2 + b2 ** 2);

    let Cbar = (C1 + C2)/2; // mean Chroma
    // calculate a-axis asymmetry factor from mean Chroma
    // this turns JND (just noticeable difference) ellipses for near-neutral colors back into circles
    let C7 = Math.pow(Cbar, 7);
    const Gfactor = Math.pow(25, 7);
    let G = 0.5 * (1 - Math.sqrt(C7/(C7+Gfactor)));

    // delLog
    // console.log(C1, C2, Cbar);
    // console.log(C7, Gfactor, G);
    // G = 0.00006507 instead of 0.0001 (i.e not rounded)

    // scale a* axes by asymmetry factor
    // this by the way is why there is no Lan2000 color space
    let adash1 = (1 + G) * a1;
    let adash2 = (1 + G) * a2;

    // calculate new Chroma from scaled a* and original b* axes
    let Cdash1 = Math.sqrt(adash1 ** 2 + b1 ** 2);
    let Cdash2 = Math.sqrt(adash2 ** 2 + b2 ** 2);

    // calculate new hue, with zero hue for true neutrals
    // and in degrees, not radians
    let h1 = toDegrees(Math.atan2(b1, adash1));
    let h2 = toDegrees(Math.atan2(b2, adash2));
    h1 = h1 >= 0 ? h1 : (h1 + 360);
    h2 = h2 >= 0 ? h2 : (h2 + 360);

    // delLog
    // console.log(adash1, adash2);
    // console.log(Cdash1, Cdash2);
    // console.log(toDegrees(-1.537)); // -1.537

    // Lightness and Chroma differences; sign matters
    let deltaL = L2 - L1;
    let deltaC = Cdash2 - Cdash1;

    // Hue difference, taking care to get the sign correct
    let hdiff = h2 - h1;
    let hsum = h1 + h2;
    let habs = Math.abs(hdiff);
    let deltaHsmall = (Cdash1 * Cdash2 === 0) ? 0 :
                 (habs <= 180) ? hdiff :
                 (hdiff > 180) ? hdiff - 360 :
                 (hdiff < -180) ? hdiff + 360 :
                 -1000; // Error when calculating deltah

    if (deltaHsmall === - 1000) {
        console.log("Error when calculating deltah");
    }

    // weighted Hue difference, more for larger Chroma
    let deltaH = 2 * Math.sqrt(Cdash2 * Cdash1) * Math.sin(toRadians(deltaHsmall)/2);

    // calculate mean Lightness and Chroma
    let Ldash = (L1 + L2)/2;
    let Cdash = (Cdash1 + Cdash2)/2;
    let Cdash7 = Math.pow(Cdash, 7);

    // Compensate for non-linearity in the blue region of Lab.
    // Four possicilities for hue weighting factor,
    // depending on the angles, to get the correct sign
    let hdash = (Cdash1 * Cdash2 === 0) ? hsum : // use other angle as the average, if one angle is indeterminate (chroma set to zero)
                (habs <= 180) ? (hsum / 2) :
                (hsum < 360) ? ((hsum + 360)/2) :
                ((hsum - 360)/2);

    // positional corrections to the lack of uniformity of CIELAB
    // These are all trying to make JND (just noticeable difference) ellipsoids more like spheres

    // SL Lightness crispening factor
    // a background with L=50 is assumed
    let lsq = (Ldash - 50) ** 2;
    let SL = 1 + ((0.015 * lsq) / Math.sqrt(20 + lsq));

    // SC Chroma factor, similar to those in CMC and deltaE 94 formulae
    let SC = 1 + 0.045 * Cdash;

    // Cross term T for blue non-linearity
    let T = 1;
    T -= (0.17 * Math.cos(toRadians(     hdash - 30)));
    T += (0.24 * Math.cos(toRadians( 2 * hdash     )));
    T += (0.32 * Math.cos(toRadians((3 * hdash) + 6)));
    T -= (0.20 * Math.cos(toRadians((4 * hdash) - 63)));

    // SH Hue factor depends on Chroma,
    // as well as adjusted hue angle like delta E94.
    let SH = 1 + 0.015 * Cdash * T;

    // RT Hue rotation term compensates for rotation of JND ellipses
    // and Munsell constant hue lines
    // in the medium-high Chroma blue region
    // (Hue 225 to 315)
    let deltaTheta = 30 * Math.exp(-1 * (((hdash - 275)/25) ** 2));
    let RC = 2 * Math.sqrt(Cdash7/(Cdash7 + Gfactor));
    let RT = -1 * Math.sin(toRadians(2 * deltaTheta)) * RC;

    // Finally calculate the deltaE, term by term as root sum of squares
    let dE = (deltaL / (kL*SL)) ** 2;
    dE += (deltaC / (kC*SC)) ** 2;
    dE += (deltaH / (kH*SH)) ** 2;
    dE += RT * (deltaC / (kC*SC)) * (deltaH / (kH*SH));

    return Math.sqrt(dE);
}