import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';
import { ConfirmDeleteButtonComponent } from '../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../shared/icon/icon.component';
import { UserSummary, CreateUserRequest } from '../../models/admin.model';
import { CableCatalog } from '../../models/catalog.model';
import { ProjectSummary } from '../../models/project.model';
import { getErrorMessage } from '../../shared/utils/error.utils';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, IconComponent, PageHeaderComponent, ConfirmDeleteButtonComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit {
  public activeTab: 'users' | 'catalog' | 'projects' = 'users';

  public users: UserSummary[] = [];
  public cables: CableCatalog[] = [];
  public projects: ProjectSummary[] = [];

  public showCreateUser = false;
  public newUser: CreateUserRequest = { username: '', email: '', password: '', role: 'ENGINEER' };
  public confirmPassword = '';

  public editingCable: CableCatalog | null = null;
  public showCableForm = false;
  public newCable: Partial<CableCatalog> = this.emptyCable();

  public loading = true;
  public currentUsername: string | null = null;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {
    this.currentUsername = this.authService.getUsername();
  }

  ngOnInit() {
    this.loadUsers();
  }

  switchTab(tab: 'users' | 'catalog' | 'projects') {
    this.activeTab = tab;
    if (tab === 'users' && this.users.length === 0) this.loadUsers();
    if (tab === 'catalog' && this.cables.length === 0) this.loadCables();
    if (tab === 'projects' && this.projects.length === 0) this.loadProjects();
  }

  // ── Users ──────────────────────────────────────────────────

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (list) => { this.users = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  createUser() {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) return;
    if (this.newUser.password !== this.confirmPassword) {
      this.toast.error('Passwords do not match.');
      return;
    }
    this.adminService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users.push(user);
        this.showCreateUser = false;
        this.newUser = { username: '', email: '', password: '', role: 'ENGINEER' };
        this.confirmPassword = '';
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

  // ── Catalog ────────────────────────────────────────────────

  loadCables() {
    this.loading = true;
    this.adminService.getAllCables().subscribe({
      next: (list) => { this.cables = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  openNewCableForm() {
    this.editingCable = null;
    this.newCable = this.emptyCable();
    this.showCableForm = true;
  }

  editCable(cable: CableCatalog) {
    this.editingCable = cable;
    this.newCable = JSON.parse(JSON.stringify(cable));
    this.showCableForm = true;
  }

  saveCable() {
    if (this.editingCable) {
      this.adminService.updateCable(this.editingCable.id, this.newCable as CableCatalog).subscribe({
        next: (updated) => {
          const idx = this.cables.findIndex(c => c.id === updated.id);
          if (idx >= 0) this.cables[idx] = updated;
          this.showCableForm = false;
          this.editingCable = null;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    } else {
      this.adminService.createCable(this.newCable).subscribe({
        next: (created) => {
          this.cables.push(created);
          this.showCableForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    }
  }

  deleteCable(cable: CableCatalog) {
    this.adminService.deleteCable(cable.id).subscribe({
      next: () => {
        this.cables = this.cables.filter(c => c.id !== cable.id);
        this.toast.success('Cable deleted.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }

  // ── Projects ───────────────────────────────────────────────

  loadProjects() {
    this.loading = true;
    this.projectService.getProjects().subscribe({
      next: (list) => { this.projects = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  deleteProject(project: ProjectSummary) {
    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== project.id);
        this.toast.success('Project deleted.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  private emptyCable(): Partial<CableCatalog> {
    return {
      name: '',
      category: 'cable',
      standard: '',
      active: true,
      electrical: { resistancePerKm: 0, reactancePerKm: 0, ampacityFreeAirA: 0, ampacityBuriedA: 0, voltageDropPerAKm: 0 },
      physical: { crossSection: '', conductorMaterial: 'CU', insulationMaterial: '', outerDiameterMm: 0 },
      thermal: { ratedTempC: 90, maxShortCircuitTempC: 250 },
      impedanceTable: []
    };
  }
}
