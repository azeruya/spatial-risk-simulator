export type LandCoverAnalysis = {
  totalPixels: number;

  classes: {
    treeCover: number;
    shrubland: number;
    grassland: number;
    cropland: number;
    builtUp: number;
    bareSparse: number;
    snowIce: number;
    water: number;
    wetland: number;
    mangroves: number;
    mossLichen: number;
  };

  planning: {
    builtUpPercent: number;
    vegetatedPercent: number;
    waterPercent: number;
    otherPercent: number;
  };

  source: {
    dataset: string;
    year: number;
    resolutionMeters: number;
  };
};