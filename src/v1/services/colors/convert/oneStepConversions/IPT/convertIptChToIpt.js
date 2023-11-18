/** Convert from IPTch (hue, chroma for IPT) color to IPT  (IPTch - not official name of the color)
 * @param {number[]} colorIptCh - Array of IPTch values: I as 0..1, C as 0..1.42 (approx.) , H as 0..360 (360 excluded) (I - intensity (perceived Lightness), C - Chroma, H - Hue)
 * @return {number[]} Array of IPT values: I as 0..1, P and T as -1 .. 1 (I - intensity, P - protan, T - tritan)
 * (I - intensity, P - protan, red-green chroma component, T - tritan, blue-yellow chroma component)
 */

/*   sources:
                https://github.com/colour-science/colour/blob/develop/colour/models/ipt.py
                https://scholarworks.rit.edu/theses/2858/
                https://www.researchgate.net/publication/221677980_Development_and_Testing_of_a_Color_Space_IPT_with_Improved_Hue_Uniformity
*/

export function convertIptChToIpt(colorIptCh) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const [I, C, H] = colorIptCh; // I - Intensity (perceived Lightness), C - Chroma, H - Hue

    // convert to IPT
    const p = C * Math.cos(toRadians(H)); // p - how green/red the color is
    const t = C * Math.sin(toRadians(H)); // t - how blue/yellow the color is

    const colorIpt = [I, p, t];

    return colorIpt;
}