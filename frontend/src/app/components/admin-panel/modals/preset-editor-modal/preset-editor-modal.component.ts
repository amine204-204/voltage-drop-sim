import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ProfileCurveCanvas, ControlPoint } from '../../../profile-curve-canvas/profile-curve-canvas.component';
import { PresetCurveDraft } from '../../../../models/load-preset.model';

@Component({
  selector: 'app-preset-editor-modal',
  standalone: true,
  imports: [NgIf, FormsModule, ModalComponent, ProfileCurveCanvas],
  templateUrl: './preset-editor-modal.component.html',
  styleUrl: './preset-editor-modal.component.scss'
})
export class PresetEditorModalComponent {
  @Input() set initialData(value: PresetCurveDraft) {
    this.controlPoints = (value.controlPoints ?? []).map(p => ({ ...p }));
    this.durationSeconds = value.durationSeconds > 0 ? value.durationSeconds : 86400;
    this.maxLoadValue = Math.max(...this.controlPoints.map(p => p.value), 10);
  }
  @Input() loadUnit: string = 'A';

  @Output() save = new EventEmitter<PresetCurveDraft>();
  @Output() close = new EventEmitter<void>();

  public controlPoints: ControlPoint[] = [];
  public durationSeconds: number = 86400;
  public durationHours: number = 24;
  public maxLoadValue: number = 10;

  onDurationChange(hours: number) {
    this.durationHours = hours;
    this.durationSeconds = Math.max(hours, 0.001) * 3600;
  }

  onPointsChange(points: ControlPoint[]) {
    this.controlPoints = points.map(p => ({ ...p }));
  }

  submit() {
    this.save.emit({
      controlPoints: this.controlPoints.map(p => ({ ...p })),
      durationSeconds: this.durationSeconds
    });
  }
}
