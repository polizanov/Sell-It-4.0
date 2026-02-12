export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    email: string;
    token?: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
}
