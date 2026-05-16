import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import TransactionRow from "@/features/reports/components/transaction/TransactionRow";
import type { TransactionHierarchicalReportDataset } from "@/features/reports/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

interface TransactionReportProps {
  report: TransactionHierarchicalReportDataset;
}

const TransactionReport: React.FC<TransactionReportProps> = ({ report }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{number(report.summary.totalCount)}</p>
          <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.totalAmount)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">{number(report.summary.completedCount)}</p>
          <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.completedAmount)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Voided</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">{number(report.summary.voidedCount)}</p>
          <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.voidedAmount)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Refunded</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-purple-600">{number(report.summary.refundedCount)}</p>
          <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.refundedAmount)}</p>
        </CardContent>
      </Card>
    </div>

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
