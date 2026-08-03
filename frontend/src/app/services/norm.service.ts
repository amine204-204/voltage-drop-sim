import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { ComplianceStandard } from '../models/compliance-standard.model';

@Injectable({ providedIn: 'root' })
export class NormService {
  private cached$: Observable<ComplianceStandard[]> | null = null;

  constructor(private http: HttpClient) {}

  getActiveStandards(): Observable<ComplianceStandard[]> {
    if (!this.cached$) {
      this.cached$ = this.http.get<ComplianceStandard[]>('/api/norms/compliance-standards').pipe(
        shareReplay(1)
      );
    }
    return this.cached$;
  }

  invalidateStandards(): void {
    this.cached$ = null;
  }
}
