export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateRoleRequest {
  role: string;
}
