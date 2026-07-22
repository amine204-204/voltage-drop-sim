import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-delete-button',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './confirm-delete-button.component.html',
  styleUrl: './confirm-delete-button.component.scss'
})
export class ConfirmDeleteButtonComponent {
  @Input() title = 'Delete';
  @Output() confirm = new EventEmitter<void>();

  armed = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.armed && !(event.target as HTMLElement).closest('app-confirm-delete-button')) {
      this.armed = false;
    }
  }

  onClick(event: Event) {
    event.stopPropagation();
    if (this.armed) {
      this.armed = false;
      this.confirm.emit();
    } else {
      this.armed = true;
    }
  }
}
