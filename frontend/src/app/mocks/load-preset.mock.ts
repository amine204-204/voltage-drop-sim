import { LoadPreset } from '../models/load-preset.model';

export const LOAD_PRESETS: LoadPreset[] = [
  {
    id: "residential-constant-current",
    name: "Residential Load (CC)",
    description: "Typical residential current profile with morning and evening peaks",
    loadType: "CONSTANT_CURRENT",
    cosPhi: 0.9,
    unit: "A",
    defaultProfile: [
      { time: 0, value: 5 },
      { time: 3, value: 8 },
      { time: 6, value: 25 },
      { time: 9, value: 15 },
      { time: 12, value: 10 },
      { time: 18, value: 30 },
      { time: 22, value: 12 },
      { time: 24, value: 5 }
    ],
  },
  {
    id: "industrial-constant-power",
    name: "Industrial Motor (CP)",
    description: "Constant power load with startup inrush",
    loadType: "CONSTANT_POWER",
    cosPhi: 0.85,
    unit: "W",
    defaultProfile: [
      { time: 0, value: 0 },
      { time: 1, value: 5000 },
      { time: 2, value: 8000 },
      { time: 3, value: 10000 },
      { time: 20, value: 10000 },
      { time: 21, value: 5000 },
      { time: 22, value: 0 },
      { time: 24, value: 0 }
    ],
  },
  {
    id: "street-lighting",
    name: "Street Lighting",
    description: "On at dusk, off at dawn",
    loadType: "CONSTANT_CURRENT",
    cosPhi: 0.95,
    unit: "A",
    defaultProfile: [
      { time: 0, value: 20 },
      { time: 5, value: 20 },
      { time: 6, value: 0 },
      { time: 18, value: 0 },
      { time: 19, value: 20 },
      { time: 24, value: 20 }
    ],
  }
];