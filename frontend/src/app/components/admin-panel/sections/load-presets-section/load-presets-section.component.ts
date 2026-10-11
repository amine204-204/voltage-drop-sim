import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { NumPipe } from '../../../../shared/pipes/format-number.pipe';
import { LoadPreset } from '../../../../models/load-preset.model';
import { ProjectReference } from '../../../../models/admin.model';
import { ConfirmDeleteButtonComponent } from '../../../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { PresetFormModalComponent } from '../../modals/preset-form-modal/preset-form-modal.component';
import { CatalogReferencesModalComponent } from '../../shared/catalog-references-modal/catalog-references-modal.component';

@Component({
  selector: 'app-load-presets-section',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IconComponent, ConfirmDeleteButtonComponent, PresetFormModalComponent, CatalogReferencesModalComponent, NumPipe],
  templateUrl: './load-presets-section.component.html',
  styleUrl: './load-presets-section.component.scss'
})
export class LoadPresetsSectionComponent implements OnInit {
  public presets: LoadPreset[] = [];
  public loading = false;
  public searchText = '';
  public showForm = false;
  public editingPreset: LoadPreset | null = null;
  public blockedItem: { name: string; type: 'cable' | 'transformer' | 'switch' | 'load preset' } | null = null;
  public blockedReferences: ProjectReference[] = [];

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPresets();
  }

  get filteredPresets(): LoadPreset[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.presets;
    return this.presets.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.loadType.toLowerCase().includes(q)
    );
  }

  loadPresets() {
    this.loading = true;
    this.adminService.getAllLoadPresets().subscribe({
      next: (list) => { this.presets = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  openNewForm() {
    this.editingPreset = null;
    this.showForm = true;
  }

  editPreset(preset: LoadPreset) {
    this.editingPreset = preset;
    this.showForm = true;
  }

  savePreset(preset: LoadPreset) {
    if (this.editingPreset) {
      this.adminService.updateLoadPreset(this.editingPreset.id, preset).subscribe({
        next: (updated) => {
          const idx = this.presets.findIndex(p => p.id === updated.id);
          if (idx >= 0) this.presets[idx] = updated;
          this.showForm = false;
          this.editingPreset = null;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    } else {
      const { id, ...payload } = preset;
      this.adminService.createLoadPreset(payload).subscribe({
        next: (created) => {
          this.presets.push(created);
          this.showForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    }
  }

  deletePreset(preset: LoadPreset) {
    this.adminService.getLoadPresetUsage(preset.id).subscribe({
      next: (usage) => {
        if (usage.projects.length > 0) {
          this.blockedItem = { name: preset.name, type: 'load preset' };
          this.blockedReferences = usage.projects;
          this.cdr.detectChanges();
          return;
        }
        this.adminService.deleteLoadPreset(preset.id).subscribe({
          next: () => {
            this.presets = this.presets.filter(p => p.id !== preset.id);
            this.toast.success('Load preset deleted.');
            this.cdr.detectChanges();
          },
          error: (err) => this.toast.error(getErrorMessage(err))
        });
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }
}
