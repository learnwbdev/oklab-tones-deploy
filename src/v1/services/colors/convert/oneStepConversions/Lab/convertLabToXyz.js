// Convert CIELab to CIEXYZ
/**
 * Convert CIELab to CIEXYZ
 * @param {number[]} colorLab - Array of CIELab values: L as 0..100, a and b as -100..100 (L - perceived Lightness, a - how green/red the color is, b - how blue/yellow the color is)
 * @return {number[]} Array of CIEXYZ values: X, Y, Z as 0..1
 */

export function convertLabToXyz(colorLab) {
    /*
       sources:
               https://www.w3.org/TR/css-color-4/#color-conversion-code
               http://www.brucelindbloom.com/index.html?Eqn_Lab_to_LCH.html
               https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/lab/__init__.py
               https://en.wikipedia.org/wiki/CIELAB_color_space
    */

    // white point D-65
    const wpD65 = [3127 / 3290, 1, 3583 / 3290 ];

    // epsilon (ε)
    // const eps = 216 / 24389;    // (6 / 29) ^ 3, epsilon
    const eps_3 = 6 / 29;       // cube root of eps
    const kappa = 24389 / 27;   // (29 / 3) ^ 3
    const kappaEps = 8;         // kappa * eps = 8

    // compute `f`, starting with the luminance-related term
    const [L, a, b] = colorLab;
    const fy = (L + 16) / 116;  // `f` for y
    const fx = a / 500 + fy;    // `f` for x
    const fz = fy - b / 200;    // `f` for z

    // compute `xyz`
    const colorScaledXyz = [
        fx > eps_3    ? fx ** 3 : (116 * fx - 16) / kappa,
        L > kappaEps  ? fy ** 3 :               L / kappa,
        fz > eps_3    ? fz ** 3 : (116 * fz - 16) / kappa
    ];

    // condition `fx ** 3 > eps` is the same as condition `fx > eps_3`
    // condition `L > kappaEps` is the same as condition `fy ** 3 > eps` or `fy > eps_3` (solve inequality to L and will get L > 8)
    // `116 * fy - 16` is the same as L (replace fy and simplify, 116 * fy - 16 = L)

    // Compute XYZ by scaling `xyz` (colorScaledXyz) by reference `white`, white point D-65 (wpD65)
    const colorXYZ = colorScaledXyz.map((val, idx) => val * wpD65[idx]);

    return colorXYZ;
}