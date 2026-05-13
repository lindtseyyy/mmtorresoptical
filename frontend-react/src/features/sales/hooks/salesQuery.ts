import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/features/inventory/services/productApi";
import { createTransaction } from "@/features/sales/services/transactionApi";
import type { TransactionRequest } from "@/features/sales/types";

const useProductsForSale = () =>
  useQuery({
    queryKey: ["products", "for-sale"],
    queryFn: () => fetchProducts(0, 200, undefined, undefined, "productName", "asc", undefined, "ACTIVE"),
    select: (data) => data.content,
    staleTime: 30_000,
  });

const useCreateTransaction = () => ({
  mutationKey: ["transactions", "create"],
  mutationFn: (data: TransactionRequest) => createTransaction(data),
});

export { useProductsForSale, useCreateTransaction };
