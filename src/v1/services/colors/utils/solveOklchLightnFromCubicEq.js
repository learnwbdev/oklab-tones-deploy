/**
 * Find first largest real solution for the cubic equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * clamp solution to the interval [0, 1] for Oklch Lightness
 * @param {number} a2 - coefficient a2 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a1 - coefficient a1 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a0 - coefficient a0 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @returns {number[]} Array of real solutions in increasing order z1, z2, z3 (z1 >= z2 >= z3)
 */

// algorithm from // https://iate.oac.uncor.edu/~mario/materia/nr/numrec/f5-6.pdf
// z ** 3 + a2 * z ** 2 + a1 * z + a0 = 0
export function solveOklchLightnFromCubicEq(a2, a1, a0) {
    // clamp function: returns val if its within [min, max], otherwise min if val < min or max if val > max
    const clampNum = (min, val, max) => Math.max(min, Math.min(val, max));

    let Q = (a2 ** 2 - 3 * a1) / 9; // = -q from v1
    let R = (2 * a2 ** 3 - 9 * a2 * a1 + 27 * a0) / 54;  // = -r from v1
    let Q_p3 = Q ** 3;

    let z;
    if (R ** 2 < Q_p3) { // Three Real Solutions (Viete) - we calculate only the largest one
        let theta = Q === 0 ? 0 : Math.acos(R / Math.sqrt(Q_p3)); // theta in [0, Math.pi]
        let cQ = (-1) * 2 * Math.sqrt(Q);
        let phi = (theta + 2 * Math.PI) / 3;
        // the largest solution:
        z = cQ * Math.cos(phi) - a2 / 3;
    }
    else { // One real solution
        let A = (-1) * Math.sign(R) * Math.cbrt(Math.abs(R) + Math.sqrt(R ** 2 - Q_p3))
        let B = A === 0 ? 0 : Q / A;
        // solution:
        z = (A + B) - a2 / 3; // same as in ver 1 except for B = 0 when A = 0
    }

    return clampNum(0, z, 1); // the largest real solution clamped to [0, 1] for the Lightness
}