import api from "@/shared/lib/axiosInstance";
import type { PageResponse } from "@/shared/types";
import type { TransactionRequest, TransactionResponse, TransactionListItem } from "@/features/sales/types";

export interface TransactionMetrics {
  totalTransactions: number;
  totalRevenue: number;
  todayRevenue: number;
  todayTransactions: number;
  averageTransactionValue: number;
  totalTransactionsThisMonth: number;
}

export interface TransactionFilters {
  keyword?: string;
  minDate?: string;
  maxDate?: string;
  paymentType?: string;
  status?: string;
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
  if (rest.paymentType) params.paymentType = rest.paymentType;
  if (rest.status) params.status = rest.status;

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

const fetchTransaction = async (id: string): Promise<TransactionResponse> => {
  const { data } = await api.get(`/transactions/${id}`);
  return data;
};

const voidTransaction = async (id: string, reason: string): Promise<void> => {
  await api.post(`/transactions/${id}/void`, { reason });
};

export { createTransaction, fetchTransactions, fetchProductTransactions, fetchTransactionMetrics, fetchTransaction, voidTransaction };
