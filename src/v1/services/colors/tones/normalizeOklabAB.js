// Normalize *a, *b from Oklab color, so  a^2 + b^2 == 1
/**
 * @param {number} aOklab as -1..1 - a for Oklab color (how green/red the color is)
 * @param {number} bOklab as -1..1 - b for Oklab color (how blue/yellow the color is)
 * @return {number[]} Array of aOklab_norm, bOklab_norm as -1..1, normalized, so a^2 + b^2 == 1
 */

/* source:
            https://bottosson.github.io/posts/gamutclipping/#gamut-clipping-2
*/

// normalize a, b, so a^2 + b^2 == 1
export function normalizeOklabAb (aOklab, bOklab) {
    const eps = 0.00001; // to not divide by zero (to find a_ and b_)
    const C = Math.max(eps, Math.sqrt(aOklab ** 2 + bOklab ** 2)); // Chroma

    // normalized a, b, so a^2 + b^2 == 1
    const aOklab_norm = aOklab / C;
    const bOklab_norm = bOklab / C;

    if (aOklab_norm === 0 && bOklab_norm === 0) console.log(`normalizeOklabAb: a_norm and b_norm = 0, a: ${aOklab}, b: ${bOklab}, C: ${C}`)

    return [aOklab_norm, bOklab_norm];
}