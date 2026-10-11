import { Component } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';
import { IconComponent } from '../shared/icon/icon.component';
import { UsersSectionComponent } from './sections/users-section/users-section.component';
import { StandardsSectionComponent } from './sections/standards-section/standards-section.component';
import { CableCatalogSectionComponent } from './sections/cable-catalog-section/cable-catalog-section.component';
import { TransformerCatalogSectionComponent } from './sections/transformer-catalog-section/transformer-catalog-section.component';
import { SwitchCatalogSectionComponent } from './sections/switch-catalog-section/switch-catalog-section.component';
import { LoadPresetsSectionComponent } from './sections/load-presets-section/load-presets-section.component';
import { ProjectsSectionComponent } from './sections/projects-section/projects-section.component';

type SectionId = 'cables' | 'transformers' | 'switches' | 'loadPresets' | 'users' | 'standards' | 'projects';

interface SidebarGroup {
  label: string;
  items: { id: SectionId; label: string; icon: string }[];
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    PageHeaderComponent,
    IconComponent,
    UsersSectionComponent,
    StandardsSectionComponent,
    CableCatalogSectionComponent,
    TransformerCatalogSectionComponent,
    SwitchCatalogSectionComponent,
    LoadPresetsSectionComponent,
    ProjectsSectionComponent
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent {
  public activeSection: SectionId = 'cables';

  public groups: SidebarGroup[] = [
    {
      label: 'Catalog',
      items: [
        { id: 'cables', label: 'Cables', icon: 'cable' },
        { id: 'transformers', label: 'Transformers', icon: 'transformer' },
        { id: 'switches', label: 'Switches', icon: 'switch' },
        { id: 'loadPresets', label: 'Load Presets', icon: 'activity' }
      ]
    },
    {
      label: 'Administration',
      items: [
        { id: 'users', label: 'Users', icon: 'users' },
        { id: 'standards', label: 'Compliance Standards', icon: 'bar-chart' },
        { id: 'projects', label: 'Projects', icon: 'file-plus' }
      ]
    }
  ];

  switchSection(id: SectionId) {
    this.activeSection = id;
  }
}
