import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ComplianceStandard } from '../../../../models/compliance-standard.model';

@Component({
  selector: 'app-standard-form-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './standard-form-modal.component.html',
  styleUrl: './standard-form-modal.component.scss'
})
export class StandardFormModalComponent {
  @Input() set standard(value: ComplianceStandard | null) {
    this._editing = value;
    this.model = value ? { ...value } : this.emptyStandard();
  }
  get standard(): ComplianceStandard | null {
    return this._editing;
  }

  @Output() save = new EventEmitter<ComplianceStandard>();
  @Output() close = new EventEmitter<void>();

  public model: Partial<ComplianceStandard> = this.emptyStandard();
  private _editing: ComplianceStandard | null = null;

  get title(): string {
    return this._editing ? 'Edit Standard' : 'New Standard';
  }

  get submitLabel(): string {
    return this._editing ? 'Update' : 'Create';
  }

  submit() {
    const payload: Partial<ComplianceStandard> = {
      name: this.model.name,
      description: this.model.description,
      minVoltagePu: this.model.minVoltagePu,
      maxVoltagePu: this.model.maxVoltagePu,
      active: this.model.active ?? true,
      defaultStandard: this.model.defaultStandard ?? false
    };
    this.save.emit(payload as ComplianceStandard);
  }

  private emptyStandard(): Partial<ComplianceStandard> {
    return {
      name: '',
      description: '',
      minVoltagePu: 0.90,
      maxVoltagePu: 1.10,
      active: true,
      defaultStandard: false
    };
  }
}
