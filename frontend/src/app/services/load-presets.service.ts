import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoadPreset } from '../models/load-preset.model';

@Injectable({ providedIn: 'root' })
export class LoadPresetService {
  constructor(private http: HttpClient) {}

  getPresets(): Observable<LoadPreset[]> {
    return this.http.get<LoadPreset[]>('/api/catalogs/load-presets');
  }

  getPreset(id: string): Observable<LoadPreset> {
    return this.http.get<LoadPreset>(`/api/catalogs/load-presets/${id}`);
  }
}