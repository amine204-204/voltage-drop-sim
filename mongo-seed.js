db = db.getSiblingDB('grid_catalogs');
db.cables.insertMany([
  {
    _id: "CU-16",
    name: "NYY-J 4x16mm² Cu",
    standard: "IEC 60502",
    category: "low_voltage",
    electrical: {
      resistancePerKm: 1.15,
      reactancePerKm: 0.08,
      ampacityFreeAirA: 85,
      ampacityBuriedA: 70,
      voltageDropPerAKm: 0.018
    },
    physical: {
      crossSection: "16",
      conductorMaterial: "CU",
      insulationMaterial: "PVC",
      outerDiameterMm: 19.2
    },
    thermal: {
      ratedTempC: 70,
      maxShortCircuitTempC: 160
    },
    impedanceTable: [
      { tempC: 20, rOhmKm: 1.15, xOhmKm: 0.08 },
      { tempC: 30, rOhmKm: 1.19, xOhmKm: 0.08 },
      { tempC: 50, rOhmKm: 1.25, xOhmKm: 0.08 },
      { tempC: 70, rOhmKm: 1.32, xOhmKm: 0.08 }
    ],
    active: true
  },
  {
    _id: "CU-25",
    name: "NYY-J 4x25mm² Cu",
    standard: "IEC 60502",
    category: "low_voltage",
    electrical: {
      resistancePerKm: 0.727,
      reactancePerKm: 0.077,
      ampacityFreeAirA: 110,
      ampacityBuriedA: 90,
      voltageDropPerAKm: 0.0115
    },
    physical: {
      crossSection: "25",
      conductorMaterial: "CU",
      insulationMaterial: "PVC",
      outerDiameterMm: 22.4
    },
    thermal: {
      ratedTempC: 70,
      maxShortCircuitTempC: 160
    },
    impedanceTable: [
      { tempC: 20, rOhmKm: 0.727, xOhmKm: 0.077 },
      { tempC: 30, rOhmKm: 0.754, xOhmKm: 0.077 },
      { tempC: 50, rOhmKm: 0.792, xOhmKm: 0.077 },
      { tempC: 70, rOhmKm: 0.834, xOhmKm: 0.077 }
    ],
    active: true
  },
  {
    _id: "AL-35",
    name: "NAYY 4x35mm² Al",
    standard: "DIN VDE 0276",
    category: "low_voltage",
    electrical: {
      resistancePerKm: 1.04,
      reactancePerKm: 0.08,
      ampacityFreeAirA: 95,
      ampacityBuriedA: 80,
      voltageDropPerAKm: 0.016
    },
    physical: {
      crossSection: "35",
      conductorMaterial: "AL",
      insulationMaterial: "PVC",
      outerDiameterMm: 25.6
    },
    thermal: {
      ratedTempC: 70,
      maxShortCircuitTempC: 160
    },
    impedanceTable: [
      { tempC: 20, rOhmKm: 1.04, xOhmKm: 0.08 },
      { tempC: 30, rOhmKm: 1.07, xOhmKm: 0.08 },
      { tempC: 50, rOhmKm: 1.13, xOhmKm: 0.08 },
      { tempC: 70, rOhmKm: 1.19, xOhmKm: 0.08 }
    ],
    active: true
  }
]);

db.load_presets.insertMany([
  {
    _id: "residential-constant-current",
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
    active: true
  },
  {
    _id: "industrial-constant-power",
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
    active: true
  },
  {
    _id: "street-lighting",
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
    active: true
  }
]);