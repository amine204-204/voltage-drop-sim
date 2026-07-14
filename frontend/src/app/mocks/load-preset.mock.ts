import { LoadPreset } from '../models/load-preset.model';

export const LOAD_PRESETS: LoadPreset[] = [
  {
    id: 'ev-fast-charge',
    name: 'EV Fast Charge (Level 2)',
    loadType: 'CONSTANT_POWER',
    cosPhi: 0.99,
    defaultProfile: [
      { time: 0, value: 0 },
      { time: 1, value: 0 },
      { time: 2, value: 0 },
      { time: 3, value: 100 },
      { time: 4, value: 100 },
      { time: 5, value: 100 },
      { time: 6, value: 100 },
      { time: 7, value: 100 },
      { time: 8, value: 100 },
      { time: 9, value: 0 },
      { time: 10, value: 0 },
      { time: 11, value: 0 }
    ]
  },
  {
    id: 'induction-motor-15kw',
    name: '15kW Induction Motor',
    loadType: 'CONSTANT_CURRENT',
    // Standard inrush: motor starts at 600% load for 2 steps, settles to 100%
    cosPhi: 0.85,
    defaultProfile: [
      { time: 0, value: 0 },
      { time: 1, value: 0 },
      { time: 2, value: 600 },
      { time: 3, value: 600 },
      { time: 4, value: 100 },
      { time: 5, value: 100 },
      { time: 6, value: 100 },
      { time: 7, value: 100 },
      { time: 8, value: 100 },
      { time: 9, value: 100 },
      { time: 10, value: 100 },
      { time: 11, value: 100 }
    ]
  },
  {
    id: 'commercial-office',
    name: 'Commercial Office Lighting',
    loadType: 'CONSTANT_POWER',
    cosPhi: 0.95,
    defaultProfile: [
      { time: 0, value: 20 },
      { time: 1, value: 30 },
      { time: 2, value: 40 },
      { time: 3, value: 60 },
      { time: 4, value: 80 },
      { time: 5, value: 90 },
      { time: 6, value: 95 },
      { time: 7, value: 100 },
      { time: 8, value: 95 },
      { time: 9, value: 80 },
      { time: 10, value: 60 },
      { time: 11, value: 40 },
      { time: 12, value: 20 }
    ]
  }
];