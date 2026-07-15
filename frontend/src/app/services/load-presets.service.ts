import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoadPreset } from '../models/load-preset.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private http: HttpClient) {}

  getCables(): Observable<LoadPreset[]> {
    return this.http.get<LoadPreset[]>('/api/catalogs/load-presets');
  }
}