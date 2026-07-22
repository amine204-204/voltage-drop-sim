import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../shared/modal/modal.component';

export interface ProjectSettings {
  name: string;
  description: string;
  selectedNormType: string;
  customMinPu: number;
  customMaxPu: number;
}

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [NgIf, FormsModule, ModalComponent],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.scss'
})
export class SettingsModalComponent {
  @Input() name: string = '';
  @Input() description: string = '';
  @Input() selectedNormType: string = 'en50160';
  @Input() customMinPu: number = 0.90;
  @Input() customMaxPu: number = 1.10;
  @Input() hasProject: boolean = false;

  @Output() settingsChange = new EventEmitter<ProjectSettings>();
  @Output() close = new EventEmitter<void>();

  public nameError: string = '';

  public submit() {
    this.nameError = '';
    if (this.hasProject && !this.name.trim()) {
      this.nameError = 'Project name cannot be empty.';
      return;
    }
    this.settingsChange.emit({
      name: this.name.trim(),
      description: this.description.trim(),
      selectedNormType: this.selectedNormType,
      customMinPu: this.selectedNormType === 'custom' ? this.customMinPu : 0.90,
      customMaxPu: this.selectedNormType === 'custom' ? this.customMaxPu : 1.10
    });
  }
}
