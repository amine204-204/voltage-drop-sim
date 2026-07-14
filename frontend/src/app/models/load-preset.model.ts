import { ControlPoint } from "../components/load-profile-editor/load-profile-editor";

export interface LoadPreset {
  id: string;
  name: string;
  loadType: 'CONSTANT_CURRENT' | 'CONSTANT_POWER';
  cosPhi: number;

  defaultProfile: ControlPoint[]; 
}