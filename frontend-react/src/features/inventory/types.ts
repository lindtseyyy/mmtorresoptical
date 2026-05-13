import { z } from "zod";

const decimalString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^(?:\d+\.?\d*|\d*\.\d+)$/, `${label} must be a valid number`)
    .refine((value) => Number(value) >= 0, {
      message: `${label} cannot be negative`,
    });

const integerString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must be a whole number`)
    .refine((value) => Number(value) >= 0, {
      message: `${label} cannot be negative`,
    });

export const productFormSchema = z
  .object({
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
    unitPrice: decimalString("Unit price"),
    quantity: integerString("Quantity"),
    lowLevelThreshold: integerString("Low stock threshold"),
    overstockedThreshold: integerString("Overstock threshold"),
    isArchived: z.boolean(),
    imageDir: z.string().optional(),
  })
  .refine(
    (data) => Number(data.overstockedThreshold) > Number(data.lowLevelThreshold),
    {
      message: "Overstock threshold must be greater than low stock threshold",
      path: ["overstockedThreshold"],
    }
  );

export const productSchema = productFormSchema.transform((data) => ({
  ...data,
  unitPrice: Number(data.unitPrice),
  quantity: Number(data.quantity),
  lowLevelThreshold: Number(data.lowLevelThreshold),
  overstockedThreshold: Number(data.overstockedThreshold),
}));

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFormData = z.infer<typeof productSchema>;

export interface Product {
  productId: string;
  productName: string;
  category: string;
  supplier: string;
  unitPrice: number;
  quantity: number;
  lowLevelThreshold: number;
  overstockedThreshold: number;
  isArchived: boolean;
  imageDir: string | null;
  createdAt: string;
}

export interface ProductSearchFilters {
  query: string;
  category: string;
  stockLevel: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockQuantity: number;
  inventoryValue: number;
  countLowStockProducts: number;
  countOverstockedProducts: number;
  countArchivedProducts: number;
}

export interface ProductMetrics {
  totalUnitsSold: number;
  totalRevenue: number;
  numberOfTransactions: number;
  lastSoldDate: string | null;
}
