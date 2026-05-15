import { z } from "zod";

// ── Category constants ──────────────────────────────────────────────

export const PHYSICAL_CATEGORIES = [
  "eyeglasses",
  "frames",
  "lens",
  "goggles",
  "prisms",
  "eyedrop",
  "sunglasses",
] as const;

export const SERVICE_CATEGORIES = [
  "clinical_services",
  "lens_fitting",
] as const;

const ALL_CATEGORY_VALUES = [
  ...PHYSICAL_CATEGORIES,
  ...SERVICE_CATEGORIES,
] as unknown as [string, ...string[]];

export type PhysicalCategory = (typeof PHYSICAL_CATEGORIES)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type Category = PhysicalCategory | ServiceCategory;

export const CATEGORY_LABELS: Record<Category, string> = {
  eyeglasses: "Eyeglasses",
  frames: "Frames",
  lens: "Lens",
  goggles: "Goggles",
  prisms: "Prisms",
  eyedrop: "Eyedrop",
  sunglasses: "Sunglasses",
  clinical_services: "Clinical Services",
  lens_fitting: "Lens Fitting",
};

// ── Field validators ────────────────────────────────────────────────

const decimalString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^(?:\d+\.?\d*|\d*\.\d+)$/, `${label} must be a valid number`)
    .refine((value) => Number(value) >= 0, {
      message: `${label} cannot be negative`,
    });

// ── Form schema ─────────────────────────────────────────────────────

export const productFormSchema = z
  .object({
    productName: z.string().min(1, "Required"),
    category: z.enum(ALL_CATEGORY_VALUES),
    supplier: z.string().optional(),
    productType: z.enum(["PHYSICAL", "SERVICE"]),
    unitPrice: decimalString("Unit price"),
    quantity: z.string().optional(),
    lowLevelThreshold: z.string().optional(),
    overstockedThreshold: z.string().optional(),
    isArchived: z.boolean(),
    imageDir: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.productType !== "PHYSICAL") return;

    if (!data.supplier || data.supplier.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Supplier is required",
        path: ["supplier"],
      });
    }

    if (!data.quantity || data.quantity.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantity is required",
        path: ["quantity"],
      });
    } else if (!/^\d+$/.test(data.quantity) || Number(data.quantity) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantity must be a non-negative whole number",
        path: ["quantity"],
      });
    }

    if (
      !data.lowLevelThreshold ||
      data.lowLevelThreshold.trim().length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Low stock threshold is required",
        path: ["lowLevelThreshold"],
      });
    }

    if (
      !data.overstockedThreshold ||
      data.overstockedThreshold.trim().length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Overstock threshold is required",
        path: ["overstockedThreshold"],
      });
    }

    if (
      data.lowLevelThreshold &&
      data.overstockedThreshold &&
      /^\d+$/.test(data.lowLevelThreshold) &&
      /^\d+$/.test(data.overstockedThreshold) &&
      Number(data.overstockedThreshold) <= Number(data.lowLevelThreshold)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Overstock threshold must be greater than low stock threshold",
        path: ["overstockedThreshold"],
      });
    }
  });

// ── Transform (form values → submission payload) ────────────────────

export const productSchema = productFormSchema.transform((data) => ({
  ...data,
  unitPrice: Number(data.unitPrice),
  quantity:
    data.productType === "SERVICE" ? 0 : Number(data.quantity || "0"),
  lowLevelThreshold:
    data.productType === "SERVICE"
      ? 0
      : Number(data.lowLevelThreshold || "0"),
  overstockedThreshold:
    data.productType === "SERVICE"
      ? 0
      : Number(data.overstockedThreshold || "0"),
  supplier: data.productType === "SERVICE" ? "In-House" : (data.supplier || ""),
}));

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFormData = z.infer<typeof productSchema>;

// ── API types ───────────────────────────────────────────────────────

export interface Product {
  productId: string;
  productName: string;
  category: string;
  supplier: string;
  unitPrice: number;
  quantity: number;
  productType: "PHYSICAL" | "SERVICE";
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
