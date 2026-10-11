import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { UserSummary, CreateUserRequest } from '../../../../models/admin.model';
import { ConfirmDeleteButtonComponent } from '../../../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { UserFormModalComponent } from '../../modals/user-form-modal/user-form-modal.component';

@Component({
  selector: 'app-users-section',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IconComponent, ConfirmDeleteButtonComponent, UserFormModalComponent],
  templateUrl: './users-section.component.html',
  styleUrl: './users-section.component.scss'
})
export class UsersSectionComponent implements OnInit {
  public users: UserSummary[] = [];
  public loading = false;
  public searchText = '';
  public showForm = false;
  public currentUsername: string | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUsername = this.authService.getUsername();
  }

  ngOnInit() {
    this.loadUsers();
  }

  get filteredUsers(): UserSummary[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (list) => { this.users = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  createUser(request: CreateUserRequest) {
    this.adminService.createUser(request).subscribe({
      next: (user) => {
        this.users.push(user);
        this.showForm = false;
        this.toast.success('User created successfully.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }

  changeRole(user: UserSummary, newRole: string) {
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) this.users[idx] = updated;
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }

  deleteUser(user: UserSummary) {
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.toast.success('User deleted.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }
}
