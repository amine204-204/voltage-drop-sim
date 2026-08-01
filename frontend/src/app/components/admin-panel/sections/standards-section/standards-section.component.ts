import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { ComplianceStandard } from '../../../../models/compliance-standard.model';
import { ConfirmDeleteButtonComponent } from '../../../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { StandardFormModalComponent } from '../../modals/standard-form-modal/standard-form-modal.component';

@Component({
  selector: 'app-standards-section',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IconComponent, ConfirmDeleteButtonComponent, StandardFormModalComponent],
  templateUrl: './standards-section.component.html',
  styleUrl: './standards-section.component.scss'
})
export class StandardsSectionComponent implements OnInit {
  public standards: ComplianceStandard[] = [];
  public loading = false;
  public searchText = '';
  public showForm = false;
  public editingStandard: ComplianceStandard | null = null;

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadStandards();
  }

  get filteredStandards(): ComplianceStandard[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.standards;
    return this.standards.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q)
    );
  }

  loadStandards() {
    this.loading = true;
    this.adminService.getComplianceStandards().subscribe({
      next: (list) => { this.standards = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  openNewForm() {
    this.editingStandard = null;
    this.showForm = true;
  }

  editStandard(standard: ComplianceStandard) {
    this.editingStandard = standard;
    this.showForm = true;
  }

  saveStandard(standard: ComplianceStandard) {
    if (this.editingStandard) {
      this.adminService.updateComplianceStandard(this.editingStandard.id, standard).subscribe({
        next: (updated) => {
          const idx = this.standards.findIndex(s => s.id === updated.id);
          if (idx >= 0) this.standards[idx] = updated;
          this.showForm = false;
          this.editingStandard = null;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    } else {
      this.adminService.createComplianceStandard(standard).subscribe({
        next: (created) => {
          this.standards.push(created);
          this.showForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    }
  }

  deleteStandard(standard: ComplianceStandard) {
    this.adminService.deleteComplianceStandard(standard.id).subscribe({
      next: () => {
        this.standards = this.standards.filter(s => s.id !== standard.id);
        this.toast.success('Standard deleted.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }
}
