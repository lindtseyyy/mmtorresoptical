import api from "@/shared/lib/axiosInstance";
import type { PageResponse } from "@/shared/types";
import type { TransactionRequest, TransactionResponse, TransactionListItem } from "@/features/sales/types";

const createTransaction = async (data: TransactionRequest): Promise<TransactionResponse> => {
  const { data: response } = await api.post("/transactions", data);
  return response;
};

const fetchTransactions = async (
  page = 0,
  size = 10,
  productId?: string,
): Promise<PageResponse<TransactionListItem>> => {
  const { data } = await api.get("/transactions", {
    params: {
      page,
      size,
      sortBy: "transactionDate",
      sortOrder: "desc",
      ...(productId && { productId }),
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

export { createTransaction, fetchTransactions };
