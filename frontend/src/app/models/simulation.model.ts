export type NodeType = 'SOURCE' | 'CONSUMER' | 'JUNCTION';

export type LoadType = 'CONSTANT_CURRENT' | 'CONSTANT_POWER';

export type BranchType = 'CABLE' | 'TRANSFORMER' | 'SWITCH';

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
  type: NodeType;
  nominalVoltage?: number;
  loadType?: LoadType;
  loadProfile?: number[];
  cosPhi?: number;
}

export interface BranchDto {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthInKm?: number;
  branchType?: BranchType;
  catalogId?: string;
  componentCrossSection: string;
  componentMaterial: string;
  closed?: boolean;
}

export interface PowerQualityEvent {
  startTimeStep: number;
  endTimeStep: number;
  worstMagnitudePu: number;
  classification: string;
}

export interface PathBranch {
  branchId: string;
  branchName?: string;
}

export interface SimulationNodeResult {
  id: string;
  name?: string;
  type?: NodeType;
  localNominalVoltage?: number;
  potentialTimeSeries: number[];
  cumulativeDropPercentTimeSeries: number[];
  statusTimeSeries: ('OK' | 'VIOLATION')[];
  powerQualityEvents: PowerQualityEvent[];
  pathBranches: PathBranch[];
}

export interface SimulationBranchResult {
  id: string;
  currentTimeSeries: number[];
  dropPercentTimeSeries: number[];
}

export interface SimulationResponseDto {
  nodes: SimulationNodeResult[];
  branches: SimulationBranchResult[];
}