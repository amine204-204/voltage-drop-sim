import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOAD_PRESETS } from '../../mocks/load-preset.mock';
import { MOCK_CABLES, MOCK_TRANSFORMERS } from '../../mocks/equipment-catalog.mock';
import { CableCatalog, TransformerCatalog, SwitchCatalog } from '../../models/catalog.model';
import { LoadPreset } from '../../models/load-preset.model';
import { LoadProfileEditor } from '../load-profile-editor/load-profile-editor.component';
import { NumPipe } from '../../shared/pipes/format-number.pipe';
import { formatDropPercent } from '../../shared/utils/format.utils';
import { NodeType, LoadType, BranchType } from '../../models/simulation.model';

export interface CytoscapeElementData {
  id: string;
  label: string;
  type: NodeType;
  branchType?: BranchType;
  nominalVoltage?: number;
  loadType?: LoadType;
  cosPhi?: number;
  loadProfile?: number[];
  loadProfileControlPoints?: any[];
  selectedPresetId?: string;
  lengthInKm?: number;
  lengthLabel?: string;
  catalogId?: string;
  componentCrossSection?: string;
  componentMaterial?: string;
  closed?: boolean;
  simulationData?: any;
  /* Resolved by the grid canvas for edges: status of the target (downstream) node at the current step. */
  simStatus?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NumPipe],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.scss'
})
export class PropertyPanel {
  @Input() elementData: CytoscapeElementData | null = null;
  @Input() elementType: string = '';
  @Input() simulationStep: number = 0;
  @Input() maxSimulationSteps: number = 10;
  @Input() deltaTime: number = 1;
  @Input() cableCatalogItems: CableCatalog[] = MOCK_CABLES;
  @Input() transformerCatalogItems: TransformerCatalog[] = MOCK_TRANSFORMERS;
  @Input() switchCatalogItems: SwitchCatalog[] = [];
  @Input() loadPresets: LoadPreset[] = LOAD_PRESETS;
  @Input() readOnly: boolean = false;

  @Output() propertyChanged = new EventEmitter<{property: string, value: any}>();
  @Output() openChart = new EventEmitter<void>();
  @Output() openProfileEditor = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) {}

  public formatDrop(value: number | null | undefined): string {
    return formatDropPercent(value);
  }

  /* Compliance lives on the node. For edges, the status shown is resolved from the target node
     (injected as `simStatus` by the grid canvas) — a branch never owns a status itself. */
  get statusAtStep(): string {
    const sim = this.elementData?.simulationData;
    if (this.elementType === 'node') {
      return sim?.statusTimeSeries?.[this.simulationStep] ?? 'N/A';
    }
    return this.elementData?.simStatus ?? 'N/A';
  }

  /* Only consumers carry a verdict; junctions/source never show a compliance badge. */
  get showStatusBadge(): boolean {
    if (this.elementType === 'node') {
      return this.elementData?.type === 'CONSUMER';
    }
    return true;
  }


  get displayProfile(): string {
    if (this.elementData?.loadProfile && Array.isArray(this.elementData.loadProfile)) {
      return this.elementData.loadProfile.join(', ');
    }
    return '';
  }

  get filteredLoadPresets(){
    if(this.elementData?.type !== 'CONSUMER') return [];
    return this.loadPresets.filter(p => p.loadType === this.elementData!.loadType);
  }

  get isCable(): boolean {
    return this.elementData?.branchType === 'CABLE' || !this.elementData?.branchType;
  }

  get isTransformer(): boolean {
    return this.elementData?.branchType === 'TRANSFORMER';
  }

  get isSwitch(): boolean {
    return this.elementData?.branchType === 'SWITCH';
  }

  get selectedTransformer(): TransformerCatalog | undefined {
    if (!this.elementData?.catalogId) return undefined;
    return this.transformerCatalogItems.find(t => t.id === this.elementData!.catalogId);
  }

  get selectedSwitch(): SwitchCatalog | undefined {
    if (!this.elementData?.catalogId) return undefined;
    return this.switchCatalogItems.find(s => s.id === this.elementData!.catalogId);
  }

  onPropertyChange(property: string, value: string | number | boolean) {
    if (property === 'loadProfile' && typeof value === 'string') {
      const numberArray = value.split(',')
        .map(num => parseFloat(num.trim()))
        .filter(n => !isNaN(n));
      this.propertyChanged.emit({ property, value: numberArray as any });
    } else {
      this.propertyChanged.emit({ property, value });
    }
  }

  onCatalogSelect(catalogId: string) {
    if (this.isCable) {
      const cable = this.cableCatalogItems.find(c => c.id === catalogId);
      if (cable) {
        this.propertyChanged.emit({ property: 'catalogId', value: catalogId });
        this.propertyChanged.emit({ property: 'componentCrossSection', value: cable.physical.crossSection });
        this.propertyChanged.emit({ property: 'componentMaterial', value: cable.physical.conductorMaterial });
        this.propertyChanged.emit({ property: 'resistancePerKm', value: cable.electrical.resistancePerKm });
        this.propertyChanged.emit({ property: 'reactancePerKm', value: cable.electrical.reactancePerKm });
      }
    } else if (this.isTransformer) {
      const tx = this.transformerCatalogItems.find(t => t.id === catalogId);
      if (tx) {
        this.propertyChanged.emit({ property: 'catalogId', value: catalogId });
      }
    } else if (this.isSwitch) {
      const sw = this.switchCatalogItems.find(s => s.id === catalogId);
      if (sw) {
        this.propertyChanged.emit({ property: 'catalogId', value: catalogId });
      }
    }
  }

  onSwitchToggle(closed: boolean) {
    this.propertyChanged.emit({ property: 'closed', value: closed });
    this.propertyChanged.emit({ property: 'lengthLabel', value: closed ? 'Closed' : 'Open' });
  }

  onLoadPresetSelect(presetId: string) {
    const preset = this.loadPresets.find(p => p.id === presetId);
    if (preset) {
      this.propertyChanged.emit({property: 'selectedPresetId', value: presetId});
      this.propertyChanged.emit({property: 'loadType', value: preset.loadType});
      this.propertyChanged.emit({property: 'cosPhi', value: preset.cosPhi});
      this.propertyChanged.emit({property: 'loadProfileControlPoints', value: [...preset.defaultProfile]});
      this.propertyChanged.emit({property: 'loadProfile', value: LoadProfileEditor.getProfileFromControlPoints(
        preset.defaultProfile, 
        this.maxSimulationSteps, 
        this.deltaTime, 
        Math.max(...preset.defaultProfile.map(p => p.value), 1)
      )});
    }
  }
  

}