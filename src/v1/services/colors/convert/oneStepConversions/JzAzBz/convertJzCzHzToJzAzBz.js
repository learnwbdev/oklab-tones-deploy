/**
 * Convert JzCzHz (JzAzBz in polar coordinates) to JzAzBz color space
 * @param {number[]} colorJzCzHz - Array of JzCzHz values: Jz (Lightness) as 0..1, Cz (Chroma) as 0..0.5 (unbound), Hz (hue) as 0..360 (360 excluded)
 * @return {number[]} Array of JzAzBz values: Jz (Lightness) as 0..1, Az (redness–greenness) and Bz (yellowness–blueness) as -1 .. 1 (or -0.5..0.5)
*/

/* sources:
            https://observablehq.com/@jrus/jzazbz
            https://opg.optica.org/oe/fulltext.cfm?uri=oe-25-13-15131&id=368272

            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/jzazbz.py
            https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/jzczhz.py
            https://github.com/colour-science/colour/blob/develop/colour/models/jzazbz.py
*/

export function convertJzCzHzToJzAzBz(colorJzCzHz) {

    // convert degrees to radians
    const toRadians = degrees => degrees * (Math.PI/180);

    const [Jz, Cz, Hz] = colorJzCzHz; // Jz - perceived Lightness, Cz - Chroma, Hz - Hue

    const Az = Cz * Math.cos(toRadians(Hz)); // Az (redness–greenness) - how green/red the color is
    const Bz = Cz * Math.sin(toRadians(Hz)); // Bz (yellowness–blueness) - how blue/yellow the color is

    const colorJzAzBz = [Jz, Az, Bz];

    return colorJzAzBz;
}