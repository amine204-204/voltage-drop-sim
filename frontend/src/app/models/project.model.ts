import { ControlPoint } from '../components/load-profile-editor/load-profile-editor';

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
  lengthInKm: number;
  catalogId?: string;
  componentCrossSection: string;
  componentMaterial: string;
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
  nodes: ProjectNode[];
  branches: ProjectBranch[];
  simulationResult?: any;
  createdAt?: string;
  updatedAt?: string;
}
