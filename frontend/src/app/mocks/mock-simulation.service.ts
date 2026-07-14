import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimulationRequestDto } from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class MockSimulationService {
  
  runSimulation(payload: SimulationRequestDto): Observable<any> {
    console.log('🔶 USING MOCK DATA for an island');
    
    const mockResponse: any = {
      nodes: payload.graph.nodes.map(node => ({
        ...node,
        potentialTimeSeries: Array(payload.totalTimeSteps).fill(node.type === 'SOURCE' ? 230 : 218)
      })),
      branches: payload.graph.branches.map(branch => ({
        ...branch,
        statusTimeSeries: Array(payload.totalTimeSteps).fill('OK'),
        dropPercentTimeSeries: Array(payload.totalTimeSteps).fill(5.2),
        currentTimeSeries: Array(payload.totalTimeSteps).fill(10),
        powerQualityEvents: []
      }))
    };

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(mockResponse);
        observer.complete();
      }, 100);
    });
  }
}