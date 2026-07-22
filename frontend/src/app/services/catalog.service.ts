import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CableCatalog, TransformerCatalog, SwitchCatalog } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private http: HttpClient) {}

  getCables(): Observable<CableCatalog[]> {
    return this.http.get<CableCatalog[]>('/api/catalogs/cables');
  }

  getTransformers(): Observable<TransformerCatalog[]> {
    return this.http.get<TransformerCatalog[]>('/api/catalogs/transformers');
  }

  getSwitches(): Observable<SwitchCatalog[]> {
    return this.http.get<SwitchCatalog[]>('/api/catalogs/switches');
  }
}