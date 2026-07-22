import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ComplianceStandard } from '../models/compliance-standard.model';

@Injectable({ providedIn: 'root' })
export class NormService {
  constructor(private http: HttpClient) {}

  getActiveStandards(): Observable<ComplianceStandard[]> {
    return this.http.get<ComplianceStandard[]>('/api/norms/compliance-standards');
  }
}
