import createPalettesApi from "../services/colors/palette/createPalettesApi.js";
import fs from "fs";
import savePaletteToFileApi from "../services/colors/save-to-file/savePaletteToFileApi.js";

const paletteFilePath = "./public/palette_vals.txt";
const paletteTemplatePath = "./public/template.txt";

// создать палитру на основе базового цвета Hex из запроса
const createPalette = (req, res, next) => {
  const tonesDefault = [
    0, 1, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94,
    96, 98, 99, 100,
  ];
  // const tonesDefault = [0, 8, 20, 35, 50, 65, 80, 90, 94, 100];

  // req.colorSpaceFrom и req.colorValue - уже проверенные значения (validateColorFormat)
  const palette = createPalettesApi(req.colorValue, req.colorSpaceFrom, {
    tones: tonesDefault,
  });

  // сохранить палитру в параметры запроса
  req.palette = palette;

  next();
};

// вернуть в ответе палитру на основе базового цвета Hex из запроса
const getPalette = (req, res) => {
  res.status(200).json({ colorBase: req.colorValue, palette: req.palette });
};

// формирование файла для палитры
const createFileForPalette = async (req, res, next) => {
  // прочитать шаблон для файла в templateData
  fs.readFile(paletteTemplatePath, (errTemp, templateData) => {
    if (errTemp) {
      console.log(`Error reading template file for the palette`);
    }
    // сформировать строки для цветов палитры
    const colorsData =
      savePaletteToFileApi(req.colorValue, req.palette) +
      (templateData ? templateData : ""); // присоединить templateData если она есть (не равна undefined)
    // записать данные о цветах в файл
    fs.writeFile(paletteFilePath, colorsData, (errWrite) => {
      if (errWrite) {
        console.log(`File was not written for the palette: ${req.colorValue}`);
      }
      console.log("Color Data has been written to file successfully.");
      next();
    });
  });
};

// выгрузка файла с цветами палитры (на основе базового цвета Hex из запроса)
const downloadPalette = async (req, res, next) => {
  const filePath = paletteFilePath;
  const fileName = `palette-${req.colorValue.replace("#", "")}.css`; // имя файла по умолчанию при загрузке в браузере

  res.download(filePath, fileName, (err) => {
    if (err) {
      // Проверить отправлены ли headers
      if (res.headersSent) {
        return next(err);
      }
      return res.status(err.status).send({
        status: err.status || 400,
        message: err.message || "error",
        timestamp: Date.now(),
        path: req.originalUrl,
      });
    }
  });
};

export default {
  createPalette,
  createFileForPalette,
  getPalette,
  downloadPalette,
};
