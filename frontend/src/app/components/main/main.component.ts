import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { GridCanvas } from '../grid-canvas/grid-canvas.component';
import { SimulationTopBar, SimulationSettings } from '../simulation-top-bar/simulation-top-bar.component';
import { SimulationService } from '../../services/simulation.service';
import { MockSimulationService } from '../../mocks/mock-simulation.service';
import { SimulationRequestDto, SimulationResponseDto } from '../../models/simulation.model';
import { forkJoin, Observable } from 'rxjs';
import { MOCK_CABLES, MOCK_TRANSFORMERS, MOCK_SWITCHES } from '../../mocks/equipment-catalog.mock';
import { CatalogService } from '../../services/catalog.service';
import { CableCatalog, TransformerCatalog, SwitchCatalog } from '../../models/catalog.model';
import { NgIf } from '@angular/common';
import { LoadPreset } from '../../models/load-preset.model';
import { LOAD_PRESETS } from '../../mocks/load-preset.mock';
import { ProjectSummary, Project, ProjectBranch, ProjectSimulationResult } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { LoadPresetService } from '../../services/load-presets.service';
import { ProjectModal } from '../project-modal/project-modal';
import { UserBarComponent } from '../user-bar/user-bar.component';
import { IconComponent } from '../shared/icon/icon.component';
import { SettingsModalComponent, ProjectSettings } from '../settings-modal/settings-modal.component';
import { getErrorMessage } from '../../shared/utils/error.utils';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';
import { GraphExport, GraphExportBranch } from '../../models/graph-export.model';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [GridCanvas, SimulationTopBar, ProjectModal, UserBarComponent, SettingsModalComponent, IconComponent, NgIf],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(GridCanvas) gridCanvas!: GridCanvas;

  public maxSimulationSteps: number = 10;
  public deltaTime: number = 1;
  public currentStep: number = 0;
  public isSimulationLoaded: boolean = false;
  public selectedNormType: string = 'en50160';
  public customMinPu: number = 0.90;
  public customMaxPu: number = 1.10;

  public cableCatalog: CableCatalog[] = [];
  public transformerCatalog: TransformerCatalog[] = [];
  public switchCatalog: SwitchCatalog[] = [];
  public loadPresets: LoadPreset[] = [];

  public projects: ProjectSummary[] = [];
  public selectedProjectId: number | null = null;

  public showProjectModal: boolean = false;
  public showSettingsModal: boolean = false;
  public isEditModal: boolean = false;
  public modalProjectName: string = '';
  public modalProjectDescription: string = '';
  public modalError: string = '';

  isLoadingCatalog = true;
  catalogError: string | null = null;
  isSimulating: boolean = false;
  deleteConfirmStep: boolean = false;
  isDragOver: boolean = false;
  private pendingLoadProjectId: number | null = null;

  constructor(
    private simulationService: SimulationService,
    private catalogService: CatalogService,
    private projectService: ProjectService,
    private loadPresetService: LoadPresetService,
    private mockSimulationService: MockSimulationService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.deleteConfirmStep) {
      const target = event.target as HTMLElement;
      if (!target.closest('.delete-btn')) {
        this.deleteConfirmStep = false;
        this.cdr.markForCheck();
      }
    }
  }

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    this.saveScratchpad();
  }

  ngOnDestroy() {
    this.saveScratchpad();
  }


  ngOnInit() {
    this.loadProjectsList();

    const storedId = sessionStorage.getItem('currentProjectId');
    if (storedId !== null) {
      const id = parseInt(storedId, 10);
      if (!isNaN(id)) {
        this.pendingLoadProjectId = id;
      }
    }

    if (environment.useMocks) {
      this.cableCatalog = MOCK_CABLES;
      this.transformerCatalog = MOCK_TRANSFORMERS;
      this.switchCatalog = MOCK_SWITCHES;
      this.loadPresets = LOAD_PRESETS;
      this.isLoadingCatalog = false;
      this.cdr.markForCheck();
      setTimeout(() => this.tryLoadPendingProject());
    } else {
      forkJoin({
        cables: this.catalogService.getCables(),
        transformers: this.catalogService.getTransformers(),
        switches: this.catalogService.getSwitches(),
        presets: this.loadPresetService.getPresets()
      }).subscribe({
        next: (result) => {
          this.cableCatalog = result.cables;
          this.transformerCatalog = result.transformers;
          this.switchCatalog = result.switches;
          this.loadPresets = result.presets;
          this.isLoadingCatalog = false;
          this.cdr.markForCheck();
          setTimeout(() => this.tryLoadPendingProject());
        },
        error: (err) => {
          this.catalogError = 'Failed to load equipment catalog. Using defaults.';
          this.cableCatalog = MOCK_CABLES;
          this.transformerCatalog = MOCK_TRANSFORMERS;
          this.switchCatalog = MOCK_SWITCHES;
          this.loadPresets = LOAD_PRESETS;
          this.isLoadingCatalog = false;
          this.toast.error(this.catalogError + '\n' + getErrorMessage(err));
          this.cdr.markForCheck();
          setTimeout(() => this.tryLoadPendingProject());
        }
      });
    }
  }

  ngAfterViewInit() {
    this.tryLoadPendingProject();
  }

  private tryLoadPendingProject() {
    if (!this.gridCanvas) return;
    if (this.pendingLoadProjectId !== null) {
      const id = this.pendingLoadProjectId;
      this.pendingLoadProjectId = null;
      this.onProjectSelected(id);
      return;
    }
    const scratchpadJson = sessionStorage.getItem('scratchpadGraph');
    if (scratchpadJson && this.gridCanvas.isEmpty) {
      try {
        const graph = JSON.parse(scratchpadJson);
        if (graph.nodes && graph.branches) {
          this.gridCanvas.loadProjectGraph(graph.nodes, graph.branches);
        }
      } catch {
      }
    }
  }

  private saveScratchpad() {
    if (!this.gridCanvas || this.gridCanvas.isEmpty) return;
    const graph = this.gridCanvas.getProjectGraph();
    sessionStorage.setItem('scratchpadGraph', JSON.stringify(graph));
  }

  private clearScratchpad() {
    sessionStorage.removeItem('scratchpadGraph');
  }

  private loadProjectsList() {
    this.projectService.getProjects().subscribe({
      next: (list) => {
        this.projects = list;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error('Failed to load projects: ' + getErrorMessage(err));
      }
    });
  }

  private get simService() {
    return environment.useMocks ? this.mockSimulationService : this.simulationService;
  }

  public onRunClicked(settings: SimulationSettings) {
    this.isSimulating = true;
    this.cdr.markForCheck();

    try {
      const islands = this.gridCanvas.getIslands();

      const simlatableIslands = islands.filter(island =>
        island.nodes.some(node => node.type === 'SOURCE')
      );

      if (simlatableIslands.length === 0) {
        this.toast.info('Please draw a grid before running.');
        this.isSimulating = false;
        this.cdr.markForCheck();
        return;
      }
      const payloads: Observable<SimulationResponseDto>[] = simlatableIslands.map(island => {
        const payload: SimulationRequestDto = {
          totalTimeSteps: settings.totalTimeSteps,
          deltaTimeSeconds: settings.deltaTimeSeconds,
          selectedNormType: this.selectedNormType,
          customMinPu: this.selectedNormType === 'custom' ? this.customMinPu : undefined,
          customMaxPu: this.selectedNormType === 'custom' ? this.customMaxPu : undefined,
          graph: island
        };
        return this.simService.runSimulation(payload);
      });

      forkJoin(payloads).subscribe({
        next: (responses: SimulationResponseDto[]) => {
          const mergedResponse = {
            nodes: responses.flatMap(r => r.nodes),
            branches: responses.flatMap(r => r.branches)
          };

          this.gridCanvas.applySimulationResults(mergedResponse, settings.deltaTimeSeconds);

          this.maxSimulationSteps = settings.totalTimeSteps;
          this.currentStep = 0;
          this.isSimulationLoaded = true;
          this.isSimulating = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSimulating = false;
          this.toast.error('Simulation failed: ' + getErrorMessage(err));
          this.cdr.markForCheck();
        }
      });

    } catch (e: unknown) {
      this.isSimulating = false;
      this.toast.error(e instanceof Error ? e.message : 'Unknown error');
      this.cdr.markForCheck();
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

    let simulationResult: ProjectSimulationResult | undefined = undefined;
    if (this.isSimulationLoaded) {
      simulationResult = this.gridCanvas.getSimulationSnapshot() ?? undefined;
    }

    return {
      name,
      description,
      totalTimeSteps: this.maxSimulationSteps,
      deltaTimeSeconds: this.deltaTime,
      selectedNormType: this.selectedNormType,
      customMinPu: this.selectedNormType === 'custom' ? this.customMinPu : undefined,
      customMaxPu: this.selectedNormType === 'custom' ? this.customMaxPu : undefined,
      nodes: canvasGraph.nodes,
      branches: canvasGraph.branches,
      simulationResult
    };
  }

  public onProjectSelected(id: number | null) {
    if (id === null) {
      this.selectedProjectId = null;
      sessionStorage.removeItem('currentProjectId');
      this.gridCanvas.clearCanvas();
      this.isSimulationLoaded = false;
      this.currentStep = 0;
      this.deleteConfirmStep = false;
      this.cdr.markForCheck();
      return;
    }

    sessionStorage.setItem('currentProjectId', String(id));
    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.selectedProjectId = project.id || null;
        this.maxSimulationSteps = project.totalTimeSteps;
        this.deltaTime = project.deltaTimeSeconds;
        this.currentStep = 0;
        this.selectedNormType = project.selectedNormType;
        if (project.selectedNormType === 'custom') {
          this.customMinPu = project.customMinPu || 0.90;
          this.customMaxPu = project.customMaxPu || 1.10;
        }

        this.gridCanvas.loadProjectGraph(
          project.nodes,
          project.branches,
          project.simulationResult,
          project.deltaTimeSeconds
        );

        this.isSimulationLoaded = project.simulationResult ? true : false;
        this.cdr.markForCheck();
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
          this.clearScratchpad();
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
      this.modalError = '';
      this.showProjectModal = true;
      this.cdr.markForCheck();
    }
  }

  public onSaveAsClicked() {
    if (this.selectedProjectId === null) return;
    const existing = this.projects.find(p => p.id === this.selectedProjectId);
    this.isEditModal = false;
    this.modalProjectName = existing ? `${existing.name} (Copy)` : 'New Project Copy';
    this.modalProjectDescription = existing ? existing.description || '' : '';
    this.modalError = '';
    this.showProjectModal = true;
    this.cdr.markForCheck();
  }

  public onExportClicked() {
    const canvasGraph = this.gridCanvas.getProjectGraph();
    const exportData: GraphExport = {
      nodes: canvasGraph.nodes.map(n => ({
        id: n.id,
        name: n.name,
        type: n.type,
        nominalVoltage: n.nominalVoltage,
        loadType: n.loadType,
        cosPhi: n.cosPhi,
        loadProfile: n.loadProfile,
        loadProfileControlPoints: n.loadProfileControlPoints,
        selectedPresetId: n.selectedPresetId,
        x: n.x,
        y: n.y
      })),
      branches: canvasGraph.branches.map(b => ({
        id: b.id,
        name: b.name,
        fromNodeId: b.fromNodeId,
        toNodeId: b.toNodeId,
        lengthInKm: b.lengthInKm,
        branchType: b.branchType,
        catalogId: b.catalogId,
        closed: b.closed
      }))
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.toast.success('Graph exported as JSON.');
  }

  private resolveCatalogSpecs(branches: GraphExportBranch[]): ProjectBranch[] {
    return branches.map(b => {
      const resolved: ProjectBranch = {
        id: b.id,
        name: b.name,
        fromNodeId: b.fromNodeId,
        toNodeId: b.toNodeId,
        lengthInKm: b.lengthInKm,
        branchType: b.branchType,
        catalogId: b.catalogId,
        componentCrossSection: '',
        componentMaterial: '',
        closed: b.closed
      };
      if (b.catalogId) {
        const cable = this.cableCatalog.find(c => c.id === b.catalogId);
        if (cable) {
          resolved.componentCrossSection = cable.physical.crossSection;
          resolved.componentMaterial = cable.physical.conductorMaterial;
        }
      }
      return resolved;
    });
  }

  public onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.types.includes('Files')) {
      this.isDragOver = true;
      this.cdr.markForCheck();
    }
  }

  public onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    this.cdr.markForCheck();
  }

  public onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && file.name.endsWith('.json')) {
      this.onImportClicked(file);
    } else {
      this.toast.error('Please drop a .json file.');
    }
    this.cdr.markForCheck();
  }

  public onImportClicked(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data: GraphExport = JSON.parse(e.target?.result as string);
        if (!data.nodes || !data.branches) {
          this.toast.error('Invalid JSON: missing "nodes" or "branches".');
          return;
        }
        const branches = this.resolveCatalogSpecs(data.branches);
        const result = this.gridCanvas.appendGraph(data.nodes, branches);
        this.selectedProjectId = null;
        sessionStorage.removeItem('currentProjectId');
        this.cdr.markForCheck();
        this.toast.success(`Imported ${result.nodesAdded} nodes and ${result.branchesAdded} branches as a new island.`);
      } catch {
        this.toast.error('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  }

  public onSettingsClicked() {
    if (this.selectedProjectId !== null) {
      const existing = this.projects.find(p => p.id === this.selectedProjectId);
      this.modalProjectName = existing ? existing.name : '';
      this.modalProjectDescription = existing ? existing.description || '' : '';
    } else {
      this.modalProjectName = '';
      this.modalProjectDescription = '';
    }
    this.showSettingsModal = true;
    this.cdr.markForCheck();
  }

  public onSettingsApplied(settings: ProjectSettings) {
    this.showSettingsModal = false;
    this.selectedNormType = settings.selectedNormType;
    this.customMinPu = settings.customMinPu;
    this.customMaxPu = settings.customMaxPu;

    if (this.selectedProjectId !== null) {
      const payload = this.getSavePayload(settings.name, settings.description);
      this.projectService.updateProject(this.selectedProjectId, payload).subscribe({
        next: () => {
          this.clearScratchpad();
          this.toast.success('Project settings saved.');
          this.loadProjectsList();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.toast.error('Failed to save settings: ' + getErrorMessage(err));
          this.cdr.markForCheck();
        }
      });
    } else {
      this.cdr.markForCheck();
    }
  }

  public onNewClicked() {
    this.selectedProjectId = null;
    sessionStorage.removeItem('currentProjectId');
    this.clearScratchpad();
    this.gridCanvas.clearCanvas();
    this.isSimulationLoaded = false;
    this.currentStep = 0;
    this.selectedNormType = 'en50160';
    this.customMinPu = 0.90;
    this.customMaxPu = 1.10;
    this.deleteConfirmStep = false;

    this.cdr.markForCheck();
  }

  public onDeleteClicked() {
    if (this.selectedProjectId === null) return;

    if (!this.deleteConfirmStep) {
      this.deleteConfirmStep = true;
      this.cdr.markForCheck();
      return;
    }

    this.deleteConfirmStep = false;
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

  public onModalSave(result: { name: string; description: string }) {
    this.modalError = '';
    const payload = this.getSavePayload(result.name, result.description);
      this.projectService.createProject(payload).subscribe({
        next: (saved) => {
          this.showProjectModal = false;
          this.clearScratchpad();
          this.toast.success('Project created successfully!');
        this.selectedProjectId = saved.id || null;
        this.loadProjectsList();

        if (saved.id) {
          this.onProjectSelected(saved.id);
        }
      },
      error: (err) => {
        if (err.status === 409) {
          this.modalError = getErrorMessage(err);
          this.cdr.markForCheck();
        } else {
          this.toast.error('Failed to create project: ' + getErrorMessage(err));
        }
      }
    });
  }
}
