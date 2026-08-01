import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { TransformerCatalog } from '../../../../models/catalog.model';
import { ConfirmDeleteButtonComponent } from '../../../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { TransformerFormModalComponent } from '../../modals/transformer-form-modal/transformer-form-modal.component';

@Component({
  selector: 'app-transformer-catalog-section',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, IconComponent, ConfirmDeleteButtonComponent, TransformerFormModalComponent],
  templateUrl: './transformer-catalog-section.component.html',
  styleUrl: './transformer-catalog-section.component.scss'
})
export class TransformerCatalogSectionComponent implements OnInit {
  public transformers: TransformerCatalog[] = [];
  public loading = false;
  public searchText = '';
  public showForm = false;
  public editingTransformer: TransformerCatalog | null = null;

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTransformers();
  }

  get filteredTransformers(): TransformerCatalog[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.transformers;
    return this.transformers.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.standard.toLowerCase().includes(q)
    );
  }

  loadTransformers() {
    this.loading = true;
    this.adminService.getAllTransformers().subscribe({
      next: (list) => { this.transformers = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  openNewForm() {
    this.editingTransformer = null;
    this.showForm = true;
  }

  editTransformer(transformer: TransformerCatalog) {
    this.editingTransformer = transformer;
    this.showForm = true;
  }

  saveTransformer(transformer: TransformerCatalog) {
    if (this.editingTransformer) {
      this.adminService.updateTransformer(this.editingTransformer.id, transformer).subscribe({
        next: (updated) => {
          const idx = this.transformers.findIndex(t => t.id === updated.id);
          if (idx >= 0) this.transformers[idx] = updated;
          this.showForm = false;
          this.editingTransformer = null;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    } else {
      this.adminService.createTransformer(transformer).subscribe({
        next: (created) => {
          this.transformers.push(created);
          this.showForm = false;
          this.cdr.detectChanges();
        },
        error: (err) => this.toast.error(getErrorMessage(err))
      });
    }
  }

  deleteTransformer(transformer: TransformerCatalog) {
    this.adminService.deleteTransformer(transformer.id).subscribe({
      next: () => {
        this.transformers = this.transformers.filter(t => t.id !== transformer.id);
        this.toast.success('Transformer deleted.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }
}
