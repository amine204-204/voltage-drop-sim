import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../../services/project.service';
import { ToastService } from '../../../../services/toast.service';
import { getErrorMessage } from '../../../../shared/utils/error.utils';
import { ProjectSummary } from '../../../../models/project.model';
import { ConfirmDeleteButtonComponent } from '../../../shared/confirm-delete-button/confirm-delete-button.component';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-projects-section',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule, IconComponent, ConfirmDeleteButtonComponent],
  templateUrl: './projects-section.component.html',
  styleUrl: './projects-section.component.scss'
})
export class ProjectsSectionComponent implements OnInit {
  public projects: ProjectSummary[] = [];
  public loading = false;
  public searchText = '';

  constructor(
    private projectService: ProjectService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProjects();
  }

  get filteredProjects(): ProjectSummary[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.projects;
    return this.projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  }

  loadProjects() {
    this.loading = true;
    this.projectService.getProjects().subscribe({
      next: (list) => { this.projects = list; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { this.loading = false; this.toast.error(getErrorMessage(err)); this.cdr.detectChanges(); }
    });
  }

  deleteProject(project: ProjectSummary) {
    this.projectService.deleteProject(project.id).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== project.id);
        this.toast.success('Project deleted.');
        this.cdr.detectChanges();
      },
      error: (err) => this.toast.error(getErrorMessage(err))
    });
  }
}
