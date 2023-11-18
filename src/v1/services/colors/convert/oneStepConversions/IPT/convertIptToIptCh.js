/** Convert IPT color to IPTch (hue, chroma for IPT) (IPTch - not official name of the color)
 * @param {number[]} colorIpt - Array of IPT values: I as 0..1, P and T as -1 .. 1 (I - intensity (perceived Lightness), P - protan, T - tritan), (P - protan, red-green chroma component, T - tritan, blue-yellow chroma component)
 * @return {number[]} Array of IPTch values: I as 0..1, C as 0..1.42 (approx.) , H as 0..360 (360 excluded) (I - intensity (perceived Lightness), C - Chroma, H - Hue)
 */

/*   sources:
                https://github.com/colour-science/colour/blob/develop/colour/models/ipt.py
                https://scholarworks.rit.edu/theses/2858/
                https://www.researchgate.net/publication/221677980_Development_and_Testing_of_a_Color_Space_IPT_with_Improved_Hue_Uniformity
*/

export function convertIptToIptCh(colorIpt) {
    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    const [I, p, t] = colorIpt; // I - Intensity (perceived Lightness), p - protan, how green/red the color is, t - tritan, how blue/yellow the color is

    // convert to IPTch (hue, chroma for IPT)
    const C = Math.sqrt(p ** 2 + t ** 2) // Chroma
    let H = toDegrees(Math.atan2(t, p));
    H = H >= 0 ? H : H + 360; // Hue, in degrees [0 to 360)

    const colorIptCh = [I, C, H]; // Intensity (perceived Lightness), Chroma, Hue

    return colorIptCh;
}