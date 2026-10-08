import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectSummary } from '../../models/project.model';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { IconComponent } from '../shared/icon/icon.component';
import { LogoComponent } from '../shared/logo/logo.component';

@Component({
  selector: 'app-user-bar',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IconComponent, LogoComponent],
  templateUrl: './user-bar.component.html',
  styleUrl: './user-bar.component.scss'
})
export class UserBarComponent {
  @Input() projects: ProjectSummary[] = [];
  @Input() selectedProjectId: number | null = null;
  @Input() deleteConfirmStep: boolean = false;

  @Output() projectSelected = new EventEmitter<number | null>();
  @Output() newProject = new EventEmitter<void>();
  @Output() saveProject = new EventEmitter<void>();
  @Output() saveAsProject = new EventEmitter<void>();
  @Output() exportProject = new EventEmitter<void>();
  @Output() importProject = new EventEmitter<File>();
  @Output() deleteProject = new EventEmitter<void>();
  @Output() settingsClicked = new EventEmitter<void>();

  public username: string = '';
  public isAdmin: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {
    this.username = this.authService.getUsername() || '';
    this.isAdmin = this.authService.getRole() === 'ADMIN';
  }

  public onProjectSelected(val: string | null) {
    const id = val === 'null' || val === null ? null : parseInt(val, 10);
    this.projectSelected.emit(id);
  }

  public goToAdmin() {
    this.router.navigate(['/admin']);
  }

  public goToProfile() {
    this.router.navigate(['/profile']);
  }

  public onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.importProject.emit(input.files[0]);
    }
    input.value = '';
  }

  public logout() {
    this.authService.logout();
  }
}
