/**
 * Correct Hue of the Oklch color to the target IPT Hue
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
 * @param {number} tgtIptHue - target Hue value for the IPT color space, the Hue to which Hue in the colorOklch is matched
 * @param {number} [mpPrcH = 2] as 0..17 (integer)  - precision for Hue in Oklch color (digit after decimal point to round Hue)
 * @return {number[]} Array of OKLch values with Hue corrected to IPT target Hue: L as 0..1, C as 0.. , H as 0..360 (360 excluded)
 */

import { colorSpaces } from '../convert/colorSpaces.js';
import { convertColor } from "../convert/convertColor.js";

export function correctOklchHueToGivenHueIPT(colorOklch, tgtIptHue, {mpPrcH = 2} = {}) {
    const prcH = 10 ** mpPrcH; // precision for Hue
    const precisionHue = prcH ** (-1); // difference between found Hue

    // modulo with positive sign
    const mod = (a, n) => (a % n + n) % n;

    let toleranceHue = 2 ** (-8); // ~ 0.0039 ( = 0.00390625 )
    let diffMax = 360; // max difference between current Hue and Hue target in Oklch space
    let stepInterv = diffMax / 2;

    let [L, C, origOklchHue] = colorOklch;

    // return media white or black, if lightness is out of range
    if (L >= 1) return [1, 0, 0]; // white color in Oklch
    if (L <= 0) return [0, 0, 0]; // black color in Oklch

    // return gray color as is (when Chroma = 0), there is no need to correct Hue, Hue makes no difference
    if (C == 0) return colorOklch;

    // round up given IPT Hue to the precision
    tgtIptHue = Math.round((tgtIptHue + Number.EPSILON) * prcH ) / prcH + 0;

    let minOklchHue = origOklchHue - stepInterv;
    let maxOklchHue = origOklchHue + stepInterv;

    let curIptHue = convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.IPTch)[2];
    let diffIptHue = curIptHue - tgtIptHue;
    diffIptHue = mod((diffIptHue + 180), 360) - 180; // https://stackoverflow.com/questions/1878907/how-can-i-find-the-smallest-difference-between-two-angles-around-a-point

    minOklchHue = diffIptHue <= 0 ? origOklchHue : minOklchHue;
    maxOklchHue = diffIptHue <= 0 ? maxOklchHue  : origOklchHue;

    let curHue = origOklchHue;
    while ( (Math.abs(diffIptHue) > toleranceHue) && (Math.abs(maxOklchHue - minOklchHue) >= 2 * precisionHue ) ) {
        let midHue = (minOklchHue + maxOklchHue) / 2;
        midHue = Math.round((midHue + Number.EPSILON) * prcH ) / prcH + 0;
        curHue = mod(midHue, 360);
        curHue = Math.round((curHue + Number.EPSILON) * prcH ) / prcH + 0;

        let colorOklch_cur = [L, C, curHue];
        curIptHue = convertColor(colorOklch_cur, colorSpaces.Oklch, colorSpaces.IPTch)[2];
        diffIptHue = curIptHue - tgtIptHue;
        diffIptHue = mod((diffIptHue + 180), 360) - 180;

        if (diffIptHue <= 0) {
            minOklchHue = midHue;
        }
        else {
            maxOklchHue = midHue;
        }
    }

    const colorOklchCorrHue = [L, C, curHue];

    return colorOklchCorrHue;
}