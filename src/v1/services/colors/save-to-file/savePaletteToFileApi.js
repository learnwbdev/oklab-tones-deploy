import { colorSpaces } from "../convert/colorSpaces.js";
import { convertColor } from "../convert/convertColor.js";

const savePaletteToFileApi = (colorBase, palette) => {
  let dataForFile = ":root {" + "\n" + `  --source-color: ${colorBase};\n`;
  // сохранение цветов
  palette.forEach(({ name: rowName, tonalRow }) => {
    // название оттеночного ряда
    dataForFile += `\n  /* ${rowName} */ \n`;
    // цвета оттеночного ряда в формате Rgb
    dataForFile += `  /* ${rowName} - Rgb */ \n`;
    tonalRow.forEach(({ tone, colorHex }) => {
      const colorRgb = convertColor(
        colorHex,
        colorSpaces.Hex,
        colorSpaces.sRgb
      );
      dataForFile += `  --color-rgb-${rowName}-${tone}: ${colorRgb.join(
        " "
      )}; \n`;
    });
    // цвета оттеночного ряда в формате Oklch
    dataForFile += `  /* ${rowName} - Oklch */ \n`;
    tonalRow.forEach(({ tone, colorOklch }) => {
      dataForFile += `  --color-oklch-${rowName}-${tone}: ${colorOklch.join(
        " "
      )}; \n`;
    });
  });

  dataForFile += "\n";

  return dataForFile;
};

export default savePaletteToFileApi;
