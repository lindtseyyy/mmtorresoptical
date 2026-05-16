import { Receipt, Banknote, Calendar, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import TransactionRow from "@/features/reports/components/transaction/TransactionRow";
import TransactionLifecycleChart from "@/features/reports/components/transaction/TransactionLifecycleChart";
import type { TransactionHierarchicalReportDataset } from "@/features/reports/types";
import type { TransactionMetrics } from "@/features/sales/services/transactionApi";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

interface TransactionReportProps {
  report: TransactionHierarchicalReportDataset;
  transactionMetrics?: TransactionMetrics;
}

const TransactionReport: React.FC<TransactionReportProps> = ({ report, transactionMetrics }) => (
  <div className="space-y-6">
    {/* Historical Metric Cards */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard
        icon={Receipt}
        label="Total Sales & Transactions"
        value={number(report.summary.totalCount)}
        color="primary"
        size="sm"
      />
      <MetricCard
        icon={Banknote}
        label="Total Revenue"
        value={currency(report.summary.totalAmount)}
        color="emerald"
        size="sm"
      />
      <MetricCard
        icon={Calendar}
        label="Sales & Transactions This Month"
        value={transactionMetrics?.totalTransactionsThisMonth ?? "—"}
        color="violet"
        size="sm"
      />
      <MetricCard
        icon={Undo2}
        label="Total Refunded Amount"
        value={transactionMetrics != null ? currency(transactionMetrics.totalRefundedAmount) : "—"}
        color="red"
        size="sm"
      />
      <MetricCard
        icon={Undo2}
        label="Refunded Amount This Month"
        value={transactionMetrics?.totalRefundedAmountThisMonth != null ? currency(transactionMetrics.totalRefundedAmountThisMonth) : "—"}
        color="yellow"
        size="sm"
      />
    </div>

    {/* Donut Chart — Transaction Lifecycle Breakdown */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transaction Lifecycle Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionLifecycleChart summary={report.summary} />
      </CardContent>
    </Card>

    {/* Status Group Lists */}
    {Object.keys(report.statusGroups).length === 0 ? (
      <p className="text-center text-muted-foreground py-8">{report.emptyMessage}</p>
    ) : (
      Object.entries(report.statusGroups).map(([status, entries]) => (
        <Card key={status}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={status} />
              <CardTitle className="text-base">
                {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </CardTitle>
              <span className="text-sm text-muted-foreground">({entries.length})</span>
            </div>
          </CardHeader>
          <CardContent>
            {entries.map((entry) => (
              <TransactionRow key={entry.id} entry={entry} />
            ))}
          </CardContent>
        </Card>
      ))
    )}
  </div>
);

export default TransactionReport;
