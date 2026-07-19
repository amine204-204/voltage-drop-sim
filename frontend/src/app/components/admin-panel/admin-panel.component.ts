import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { ProjectService } from '../../services/project.service';
import { UserSummary, CreateUserRequest } from '../../models/admin.model';
import { CableCatalog } from '../../models/catalog.model';
import { ProjectSummary } from '../../models/project.model';
import { getErrorMessage } from '../../guards/error.interceptor';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  public editingCable: CableCatalog | null = null;
  public showCableForm = false;
  public newCable: Partial<CableCatalog> = this.emptyCable();

  public loading = true;

  constructor(
    private adminService: AdminService,
    private projectService: ProjectService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  switchTab(tab: 'users' | 'catalog' | 'projects') {
    this.activeTab = tab;
    if (tab === 'users' && this.users.length === 0) this.loadUsers();
    if (tab === 'catalog' && this.cables.length === 0) this.loadCables();
    if (tab === 'projects' && this.projects.length === 0) this.loadProjects();
  }

  goBack() {
    this.router.navigate(['']);
  }

  // ── Users ──────────────────────────────────────────────────

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (list) => { this.users = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; alert(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  createUser() {
    if (!this.newUser.username || !this.newUser.email || !this.newUser.password) return;
    this.adminService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.users.push(user);
        this.showCreateUser = false;
        this.newUser = { username: '', email: '', password: '', role: 'ENGINEER' };
        this.cdr.detectChanges();
      },
      error: (err) => alert(getErrorMessage(err))
    });
  }

  changeRole(user: UserSummary, newRole: string) {
    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (updated) => {
        const idx = this.users.findIndex(u => u.id === user.id);
        if (idx >= 0) this.users[idx] = updated;
        this.cdr.detectChanges();
      },
      error: (err) => alert(getErrorMessage(err))
    });
  }

  deleteUser(user: UserSummary) {
    if (!confirm(`Delete user "${user.username}"?`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.cdr.detectChanges();
      },
      error: (err) => alert(getErrorMessage(err))
    });
  }

  // ── Catalog ────────────────────────────────────────────────

  loadCables() {
    this.loading = true;
    this.adminService.getAllCables().subscribe({
      next: (list) => { this.cables = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; alert(getErrorMessage(err)); this.cdr.detectChanges(); }
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
        error: (err) => alert(getErrorMessage(err))
      });
    } else {
      this.adminService.createCable(this.newCable).subscribe({
        next: (created) => {
          this.cables.push(created);
          this.showCableForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => alert(getErrorMessage(err))
      });
    }
  }

  deleteCable(cable: CableCatalog) {
    if (!confirm(`Delete cable "${cable.name}"?`)) return;
    this.adminService.deleteCable(cable.id).subscribe({
      next: () => {
        this.cables = this.cables.filter(c => c.id !== cable.id);
        this.cdr.detectChanges();
      },
      error: (err) => alert(getErrorMessage(err))
    });
  }

  // ── Projects ───────────────────────────────────────────────

  loadProjects() {
    this.loading = true;
    this.projectService.getProjects().subscribe({
      next: (list) => { this.projects = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; alert(getErrorMessage(err)); this.cdr.detectChanges(); }
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
