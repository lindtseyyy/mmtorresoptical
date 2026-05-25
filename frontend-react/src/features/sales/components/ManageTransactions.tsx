import { useState, useEffect, useRef } from "react";
import { useSessionState } from "@/shared/hooks/useSessionState";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUp,
  ArrowDown,
  CreditCard,
  ShoppingCart,
  PackageOpen,
} from "lucide-react";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import {
  createTransactionsListQueryOptions,
  createTransactionMetricsQueryOptions,
} from "@/features/sales/hooks/transactionQuery";
import EmptyTableRows from "@/shared/components/EmptyTableRows";
import AddPaymentDrawer from "@/features/sales/components/AddPaymentDrawer";
import { addPayment } from "@/features/sales/services/transactionApi";
import type { TransactionListItem } from "@/features/sales/types";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number) =>
  `₱ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAGE_SIZE = 10;

const ManageTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useSessionState("transactions:searchQuery", "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useSessionState("transactions:statusFilter", "all");
  const [page, setPage] = useSessionState("transactions:page", 0);
  const [sortBy, setSortBy] = useSessionState("transactions:sortBy", "transactionDate");
  const [sortOrder, setSortOrder] = useSessionState<"asc" | "desc">("transactions:sortOrder", "desc");
  const [dateFrom, setDateFrom] = useSessionState("transactions:dateFrom", "");
  const [dateTo, setDateTo] = useSessionState("transactions:dateTo", "");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: metrics } = useQuery(createTransactionMetricsQueryOptions());

  const { data: pageData, isLoading, isFetching } = useQuery({
    ...createTransactionsListQueryOptions({
      page,
      size: PAGE_SIZE,
      keyword: debouncedSearchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sortBy,
      sortOrder,
      minDate: dateFrom || undefined,
      maxDate: dateTo || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const queryClient = useQueryClient();

  // Payment drawer state
  const [paymentDrawerTx, setPaymentDrawerTx] = useState<TransactionListItem | null>(null);

  const addPaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; paymentMethod: string; referenceNumber?: string } }) =>
      addPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-metrics"] });
      toast.success("Payment added successfully");
      setPaymentDrawerTx(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Payment failed");
    },
  });

  const transactions = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setPage(0);
  }, [debouncedSearchQuery, statusFilter, sortBy, sortOrder, dateFrom, dateTo]);

  useEffect(() => {
    if (transactions.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [transactions.length, page, isFetching]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Sales and Transactions</h2>
          <p className="text-muted-foreground">
            View and manage all sales and transactions.
          </p>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={ShoppingCart} label="Today's Transactions" value={metrics?.todayTransactions ?? "—"} color="blue" />
        <MetricCard icon={CreditCard} label="Deposits Awaiting Settlement" value={metrics?.depositsPendingCount ?? "—"} color="amber" />
        <MetricCard icon={PackageOpen} label="Orders Ready for Pickup" value={metrics?.awaitingPickupCount ?? "—"} color="violet" />
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactionDate">Date</SelectItem>
                    <SelectItem value="totalAmount">Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Date Range:</span>
                <Input
                  type="date"
                  value={dateFrom}
                  max={today}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDateFrom(v);
                    if (dateTo && v && dateTo < v) setDateTo("");
                  }}
                  className="w-[150px]"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  max={today}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-[150px]"
                />
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="text-xs text-muted-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="VOIDED">Voided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[14%] py-3 pr-4 text-left font-medium">Transaction Date</th>
                      <th className="w-[16%] py-3 pr-4 font-medium">Transaction Number</th>
                      <th className="w-[10%] py-3 pr-4 text-left font-medium">Financial</th>
                      <th className="w-[10%] py-3 pr-4 text-left font-medium">Fulfillment</th>
                      <th className="w-[9%] py-3 pr-4 text-left font-medium">Refund</th>
                      <th className="w-[10%] py-3 pr-4 text-right font-medium">Total Amount</th>
                      <th className="w-[8%] py-3 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: TransactionListItem) => (
                      <tr
                        key={tx.transactionId}
                        className="border-b transition-colors hover:bg-muted"
                      >
                        <td className="py-3 pr-4 text-left text-muted-foreground">
                          <span className="block truncate">{formatDateTime(tx.transactionDate)}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="block truncate font-medium">
                            {tx.transactionNumber}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-left">
                          <StatusBadge status={tx.transactionStatus} />
                        </td>
                        <td className="py-3 pr-4 text-left">
                          <StatusBadge status={tx.fulfillmentStatus} />
                        </td>
                        <td className="py-3 pr-4 text-left">
                          {tx.refundStatus !== "NONE" ? (
                            <StatusBadge status={tx.refundStatus} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className="block truncate">
                            {formatCurrency(tx.totalAmount)}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <EmptyTableRows
                      count={PAGE_SIZE - (transactions?.length ?? 0)}
                      colSpan={7}
                      className="h-[57px]"
                    />
                  </tbody>
                </table>
              </div>

              {transactions.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No transactions found.
                </p>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Drawer */}
      <AddPaymentDrawer
        open={!!paymentDrawerTx}
        onClose={() => setPaymentDrawerTx(null)}
        transactionNumber={paymentDrawerTx?.transactionNumber ?? ""}
        totalAmount={paymentDrawerTx?.totalAmount ?? 0}
        balanceDue={paymentDrawerTx?.balanceDue ?? 0}
        onComplete={(data) => {
          if (paymentDrawerTx) {
            addPaymentMutation.mutate({ id: paymentDrawerTx.transactionId, data });
          }
        }}
        pending={addPaymentMutation.isPending}
      />
    </div>
  );
};

export default ManageTransactions;
