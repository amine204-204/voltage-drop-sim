import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { NumPipe } from '../../../../shared/pipes/format-number.pipe';
import { LoadPreset, PresetCurveDraft } from '../../../../models/load-preset.model';
import { PresetEditorModalComponent } from '../preset-editor-modal/preset-editor-modal.component';

const UNIT_BY_LOAD_TYPE: Record<LoadPreset['loadType'], string> = {
  CONSTANT_CURRENT: 'A',
  CONSTANT_POWER: 'W'
};

@Component({
  selector: 'app-preset-form-modal',
  standalone: true,
  imports: [NgIf, FormsModule, ModalComponent, IconComponent, PresetEditorModalComponent, NumPipe],
  templateUrl: './preset-form-modal.component.html',
  styleUrl: './preset-form-modal.component.scss'
})
export class PresetFormModalComponent {
  @Input() set preset(value: LoadPreset | null) {
    this._editing = value;
    this.model = value ? JSON.parse(JSON.stringify(value)) : this.emptyPreset();
    this.model.unit = this.unit;
  }
  get preset(): LoadPreset | null {
    return this._editing;
  }

  @Output() save = new EventEmitter<LoadPreset>();
  @Output() close = new EventEmitter<void>();

  public model: LoadPreset = this.emptyPreset();
  public showEditor: boolean = false;
  private _editing: LoadPreset | null = null;

  get title(): string {
    return this._editing ? 'Edit Load Preset' : 'New Load Preset';
  }

  get submitLabel(): string {
    return this._editing ? 'Update' : 'Create';
  }

  get pointCount(): number {
    return this.model.defaultProfile?.length ?? 0;
  }

  get unit(): string {
    return UNIT_BY_LOAD_TYPE[this.model.loadType];
  }

  onLoadTypeChange(type: LoadPreset['loadType']) {
    this.model.loadType = type;
    this.model.unit = this.unit;
  }

  openEditor() {
    this.showEditor = true;
  }

  onCurveSaved(draft: PresetCurveDraft) {
    this.model.defaultProfile = draft.controlPoints;
    this.model.durationSeconds = draft.durationSeconds;
    this.showEditor = false;
  }

  submit() {
    this.save.emit(this.model);
  }

  private emptyPreset(): LoadPreset {
    return {
      id: '',
      name: '',
      description: '',
      loadType: 'CONSTANT_CURRENT',
      cosPhi: 0.9,
      unit: 'A',
      durationSeconds: 86400,
      defaultProfile: [
        { time: 0, value: 0 },
        { time: 86400, value: 0 }
      ]
    };
  }
}
