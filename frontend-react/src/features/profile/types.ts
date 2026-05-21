import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required").max(50),
  sex: z.enum(["Male", "Female"]),
  birthDate: z.string().min(1, "Birth date is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Must be at least 10 digits"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const securityQuestionSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  securityQuestion: z.string().min(1, "Security question is required"),
  securityAnswer: z.string().min(3, "Security answer must be at least 3 characters"),
});

export type SecurityQuestionFormData = z.infer<typeof securityQuestionSchema>;

export interface UserProfile {
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  sex: string;
  birthDate: string;
  email: string;
  contactNumber: string;
  username: string;
  role: string;
  isArchived: boolean;
  isPwChangeRequired: boolean;
  securityQuestion: string;
  createdAt: string;
}
