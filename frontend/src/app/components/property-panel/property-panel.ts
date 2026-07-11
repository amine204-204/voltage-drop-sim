import { NgFor, NgIf } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  @Output() propertyChanged = new EventEmitter<{property: string, value: any}>();
  @Output() openChart = new EventEmitter<void>();
  @Output() openProfileEditor = new EventEmitter<void>();

  get displayProfile(): string {
    if (this.elementData?.loadProfile && Array.isArray(this.elementData.loadProfile)) {
      return this.elementData.loadProfile.join(', ');
    }
    return '';
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
}