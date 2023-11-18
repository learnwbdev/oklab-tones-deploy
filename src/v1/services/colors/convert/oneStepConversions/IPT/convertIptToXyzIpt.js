/*

References
----------
-   :cite:`Fairchild2013y` : Fairchild, M. D. (2013). IPT Colourspace. In
    Color Appearance Models (3rd ed., pp. 6197-6223). Wiley. ISBN:B00DAYO8E2
"""
*/


/** Convert from IPT color space to CIEXYZ color space
 * @param {number[]} colorIPT - Array of IPT values: I as 0..1, P and T as -1 .. 1 (I - intensity, P - protan, T - tritan)
 * @return {number[]} Array of CIEXYZ values for D65 defined in IPT: X, Y, Z as 0..1
 * D65 in IPT: with XYZ [0.9504, 1.0, 1.0889] (specified in IPT color space, slightly different from xy `0.31270, 0.32900` (D65 white point specified in Rec BT.2020)
 */

    /* sources:
                https://scholarworks.rit.edu/theses/2858/
                https://www.researchgate.net/publication/221677980_Development_and_Testing_of_a_Color_Space_IPT_with_Improved_Hue_Uniformity
       matrices from:
                https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ipt.py
                https://en.wikipedia.org/wiki/ICtCp#In_IPT
                https://github.com/colour-science/colour/blob/develop/colour/models/ipt.py
    */

import { IPT__to__LMS_P, LMS_IPT__to__XYZ_D65ipt } from '../../../matrices/colorMatrices.js';
import { multiplyMatrices } from '../../../utils/multiplyMatrices.js';

export function convertIptToXyzIpt(colorIPT) {

    const colorLms_P = multiplyMatrices(IPT__to__LMS_P, colorIPT);
    // const colorLms = colorLms_P.map(c => Math.sign(c) * Math.abs(c) ** (0.43 ** (-1))); // LMS ** (1/0.43)
    const colorLms = colorLms_P.map(c => Math.sign(c) * Math.abs(c) ** (100 / 43)); // LMS ** (1/0.43)
    const colorXYZ = multiplyMatrices(LMS_IPT__to__XYZ_D65ipt, colorLms); // to CIEXYZ

    return colorXYZ;
}