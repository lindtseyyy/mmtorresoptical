import api from "@/shared/lib/axiosInstance";
import type { TransactionRequest, TransactionResponse } from "@/features/sales/types";

const createTransaction = async (data: TransactionRequest): Promise<TransactionResponse> => {
  const { data: response } = await api.post("/transactions", data);
  return response;
};

export { createTransaction };
