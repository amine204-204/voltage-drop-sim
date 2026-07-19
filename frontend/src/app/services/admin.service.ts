import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserSummary, CreateUserRequest, UpdateRoleRequest } from '../models/admin.model';
import { CableCatalog } from '../models/catalog.model';

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
}
