import { Component, EventEmitter, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { CreateUserRequest } from '../../../../models/admin.model';

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [NgIf, FormsModule, ModalComponent],
  templateUrl: './user-form-modal.component.html',
  styleUrl: './user-form-modal.component.scss'
})
export class UserFormModalComponent {
  @Output() save = new EventEmitter<CreateUserRequest>();
  @Output() close = new EventEmitter<void>();

  public username = '';
  public email = '';
  public password = '';
  public confirmPassword = '';
  public role = 'ENGINEER';
  public errorMessage: string | null = null;

  submit() {
    this.errorMessage = null;
    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'Username, email and password are required.';
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    this.save.emit({ username: this.username, email: this.email, password: this.password, role: this.role });
  }
}
