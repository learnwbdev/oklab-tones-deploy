import { convertColor } from "./convertColor.js";
import { colorSpaces } from "./colorSpaces.js";
import { spaceLci } from "../../../controllers/common/colorFormatsApi.js";

const convertColorApi = (colorOrg, colorSpaceFrom, colorSpaceTo) => {
  let targetColor;
  if (colorSpaceTo === spaceLci) {
    targetColor = [
      convertColor(colorOrg, colorSpaceFrom, colorSpaces.Lab)[0],
      convertColor(colorOrg, colorSpaceFrom, colorSpaces.CAM16)[1],
      convertColor(colorOrg, colorSpaceFrom, colorSpaces.IPTch)[2],
    ];
  } else {
    targetColor = convertColor(colorOrg, colorSpaceFrom, colorSpaceTo);
  }

  // сформировать объект цвета с названиями компонентов
  const targetColorObj =
    colorSpaceTo === colorSpaces.Hex
      ? { color: targetColor }
      : colorSpaceTo === colorSpaces.sRgb
      ? {
          red: targetColor[0],
          green: targetColor[1],
          blue: targetColor[2],
        }
      : colorSpaceTo === colorSpaces.Oklch
      ? {
          lightness: targetColor[0].toFixed(2),
          chroma: targetColor[1].toFixed(3),
          hue: targetColor[2].toFixed(2),
        }
      : colorSpaceTo === spaceLci // смешанный формат цвета: Lab-Cam16-Ipt
      ? {
          lightness: targetColor[0].toFixed(2),
          chroma: targetColor[1].toFixed(2),
          hue: targetColor[2].toFixed(2),
        }
      : {};

  return { targetColor, targetColorObj };
};

export default convertColorApi;
