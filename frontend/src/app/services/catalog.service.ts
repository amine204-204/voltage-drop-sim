import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CableCatalog, CatalogItem } from '../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private http: HttpClient) {}

  getCables(): Observable<CableCatalog[]> {
    return this.http.get<CableCatalog[]>('/api/catalogs/cables');
  }
}