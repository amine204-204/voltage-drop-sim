import { NgIf } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SimulationSettings {
  totalTimeSteps: number;
  deltaTimeSeconds: number;
  selectedNormType: string;
  customMinPu?: number;
  customMaxPu?: number;
}

@Component({
  selector: 'app-simulation-top-bar',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './simulation-top-bar.component.html',
  styleUrl: './simulation-top-bar.component.scss'
})
export class SimulationTopBar {
  @Output() runClicked = new EventEmitter<SimulationSettings>();
  @Output() deltaTimeChanged = new EventEmitter<number>();
  @Output() currentStepChanged = new EventEmitter<number>();
  @Output() maxStepsChanged = new EventEmitter<number>();
  @Output() normTypeChanged = new EventEmitter<string>();
  @Output() customPuLimitsChanged = new EventEmitter<{ min: number; max: number }>();

  @Input() maxSteps: number = 0;
  @Input() deltaTime: number = 0;
  @Input() isSimulationLoaded: boolean = false;
  @Input() isSimulating: boolean = false;
  @Input() currentStep: number = 0;
  @Input() selectedNormType: string = 'en50160';
  @Input() customMinPu: number = 0.90;
  @Input() customMaxPu: number = 1.10;

  public onRun() {
    this.runClicked.emit({
      totalTimeSteps: this.maxSteps,
      deltaTimeSeconds: this.deltaTime,
      selectedNormType: this.selectedNormType,
      customMinPu: this.selectedNormType === 'custom' ? this.customMinPu : undefined,
      customMaxPu: this.selectedNormType === 'custom' ? this.customMaxPu : undefined
    });
  }

  public onSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const step = parseInt(target.value, 10);
    this.currentStepChanged.emit(step);
  }

  public onNormTypeChange(value: string) {
    this.normTypeChanged.emit(value);
  }

  public onCustomMinPuChange(value: number) {
    this.customPuLimitsChanged.emit({ min: value, max: this.customMaxPu });
  }

  public onCustomMaxPuChange(value: number) {
    this.customPuLimitsChanged.emit({ min: this.customMinPu, max: value });
  }
}
