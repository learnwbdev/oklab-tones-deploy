/** Convert ICtCpch (hue, chroma for ICtCp, ICtCp in polar coordinates) to ICtCp color space (ICtCpch - not official name of the color)
 * @param {number[]} colorICtCp - Array of ICtCpch values: I as 0..1, C as 0..1.42 (approx.), H as 0..360 (360 excluded)
 * (I - intensity (perceived Lightness), C - Chroma, H - Hue)
 * @return {number[]} Array of ICtCp values: I (Intensity) as 0..1, Ct and Cp as -1 .. 1 (or -0.5..0.5)
 * Ct - tritan, blue-yellow, Cp - protan, red-green chroma component
 */

/*   sources:
            https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf
            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ictcp.py
            https://en.wikipedia.org/wiki/ICtCp
*/

export function convertICtCpchToICtCp (colorICtCpch) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const [I, C, H] = colorICtCpch; // I - Intensity (perceived Lightness), C - Chroma, H - Hue

    // convert to ICtCp
    const p = C * Math.cos(toRadians(H)); // p - how green/red the color is
    const t = C * Math.sin(toRadians(H)); // t - how blue/yellow the color is

    const colorICtCp = [I, t, p]; // values t, p are in the different order in ICtCp color than in the IPT color

    return colorICtCp;
}