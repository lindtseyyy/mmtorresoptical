// src/types.ts
import {z} from "zod"

// Form data for the Login page
export interface LoginFormData {
  loginIdentifier: string;
  password: string;
}

export const productSchema = z.object({
  productName: z.string().min(1, "Required"),
  category: z.enum([
    "eyeglasses",
    "frames",
    "lens",
    "goggles",
    "prisms",
    "eyedrop",
    "sunglasses",
  ]),
  supplier: z.string().min(1, "Required"),
  unitPrice: z.number().min(0, "Price must be positive"),
  quantity: z.number().int().min(0, "Quantity must be positive"),
  lowLevelThreshold: z.number().int().min(0, "Must be positive"),
  overstockedThreshold: z.number().int().min(0, "Must be positive"),
  isArchived: z.boolean(),
  imageDir: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// This is the type for data coming from your Spring Boot API
export interface Product {
  productId: string; // From Spring (UUID)
  productName: string;
  category: string;
  supplier: string;
  unitPrice: number;
  quantity: number;
  lowLevelThreshold: number;
  overstockedThreshold: number;
  isArchived: boolean;
  imageDir: string | null;
  dateAdded: string; // From Spring (OffsetDateTime)
}

// Data structure for the product search filters
export interface ProductSearchFilters {
  query: string;
  category: string; // Can be '' for 'All'
  stockLevel: string; // Can be '' for 'All'
}

// --- NEW USER SCHEMA ---
// This schema matches your backend DTO and reference
export const userSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  middleName: z.string().optional(), // Make middle name optional
  lastName: z.string().min(1, "Last name is required").max(50),
  gender: z.enum(["Male", "Female", "Other"]),
  birthDate: z.string().min(1, "Birth date is required"), // React Hook Form handles date string
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Must be at least 10 digits"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  
  // Special handling for edit vs. add
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  
  role: z.enum(["Admin", "Staff"]),
  isArchived: z.boolean().default(false),
});

// This is the type for your form
export type UserFormData = z.infer<typeof userSchema>;

// This is the type for data from your Spring Boot API
export interface User {
  userId: string; // From Spring (UUID)
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  birthDate: string; // ISO date string
  email: string;
  contactNumber: string;
  role: "Admin" | "Staff";
  isArchived: boolean;
  createdAt: string; // From Spring (OffsetDateTime)
}