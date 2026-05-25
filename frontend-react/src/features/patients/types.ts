import { z } from "zod";

export const patientSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50)
    .refine((val) => !/\d/.test(val), "Name must not contain numbers"),
  middleName: z
    .string()
    .max(50)
    .optional()
    .refine(
      (val) => val === undefined || val === "" || !/\d/.test(val),
      "Name must not contain numbers"
    ),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50)
    .refine((val) => !/\d/.test(val), "Name must not contain numbers"),
  sex: z.enum(["Male", "Female"]),
  birthDate: z.string().min(1, "Birth date is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Must be at least 10 digits"),
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
