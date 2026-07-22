export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface UpdateProfileRequest {
  username: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
