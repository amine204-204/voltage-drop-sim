import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSummary, CreateUserRequest, UpdateRoleRequest, CatalogUsage } from '../models/admin.model';
import { CableCatalog, TransformerCatalog, SwitchCatalog } from '../models/catalog.model';
import { LoadPreset } from '../models/load-preset.model';
import { ComplianceStandard } from '../models/compliance-standard.model';
import {
  CatalogImportField,
  CatalogImportPreview,
  CatalogImportType,
  ImportCommitRequest,
  ImportCommitResult,
  ImportHeadersResponse
} from '../models/import.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = '/api/admin';

  constructor(private http: HttpClient) {}

  // ── Users ──────────────────────────────────────────────────

  getUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.API}/users`);
  }

  createUser(request: CreateUserRequest): Observable<UserSummary> {
    return this.http.post<UserSummary>(`${this.API}/users`, request);
  }

  updateUserRole(id: number, role: string): Observable<UserSummary> {
    return this.http.put<UserSummary>(`${this.API}/users/${id}/role`, { role } as UpdateRoleRequest);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/users/${id}`);
  }

  // ── Catalog ────────────────────────────────────────────────

  getAllCables(): Observable<CableCatalog[]> {
    return this.http.get<CableCatalog[]>(`${this.API}/catalogs`);
  }

  createCable(cable: Partial<CableCatalog>): Observable<CableCatalog> {
    return this.http.post<CableCatalog>(`${this.API}/catalogs`, cable);
  }

  updateCable(id: string, cable: CableCatalog): Observable<CableCatalog> {
    return this.http.put<CableCatalog>(`${this.API}/catalogs/${id}`, cable);
  }

  deleteCable(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/catalogs/${id}`);
  }

  getCableUsage(id: string): Observable<CatalogUsage> {
    return this.http.get<CatalogUsage>(`${this.API}/catalogs/${id}/usage`);
  }

  // ── Transformers ────────────────────────────────────────────

  getAllTransformers(): Observable<TransformerCatalog[]> {
    return this.http.get<TransformerCatalog[]>(`${this.API}/catalogs/transformers`);
  }

  createTransformer(transformer: Partial<TransformerCatalog>): Observable<TransformerCatalog> {
    return this.http.post<TransformerCatalog>(`${this.API}/catalogs/transformers`, transformer);
  }

  updateTransformer(id: string, transformer: TransformerCatalog): Observable<TransformerCatalog> {
    return this.http.put<TransformerCatalog>(`${this.API}/catalogs/transformers/${id}`, transformer);
  }

  deleteTransformer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/catalogs/transformers/${id}`);
  }

  getTransformerUsage(id: string): Observable<CatalogUsage> {
    return this.http.get<CatalogUsage>(`${this.API}/catalogs/transformers/${id}/usage`);
  }

  // ── Switches ────────────────────────────────────────────────

  getAllSwitches(): Observable<SwitchCatalog[]> {
    return this.http.get<SwitchCatalog[]>(`${this.API}/catalogs/switches`);
  }

  createSwitch(sw: Partial<SwitchCatalog>): Observable<SwitchCatalog> {
    return this.http.post<SwitchCatalog>(`${this.API}/catalogs/switches`, sw);
  }

  updateSwitch(id: string, sw: SwitchCatalog): Observable<SwitchCatalog> {
    return this.http.put<SwitchCatalog>(`${this.API}/catalogs/switches/${id}`, sw);
  }

  deleteSwitch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/catalogs/switches/${id}`);
  }

  getSwitchUsage(id: string): Observable<CatalogUsage> {
    return this.http.get<CatalogUsage>(`${this.API}/catalogs/switches/${id}/usage`);
  }

  // ── Load Presets ────────────────────────────────────────────

  getAllLoadPresets(): Observable<LoadPreset[]> {
    return this.http.get<LoadPreset[]>(`${this.API}/catalogs/load-presets`);
  }

  createLoadPreset(preset: Partial<LoadPreset>): Observable<LoadPreset> {
    return this.http.post<LoadPreset>(`${this.API}/catalogs/load-presets`, preset);
  }

  updateLoadPreset(id: string, preset: LoadPreset): Observable<LoadPreset> {
    return this.http.put<LoadPreset>(`${this.API}/catalogs/load-presets/${id}`, preset);
  }

  deleteLoadPreset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/catalogs/load-presets/${id}`);
  }

  getLoadPresetUsage(id: string): Observable<CatalogUsage> {
    return this.http.get<CatalogUsage>(`${this.API}/catalogs/load-presets/${id}/usage`);
  }

  // ── Compliance Standards ────────────────────────────────────

  getComplianceStandards(): Observable<ComplianceStandard[]> {
    return this.http.get<ComplianceStandard[]>(`${this.API}/compliance-standards`);
  }

  createComplianceStandard(standard: Partial<ComplianceStandard>): Observable<ComplianceStandard> {
    return this.http.post<ComplianceStandard>(`${this.API}/compliance-standards`, standard);
  }

  updateComplianceStandard(id: number, standard: ComplianceStandard): Observable<ComplianceStandard> {
    return this.http.put<ComplianceStandard>(`${this.API}/compliance-standards/${id}`, standard);
  }

  deleteComplianceStandard(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/compliance-standards/${id}`);
  }

  // ── Catalog Import ──────────────────────────────────────────

  getImportFields(type: CatalogImportType): Observable<CatalogImportField[]> {
    return this.http.get<CatalogImportField[]>(`${this.API}/catalogs/import/fields`, {
      params: { type }
    });
  }

  getImportHeaders(file: File): Observable<ImportHeadersResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ImportHeadersResponse>(`${this.API}/catalogs/import/headers`, form);
  }

  previewImport(type: CatalogImportType, file: File, mapping: Record<string, string>): Observable<CatalogImportPreview> {
    const form = new FormData();
    form.append('file', file);
    const params: { type: string; mapping?: string } = { type };
    if (Object.keys(mapping).length > 0) {
      params.mapping = JSON.stringify(mapping);
    }
    return this.http.post<CatalogImportPreview>(`${this.API}/catalogs/import/preview`, form, { params });
  }

  commitImport(request: ImportCommitRequest): Observable<ImportCommitResult> {
    return this.http.post<ImportCommitResult>(`${this.API}/catalogs/import/commit`, request);
  }

  // ── Catalog Export ──────────────────────────────────────────

  exportCatalog(type: CatalogImportType, format: 'json' | 'excel'): Observable<Blob> {
    return this.http.get(`${this.API}/catalogs/export`, {
      params: { type, format },
      responseType: 'blob'
    });
  }
}
