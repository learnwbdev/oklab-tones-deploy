import express from "express";
import paletteController from "../controllers/palette_controller.js";
import validateColorFormat from "../controllers/common/validateColorFormat.js";

const router = express.Router();

// проверка, что входной формат цвета поддерживается
router.param("baseColorFormat", validateColorFormat.checkColorFormatBase);
router.param("baseColorValue", validateColorFormat.checkColorValue);

// Ex. /palette/hex/1f1f05
// сформировать и отправить палитру цветов
router.get(
  "/:baseColorFormat/:baseColorValue",
  [paletteController.createPalette],
  paletteController.getPalette
);

// выгрузить палитру цветов в файл
router.get(
  "/:baseColorFormat/:baseColorValue/download",
  [paletteController.createPalette, paletteController.createFileForPalette],
  paletteController.downloadPalette
);

export default router;
