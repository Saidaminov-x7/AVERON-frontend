// Global types for the application

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export interface ApiListResponse<T> {
  data?: T[];
  items?: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
