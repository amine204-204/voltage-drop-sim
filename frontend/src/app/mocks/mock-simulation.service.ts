import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SimulationRequestDto, SimulationResponseDto } from '../models/simulation.model';

@Injectable({
  providedIn: 'root'
})
export class MockSimulationService {
  
  runSimulation(payload: SimulationRequestDto): Observable<SimulationResponseDto> {
    console.log('🔶 USING MOCK DATA for an island');
    
    const mockResponse: SimulationResponseDto = {
      nodes: payload.graph.nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        localNominalVoltage: node.nominalVoltage || 230,
        potentialTimeSeries: Array(payload.totalTimeSteps).fill(node.type === 'SOURCE' ? 230 : 218),
        cumulativeDropPercentTimeSeries: Array(payload.totalTimeSteps).fill(node.type === 'SOURCE' ? 0 : 5.2),
        statusTimeSeries: node.type === 'CONSUMER'
          ? Array(payload.totalTimeSteps).fill('OK') as ('OK' | 'VIOLATION')[]
          : [],
        powerQualityEvents: [],
        pathBranches: []
      })),
      branches: payload.graph.branches.map(branch => ({
        id: branch.id,
        dropPercentTimeSeries: Array(payload.totalTimeSteps).fill(5.2),
        currentTimeSeries: Array(payload.totalTimeSteps).fill(10)
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
