/**
 * Correct Chroma of the Oklch color to the target CAM16 Chroma (in default viewing conditions)
 * @param {number[]} colorOklch - Array of OKLch values: L as 0..1, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 0.4
 * @param {number} tgtChromaCam16 - target Chroma value for the CAM16 color space, the Chroma to which Chroma in the colorOklch is matched
 * @param {number} [mpPrcCCam = 3] as 0..17 (integer)  - precision for Chroma in CAM16 color (digit after decimal point to round Hue)
 * @param {number} [mpPrcC = 5] as 0..17 (integer)  - precision for Chroma in Oklch color (digit after decimal point to round Hue)
 * @param {number} [maxChromaOklch = 0.6] as 0..1  - maximum Chroma for the Oklch color. Probably = 0.4
 * @param {boolean} [isLog = false] - flag to write log in console
 * @return {number[]} Array of OKLch values with Chroma corrected to CAM16 target Chroma: L as 0..1, C as 0.. , H as 0..360 (360 excluded)
 */

import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";

export function correctOklchChromaToCCam16 (colorOklch, tgtChromaCam16, {mpPrcCCam = 3, mpPrcC = 5, maxChromaOklch = 0.6, isLog = false} = {}){

    // round down (Math.floor) the number (num) to a precision (prc) in 10 ** ... form
    const floorTo = (num, prc) => Math.floor((num + Number.EPSILON) * prc) / prc + 0;

    // calculate precisions
    let prcCCam = 10 ** mpPrcCCam; // precision for Chroma in Cam16
    let precisionCam = prcCCam ** (-1); // difference between found Chroma in Cam16 Ucs
    const prcC = 10 ** mpPrcC; // precision for Chroma in Oklch
    const precision = prcC ** (-1); // difference between found Chroma in Oklch color space

    let [L, C, H] = colorOklch;

    // round down or math round target CAM16 Chroma
    tgtChromaCam16 = floorTo(tgtChromaCam16, prcCCam);

    // current Chroma for a given color in Cam16 Ucs (in default viewing conditions)
    let curCCam16 = convertColor(colorOklch, colorSpaces.Oklch, colorSpaces.CAM16, {isRound: false})[1];
    // replace Nan with max Chroma 150
    curCCam16 = isNaN(curCCam16) ? 150 : curCCam16; // for large Chroma CAM16 could return Nan for the Chroma (Math.pow(t, 0.9) -> Nan for t < 0)
    // round down current CAM16 Chroma
    curCCam16 = floorTo(curCCam16, prcCCam);

    if (isLog) console.log("start: ", colorOklch, "cur: ", curCCam16, "tgt: ", tgtChromaCam16);

    let minChroma = 0;
    let maxChroma = maxChromaOklch;
    let midChroma = 0;
    let cntNmbDeltaLarg  = 0;       // counter, how many times current delta is bigger than previous
    let midChromaPrevFst = 0;       // previous midChroma, when delta started to get bigger

    let deltaCur    = 0;            // current Delta (difference between current Chroma and target Chroma)
    let deltaPrev   = 0;            // previous Delta

    // Example, Oklch color [0.85488, 0.00526, 60.02], tgtCAM16 C : 0.8973762375235834 (to change to)-> [0.85488, 0.00468, 60.02]
    // CAM16 Chroma goes down than goes up, when Oklch Chroma decreases
    //
    // for CAM16 Chroma, with decreasing of Oklch Chroma CAM16 Chroma could increase
    // for small Chroma:
    // if with changing Oklch Chroma difference between current and target CAM16 Chroma
    // increases for two steps -> it means that we should stop and take midChroma (Oklch Chroma) from two steps back
    let curChroma = C;
    while ( (Math.abs(curCCam16 - tgtChromaCam16) > precisionCam + Number.EPSILON ) &&
            ((maxChroma - minChroma) > precision + Number.EPSILON) ) {
        midChroma = (minChroma + maxChroma)/2;
        midChroma = floorTo(midChroma, prcC);

        let colorOklch_cur = [L, midChroma, H];
        // find current Chroma in Cam16 UCS
        curCCam16 = convertColor(colorOklch_cur, colorSpaces.Oklch, colorSpaces.CAM16, {isRound: false})[1];
        // replace Nan with max Chroma 150
        curCCam16 = isNaN(curCCam16) ? 150 : curCCam16; // for large Chroma CAM16 could return Nan for the Chroma (Math.pow(t, 0.9) -> Nan for t < 0)
        // round down current CAM16 Chroma
        curCCam16 = floorTo(curCCam16, prcCCam);

        deltaPrev = deltaCur !== 0 ? deltaCur : Math.abs(curCCam16 - tgtChromaCam16);
        deltaCur  = Math.abs(curCCam16 - tgtChromaCam16);
        if (deltaCur > deltaPrev) cntNmbDeltaLarg++;  // count how many times deltaCur was bigger than deltaPrev
        else cntNmbDeltaLarg = 0;

        // save midChroma to take Chroma before deltaCur starts to be bigger than deltaPrev
        if (cntNmbDeltaLarg === 0) midChromaPrevFst = midChroma;

        if (curCCam16 < tgtChromaCam16) {
            minChroma = midChroma;
        } else if (cntNmbDeltaLarg > 1) {
            // for small Chroma CAM16, where not all Hues are available (otherwise we would begin to increase Chroma instead of decreasing)
            minChroma = midChromaPrevFst;
            midChroma = midChromaPrevFst;
        } else {
            maxChroma = midChroma;
        }

        curChroma = midChroma;

        if (isLog) console.log(curCCam16, tgtChromaCam16, "Oklch Chroma: ", midChroma);
        // if (isLog) console.log(curCCam16, tgtChromaCam16, "Oklch Chroma: ", midChroma, [...convertColor(colorOklch_cur, colorSpaces.Oklch, colorSpaces.CAM16)]);
    }

    // Example, Oklch color [0.81638, 0.00359, 132.64], tgtCAM16 C : 1.6263202324990014 (to change to)~-> [0.81638, 0.00234, 132.64]
    // otherwise will change to [0.81638, 0.00001, 132.64], because at Oklch C = 0 CAM16 C = 2.44098
    //
    // if result Chroma Oklch == precision minimum, Ex.: 0.00001),
    // than change Chroma Oklch to Chroma corresponding to the CAM16 Color with Chroma at precision
    // find CAM16 color for Oklch color as original color, but C = precision
    // add to CAM16 chroma `addZeroChroma` (= 0.5)
    // convert changed CAM16 color to Oklch, take only chroma
    if (curChroma === precision) {
        // find CAM16 color for color Oklch for a given L, H, but C = precision (Ex. 0.00001)
        const zeroChrCam16 = convertColor([L, precision, H], colorSpaces.Oklch, colorSpaces.CAM16)[1];
        const addZeroChroma = 0.45; // how much to add Chroma to CAM16 Chroma at Oklch C = 0
        curChroma = correctOklchChromaToCCam16(colorOklch, zeroChrCam16 + addZeroChroma,
            {mpPrcCCam: mpPrcCCam, mpPrcC: mpPrcC, maxChromaOklch: maxChromaOklch, isLog: isLog})[1];

        if (isLog) console.log("zero Chroma CAM16: ", zeroChrCam16, "tgt: ", tgtChromaCam16);
    }

    let colorOklchCCam16 = [L, curChroma, H];

    if (isLog) console.log("fin: ", [...colorOklchCCam16], convertColor(colorOklchCCam16, colorSpaces.Oklch, colorSpaces.CAM16)[1], tgtChromaCam16);

    return colorOklchCCam16;
}