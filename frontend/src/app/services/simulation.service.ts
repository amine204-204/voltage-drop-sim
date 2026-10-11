import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CableSizingSuggestion, SimulationRequestDto, SimulationResponseDto } from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private apiUrl = '/api/simulations/run';
  private suggestUrl = '/api/simulations/suggest-cables';

  constructor(private http: HttpClient) { }

  runSimulation(payload: SimulationRequestDto): Observable<SimulationResponseDto> {
    return this.http.post<SimulationResponseDto>(this.apiUrl, payload);
  }

  suggestCables(payload: SimulationRequestDto): Observable<CableSizingSuggestion[]> {
    return this.http.post<CableSizingSuggestion[]>(this.suggestUrl, payload);
  }
}