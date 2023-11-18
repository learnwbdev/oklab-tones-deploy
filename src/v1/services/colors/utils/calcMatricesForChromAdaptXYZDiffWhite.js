/**
 * Chromatic Adaptation, Bradford method, calculate matrix to transform XYZ color from the Source White point to the Destination White Point
 * @param {number[]} whitePointFrom - Array for the Source White Point in XYZ format or xyY. Ex.: XYZ: [0.9504, 1.0, 1.0889], xyY: [0.31270, 0.32900] or [0.31270, 0.32900, 1] where Y = 1
 * @param {number[]} whitePointTo - Array for the Destination White Point in XYZ format or xyY
 * @param {boolean} [isProjWpFrom = false] - flag that whitePointFrom is in the format xyY (projection to Y). by default Y = 1. Or Y could be given with xy. Ex: [0.31270, 0.32900, 1] where third value is Y
 * @param {boolean} [isProjWpTo = false] - flag that whitePointTo is in the format xyY (projection to Y). by default Y = 1.
 * @return {number[][]} 2D Array for the transform matrix for XYZ color space from the Source White point to the Destination White Point
 */

import { chromAdapt_Bradford, chromAdapt_Bradford_inv } from "../matrices/colorMatrices.js";
import { multiplyMatrices } from "./multiplyMatrices.js";

/*
    sources:
        http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
        (D50 to D65 example):
        https://www.w3.org/TR/css-color-4/#color-conversion-code
*/

// Algorithm:
// - convert white points from XYZ into a cone response domain (retinal cone domain)
// - scale the vector components by factors dependent upon both the source and destination reference whites
//   (scale components from one reference white to another)
// - convert back to XYZ using the inverse transform of step 1

export function calcMatricesForChromAdaptXYZDiffWhite(whitePointFrom, whitePointTo, {isProjWpFrom = false, isProjWpTo = false} = {}) {

    const xyY_to_XYZ = (x, y, Ypj = 1) => {
        const [X, Y, Z] = [(x * Ypj)/ y, Ypj, ((1 - x - y) * Ypj) / y];
        return [X, Y, Z];
    }

    // transform xyY to XYZ if input is xyY (isProjWpFrom = true / isProjWpTo = true ), otherwise take XYZ
    whitePointFrom = isProjWpFrom ? xyY_to_XYZ(...whitePointFrom) : whitePointFrom;
    whitePointTo   = isProjWpTo ? xyY_to_XYZ(...whitePointTo) : whitePointTo;

    // convert white points from XYZ into a cone response domain using Bradford method
    const coneResponseFrom = multiplyMatrices(chromAdapt_Bradford, whitePointFrom);
    const coneResponseTo = multiplyMatrices(chromAdapt_Bradford, whitePointTo);

    // scale the vector components
    // const scaleMatrix = [
    //     [ coneResponseTo[0] / coneResponseFrom[0], 0.0, 0.0  ],
    //     [ 0.0,  coneResponseTo[1] / coneResponseFrom[1], 0.0 ],
    //     [ 0.0,  0.0, coneResponseTo[2] / coneResponseFrom[2] ],
    // ];
    const arrScaleFromTo = coneResponseTo.map((val, idx) => val / coneResponseFrom[idx]);

    // https://stackoverflow.com/questions/41816410/nn-sized-identity-matrix-using-higher-order-functions
    // +!idx--   , idx-- decreases idx after, !idx-- transform to boolean and takes opposite value (so it's true when idx-- === 0),
    // +!idx   + (unary plus) transforms boolean value to integer, so false = 0, true = 1
    const scaleMatrix = arrScaleFromTo.map((v, idx, arr) => arr.map(val => (+!idx--) * val));

    // scale transform matrix
    const scaledTransformConeResp = multiplyMatrices(scaleMatrix, chromAdapt_Bradford);

    // convert back to XYZ from a cone response domain
    const transfromMatrix = multiplyMatrices(chromAdapt_Bradford_inv, scaledTransformConeResp);

    return transfromMatrix;
}