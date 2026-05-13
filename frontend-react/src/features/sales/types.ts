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
  paymentType: "CASH" | "GCASH";
  cashTender?: number;
  referenceNumber?: string;
  items: {
    productId: string;
    quantity: number;
    discountType?: "PERCENT" | "FIXED";
    discountValue?: number;
    isDiscounted: boolean;
  }[];
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
}

export interface TransactionResponse {
  transactionId: string;
  transactionDate: string;
  totalAmount: number;
  paymentType: string;
  referenceNumber: string;
  cashTender: number;
  change: number;
  transactionStatus: string;
  createdBy: { id: string; fullName: string };
  patient: { id: string; fullName: string } | null;
  transactionItems: TransactionItemResponse[];
}

export interface TransactionListItem {
  transactionId: string;
  transactionDate: string;
  totalAmount: number;
  paymentType: string;
  referenceNumber: string;
  gcashPaymentImgDir: string | null;
  cashTender: number;
  change: number;
  transactionStatus: string;
  createdBy: { userId: string; username: string; role: string; fullName: string };
  patient: { patientId: string; fullName: string } | null;
}
