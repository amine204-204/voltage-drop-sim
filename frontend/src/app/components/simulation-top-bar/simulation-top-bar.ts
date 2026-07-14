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
  templateUrl: './simulation-top-bar.html',
  styleUrl: './simulation-top-bar.scss'
})
export class SimulationTopBar {
  @Output() runClicked = new EventEmitter<SimulationSettings>();
  @Output() deltaTimeChanged = new EventEmitter<number>();
  @Output() currentStepChanged = new EventEmitter<number>();
  @Output() maxStepsChanged = new EventEmitter<number>();

  @Input() maxSteps: number = 0;
  @Input() deltaTime: number = 0;
  @Input() isSimulationLoaded: boolean = false;

  public currentStep: number = 1.0;
  public selectedNormType: string = 'en50160';
  public customMinPu: number = 0.90;
  public customMaxPu: number = 1.10;

  public onRun() {
    this.runClicked.emit({
      totalTimeSteps: this.maxSteps,
      deltaTimeSeconds: this.deltaTime,
      selectedNormType: this.selectedNormType,
      customMinPu: this.selectedNormType === 'custom' ? this.customMinPu : undefined,
      customMaxPu: this.selectedNormType === 'custom' ? this.customMaxPu : undefined
    });
  }

  public onSliderChange(event: any) {
    this.currentStepChanged.emit(parseInt(event.target.value, 10));
    this.currentStep = parseInt(event.target.value, 10);
  }

}