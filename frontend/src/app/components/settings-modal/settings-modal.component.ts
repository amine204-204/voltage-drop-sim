import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../shared/modal/modal.component';
import { NormService } from '../../services/norm.service';
import { ComplianceStandard } from '../../models/compliance-standard.model';

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
  imports: [NgIf, NgFor, FormsModule, ModalComponent],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.scss'
})
export class SettingsModalComponent implements OnInit {
  @Input() name: string = '';
  @Input() description: string = '';
  @Input() selectedNormType: string = '';
  @Input() customMinPu: number = 0.90;
  @Input() customMaxPu: number = 1.10;
  @Input() hasProject: boolean = false;

  @Output() settingsChange = new EventEmitter<ProjectSettings>();
  @Output() close = new EventEmitter<void>();

  public standards: ComplianceStandard[] = [];
  public nameError: string = '';
  public loading: boolean = true;

  constructor(private normService: NormService) {}

  ngOnInit() {
    this.loading = true;
    this.normService.getActiveStandards().subscribe({
      next: (list) => {
        this.standards = list;
        this.loading = false;
        const matches = this.selectedNormType === 'custom'
          || list.some(s => s.name.toLowerCase() === this.selectedNormType.toLowerCase());
        if (!matches && list.length > 0) {
          const def = list.find(s => s.defaultStandard) || list[0];
          this.selectedNormType = def.name;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

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
