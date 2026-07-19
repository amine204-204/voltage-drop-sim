import { Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import cytoscape, { Core, EventObject, NodeSingular } from 'cytoscape';
import { PropertyPanel } from '../property-panel/property-panel';
import { VoltageChartModal } from '../voltage-chart-modal/voltage-chart-modal';
import { NgIf } from '@angular/common';
import { LoadProfileEditor } from '../load-profile-editor/load-profile-editor';
import { ControlPoint } from '../load-profile-editor/load-profile-editor';
import { LOAD_PRESETS } from '../../mocks/load-preset.mock';
import { MOCK_CABLES } from '../../mocks/equipement-catalog.mock';
import { CableCatalog } from '../../models/catalog.model';
import { LoadPreset } from '../../models/load-preset.model';

@Component({
  selector: 'app-grid-canvas',
  standalone: true,
  imports: [PropertyPanel, VoltageChartModal, LoadProfileEditor, NgIf],
  templateUrl: './grid-canvas.html',
  styleUrl: './grid-canvas.scss'
})
export class GridCanvas implements AfterViewInit {

  @ViewChild('cyContainer', { static: true }) cyContainer!: ElementRef;
  @Input() deltaTime: number = 2.0;
  @Input() maxSimulationSteps: number = 10; 
  @Input() cableCatalogItems: CableCatalog[] = MOCK_CABLES;
  @Input() loadPresets: LoadPreset[] = LOAD_PRESETS;

  private cy: Core | undefined;
  
  public currentTool: string = 'pointer'; 
  private edgeSourceNode: NodeSingular | null = null; 
  private nodeCounter: number = 0;

  public selectedElementData: any = null;
  public selectedElementType: string = '';

  private isSpacePressed: boolean = false;

  public currentSimulationStep: number = 0;
  private simulationResult: any = null; 

  public showChartModal: boolean = false;
  public chartNominalVoltage: number = 230;
  public showProfileEditor: boolean = false;

  public selectedPresetId: string = '';

  constructor(private cdr: ChangeDetectorRef) {}


  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private initCanvas() {
  this.cy = cytoscape({
    container: this.cyContainer.nativeElement,
    boxSelectionEnabled: true,
    userPanningEnabled: false,
    style: [
      // === NODES: SOURCE (Substation) ===
      {
        selector: 'node[type="SOURCE"]',
        style: {
          'label': 'data(label)',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 6,
          'color': '#8891A0', // var(--text-secondary)
          'font-size': '10px',
          'font-family': 'Inter, system-ui, sans-serif',
          'font-weight': 500,
          
          'shape': 'round-rectangle',
          'width': 44,
          'height': 44,
          'background-color': 'rgba(232, 97, 93, 0.14)', // var(--status-danger-bg)
          'background-opacity': 1,
          'border-width': 2,
          'border-color': '#E8615D', // var(--status-danger)
          'border-opacity': 0.8,
          
          'background-image': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23E8615D" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
          'background-width': '60%',
          'background-height': '60%',
          'background-position-x': '50%',
          'background-position-y': '50%',
          'background-fit': 'none',
          'background-clip': 'none',
        } as any
      },

      // === NODES: CONSUMER (Load) ===
      {
        selector: 'node[type="CONSUMER"]',
        style: {
          'label': 'data(label)',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 6,
          'color': '#8891A0',
          'font-size': '10px',
          'font-family': 'Inter, system-ui, sans-serif',
          'font-weight': 500,
          
          'shape': 'ellipse',
          'width': 36,
          'height': 36,
          'background-color': 'rgba(232, 163, 61, 0.14)', // var(--accent-dim)
          'background-opacity': 1,
          'border-width': 2,
          'border-color': '#E8A33D', // var(--accent)
          'border-opacity': 0.7,
          
          'background-image': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23E8A33D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
          'background-width': '55%',
          'background-height': '55%',
          'background-position-x': '50%',
          'background-position-y': '50%',
          'background-fit': 'none',
        } as any
      },

      // === NODES: JUNCTION (Busbar) ===
      {
        selector: 'node[type="JUNCTION"]',
        style: {
          'label': 'data(label)',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 6,
          'color': '#8891A0',
          'font-size': '9px',
          'font-family': 'Inter, system-ui, sans-serif',
          'font-weight': 500,
          
          'shape': 'diamond',
          'width': 28,
          'height': 28,
          'background-color': 'rgba(79, 184, 208, 0.12)',
          'background-opacity': 1,
          'border-width': 2,
          'border-color': '#4FB8D0', // var(--data-cyan)
          'border-opacity': 0.6,
          
          'background-image': 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234FB8D0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v7M12 15v7M2 12h7M15 12h7"/></svg>',
          'background-width': '55%',
          'background-height': '55%',
          'background-position-x': '50%',
          'background-position-y': '50%',
          'background-fit': 'none',
        } as any
      },

      // === EDGES: Default ===
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#2A323C', // var(--border-hairline)
          'line-opacity': 0.8,
          'curve-style': 'bezier',
          'control-point-step-size': 40,
          
          'target-arrow-shape': 'triangle',
          'target-arrow-color': '#2A323C',
          'target-arrow-width': 8,
          'arrow-scale': 0.8,
          
          'label': 'data(lengthLabel)',
          'font-size': '8px',
          'color': '#545C68', // var(--text-tertiary)
          'text-background-color': '#12161C', // var(--bg-canvas)
          'text-background-opacity': 0.9,
          'text-background-padding': '2px',
          'text-background-shape': 'roundrectangle',
        } as any
      },

      // === SELECTION ===
      {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#E8A33D', // var(--accent)
          'border-opacity': 1,
          'background-blacken': -0.1,
        } as any
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#E8A33D',
          'target-arrow-color': '#E8A33D',
          'width': 4,
          'line-opacity': 1,
        } as any
      },

      // === HOVER ===
      {
        selector: 'node:active',
        style: {
          'border-width': 3,
          'border-color': '#F4B75A', // var(--accent-strong)
          'border-opacity': 0.8,
        } as any
      },
      {
        selector: 'edge:active',
        style: {
          'line-color': 'rgba(232, 163, 61, 0.14)',
          'width': 4,
        } as any
      },

      // === SIMULATION STATES ===
      {
        selector: 'edge.sim-ok',
        style: {
          'line-color': '#3FBF7F', // var(--status-ok)
          'target-arrow-color': '#3FBF7F',
          'line-opacity': 0.9,
        } as any
      },
      {
        selector: 'edge.sim-violation',
        style: {
          'line-color': '#E8615D', // var(--status-danger)
          'target-arrow-color': '#E8615D',
          'width': 5,
          'line-opacity': 1,
        } as any
      },
    ] as any,
    elements: [],
    layout: { name: 'preset' }
  });

    this.cy.on('select unselect', () => {
      this.updateSelectionState();
    });

    this.cy.on('tap', (event: EventObject) => {
        this.handleCanvasTap(event);
        this.cdr.detectChanges();
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
      
      // const simData = el.data('simulationData');
      // console.log('Selected Element Simulation Data:', simData);
      // if (simData) {
      //   const step = this.currentSimulationStep;
      //   baseData.simVoltage = simData.potentialTimeSeries?.[step];
      //   console.log('Selected Element Simulation Voltage at step', step, ':', baseData.simVoltage);
      //   baseData.simCurrent = simData.currentTimeSeries?.[step];
      //   baseData.simDropPercent = simData.dropPercentTimeSeries?.[step];
      //   baseData.simStatus = simData.statusTimeSeries?.[step];
      //   baseData.simEvents = simData.powerQualityEvents;
      // }

      this.selectedElementData = baseData;  
      if (el.isNode()) {
        this.chartNominalVoltage = this.getNominalVoltageForNode(el.id());
      }
    } else {
      this.selectedElementData = null;
      this.selectedElementType = '';
    }
    this.cdr.detectChanges();
  }

  private handleCanvasTap(event: EventObject) {
    const target = event.target;

    if (target === this.cy) {
      if (this.currentTool.startsWith('place-')) {
        this.placeNode(event.position, this.currentTool.replace('place-', '').toUpperCase());
      } else if (this.currentTool === 'draw-cable') {
        this.edgeSourceNode?.style({ 'border-width': 0 });
        this.edgeSourceNode = null;
      }else if (this.currentTool === 'pointer') {
        this.cy?.elements().unselect();
      }
      return;
    }

    if (this.currentTool === 'draw-cable' && target.isNode()) {
      if (!this.edgeSourceNode) {
        this.edgeSourceNode = target as NodeSingular;
        target.style({ 'border-width': 3, 'border-color': '#f1c40f' });
      } else {
        const targetNode = target as NodeSingular;
        if (this.edgeSourceNode.id() !== targetNode.id()) {
          this.drawEdge(this.edgeSourceNode, targetNode);
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

   public onPropertyUpdated(event: {property: string, value: any}) {
    if (!this.selectedElementData || !this.cy) return;

    this.updateSelectedElementProperty(event.property, event.value);
    
    // if (event.property === 'selectedPresetId' && event.value) {
    //   const preset = LOAD_PRESETS.find(p => p.id === event.value);
    //   if (preset) {
    //     this.updateSelectedElementProperty('loadType', preset.loadType);
    //     this.updateSelectedElementProperty('cosPhi', preset.cosPhi);
    //     this.updateSelectedElementProperty('loadProfileControlPoints', [...preset.defaultProfile]);
    //     this.updateSelectedElementProperty('loadProfile', LoadProfileEditor.getProfileFromControlPoints(
    //       preset.defaultProfile, 
    //       this.maxSimulationSteps, 
    //       this.deltaTime, 
    //       Math.max(...preset.defaultProfile.map(p => p.value), 1)
    //     ));
    //   }
    // }

    if (event.property === 'lengthInKm') {
      this.updateSelectedElementProperty('lengthLabel', `${event.value} km`);
    }

    // if (event.property === 'catalogId' && event.value) {
    //   const catalogItem = MOCK_CABLES.find(item => item.id === event.value);
      
    //   if (catalogItem) {
    //     if (catalogItem['category'] === 'cable') {
    //       //this.updateSelectedElementProperty('componentCrossSection', catalogItem['physical']['crossSection']);
    //       this.updateSelectedElementProperty('componentCrossSection', '16mm2');
    //       this.updateSelectedElementProperty('componentMaterial', catalogItem['physical']['conductorMaterial']);
    //       // Lock the R/X fields (we don't want the user overriding IEEE/EN 50160 specs)
    //       this.updateSelectedElementProperty('resistancePerKm', catalogItem['electrical']['resistancePerKm']);
    //       this.updateSelectedElementProperty('reactancePerKm', catalogItem['electrical']['reactancePerKm']);
    //     } 
 
    //   }
    // }

    this.cdr.detectChanges();
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
  }

  private drawEdge(source: NodeSingular, target: NodeSingular) {
  if (!this.cy) return;
  
  const edgeId = `edge_${source.id()}_${target.id()}`;
  const reverseEdgeId = `edge_${target.id()}_${source.id()}`;
  
  if (this.cy.$('#' + edgeId).length > 0 || this.cy.$('#' + reverseEdgeId).length > 0) {
    return;
  }
  
  if (source.id() === target.id()) {
    return;
  }

  this.cy.add({
    data: { 
      id: edgeId,
      source: source.id(), 
      target: target.id(),
      lengthInKm: 0.1,
      lengthLabel: '0.1 km',
      catalogId: null,
      componentCrossSection: '16mm2',
      componentMaterial: 'CU'
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
      } else if (tool === 'draw-cable') {
        this.cyContainer.nativeElement.style.cursor = 'default';
      } else {
        this.cyContainer.nativeElement.style.cursor = 'default';
      }
    }
  }

  public getIslands(): any[] {
    if (!this.cy) throw new Error("Cytoscape not initialized");

    const allNodes = this.cy.nodes().map(node => {
      const data = node.data();
      return {
        id: data.id, name: data.label, type: data.type,
        nominalVoltage: data.nominalVoltage || null,
        loadType: data.loadType || null, loadProfile: data.loadProfile || null,
        cosPhi: data.cosPhi || null
      };
    });

    const allEdges = this.cy.edges().map(edge => {
      const data = edge.data();
      return {
        id: data.id, name: `Cable ${data.source}-${data.target}`,
        fromNodeId: data.source, toNodeId: data.target,
        lengthInKm: data.lengthInKm || 0.1,
        componentCrossSection: data.componentCrossSection || '16mm2',
        componentMaterial: data.componentMaterial || 'CU'
      };
    });

    const adjacency = new Map<string, string[]>();
    allNodes.forEach(n => adjacency.set(n.id, []));
    allEdges.forEach(e => {
      adjacency.get(e.fromNodeId)?.push(e.toNodeId);
      adjacency.get(e.toNodeId)?.push(e.fromNodeId);
    });

    const visited = new Set<string>();
    const islands = [];

    for (const node of allNodes) {
      if (visited.has(node.id)) continue;

      const islandNodeIds = new Set<string>();
      const stack = [node.id];

      while (stack.length > 0) {
        const currentId = stack.pop();
        if (islandNodeIds.has(currentId)) continue;
        islandNodeIds.add(currentId);
        visited.add(currentId);
        
        const neighbors = adjacency.get(currentId) || [];
        neighbors.forEach(neighborId => {
          if (!islandNodeIds.has(neighborId)) stack.push(neighborId);
        });
      }

      const islandNodes = allNodes.filter(n => islandNodeIds.has(n.id));
      const islandEdges = allEdges.filter(e => islandNodeIds.has(e.fromNodeId) && islandNodeIds.has(e.toNodeId));

      islands.push({ nodes: islandNodes, branches: islandEdges });
    }

    if (islands.length === 0 && allNodes.length === 0) {
      return []; 
    }

    return islands;
  }

  private getNominalVoltageForNode(nodeId: string): number {
    let currentId = nodeId;
    let safetyLimit = 50;

    while (safetyLimit-- > 0 && this.cy) {
      const node = this.cy.$('#' + currentId);
      if (!node.length) break;

      if (node.data('type') === 'SOURCE') {
        return node.data('nominalVoltage') || 230;
      }

      const incomingEdge = this.cy.edges(`[target = "${currentId}"]`).first();
      if (!incomingEdge.length) break;

      
      currentId = incomingEdge.source().id();
    }

    return 230;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardDelete(event: KeyboardEvent) {
    if (event.code === 'Space' && !this.isSpacePressed) {
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
        this.cdr.detectChanges();
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

  public applySimulationResults(response: any, deltaTimeSeconds: number) {
    if (!this.cy) return;
    
    this.simulationResult = response;
    this.currentSimulationStep = 0;
    this.deltaTime = deltaTimeSeconds;

    response.branches.forEach((branch: any) => {
      const cyEdge = this.cy!.$('#' + branch.id);
      
      if (cyEdge.length > 0) {
        const initialStatus = branch.statusTimeSeries[0];
        
        if (initialStatus === 'VIOLATION') {
          cyEdge.style({
            'line-color': '#e74c3c',
            'target-arrow-color': '#e74c3c',
            'width': 6
          });
        } else {
          cyEdge.style({
            'line-color': '#27ae60',
            'target-arrow-color': '#27ae60',
            'width': 4
          });
        }

        cyEdge.data('simulationData', branch);
      }
    });

    response.nodes.forEach((node: any) => {
      const cyNode = this.cy!.$('#' + node.id);
      
      if (cyNode) {
        cyNode.data('simulationData', node);
      }
    });

    this.cy.elements().unselect();
    this.updateSelectionState();
  }

  public updateTimeStep(step: number) {
    if (!this.cy) return;
    this.currentSimulationStep = step;

    this.cy.edges().forEach(edge => {
      const simData = edge.data('simulationData');
      if (simData && simData.statusTimeSeries) {
        const status = simData.statusTimeSeries[step];
        
        if (status === 'VIOLATION') {
          edge.style({
            'line-color': '#E8615D',
            'target-arrow-color': '#E8615D',
            'width': 5,
            'line-opacity': 1,
          });
        } else {
          edge.style({
            'line-color': '#3FBF7F',
            'target-arrow-color': '#3FBF7F',
            'width': 3,
            'line-opacity': 0.9,
          });
        }
      }
    });
    this.updateSelectionState();
  }

  public onProfileSaved(result: { profile: number[]; controlPoints: ControlPoint[] }) {
    this.selectedElementData.loadProfile = result.profile;
    this.selectedElementData.loadProfileControlPoints = result.controlPoints;

    const cyElement = this.cy?.$('#' + this.selectedElementData.id);
    if (cyElement) {
      cyElement.data('loadProfile', result.profile);
      cyElement.data('loadProfileControlPoints', result.controlPoints);
    }
    
    this.showProfileEditor = false;
    this.cdr.detectChanges();
  }

  public clearCanvas() {
    if (!this.cy) return;
    this.cy.elements().remove();
    this.nodeCounter = 0;
    this.selectedElementData = null;
    this.selectedElementType = '';
    this.simulationResult = null;
    this.cdr.detectChanges();
  }

  public getProjectGraph(): { nodes: any[]; branches: any[] } {
    if (!this.cy) return { nodes: [], branches: [] };

    const nodes = this.cy.nodes().map(node => {
      const data = node.data();
      const pos = node.position();
      return {
        id: data.id,
        name: data.label,
        type: data.type,
        nominalVoltage: data.nominalVoltage || null,
        loadType: data.loadType || null,
        cosPhi: data.cosPhi || null,
        loadProfile: data.loadProfile || null,
        loadProfileControlPoints: data.loadProfileControlPoints || null,
        selectedPresetId: data.selectedPresetId || null,
        x: pos.x,
        y: pos.y
      };
    });

    const branches = this.cy.edges().map(edge => {
      const data = edge.data();
      return {
        id: data.id,
        name: data.name || `Cable ${data.source}-${data.target}`,
        fromNodeId: data.source,
        toNodeId: data.target,
        lengthInKm: data.lengthInKm || 0.1,
        catalogId: data.catalogId || null,
        componentCrossSection: data.componentCrossSection || '16mm2',
        componentMaterial: data.componentMaterial || 'CU'
      };
    });

    return { nodes, branches };
  }

  public loadProjectGraph(nodes: any[], branches: any[], simulationResult?: any, deltaTimeSeconds?: number) {
    if (!this.cy) return;
    this.clearCanvas();

    let maxNodeNum = 0;
    nodes.forEach(node => {
      const match = node.id.match(/node_(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNodeNum) maxNodeNum = num;
      }

      this.cy!.add({
        data: {
          id: node.id,
          label: node.name,
          type: node.type,
          nominalVoltage: node.nominalVoltage,
          loadType: node.loadType,
          cosPhi: node.cosPhi,
          loadProfile: node.loadProfile,
          loadProfileControlPoints: node.loadProfileControlPoints,
          selectedPresetId: node.selectedPresetId
        },
        position: { x: node.x, y: node.y }
      });
    });

    this.nodeCounter = maxNodeNum;

    branches.forEach(branch => {
      this.cy!.add({
        data: {
          id: branch.id,
          name: branch.name,
          source: branch.fromNodeId,
          target: branch.toNodeId,
          lengthInKm: branch.lengthInKm,
          lengthLabel: `${branch.lengthInKm} km`,
          catalogId: branch.catalogId,
          componentCrossSection: branch.componentCrossSection,
          componentMaterial: branch.componentMaterial
        }
      });
    });

    this.cy.fit(undefined, 50);

    if (simulationResult && deltaTimeSeconds !== undefined && simulationResult.nodesResults && simulationResult.branchesResults) {
      const mappedResponse = {
        nodes: simulationResult.nodesResults.map((nr: any) => ({
          id: nr.nodeId,
          potentialTimeSeries: nr.potentialTimeSeries
        })),
        branches: simulationResult.branchesResults.map((br: any) => ({
          id: br.branchId,
          currentTimeSeries: br.currentTimeSeries,
          dropPercentTimeSeries: br.dropPercentTimeSeries,
          statusTimeSeries: br.statusTimeSeries,
          powerQualityEvents: br.powerQualityEvents
        }))
      };
      
      this.applySimulationResults(mappedResponse, deltaTimeSeconds);
    } else {
      this.updateSelectionState();
    }
  }
}