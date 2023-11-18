/**
 * Find real solutions for the cubic equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a2 - coefficient a2 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a1 - coefficient a1 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @param {number} a0 - coefficient a0 for equation x *** 3 + a2 * x ** 2 + a1 * x + a0 = 0
 * @returns {number[]} Array of real solutions in increasing order z1, z2, z3 (z1 >= z2 >= z3)
 */

// algorithm from https://quarticequations.com/Cubic.pdf
// z *** 3 + a2 * z ** 2 + a1 * z + a0 = 0
export function solveCubicEquation_v1(a2, a1, a0) {
    let q =  a1 / 3  - ( a2 ** 2 ) / 9;
    let r = (a1 * a2 - 3 * a0) / 6 - ( a2 ** 3 ) / 27;

    let rq = r ** 2 + q ** 3;

    let z = []; // array of real solutions

    if ( rq > 0 ) { // Only One Real Solution, Numerical Recipes
        let A = Math.cbrt(Math.abs(r) + Math.sqrt(rq));
        let t1 = Math.sign(r) * (A - ( q / A ))
        let z1 = t1 - ( a2 / 3 )
        z.push(z1);
    }
    else { // Three Real Solutions (Viete)
        let theta = q < 0 ? (Math.acos(r / (-q) ** (3/2))) : 0; // else should be q === 0
        // theta should be [0, Math.pi]

        let phi1 = theta / 3 ;
        let phi2 = phi1 - 2 * Math.PI / 3;
        let phi3 = phi1 + 2 * Math.PI / 3;

        let phis = [phi1, phi2, phi3];

        // solutions: z1 >= z2 >= z3
        let kq = 2 * Math.sqrt(-q);
        let ka = a2 / 3 ;
        // z1, z2, z3. Ex: z1 = kq * Math.cos(phi1) - ka
        z = phis.map(phi => kq * Math.cos(phi) - ka);
    }

    return z; // array of real solutions z1, z2, z3 (z1 >= z2 >= z3)
}