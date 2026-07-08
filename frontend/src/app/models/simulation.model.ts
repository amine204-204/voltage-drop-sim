export interface SimulationRequestDto {
  totalTimeSteps: number;
  deltaTimeSeconds: number;
  selectedNormType: string;
  customMinPu?: number;
  customMaxPu?: number;
  graph: GraphDto;
}

export interface GraphDto {
  nodes: NodeDto[];
  branches: BranchDto[];
}

export interface NodeDto {
  id: string;
  name: string;
  type: 'SOURCE' | 'CONSUMER' | 'JUNCTION';
  nominalVoltage?: number;
  loadType?: 'CONSTANT_CURRENT' | 'CONSTANT_POWER';
  loadProfile?: number[];
  cosPhi?: number;
}

export interface BranchDto {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthInKm: number;
  componentCrossSection: string;
  componentMaterial: string;
}