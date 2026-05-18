import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import AggregatedFinancialSummary from "@/features/reports/components/transaction/AggregatedFinancialSummary";
import VoidedRefundedLog from "@/features/reports/components/transaction/VoidedRefundedLog";
import AgingAccountsReceivable from "@/features/reports/components/transaction/AgingAccountsReceivable";
import TransactionCharts from "@/features/reports/components/transaction/TransactionCharts";
import type { TransactionHierarchicalReportDataset, TransactionEntry } from "@/features/reports/types";

const MIN_DATE_LOCAL = "2020-01-01";
const MAX_DATE_LOCAL = "2099-12-31";

interface TransactionReportProps {
  report: TransactionHierarchicalReportDataset;
  minDate: string;
  maxDate: string;
  onMinDateChange: (value: string) => void;
  onMaxDateChange: (value: string) => void;
}

const TransactionReport: React.FC<TransactionReportProps> = ({
  report,
  minDate,
  maxDate,
  onMinDateChange,
  onMaxDateChange,
}) => {
  const voidedRefundedEntries = useMemo<TransactionEntry[]>(() => {
    const entries: TransactionEntry[] = [];
    // Voided transactions (payment_status = VOIDED)
    if (report.statusGroups["VOIDED"]) {
      entries.push(...report.statusGroups["VOIDED"]);
    }
    // Refunded transactions (refundStatus = ADJUSTED or RETURNED)
    for (const group of Object.values(report.statusGroups)) {
      for (const entry of group) {
        if (
          entry.refundStatus === "PARTIAL" ||
          entry.refundStatus === "FULL"
        ) {
          // Avoid double-counting if already added as VOIDED
          if (!entries.some((e) => e.id === entry.id)) {
            entries.push(entry);
          }
        }
      }
    }
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return entries;
  }, [report.statusGroups]);

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════════════
          12-Month Trend Charts
          ═══════════════════════════════════════════════════════════ */}
      <TransactionCharts />

      {/* ═══════════════════════════════════════════════════════════
          Date Range — Filtered Analytics
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
          <AggregatedFinancialSummary
            statusGroups={report.statusGroups}
            minDate={report.minDate}
            maxDate={report.maxDate}
          />

          <VoidedRefundedLog entries={voidedRefundedEntries} />
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          Aging Accounts Receivable
          ═══════════════════════════════════════════════════════════ */}
      <AgingAccountsReceivable />
    </div>
  );
};

export default TransactionReport;
