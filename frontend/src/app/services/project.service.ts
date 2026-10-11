import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectSummary } from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = '/api/projects';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<ProjectSummary[]> {
    return this.http.get<ProjectSummary[]>(this.apiUrl);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  createProject(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  updateProject(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}/export`);
  }

  importProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/import`, project);
  }
}
