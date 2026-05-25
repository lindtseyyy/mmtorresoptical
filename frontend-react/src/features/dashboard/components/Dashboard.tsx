import {
  PackageOpen,
  CircleDollarSign,
  AlertTriangle,
  Banknote,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  ArrowRight,
  Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MetricCard } from "@/shared/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { createInventorySummaryQueryOptions, createRopAlertsCountQueryOptions } from "@/features/inventory/hooks/productQuery";
import {
  createTransactionMetricsQueryOptions,
  createDailyCashInflowQueryOptions,
  createTransactionsListQueryOptions,
} from "@/features/sales/hooks/transactionQuery";
import type { TransactionListItem } from "@/features/sales/types";
import {
  createDashboardPatientMetricsQueryOptions,
  createDailyPatientArrivalsQueryOptions,
} from "@/features/patients/hooks/patientQuery";
import DailyRevenueChart from "@/features/dashboard/components/DailyRevenueChart";
import DailyPatientChart from "@/features/dashboard/components/DailyPatientChart";

const formatCurrency = (amount: number) =>
  `₱ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

function StatChip({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value ?? "—"}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: inventorySummary } = useQuery(
    createInventorySummaryQueryOptions()
  );
  const { data: metrics } = useQuery(createTransactionMetricsQueryOptions());
  const { data: patientMetrics } = useQuery(
    createDashboardPatientMetricsQueryOptions()
  );
  const { data: dailyArrivals } = useQuery(
    createDailyPatientArrivalsQueryOptions()
  );
  const { data: dailyCashInflow } = useQuery(
    createDailyCashInflowQueryOptions()
  );
  const { data: ropAlerts } = useQuery(
    createRopAlertsCountQueryOptions()
  );
  const { data: recentTransactions } = useQuery(
    createTransactionsListQueryOptions({ size: 10 })
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of clinic operations at a glance.
        </p>
      </div>

      {/* Hero Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Today's Revenue */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
              <CircleDollarSign className="h-4 w-4 text-emerald-700" />
            </div>
            <p className="text-xs font-medium text-emerald-800">
              Today&apos;s Revenue
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">
            {metrics?.todayRevenue != null
              ? formatCurrency(metrics.todayRevenue)
              : "—"}
          </p>
        </div>

        {/* Orders Awaiting Pickup */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
              <PackageOpen className="h-4 w-4 text-amber-700" />
            </div>
            <p className="text-xs font-medium text-amber-800">
              Orders Awaiting Pickup
            </p>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">
            {metrics?.awaitingPickupCount ?? "—"}
          </p>
        </div>

        {/* Needs Reordering */}
        <div
          onClick={() => navigate("/inventory")}
          className={`rounded-xl border p-4 shadow-sm cursor-pointer transition-colors hover:opacity-90 ${
            (ropAlerts?.count ?? 0) > 0
              ? "border-orange-200 bg-orange-50"
              : "border-muted bg-card"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                (ropAlerts?.count ?? 0) > 0 ? "bg-orange-100" : "bg-muted"
              }`}>
                <AlertTriangle className={`h-4 w-4 ${
                  (ropAlerts?.count ?? 0) > 0 ? "text-orange-700" : "text-muted-foreground"
                }`} />
              </div>
              <p className={`text-xs font-medium ${
                (ropAlerts?.count ?? 0) > 0 ? "text-orange-800" : "text-muted-foreground"
              }`}>
                Needs Reordering
              </p>
            </div>
            <ArrowRight className={`h-4 w-4 ${
              (ropAlerts?.count ?? 0) > 0 ? "text-orange-700" : "text-muted-foreground"
            }`} />
          </div>
          <p className={`mt-2 text-2xl font-bold ${
            (ropAlerts?.count ?? 0) > 0 ? "text-orange-900" : "text-foreground"
          }`}>
            {ropAlerts?.count ?? "—"}
          </p>
        </div>
      </div>

      {/* Financial Micro-Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={Banknote}
          label="Active Inventory"
          value={
            inventorySummary != null
              ? formatCurrency(inventorySummary.inventoryValue)
              : "—"
          }
          color="emerald"
          size="sm"
          labelPosition="top"
        />
        <MetricCard
          icon={Clock}
          label="Receivables"
          value={
            metrics != null
              ? formatCurrency(metrics.totalAccountsReceivable)
              : "—"
          }
          color="amber"
          size="sm"
          labelPosition="top"
        />
        <MetricCard
          icon={DollarSign}
          label="Revenue MTD"
          value={
            metrics?.monthlyNetRevenue != null
              ? formatCurrency(metrics.monthlyNetRevenue)
              : "—"
          }
          color="emerald"
          size="sm"
          labelPosition="top"
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg. Transaction"
          value={
            metrics?.averageTransactionValue != null
              ? formatCurrency(metrics.averageTransactionValue)
              : "—"
          }
          color="violet"
          size="sm"
          labelPosition="top"
        />
      </div>

      {/* Dual-Chart Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">
                Daily Revenue
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardHeader>
          <CardContent>
            <DailyRevenueChart data={dailyCashInflow ?? []} />
          </CardContent>
        </Card>

        {/* Daily Patient Arrivals Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">
                Daily Patient Arrivals
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <DailyPatientChart data={dailyArrivals ?? []} />

            <div className="flex flex-wrap gap-3 border-t pt-4">
              <StatChip
                color="bg-blue-500"
                label="Active"
                value={patientMetrics?.totalActivePatients}
              />
              <StatChip
                color="bg-emerald-500"
                label="New"
                value={patientMetrics?.newPatientsThisMonth}
              />
              <StatChip
                color="bg-amber-500"
                label="Follow-ups"
                value={patientMetrics?.pendingFollowUps}
              />
              <StatChip
                color="bg-violet-500"
                label="Seen"
                value={patientMetrics?.patientsSeenThisMonth}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              Recent Transactions
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/transactions")}
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
              <col className="w-1/5" />
            </colgroup>
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left font-medium px-5 py-2">Date</th>
                <th className="text-left font-medium px-5 py-2">Transaction #</th>
                <th className="text-right font-medium px-3 py-2">Items</th>
                <th className="text-right font-medium px-5 py-2">Amount</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {recentTransactions?.content.map((tx: TransactionListItem) => (
                <tr
                  key={tx.transactionId}
                  className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-5 py-2.5 text-left text-muted-foreground tabular-nums">
                    {formatDateTime(tx.transactionDate)}
                  </td>
                  <td className="px-5 py-2.5 font-medium">
                    {tx.transactionNumber}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    —
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    {formatCurrency(tx.totalAmount)}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/transactions/${tx.transactionId}`)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
