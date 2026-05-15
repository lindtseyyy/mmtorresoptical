import type { Product, Product as ProductSummary } from "@/features/inventory/types";

export interface CartItem {
  uid: string;
  product: Product;
  quantity: number;
  discountType: "PERCENT" | "FIXED" | null;
  discountValue: number;
  isDiscounted: boolean;
}

export interface TransactionRequest {
  patientId?: string;
  amountTendered?: number;
  paymentMethod?: "CASH" | "GCASH";
  referenceNumber?: string;
  items: {
    productId: string;
    quantity: number;
    discountType?: "PERCENT" | "FIXED";
    discountValue?: number;
    isDiscounted: boolean;
  }[];
}

export interface PaymentResponse {
  id: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string | null;
  createdAt: string;
}

export interface PaymentRequest {
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  gcashPaymentImg?: string;
}

export interface RefundDetails {
  refundId: string;
  refundQuantity: number;
  refundReason: string;
  refundMethod: string;
  refundedAt: string;
  refundAmount: number;
  refundedBy: { userId: string; username: string; role: string; fullName: string } | null;
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
  refundDetailsDTOList?: RefundDetails[];
}

export interface TransactionResponse {
  transactionId: string;
  transactionNumber: string;
  transactionDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  completedAt: string | null;
  transactionStatus: string;
  createdBy: { id: string; fullName: string };
  patient: { id: string; fullName: string } | null;
  voidedBy?: { userId: string; username: string; role: string; fullName: string } | null;
  voidedAt?: string;
  voidReason?: string;
  transactionItems: TransactionItemResponse[];
  payments: PaymentResponse[];
}

export type RefundMethod = "CASH" | "GCASH";

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
  transactionDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  completedAt: string | null;
  transactionStatus: string;
  createdBy: { userId: string; username: string; role: string; fullName: string };
  patient: { patientId: string; fullName: string } | null;
}
