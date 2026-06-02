import { z } from "zod";

// ── Category types ─────────────────────────────────────────────────

export interface CategoryDTO {
  categoryId: string;
  name: string;
  categoryType: "PHYSICAL" | "SERVICE";
}

export interface CategoryWithProductCountDTO {
  categoryId: string;
  name: string;
  categoryType: "PHYSICAL" | "SERVICE";
  isActive: boolean;
  productCount: number;
}

// ── Supplier types ─────────────────────────────────────────────────

export interface SupplierDTO {
  supplierId: string;
  name: string;
}

export interface SupplierWithProductCountDTO {
  supplierId: string;
  name: string;
  isActive: boolean;
  productCount: number;
}

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
    productName: z.string().min(1, "Name is required"),
    categoryId: z.string().uuid().optional(),
    newCategoryName: z.string().optional(),
    supplierId: z.string().uuid().optional(),
    newSupplierName: z.string().optional(),
    productType: z.enum(["PHYSICAL", "SERVICE"]),
    unitPrice: decimalString("Unit price"),
    quantity: z.string().optional(),
    lowLevelThreshold: z.string().optional(),
    overstockedThreshold: z.string().optional(),
    leadTimeDays: z.string().optional(),
    isArchived: z.boolean(),
    imageDir: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.categoryId && (!data.newCategoryName || data.newCategoryName.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category is required",
        path: ["categoryId"],
      });
    }

    if (data.productType !== "PHYSICAL") return;

    if (!data.supplierId && (!data.newSupplierName || data.newSupplierName.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Supplier is required",
        path: ["supplierId"],
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

    if (!data.leadTimeDays || data.leadTimeDays.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lead time is required",
        path: ["leadTimeDays"],
      });
    } else if (!/^\d+$/.test(data.leadTimeDays) || Number(data.leadTimeDays) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lead time must be a non-negative whole number",
        path: ["leadTimeDays"],
      });
    }
  });

// ── Transform (form values → submission payload) ────────────────────

export const productSchema = productFormSchema.transform((data) => ({
  productName: data.productName,
  categoryId: data.categoryId || undefined,
  newCategoryName: data.newCategoryName || undefined,
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
  leadTimeDays:
    data.productType === "SERVICE" ? 0 : Number(data.leadTimeDays || "3"),
  supplierId: data.productType === "SERVICE" ? undefined : (data.supplierId || undefined),
  newSupplierName: data.productType === "SERVICE" ? undefined : (data.newSupplierName || undefined),
  productType: data.productType,
  isArchived: data.isArchived,
  imageDir: data.imageDir,
}));

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductFormData = z.infer<typeof productSchema>;

// ── API types ───────────────────────────────────────────────────────

export interface Product {
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  quantity: number;
  productType: "PHYSICAL" | "SERVICE";
  lowLevelThreshold: number;
  overstockedThreshold: number;
  leadTimeDays: number;
  reorderPoint: number | null;
  suggestedOrderQuantity: number | null;
  isArchived: boolean;
  imageDir: string | null;
  createdAt: string;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  imageDir: string;
  categoryId: string;
  categoryName: string;
  supplierId: string;
  supplierName: string;
  productType: string;
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
  countReorderNeededProducts: number;
  countOutOfStockProducts: number;
  countArchivedProducts: number;
  archivedInventoryValue: number;
  countArchivedWithStock: number;
}

export interface ProductMetrics {
  totalUnitsSold: number;
  totalRevenue: number;
  numberOfTransactions: number;
  lastSoldDate: string | null;
}
