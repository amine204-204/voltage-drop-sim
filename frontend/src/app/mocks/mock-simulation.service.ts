import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CableSizingSuggestion, SimulationRequestDto, SimulationResponseDto } from '../models/simulation.model';

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

  suggestCables(payload: SimulationRequestDto): Observable<CableSizingSuggestion[]> {
    const consumer = payload.graph.nodes.find(n => n.type === 'CONSUMER');
    const cables = payload.graph.branches.filter(b => !b.branchType || b.branchType === 'CABLE');

    const sizes = ['16mm2', '25mm2', '35mm2', '50mm2', '70mm2'];
    const suggestions: CableSizingSuggestion[] = [];

    for (const cable of cables) {
      const current = (cable.componentCrossSection || '16mm2').toLowerCase();
      const idx = sizes.indexOf(current);
      if (idx < 0 || idx >= sizes.length - 1) continue;

      const target = sizes[idx + 1];
      const alternatives = sizes.slice(idx + 2, idx + 4).map((cs, i) => ({
        catalogId: `mock-cable-${cs.replace(/\D/g, '')}`,
        crossSection: cs,
        name: `N2XH ${cs} Cu`,
        predictedTotalDropPercent: Math.max(1, 11.0 * (0.5 - (i + 1) * 0.12))
      }));

      suggestions.push({
        branchId: cable.id,
        branchName: cable.name || 'Cable',
        currentCatalogId: cable.catalogId || null,
        currentCrossSection: current,
        currentMaterial: cable.componentMaterial || 'CU',
        suggestedCatalogId: `mock-cable-${target.replace(/\D/g, '')}`,
        suggestedCrossSection: target,
        suggestedName: `N2XH ${target} Cu`,
        contributionPercent: 7.2,
        dropReductionPercent: 5.3,
        affectedNodes: consumer ? [{
          nodeId: consumer.id,
          nodeName: consumer.name || 'Load',
          totalDropPercent: 11.0,
          predictedTotalDropPercent: 5.7
        }] : [],
        alternatives
      });
    }

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(suggestions);
        observer.complete();
      }, 300);
    });
  }
}
