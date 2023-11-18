/**
 * Correct Hue of the Oklch color to correspond to the same Hue in IPT color space as the Oklch color in cusp point for a given Hue (L_cusp, C_cusp)
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
 * @param {number} colorOklchTgtHue - Array of OKLch values to find target Hue in IPT color space: L as 0..1, C as 0.. , H as 0..360 (360 excluded), Hue to which Hues in the tonal palette are matched through IPT Hue (found IPT Hue for a given target Oklch color)
 * @param {string} [colorSpaceGamut = colorSpaces.sRgb] (for now only for sRGB and Display P3) - name of the color space to fit the gamut of
 * @param {number} [mpPrcH = 2] as 0..17 (integer)  - precision for Hue in Oklch color (digit after decimal point to round Hue)
 * @return {number[]} Array of OKLch values with Hue corrected to IPT hue for the cusp point: L as 0..1, C as 0.. , H as 0..360 (360 excluded)
 */

import { colorSpaces } from '../convert/colorSpaces.js';
import { convertColor } from "../convert/convertColor.js";
import { findOklabLCCuspPoint } from "./findOklabLCCuspPoint.js";

export function correctOklchHueToGivenHueConvToIPT(colorOklch, colorOklchTgtHue, colorSpaceGamut = colorSpaces.sRgb, {mpPrcH = 2} = {}) {
    const prcH = 10 ** mpPrcH; // precision for Hue
    const precisionHue = prcH ** (-1); // difference between found Hue

    // modulo with positive sign
    const mod = (a, n) => (a % n + n) % n;

    // function to convert degrees to radians
    // const toRadians = degrees => degrees * (Math.PI/180);

    let toleranceHue = 2 ** (-8); // ~ 0.0039 ( = 0.00390625 )
    // let toleranceHue = 2 ** (-7); // ~ 0.0078 ( = 0.0078125 )
    // let toleranceHue = 2 ** (-4) + 2 ** (-5); //  = 0.09375
    let diffMax = 360; // max difference between current Hue and Hue target in Oklch space
    let stepInterv = diffMax / 2;

    let [L, C, origOklchHue] = colorOklch;

    // return media white or black, if lightness is out of range
    if (L >= 1) return [1, 0, 0]; // white color in Oklch
    if (L <= 0) return [0, 0, 0]; // black color in Oklch

    // return gray color as is (when Chroma = 0), there is no need to correct Hue, Hue makes no difference
    if (C == 0) return colorOklch;

    // target Hue in IPT color space corresponding to the given color Oklch `olorOklchTgtHue`
    const tgIptHue = convertColor(colorOklchTgtHue, colorSpaces.Oklch, colorSpaces.IPTch)[2];

    let minOklchHue = origOklchHue - stepInterv;
    let maxOklchHue = origOklchHue + stepInterv;

    // console.log(minOklchHue, maxOklchHue, colorOklch);

    let curIptHue = convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.IPTch)[2];
    // let diffIptHue = 180 - Math.abs(Math.abs(tgIptHue - curIptHue) - 180); // https://gamedev.stackexchange.com/questions/4467/comparing-angles-and-working-out-the-difference
    let diffIptHue = curIptHue - tgIptHue;
    diffIptHue = mod((diffIptHue + 180), 360) - 180; // https://stackoverflow.com/questions/1878907/how-can-i-find-the-smallest-difference-between-two-angles-around-a-point

    minOklchHue = diffIptHue <= 0 ? origOklchHue : minOklchHue;
    maxOklchHue = diffIptHue <= 0 ? maxOklchHue  : origOklchHue;

    let curHue = origOklchHue;
    while ( (Math.abs(diffIptHue) > toleranceHue) && (Math.abs(maxOklchHue - minOklchHue) >= 2 * precisionHue ) ) {
    // for (let i = 0; i < 15; i++) {
        // console.log(minOklchHue, maxOklchHue, diffIptHue);
        let midHue = (minOklchHue + maxOklchHue) / 2;
        midHue = Math.round((midHue + Number.EPSILON) * prcH ) / prcH + 0;
        curHue = mod(midHue, 360);
        curHue = Math.round((curHue + Number.EPSILON) * prcH ) / prcH + 0;

        let colorOklch_cur = [L, C, curHue];
        curIptHue = convertColor(colorOklch_cur, colorSpaces.Oklch, colorSpaces.IPTch)[2];
        diffIptHue = curIptHue - tgIptHue;
        diffIptHue = mod((diffIptHue + 180), 360) - 180;

        if (diffIptHue <= 0) {
            minOklchHue = midHue;
        }
        else {
            maxOklchHue = midHue;
        }

        // console.log(minOklchHue, maxOklchHue, diffIptHue, tgIptHue, curHue, curIptHue, colorOklch, [L_cusp, C_cusp]);
        // console.log(minOklchHue, maxOklchHue, diffIptHue, tgIptHue, curIptHue, curHue, [L, C, curHue]);
        // console.log(minOklchHue, maxOklchHue, diffIptHue, tgIptHue, curIptHue, curHue, colorOklch);
    }

    const colorOklchCorrHue = [L, C, curHue];

    return colorOklchCorrHue;
}