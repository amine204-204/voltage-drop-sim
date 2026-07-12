import { Component, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef, HostListener, Input } from '@angular/core';
import cytoscape, { Core, EventObject, NodeSingular } from 'cytoscape';
import { PropertyPanel } from '../property-panel/property-panel';
import { VoltageChartModal } from '../voltage-chart-modal/voltage-chart-modal';
import { NgIf } from '@angular/common';
import { LoadProfileEditor } from '../load-profile-editor/load-profile-editor';
import { SplinePoint } from '../load-profile-editor/load-profile-editor';

@Component({
  selector: 'app-grid-canvas',
  standalone: true,
  imports: [PropertyPanel, VoltageChartModal, LoadProfileEditor, NgIf],
  templateUrl: './grid-canvas.html',
  styleUrl: './grid-canvas.scss'
})
export class GridCanvas implements AfterViewInit {

  @ViewChild('cyContainer', { static: true }) cyContainer!: ElementRef;
  private cy: Core | undefined;
  
  public currentTool: string = 'pointer'; 
  private edgeSourceNode: NodeSingular | null = null; 
  private nodeCounter: number = 0;

  public selectedElementData: any = null;
  public selectedElementType: string = '';

  private isSpacePressed: boolean = false;

  public currentSimulationStep: number = 0;
  public currentDeltaTimeSeconds: number = 1.0;
  private simulationResult: any = null; 

  public showChartModal: boolean = false;
  public chartNominalVoltage: number = 230;
  @Input() maxSimulationSteps: number = 10; 
  public showProfileEditor: boolean = false;

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
        {
          selector: 'node[type="SOURCE"]',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#e74c3c',
            'color': '#fff',
            'width': 50,
            'height': 50,
            'shape': 'rectangle',
            'font-size': '10px'
          }
        },
        {
          selector: 'node[type="CONSUMER"]',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#3498db',
            'color': '#fff',
            'width': 40,
            'height': 40,
            'font-size': '10px'
          }
        },
        {
          selector: 'node[type="JUNCTION"]',
          style: {
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'background-color': '#95a5a6',
            'color': '#fff',
            'width': 30,
            'height': 30,
            'shape': 'diamond',
            'font-size': '9px'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 4,
            'line-color': '#7f8c8d',
            'target-arrow-color': '#7f8c8d',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        },
        {
        selector: 'node:selected',
        style: {
          'border-width': 3,
          'border-color': '#2c3e50',
          'background-blacken': 0.2
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#34495e',
          'target-arrow-color': '#34495e',
          'width': 6
        }
      }
      ],
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
    this.selectedElementData[event.property] = event.value;
    const cyElement = this.cy.$(':selected').first();
    if (cyElement && cyElement.id() === this.selectedElementData.id) {
      cyElement.data(event.property, event.value);
    }
  }

  private placeNode(position: { x: number, y: number }, type: string) {
    this.nodeCounter++;
    let label = '';
    if (type === 'SOURCE') label = `Sub ${this.nodeCounter}`;
    if (type === 'CONSUMER') label = `Load ${this.nodeCounter}`;
    if (type === 'JUNCTION') label = `Bus ${this.nodeCounter}`;

    this.cy?.add({
      data: { id: `node_${this.nodeCounter}`, label: label, type: type },
      position: { x: position.x, y: position.y }
    });
  }

  private drawEdge(source: NodeSingular, target: NodeSingular) {
    this.cy?.add({
      data: { 
        id: `edge_${source.id()}_${target.id()}`, 
        source: source.id(), 
        target: target.id() 
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
    this.currentDeltaTimeSeconds = deltaTimeSeconds;

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
            'line-color': '#e74c3c',
            'target-arrow-color': '#e74c3c',
            'width': 6
          });
        } else {
          edge.style({
            'line-color': '#27ae60',
            'target-arrow-color': '#27ae60',
            'width': 4
          });
        }
      }
    });
    this.updateSelectionState();
  }

  public onProfileSaved(result: { profile: number[]; controlPoints: SplinePoint[] }) {
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
}