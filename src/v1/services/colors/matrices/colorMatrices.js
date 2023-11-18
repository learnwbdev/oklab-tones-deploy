/*
Oklab class.

Adapted to Python for ColorAide by Isaac Muse (2021)

---- License ----

Copyright (c) 2021 Björn Ottosson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* from https://github.com/facelessuser/coloraide/blob/main/tools/calc_oklab_matrices.py
Calculate `oklab` matrices.

Björn Ottosson, in his original calculations, used a different white point than
what CSS and most other people use. At the CSS repository, he commented on
how to calculate the M1 matrix using the exact same white point as CSS. He
provided the initial matrix which we call M0.
https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-945714988.
This M0 matrix is used to create a precise matrix to convert XYZ to using
the D65 white point as specified by CSS and used by most people. We use
the D65 chromaticity coordinates of `(0.31270, 0.32900)` which is documented
and used for sRGB as the standard. There are likely implementations unaware
that the should, or even how to adapt the Oklab M1 matrix to their white point
as this is not documented in the author's Oklab blog post, but is buried in a
CSS repository issue.

Additionally, the documented M2 matrix is specified as 32 bit values, and the
inverse is calculated directly from the this 32 bit matrix. The forward and
reverse transform is calculated to perfect convert 32 bit values, but when
translating to 64 bit, especially for achromatic colors, adds a lot of noise
after about 7 - 8 digits, the precision of 32 bit floats.

To provide an M2 matrix that works better for 64 bit, we take the inverse M2,
which provides a perfect transforms to white from Oklab `[1, 0, 0]` in 32 bit
floating point. We process matrix as a float 32 bit values and emit it as a 64
double values, ~17 digit double accuracy. Then we apply a slight correction to
account for the 64 bit noise to ensure it converts a perfect Oklab `[1, 0, 0]`
to LMS `[1, 1, 1]`. Once corrected, we then calculate the forward matrix. This
gives us a transform in 64 bit that drives chroma extremely close to zero for
64 bit doubles and maintains 32 bit precision of up to about 7 digits, the 32
bit accuracy limit (~7.22).
*/

/*
    Matrices should follow these:
    1. to get approximately indentity matrix when multiplied with inverse matrix
    3. matrix `OKLab__to__LMS_3` should give for Oklab white color [1, 0, 0] - color LMS [1, 1, 1]
       so the values in first column of the matrix OKLab__to__LMS_3 should be equal 1 (it was already so)
 !! 4. matrix `LMS__to__lin_sRGB`: sum of values in the rows should give 1 to get [1, 1, 1]
       it's needed to get the perfect grayscale color [L**3, L**3, L**3] (linear RGB) for Chroma = 0 ( or a = b = 0)
       when converting Oklch/Oklab color to linear RGB
       it was not so for the original matrices from Color Aide,
       gave approximate result: [ 0.9999999999999998, 0.9999999999999998, 0.9999999999999997 ]
    5. matrix `LMS_3__to__OKLab`: sum of values in the rows should give [1, 0, 0]
       to get Chroma = 0 (or a = b = 0) and L = (linearRGB) ** 1/3 for grayscale color [linearRGB, linearRGB, linearRGB] (linear RGB color)
       Original matrices gave approximately zeros, gave 1 : [ 1, -2.7755575615628914e-16, 1.1102230246251565e-16 ]
    6. Should conform test points from original article (https://bottosson.github.io/posts/oklab/#table-of-example-xyz-and-oklab-pairs)
       Should be computed by transforming the XYZ coordinates to Oklab and rounding to three decimals.
       XYZ [ 0.950, 1.000, 1.089 ] -> OKlab [ 1.000,  0.000,  0.000 ]
       XYZ [ 1.000, 0.000, 0.000 ] -> OKlab [ 0.450,  1.236, -0.019 ]
       XYZ [ 0.000, 1.000, 0.000 ] -> OKlab [ 0.922, -0.671,  0.263 ]
       XYZ [ 0.000, 0.000, 1.000 ] -> OKlab [ 0.153, -1.415, -0.449 ]
*/

/*
 matrices sources:
                    https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/srgb_linear.py
                    https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/oklab/__init__.py
                    https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/okhsl.py
                    https://github.com/facelessuser/coloraide/blob/main/tools/calc_oklab_matrices.py
                    https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/display_p3_linear.py
                    https://github.com/w3c/csswg-drafts/issues/6642#issuecomment-945714988

                    https://bottosson.github.io/posts/oklab/#converting-from-xyz-to-oklab
                    https://bottosson.github.io/posts/gamutclipping/#intersection-with-srgb-gamut

                    (IPT):
                    https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ipt.py
                    https://en.wikipedia.org/wiki/ICtCp#In_IPT
                    https://github.com/colour-science/colour/blob/develop/colour/models/ipt.py

                    (JzAzBz)
                    https://opg.optica.org/oe/fulltext.cfm?uri=oe-25-13-15131&id=368272
                    https://observablehq.com/@jrus/jzazbz
                    https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/jzazbz.py
                    https://github.com/colour-science/colour/blob/develop/colour/models/jzazbz.py

                    (ICtCp)
                    https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf
                    https://github.com/facelessuser/coloraide/blob/main/coloraide/spaces/ictcp.py
                    https://en.wikipedia.org/wiki/ICtCp

                    (Chromatic Adaptation):
                    https://en.wikipedia.org/wiki/LMS_color_space
                    http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
                    https://onlinelibrary.wiley.com/doi/pdf/10.1002/9781119021780.app3
                    (D50 to D65 example):
                    https://www.w3.org/TR/css-color-4/#color-conversion-code

*/

/*
    Matrices from Color Aide were slightly corrected to follow rules above and to be more like matrices from fractions
    // colorMatrices_v0_wout_js_rnd_v_2_precise sums
*/

// white point: D65 (no chromatic adaptation), D65 chromaticity coordinates of `(0.31270, 0.32900)` (specified in Rec BT.2020)

// linear sRGB to XYZ D65 from calculation from fractions and corrected values to make sum of values in the second row = 1
// sum of values in the second row should be = 1
// sum of values in the second row = 1
export const lin_sRGB__to__XYZ_D65 = [
    [  0.412390799265959500 ,  0.357584339383877960 ,  0.180480788401834300 ],
    [  0.212639005871510360 ,  0.715168678767755919 ,  0.072192315360733721 ],
    [  0.019330818715591850 ,  0.119194779794625990 ,  0.950532152249660600 ],
];
// XYZ D65 to linear sRGB from Color Aide
export const XYZ_D65__to__lin_sRGB = [
    [  3.240969941904521300 , -1.537383177570093500 , -0.498610760293003300 ],
    [ -0.969243636280879800 ,  1.875967501507720700 ,  0.041555057407175610 ],
    [  0.055630079696993610 , -0.203976958888976560 ,  1.056971514242878600 ],
];

// linear Display P3 to XYZ D65 (matrix from Color Aide)
// sum of values in the second row should be = 1
// sum of values in the second row = 1
// could be corrected identity matrix doesn't have 1s (has approx. 1s)
export const lin_Display_P3__to__XYZ_D65 = [
    [  0.48657094864821615    ,  0.26566769316909306 ,  0.19821728523436247 ],
    [  0.22897456406974878    ,  0.6917385218365063  ,  0.07928691409374498 ],
    [ -3.9720755169334874e-17 ,  0.04511338185890263 ,  1.0439443689009757  ],  // # 0 was computed as -3.972075516933488e-17
];
// XYZ D65 to linear Display P3 (matrix from Color Aide)
export const XYZ_D65__to__lin_Display_P3 = [
    [  2.4934969119414254  , -0.931383617919124   , -0.4027107844507169   ],
    [ -0.8294889695615748  ,  1.7626640603183465  ,  0.023624685841943587 ],
    [  0.03584583024378447 , -0.07617238926804183 ,  0.9568845240076874   ],
];

// XYZ D65 to LMS for Oklab (slightly corrected Color Aide matrix based on matrix from fractions) to make 1 in diagonals in identity matrix of XYZ_D65__to__LMS_Oklab*LMS_Oklab__to__XYZ_D65
// corrected to give [1, 1, 1] when multiplied with whipe point D-65: [3127 / 3290, 1, 3583 / 3290 ]
// Color Aide matrix gives [0.9999999999999999, 1, 1]
export const XYZ_D65__to__LMS_Oklab = [
    [  0.81902243799670298 ,  0.36190626005289043 , -0.12887378152098789 ],
    [  0.03298365393238838 ,  0.92928686158634340 ,  0.03614466635064236 ],
    [  0.04817718935962420 ,  0.26423953175273083 ,  0.63354782846943085 ],
];

// LMS (Oklab) to XYZ D65 (changed to make 1 in diagonals of identity matrix for LMS_Oklab__to__XYZ_D65 * XYZ_D65__to__LMS_Oklab and XYZ_D65__to__LMS_Oklab * LMS_Oklab__to__XYZ_D65 )
// sum of values in row 2 should be equal 1 (for perfect convertion od the grayscale color, to make Y in XYZ = L ** 3 for Oklab grayscale color [L, 0, 0] )
// sum of values in row 2 = 1
export const LMS_Oklab__to__XYZ_D65 = [
    [  1.22687987584592420 , -0.55781499446021700 ,  0.28139104566596470 ],
    [ -0.04057574521480076 ,  1.11228680328031700 , -0.07171105806551627 ],
    [ -0.07637293667466008 , -0.42149333240224320 ,  1.58692401983678168 ],
];

// LMS ** 1/3 to Oklab, Color Aide matrices corrected:
// should give for color LMS white [1, 1, 1]  - Oklab white color [1, 0, 0]
// sum of rows should be [1, 0, 0]
export const LMS_3__to__OKLab = [
    [  0.2104542683093139600 ,  0.7936177747023052985 , -0.0040720430116192585 ],
    [  1.9779985324311687300 , -2.4285922420485800000 ,  0.4505937096174112700 ],
    [  0.0259040424655477290 ,  0.7827717124575297000 , -0.8086757549230774290 ],
];
// Oklab to LMS ** 1/3
// should give for Oklab white color [1, 0, 0] - color LMS [1, 1, 1]
export const OKLab__to__LMS_3 = [
    [  1.0 ,  0.396337777376174900 ,  0.215803757309914122 ],
    [  1.0 , -0.105561345815658570 , -0.063854172825813300 ],
    [  1.0 , -0.089484177529811860 , -1.291485548019409200 ],
];

// linear sRGB to LMS (for D65) = XYZ_D65__to__LMS_Oklab . lin_sRGB__to__XYZ_D65
// found as multiplication of XYZ_D65__to__LMS_Oklab . lin_sRGB__to__XYZ_D65
// corrected for 1 in diagonal of identity matrix of LMS__to__lin_sRGB * lin_sRGB__to__LMS and vice versa
export const lin_sRGB__to__LMS = [
    [  0.412221469470762970 ,  0.536332537261734860 ,  0.051445993267502170 ],
    [  0.211903495817825170 ,  0.680699550645234330 ,  0.107396953536940500 ],
    [  0.088302459190056390 ,  0.281718839136121400 ,  0.629978701673822210 ],
];
// LMS to linear sRGB (for D65) - inverse matrix for lin_sRGB__to__LMS (~= XYZ_D65__to__lin_sRGB . LMS_Oklab__to__XYZ_D65)
// found as multiplication of XYZ_D65__to__lin_sRGB . LMS_Oklab__to__XYZ_D65
// corrected for sum of rows = 1 and 1 in diagonal of in identity matrix of LMS__to__lin_sRGB * lin_sRGB__to__LMS and vice versa
// sum of rows should be = 1
export const LMS__to__lin_sRGB = [
    [  4.076741636075957476 , -3.307711539258061776 ,  0.230969903182104300 ],
    [ -1.268437973285031031 ,  2.609757349287688131 , -0.341319376002657100 ],
    [ -0.004196076138675467 , -0.703418617935936100 ,  1.707614694074611567 ],
];

// linear Display P3 RGB to LMS (for D65) = XYZ_D65__to__LMS_Oklab . lin_Display_P3__to__XYZ_D65
// found as multiplication of XYZ_D65__to__LMS_Oklab . lin_Display_P3__to__XYZ_D65
// TODO: NOT corrected for 1 in diagonal of identity matrix of lin_DspP3RGB__to__LMS * LMS__to__lin_DspP3RGB and vice versa
export const lin_DspP3RGB__to__LMS = [
    [  0.48137985274995420 ,  0.46211837101131820 ,  0.05650177623872757 ],
    [  0.22883194181124464 ,  0.65321681938356770 ,  0.11795123880518771 ],
    [  0.08394575232299316 ,  0.22416527097756653 ,  0.69188897669944030 ],
];
// LMS to linear Display P3 RGB (for D65) - inverse matrix for lin_DspP3RGB__to__LMS (~= XYZ_D65__to__lin_Display_P3 . LMS_Oklab__to__XYZ_D65)
// found as multiplication of XYZ_D65__to__lin_Display_P3 . LMS_Oklab__to__XYZ_D65
// corrected for sum of rows = 1 and 1 in diagonal of in identity matrix of lin_DspP3RGB__to__LMS * LMS__to__lin_DspP3RGB and vice versa
// sum of rows should be = 1
// TODO: NOT corrected for 1s in diagonals
export const LMS__to__lin_DspP3RGB = [
    [  3.127768971361874000 , -2.257135762591639000 ,  0.129366791229765000 ],
    [ -1.091009018437797170 ,  2.413331710306921600 , -0.322322691869124430 ],
    [ -0.026010801938570305 , -0.508041331704167195 ,  1.534052133642737500 ],
];
// export const LMS__to__lin_DspP3RGB = [
//     [  3.127768971361874000 , -2.2571357625916390 ,  0.12936679122976502 ],
//     [ -1.091009018437797400 ,  2.4133317103069216 , -0.32232269186912443 ],
//     [ -0.026010801938570305 , -0.5080413317041671 ,  1.53405213364273750 ],
// ];


// XYZ D65 to LMS for IPT color space (from ColorAide)
// D65 white point is slightly different, from ColorAide:
// # The D65 white point used in the paper was different than what we use.
// # We use chromaticity points (0.31270, 0.3290) which gives us an XYZ of ~[0.9505, 1.0000, 1.0890]
// # IPT uses XYZ of [0.9504, 1.0, 1.0889] which yields chromaticity points ~(0.3127035830618893, 0.32902313032606195)
// D65ipt - white point D65 defined in IPT color space, XYZ: [0.9504, 1.0, 1.0889]
export const XYZ_D65ipt__to__LMS_IPT = [
    [  0.4002 ,  0.7075 , -0.0807 ],
    [ -0.2280 ,  1.1500 ,  0.0612 ],
    [  0.0    ,  0.0    ,  0.9184 ],
];
// LMS (IPT) to XYZ D65 (from ColorAide)
// matrix is slightly corrected for identity matrix (XYZ_D65ipt__to__LMS_IPT.LMS_IPT__to__XYZ_D65ipt) to have 1 (ones) in the diagonal (1, 1, 1)
export const LMS_IPT__to__XYZ_D65ipt = [
    [  1.8502429449432054 , -1.1383016378672328 ,  0.238434958508701360 ],
    [  0.3668307751713486 ,  0.6438845448402356 , -0.010673443584379994 ], // changed from 0.6438845448402355
    [  0.0                ,  0.0                ,  1.088850174216028000 ],
];

// Nonlin. LMS ** 0.43 to IPT:
export const LMS_P__to__IPT = [
    [  0.4000 ,  0.4000 ,  0.2000 ],
    [  4.4550 , -4.8510 ,  0.3960 ],
    [  0.8056 ,  0.3572 , -1.1628 ],
];
// IPT to nonlin. LMS ** 0.43 (from ColorAide, slightly corrected to make in identity matrix diagonals = 1)
export const IPT__to__LMS_P = [
    [  1.0 ,  0.09756893051461392 ,  0.20522643316459155 ], // changed from 0.09756893051461390
    [  1.0 , -0.11387648547314713 ,  0.13321715836999800 ],
    [  1.0 ,  0.03261510991706641 , -0.67688718306917940 ],
];

// XYZ D65 specified in Rec BT.2020 to XYZ D65 defined in IPT
// D65 specified in Rec BT.2020. xyY (Y = 1): (0.31270, 0.32900), XYZ ~ [0.9505, 1.0000, 1.0890] (or 1.0891)
// XYZ D65 defined in IPT.      XYZ: [0.9504, 1.0, 1.0889], xyY (Y = 1) ~ (0.3127035830618893, 0.32902313032606195)
// to convert xyY to XYZ for Y = 1:
// X = x / y, Y = 1 (or y / y), Z = (1 - x - y) / y or z / y, because z = 1 - x - y.
// for Y = 1: XYZ = [x / y, 1, (1 - x - y) / y]
// to convert XYZ to xyY for Y = 1:
// x = X / (X + Y + Z), y = Y / (X + Y + Z), Y = Y = 1
// Bradford chromatic adaptation from D65 to D65ipt
// The matrix below is the result of three operations:
// - convert from XYZ to retinal cone domain
// - scale components from one reference white to another
// - convert back to XYZ
export const XYZ_D65__to__XYZ_D65ipt = [
    [  0.999979809275519500000 , -0.000013974897356093877 , -0.000020900416479591177 ],
    [ -0.000023919024093394230 ,  1.000028375977221500000 , -0.000005180624258784017 ],
    [ -0.000006534962208447348 ,  0.000012464505045731156 ,  0.999849407369585500000 ],
];
// XYZ D65 defined in IPT to XYZ D65 specified in Rec BT.2020 (~ inverse matrix of XYZ_D65__to__XYZ_D65ipt matrix)
// original from calculations
// export const XYZ_D65ipt__to__XYZ_D65 = [
//     [  1.000020191603027800000 ,  0.000013974522432789668 ,  0.000020904058885939936 ],
//     [  0.000023918862194212670 ,  0.999971625097619700000 ,  0.000005181757508326834 ],
//     [  0.000006535780263619562 , -0.000012465937322500564 ,  1.000150615384000500000 ],
// ];
// corrected for 1s in identity matrix XYZ_D65__to__XYZ_D65ipt . XYZ_D65ipt__to__XYZ_D65
export const XYZ_D65ipt__to__XYZ_D65 = [
    [  1.000020191603027800000 ,  0.000013974522432789668 ,  0.000020904058885939936 ],
    [  0.000023918862194212670 ,  0.999971625097619700000 ,  0.000005181757508326834 ],
    [  0.000006535780263619562 , -0.000012465937322500564 ,  1.000150615384000630000 ],
];

// OklabToRgbApprox - approximation of a, b from color Oklab to values r, g, b from RGB color
// to find the maximum saturation possible for a given hue that fits in sRGB
// These are coefficients to quickly test which component goes below zero first.
// Used like this in compute_max_saturation:
// if (-1.88170328f * a - 0.80936493f * b > 1) // Red component goes below zero first
export const Oklab__to__lin_sRgb_approx = [
    [-1.88170328, -0.80936493 ], // for red component
    [ 1.81444104, -1.19445276 ], // for green component
    [ 0.13110758,  1.81333944 ], // for blue component
];

// calculated the same way as in Author's Colab
// Colab: https://colab.research.google.com/drive/1JdXHhEyjjEE--19ZPH1bZV_LiGQBndzs?usp=sharing#scrollTo=eJ4El-GgK9Ot
// Colab for DP3: https://colab.research.google.com/drive/11kys_qTU-3UzHm98XOb8NWXlK2Yr6OGS#scrollTo=qJ4rO_R32CdA
export const Oklab__to__lin_DspP3Rgb_approx = [
    [-1.77234393, -0.82075874 ], // for red component
    [ 1.80319872, -1.19328140 ], // for green component
    [ 0.08970488,  1.90327747 ], // for blue component
];

// Matrix for calculations to convert XYZ color to CAM16 color space
export const XYZ__to__RGBforCAM16 = [
    [  0.401288,  0.650173, -0.051461 ],
    [ -0.250268,  1.204414,  0.045854 ],
    [ -0.002079,  0.048952,  0.953127 ],
];

export const RGBforCAM16__to__XYZ = [
    [  1.86206786, -1.01125463,  0.14918677 ],
    [  0.38752654,  0.62144744, -0.00897398 ],
    [ -0.01584150, -0.03412294,  1.04996444 ],
];


// XYZ absolute to LMS for JzAzBz, for D65 CIE 1931  xyY (Y = 1): (0.31272, 0.32903)
export const XYZabs_D65cie__to__LMS_JzAzBz = [
    [  0.41478972 ,  0.579999 ,  0.0146480 ],
    [ -0.20151000 ,  1.120649 ,  0.0531008 ],
    [ -0.01660080 ,  0.264800 ,  0.6684799 ],
]
// LMS for JzAzBz to XYZ absolute, , for D65 CIE 1931  xyY (Y = 1): (0.31272, 0.32903), form ColorAide
// checked: 1s in diagonals of the identity matrices
export const LMS_JzAzBz__to__XYZabs_D65cie = [
    [  1.92422643578760690 , -1.00479231259536570 ,  0.037651404030617994 ],
    [  0.35031676209499907 ,  0.72648119393165520 , -0.065384422948085010 ],
    [ -0.09098281098284755 , -0.31272829052307394 ,  1.522766561305260300 ],
]

// # LMS_P (modified LMS) to IzAzBz (not JzAzBz)
export const LMS_P__to__IzAzBz = [
    [  0.500000 ,  0.500000 ,  0.000000 ],
    [  3.524000 , -4.066708 ,  0.542708 ],
    [  0.199076 ,  1.096799 , -1.295875 ],
]
// # IzAzBz (not JzAzBz) to LMS_P (modified LMS), from ColorAide
// export const IzAzBz__to__LMS_P = [
//     [  1.0 ,  0.13860504327153927 ,   0.058047316156118830 ],
//     [  1.0 , -0.13860504327153930 ,  -0.058047316156118904 ],
//     [  1.0 , -0.09601924202631895 ,  -0.811891896056039000 ],
// ]
// slightly corrected to make 1s in diagonals of identity matrices
export const IzAzBz__to__LMS_P = [
    [  1.0 ,  0.13860504327153930 ,   0.058047316156118600 ],  // .13860504327153930 instead of 0.13860504327153927, 0.058047316156118600 instead of 0.058047316156118830
    [  1.0 , -0.13860504327153930 ,  -0.058047316156118904 ],
    [  1.0 , -0.09601924202631913 ,  -0.811891896056039009 ],  // -0.09601924202631913 instead of -0.09601924202631895, -0.811891896056039009 instead of -0.811891896056039000
]

// different xyY coordinates for CIE 1931 (0.31272, 0.32903) instead of (0.31271, 0.32902)
// // XYZ D65 specified in Rec BT.2020 to XYZ D65 CIE 1931 (for JzAzBz color space)
// // Rec BT.2020,      xyY (Y = 1): (0.31270, 0.32900)
// // XYZ D65 CIE 1931, xyY (Y = 1): (0.31272, 0.32903), https://en.wikipedia.org/wiki/Illuminant_D65 (Schanda, János (2007). "3. CIE Colorimetry", p. 74)
// // TODO: not corrected for identity matrix
// export const XYZ_D65__to__XYZ_D65cie = [
//     [  1.000015919881096500000 ,  0.0000050011877454035625 , -0.000042245155306125380 ],
//     [  0.000002883530140086743 ,  1.0000116317335215000000 , -0.000013197097972345029 ],
//     [ -0.000009413400980810838 ,  0.0000164398724133291150 ,  0.999762407640827400000 ],
// ];
// // XYZ D65 CIE 1931 to XYZ D65 specified in Rec BT.2020
// // TODO: not corrected for identity matrix
// export const XYZ_D65cie__to__XYZ_D65 = [
//     [  0.9999840807845164000000 , -0.000005001744608778419 ,  0.000042254456123352880 ],
//     [ -0.0000028833264417861115 ,  0.999988368199190900000 ,  0.000013199958869718198 ],
//     [  0.0000094155355879338430 , -0.000016443635154100855 ,  1.000237649003512800000 ],
// ];

// XYZ D65 specified in Rec BT.2020 to XYZ D65 CIE 1931 (for JzAzBz color space)
// Rec BT.2020,      xyY (Y = 1): (0.31270, 0.32900)
// XYZ D65 CIE 1931, xyY (Y = 1): (0.31271, 0.32902), https://www.efi-vutek.ru/data/uploads/files/Standardilluminant.pdf (p. 6)
// 1s in diagonals of the identity matrices, only one element e-15 ~ 0 not e-16
export const XYZ_D65__to__XYZ_D65cie = [
    [  1.000001471264523800000 , -0.0000016870016842206875 , -0.000024877509824106080 ],
    [ -0.000005439309562427436 ,  1.0000132199401885000000 , -0.000007391817532412248 ],
    [ -0.000006072186541514202 ,  0.0000109008075529770650 ,  0.999850779792438200000 ],
];
// XYZ D65 CIE 1931 to XYZ D65 specified in Rec BT.2020
// export const XYZ_D65cie__to__XYZ_D65 = [
//     [  0.999998528897898500000 ,  0.0000016867056796838337 ,  0.000024881198471660150 ],
//     [  0.000005439274543442979 ,  0.9999867801631639000000 ,  0.000007392958308760633 ],
//     [  0.000006073024534439253 , -0.0000109022800451330500 ,  1.000149242548059800000 ],
// ];
// changed to make 1s in diagonals of the identity matrices
export const XYZ_D65cie__to__XYZ_D65 = [
    [  0.999998528897898500000 ,  0.0000016867056796838337 ,  0.000024881198471660150 ],
    [  0.000005439274543442979 ,  0.9999867801631638300000 ,  0.000007392958308760633 ], // changed 0.9999867801631638300000 from 0.9999867801631639000000
    [  0.000006073024534439253 , -0.0000109022800451330500 ,  1.000149242548059800000 ],
];


// XYZ D65 (CIE 1931) to LMS for ICtCp
// Dolby matrix: (https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf, p4)
// const XYZ_D65__to__LMS_ICtCp = [
//     [  0.3592 ,  0.6976 , -0.0358 ],
//     [ -0.1922 ,  1.1004 ,  0.0755 ],
//     [  0.0070 ,  0.0749 ,  0.8434 ],
// ];
// ColorAide matrix:
// const XYZ_D65__to__LMS_ICtCp = [
    // [  0.35913200000000000 ,  0.6976040000000000 , -0.0357800000000000 ],
    // [ -0.19218800000000003 ,  1.1003800000000001 ,  0.0755400000000000 ],
    // [  0.00695600000000000 ,  0.0749160000000000 ,  0.8433400000000001 ],
// ];
// result of the multiplication of crosstalk matrix and Hunt-Pointer-Estevez matrix for LMS, normalized for D65 (CIE 1931 ??)
// https://professional.dolby.com/siteassets/pdfs/ictcp_dolbywhitepaper_v071.pdf (p4)
// Crosstalk matrix:
// let cr = 0.04;
// let cM = [
//     [ 1 - 2*cr, cr, cr],
//     [ cr, 1 - 2*cr, cr],
//     [ cr, cr, 1 - 2*cr],
// ];
// Hunt-Pointer-Estevez matrix (http://brucelindbloom.com/index.html?Eqn_ChromAdapt.html):
// let mHPE = [
//     [  0.4002400 ,  0.7076000 , -0.0808100 ],
//     [ -0.2263000 ,  1.1653200 ,  0.0457000 ],
//     [  0.0000000 ,  0.0000000 ,  0.9182200 ],
// ];
// export const XYZ_D65__to__LMS_ICtCp = [
//     [  0.359168800000000000 ,  0.69760480000000000 , -0.03578840000000002 ],
//     [ -0.192186400000000030 ,  1.10039840000000000 ,  0.07554040000000000 ],
//     [  0.006957599999999998 ,  0.07491679999999999 ,  0.84335800000000000 ],
// ];
// TODO: not corrected to give [1, 1, 1] when multiplied with whipe point D-65 CIE 1931 (XYZ): [ 31271 / 32902, 1, 35827 / 32902 ] from xyY (0.31271, 0.32902)
export const XYZ_D65cie__to__LMS_ICtCp = [
    [  0.359168800000000000 ,  0.69760480000000000 , -0.03578840000000002 ],
    [ -0.192186400000000030 ,  1.10039840000000000 ,  0.07554040000000000 ],
    [  0.006957599999999998 ,  0.07491679999999999 ,  0.84335800000000000 ],
];

// LMS for ICtCp to XYZ D65 (CIE 1931)
// ColorAide:
// export const LMS_ICtCp__to__XYZ_D65cie = [
//     [  2.07050820342041400 , -1.326703944998910000 ,  0.20668057903526466 ],
//     [  0.36502513723373870 ,  0.680458525353830800 , -0.04546355870112316 ],
//     [ -0.04950397021841151 , -0.049503970218411505 ,  1.18809528524187650 ],
// ];
// TODO: sum of values in row 2 should be equal 1 (for perfect convertion od the grayscale color, to make Y in XYZ = L ** 3 for Oklab grayscale color [L, 0, 0] )
// TODO: 1s in diagonals of identity matrices
export const LMS_ICtCp__to__XYZ_D65cie = [
    [  2.0703617049056400 , -1.3265905746806500 ,  0.2066810482469500 ],
    [  0.3649903807779190 ,  0.6804688205998220 , -0.0454616724477699 ],
    [ -0.0495028919589482 , -0.0495028919589482 ,  1.1880694070147600 ],
];
// export const LMS_ICtCp__to__XYZ_D65cie = [
//     [  2.0703617049056400 , -1.3265905746806500 ,  0.2066810482469500 ],
//     [  0.3649928518479470 ,  0.6804688205998220 , -0.0454616724477690 ],
//     [ -0.0495028919589482 , -0.0495028919589482 ,  1.1880694070147600 ],
// ];

// LMS (modified LMS) to ICtCp
// export const LMS_P__to__ICtCp = [
//     [  0.5            ,  0.5            ,  0.0     ],
//     [   6610 / 4096 , -13613 / 4096 ,  7003 / 4096 ],
//     [  17933 / 4096 , -17390 / 4096 ,  -543 / 4096 ],
// ]
export const LMS_P__to__ICtCp = [
    [  0.5            ,  0.5            ,  0.0            ],
    [  1.613769531250 , -3.323486328125 ,  1.709716796875 ],
    [  4.378173828125 , -4.245605468750 , -0.132568359375 ],
]
// ICtCp to LMS (modified LMS), from ColorAide
export const ICtCp__to__LMS_P = [
    [  1.0 ,  0.008609037037932761 ,  0.11102962500302593 ],
    [  1.0 , -0.008609037037932750 , -0.11102962500302599 ],
    [  1.0 ,  0.560031335710679100 , -0.32062717498731885 ],
];

// XYZ D65 (CIE 1931) to RGB for OSA-UCS
// XYZ D65 CIE 1931, xyY (Y = 1): (0.31271, 0.32902), https://www.efi-vutek.ru/data/uploads/files/Standardilluminant.pdf (p. 6)
export const LXYZ_D65__to__RGB_OsaUcs = [
    [  0.7990 ,  0.4194 , -0.1648 ],
    [ -0.4493 ,  1.3265 ,  0.0927 ],
    [ -0.1149 ,  0.3394 ,  0.7170 ],
]


// K coefficients for the numerical fits to the edge of the chroma
// used to find the maximum saturation possible for a given hue that fits in sRGB
// code: https://bottosson.github.io/posts/gamutclipping/#intersection-with-srgb-gamut
// Colab: https://colab.research.google.com/drive/1JdXHhEyjjEE--19ZPH1bZV_LiGQBndzs?usp=sharing#scrollTo=eJ4El-GgK9Ot
export const K_coeff_NumFitChromaEdge = [
    [ 1.19086277,  1.76576728,  0.59662641,  0.75515197,  0.56771245],
    [ 0.73956515, -0.45954404,  0.08285427,  0.12541073, -0.14503204], // (from Colab) in Colab 0.12541073, in code 0.12541070; in Colab -0.14503204, in code , +0.14503204
    // [ 0.73956515, -0.45954404,  0.08285427,  0.12541070, 0.14503204], // (from code - gives resulting L_cusp, C_cusp out of sRGB gamut)
    [ 1.35733652, -0.00915799, -1.1513021,  -0.50559606,  0.00692167],
]

// Matrices for Chromatic Adaptation
// Bradford's spectrally sharpened matrix
export const chromAdapt_Bradford = [
    [  0.8951000 ,  0.2664000 , -0.1614000 ],
    [ -0.7502000 ,  1.7135000 ,  0.0367000 ],
    [  0.0389000 , -0.0685000 ,  1.0296000 ],
];
// inverse matrix for Bradford's spectrally sharpened matrix
// calc with mpmath and corrected for 1s (ones) in the diagonal of the identity matrix for chromAdapt_Bradford . chromAdapt_Bradford_inv
export const chromAdapt_Bradford_inv = [
    [  0.98699290546671240 , -0.1470542564209900 ,  0.1599626516637310 ],
    [  0.43230526972339400 ,  0.5183602715367777 ,  0.0492912282128558 ],
    [ -0.00852866457517733 ,  0.0400428216540847 ,  0.9684866957875500 ],
];