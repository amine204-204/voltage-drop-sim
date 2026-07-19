import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-modal.html',
  styleUrl: './project-modal.scss'
})
export class ProjectModal {
  @Input() name: string = '';
  @Input() description: string = '';
  @Input() isEdit: boolean = false;

  @Output() onSave = new EventEmitter<{ name: string; description: string }>();
  @Output() onClose = new EventEmitter<void>();

  public save() {
    if (!this.name.trim()) {
      alert('Please enter a project name.');
      return;
    }
    this.onSave.emit({
      name: this.name.trim(),
      description: this.description.trim()
    });
  }
}
