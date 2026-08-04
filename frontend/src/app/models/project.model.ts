import { ControlPoint } from '../components/load-profile-editor/load-profile-editor.component';
import { PowerQualityEvent } from './simulation.model';

export interface ProjectSummary {
  id: number;
  name: string;
  description?: string;
  ownerId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNode {
  id: string;
  name: string;
  type: 'SOURCE' | 'CONSUMER' | 'JUNCTION';
  nominalVoltage?: number;
  loadType?: 'CONSTANT_CURRENT' | 'CONSTANT_POWER';
  cosPhi?: number;
  loadProfile?: number[];
  loadProfileControlPoints?: ControlPoint[];
  selectedPresetId?: string;
  x: number;
  y: number;
}

export interface ProjectBranch {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  lengthInKm?: number;
  branchType?: string;
  catalogId?: string;
  componentCrossSection: string;
  componentMaterial: string;
  closed?: boolean;
}

export interface ProjectNodeResult {
  nodeId: string;
  potentialTimeSeries: number[];
  localNominalVoltage?: number;
}

export interface ProjectBranchResult {
  branchId: string;
  currentTimeSeries: number[];
  dropPercentTimeSeries: number[];
  statusTimeSeries: ('OK' | 'VIOLATION')[];
  powerQualityEvents: PowerQualityEvent[];
}

export interface ProjectSimulationResult {
  nodesResults: ProjectNodeResult[];
  branchesResults: ProjectBranchResult[];
  minLimitPu?: number;
  maxLimitPu?: number;
}

export interface Project {
  id?: number;
  name: string;
  description?: string;
  ownerId?: number;
  totalTimeSteps: number;
  deltaTimeSeconds: number;
  selectedNormType: string;
  customMinPu?: number;
  customMaxPu?: number;
  minDeltaTimeSeconds?: number;
  maxDeltaTimeSeconds?: number;
  nodes: ProjectNode[];
  branches: ProjectBranch[];
  simulationResult?: ProjectSimulationResult;
  createdAt?: string;
  updatedAt?: string;
}
