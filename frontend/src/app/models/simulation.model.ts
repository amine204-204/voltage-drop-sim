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

/* One recommended cable upsizing: replace this branch's cable with the next larger catalog size
   (same material). It is the top drop contributor on the path of at least one violating consumer. */
export interface CableSizingSuggestion {
  branchId: string;
  branchName?: string;

  currentCatalogId?: string | null;
  currentCrossSection: string;
  currentMaterial: string;

  suggestedCatalogId: string;
  suggestedCrossSection: string;
  suggestedName?: string;

  /* Share of the affected node's total drop contributed by this branch (worst affected node). */
  contributionPercent: number;
  /* Estimated reduction of the affected node's total drop if applied (worst affected node). */
  dropReductionPercent: number;

  /* Consumers this single upsizing targets, each with before/after drop estimates. */
  affectedNodes: AffectedNode[];

  /* Next larger catalog sizes of the same material, for user choice. */
  alternatives: AlternativeCable[];
}

export interface AffectedNode {
  nodeId: string;
  nodeName?: string;
  totalDropPercent: number;
  predictedTotalDropPercent: number;
}

export interface AlternativeCable {
  catalogId: string;
  crossSection: string;
  name?: string;
  /* Estimated total drop at the worst affected node if this alternative is applied. */
  predictedTotalDropPercent: number;
}