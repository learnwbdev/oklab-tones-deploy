// Convert HEX to RGB
/**
 * @param {string} HEX color
 * @return {number[]} reference - Array of sRGB values: R as 0..1, G as 0..1 , B as 0..1
 */

export function convertHexToSRgb(colorHEX) {
    /* sources:
                // https://learnersbucket.com/examples/interview/convert-hex-color-to-rgb-in-javascript/
    */
   // `#?` - colorHEX could be in format #ffffff or ffffff
   const regexNormal = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
   const regexShort = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;

   // returns null if not in format like #ffffff
   const arrNormal = colorHEX.match(regexNormal);
   const arrShort = colorHEX.match(regexShort);

   // array of hex values for r, g, b. Ex. ['ff', 'ff', 'ff'] or ['f', 'f', 'f']
   const arrHex = (arrNormal ? arrNormal : arrShort)?.slice(1);
   // hex multiplier, ex. to make f to ff
   const mlpHex = arrNormal ? 0x1 : 0x11;

   // `?? []` - to return [undefined, undefined, undefined], if arrHex is undefined
   const [r, g, b] = arrHex?.map(c => parseInt(c, 16) * mlpHex) ?? []

   return [r, g, b];
  }