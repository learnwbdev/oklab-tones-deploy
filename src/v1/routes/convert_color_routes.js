import express from "express";
import convertColorController from "../controllers/convert_color_controller.js";
import validateColorFormat from "../controllers/common/validateColorFormat.js";
import { spaceLci } from "../controllers/common/colorFormatsApi.js";

const router = express.Router();

// проверить корректность формата цвета из запроса
// router.use(paletteController.checkColorHex);
// isValidColorInput

router.param("sourceFormat", validateColorFormat.checkColorFormatSource);
router.param("targetFormat", validateColorFormat.checkColorFormatTarget);
router.param("sourceColorValue", validateColorFormat.checkColorValue);

// Ex. /hex/rgb/colorValue
router.get(
  "/:sourceFormat/:targetFormat/:sourceColorValue",
  convertColorController.convertColorFormat
);

// Lci - смешанный формат цвета: Lightness от Lab, Chroma от CAM16, Hue от IPT
router.get(
  `/:sourceFormat/${spaceLci}/:sourceColorValue`,
  convertColorController.convertToLci,
  convertColorController.convertColorFormat
);

export default router;
