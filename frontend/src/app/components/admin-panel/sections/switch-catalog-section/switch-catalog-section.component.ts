import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { SwitchCatalog } from '../../../../models/catalog.model';
import { ConfirmDeleteButtonComponent } from '../../../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { SwitchFormModalComponent } from '../../modals/switch-form-modal/switch-form-modal.component';

@Component({
  selector: 'app-switch-catalog-section',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IconComponent, ConfirmDeleteButtonComponent, SwitchFormModalComponent],
  templateUrl: './switch-catalog-section.component.html',
  styleUrl: './switch-catalog-section.component.scss'
})
export class SwitchCatalogSectionComponent implements OnInit {
  public switches: SwitchCatalog[] = [];
  public loading = false;
  public searchText = '';
  public showForm = false;
  public editingSwitch: SwitchCatalog | null = null;

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSwitches();
  }

  get filteredSwitches(): SwitchCatalog[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.switches;
    return this.switches.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.standard.toLowerCase().includes(q) ||
      s.electrical.breakingCapacity.toLowerCase().includes(q)
    );
  }

  loadSwitches() {
    this.loading = true;
    this.adminService.getAllSwitches().subscribe({
      next: (list) => { this.switches = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  openNewForm() {
    this.editingSwitch = null;
    this.showForm = true;
  }

  editSwitch(sw: SwitchCatalog) {
    this.editingSwitch = sw;
    this.showForm = true;
  }

  saveSwitch(sw: SwitchCatalog) {
    if (this.editingSwitch) {
      this.adminService.updateSwitch(this.editingSwitch.id, sw).subscribe({
        next: (updated) => {
          const idx = this.switches.findIndex(s => s.id === updated.id);
          if (idx >= 0) this.switches[idx] = updated;
          this.showForm = false;
          this.editingSwitch = null;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    } else {
      this.adminService.createSwitch(sw).subscribe({
        next: (created) => {
          this.switches.push(created);
          this.showForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    }
  }

  deleteSwitch(sw: SwitchCatalog) {
    this.adminService.deleteSwitch(sw.id).subscribe({
      next: () => {
        this.switches = this.switches.filter(s => s.id !== sw.id);
        this.toast.success('Switch deleted.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }
}
