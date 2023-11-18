/**
 * Convert JzAzBz color space to JzCzHz (JzAzBz in polar coordinates)
 * @param {number[]} colorJzAzBz - Array of JzAzBz values: Jz (Lightness) as 0..1, Az (redness–greenness) and Bz (yellowness–blueness) as -1 .. 1 (or -0.5..0.5)
 * @return {number[]} Array of JzCzHz values: Jz (Lightness) as 0..1, Cz (Chroma) as 0..0.5 (unbound), Hz (hue) as 0..360 (360 excluded)
*/

/* sources:
            https://observablehq.com/@jrus/jzazbz
            https://opg.optica.org/oe/fulltext.cfm?uri=oe-25-13-15131&id=368272

            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/jzazbz.py
            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/jzczhz.py
            https://github.com/colour-science/colour/blob/develop/colour/models/jzazbz.py
*/

export function convertJzAzBzToJzCzHz(colorJzAzBz) {
    // convert radians to degrees
    const toDegrees = radians => radians * (180/Math.PI);

    const [Jz, Az, Bz] = colorJzAzBz; // Jz (Lightness), Az (redness–greenness), Bz (yellowness–blueness)

    const Cz = Math.sqrt(Az ** 2 + Bz ** 2); // Chroma

    let Hz = toDegrees(Math.atan2(Bz, Az));
    Hz = Hz >= 0 ? Hz : Hz + 360; // Hue, in degrees [0 to 360)

    const colorJzCzHz = [Jz, Cz, Hz]; // perceived Lightness, Chroma, Hue

    return colorJzCzHz;
}