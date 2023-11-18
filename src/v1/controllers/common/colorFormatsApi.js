import { colorSpaces } from "../../services/colors/convert/colorSpaces.js";

// соответствие express route цветовому пространству из colorSpaces
export const mapColorFormatApiToColorSpace = new Map([
  ["hex", colorSpaces.Hex],
  ["rgb", colorSpaces.sRgb],
  ["oklch", colorSpaces.Oklch],
]);

export const spaceLci = "lci"; // смешанный формат цвета: Lab-Cam16-Ipt
