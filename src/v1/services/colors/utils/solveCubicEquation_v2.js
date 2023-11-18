/**
 * Find real solutions for the cubic equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a2 - coefficient a2 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a1 - coefficient a1 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a0 - coefficient a0 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @returns {number[]} Array of real solutions in increasing order z1, z2, z3 (z1 >= z2 >= z3)
 */

// algorithm from // https://iate.oac.uncor.edu/~mario/materia/nr/numrec/f5-6.pdf
// z ** 3 + a2 * z ** 2 + a1 * z + a0 = 0
export function solveCubicEquation_v2(a2, a1, a0) {
    let Q = (a2 ** 2 - 3 * a1) / 9; // = -q from v1
    let R = (2 * a2 ** 3 - 9 * a2 * a1 + 27 * a0) / 54;  // = -r from v1
    let Q_p3 = Q ** 3;

    let z = []; // array of real solutions

    if (R ** 2 < Q_p3) { // Three Real Solutions (Viete)
        let theta = Q === 0 ? 0 : Math.acos(R / Math.sqrt(Q_p3)); // theta in [0, Math.pi]

        let cQ = (-1) * 2 * Math.sqrt(Q);
        let cA = a2 / 3;

        let arrPhi = [
             theta                / 3,
            (theta - 2 * Math.PI) / 3,
            (theta + 2 * Math.PI) / 3,
        ];

        // solutions: z1 >= z2 >= z3
        z = arrPhi.toReversed().map(phi => cQ * Math.cos(phi) - cA);

    }
    else { // One real solution
        let A = (-1) * Math.sign(R) * Math.cbrt(Math.abs(R) + Math.sqrt(R ** 2 - Q_p3))
        let B = A === 0 ? 0 : Q / A;
        let z1 = (A + B) - a2 / 3; // same as in ver 1 except for B = 0 when A = 0
        z.push(z1);
    }

    return z; // array of real solutions z1, z2, z3 (z1 >= z2 >= z3)
}