export interface GraphExportNode {
  id: string;
  name: string;
  type: 'SOURCE' | 'CONSUMER' | 'JUNCTION';
  nominalVoltage?: number;
  loadType?: 'CONSTANT_CURRENT' | 'CONSTANT_POWER';
  cosPhi?: number;
  loadProfile?: number[];
  loadProfileControlPoints?: { time: number; value: number }[];
  selectedPresetId?: string;
  x: number;
  y: number;
}

export interface GraphExportBranch {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthInKm: number;
  branchType?: string;
  catalogId?: string;
  closed?: boolean;
}

export interface GraphExport {
  nodes: GraphExportNode[];
  branches: GraphExportBranch[];
}
