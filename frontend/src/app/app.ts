import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from './services/simulation.service';
import { SimulationRequestDto } from './models/simulation.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  
  constructor(private simulationService: SimulationService) {}

  runDummyTest() {
    const dummyPayload: SimulationRequestDto = {
      totalTimeSteps: 2,
      deltaTimeSeconds: 1.0,
      selectedNormType: 'en50160',
      graph: {
        nodes: [
          {
            id: 'SRC',
            name: 'Substation',
            type: 'SOURCE',
            nominalVoltage: 230.0
          },
          {
            id: 'LOAD',
            name: 'Factory',
            type: 'CONSUMER',
            loadType: 'CONSTANT_CURRENT',
            loadProfile: [10.0, 10.0],
            cosPhi: 0.95
          }
        ],
        branches: [
          {
            id: 'BR1',
            name: 'Feeder 1',
            fromNodeId: 'SRC',
            toNodeId: 'LOAD',
            lengthInKm: 1.0,
            componentCrossSection: '16mm2', 
            componentMaterial: 'CU'
          }
        ]
      }
    };

    console.log('Sending payload to Spring Boot...', dummyPayload);

    // Call the backend
    this.simulationService.runSimulation(dummyPayload).subscribe({
      next: (response) => {
        console.log('SUCCESS! Backend calculated the grid:', response);
        
        // Let's extract the Load node's voltage to verify the math manually
        const loadNode = response.nodes.find((n: any) => n.id === 'LOAD');
        const calculatedVoltage = loadNode.potentialTimeSeries[0];
        
        console.log(`Voltage at LOAD node (Step 0): ${calculatedVoltage} V`);
        console.log(`Branch Status (Step 0): ${response.branches[0].statusTimeSeries[0]}`);
      },
      error: (error) => {
        console.error('ERROR from Spring Boot:', error);
      }
    });
  }
}