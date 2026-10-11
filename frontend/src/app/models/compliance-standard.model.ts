export interface ComplianceStandard {
  id: number;
  name: string;
  description: string;
  minVoltagePu: number;
  maxVoltagePu: number;
  active: boolean;
  defaultStandard: boolean;
}
