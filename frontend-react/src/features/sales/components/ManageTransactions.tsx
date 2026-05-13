import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Receipt,
  Banknote,
  Calendar,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  createTransactionsListQueryOptions,
  createTransactionMetricsQueryOptions,
} from "@/features/sales/hooks/transactionQuery";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState("transactionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
      paymentType: paymentTypeFilter !== "all" ? paymentTypeFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sortBy,
      sortOrder,
    }),
    placeholderData: keepPreviousData,
  });

  const transactions = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, paymentTypeFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (transactions.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [transactions.length, page, isFetching]);

  const paymentTypeLabel = (pt: string) =>
    pt === "CASH" ? "Cash" : pt === "GCASH" ? "GCash" : pt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Transactions</h2>
          <p className="text-muted-foreground">
            View and manage all transactions.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics?.totalTransactions ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {metrics != null ? formatCurrency(metrics.totalRevenue) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {metrics != null ? formatCurrency(metrics.averageTransactionValue) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Average Transaction Value</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/10">
              <Calendar className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics?.totalTransactionsThisMonth ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Total Transactions This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10">
              <Receipt className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics?.todayTransactions ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Transactions Today</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500/10">
              <Banknote className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {metrics != null ? formatCurrency(metrics.todayRevenue) : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
            </div>
          </CardContent>
        </Card>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="VOIDED">Voided</SelectItem>
                    <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
                    <SelectItem value="FULLY_REFUNDED">Fully Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Payment:</span>
                <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="GCASH">GCash</SelectItem>
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
                      <th className="w-[16%] py-3 pr-4 font-medium">Transaction Number</th>
                      <th className="w-[13%] py-3 pr-4 text-center font-medium">Total Amount</th>
                      <th className="w-[12%] py-3 pr-4 text-center font-medium">Payment Type</th>
                      <th className="w-[14%] py-3 pr-4 text-center font-medium">Status</th>
                      <th className="w-[17%] py-3 pr-4 text-center font-medium">Transaction Date</th>
                      <th className="w-[16%] py-3 pr-4 font-medium">Processed By</th>
                      <th className="w-[8%] py-3 pl-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: TransactionListItem) => (
                      <tr
                        key={tx.transactionId}
                        className="border-b transition-colors hover:bg-muted"
                      >
                        <td className="py-3 pr-4">
                          <span className="block truncate font-medium">
                                                        {tx.transactionId.substring(0, 8)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="block truncate">
                            {formatCurrency(tx.totalAmount)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="block truncate">{paymentTypeLabel(tx.paymentType)}</span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Badge
                            className={
                              tx.transactionStatus === "COMPLETED"
                                ? "bg-green-700 text-white"
                                : tx.transactionStatus === "VOIDED"
                                  ? "bg-red-700 text-white"
                                  : tx.transactionStatus === "PARTIALLY_REFUNDED"
                                    ? "bg-amber-700 text-white"
                                    : "bg-gray-600 text-white"
                            }
                          >
                            {tx.transactionStatus.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-center text-muted-foreground">
                          <span className="block truncate">{formatDateTime(tx.transactionDate)}</span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{tx.createdBy.fullName}</span>
                        </td>
                        <td className="py-3 pl-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 shrink-0 p-0 [&_svg]:size-auto focus-visible:ring-0">
                                <MoreHorizontal className="h-8 w-8" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/transactions/${tx.transactionId}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
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
    </div>
  );
};

export default ManageTransactions;
