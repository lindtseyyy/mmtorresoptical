import { z } from "zod";

export const userSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required").max(50),
  gender: z.enum(["Male", "Female", "Other"]),
  birthDate: z.string().min(1, "Birth date is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Must be at least 10 digits"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
  role: z.enum(["Admin", "Staff"]),
  isArchived: z.boolean().default(false),
});

export type UserFormData = z.infer<typeof userSchema>;

export interface User {
  userId: string;
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
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
