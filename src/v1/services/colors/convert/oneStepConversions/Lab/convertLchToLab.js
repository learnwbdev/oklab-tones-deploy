// Convert CIELch color to CIELab

/**
 * Convert CIELch color to CIELab
 * @param {number[]} colorLch - Array of CIELch values: L as 0..100, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 230 (L - perceived Lightness, C - Chroma, H - Hue)
 * @return {number[]} Array of CIELab values: L as 0..100, a and b as -100..100 (L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is)
 */

export function convertLchToLab(colorLch) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const [L, C, H] = colorLch; // L - perceived Lightness, C - Chroma, H - Hue

    // convert to Lab
    const a = C * Math.cos(toRadians(H)); // *a - how green/red the color is
    const b = C * Math.sin(toRadians(H)); // *b - how blue/yellow the color is

    const colorLab = [L, a, b];

    return colorLab;
}