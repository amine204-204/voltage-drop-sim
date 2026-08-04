import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { NumPipe } from '../../../../shared/pipes/format-number.pipe';
import { CableCatalog } from '../../../../models/catalog.model';
import { ProjectReference } from '../../../../models/admin.model';
import { ConfirmDeleteButtonComponent } from '../../../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { CableFormModalComponent } from '../../modals/cable-form-modal/cable-form-modal.component';
import { CatalogImportModalComponent } from '../../modals/catalog-import-modal/catalog-import-modal.component';
import { CatalogExportButtonsComponent } from '../../shared/catalog-export-buttons/catalog-export-buttons.component';
import { CatalogReferencesModalComponent } from '../../shared/catalog-references-modal/catalog-references-modal.component';

@Component({
  selector: 'app-cable-catalog-section',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IconComponent, ConfirmDeleteButtonComponent, CableFormModalComponent, CatalogImportModalComponent, CatalogExportButtonsComponent, CatalogReferencesModalComponent, NumPipe],
  templateUrl: './cable-catalog-section.component.html',
  styleUrl: './cable-catalog-section.component.scss'
})
export class CableCatalogSectionComponent implements OnInit {
  public cables: CableCatalog[] = [];
  public loading = false;
  public searchText = '';
  public showForm = false;
  public showImport = false;
  public editingCable: CableCatalog | null = null;
  public blockedItem: { name: string; type: 'cable' | 'transformer' | 'switch' } | null = null;
  public blockedReferences: ProjectReference[] = [];

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCables();
  }

  get filteredCables(): CableCatalog[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.cables;
    return this.cables.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.standard.toLowerCase().includes(q) ||
      c.physical.crossSection.toLowerCase().includes(q)
    );
  }

  loadCables() {
    this.loading = true;
    this.adminService.getAllCables().subscribe({
      next: (list) => { this.cables = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  openNewForm() {
    this.editingCable = null;
    this.showForm = true;
  }

  openImport() {
    this.showImport = true;
  }

  editCable(cable: CableCatalog) {
    this.editingCable = cable;
    this.showForm = true;
  }

  saveCable(cable: CableCatalog) {
    if (this.editingCable) {
      this.adminService.updateCable(this.editingCable.id, cable).subscribe({
        next: (updated) => {
          const idx = this.cables.findIndex(c => c.id === updated.id);
          if (idx >= 0) this.cables[idx] = updated;
          this.showForm = false;
          this.editingCable = null;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    } else {
      this.adminService.createCable(cable).subscribe({
        next: (created) => {
          this.cables.push(created);
          this.showForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    }
  }

  deleteCable(cable: CableCatalog) {
    this.adminService.getCableUsage(cable.id).subscribe({
      next: (usage) => {
        if (usage.projects.length > 0) {
          this.blockedItem = { name: cable.name, type: 'cable' };
          this.blockedReferences = usage.projects;
          this.cdr.detectChanges();
          return;
        }
        this.adminService.deleteCable(cable.id).subscribe({
          next: () => {
            this.cables = this.cables.filter(c => c.id !== cable.id);
            this.toast.success('Cable deleted.');
            this.cdr.detectChanges();
          },
          error: (err) => this.toast.error(getErrorMessage(err))
        });
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }
}
