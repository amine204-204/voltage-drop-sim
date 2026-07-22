import { NgIf } from '@angular/common';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface SimulationSettings {
  totalTimeSteps: number;
  deltaTimeSeconds: number;
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
  @Input() maxSteps: number = 0;
  @Input() deltaTime: number = 0;
  @Input() isSimulationLoaded: boolean = false;
  @Input() isSimulating: boolean = false;
  @Input() currentStep: number = 0;

  public onRun() {
    this.runClicked.emit({
      totalTimeSteps: this.maxSteps,
      deltaTimeSeconds: this.deltaTime
    });
  }

  public onSliderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const step = parseInt(target.value, 10);
    this.currentStepChanged.emit(step);
  }

}
