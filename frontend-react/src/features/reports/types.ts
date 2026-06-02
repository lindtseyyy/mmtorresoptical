// ── Shared ────────────────────────────────────────────────────────────

export interface ReportMetadata {
  generatedAt: string;
  generatedBy: string;
  reportType: "INVENTORY_ANALYTICS" | "TRANSACTIONS" | "PATIENTS";
  title: string;
}

// ── Product DTOs (used in inventory reports) ──────────────────────────

export interface ProductDetailsDTO {
  productId: string;
  productName: string;
  imageDir: string | null;
  categoryName: string;
  supplierName: string;
  unitPrice: number;
  quantity: number;
  productType: "PHYSICAL" | "SERVICE";
  lowLevelThreshold: number;
  overstockedThreshold: number;
  isArchived: boolean;
  createdAt: string;
}

export interface TopSellingProductDTO {
  productId: string;
  productName: string;
  categoryName: string;
  unitPrice: number;
  totalSold: number;
  totalRevenue: number;
}

// ── Inventory Analytics ───────────────────────────────────────────────

export interface ComprehensiveInventoryReportDataset {
  metadata: ReportMetadata;
  totalInventoryValue: number;
  totalLowStockCount: number;
  totalOverstockCount: number;
  lowStockProducts: ProductDetailsDTO[];
  overstockProducts: ProductDetailsDTO[];
  topSellingProducts: TopSellingProductDTO[];
}

// ── Patient Report ────────────────────────────────────────────────────

export interface AgeGroupStat {
  groupLabel: string;
  count: number;
}

export interface PatientGrowthPoint {
  month: string;
  count: number;
}

export interface PatientReportDataset {
  metadata: ReportMetadata;
  minDate: string | null;
  maxDate: string | null;
  overallReport: boolean;
  totalPatients: number;
  activePatients: number;
  archivedPatients: number;
  newPatientsInPeriod: number;
  maleCount: number;
  femaleCount: number;
  ageGroupDistribution: AgeGroupStat[];
  totalVisits: number;
  completedVisits: number;
  missedOrCancelledVisits: number;
  patientGrowthTrend: PatientGrowthPoint[];
}

// ── Transaction Report ────────────────────────────────────────────────

export interface TransactionReportSummary {
  totalCount: number;
  totalAmount: number;
  completedCount: number;
  completedAmount: number;
  voidedCount: number;
  voidedAmount: number;
  refundedCount: number;
  refundedAmount: number;
}

export interface TransactionItemEntry {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountType: "PERCENT" | "FIXED" | null;
  discountValue: number | null;
  refundedQuantity: number | null;
  refundReason: string | null;
  refundAmount: number | null;
  actualCashBack: number | null;
}

export interface PaymentMethodEntry {
  amount: number;
  paymentMethod: string;
  gcashNumber: string | null;
  referenceNumber: string | null;
  createdAt: string;
}

export interface TransactionEntry {
  id: string;
  transactionNumber: string;
  date: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  refundStatus: string;
  customerName: string | null;
  cashierName: string;
  voidReason: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  items: TransactionItemEntry[];
  payments: PaymentMethodEntry[];
}

export interface TransactionHierarchicalReportDataset {
  metadata: ReportMetadata;
  minDate: string;
  maxDate: string;
  summary: TransactionReportSummary;
  statusGroups: Record<string, TransactionEntry[]>;
  emptyMessage: string;
}

// ── Chart data types ───────────────────────────────────────────────────

export interface CategoryBreakdownDTO {
  categoryName: string;
  productCount: number;
  totalValue: number;
}

export interface InventoryValueTrendPoint {
  month: string;
  value: number;
}

// ── Transaction monthly trend ────────────────────────────────────────

export interface TransactionMonthlyTrendPoint {
  month: string;
  transactionCount: number;
  netRevenue: number;
}

// ── Union type for report data ────────────────────────────────────────

export type ReportData =
  | ComprehensiveInventoryReportDataset
  | PatientReportDataset
  | TransactionHierarchicalReportDataset;
