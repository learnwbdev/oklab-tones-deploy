// Names for color Spaces / Formats to convert to and from

export const colorSpaces = {
    Hex        : "Hex",         // HEX format of the color
    sRgb       : "sRgb",        // RGB in sRGB gamut
    linSRgb    : "linSRgb",     // linear SRGB
    // Lms     : "Lms",
    Oklab      : "Oklab",
    Oklch      : "Oklch",
    XYZ        : "XYZ",         // CIEXYZ color space for D65 white point `(0.31270, 0.32900)` (specified in Rec BT.2020)
    Lab        : "Lab",         // CIELab color space
    Lch        : "Lch",         // CIELch color space
    linDspP3   : "linDispP3",   // linear Display-P3 (RGB) color space
    dispP3     : "DispP3",      // Display-P3 (RGB) color space
    OklabGamma : "OklabGamma",  // Oklab space with power gamma = 0.323 instead of gamma = 1/3 as in the final version of the Oklab
    OklchGamma : "OklchGamma",  // Oklch for OklabGamma
    IPT        : "IPT",         // IPT color space
    IPTch      : "IPTch",       // IPT color space in hue, chroma values (similar to Oklch from Oklab)
    XYZipt     : "XYZipt",      // CIEXYZ color space for D65 white point XYZ: [0.9504, 1.0, 1.0889] (specified in IPT color space, slightly different from xy (0.31270, 0.32900))
    XYZcie     : "XYZcie",      // CIEXYZ color space for D65 white point xyY (Y = 1): (0.31272, 0.32903) (XYZ D65 CIE 1931, for JzAzBz color space, slightly different from D65, specified in Rec BT.2020, xyY (Y=1): (0.31270, 0.32900))
    CAM16      : "CAM16",       // CAM16 color space
    CAM16Ucs   : "CAM16UCS",    // CAM16 UCS color space (UCS - uniform color space)
    JzAzBz     : "JzAzBz",      // JzAzBz color space
    JzCzHz     : "JzCzHz",      // JzCzHz color space (JzAzBz in polar form, in terms of Chroma and Hue)
    ICtCp      : "ICtCp",       // ICtCp color space
    ICtCpch    : "ICtCpch",     // polar coordinates (Chroma and Hue) for the ICtCp color space
    OsaUcs     : "OsaUcs",      // OSA-UCS color space (not checked to samples)
    OsaUcsCh   : "OsaUcsCh",    // polar coordinates (Chroma and Hue) for the OSA-UCS color space (not official)
};