import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { GridCanvas } from './components/grid-canvas/grid-canvas';
import { SimulationTopBar, SimulationSettings } from './components/simulation-top-bar/simulation-top-bar';
import { SimulationService } from './services/simulation.service';
import { MockSimulationService } from './mocks/mock-simulation.service';
import { SimulationRequestDto } from './models/simulation.model';
import { forkJoin, Observable, of } from 'rxjs';
import { MOCK_CABLES } from './mocks/equipement-catalog.mock';
import { CatalogService } from './services/catalog.service';
import { CableCatalog } from './models/catalog.model';
import { AsyncPipe, NgIf } from '@angular/common';
import { LoadPreset } from './models/load-preset.model';
import { LOAD_PRESETS } from './mocks/load-preset.mock';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GridCanvas, SimulationTopBar, AsyncPipe, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  
  @ViewChild(GridCanvas) gridCanvas!: GridCanvas;
  
  public maxSimulationSteps: number = 10;
  public deltaTime: number = 1;
  public currentStep: number = 0;
  public isSimulationLoaded: boolean = false;
  
  public cableCatalog: CableCatalog[] = [];
  public loadPresets: LoadPreset[] = [];

  isLoadingCatalog = true;
  catalogError: string | null = null;

  private USE_MOCKS: boolean = false; 

  constructor(
    private simulationService: SimulationService,
    private catalogService: CatalogService,
    private mockSimulationService: MockSimulationService,
    private cdr: ChangeDetectorRef
  ) {}

 
  ngOnInit() {
    if (this.USE_MOCKS) {
      this.cableCatalog = MOCK_CABLES;
      this.loadPresets = LOAD_PRESETS;
      this.isLoadingCatalog = false;
    } else {
      this.catalogService.getCables().subscribe({
        next: (cables) => {
          this.cableCatalog = cables;
          this.isLoadingCatalog = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.catalogError = 'Failed to load equipment catalog. Using defaults.';
          this.cableCatalog = MOCK_CABLES;
          this.isLoadingCatalog = false;
          alert(this.catalogError);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private get simService() {
    return this.USE_MOCKS ? this.mockSimulationService : this.simulationService;
  }

  public onRunClicked(settings: SimulationSettings) {
    console.log(this.cableCatalog);
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
        return this.simService.runSimulation(payload);
      });

      forkJoin(payloads).subscribe({
        next: (responses: any[]) => {          
          const mergedResponse = {
            nodes: responses.flatMap(r => r.nodes),
            branches: responses.flatMap(r => r.branches)
          };

          this.gridCanvas.applySimulationResults(mergedResponse, settings.deltaTimeSeconds);
          
          this.maxSimulationSteps = settings.totalTimeSteps;
          this.currentStep = 0;
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

  public onDeltaTimeChanged(deltaTime: number) {
    this.deltaTime = deltaTime;
  }

  public onCurrentStepChanged(step: number) {
    this.currentStep = step;
    this.gridCanvas.updateTimeStep(step);
  }

  public onMaxStepsChanged(maxSteps: number) {
    this.maxSimulationSteps = maxSteps;
  }
}