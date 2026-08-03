import { Component, Input, ChangeDetectorRef, HostListener } from '@angular/core';
import { NgIf } from '@angular/common';
import { AdminService } from '../../../../services/admin.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { CatalogImportType } from '../../../../models/import.model';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-catalog-export-buttons',
  standalone: true,
  imports: [NgIf, IconComponent],
  templateUrl: './catalog-export-buttons.component.html',
  styleUrl: './catalog-export-buttons.component.scss'
})
export class CatalogExportButtonsComponent {
  @Input() type: CatalogImportType = 'CABLE';

  public menuOpen = false;
  public exporting = false;

  constructor(
    private adminService: AdminService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.menuOpen && !(event.target as HTMLElement).closest('app-catalog-export-buttons')) {
      this.menuOpen = false;
    }
  }

  openMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  exportTo(format: 'json' | 'excel') {
    if (this.exporting) {
      return;
    }
    this.exporting = true;
    this.menuOpen = false;
    this.adminService.exportCatalog(this.type, format).subscribe({
      next: (blob) => {
        this.exporting = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.type.toLowerCase()}-catalog.${format === 'excel' ? 'xlsx' : 'json'}`;
        a.click();
        URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.exporting = false;
        this.toast.error(getErrorMessage(err));
        this.cdr.detectChanges();
      }
    });
  }
}