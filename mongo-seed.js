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