import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOAD_PRESETS } from '../../mocks/load-preset.mock';
import { MOCK_CABLES } from '../../mocks/equipement-catalog.mock';
import { CableCatalog } from '../../models/catalog.model';
import { LoadPreset } from '../../models/load-preset.model';
import { LoadProfileEditor } from '../load-profile-editor/load-profile-editor';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './property-panel.html',
  styleUrl: './property-panel.scss'
})
export class PropertyPanel {
  @Input() elementData: any;
  @Input() elementType: string = '';
  @Input() simulationStep: number = 0;
  @Input() maxSimulationSteps: number = 10;
  @Input() deltaTime: number = 1;
  @Input() cableCatalogItems: CableCatalog[] = MOCK_CABLES;
  @Input() loadPresets: LoadPreset[] = LOAD_PRESETS;

  @Output() propertyChanged = new EventEmitter<{property: string, value: any}>();
  @Output() openChart = new EventEmitter<void>();
  @Output() openProfileEditor = new EventEmitter<void>();

  public selectedBranch? : CableCatalog;

  constructor(private cdr: ChangeDetectorRef) {}

  get displayProfile(): string {
    if (this.elementData?.loadProfile && Array.isArray(this.elementData.loadProfile)) {
      return this.elementData.loadProfile.join(', ');
    }
    return '';
  }

  get filteredLoadPresets(){
    if(this.elementData.type !== 'CONSUMER') return;
    return this.loadPresets.filter(p => p.loadType === this.elementData.loadType);
  }

  onPropertyChange(property: string, value: any) {
    if (property === 'loadProfile' && typeof value === 'string') {
      const numberArray = value.split(',')
        .map(num => parseFloat(num.trim()))
        .filter(n => !isNaN(n));
      this.propertyChanged.emit({ property, value: numberArray });
    } else {
      this.propertyChanged.emit({ property, value });
    }
  }

  onCatalogSelect(catalogId: string) {
    const cable = this.cableCatalogItems.find(c => c.id === catalogId);
    if (cable) {
      this.propertyChanged.emit({ property: 'catalogId', value: catalogId });
      this.propertyChanged.emit({ property: 'componentCrossSection', value: cable.physical.crossSection });
      this.propertyChanged.emit({ property: 'componentMaterial', value: cable.physical.conductorMaterial });
      this.propertyChanged.emit({ property: 'resistancePerKm', value: cable.electrical.resistancePerKm });
      this.propertyChanged.emit({ property: 'reactancePerKm', value: cable.electrical.reactancePerKm });
    }
    this.selectedBranch = cable;
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