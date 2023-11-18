/** Convert ICtCp color space to ICtCpch (hue, chroma for ICtCp, ICtCp in polar coordinates) (ICtCpch - not official name of the color)
 * @param {number[]} colorICtCp - Array of ICtCp values: I (Intensity) as 0..1, Ct and Cp as -1 .. 1 (or -0.5..0.5)
 * Ct - tritan, blue-yellow, Cp - protan, red-green (named from protanopia) chroma component
 * @return {number[]} Array of ICtCpch values: I as 0..1, C as 0..1.42 (approx.) , H as 0..360 (360 excluded) (I - intensity (perceived Lightness), C - Chroma, H - Hue)
 */

/*   sources:
            https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf
            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ictcp.py
            https://en.wikipedia.org/wiki/ICtCp
*/

export function convertICtCpToICtCpch (colorICtCp) {
    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    // !!!! values t and p in ICtCp color are in the different order than in IPT color
    const [I, t, p] = colorICtCp; // I - Intensity (perceived Lightness), t - tritan, how blue/yellow the color is, p - protan, how green/red the color is

    // convert to ICtCpch (hue, chroma for ICtCp)
    const C = Math.sqrt(p ** 2 + t ** 2) // Chroma
    let H = toDegrees(Math.atan2(t, p));
    H = H >= 0 ? H : H + 360; // Hue, in degrees [0 to 360)

    const colorICtCpch = [I, C, H]; // Intensity (perceived Lightness), Chroma, Hue

    return colorICtCpch;
}