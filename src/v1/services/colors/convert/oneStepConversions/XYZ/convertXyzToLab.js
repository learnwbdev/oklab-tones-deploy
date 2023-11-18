// Convert CIEXYZ to CIELab
/**
 * Convert CIEXYZ to CIELab
 * @param {number[]} colorXYZ - Array of CIEXYZ values: X, Y, Z as 0..1
 * @return {number[]} Array of CIELab values: L as 0..100, a and b as -100..100 (L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is)
 */

export function convertXyzToLab(colorXYZ) {
    /*
       sources:
               https://www.w3.org/TR/css-color-4/#color-conversion-code
               http://www.brucelindbloom.com/index.html?Eqn_Lab_to_LCH.html
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/lab/__init__.py
               https://en.wikipedia.org/wiki/CIELAB_color_space
    */

    // epsilon (ε)
    const eps = 216 / 24389;    // (6 / 29) ^ 3
    const kappa = 24389 / 27;   // (29 / 3) ^ 3

    // white point D-65
    const wpD65 = [3127 / 3290, 1, 3583 / 3290 ];

    // XYZ scaled relative to reference white D-65
    const colorScaledXyz = colorXYZ.map((val, idx) => val / wpD65[idx]);

    const arrF = colorScaledXyz.map(val => val > eps ? Math.cbrt(val) : (kappa * val + 16) / 116)

    const colorLab = [
        (116 * arrF[1]) - 16,      // L
        500 * (arrF[0] - arrF[1]), // a
        200 * (arrF[1] - arrF[2])  // b
    ];

    return colorLab;
}