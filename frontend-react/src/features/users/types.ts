import { z } from "zod";

export const userSchema = z.object({
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
  birthDate: z.string().min(1, "Birth date is required").refine((val) => {
    const birth = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 18;
  }, "Must be at least 18 years old"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().regex(/^09\d{9}$/, "Must start with 09 and be exactly 11 digits"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, "Password must contain at least one special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
  role: z.enum(["Admin", "Staff"]),
  isArchived: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type UserFormData = z.infer<typeof userSchema>;

export interface User {
  userId: string;
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  sex: string;
  birthDate: string;
  email: string;
  contactNumber: string;
  role: "Admin" | "Staff";
  isArchived: boolean;
  isPwChangeRequired: boolean;
  createdAt: string;
}

export interface UserSummary {
  totalUsers: number;
  activeUsers: number;
  archivedUsers: number;
  adminUsers: number;
  staffUsers: number;
}
