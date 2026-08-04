import { LoadPreset } from '../models/load-preset.model';

export const LOAD_PRESETS: LoadPreset[] = [
  {
    id: "residential-constant-current",
    name: "Residential Load (CC)",
    description: "Typical residential current profile with morning and evening peaks",
    loadType: "CONSTANT_CURRENT",
    cosPhi: 0.9,
    unit: "A",
    durationSeconds: 86400,
    defaultProfile: [
      { time: 0, value: 5 },
      { time: 10800, value: 8 },
      { time: 21600, value: 25 },
      { time: 32400, value: 15 },
      { time: 43200, value: 10 },
      { time: 64800, value: 30 },
      { time: 79200, value: 12 },
      { time: 86400, value: 5 }
    ],
  },
  {
    id: "industrial-constant-power",
    name: "Industrial Motor (CP)",
    description: "Constant power load with startup inrush",
    loadType: "CONSTANT_POWER",
    cosPhi: 0.85,
    unit: "W",
    durationSeconds: 86400,
    defaultProfile: [
      { time: 0, value: 0 },
      { time: 3600, value: 5000 },
      { time: 7200, value: 8000 },
      { time: 10800, value: 10000 },
      { time: 72000, value: 10000 },
      { time: 75600, value: 5000 },
      { time: 79200, value: 0 },
      { time: 86400, value: 0 }
    ],
  },
  {
    id: "street-lighting",
    name: "Street Lighting",
    description: "On at dusk, off at dawn",
    loadType: "CONSTANT_CURRENT",
    cosPhi: 0.95,
    unit: "A",
    durationSeconds: 86400,
    defaultProfile: [
      { time: 0, value: 20 },
      { time: 18000, value: 20 },
      { time: 21600, value: 0 },
      { time: 64800, value: 0 },
      { time: 68400, value: 20 },
      { time: 86400, value: 20 }
    ],
  }
];
