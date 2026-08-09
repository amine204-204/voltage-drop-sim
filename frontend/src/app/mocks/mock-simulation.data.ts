export const MOCK_SIMULATION_RESULT = {
  nodes: [
    {
      id: 'node_1',
      label: 'Sub 1',
      type: 'SOURCE',
      localNominalVoltage: 230,
      potentialTimeSeries: [230, 230, 230, 230, 230, 230, 230, 230, 230, 230],
      cumulativeDropPercentTimeSeries: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      statusTimeSeries: [],
      powerQualityEvents: [],
      pathBranches: []
    },
    {
      id: 'node_2',
      label: 'Load 2',
      type: 'CONSUMER',
      localNominalVoltage: 230,
      // Voltage starts okay, dips badly at step 3, recovers slightly
      potentialTimeSeries: [219, 218, 215, 195, 205, 218, 219, 218, 219, 218],
      // 219V is ~0.95 Pu (OK). 195V is ~0.84 Pu (VIOLATION!)
      statusTimeSeries: ['OK', 'OK', 'OK', 'VIOLATION', 'VIOLATION', 'OK', 'OK', 'OK', 'OK', 'OK'],
      cumulativeDropPercentTimeSeries: [4.7, 5.2, 6.5, 15.2, 10.8, 5.2, 4.7, 5.2, 4.7, 5.2],
      powerQualityEvents: [
        {
          startTimeStep: 3,
          endTimeStep: 4,
          worstMagnitudePu: 0.847,
          classification: 'MOMENTARY_SAG'
        }
      ],
      pathBranches: [{ branchId: 'edge_node_1_node_2', branchName: 'CABLE node_1-node_2' }]
    }
  ],
  branches: [
    {
      id: 'edge_node_1_node_2',
      dropPercentTimeSeries: [4.7, 5.2, 6.5, 15.2, 10.8, 5.2, 4.7, 5.2, 4.7, 5.2],
      currentTimeSeries: [10, 11, 13, 25, 18, 11, 10, 11, 10, 11]
    }
  ],
  rootSubstationId: 'node_1'
};
