import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly API = '/api/profile';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.API);
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.API, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/password`, request);
  }

  getProfileById(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/${id}`);
  }

  updateProfileById(id: number, request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.API}/${id}`, request);
  }

  changePasswordById(id: number, request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/${id}/password`, request);
  }
}
