import { queryOptions } from "@tanstack/react-query";
import { fetchTransactions, fetchTransactionMetrics, fetchAccountsReceivable, fetchTransaction, voidTransaction } from "@/features/sales/services/transactionApi";
import type { TransactionFilters } from "@/features/sales/services/transactionApi";

function createTransactionMetricsQueryOptions() {
  return queryOptions({
    queryKey: ["transaction-metrics"],
    queryFn: fetchTransactionMetrics,
    staleTime: 30_000,
  });
}

function createAccountsReceivableQueryOptions() {
  return queryOptions({
    queryKey: ["accounts-receivable"],
    queryFn: fetchAccountsReceivable,
    staleTime: 30_000,
  });
}

function createTransactionsListQueryOptions(filters: TransactionFilters = {}) {
  return queryOptions({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
  });
}

function createTransactionDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["transaction", id],
    queryFn: () => fetchTransaction(id),
    enabled: !!id,
  });
}

export { createTransactionMetricsQueryOptions, createAccountsReceivableQueryOptions, createTransactionsListQueryOptions, createTransactionDetailQueryOptions };
