import { NgIf } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../shared/icon/icon.component';

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

  public get derivedDeltaTimeSeconds(): number {
    if (this.durationSeconds <= 0 || this.maxSteps <= 0) return 0;
    return Math.round((this.durationSeconds / this.maxSteps) * 100) / 100;
  }

  public get isDeltaTimeValid(): boolean {
    return this.derivedDeltaTimeSeconds >= MIN_DELTA_TIME_SECONDS
      && this.derivedDeltaTimeSeconds <= MAX_DELTA_TIME_SECONDS;
  }

  public get deltaTimeValue(): number | null {
    const seconds = this.derivedDeltaTimeSeconds;
    if (!isFinite(seconds) || seconds <= 0) return null;
    return seconds;
  }

  public get deltaTimeText(): string {
    return this.deltaTimeValue === null ? '—' : this.deltaTimeValue.toFixed(2);
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
    const secsText = Number.isInteger(secs) ? `${secs}s` : `${secs.toFixed(2)}s`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secsText}`;
    return secsText;
  }

  public onRun() {
    this.runClicked.emit({
      totalTimeSteps: this.maxSteps,
      deltaTimeSeconds: this.derivedDeltaTimeSeconds
    });
  }

  public onSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const step = parseInt(target.value, 10);
    this.currentStepChanged.emit(step);
  }

}
