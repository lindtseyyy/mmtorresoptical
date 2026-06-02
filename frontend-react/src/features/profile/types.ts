import { z } from "zod";

export const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100)
    .regex(/^[\p{L}\s.'-]+$/u, "Names can only contain letters, spaces, hyphens, periods, and apostrophes."),
  middleName: z
    .string()
    .max(100)
    .optional()
    .refine(
      (val) => val === undefined || val === "" || /^[\p{L}\s.'-]+$/u.test(val),
      "Names can only contain letters, spaces, hyphens, periods, and apostrophes."
    ),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100)
    .regex(/^[\p{L}\s.'-]+$/u, "Names can only contain letters, spaces, hyphens, periods, and apostrophes."),
  sex: z.enum(["Male", "Female"]),
  birthDate: z.string().min(1, "Birth date is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().regex(/^09\d{9}$/, "Must start with 09 and be exactly 11 digits"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, "Password must contain at least one special character"),
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
