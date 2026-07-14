import { CatalogItem } from "../models/catalog.model";

export const CATALOG_ITEMS: CatalogItem[] = [
  { id: 'cable_16mm2_cu', name: '16mm² Copper Cable', type: 'CableSpec', crossSection: '16mm2', resistancePerKm: 1.15, reactancePerKm: 0.08, material: 'CU' },
  { id: 'cable_35mm2_cu', name: '35mm² Copper Cable', type: 'CableSpec', crossSection: '35mm2', resistancePerKm: 0.63, reactancePerKm: 0.08, material: 'CU' },
  { id: 'cable_70mm2_al', name: '70mm2 Aluminum Cable', type: 'CableSpec', crossSection: '70mm2', resistancePerKm: 1.35, reactancePerKm: 0.08, material: 'AL' },
  { id: 'tx_250kva', name: '250kVA Transformer', type: 'TransformerSpec', nominalPrimaryVoltage: 20000, nominalSecondaryVoltage: 400, impedancePercent: 6.0 }
];