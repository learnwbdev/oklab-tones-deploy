/**
 * Convert OSA-UCS polar coordinates (Hue, Chroma OCA-UCS Ch) (not official) to OSA-UCS color space
 * @param {number[]} colorOsaUcsCh - Array of OSA-UCS Ch values: L (Lightness) as -10..8, C (Chroma) as 0.. (unbounded), H (Hue) as 0..360 (360 excluded)
 * @return {number[]} Array of OSA-UCS values: L (Lightness) as -10..8, j (jaune, yellowness–blueness) and g (green, redness–greenness) as -15 .. 15 (or different)
*/

/* sources:
            (polar coordinates):
            https://www.researchgate.net/publication/221501777_A_Radial_Sampling_of_the_OSA_Uniform_Color_Scale

            https://www.researchgate.net/publication/259253763_Comparison_of_the_performance_of_inverse_transformation_methods_from_OSA-UCS_to_CIEXYZ
            https://en.wikipedia.org/wiki/OSA-UCS#cite_note-4
            https://babelcolor.com/index_htm_files/AN-7%20The%20OSA%20UCS.pdf
*/

export function convertOsaUcsChToOsaUcs (colorOsaUcsCh) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const [L, C, H] = colorOsaUcsCh; // L - perceived Lightness, C - Chroma, H - Hue

    // convert to OSA-UCS
    const g = C * Math.cos(toRadians(H)); // g (green, redness–greenness)
    const j = C * Math.sin(toRadians(H)); // j (jaune, yellowness–blueness)

    const colorOsaUcs = [L, j, g]; // L (Lightness), j (jaune, yellowness–blueness), g (green, redness–greenness)

    return colorOsaUcs;
}