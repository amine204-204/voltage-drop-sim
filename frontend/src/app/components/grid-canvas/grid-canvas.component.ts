import { Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, HostListener, Input, Output, EventEmitter, effect } from '@angular/core';
import cytoscape, { Core, EventObject, NodeSingular } from 'cytoscape';
import { PropertyPanel, CytoscapeElementData } from '../property-panel/property-panel.component';
import { VoltageChartModal } from '../voltage-chart-modal/voltage-chart-modal.component';
import { IconComponent } from '../shared/icon/icon.component';
import { NgIf } from '@angular/common';
import { LoadProfileEditor } from '../load-profile-editor/load-profile-editor.component';
import { ControlPoint } from '../load-profile-editor/load-profile-editor.component';
import { LOAD_PRESETS } from '../../mocks/load-preset.mock';
import { MOCK_CABLES, MOCK_TRANSFORMERS } from '../../mocks/equipment-catalog.mock';
import { CableCatalog, TransformerCatalog, SwitchCatalog } from '../../models/catalog.model';
import { LoadPreset } from '../../models/load-preset.model';
import { ThemeService } from '../../services/theme.service';
import { SimulationResponseDto } from '../../models/simulation.model';
import { ProjectNode, ProjectBranch, ProjectSimulationResult } from '../../models/project.model';
import { getCytoscapeStyles, syncCytoscapeTheme } from './services/cytoscape-style.service';
import { getIslands, getNominalVoltageForNode, Island } from './services/graph-traversal.service';
import { applySimulationResults as applySimResults, updateTimeStep as updateSimTimeStep } from './services/simulation-render.service';
import { getProjectGraph, loadProjectGraph as loadGraph, getSimulationSnapshot as getSnapshot, SimulationSnapshot, mapStoredResultToResponse } from './services/project-graph.service';

@Component({
  selector: 'app-grid-canvas',
  standalone: true,
  imports: [PropertyPanel, VoltageChartModal, LoadProfileEditor, IconComponent, NgIf],
  templateUrl: './grid-canvas.component.html',
  styleUrl: './grid-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridCanvas implements AfterViewInit {

  @ViewChild('cyContainer', { static: true }) cyContainer!: ElementRef;
  @Input() deltaTime: number = 2.0;
  @Input() maxSimulationSteps: number = 10;
  @Input() minLimitPu: number = 0.90;
  @Input() maxLimitPu: number = 1.10;
  @Input() cableCatalogItems: CableCatalog[] = MOCK_CABLES;
  @Input() transformerCatalogItems: TransformerCatalog[] = MOCK_TRANSFORMERS;
  @Input() switchCatalogItems: SwitchCatalog[] = [];
  @Input() loadPresets: LoadPreset[] = LOAD_PRESETS;

  private cy: Core | undefined;
  private initialized = false;

  public currentTool: string = 'pointer';
  private edgeSourceNode: NodeSingular | null = null;
  private nodeCounter: number = 0;

  public selectedElementData: CytoscapeElementData | null = null;
  public selectedElementType: string = '';

  public isSpacePressed: boolean = false;

  public currentSimulationStep: number = 0;
  private simulationResult: SimulationResponseDto | null = null;

  public showChartModal: boolean = false;
  public chartNominalVoltage: number = 230;
  public showProfileEditor: boolean = false;

  public selectedPresetId: string = '';

  public get isEmpty(): boolean {
    return this.cy ? this.cy.nodes().length === 0 : true;
  }

  public hasElements(): boolean {
    return this.cy ? this.cy.elements().length > 0 : false;
  }

  public get nodeCount(): number {
    return this.cy ? this.cy.nodes().length : 0;
  }

  public get edgeCount(): number {
    return this.cy ? this.cy.edges().length : 0;
  }

  public get currentToolLabel(): string {
    const labels: Record<string, string> = {
      'pointer': 'Select',
      'place-SOURCE': 'Place Substation',
      'place-JUNCTION': 'Place Busbar',
      'place-CONSUMER': 'Place Load',
      'draw-cable': 'Draw Cable',
      'draw-transformer': 'Draw Transformer',
      'draw-switch': 'Draw Switch'
    };
    return labels[this.currentTool] || this.currentTool;
  }

  public get zoomPercent(): number {
    return this.cy ? Math.round(this.cy.zoom() * 100) : 100;
  }

  constructor(private cdr: ChangeDetectorRef, private themeService: ThemeService) {
    effect(() => {
      this.themeService.mode();
      if (this.initialized && this.cy) {
        syncCytoscapeTheme(this.cy);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    this.initialized = true;
    if (this.cy) {
      syncCytoscapeTheme(this.cy);
    }
    requestAnimationFrame(() => this.cy?.resize());
  }

  private initCanvas() {
    this.cy = cytoscape({
      container: this.cyContainer.nativeElement,
      boxSelectionEnabled: true,
      userPanningEnabled: false,
      style: getCytoscapeStyles() as any,
      elements: [],
      layout: { name: 'preset' }
    });

    this.cy.on('select unselect', () => {
      this.updateSelectionState();
    });

    this.cy.on('tap', (event: EventObject) => {
      this.handleCanvasTap(event);
      this.cdr.markForCheck();
      this.cy?.resize();
    });

    this.cyContainer.nativeElement.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();

      const zoomFactor = 1.1;
      const currentZoom = this.cy!.zoom();

      if (e.deltaY < 0) {
        this.cy!.zoom({
          level: currentZoom * zoomFactor,
          renderedPosition: { x: e.offsetX, y: e.offsetY }
        });
      } else {
        this.cy!.zoom({
          level: currentZoom / zoomFactor,
          renderedPosition: { x: e.offsetX, y: e.offsetY }
        });
      }
      this.cdr.markForCheck();
    }, { passive: false });

    this.cy.on('dbltap', () => {
      this.cy!.fit(undefined, 50);
    });
  }

  private updateSelectionState() {
    if (!this.cy) return;
    const selectedElements = this.cy.$(':selected');

    if (selectedElements.length === 1) {
      const el = selectedElements.first();
      this.selectedElementType = el.isNode() ? 'node' : 'edge';

      const baseData = { ...el.data() };

      this.selectedElementData = baseData;
      if (el.isNode()) {
        this.chartNominalVoltage = getNominalVoltageForNode(this.cy, el.id(), this.transformerCatalogItems);
      }
    } else {
      this.selectedElementData = null;
      this.selectedElementType = '';
    }
    this.cdr.markForCheck();
  }

  private isDrawTool(tool: string): boolean {
    return tool === 'draw-cable' || tool === 'draw-transformer' || tool === 'draw-switch';
  }

  private getBranchTypeForTool(tool: string): string {
    if (tool === 'draw-transformer') return 'TRANSFORMER';
    if (tool === 'draw-switch') return 'SWITCH';
    return 'CABLE';
  }

  private handleCanvasTap(event: EventObject) {
    const target = event.target;

    if (target === this.cy) {
      if (this.currentTool.startsWith('place-')) {
        this.placeNode(event.position, this.currentTool.replace('place-', '').toUpperCase());
      } else if (this.isDrawTool(this.currentTool)) {
        this.edgeSourceNode?.style({ 'border-width': 0 });
        this.edgeSourceNode = null;
      } else if (this.currentTool === 'pointer') {
        this.cy?.elements().unselect();
      }
      return;
    }

    if (this.isDrawTool(this.currentTool) && target.isNode()) {
      if (!this.edgeSourceNode) {
        this.edgeSourceNode = target as NodeSingular;
        // hardcoded: CSS vars unsupported in Cytoscape SVG data URIs
        target.style({ 'border-width': 3, 'border-color': '#F4B75A' });
      } else {
        const targetNode = target as NodeSingular;
        if (this.edgeSourceNode.id() !== targetNode.id()) {
          this.drawEdge(this.edgeSourceNode, targetNode, this.getBranchTypeForTool(this.currentTool));
          this.edgeSourceNode.style({ 'border-width': 0 });
          this.edgeSourceNode = null;
        }
      }
      return;
    }

    if (this.currentTool === 'pointer') {
      if (target.isNode() || target.isEdge()) {
        const originalEvent = event.originalEvent as MouseEvent;
        if (!originalEvent.shiftKey && !originalEvent.ctrlKey && !originalEvent.metaKey) {
          this.cy?.elements().unselect();
        }
        (target as any).select();
      }
    }
  }

  public onPropertyUpdated(event: { property: string, value: any }) {
    if (!this.selectedElementData || !this.cy) return;

    this.updateSelectedElementProperty(event.property, event.value);

    if (event.property === 'lengthInKm') {
      this.updateSelectedElementProperty('lengthLabel', `${event.value} km`);
    }

    this.cdr.markForCheck();
  }

  private updateSelectedElementProperty(property: string, value: any) {
    if (!this.selectedElementData || !this.cy) return;

    this.selectedElementData[property] = value;
    const cyElement = this.cy.$(':selected').first();

    if (cyElement && cyElement.id() === this.selectedElementData.id) {
      cyElement.data(property, value);
    }
  }

  private placeNode(position: { x: number, y: number }, type: string) {
    this.nodeCounter++;
    let label = '';
    if (type === 'SOURCE') label = `Sub ${this.nodeCounter}`;
    if (type === 'CONSUMER') label = `Load ${this.nodeCounter}`;
    if (type === 'JUNCTION') label = `Bus ${this.nodeCounter}`;

    this.cy?.add({
      data: {
        id: `node_${this.nodeCounter}`,
        label: label,
        type: type,
        nominalVoltage: type === 'SOURCE' ? 230 : null,
        loadType: type === 'CONSUMER' ? 'CONSTANT_POWER' : null,
        cosPhi: type === 'CONSUMER' ? 0.95 : null,
        loadProfile: null,
        loadProfileControlPoints: null,
        selectedPresetId: null
      },
      position: { x: position.x, y: position.y }
    });

    const node = this.cy?.getElementById(`node_${this.nodeCounter}`);
    if (node && node.length) {
      node.style({ 'opacity': 0 });
      node.animate({
        style: { 'opacity': 1 },
        duration: 250,
        easing: 'ease-out'
      });
    }
  }

  private drawEdge(source: NodeSingular, target: NodeSingular, branchType: string = 'CABLE') {
    if (!this.cy) return;

    const edgeId = `edge_${source.id()}_${target.id()}`;
    const reverseEdgeId = `edge_${target.id()}_${source.id()}`;

    if (this.cy.$('#' + edgeId).length > 0 || this.cy.$('#' + reverseEdgeId).length > 0) {
      return;
    }

    if (source.id() === target.id()) {
      return;
    }

    const defaults: Record<string, any> = {
      'CABLE': {
        lengthInKm: 0.1,
        lengthLabel: '0.1 km',
        componentCrossSection: '16mm2',
        componentMaterial: 'CU',
        catalogId: null
      },
      'TRANSFORMER': {
        lengthInKm: 0,
        lengthLabel: '',
        catalogId: null,
        componentCrossSection: '',
        componentMaterial: ''
      },
      'SWITCH': {
        lengthInKm: 0,
        lengthLabel: 'Closed',
        closed: true,
        componentCrossSection: '',
        componentMaterial: '',
        catalogId: null
      }
    };

    const data = defaults[branchType] || defaults['CABLE'];

    this.cy.add({
      data: {
        id: edgeId,
        source: source.id(),
        target: target.id(),
        branchType,
        ...data
      }
    });
  }

  public selectTool(tool: string) {
    this.currentTool = tool;
    if (this.edgeSourceNode) {
      this.edgeSourceNode.style({ 'border-width': 0 });
      this.edgeSourceNode = null;
    }

    if (this.cy) {
      if (tool.startsWith('place-')) {
        this.cyContainer.nativeElement.style.cursor = 'crosshair';
      } else if (this.isDrawTool(tool)) {
        this.cyContainer.nativeElement.style.cursor = 'default';
      } else {
        this.cyContainer.nativeElement.style.cursor = 'default';
      }
    }
  }

  public zoomIn() {
    if (!this.cy) return;
    this.cy.zoom({ level: this.cy.zoom() * 1.25, renderedPosition: this.cy.pan() });
    this.cdr.markForCheck();
  }

  public zoomOut() {
    if (!this.cy) return;
    this.cy.zoom({ level: this.cy.zoom() / 1.25, renderedPosition: this.cy.pan() });
    this.cdr.markForCheck();
  }

  public fitToScreen() {
    if (!this.cy) return;
    this.cy.fit(undefined, 50);
    this.cdr.markForCheck();
  }

  public getIslands(): Island[] {
    if (!this.cy) throw new Error("Cytoscape not initialized");
    return getIslands(this.cy);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space' && !this.isSpacePressed) {
      const tagName = (event.target as HTMLElement).tagName;
      if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') {
        return;
      }
      this.isSpacePressed = true;
      if (this.cy) {
        this.cy.userPanningEnabled(true);
        this.cyContainer.nativeElement.style.cursor = 'grab';
      }
      event.preventDefault();
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const tagName = (event.target as HTMLElement).tagName;
      if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') {
        return;
      }

      if (this.cy?.$(':selected').length) {
        event.preventDefault();
        this.cy.$(':selected').remove();
        this.selectedElementData = null;
        this.selectedElementType = '';
        this.cdr.markForCheck();
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.isSpacePressed = false;
      if (this.cy) {
        this.cy.userPanningEnabled(false);
        this.selectTool(this.currentTool);
      }
    }
  }

  public applySimulationResults(response: SimulationResponseDto, deltaTimeSeconds: number) {
    if (!this.cy) return;

    applySimResults(this.cy, response);

    this.simulationResult = response;
    this.currentSimulationStep = 0;
    this.deltaTime = deltaTimeSeconds;

    this.cy.elements().unselect();
    this.updateSelectionState();
  }

  public updateTimeStep(step: number) {
    if (!this.cy) return;
    this.currentSimulationStep = step;

    updateSimTimeStep(this.cy, step);
    this.updateSelectionState();
  }

  public onProfileSaved(result: { profile: number[]; controlPoints: ControlPoint[] }) {
    if (!this.selectedElementData) return;

    this.selectedElementData.loadProfile = result.profile;
    this.selectedElementData.loadProfileControlPoints = result.controlPoints;

    const cyElement = this.cy?.$('#' + this.selectedElementData.id);
    if (cyElement) {
      cyElement.data('loadProfile', result.profile);
      cyElement.data('loadProfileControlPoints', result.controlPoints);
    }

    this.showProfileEditor = false;
    this.cdr.markForCheck();
  }

  public clearCanvas() {
    if (!this.cy) return;
    this.cy.elements().remove();
    this.nodeCounter = 0;
    this.selectedElementData = null;
    this.selectedElementType = '';
    this.simulationResult = null;
    this.cdr.markForCheck();
  }

  public getProjectGraph(): { nodes: ProjectNode[]; branches: ProjectBranch[] } {
    if (!this.cy) return { nodes: [], branches: [] };
    return getProjectGraph(this.cy);
  }

  public loadProjectGraph(nodes: ProjectNode[], branches: ProjectBranch[], simulationResult?: ProjectSimulationResult, deltaTimeSeconds?: number) {
    if (!this.cy) return;
    this.clearCanvas();

    loadGraph(this.cy, nodes, branches);

    let maxNodeNum = 0;
    nodes.forEach(node => {
      const match = node.id.match(/node_(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNodeNum) maxNodeNum = num;
      }
    });
    this.nodeCounter = maxNodeNum;

    if (simulationResult && deltaTimeSeconds !== undefined && simulationResult.nodesResults && simulationResult.branchesResults) {
      const mappedResponse = mapStoredResultToResponse(simulationResult);
      this.applySimulationResults(mappedResponse, deltaTimeSeconds);
    } else {
      this.updateSelectionState();
    }
  }

  public appendGraph(nodes: ProjectNode[], branches: ProjectBranch[]): { nodesAdded: number; branchesAdded: number } {
    if (!this.cy) return { nodesAdded: 0, branchesAdded: 0 };

    const existingIds = new Set<string>();
    this.cy.nodes().forEach(n => { existingIds.add(n.id()); });
    this.cy.edges().forEach(e => { existingIds.add(e.id()); });

    const idMap = new Map<string, string>();
    const remappedNodes: ProjectNode[] = [];
    const remappedBranches: ProjectBranch[] = [];

    let maxX = 0;
    this.cy.nodes().forEach(n => { const p = n.position(); if (p.x > maxX) maxX = p.x; });
    const offsetX = maxX + 250;

    for (const node of nodes) {
      if (existingIds.has(node.id)) {
        this.nodeCounter++;
        const newId = `node_${this.nodeCounter}`;
        idMap.set(node.id, newId);
        remappedNodes.push({ ...node, id: newId, x: node.x + offsetX, y: node.y });
      } else {
        remappedNodes.push({ ...node, x: node.x + offsetX, y: node.y });
      }
    }

    for (const branch of branches) {
      let newId = branch.id;
      let newFrom = branch.fromNodeId;
      let newTo = branch.toNodeId;
      if (idMap.has(branch.fromNodeId)) newFrom = idMap.get(branch.fromNodeId)!;
      if (idMap.has(branch.toNodeId)) newTo = idMap.get(branch.toNodeId)!;
      const candidateId = `edge_${newFrom}_${newTo}`;
      if (existingIds.has(candidateId) || candidateId !== branch.id) {
        newId = candidateId;
      }
      remappedBranches.push({ ...branch, id: newId, fromNodeId: newFrom, toNodeId: newTo });
    }

    loadGraph(this.cy, remappedNodes, remappedBranches);
    this.updateSelectionState();
    return { nodesAdded: remappedNodes.length, branchesAdded: remappedBranches.length };
  }

  public getSimulationSnapshot(): SimulationSnapshot | null {
    if (!this.cy) return null;
    return getSnapshot(this.cy);
  }
}
