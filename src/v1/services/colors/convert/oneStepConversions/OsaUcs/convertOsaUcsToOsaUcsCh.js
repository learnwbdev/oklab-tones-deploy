/**
 * Convert OSA-UCS color space to OSA-UCS polar coordinates (Hue, Chroma OCA-UCS Ch) (not official)
 * @param {number[]} colorOsaUcs - Array of OSA-UCS values: L (Lightness) as -10..8, j (jaune, yellowness–blueness) and g (green, redness–greenness) as -15 .. 15 (or different)
 * @return {number[]} Array of OSA-UCS Ch values: L (Lightness) as -10..8, C (Chroma) as 0.. (unbounded), H (Hue) as 0..360 (360 excluded)
*/

/* sources:
            (polar coordinates):
            https://www.researchgate.net/publication/221501777_A_Radial_Sampling_of_the_OSA_Uniform_Color_Scale

            https://www.researchgate.net/publication/259253763_Comparison_of_the_performance_of_inverse_transformation_methods_from_OSA-UCS_to_CIEXYZ
            https://en.wikipedia.org/wiki/OSA-UCS#cite_note-4
            https://babelcolor.com/index_htm_files/AN-7%20The%20OSA%20UCS.pdf
*/

export function convertOsaUcsToOsaUcsCh (colorOsaUcs) {
    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    const [L, j, g] = colorOsaUcs; // L (Lightness), j (jaune, yellowness–blueness), g (green, redness–greenness)

    // convert to OSA-UCS polar coordinates (not official)
    const C = Math.sqrt(j ** 2 + g ** 2) // Chroma (roughly corresponds to Chroma)
    // let H = toDegrees(Math.atan2(g, j)); // in article (g, j), but to correspond to a,b in Lab use (j, g)
    let H = toDegrees(Math.atan2(j, g)); // yellowness–blueness (j similar to b in Lab), redness–greenness (g similar a in Lab)
    H = H >= 0 ? H : H + 360; // Hue, in degrees [0 to 360) (roughly corresponds to Hue)

    const colorOsaUcsCh = [L, C, H]; // perceived Lightness, Chroma, Hue

    return colorOsaUcsCh;
}