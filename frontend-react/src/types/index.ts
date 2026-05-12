export interface LoginFormData {
  loginIdentifier: string;
  password: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}
