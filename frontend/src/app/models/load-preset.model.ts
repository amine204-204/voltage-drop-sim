import { ControlPoint } from "../components/load-profile-editor/load-profile-editor.component";

export interface LoadPreset {
  id: string;
  name: string;
  description: string;
  loadType: 'CONSTANT_CURRENT' | 'CONSTANT_POWER';
  cosPhi: number;
  unit: string;
  defaultProfile: ControlPoint[]; 
}
