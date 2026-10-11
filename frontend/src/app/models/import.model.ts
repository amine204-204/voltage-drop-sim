export type CatalogImportType = 'CABLE' | 'TRANSFORMER' | 'SWITCH';

export interface CatalogImportField {
  key: string;
  label: string;
  group: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

export interface ImportHeadersResponse {
  fileName: string;
  fileType: 'excel' | 'json';
  headers: string[];
  sampleRows: Record<string, string>[];
}

export type ImportRowStatus = 'OK' | 'DUPLICATE' | 'ERROR';

export interface ImportRowResult {
  rowNumber: number;
  status: ImportRowStatus;
  errors: string[];
  data: Record<string, any> | null;
}

export interface CatalogImportPreview {
  type: string;
  fileName: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  rows: ImportRowResult[];
}

export interface ImportCommitRequest {
  type: string;
  items: Record<string, any>[];
}

export interface ImportDuplicate {
  name: string;
  standard: string;
  reason: string;
}

export interface ImportCommitResult {
  type: string;
  imported: number;
  skipped: number;
  duplicates: ImportDuplicate[];
}
