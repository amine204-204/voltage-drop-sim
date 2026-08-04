import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { ProjectReference } from '../../../../models/admin.model';

@Component({
  selector: 'app-catalog-references-modal',
  standalone: true,
  imports: [NgFor, NgIf, ModalComponent, IconComponent],
  templateUrl: './catalog-references-modal.component.html',
  styleUrl: './catalog-references-modal.component.scss'
})
export class CatalogReferencesModalComponent {
  @Input() itemName = '';
  @Input() itemType: 'cable' | 'transformer' | 'switch' | 'load preset' = 'cable';
  @Input() references: ProjectReference[] = [];
  @Output() close = new EventEmitter<void>();

  referenceWord(count: number): string {
    if (this.itemType === 'load preset') {
      return count === 1 ? 'load point' : 'load points';
    }
    return count === 1 ? 'branch' : 'branches';
  }
}
