import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { TransformerCatalog } from '../../../../models/catalog.model';

@Component({
  selector: 'app-transformer-form-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './transformer-form-modal.component.html',
  styleUrl: './transformer-form-modal.component.scss'
})
export class TransformerFormModalComponent {
  @Input() set transformer(value: TransformerCatalog | null) {
    this._editing = value;
    this.model = value ? JSON.parse(JSON.stringify(value)) : this.emptyTransformer();
  }
  get transformer(): TransformerCatalog | null {
    return this._editing;
  }

  @Output() save = new EventEmitter<TransformerCatalog>();
  @Output() close = new EventEmitter<void>();

  public model: Partial<TransformerCatalog> = this.emptyTransformer();
  private _editing: TransformerCatalog | null = null;

  get title(): string {
    return this._editing ? 'Edit Transformer' : 'New Transformer';
  }

  get submitLabel(): string {
    return this._editing ? 'Update' : 'Create';
  }

  submit() {
    this.save.emit(this.model as TransformerCatalog);
  }

  private emptyTransformer(): Partial<TransformerCatalog> {
    return {
      name: '',
      category: 'transformer',
      standard: '',
      active: true,
      electrical: { ratedPowerKva: 0, primaryVoltageV: 0, secondaryVoltageV: 0, impedancePercent: 0, noLoadLossW: 0, loadLossW: 0 },
      tapChanger: { steps: 0, stepVoltagePercent: 0 }
    };
  }
}
