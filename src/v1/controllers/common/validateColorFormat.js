import createHTTPError from "http-errors";
import { mapColorFormatApiToColorSpace, spaceLci } from "./colorFormatsApi.js";
import { colorSpaces } from "../../services/colors/convert/colorSpaces.js";

const colorFormatOrigin = {
  base: "base", // формат базового цвета для генерации палитры
  source: "source", // формат цвета, ИЗ которого требуется ковертировать цвет
  target: "target", // формат цвета, В который требуется ковертировать цвет
};

// проверка входного формата цвета
const checkColorFormat = (req, res, next, inColorFormat, formatOrigin) => {
  if (!(req.params && inColorFormat)) {
    const errorText =
      formatOrigin === colorFormatOrigin.base
        ? "No color format for the base color is specified."
        : formatOrigin === colorFormatOrigin.source
        ? "No source color format is specified."
        : formatOrigin === colorFormatOrigin.target
        ? "No target color format is specified."
        : "No color format is specified.";

    // не указан формат цвета для базового цвета палитры
    const error = new createHTTPError.BadRequest(
      `${errorText} Provide a color format. Supported color fotmats: ${[
        ...mapColorFormatApiToColorSpace.keys(),
      ].join(", ")}`
    );
    return next(error);
  }

  // найти соответствующий формат цвета в ColorSpaces
  let colorSpaceMapped = mapColorFormatApiToColorSpace.get(inColorFormat);
  // поддержка смешанного формата Lci
  colorSpaceMapped =
    inColorFormat === spaceLci && formatOrigin === colorFormatOrigin.target
      ? spaceLci
      : colorSpaceMapped;

  if (!colorSpaceMapped) {
    // указанного формата цвета (`baseColorFormat` = inColorFormat ) нет среди заданных цветовых пространств для API (mapColorFormatApiToColorSpace)
    const error = new createHTTPError.BadRequest(
      `Unsupported color format (${inColorFormat}). Supported color fotmats: ${[
        ...mapColorFormatApiToColorSpace.keys(),
      ].join(", ")}`
    );
    return next(error);
  }

  // передать дальше цветовое пространство для базового цвета
  switch (formatOrigin) {
    case colorFormatOrigin.base:
      req.colorSpaceFrom = colorSpaceMapped;
      break;
    case colorFormatOrigin.source:
      req.colorSpaceFrom = colorSpaceMapped;
      break;
    case colorFormatOrigin.target:
      req.colorSpaceTo = colorSpaceMapped;
      break;
    default:
      console.log("checkColorFormat: not correct formatOrigin");
  }
  next();
};

// проверить формат для базового цвета палитры
const checkColorFormatBase = (req, res, next, inColorFormat) => {
  checkColorFormat(req, res, next, inColorFormat, colorFormatOrigin.base);
};

// проверить формат, из которого конвертируем цвет
const checkColorFormatSource = (req, res, next, inColorFormat) => {
  checkColorFormat(req, res, next, inColorFormat, colorFormatOrigin.source);
};

// проверить формат, в который конвертируем цвет
const checkColorFormatTarget = (req, res, next, inColorFormat) => {
  checkColorFormat(req, res, next, inColorFormat, colorFormatOrigin.target);
};

// проверка соответствие значения цвета указанному формату (в :baseColorFormat)
const checkColorValue = (req, res, next, inColorValue) => {
  if (!inColorValue) {
    // не указан цвет для базового цвета палитры
    const error = new createHTTPError.BadRequest(
      `No color for the base color is specified. Provide a color value.`
    );
    return next(error);
  }

  switch (req.colorSpaceFrom) {
    case colorSpaces.Hex:
      checkColorHex(req, res, next, inColorValue);
      break;
    default: {
      const error = new createHTTPError.BadRequest(`Noy supported format.`);
      return next(error);
    }
  }
};

// проверка формата цвета Hex в параметрах запроса
function checkColorHex(req, res, next, inColorValue) {
  // регулярное выражение для проверки формата для цвета HEX (параметр colorHex)
  // форматы: RGB, #RGB, RRGGBB, #RRGGBB
  const checkHexRegex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

  if (!checkHexRegex.test(inColorValue)) {
    // colorHex не соответствует формату #RRGGBB или #RGB
    const error = new createHTTPError.BadRequest(
      `Incorrect format of the color (${inColorValue}). Color Hex should be in #RGB or #RRGGBB format.`
    );
    return next(error);
  }

  req.colorValue = inColorValue;
  next();
}

export default {
  checkColorFormatBase,
  checkColorFormatSource,
  checkColorFormatTarget,
  checkColorValue,
};
