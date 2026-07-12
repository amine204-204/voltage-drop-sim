import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { GridCanvas } from './components/grid-canvas/grid-canvas';
import { SimulationTopBar, SimulationSettings } from './components/simulation-top-bar/simulation-top-bar';
import { SimulationService } from './services/simulation.service';
import { MockSimulationService } from './mocks/mock-simulation-service';
import { SimulationRequestDto } from './models/simulation.model';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GridCanvas, SimulationTopBar],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  
  @ViewChild(GridCanvas) gridCanvas!: GridCanvas;
  
  public maxSimulationSteps: number = 10;
  public currentSimulationStep: number = 0;
  public isSimulationLoaded: boolean = false;
  
  private USE_MOCKS: boolean = true; 

  constructor(
    private realService: SimulationService,
    private mockService: MockSimulationService,
    private cdr: ChangeDetectorRef
  ) {}

  private get service() {
    return this.USE_MOCKS ? this.mockService : this.realService;
  }

  public onRunClicked(settings: SimulationSettings) {
    try {
      const islands = this.gridCanvas.getIslands();

      if (islands.length === 0) {
        alert("Please draw a grid before running.");
        return;
      }
      console.log(settings.deltaTimeSeconds);
      const payloads: Observable<any>[] = islands.map(island => {
        const payload: SimulationRequestDto = {
          totalTimeSteps: settings.totalTimeSteps,
          deltaTimeSeconds: settings.deltaTimeSeconds,
          selectedNormType: settings.selectedNormType,
          customMinPu: settings.customMinPu,
          customMaxPu: settings.customMaxPu,
          graph: island
        };
        return this.service.runSimulation(payload);
      });

      forkJoin(payloads).subscribe({
        next: (responses: any[]) => {
          console.log(`${responses.length} Island(s) simulated successfully!`, responses);
          
          const mergedResponse = {
            nodes: responses.flatMap(r => r.nodes),
            branches: responses.flatMap(r => r.branches)
          };

          this.gridCanvas.applySimulationResults(mergedResponse, settings.deltaTimeSeconds);
          
          this.maxSimulationSteps = settings.totalTimeSteps;
          this.currentSimulationStep = 0;
          this.isSimulationLoaded = true; 
          this.cdr.detectChanges(); 
        },
        error: (err) => {
          const msg = err.error?.message || err.message || 'Unknown error';
          alert('Simulation Error: ' + msg);
        }
      });

    } catch (e: any) {
      alert(e.message);
    }
  }

  public onStepChanged(step: number) {
    this.currentSimulationStep = step;
    this.gridCanvas.updateTimeStep(step);
  }

  public onMaxStepsChanged(maxSteps: number) {
    this.maxSimulationSteps = maxSteps;
  }
}