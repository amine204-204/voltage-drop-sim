import { NgIf } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../shared/icon/icon.component';
import { formatNum } from '../../shared/utils/format.utils';

export interface SimulationSettings {
  totalTimeSteps: number;
  deltaTimeSeconds: number;
}

export const MIN_DELTA_TIME_SECONDS = 1;
export const MAX_DELTA_TIME_SECONDS = 3600;

@Component({
  selector: 'app-simulation-top-bar',
  standalone: true,
  imports: [FormsModule, NgIf, IconComponent],
  templateUrl: './simulation-top-bar.component.html',
  styleUrl: './simulation-top-bar.component.scss'
})
export class SimulationTopBar {
  @Output() runClicked = new EventEmitter<SimulationSettings>();
  @Output() cancelClicked = new EventEmitter<void>();
  @Output() editModeClicked = new EventEmitter<void>();
  @Output() durationChanged = new EventEmitter<number>();
  @Output() currentStepChanged = new EventEmitter<number>();
  @Output() maxStepsChanged = new EventEmitter<number>();
  @Output() playPauseClicked = new EventEmitter<void>();
  @Output() stepBackClicked = new EventEmitter<void>();
  @Output() stepForwardClicked = new EventEmitter<void>();
  @Output() toStartClicked = new EventEmitter<void>();
  @Output() toEndClicked = new EventEmitter<void>();
  @Output() repeatToggled = new EventEmitter<void>();
  @Output() playbackSpeedChanged = new EventEmitter<number>();
  @Input() maxSteps: number = 0;
  @Input() durationSeconds: number = 3600;
  @Input() isSimulationLoaded: boolean = false;
  @Input() isSimulating: boolean = false;
  @Input() currentStep: number = 0;
  @Input() isPlaying: boolean = false;
  @Input() isRepeat: boolean = false;
  @Input() playbackSpeed: number = 1;
  @Input() simulationDeltaTimeSeconds: number | null = null;
  @Input() simulationTotalTimeSeconds: number | null = null;
  @Input() minDeltaTimeSeconds: number = MIN_DELTA_TIME_SECONDS;
  @Input() maxDeltaTimeSeconds: number = MAX_DELTA_TIME_SECONDS;

  public get derivedDeltaTimeSeconds(): number {
    if (this.durationSeconds <= 0 || this.maxSteps <= 0) return 0;
    return Math.round((this.durationSeconds / this.maxSteps) * 100) / 100;
  }

  public get isDeltaTimeValid(): boolean {
    return this.derivedDeltaTimeSeconds >= this.minDeltaTimeSeconds
      && this.derivedDeltaTimeSeconds <= this.maxDeltaTimeSeconds;
  }

  public get deltaTimeRangeHint(): string {
    return `Δt must be between ${formatNum(this.minDeltaTimeSeconds)} s and ${formatNum(this.maxDeltaTimeSeconds)} s`;
  }

  public get deltaTimeValue(): number | null {
    const seconds = this.derivedDeltaTimeSeconds;
    if (!isFinite(seconds) || seconds <= 0) return null;
    return seconds;
  }

  public get deltaTimeText(): string {
    return this.deltaTimeValue === null ? '—' : formatNum(this.deltaTimeValue);
  }

  public get currentTimeText(): string {
    const dt = this.simulationDeltaTimeSeconds ?? this.derivedDeltaTimeSeconds;
    return this.formatTime(this.currentStep * dt);
  }

  public get totalTimeText(): string {
    const total = this.simulationTotalTimeSeconds ?? this.durationSeconds;
    return this.formatTime(total);
  }

  private formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const secsText = Number.isInteger(secs) ? `${secs}s` : `${formatNum(secs)}s`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secsText}`;
    return secsText;
  }

  public onPrimaryAction() {
    if (this.isSimulating) {
      this.cancelClicked.emit();
    } else if (this.isSimulationLoaded) {
      this.editModeClicked.emit();
    } else {
      this.runClicked.emit({
        totalTimeSteps: this.maxSteps,
        deltaTimeSeconds: this.derivedDeltaTimeSeconds
      });
    }
  }

  public get runButtonTitle(): string {
    if (this.isSimulating) return 'Cancel the running simulation';
    if (this.isSimulationLoaded) return 'Back to edit — discards current results';
    return this.isDeltaTimeValid ? 'Run simulation' : this.deltaTimeRangeHint;
  }

  public onSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const step = parseInt(target.value, 10);
    this.currentStepChanged.emit(step);
  }

}
