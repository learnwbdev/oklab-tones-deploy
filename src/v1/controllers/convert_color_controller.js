import convertColorApi from "../services/colors/convert/convertColorApi.js";
import { spaceLci } from "./common/colorFormatsApi.js";

// конвертация цвета в другой формат / другое цветовое пространство
const convertColorFormat = (req, res, next) => {
  if (req.colorSpaceFrom && req.colorSpaceTo) {
    const { targetColor: colorConverted, targetColorObj: colorConvertedObj } =
      convertColorApi(req.colorValue, req.colorSpaceFrom, req.colorSpaceTo);

    res.status(200).json({
      sourceFormat: req.params.sourceFormat,
      targetFormat: req.params.targetFormat,
      sourceColor: req.colorValue,
      targetColor: colorConverted, // цвет списком
      targetColorComp: colorConvertedObj, // объект с названиями компонентов цвета
    });
  }

  next();
};

const convertToLci = (req, res, next) => {
  req.colorSpaceTo = spaceLci; // смешанный формат цвета: Lab-Cam16-Ipt
  next();
};

export default { convertColorFormat, convertToLci };
