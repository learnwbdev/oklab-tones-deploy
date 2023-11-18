/**
 * @api {get} /palette Generate palette based on color Hex
 * @apiName GeneratePalette
 * @apiGroup Palette
 *
 * @apiParam {String{3..7}} colorHex Base color to generate a palette (in HEX format: RGB | #RGB | RRGGBB | #RRGGBB).
 *
 * @apiSuccess {String} colorBase Base color of the palette in Hex format.
 * @apiSuccess {Object} palette Generated palette.
 */

import express from "express";
import v1PaletteRouter from "./v1/routes/palette_routes.js";
import v1ConvertColorRouter from "./v1/routes/convert_color_routes.js";

const app = express();
// a port from the hosting solution, if undefined -> port 8080
const PORT = process.env.PORT || 8080; // or 3001, or 3002 (for vite)

// uncomment to deploy on a hosting solution
app.use(express.static("dist"));

app.use("/api/v1/palette", v1PaletteRouter); // генерация палитры, выгрузка цветов палитры в файл
app.use("/api/v1/convert", v1ConvertColorRouter); // конвертация цветов

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.use(errorHandler);

function errorHandler(err, req, res, next) {
  // headers уже были отправлены (не можем их изменить)
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
