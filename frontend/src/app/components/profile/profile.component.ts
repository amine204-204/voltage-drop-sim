import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../../models/profile.model';
import { getErrorMessage } from '../../shared/utils/error.utils';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NgIf, FormsModule, PageHeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  public profile: UserProfile | null = null;
  public loading = true;
  public isAdmin = false;
  public targetUserId: number | null = null;

  public profileForm: UpdateProfileRequest = { username: '', email: '' };
  public passwordForm: ChangePasswordRequest = { currentPassword: '', newPassword: '' };
  public confirmPassword = '';
  public profileSuccess = '';
  public profileError = '';
  public passwordSuccess = '';
  public passwordError = '';

  constructor(
    private profileService: ProfileService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.isAdmin = this.authService.getRole() === 'ADMIN';
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && this.isAdmin) {
      this.targetUserId = parseInt(idParam, 10);
      this.loadProfileById(this.targetUserId);
    } else {
      this.loadOwnProfile();
    }
  }

  loadOwnProfile() {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileForm = { username: profile.username, email: profile.email };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(getErrorMessage(err));
        this.cdr.detectChanges();
      }
    });
  }

  loadProfileById(id: number) {
    this.loading = true;
    this.profileService.getProfileById(id).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileForm = { username: profile.username, email: profile.email };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(getErrorMessage(err));
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile() {
    this.profileSuccess = '';
    this.profileError = '';

    const obs = this.targetUserId !== null
      ? this.profileService.updateProfileById(this.targetUserId, this.profileForm)
      : this.profileService.updateProfile(this.profileForm);

    obs.subscribe({
      next: (updated) => {
        this.profile = updated;
        if (this.targetUserId === null) {
          this.authService.updateStoredUsername(updated.username);
        }
        this.profileSuccess = 'Profile updated successfully.';
        this.toast.success('Profile updated.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.profileError = getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  changePassword() {
    this.passwordSuccess = '';
    this.passwordError = '';

    if (this.passwordForm.newPassword !== this.confirmPassword) {
      this.passwordError = 'New passwords do not match.';
      this.cdr.detectChanges();
      return;
    }

    const request: ChangePasswordRequest = {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    };

    const obs = this.targetUserId !== null
      ? this.profileService.changePasswordById(this.targetUserId, request)
      : this.profileService.changePassword(request);

    obs.subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully.';
        this.passwordForm = { currentPassword: '', newPassword: '' };
        this.confirmPassword = '';
        this.toast.success('Password changed.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passwordError = getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }
}
