import { Component, Input } from '@angular/core';
import { NgSwitch, NgSwitchCase } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase],
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size" [attr.height]="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'pointer'">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        </ng-container>

        <ng-container *ngSwitchCase="'lightning'">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </ng-container>

        <ng-container *ngSwitchCase="'crosshair'">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v7M12 15v7M2 12h7M15 12h7"/>
        </ng-container>

        <ng-container *ngSwitchCase="'bar-chart'">
          <path d="M18 20V10"/>
          <path d="M12 20V4"/>
          <path d="M6 20v-6"/>
        </ng-container>

        <ng-container *ngSwitchCase="'cable'">
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="6" r="3"/>
          <path d="M6 15V6a3 3 0 0 1 3-3h6"/>
        </ng-container>

        <ng-container *ngSwitchCase="'transformer'">
          <circle cx="8" cy="12" r="4"/>
          <circle cx="16" cy="12" r="4"/>
        </ng-container>

        <ng-container *ngSwitchCase="'switch'">
          <circle cx="7" cy="12" r="2"/>
          <circle cx="17" cy="12" r="2"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
        </ng-container>

        <ng-container *ngSwitchCase="'document-grid'">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </ng-container>

        <ng-container *ngSwitchCase="'zoom-in'">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </ng-container>

        <ng-container *ngSwitchCase="'zoom-out'">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </ng-container>

        <ng-container *ngSwitchCase="'fit-to-screen'">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </ng-container>

        <ng-container *ngSwitchCase="'pencil'">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </ng-container>

        <ng-container *ngSwitchCase="'success'">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </ng-container>

        <ng-container *ngSwitchCase="'error'">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </ng-container>

        <ng-container *ngSwitchCase="'info'">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </ng-container>

        <ng-container *ngSwitchCase="'file-plus'">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </ng-container>

        <ng-container *ngSwitchCase="'save'">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </ng-container>

        <ng-container *ngSwitchCase="'file-down'">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M12 18v-6"/>
          <path d="M9 15l3 3 3-3"/>
        </ng-container>

        <ng-container *ngSwitchCase="'gear'">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </ng-container>

        <ng-container *ngSwitchCase="'trash'">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </ng-container>

        <ng-container *ngSwitchCase="'moon'">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </ng-container>

        <ng-container *ngSwitchCase="'sun'">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </ng-container>

        <ng-container *ngSwitchCase="'arrow-left'">
          <path d="M19 12H5"/>
          <polyline points="12 19 5 12 12 5"/>
        </ng-container>

        <ng-container *ngSwitchCase="'trash-simple'">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </ng-container>

        <ng-container *ngSwitchCase="'upload'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </ng-container>

        <ng-container *ngSwitchCase="'download'">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </ng-container>

        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </ng-container>

        <ng-container *ngSwitchCase="'users'">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </ng-container>

        <ng-container *ngSwitchCase="'play'">
          <polygon points="6 3 20 12 6 21 6 3"/>
        </ng-container>

        <ng-container *ngSwitchCase="'pause'">
          <rect x="14" y="4" width="4" height="16" rx="1"/>
          <rect x="6" y="4" width="4" height="16" rx="1"/>
        </ng-container>

        <ng-container *ngSwitchCase="'skip-back'">
          <polygon points="19 20 9 12 19 4 19 20"/>
          <line x1="5" y1="19" x2="5" y2="5"/>
        </ng-container>

        <ng-container *ngSwitchCase="'skip-forward'">
          <polygon points="5 4 15 12 5 20 5 4"/>
          <line x1="19" y1="5" x2="19" y2="19"/>
        </ng-container>

        <ng-container *ngSwitchCase="'rewind'">
          <polygon points="11 19 2 12 11 5 11 19"/>
          <polygon points="22 19 13 12 22 5 22 19"/>
        </ng-container>

        <ng-container *ngSwitchCase="'fast-forward'">
          <polygon points="13 19 22 12 13 5 13 19"/>
          <polygon points="2 19 11 12 2 5 2 19"/>
        </ng-container>

        <ng-container *ngSwitchCase="'repeat'">
          <polyline points="17 1 21 5 17 9"/>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </ng-container>

        <ng-container *ngSwitchCase="'activity'">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: number = 16;
}
