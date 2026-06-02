import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import AggregatedFinancialSummary from "@/features/reports/components/transaction/AggregatedFinancialSummary";
import AgingAccountsReceivable from "@/features/reports/components/transaction/AgingAccountsReceivable";
import TransactionCharts from "@/features/reports/components/transaction/TransactionCharts";
import type { TransactionHierarchicalReportDataset } from "@/features/reports/types";

const MIN_DATE_LOCAL = "2020-01-01";
const TODAY = new Date().toISOString().slice(0, 10);

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
  return (
    <div className="space-y-8">
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
              max={maxDate || TODAY}
              value={minDate}
              onChange={(e) => {
                const val = e.target.value;
                if (!maxDate || val <= maxDate) {
                  onMinDateChange(val);
                }
              }}
              className="w-auto"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              min={minDate || MIN_DATE_LOCAL}
              max={TODAY}
              value={maxDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val <= TODAY && (!minDate || val >= minDate)) {
                  onMaxDateChange(val);
                }
              }}
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
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          Aging Accounts Receivable
          ═══════════════════════════════════════════════════════════ */}
      <AgingAccountsReceivable />

      {/* ═══════════════════════════════════════════════════════════
          12-Month Trend Charts
          ═══════════════════════════════════════════════════════════ */}
      <TransactionCharts />
    </div>
  );
};

export default TransactionReport;
