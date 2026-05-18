import api from "@/shared/lib/axiosInstance";
import type { PageResponse } from "@/shared/types";
import type { TransactionRequest, TransactionResponse, TransactionListItem, PaymentResponse, PaymentRequest, ItemRefundResponse } from "@/features/sales/types";

export interface AgingReceivable {
  transactionId: string;
  transactionNumber: string;
  transactionDate: string;
  customerName: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  daysOutstanding: number;
}

export interface TransactionMetrics {
  totalTransactions: number;
  totalRevenue: number;
  todayRevenue: number;
  todayTransactions: number;
  averageTransactionValue: number;
  totalTransactionsThisMonth: number;
  totalRefundedAmount: number;
  todayTotalRefundedAmount: number;
  totalRefundedAmountThisMonth: number;
  todayTotalVoidedAmount: number;
  totalAccountsReceivable: number;
  awaitingPickupCount: number;
}

export interface TransactionFilters {
  keyword?: string;
  minDate?: string;
  maxDate?: string;
  status?: string;
  refundStatus?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortOrder?: string;
}

const createTransaction = async (data: TransactionRequest): Promise<TransactionResponse> => {
  const { data: response } = await api.post("/transactions", data);
  return response;
};

const fetchProductTransactions = async (
  productId: string,
  page = 0,
  size = 10,
): Promise<PageResponse<TransactionListItem>> => {
  const { data } = await api.get(`/products/${productId}/transactions`, {
    params: {
      page,
      size,
      sortBy: "transactionDate",
      sortOrder: "desc",
    },
  });
  const pg = data.page;
  return {
    content: data.content,
    totalPages: pg.totalPages,
    totalElements: pg.totalElements,
    size: pg.size,
    number: pg.number,
  };
};

const fetchTransactions = async (filters: TransactionFilters = {}): Promise<PageResponse<TransactionListItem>> => {
  const { page = 0, size = 10, sortBy = "transactionDate", sortOrder = "desc", ...rest } = filters;
  const params: Record<string, unknown> = { page, size, sortBy, sortOrder };
  if (rest.keyword) params.keyword = rest.keyword;
  if (rest.minDate) params.minDate = rest.minDate;
  if (rest.maxDate) params.maxDate = rest.maxDate;
  if (rest.status) params.status = rest.status;
  if (rest.refundStatus) params.refundStatus = rest.refundStatus;

  const { data } = await api.get("/transactions", { params });
  const pg = data.page;
  return {
    content: data.content,
    totalPages: pg.totalPages,
    totalElements: pg.totalElements,
    size: pg.size,
    number: pg.number,
  };
};

const fetchTransactionMetrics = async (): Promise<TransactionMetrics> => {
  const { data } = await api.get("/transactions/metrics");
  return data;
};

const fetchAccountsReceivable = async (): Promise<AgingReceivable[]> => {
  const { data } = await api.get("/transactions/accounts-receivable");
  return data;
};

const fetchTransaction = async (id: string): Promise<TransactionResponse> => {
  const { data } = await api.get(`/transactions/${id}`);
  return data;
};

const voidTransaction = async (id: string, reason: string, password: string): Promise<void> => {
  await api.post(`/transactions/${id}/void`, { reason, password });
};

const refundTransaction = async (data: {
  items: { transactionItemId: string; refundQuantity: number; refundReason: string }[];
  refundMethod: string;
}): Promise<ItemRefundResponse> => {
  const { data: response } = await api.post("/transactions/refund", data);
  return response;
};

const addPayment = async (transactionId: string, data: PaymentRequest): Promise<PaymentResponse> => {
  const { data: response } = await api.post(`/transactions/${transactionId}/payments`, data);
  return response;
};

const fetchPayments = async (transactionId: string): Promise<PaymentResponse[]> => {
  const { data } = await api.get(`/transactions/${transactionId}/payments`);
  return data;
};

const completeTransaction = async (transactionId: string): Promise<TransactionResponse> => {
  const { data } = await api.post(`/transactions/${transactionId}/complete`);
  return data;
};

export { createTransaction, fetchTransactions, fetchProductTransactions, fetchTransactionMetrics, fetchAccountsReceivable, fetchTransaction, voidTransaction, refundTransaction, addPayment, fetchPayments, completeTransaction };
