import { queryOptions } from "@tanstack/react-query";
import { fetchTransactions, fetchTransactionMetrics, fetchAccountsReceivable, fetchTransaction, fetchDailyCashInflow } from "@/features/sales/services/transactionApi";
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

function createDailyCashInflowQueryOptions() {
  return queryOptions({
    queryKey: ["daily-cash-inflow"],
    queryFn: fetchDailyCashInflow,
    staleTime: 60_000,
  });
}

export { createTransactionMetricsQueryOptions, createAccountsReceivableQueryOptions, createTransactionsListQueryOptions, createTransactionDetailQueryOptions, createDailyCashInflowQueryOptions };
