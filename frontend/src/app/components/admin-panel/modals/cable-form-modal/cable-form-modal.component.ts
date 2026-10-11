import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { CableCatalog } from '../../../../models/catalog.model';

@Component({
  selector: 'app-cable-form-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './cable-form-modal.component.html',
  styleUrl: './cable-form-modal.component.scss'
})
export class CableFormModalComponent {
  @Input() set cable(value: CableCatalog | null) {
    this._editing = value;
    this.model = value ? JSON.parse(JSON.stringify(value)) : this.emptyCable();
  }
  get cable(): CableCatalog | null {
    return this._editing;
  }

  @Output() save = new EventEmitter<CableCatalog>();
  @Output() close = new EventEmitter<void>();

  public model: Partial<CableCatalog> = this.emptyCable();
  private _editing: CableCatalog | null = null;

  get title(): string {
    return this._editing ? 'Edit Cable' : 'New Cable';
  }

  get submitLabel(): string {
    return this._editing ? 'Update' : 'Create';
  }

  submit() {
    this.save.emit(this.model as CableCatalog);
  }

  private emptyCable(): Partial<CableCatalog> {
    return {
      name: '',
      category: 'cable',
      standard: '',
      active: true,
      electrical: { resistancePerKm: 0, reactancePerKm: 0, ampacityFreeAirA: 0, ampacityBuriedA: 0, voltageDropPerAKm: 0 },
      physical: { crossSection: '', conductorMaterial: 'CU', insulationMaterial: '', outerDiameterMm: 0 },
      thermal: { ratedTempC: 90, maxShortCircuitTempC: 250 },
      impedanceTable: []
    };
  }
}
