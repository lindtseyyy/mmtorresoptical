import api from "@/shared/lib/axiosInstance";
import type { PageResponse } from "@/shared/types";
import type { TransactionRequest, TransactionResponse, TransactionListItem } from "@/features/sales/types";

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

const fetchTransactions = async (
  page = 0,
  size = 10,
): Promise<PageResponse<TransactionListItem>> => {
  const { data } = await api.get("/transactions", {
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

export { createTransaction, fetchTransactions, fetchProductTransactions };
