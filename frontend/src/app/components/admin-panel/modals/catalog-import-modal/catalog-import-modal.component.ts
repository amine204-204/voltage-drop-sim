import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AdminService } from '../../../../services/admin.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import {
  CatalogImportField,
  CatalogImportPreview,
  CatalogImportType,
  ImportCommitRequest,
  ImportRowResult
} from '../../../../models/import.model';

type ImportStep = 'pick' | 'mapping' | 'preview';

interface FieldGroup {
  label: string;
  fields: CatalogImportField[];
}

@Component({
  selector: 'app-catalog-import-modal',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, ModalComponent, IconComponent],
  templateUrl: './catalog-import-modal.component.html',
  styleUrl: './catalog-import-modal.component.scss'
})
export class CatalogImportModalComponent {
  @Input() type: CatalogImportType = 'CABLE';
  @Output() imported = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  public readonly MAX_PREVIEW_ROWS = 200;

  public step: ImportStep = 'pick';
  public selectedFile: File | null = null;
  public fields: CatalogImportField[] = [];
  public groups: FieldGroup[] = [];
  public headers: string[] = [];
  public mapping: Record<string, string> = {};
  public preview: CatalogImportPreview | null = null;
  public loading = false;
  public committing = false;
  public dragging = false;
  public errorMessage = '';

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  get title(): string {
    const label = this.type.charAt(0) + this.type.slice(1).toLowerCase();
    return `Import ${label}s`;
  }

  get isJson(): boolean {
    return !!this.selectedFile && this.selectedFile.name.toLowerCase().endsWith('.json');
  }

  get mappingComplete(): boolean {
    return this.fields.filter(f => f.required && !this.mapping[f.key]).length === 0;
  }

  get okRows(): ImportRowResult[] {
    return this.preview?.rows.filter(r => r.status === 'OK') ?? [];
  }

  get previewRows(): ImportRowResult[] {
    return this.preview?.rows.slice(0, this.MAX_PREVIEW_ROWS) ?? [];
  }

  get previewTruncated(): boolean {
    return !!this.preview && this.preview.rows.length > this.MAX_PREVIEW_ROWS;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.acceptFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave() {
    this.dragging = false;
  }

  validateAndPreview() {
    const mapping: Record<string, string> = {};
    for (const [key, column] of Object.entries(this.mapping)) {
      if (column && column.trim()) {
        mapping[key] = column.trim();
      }
    }
    this.loadPreview(mapping);
  }

  backToMapping() {
    this.step = 'mapping';
  }

  backFromPreview() {
    if (this.isJson) {
      this.backToPick();
    } else {
      this.backToMapping();
    }
  }

  backToPick() {
    this.step = 'pick';
    this.selectedFile = null;
    this.preview = null;
    this.mapping = {};
    this.headers = [];
    this.fields = [];
    this.groups = [];
    this.errorMessage = '';
  }

  commit() {
    if (!this.preview || this.okRows.length === 0) {
      return;
    }
    this.committing = true;
    const request: ImportCommitRequest = {
      type: this.type,
      items: this.okRows.map(r => r.data ?? {})
    };
    this.adminService.commitImport(request).subscribe({
      next: (result) => {
        this.committing = false;
        this.toast.success(`Imported ${result.imported} item(s). ${result.skipped} skipped.`);
        this.imported.emit();
        this.close.emit();
      },
      error: (err) => {
        this.committing = false;
        this.toast.error(getErrorMessage(err));
        this.cdr.detectChanges();
      }
    });
  }

  private acceptFile(file: File) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.json')) {
      this.selectedFile = file;
      this.errorMessage = '';
      this.loadPreview({});
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      this.selectedFile = file;
      this.errorMessage = '';
      this.loadHeadersThenFields();
    } else {
      this.toast.error('Unsupported file. Use .json, .xlsx or .xls.');
    }
  }

  private loadPreview(mapping: Record<string, string>) {
    if (!this.selectedFile) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.adminService.previewImport(this.type, this.selectedFile, mapping).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.loading = false;
        this.step = 'preview';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadHeadersThenFields() {
    if (!this.selectedFile) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getImportHeaders(this.selectedFile).subscribe({
      next: (res) => {
        this.headers = res.headers;
        this.mapping = {};
        this.loadFields();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadFields() {
    this.adminService.getImportFields(this.type).subscribe({
      next: (fields) => {
        this.fields = fields;
        this.groups = this.buildGroups(fields);
        this.loading = false;
        this.step = 'mapping';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  private buildGroups(fields: CatalogImportField[]): FieldGroup[] {
    const byGroup = new Map<string, CatalogImportField[]>();
    for (const field of fields) {
      const list = byGroup.get(field.group) ?? [];
      list.push(field);
      byGroup.set(field.group, list);
    }
    return [...byGroup.entries()].map(([label, items]) => ({ label, fields: items }));
  }
}
