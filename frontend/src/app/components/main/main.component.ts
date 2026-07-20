import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { GridCanvas } from '../grid-canvas/grid-canvas';
import { SimulationTopBar, SimulationSettings } from '../simulation-top-bar/simulation-top-bar';
import { SimulationService } from '../../services/simulation.service';
import { MockSimulationService } from '../../mocks/mock-simulation.service';
import { SimulationRequestDto } from '../../models/simulation.model';
import { forkJoin, Observable, of } from 'rxjs';
import { MOCK_CABLES } from '../../mocks/equipement-catalog.mock';
import { CatalogService } from '../../services/catalog.service';
import { CableCatalog } from '../../models/catalog.model';
import { NgIf } from '@angular/common';
import { LoadPreset } from '../../models/load-preset.model';
import { LOAD_PRESETS } from '../../mocks/load-preset.mock';
import { ProjectSummary, Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { ProjectModal } from '../project-modal/project-modal';
import { UserBarComponent } from '../user-bar/user-bar.component';
import { getErrorMessage } from '../../guards/error.interceptor';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [GridCanvas, SimulationTopBar, ProjectModal, UserBarComponent, NgIf],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  @ViewChild(GridCanvas) gridCanvas!: GridCanvas;
  @ViewChild(SimulationTopBar) topBar!: SimulationTopBar;

  public maxSimulationSteps: number = 10;
  public deltaTime: number = 1;
  public currentStep: number = 0;
  public isSimulationLoaded: boolean = false;

  public cableCatalog: CableCatalog[] = [];
  public loadPresets: LoadPreset[] = [];

  public projects: ProjectSummary[] = [];
  public selectedProjectId: number | null = null;

  public showProjectModal: boolean = false;
  public isEditModal: boolean = false;
  public modalProjectName: string = '';
  public modalProjectDescription: string = '';

  isLoadingCatalog = true;
  catalogError: string | null = null;

  private USE_MOCKS: boolean = false;

  constructor(
    private simulationService: SimulationService,
    private catalogService: CatalogService,
    private projectService: ProjectService,
    private mockSimulationService: MockSimulationService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }


  ngOnInit() {
    this.loadProjectsList();
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
          this.toast.error(this.catalogError + '\n' + getErrorMessage(err));
          this.cdr.detectChanges();
        }
      });
    }
  }

  private loadProjectsList() {
    this.projectService.getProjects().subscribe({
      next: (list) => {
        this.projects = list;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error('Failed to load projects: ' + getErrorMessage(err));
      }
    });
  }

  private get simService() {
    return this.USE_MOCKS ? this.mockSimulationService : this.simulationService;
  }

  public onRunClicked(settings: SimulationSettings) {
    try {
      const islands = this.gridCanvas.getIslands();

      if (islands.length === 0) {
        this.toast.info('Please draw a grid before running.');
        return;
      }
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
          this.toast.error('Simulation failed: ' + getErrorMessage(err));
        }
      });

    } catch (e: any) {
      this.toast.error(e.message);
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

  private getSavePayload(name: string, description: string): Project {
    const canvasGraph = this.gridCanvas.getProjectGraph();

    let simulationResult: any = null;
    if (this.isSimulationLoaded) {
      const nodesResults = canvasGraph.nodes.map(node => {
        const cyNode = this.gridCanvas['cy']?.$('#' + node.id);
        const simData = cyNode?.data('simulationData');
        return {
          nodeId: node.id,
          potentialTimeSeries: simData ? simData.potentialTimeSeries : []
        };
      });

      const branchesResults = canvasGraph.branches.map(branch => {
        const cyEdge = this.gridCanvas['cy']?.$('#' + branch.id);
        const simData = cyEdge?.data('simulationData');
        return {
          branchId: branch.id,
          currentTimeSeries: simData ? simData.currentTimeSeries : [],
          dropPercentTimeSeries: simData ? simData.dropPercentTimeSeries : [],
          statusTimeSeries: simData ? simData.statusTimeSeries : [],
          powerQualityEvents: simData ? simData.powerQualityEvents.map((pq: any) => ({
            startTimeStep: pq.startTimeStep,
            endTimeStep: pq.endTimeStep,
            worstMagnitudePu: pq.worstMagnitudePu,
            classification: pq.classification
          })) : []
        };
      });

      simulationResult = {
        nodesResults,
        branchesResults
      };
    }

    const normType = this.topBar ? this.topBar.selectedNormType : 'en50160';
    const minPu = this.topBar ? this.topBar.customMinPu : 0.90;
    const maxPu = this.topBar ? this.topBar.customMaxPu : 1.10;

    return {
      name,
      description,
      totalTimeSteps: this.maxSimulationSteps,
      deltaTimeSeconds: this.deltaTime,
      selectedNormType: normType,
      customMinPu: normType === 'custom' ? minPu : undefined,
      customMaxPu: normType === 'custom' ? maxPu : undefined,
      nodes: canvasGraph.nodes,
      branches: canvasGraph.branches,
      simulationResult
    };
  }

  public onProjectSelected(id: number | null) {
    if (id === null) {
      this.selectedProjectId = null;
      this.gridCanvas.clearCanvas();
      this.isSimulationLoaded = false;
      this.currentStep = 0;
      this.cdr.detectChanges();
      return;
    }

    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.selectedProjectId = project.id || null;
        this.maxSimulationSteps = project.totalTimeSteps;
        this.deltaTime = project.deltaTimeSeconds;
        this.currentStep = 0;

        if (this.topBar) {
          this.topBar.maxSteps = project.totalTimeSteps;
          this.topBar.deltaTime = project.deltaTimeSeconds;
          this.topBar.selectedNormType = project.selectedNormType;
          this.topBar.currentStep = 0;
          if (project.selectedNormType === 'custom') {
            this.topBar.customMinPu = project.customMinPu || 0.90;
            this.topBar.customMaxPu = project.customMaxPu || 1.10;
          }
        }

        this.gridCanvas.loadProjectGraph(
          project.nodes,
          project.branches,
          project.simulationResult,
          project.deltaTimeSeconds
        );

        this.isSimulationLoaded = project.simulationResult ? true : false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error('Failed to load project: ' + getErrorMessage(err));
      }
    });
  }

  public onSaveClicked() {
    if (this.selectedProjectId !== null) {
      const existing = this.projects.find(p => p.id === this.selectedProjectId);
      const name = existing ? existing.name : 'Project';
      const desc = existing ? existing.description || '' : '';

      const payload = this.getSavePayload(name, desc);
      this.projectService.updateProject(this.selectedProjectId, payload).subscribe({
        next: (saved) => {
          this.toast.success('Project saved successfully!');
          this.loadProjectsList();
        },
        error: (err) => {
          this.toast.error('Failed to save project: ' + getErrorMessage(err));
        }
      });
    } else {
      this.isEditModal = false;
      this.modalProjectName = '';
      this.modalProjectDescription = '';
      this.showProjectModal = true;
      this.cdr.detectChanges();
    }
  }

  public onSaveAsClicked() {
    if (this.selectedProjectId === null) return;
    const existing = this.projects.find(p => p.id === this.selectedProjectId);
    this.isEditModal = false;
    this.modalProjectName = existing ? `${existing.name} (Copy)` : 'New Project Copy';
    this.modalProjectDescription = existing ? existing.description || '' : '';
    this.showProjectModal = true;
    this.cdr.detectChanges();
  }

  public onNewClicked() {
    this.selectedProjectId = null;
    this.gridCanvas.clearCanvas();
    this.isSimulationLoaded = false;
    this.currentStep = 0;

    if (this.topBar) {
      this.topBar.currentStep = 0;
    }

    this.cdr.detectChanges();
  }

  public onDeleteClicked() {
    if (this.selectedProjectId === null) return;
    const existing = this.projects.find(p => p.id === this.selectedProjectId);
    const name = existing ? existing.name : 'this project';
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.projectService.deleteProject(this.selectedProjectId).subscribe({
        next: () => {
          this.toast.success('Project deleted successfully.');
          this.loadProjectsList();
          this.onNewClicked();
        },
        error: (err) => {
          this.toast.error('Failed to delete project: ' + getErrorMessage(err));
        }
      });
    }
  }

  public onModalSave(result: { name: string; description: string }) {
    const payload = this.getSavePayload(result.name, result.description);
    this.projectService.createProject(payload).subscribe({
      next: (saved) => {
        this.showProjectModal = false;
        this.toast.success('Project created successfully!');
        this.selectedProjectId = saved.id || null;
        this.loadProjectsList();

        if (saved.id) {
          this.onProjectSelected(saved.id);
        }
      },
      error: (err) => {
        this.toast.error('Failed to create project: ' + getErrorMessage(err));
      }
    });
  }
}
