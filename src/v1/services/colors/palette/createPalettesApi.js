import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";
import { convertColorToGrayscale } from "../convert/convertColorToGrayscale.js";
import { createPaletteOklch } from "./createPaletteOklch.js";
import rndTo from "../../subfunctions/rndTo.js";

const createPalettesApi = (
  colorFrom,
  colorSpaceFrom,
  { tones: tones } = {}
) => {
  // регулярное выражение для проверки, что цвет - это оттенок серого
  const grayColorRegex = /^#?([0-9a-f])([0-9a-f])((?=\2)\1|(?:\1\2){2})\b$/i;
  // для серого цвета выставить флаг, что цвет серый
  const isGrayColor = grayColorRegex.test(colorFrom);

  const palettes = createPaletteOklch(colorFrom, {
    colorSpaceFrom: colorSpaceFrom,
    tones: tones,
  });

  // функция формирования объекта для палитр и оттенка в формате для API
  const palettesStruct = palettes.map(
    ([paletteName, paletteHex, paletteOklch]) => {
      return {
        name: paletteName,
        tonalRow: paletteHex.reduce((newStruct, [tone, colorHex], idx) => {
          const colorOklch = paletteOklch[idx][1];
          // цвет Hex в оттенках серого
          const colorHexGray = convertColorToGrayscale(
            colorOklch,
            colorSpaces.Oklch,
            colorSpaces.Hex
          );
          // отправлять серые цвета, если базовый цвет - оттенок серого
          const colorHexOut = isGrayColor ? colorHexGray : colorHex;

          // если базовый цвет - серый, то заменить цвет Oklch на цвет серого оттенка
          let colorOklchOut = colorOklch;
          if (isGrayColor) {
            const colorOklchGray = convertColorToGrayscale(
              colorOklch,
              colorSpaces.Oklch,
              colorSpaces.Oklch
            );
            colorOklchOut = colorOklchGray;
          }

          newStruct.push({
            tone: tone,
            colorHex: colorHexOut,
            colorOklch: colorOklchOut,
            // color in grayscale
            colorHexGray: colorHexGray,
            // RGB component for the color in grayscale
            rgbGrayComp: convertColorToGrayscale(
              colorOklchOut,
              colorSpaces.Oklch,
              colorSpaces.sRgb
            )[0],
            // lightness for the color in Lab color space
            lightnLab: rndTo(
              convertColor(
                colorOklchOut,
                colorSpaces.Oklch,
                colorSpaces.Lab
              )[0],
              0
            ),
            // chroma for the color in CAM 16 color space
            chromaCam16: rndTo(
              convertColor(
                colorOklchOut,
                colorSpaces.Oklch,
                colorSpaces.CAM16
              )[1],
              1
            ),
            // hue for the color in IPT color space
            hueIpt: rndTo(
              convertColor(
                colorOklchOut,
                colorSpaces.Oklch,
                colorSpaces.IPTch
              )[2],
              0
            ),
          });
          return newStruct;
        }, []),
      };
    }
  );

  return palettesStruct;
};

export default createPalettesApi;
