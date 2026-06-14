import type { Product, Product as ProductSummary } from "@/features/inventory/types";

export interface CartItem {
  uid: string;
  product: Product;
  quantity: number;
  discountType: "PERCENT" | "FIXED" | null;
  discountValue: number;
  isDiscounted: boolean;
  savedManualDiscountType?: "PERCENT" | "FIXED" | null;
  savedManualDiscountValue?: number;
  isSeniorPwdRateActive?: boolean;
  isSeniorPwdProcessed?: boolean;
  seniorPwdDiscountAmount?: number;
}

export interface TransactionRequest {
  patientId?: string;
  prescriptionId?: string;
  estimatedReadyDate?: string;
  amountTendered?: number;
  paymentMethod?: "CASH" | "GCASH";
  gcashNumber?: string;
  referenceNumber?: string;
  seniorPwdName?: string;
  seniorPwdAddress?: string;
  seniorPwdIdNumber?: string;
  seniorPwdType?: string;
  items: {
    productId: string;
    quantity: number;
    discountType?: "PERCENT" | "FIXED";
    discountValue?: number;
    isDiscounted: boolean;
    seniorPwdDiscountAmount?: number;
  }[];
}

export interface PaymentResponse {
  id: string;
  amount: number;
  paymentMethod: string;
  gcashNumber: string | null;
  referenceNumber: string | null;
  createdAt: string;
}

export interface PaymentRequest {
  amount: number;
  paymentMethod: string;
  gcashNumber?: string;
  referenceNumber?: string;
  gcashPaymentImg?: string;
}

export interface RefundItemData {
  refundItemId: string;
  productName: string;
  unitPrice: number;
  quantityRefunded: number;
  refundReason: string;
  itemCreditAmount: number;
}

export interface RefundReceiptData {
  refundReceiptId: string;
  receiptNumber: string;
  actualCashback: number;
  refundMethod: string;
  gcashNumber?: string;
  referenceNumber?: string;
  createdAt: string;
  issuedByFullName: string;
  refundItems: RefundItemData[];
}

export interface BatchAllocation {
  productBatchId: number;
  batchNumber: string;
  quantityDeducted: number;
}

export interface TransactionItemResponse {
  transactionItemId: string;
  product: ProductSummary;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isDiscounted: boolean;
  discountType: string;
  discountValue: number;
  refundedQuantity: number;
  refundNotes: string;
  refundReason?: string;
  seniorPwdDiscountAmount?: number;
  batchAllocations?: BatchAllocation[];
}

export interface TransactionResponse {
  transactionId: string;
  transactionNumber: string;
  transactionDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  change: number;
  completedAt: string | null;
  estimatedReadyDate: string | null;
  itemCount: number;
  transactionStatus: string;
  refundStatus: string;
  fulfillmentStatus: string;
  createdBy: { id: string; fullName: string };
  patient: { id: string; fullName: string } | null;
  voidedBy?: { userId: string; username: string; role: string; fullName: string } | null;
  voidedAt?: string;
  voidReason?: string;
  prescriptionId?: string | null;
  rxNumber?: string | null;
  seniorPwdName?: string;
  seniorPwdAddress?: string;
  seniorPwdIdNumber?: string;
  isSeniorPwdApplied?: boolean;
  transactionItems: TransactionItemResponse[];
  payments: PaymentResponse[];
  refundReceipts: RefundReceiptData[];
}

export type RefundMethod = "CASH" | "GCASH" | "BALANCE_ADJUSTMENT";

export interface RefundStateItem {
  transactionItemId: string;
  productName: string;
  unitPrice: number;
  maxQuantity: number;
  refundQuantity: number;
  refundReason: string;
  discountType: string | null;
  discountValue: number;
  isDiscounted: boolean;
  originalQuantity: number;
}

export interface TransactionListItem {
  transactionId: string;
  transactionNumber: string;
  referenceNumber: string;
  transactionDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  completedAt: string | null;
  estimatedReadyDate: string | null;
  transactionStatus: string;
  refundStatus: string;
  fulfillmentStatus: string;
  itemCount: number;
  paymentType: string;
  createdBy: { userId: string; username: string; role: string; fullName: string };
  patient: { patientId: string; fullName: string } | null;
}

export interface RefundReceiptSummary {
  refundReceiptId: string;
  receiptNumber: string;
  cashReturnedAmount: number;
  refundMethod?: string;
  gcashNumber?: string;
  referenceNumber?: string;
  dateIssued: string;
  issuedByFullName: string;
}

export interface RefundedItemSummary {
  productName: string;
  unitPrice: number;
  refundQuantity: number;
}

export interface ItemRefundResponse {
  originalTotal: number;
  newOrderTotal: number;
  amountPaid: number;
  cashToReturn: number;
  newRemainingDue: number;
  newTransactionStatus: string;
  newRefundStatus: string;
  refundReceipt: RefundReceiptSummary;
  refundedItems: RefundedItemSummary[];
}

export interface SelectedPatient {
  patientId: string;
  fullName: string;
  contactNumber: string;
}
