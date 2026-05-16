import { useMemo } from "react";
import { Receipt, Banknote, Calendar, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { MetricCard } from "@/shared/components/MetricCard";
import AggregatedFinancialSummary from "@/features/reports/components/transaction/AggregatedFinancialSummary";
import VoidedRefundedLog from "@/features/reports/components/transaction/VoidedRefundedLog";
import AgingAccountsReceivable from "@/features/reports/components/transaction/AgingAccountsReceivable";
import type { TransactionHierarchicalReportDataset, TransactionEntry } from "@/features/reports/types";
import type { TransactionMetrics } from "@/features/sales/services/transactionApi";

const MIN_DATE_LOCAL = "2020-01-01";
const MAX_DATE_LOCAL = "2099-12-31";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

interface TransactionReportProps {
  report: TransactionHierarchicalReportDataset;
  transactionMetrics?: TransactionMetrics;
  minDate: string;
  maxDate: string;
  onMinDateChange: (value: string) => void;
  onMaxDateChange: (value: string) => void;
}

const VOIDED_REFUNDED_KEYS = ["VOIDED", "PARTIALLY_REFUNDED", "FULLY_REFUNDED"];

const TransactionReport: React.FC<TransactionReportProps> = ({
  report,
  transactionMetrics,
  minDate,
  maxDate,
  onMinDateChange,
  onMaxDateChange,
}) => {
  const voidedRefundedEntries = useMemo<TransactionEntry[]>(() => {
    const entries: TransactionEntry[] = [];
    for (const key of VOIDED_REFUNDED_KEYS) {
      if (report.statusGroups[key]) {
        entries.push(...report.statusGroups[key]);
      }
    }
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [report.statusGroups]);

  const netRevenue = useMemo(() => {
    const agg = (key: string) => {
      const entries = report.statusGroups[key];
      if (!entries) return 0;
      return entries.reduce((sum, e) => sum + e.totalAmount, 0);
    };
    const refundAgg = (key: string) => {
      const entries = report.statusGroups[key];
      if (!entries) return 0;
      return entries.reduce((sum, e) => {
        const refunded = e.items.reduce((s, item) => s + (item.refundAmount ?? 0), 0);
        return sum + refunded;
      }, 0);
    };
    const paidAgg = (key: string) => {
      const entries = report.statusGroups[key];
      if (!entries) return 0;
      return entries.reduce((sum, e) => sum + e.amountPaid, 0);
    };
    const gross =
      agg("COMPLETED") + agg("PAID") + paidAgg("PARTIALLY_PAID") + agg("PENDING");
    const deductions =
      agg("VOIDED") + refundAgg("FULLY_REFUNDED") + refundAgg("PARTIALLY_REFUNDED") + agg("PENDING");
    return gross - deductions;
  }, [report.statusGroups]);

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════
          Overview — Monthly & Lifetime Performance (ignores date picker)
          ═══════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={Calendar}
              label="Sales & Transactions This Month"
              value={transactionMetrics?.totalTransactionsThisMonth ?? "—"}
              color="violet"
              size="sm"
            />
            <MetricCard
              icon={Undo2}
              label="Refunded Amount This Month"
              value={transactionMetrics?.totalRefundedAmountThisMonth != null ? currency(transactionMetrics.totalRefundedAmountThisMonth) : "—"}
              color="yellow"
              size="sm"
            />
            <MetricCard
              icon={Undo2}
              label="Total Refunded Amount"
              value={transactionMetrics != null ? currency(transactionMetrics.totalRefundedAmount) : "—"}
              color="red"
              size="sm"
            />
          </div>

          <AgingAccountsReceivable />
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          Date Range — Filtered Analytics (responds to date picker)
          ═══════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm font-medium text-muted-foreground">Date Range:</span>
            <Input
              type="date"
              min={MIN_DATE_LOCAL}
              max={MAX_DATE_LOCAL}
              value={minDate}
              onChange={(e) => onMinDateChange(e.target.value)}
              className="w-auto"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              min={MIN_DATE_LOCAL}
              max={MAX_DATE_LOCAL}
              value={maxDate}
              onChange={(e) => onMaxDateChange(e.target.value)}
              className="w-auto"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              value={currency(netRevenue)}
              color="emerald"
              size="sm"
            />
          </div>

          <AggregatedFinancialSummary
            statusGroups={report.statusGroups}
            minDate={report.minDate}
            maxDate={report.maxDate}
          />

          <VoidedRefundedLog entries={voidedRefundedEntries} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionReport;
