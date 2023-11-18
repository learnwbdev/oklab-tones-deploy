// Convert CIELab color to CIELch

/**
 * @param {number[]} colorLab - Array of CIELab values: L as 0..100, a and b as -100..100 (L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is)
 * @return {number[]} Array of CIELch values: L as 0..100, C as 0.. , H as 0..360 (360 excluded); C - unbounded, real max ~ 230 (L - perceived Lightness, C - Chroma, H - Hue)
 */

export function convertLabToLch(colorLab) {
    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    const [L, a, b] = colorLab; // perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is

    // convert to Lch
    const C = Math.sqrt(a ** 2 + b ** 2) // Chroma
    let H = toDegrees(Math.atan2(b, a));
    H = H >= 0 ? H : H + 360; // Hue, in degrees [0 to 360)

    const colorLch = [L, C, H]; // perceived Lightness, Chroma, Hue

    return colorLch;
}