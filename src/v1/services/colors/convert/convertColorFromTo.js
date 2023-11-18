// Uniform one-step conversion function

/**
 * @param colorToConvert {string | number[]} - color to convert
 * @param colorSpaceFrom {string} - color space/format to convert from
 * @param colorSpaceTo {string}   - color space/format to convert to
 * @param {boolean} [isSimpleCalcCam16 = true] - flag to use default Viewing conditions (to not recalculate parameters) and to not calculate all values for CAM16 color
 * @return {string | number[] | undefined} - converted color
 */

import { colorSpaces } from "./colorSpaces.js";
import { convertHexToSRgb } from "./oneStepConversions/RGB/convertHexToSRgb.js";
import { convertSRgbToLnSRgb } from "./oneStepConversions/RGB/convertSRgbToLnSRgb.js";
import { convertLnSRgbToOklab } from "./oneStepConversions/RGB/convertLnSRgbToOklab.js";
import { convertOklabToOklch } from "./oneStepConversions/Oklab/convertOklabToOklch.js";
import { convertOklchToOklab } from "./oneStepConversions/Oklab/convertOklchToOklab.js";
import { convertOklabToLnSRgb } from "./oneStepConversions/Oklab/convertOklabToLnSRgb.js";
import { convertLnSRgbToSRgb } from "./oneStepConversions/RGB/convertLnSRgbToSRgb.js";
import { convertSRgbToHex } from "./oneStepConversions/RGB/convertSRgbToHex.js";
import { convertLnSRgbToXyz } from "./oneStepConversions/RGB/convertLnSRgbToXyz.js";
import { convertXyzToLab } from "./oneStepConversions/XYZ/convertXyzToLab.js";
import { convertLabToLch } from "./oneStepConversions/Lab/convertLabToLch.js";
import { convertLchToLab } from "./oneStepConversions/Lab/convertLchToLab.js";
import { convertLabToXyz } from "./oneStepConversions/Lab/convertLabToXyz.js";
import { convertXyzToLnSRgb } from "./oneStepConversions/XYZ/convertXyzToLnSRgb.js";
import { convertXyzToOklab } from "./oneStepConversions/XYZ/convertXyzToOklab.js";
import { convertOklabToXyz } from "./oneStepConversions/Oklab/convertOklabToXyz.js";
import { convertXyzToLnDspP3 } from "./oneStepConversions/XYZ/convertXyzToLnDspP3.js";
import { convertLnDspP3ToXyz } from "./oneStepConversions/RGB/convertLnDspP3ToXyz.js";
import { convertLnDspP3ToDspP3 } from "./oneStepConversions/RGB/convertLnDspP3ToDspP3.js";
import { convertDspP3ToLnDspP3 } from "./oneStepConversions/RGB/convertDspP3ToLnDspP3.js";
import { convertOklabGammaToXyz } from "./oneStepConversions/Oklab/convertOklabGammaToXyz.js";
import { convertXyzToOklabGamma } from "./oneStepConversions/XYZ/convertXyzToOklabGamma.js";
import { convertOklabGammaToLnSRgb } from "./oneStepConversions/Oklab/convertOklabGammaToLnSRgb.js";
import { convertLnSRgbToOklabGamma } from "./oneStepConversions/RGB/convertLnSRgbToOklabGamma.js";
import { convertXyzIptToIpt } from "./oneStepConversions/XYZ/convertXyzIptToIpt.js";
import { convertIptToXyzIpt } from "./oneStepConversions/IPT/convertIptToXyzIpt.js";
import { convertIptToIptCh } from "./oneStepConversions//IPT/convertIptToIptCh.js";
import { convertIptChToIpt } from "./oneStepConversions/IPT/convertIptChToIpt.js";
import { convertXyzToXyzIpt } from "./oneStepConversions/XYZ/convertXyzToXyzIpt.js";
import { convertXyzIptToXyz } from "./oneStepConversions/XYZ/convertXyzIptToXyz.js";
import { convertXyzToXyzCie } from "./oneStepConversions/XYZ/convertXyzToXyzCie.js";
import { convertXyzCieToXyz } from "./oneStepConversions/XYZ/convertXyzCieToXyz.js";
import { convertXyzToCam16 } from "./oneStepConversions/XYZ/convertXyzToCam16.js";
import { convertCam16ToXyz } from "./oneStepConversions/Cam16/convertCam16ToXyz.js";
import { convertCam16ToCam16Ucs } from "./oneStepConversions/Cam16/convertCam16ToCam16Ucs.js";
import { convertCam16UcsToCam16 } from "./oneStepConversions/Cam16/convertCam16UcsToCam16.js";
import { convertXyzCieToJzAzBz } from "./oneStepConversions/XYZ/convertXyzCieToJzAzBz.js";
import { convertJzAzBzToXyzCie } from "./oneStepConversions/JzAzBz/convertJzAzBzToXyzCie.js";
import { convertJzAzBzToJzCzHz } from "./oneStepConversions/JzAzBz/convertJzAzBzToJzCzHz.js";
import { convertJzCzHzToJzAzBz } from "./oneStepConversions/JzAzBz/convertJzCzHzToJzAzBz.js";
import { convertXyzCieToICtCp } from "./oneStepConversions/XYZ/convertXyzCieToICtCp.js";
import { convertICtCpToXyzCie } from "./oneStepConversions/ICtPt/convertICtCpToXyzCie.js";
import { convertICtCpToICtCpch } from "./oneStepConversions/ICtPt/convertICtCpToICtCpch.js";
import { convertICtCpchToICtCp } from "./oneStepConversions/ICtPt/convertICtCpchToICtCp.js";
import { convertXyzCieToOsaUcs } from "./oneStepConversions/XYZ/convertXyzCieToOsaUcs.js";
import { convertOsaUcsToOsaUcsCh } from "./oneStepConversions/OsaUcs/convertOsaUcsToOsaUcsCh.js";
import { convertOsaUcsChToOsaUcs } from "./oneStepConversions/OsaUcs/convertOsaUcsChToOsaUcs.js";


export function convertColorFromTo(colorToConvert, colorSpaceFrom, colorSpaceTo, {isSimpleCalcCam16 = true} = {}) {
  return ( colorSpaceFrom === colorSpaces.Hex && colorSpaceTo === colorSpaces.sRgb) ?
             convertHexToSRgb(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.sRgb && colorSpaceTo === colorSpaces.linSRgb) ?
             convertSRgbToLnSRgb(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.linSRgb && colorSpaceTo === colorSpaces.Oklab) ?
             convertLnSRgbToOklab(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.Oklab && colorSpaceTo === colorSpaces.Oklch) ?
             convertOklabToOklch(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.Oklch && colorSpaceTo === colorSpaces.Oklab) ?
             convertOklchToOklab(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.Oklab && colorSpaceTo === colorSpaces.linSRgb) ?
             convertOklabToLnSRgb(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.linSRgb && colorSpaceTo === colorSpaces.sRgb) ?
             convertLnSRgbToSRgb(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.sRgb && colorSpaceTo === colorSpaces.Hex) ?
             convertSRgbToHex(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.linSRgb && colorSpaceTo === colorSpaces.XYZ) ?
             convertLnSRgbToXyz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.Lab) ?
             convertXyzToLab(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.Lab && colorSpaceTo === colorSpaces.Lch) ?
             convertLabToLch(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.Lch && colorSpaceTo === colorSpaces.Lab) ?
             convertLchToLab(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.Lab && colorSpaceTo === colorSpaces.XYZ) ?
             convertLabToXyz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.linSRgb) ?
             convertXyzToLnSRgb(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.Oklab) ?
             convertXyzToOklab(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.Oklab && colorSpaceTo === colorSpaces.XYZ) ?
             convertOklabToXyz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.linDspP3) ?
             convertXyzToLnDspP3(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.linDspP3 && colorSpaceTo === colorSpaces.XYZ) ?
             convertLnDspP3ToXyz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.linDspP3 && colorSpaceTo === colorSpaces.dispP3) ?
             convertLnDspP3ToDspP3(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.dispP3 && colorSpaceTo === colorSpaces.linDspP3) ?
             convertDspP3ToLnDspP3(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.OklabGamma && colorSpaceTo === colorSpaces.OklchGamma) ?
             convertOklabToOklch(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.OklchGamma && colorSpaceTo === colorSpaces.OklabGamma) ?
             convertOklchToOklab(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.OklabGamma) ?
             convertXyzToOklabGamma(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.OklabGamma && colorSpaceTo === colorSpaces.XYZ) ?
             convertOklabGammaToXyz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.linSRgb && colorSpaceTo === colorSpaces.OklabGamma) ?
             convertLnSRgbToOklabGamma(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.OklabGamma && colorSpaceTo === colorSpaces.linSRgb) ?
             convertOklabGammaToLnSRgb(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZipt && colorSpaceTo === colorSpaces.IPT) ?
             convertXyzIptToIpt(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.IPT && colorSpaceTo === colorSpaces.XYZipt) ?
             convertIptToXyzIpt(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.IPT && colorSpaceTo === colorSpaces.IPTch) ?
             convertIptToIptCh(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.IPTch && colorSpaceTo === colorSpaces.IPT) ?
             convertIptChToIpt(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.XYZipt) ?
             convertXyzToXyzIpt(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZipt && colorSpaceTo === colorSpaces.XYZ) ?
             convertXyzIptToXyz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.XYZcie) ?
             convertXyzToXyzCie(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZcie && colorSpaceTo === colorSpaces.XYZ) ?
             convertXyzCieToXyz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZ && colorSpaceTo === colorSpaces.CAM16) ?
             convertXyzToCam16(colorToConvert, {isSimpleCalcCam16: isSimpleCalcCam16}) :
         ( colorSpaceFrom === colorSpaces.CAM16 && colorSpaceTo === colorSpaces.XYZ) ?
             convertCam16ToXyz(colorToConvert, {isSimpleCalcCam16: isSimpleCalcCam16}) :
         ( colorSpaceFrom === colorSpaces.CAM16 && colorSpaceTo === colorSpaces.CAM16Ucs) ?
             convertCam16ToCam16Ucs(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.CAM16Ucs && colorSpaceTo === colorSpaces.CAM16) ?
             convertCam16UcsToCam16(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZcie && colorSpaceTo === colorSpaces.JzAzBz) ?
             convertXyzCieToJzAzBz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.JzAzBz && colorSpaceTo === colorSpaces.XYZcie) ?
             convertJzAzBzToXyzCie(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.JzAzBz && colorSpaceTo === colorSpaces.JzCzHz) ?
             convertJzAzBzToJzCzHz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.JzCzHz && colorSpaceTo === colorSpaces.JzAzBz) ?
             convertJzCzHzToJzAzBz(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZcie && colorSpaceTo === colorSpaces.ICtCp) ?
             convertXyzCieToICtCp(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.ICtCp && colorSpaceTo === colorSpaces.XYZcie) ?
             convertICtCpToXyzCie(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.ICtCp && colorSpaceTo === colorSpaces.ICtCpch) ?
             convertICtCpToICtCpch(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.ICtCpch && colorSpaceTo === colorSpaces.ICtCp) ?
             convertICtCpchToICtCp(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.XYZcie && colorSpaceTo === colorSpaces.OsaUcs) ?
             convertXyzCieToOsaUcs(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.OsaUcs && colorSpaceTo === colorSpaces.XYZcie) ?
            //  convertOsaUcsToXyzCie(colorToConvert) :
             [undefined, undefined, undefined] : // not realized, requires numerical methods
         ( colorSpaceFrom === colorSpaces.OsaUcs && colorSpaceTo === colorSpaces.OsaUcsCh) ?
             convertOsaUcsToOsaUcsCh(colorToConvert) :
         ( colorSpaceFrom === colorSpaces.OsaUcsCh && colorSpaceTo === colorSpaces.OsaUcs) ?
             convertOsaUcsChToOsaUcs(colorToConvert) :
         [undefined, undefined, undefined];
}