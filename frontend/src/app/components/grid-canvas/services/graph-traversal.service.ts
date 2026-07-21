import { Core } from 'cytoscape';
import { NodeType, LoadType } from '../../../models/simulation.model';

export interface IslandNode {
  id: string;
  name: string;
  type: NodeType;
  nominalVoltage?: number;
  loadType?: LoadType;
  loadProfile?: number[];
  cosPhi?: number;
}

export interface IslandBranch {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthInKm: number;
  componentCrossSection: string;
  componentMaterial: string;
}

export interface Island {
  nodes: IslandNode[];
  branches: IslandBranch[];
}

export function getIslands(cy: Core): Island[] {
  const allNodes: IslandNode[] = cy.nodes().map((node: any) => {
    const data = node.data();
    return {
      id: data.id, name: data.label, type: data.type,
      nominalVoltage: data.nominalVoltage || undefined,
      loadType: data.loadType || undefined, loadProfile: data.loadProfile || undefined,
      cosPhi: data.cosPhi || undefined
    };
  });

  const allEdges: IslandBranch[] = cy.edges().map((edge: any) => {
    const data = edge.data();
    return {
      id: data.id, name: `Cable ${data.source}-${data.target}`,
      fromNodeId: data.source, toNodeId: data.target,
      lengthInKm: data.lengthInKm || 0.1,
      componentCrossSection: data.componentCrossSection || '16mm2',
      componentMaterial: data.componentMaterial || 'CU'
    };
  });

  const adjacency = new Map<string, string[]>();
  allNodes.forEach(n => adjacency.set(n.id, []));
  allEdges.forEach(e => {
    adjacency.get(e.fromNodeId)?.push(e.toNodeId);
    adjacency.get(e.toNodeId)?.push(e.fromNodeId);
  });

  const visited = new Set<string>();
  const islands: Island[] = [];

  for (const node of allNodes) {
    if (visited.has(node.id)) continue;

    const islandNodeIds = new Set<string>();
    const stack = [node.id];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (islandNodeIds.has(currentId)) continue;
      islandNodeIds.add(currentId);
      visited.add(currentId);

      const neighbors = adjacency.get(currentId) || [];
      neighbors.forEach(neighborId => {
        if (!islandNodeIds.has(neighborId)) stack.push(neighborId);
      });
    }

    const islandNodes = allNodes.filter(n => islandNodeIds.has(n.id));
    const islandEdges = allEdges.filter(e => islandNodeIds.has(e.fromNodeId) && islandNodeIds.has(e.toNodeId));

    islands.push({ nodes: islandNodes, branches: islandEdges });
  }

  return islands;
}

export function getNominalVoltageForNode(cy: Core, nodeId: string): number {
  let currentId = nodeId;
  let safetyLimit = 50;

  while (safetyLimit-- > 0) {
    const node = cy.$('#' + currentId);
    if (!node.length) break;

    if (node.data('type') === 'SOURCE') {
      return node.data('nominalVoltage') || 230;
    }

    const incomingEdge = cy.edges(`[target = "${currentId}"]`).first();
    if (!incomingEdge.length) break;

    currentId = incomingEdge.source().id();
  }

  return 230;
}
