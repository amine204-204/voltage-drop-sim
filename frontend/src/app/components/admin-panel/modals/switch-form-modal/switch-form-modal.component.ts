import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { SwitchCatalog } from '../../../../models/catalog.model';

@Component({
  selector: 'app-switch-form-modal',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './switch-form-modal.component.html',
  styleUrl: './switch-form-modal.component.scss'
})
export class SwitchFormModalComponent {
  @Input() set sw(value: SwitchCatalog | null) {
    this._editing = value;
    this.model = value ? JSON.parse(JSON.stringify(value)) : this.emptySwitch();
  }
  get sw(): SwitchCatalog | null {
    return this._editing;
  }

  @Output() save = new EventEmitter<SwitchCatalog>();
  @Output() close = new EventEmitter<void>();

  public model: Partial<SwitchCatalog> = this.emptySwitch();
  private _editing: SwitchCatalog | null = null;

  get title(): string {
    return this._editing ? 'Edit Switch' : 'New Switch';
  }

  get submitLabel(): string {
    return this._editing ? 'Update' : 'Create';
  }

  submit() {
    this.save.emit(this.model as SwitchCatalog);
  }

  private emptySwitch(): Partial<SwitchCatalog> {
    return {
      name: '',
      category: 'switch',
      standard: '',
      active: true,
      electrical: { ratedCurrentA: 0, breakingCapacity: '' }
    };
  }
}
