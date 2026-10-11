import { Core } from 'cytoscape';
import { ProjectNode, ProjectBranch, ProjectSimulationResult } from '../../../models/project.model';
import { SimulationResponseDto, PowerQualityEvent } from '../../../models/simulation.model';
import { formatNum } from '../../../shared/utils/format.utils';

export interface ProjectGraph {
  nodes: ProjectNode[];
  branches: ProjectBranch[];
}

export interface SimulationSnapshot {
  nodesResults: {
    nodeId: string;
    localNominalVoltage?: number;
    potentialTimeSeries: number[];
    cumulativeDropPercentTimeSeries: number[];
    statusTimeSeries: ('OK' | 'VIOLATION')[];
    pathBranchIds: string[];
    powerQualityEvents: PowerQualityEvent[];
  }[];
  branchesResults: {
    branchId: string;
    currentTimeSeries: number[];
    dropPercentTimeSeries: number[];
  }[];
}

export function getProjectGraph(cy: Core): ProjectGraph {
  const nodes: ProjectNode[] = cy.nodes().map(node => {
    const data = node.data();
    const pos = node.position();
    return {
      id: data.id,
      name: data.label,
      type: data.type,
      nominalVoltage: data.nominalVoltage || null,
      loadType: data.loadType || null,
      cosPhi: data.cosPhi || null,
      loadProfile: data.loadProfile || null,
      loadProfileControlPoints: data.loadProfileControlPoints || null,
      selectedPresetId: data.selectedPresetId || null,
      x: pos.x,
      y: pos.y
    };
  });

  const branches: ProjectBranch[] = cy.edges().map(edge => {
    const data = edge.data();
    const branchType = data.branchType || 'CABLE';
    const branch: ProjectBranch = {
      id: data.id,
      name: data.name || `${branchType} ${data.source}-${data.target}`,
      fromNodeId: data.source,
      toNodeId: data.target,
      branchType,
      catalogId: data.catalogId || null,
      componentCrossSection: data.componentCrossSection || '16mm2',
      componentMaterial: data.componentMaterial || 'CU',
      closed: data.closed
    };
    if (branchType === 'CABLE') {
      branch.lengthInKm = data.lengthInKm || 0.1;
    }
    return branch;
  });

  return { nodes, branches };
}

export function loadProjectGraph(cy: Core, nodes: ProjectNode[], branches: ProjectBranch[]): void {
  let maxNodeNum = 0;
  nodes.forEach(node => {
    const match = node.id.match(/node_(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNodeNum) maxNodeNum = num;
    }

    cy.add({
      data: {
        id: node.id,
        label: node.name,
        type: node.type,
        nominalVoltage: node.nominalVoltage,
        loadType: node.loadType,
        cosPhi: node.cosPhi,
        loadProfile: node.loadProfile,
        loadProfileControlPoints: node.loadProfileControlPoints,
        selectedPresetId: node.selectedPresetId
      },
      position: { x: node.x, y: node.y }
    });
  });

  branches.forEach(branch => {
    const isCable = !branch.branchType || branch.branchType === 'CABLE';
    const isSwitch = branch.branchType === 'SWITCH';

    const data: Record<string, any> = {
      id: branch.id,
      name: branch.name,
      source: branch.fromNodeId,
      target: branch.toNodeId,
      branchType: branch.branchType || 'CABLE',
      catalogId: branch.catalogId,
      componentCrossSection: branch.componentCrossSection,
      componentMaterial: branch.componentMaterial,
      closed: branch.closed
    };
    if (isCable) {
      data['lengthInKm'] = branch.lengthInKm;
      data['lengthLabel'] = `${formatNum(branch.lengthInKm)} km`;
    } else if (isSwitch) {
      data['lengthLabel'] = branch.closed === false ? 'Open' : 'Closed';
    }

    cy.add({ data });
  });

  cy.fit(undefined, 50);
}

export function getSimulationSnapshot(cy: Core): SimulationSnapshot | null {
  const graph = getProjectGraph(cy);

  const hasSimData = graph.nodes.some(node => {
    const cyNode = cy.$('#' + node.id);
    return cyNode?.data('simulationData');
  });

  if (!hasSimData) return null;

  const nodesResults = graph.nodes.map(node => {
    const cyNode = cy.$('#' + node.id);
    const simData = cyNode?.data('simulationData');
    return {
      nodeId: node.id,
      localNominalVoltage: simData?.localNominalVoltage,
      potentialTimeSeries: simData ? simData.potentialTimeSeries : [],
      cumulativeDropPercentTimeSeries: simData ? simData.cumulativeDropPercentTimeSeries : [],
      statusTimeSeries: simData ? simData.statusTimeSeries : [],
      pathBranchIds: simData && Array.isArray(simData.pathBranches)
        ? simData.pathBranches.map((pb: { branchId: string }) => pb.branchId)
        : [],
      powerQualityEvents: simData && Array.isArray(simData.powerQualityEvents)
        ? simData.powerQualityEvents.map((pq: PowerQualityEvent) => ({
            startTimeStep: pq.startTimeStep,
            endTimeStep: pq.endTimeStep,
            worstMagnitudePu: pq.worstMagnitudePu,
            classification: pq.classification
          }))
        : []
    };
  });

  const branchesResults = graph.branches.map(branch => {
    const cyEdge = cy.$('#' + branch.id);
    const simData = cyEdge?.data('simulationData');
    return {
      branchId: branch.id,
      currentTimeSeries: simData ? simData.currentTimeSeries : [],
      dropPercentTimeSeries: simData ? simData.dropPercentTimeSeries : []
    };
  });

  return { nodesResults, branchesResults };
}

export function mapStoredResultToResponse(storedResult: ProjectSimulationResult): SimulationResponseDto {
  return {
    nodes: storedResult.nodesResults.map(nr => ({
      id: nr.nodeId,
      localNominalVoltage: nr.localNominalVoltage,
      potentialTimeSeries: nr.potentialTimeSeries,
      cumulativeDropPercentTimeSeries: nr.cumulativeDropPercentTimeSeries,
      statusTimeSeries: nr.statusTimeSeries,
      powerQualityEvents: nr.powerQualityEvents,
      pathBranches: (nr.pathBranchIds || []).map(id => ({ branchId: id }))
    })),
    branches: storedResult.branchesResults.map(br => ({
      id: br.branchId,
      currentTimeSeries: br.currentTimeSeries,
      dropPercentTimeSeries: br.dropPercentTimeSeries
    }))
  };
}
