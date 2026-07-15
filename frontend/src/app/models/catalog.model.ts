export type CatalogItem = CableCatalog | TransformerCatalog;

export interface BaseCatalogItem {
  id: string;
  name: string;
  category: 'cable' | 'transformer';
  standard: string;
  active: boolean;
}

export interface CableCatalog extends BaseCatalogItem {
  category: 'cable';
  electrical: {
    resistancePerKm: number;
    reactancePerKm: number;
    ampacityFreeAirA: number;
    ampacityBuriedA: number;
    voltageDropPerAKm: number;
  };
  physical: {
    crossSection: string;
    conductorMaterial: string;
    insulationMaterial: string;
    outerDiameterMm: number;
  };
  thermal: {
    ratedTempC: number;
    maxShortCircuitTempC: number;
  };
  impedanceTable: Array<{
    tempC: number;
    rOhmKm: number;
    xOhmKm: number;
  }>;
}

export interface TransformerCatalog extends BaseCatalogItem {
  category: 'transformer';
  electrical: {
    ratedPowerKva: number;
    primaryVoltageV: number;
    secondaryVoltageV: number;
    impedancePercent: number;
    noLoadLossW: number;
    loadLossW: number;
  };
  tapChanger?: {
    steps: number;
    stepVoltagePercent: number;
  };
}