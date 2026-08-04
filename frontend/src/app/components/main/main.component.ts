import { Component, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { GridCanvas } from '../grid-canvas/grid-canvas.component';
import { SimulationTopBar, SimulationSettings, MIN_DELTA_TIME_SECONDS, MAX_DELTA_TIME_SECONDS } from '../simulation-top-bar/simulation-top-bar.component';
import { SimulationService } from '../../services/simulation.service';
import { MockSimulationService } from '../../mocks/mock-simulation.service';
import { SimulationRequestDto, SimulationResponseDto } from '../../models/simulation.model';
import { forkJoin, Observable, Subscription } from 'rxjs';
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
import { NormService } from '../../services/norm.service';
import { ComplianceStandard } from '../../models/compliance-standard.model';
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
  public durationSeconds: number = 3600;
  public deltaTime: number = 360;
  public minDeltaTimeSeconds: number = MIN_DELTA_TIME_SECONDS;
  public maxDeltaTimeSeconds: number = MAX_DELTA_TIME_SECONDS;
  public currentStep: number = 0;
  public isSimulationLoaded: boolean = false;
  public simulationDeltaTimeSeconds: number | null = null;
  public simulationTotalTimeSeconds: number | null = null;
  public isPlaying: boolean = false;
  public isRepeat: boolean = false;
  public playbackSpeed: number = 1;
  private playbackTimer: number | undefined;
  private simulationSubscription: Subscription | null = null;
  public selectedNormType: string = 'en50160';
  public customMinPu: number = 0.90;
  public customMaxPu: number = 1.10;
  public runMinLimitPu: number = 0.90;
  public runMaxLimitPu: number = 1.10;

  public cableCatalog: CableCatalog[] = [];
  public transformerCatalog: TransformerCatalog[] = [];
  public switchCatalog: SwitchCatalog[] = [];
  public loadPresets: LoadPreset[] = [];
  private standards: ComplianceStandard[] = [];

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
    private normService: NormService,
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
    this.pausePlayback();
    this.simulationSubscription?.unsubscribe();
    this.saveScratchpad();
  }


  ngOnInit() {
    this.loadProjectsList();
    this.loadStandards();

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

  public get effectiveMinPu(): number {
    if (this.selectedNormType === 'custom') return this.customMinPu;
    const standard = this.standards.find(s => s.name.toLowerCase() === this.selectedNormType.toLowerCase());
    return standard ? standard.minVoltagePu : 0.90;
  }

  public get effectiveMaxPu(): number {
    if (this.selectedNormType === 'custom') return this.customMaxPu;
    const standard = this.standards.find(s => s.name.toLowerCase() === this.selectedNormType.toLowerCase());
    return standard ? standard.maxVoltagePu : 1.10;
  }

  private loadStandards() {
    this.normService.getActiveStandards().subscribe({
      next: (list) => {
        this.standards = list;
        this.resolveSelectedNorm();
        this.cdr.markForCheck();
      },
      error: () => {
        this.standards = [];
      }
    });
  }

  private resolveSelectedNorm() {
    if (this.selectedNormType === 'custom' || this.standards.length === 0) return;
    const matches = this.standards.some(s => s.name.toLowerCase() === this.selectedNormType.toLowerCase());
    if (!matches) {
      const def = this.standards.find(s => s.defaultStandard) || this.standards[0];
      this.selectedNormType = def.name;
    }
  }

  public onRunClicked(settings: SimulationSettings) {
    this.pausePlayback();
    if (!this.isDeltaTimeWithinRange()) {
      this.toast.error(`Invalid simulation settings: Δt must be between ${this.minDeltaTimeSeconds} s and ${this.maxDeltaTimeSeconds} s.`);
      this.cdr.markForCheck();
      return;
    }
    this.isSimulating = true;
    this.cdr.markForCheck();

    try {
      this.gridCanvas.resampleLoadProfiles(settings.totalTimeSteps + 1, settings.deltaTimeSeconds);
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
          totalTimeSteps: settings.totalTimeSteps + 1,
          deltaTimeSeconds: settings.deltaTimeSeconds,
          selectedNormType: this.selectedNormType,
          customMinPu: this.selectedNormType === 'custom' ? this.customMinPu : undefined,
          customMaxPu: this.selectedNormType === 'custom' ? this.customMaxPu : undefined,
          graph: island
        };
        return this.simService.runSimulation(payload);
      });

      this.simulationSubscription = forkJoin(payloads).subscribe({
        next: (responses: SimulationResponseDto[]) => {
          this.simulationSubscription = null;
          const mergedResponse = {
            nodes: responses.flatMap(r => r.nodes),
            branches: responses.flatMap(r => r.branches)
          };

          this.gridCanvas.applySimulationResults(mergedResponse, settings.deltaTimeSeconds);

          this.runMinLimitPu = this.effectiveMinPu;
          this.runMaxLimitPu = this.effectiveMaxPu;
          this.maxSimulationSteps = settings.totalTimeSteps;
          this.currentStep = 0;
          this.isSimulationLoaded = true;
          this.isSimulating = false;
          this.simulationDeltaTimeSeconds = settings.deltaTimeSeconds;
          this.simulationTotalTimeSeconds = settings.totalTimeSteps * settings.deltaTimeSeconds;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.simulationSubscription = null;
          this.isSimulating = false;
          this.toast.error('Simulation failed: ' + getErrorMessage(err));
          this.cdr.markForCheck();
        }
      });

    } catch (e: unknown) {
      this.simulationSubscription = null;
      this.isSimulating = false;
      this.toast.error(e instanceof Error ? e.message : 'Unknown error');
      this.cdr.markForCheck();
    }
  }

  public onCancelClicked() {
    this.simulationSubscription?.unsubscribe();
    this.simulationSubscription = null;
    this.isSimulating = false;
    this.cdr.markForCheck();
    this.toast.info('Simulation canceled.');
  }

  public onBackToEditClicked() {
    this.invalidateSimulation();
  }

  public onDurationChanged(durationSeconds: number) {
    if (this.isSimulationLoaded) this.invalidateSimulation();
    this.durationSeconds = durationSeconds;
    this.recomputeDeltaTime();
  }

  public onCurrentStepChanged(step: number) {
    this.pausePlayback();
    this.currentStep = step;
    this.gridCanvas.updateTimeStep(step);
  }

  public onPlayPauseClicked() {
    if (this.isPlaying) {
      this.pausePlayback();
      return;
    }
    if (!this.isSimulationLoaded || this.isSimulating) return;

    if (this.currentStep >= this.lastStep()) {
      this.setStep(0);
    }
    this.isPlaying = true;
    this.restartPlaybackTimer();
    this.cdr.markForCheck();
  }

  public onStepBackClicked() {
    this.pausePlayback();
    this.setStep(this.currentStep - 1);
  }

  public onStepForwardClicked() {
    this.pausePlayback();
    this.setStep(this.currentStep + 1);
  }

  public onToStartClicked() {
    this.pausePlayback();
    this.setStep(0);
  }

  public onToEndClicked() {
    this.pausePlayback();
    this.setStep(this.lastStep());
  }

  public onRepeatToggled() {
    this.isRepeat = !this.isRepeat;
    this.cdr.markForCheck();
  }

  public onPlaybackSpeedChanged(speed: number) {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      this.restartPlaybackTimer();
    }
  }

  private restartPlaybackTimer() {
    if (this.playbackTimer !== undefined) {
      window.clearInterval(this.playbackTimer);
    }
    this.playbackTimer = window.setInterval(() => this.tickPlayback(), this.playbackDelayMs());
  }

  /* x1 = real time: each simulation step lasts deltaTimeSeconds of wall-clock time. */
  private playbackDelayMs(): number {
    return (this.deltaTime / this.playbackSpeed) * 1000;
  }

  private tickPlayback() {
    const next = this.currentStep + 1;
    if (next > this.lastStep()) {
      if (this.isRepeat) {
        this.setStep(0);
        return;
      }
      this.setStep(this.lastStep());
      this.pausePlayback();
      return;
    }
    this.setStep(next);
  }

  private pausePlayback() {
    if (this.playbackTimer !== undefined) {
      window.clearInterval(this.playbackTimer);
      this.playbackTimer = undefined;
    }
    if (this.isPlaying) {
      this.isPlaying = false;
      this.cdr.markForCheck();
    }
  }

  private setStep(step: number) {
    const last = Math.max(0, this.lastStep());
    this.currentStep = Math.min(Math.max(step, 0), last);
    this.gridCanvas.updateTimeStep(this.currentStep);
    this.cdr.markForCheck();
  }

  private lastStep(): number {
    return this.maxSimulationSteps;
  }

  public onMaxStepsChanged(maxSteps: number) {
    if (this.isSimulationLoaded) this.invalidateSimulation();
    this.maxSimulationSteps = maxSteps;
    this.recomputeDeltaTime();
  }

  private invalidateSimulation() {
    this.pausePlayback();
    this.isSimulationLoaded = false;
    this.currentStep = 0;
    this.simulationDeltaTimeSeconds = null;
    this.simulationTotalTimeSeconds = null;
    this.gridCanvas?.clearSimulationResults();
    this.cdr.markForCheck();
  }

  private recomputeDeltaTime() {
    this.deltaTime = this.maxSimulationSteps > 0
      ? Math.round((this.durationSeconds / this.maxSimulationSteps) * 100) / 100
      : 0;
    this.gridCanvas.resampleLoadProfiles(this.maxSimulationSteps + 1, this.deltaTime);
    if (this.currentStep > this.lastStep()) {
      this.setStep(this.lastStep());
    }
    if (this.isPlaying) {
      this.restartPlaybackTimer();
    }
  }

  private isDeltaTimeWithinRange(): boolean {
    return this.deltaTime >= this.minDeltaTimeSeconds && this.deltaTime <= this.maxDeltaTimeSeconds;
  }

  private getSavePayload(name: string, description: string): Project {
    const canvasGraph = this.gridCanvas.getProjectGraph();

    let simulationResult: ProjectSimulationResult | undefined = undefined;
    if (this.isSimulationLoaded) {
      const snapshot = this.gridCanvas.getSimulationSnapshot();
      simulationResult = snapshot ? { ...snapshot, minLimitPu: this.runMinLimitPu, maxLimitPu: this.runMaxLimitPu } : undefined;
    }

    return {
      name,
      description,
      totalTimeSteps: this.maxSimulationSteps,
      deltaTimeSeconds: this.deltaTime,
      selectedNormType: this.selectedNormType,
      customMinPu: this.selectedNormType === 'custom' ? this.customMinPu : undefined,
      customMaxPu: this.selectedNormType === 'custom' ? this.customMaxPu : undefined,
      minDeltaTimeSeconds: this.minDeltaTimeSeconds,
      maxDeltaTimeSeconds: this.maxDeltaTimeSeconds,
      nodes: canvasGraph.nodes,
      branches: canvasGraph.branches,
      simulationResult
    };
  }

  public onProjectSelected(id: number | null) {
    if (id === null) {
      this.pausePlayback();
      this.selectedProjectId = null;
      sessionStorage.removeItem('currentProjectId');
      this.gridCanvas.clearCanvas();
      this.isSimulationLoaded = false;
      this.currentStep = 0;
      this.simulationDeltaTimeSeconds = null;
      this.simulationTotalTimeSeconds = null;
      this.deleteConfirmStep = false;
      this.runMinLimitPu = 0.90;
      this.runMaxLimitPu = 1.10;
      this.minDeltaTimeSeconds = MIN_DELTA_TIME_SECONDS;
      this.maxDeltaTimeSeconds = MAX_DELTA_TIME_SECONDS;
      this.cdr.markForCheck();
      return;
    }

    sessionStorage.setItem('currentProjectId', String(id));
    this.pausePlayback();
    this.projectService.getProject(id).subscribe({
      next: (project) => {
        this.selectedProjectId = project.id || null;
        this.maxSimulationSteps = project.totalTimeSteps;
        this.deltaTime = project.deltaTimeSeconds;
        this.durationSeconds = project.deltaTimeSeconds * project.totalTimeSteps;
        this.currentStep = 0;
        this.simulationDeltaTimeSeconds = project.deltaTimeSeconds;
        this.simulationTotalTimeSeconds = project.deltaTimeSeconds * project.totalTimeSteps;
        this.selectedNormType = project.selectedNormType;
        if (project.selectedNormType === 'custom') {
          this.customMinPu = project.customMinPu || 0.90;
          this.customMaxPu = project.customMaxPu || 1.10;
        }
        this.minDeltaTimeSeconds = project.minDeltaTimeSeconds ?? MIN_DELTA_TIME_SECONDS;
        this.maxDeltaTimeSeconds = project.maxDeltaTimeSeconds ?? MAX_DELTA_TIME_SECONDS;
        this.runMinLimitPu = project.simulationResult?.minLimitPu ?? this.effectiveMinPu;
        this.runMaxLimitPu = project.simulationResult?.maxLimitPu ?? this.effectiveMaxPu;

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
      branches: canvasGraph.branches.map(b => {
        const isCable = !b.branchType || b.branchType === 'CABLE';
        return {
          id: b.id,
          name: b.name,
          fromNodeId: b.fromNodeId,
          toNodeId: b.toNodeId,
          ...(isCable ? { lengthInKm: b.lengthInKm } : {}),
          branchType: b.branchType,
          catalogId: b.catalogId,
          closed: b.closed
        };
      })
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
      const isCable = !b.branchType || b.branchType === 'CABLE';
      const resolved: ProjectBranch = {
        id: b.id,
        name: b.name,
        fromNodeId: b.fromNodeId,
        toNodeId: b.toNodeId,
        branchType: b.branchType,
        catalogId: b.catalogId,
        componentCrossSection: '',
        componentMaterial: '',
        closed: b.closed
      };
      if (isCable) {
        resolved.lengthInKm = b.lengthInKm;
      }
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
    this.minDeltaTimeSeconds = settings.minDeltaTimeSeconds;
    this.maxDeltaTimeSeconds = settings.maxDeltaTimeSeconds;
    this.loadStandards();

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
    this.pausePlayback();
    this.selectedProjectId = null;
    sessionStorage.removeItem('currentProjectId');
    this.clearScratchpad();
    this.gridCanvas.clearCanvas();
    this.isSimulationLoaded = false;
    this.currentStep = 0;
    this.selectedNormType = 'en50160';
    this.customMinPu = 0.90;
    this.customMaxPu = 1.10;
    this.runMinLimitPu = 0.90;
    this.runMaxLimitPu = 1.10;
    this.deleteConfirmStep = false;
    this.minDeltaTimeSeconds = MIN_DELTA_TIME_SECONDS;
    this.maxDeltaTimeSeconds = MAX_DELTA_TIME_SECONDS;
    this.resolveSelectedNorm();

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
