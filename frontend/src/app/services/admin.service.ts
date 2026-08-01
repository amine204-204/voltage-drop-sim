import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSummary, CreateUserRequest, UpdateRoleRequest } from '../models/admin.model';
import { CableCatalog, TransformerCatalog, SwitchCatalog } from '../models/catalog.model';
import { ComplianceStandard } from '../models/compliance-standard.model';

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
}
