import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimulationRequestDto, SimulationResponseDto } from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {
  private apiUrl = '/api/simulations/run';

  constructor(private http: HttpClient) { }

  runSimulation(payload: SimulationRequestDto): Observable<SimulationResponseDto> {
    return this.http.post<SimulationResponseDto>(this.apiUrl, payload);
  }
}