import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../shared/modal/modal.component';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [NgIf, FormsModule, ModalComponent],
  templateUrl: './project-modal.html',
  styleUrl: './project-modal.scss'
})
export class ProjectModal {
  @Input() name: string = '';
  @Input() description: string = '';
  @Input() isEdit: boolean = false;
  @Input() errorMessage: string = '';

  @Output() save = new EventEmitter<{ name: string; description: string }>();
  @Output() close = new EventEmitter<void>();

  public nameError: string = '';

  public submit() {
    this.nameError = '';
    if (!this.name.trim()) {
      this.nameError = 'Please enter a project name.';
      return;
    }
    this.save.emit({
      name: this.name.trim(),
      description: this.description.trim()
    });
  }
}
