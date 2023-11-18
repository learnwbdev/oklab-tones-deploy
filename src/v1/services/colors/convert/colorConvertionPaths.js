// Available paths to convert colors to and from for one-step convertion

import { colorSpaces } from "./colorSpaces.js";

// export const convertPathAdjMatrix = [
//       // Hex  sRgb  lnRGB  XYZ  Lab  Oklab  Lch  Oklch
//        [  0 ,   1 ,   0  ,  0 ,  0 ,   0  ,  0 ,   0   ], // Hex
//        [  1 ,   0 ,   1  ,  0 ,  0 ,   0  ,  0 ,   0   ], // sRgb
//        [  0 ,   1 ,   0  ,  1 ,  0 ,   1  ,  0 ,   0   ], // lnRGB
//        [  0 ,   0 ,   1  ,  0 ,  1 ,   1  ,  0 ,   0   ], // XYZ
//        [  0 ,   0 ,   0  ,  1 ,  0 ,   0  ,  1 ,   0   ], // Lab
//        [  0 ,   0 ,   1  ,  1 ,  0 ,   0  ,  0 ,   1   ], // Oklab
//        [  0 ,   0 ,   0  ,  0 ,  1 ,   0  ,  0 ,   0   ], // Lch
//        [  0 ,   0 ,   0  ,  0 ,  0 ,   1  ,  0 ,   0   ], // Oklch
//       // Hex  sRgb  lnRGB  XYZ  Lab  Oklab  Lch  Oklch
// ];

export const convertPathGraphNodes = {
      [ colorSpaces.Hex        ] : [ colorSpaces.sRgb                                                                               ],
      [ colorSpaces.sRgb       ] : [ colorSpaces.Hex        , colorSpaces.linSRgb                                                   ],
      [ colorSpaces.linSRgb    ] : [ colorSpaces.sRgb       , colorSpaces.XYZ      , colorSpaces.Oklab  ,  colorSpaces.OklabGamma   ],
      [ colorSpaces.XYZ        ] : [ colorSpaces.linSRgb    , colorSpaces.Lab      , colorSpaces.Oklab  ,  colorSpaces.linDspP3   ,
                                     colorSpaces.OklabGamma , colorSpaces.XYZipt   , colorSpaces.XYZcie ,  colorSpaces.CAM16,       ],
      [ colorSpaces.Lab        ] : [ colorSpaces.XYZ        , colorSpaces.Lch                                                       ],
      [ colorSpaces.Oklab      ] : [ colorSpaces.linSRgb    , colorSpaces.XYZ      , colorSpaces.Oklch                              ],
      [ colorSpaces.Lch        ] : [ colorSpaces.Lab                                                                                ],
      [ colorSpaces.Oklch      ] : [ colorSpaces.Oklab                                                                              ],
      [ colorSpaces.linDspP3   ] : [ colorSpaces.dispP3     , colorSpaces.XYZ                                                       ],
      [ colorSpaces.dispP3     ] : [ colorSpaces.linDspP3                                                                           ],
      [ colorSpaces.OklabGamma ] : [ colorSpaces.linSRgb    , colorSpaces.XYZ      , colorSpaces.OklchGamma                         ],
      [ colorSpaces.OklchGamma ] : [ colorSpaces.OklabGamma                                                                         ],
      [ colorSpaces.IPT        ] : [ colorSpaces.XYZipt     , colorSpaces.IPTch                                                     ],
      [ colorSpaces.IPTch      ] : [ colorSpaces.IPT                                                                                ],
      [ colorSpaces.XYZipt     ] : [ colorSpaces.XYZ        , colorSpaces.IPT                                                       ],
      [ colorSpaces.XYZcie     ] : [ colorSpaces.XYZ        , colorSpaces.JzAzBz   , colorSpaces.ICtCp   , colorSpaces.OsaUcs       ],
      [ colorSpaces.JzAzBz     ] : [ colorSpaces.XYZcie     , colorSpaces.JzCzHz                                                    ],
      [ colorSpaces.JzCzHz     ] : [ colorSpaces.JzAzBz                                                                             ],
      [ colorSpaces.CAM16      ] : [ colorSpaces.XYZ        , colorSpaces.CAM16Ucs                                                  ],
      [ colorSpaces.CAM16Ucs   ] : [ colorSpaces.CAM16                                                                              ],
      [ colorSpaces.ICtCp      ] : [ colorSpaces.XYZcie        , colorSpaces.ICtCpch                                                ],
      [ colorSpaces.ICtCpch    ] : [ colorSpaces.ICtCp                                                                              ],
      [ colorSpaces.OsaUcs     ] : [ colorSpaces.XYZcie        , colorSpaces.OsaUcsCh                                               ],
      [ colorSpaces.OsaUcsCh   ] : [ colorSpaces.OsaUcs                                                                             ],
};