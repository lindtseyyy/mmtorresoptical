export interface LoginFormData {
  loginIdentifier: string;
  password: string;
}

export interface ForgotPasswordEmailFormData {
  email: string;
}

export interface ForgotPasswordAnswerFormData {
  securityAnswer: string;
}

export interface ForgotPasswordResetFormData {
  newPassword: string;
  confirmPassword: string;
}
