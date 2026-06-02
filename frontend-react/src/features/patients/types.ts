import { z } from "zod";

export const patientSchema = z.object({
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
  contactNumber: z.string().min(10, "Must be at least 10 digits").max(15, "Contact number must not exceed 15 characters"),
  address: z.string().min(1, "Address is required").max(255),
  medicalHistory: z.string().optional(),
  isArchived: z.boolean().default(false),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export interface Patient {
  patientId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  sex: string;
  contactNumber: string;
  email: string;
  birthDate: string;
  address: string;
  medicalHistory?: string | null;
  isArchived: boolean;
  createdAt: string;
}
