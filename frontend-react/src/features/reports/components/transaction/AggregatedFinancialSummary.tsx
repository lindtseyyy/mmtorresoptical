import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { TransactionEntry } from "@/features/reports/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

interface StatusAggregate {
  count: number;
  totalValue: number;
}

function aggregate(
  statusGroups: Record<string, TransactionEntry[]>,
  key: string,
): StatusAggregate {
  const entries = statusGroups[key];
  if (!entries || entries.length === 0) return { count: 0, totalValue: 0 };
  return {
    count: entries.length,
    totalValue: entries.reduce((sum, e) => sum + e.totalAmount, 0),
  };
}

function paidAggregate(
  statusGroups: Record<string, TransactionEntry[]>,
  key: string,
): StatusAggregate {
  const entries = statusGroups[key];
  if (!entries || entries.length === 0) return { count: 0, totalValue: 0 };
  return {
    count: entries.length,
    totalValue: entries.reduce((sum, e) => sum + e.amountPaid, 0),
  };
}

function refundDeductionAggregate(
  statusGroups: Record<string, TransactionEntry[]>,
): StatusAggregate {
  let count = 0;
  let totalValue = 0;
  for (const entries of Object.values(statusGroups)) {
    for (const e of entries) {
      if (
        e.refundStatus === "ADJUSTED" ||
        e.refundStatus === "RETURNED"
      ) {
        count++;
        totalValue += e.items.reduce((sum, item) => sum + (item.refundAmount ?? 0), 0);
      }
    }
  }
  return { count, totalValue };
}

const formatDate = (raw: string) => {
  const [y, m, d] = raw.split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface AggregatedFinancialSummaryProps {
  statusGroups: Record<string, TransactionEntry[]>;
  minDate: string;
  maxDate: string;
}

const AggregatedFinancialSummary: React.FC<AggregatedFinancialSummaryProps> = ({
  statusGroups,
  minDate,
  maxDate,
}) => {
  const completed = aggregate(statusGroups, "COMPLETED");
  const paid = aggregate(statusGroups, "PAID");
  const partiallyPaid = paidAggregate(statusGroups, "DEPOSIT");
  const voided = aggregate(statusGroups, "VOIDED");
  const refunded = refundDeductionAggregate(statusGroups);

  // Inflow subtotals
  const grossCount =
    completed.count +
    paid.count +
    partiallyPaid.count;
  const grossValue =
    completed.totalValue +
    paid.totalValue +
    partiallyPaid.totalValue;

  // Deduction subtotals
  const deductionCount =
    voided.count + refunded.count;
  const deductionValue =
    voided.totalValue +
    refunded.totalValue;

  // Bottom metrics
  const totalTransactions = grossCount + voided.count;
  const netActiveTransactions = grossCount;
  const netRevenue = grossValue - deductionValue;

  return (
    <Card>
      <CardHeader className="bg-muted">
        <CardTitle className="text-base">
          Aggregated Financial Summary ({formatDate(minDate)} – {formatDate(maxDate)})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <tbody>
            {/* ═══ A. Inflow Section ═══ */}
            <tr className="border-b bg-muted/50">
              <td colSpan={3} className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inflow
              </td>
            </tr>
            <InflowRow label="Completed" agg={completed} />
            <InflowRow label="Paid" agg={paid} />
            <InflowRow label="Deposit" agg={partiallyPaid} />
            <SubtotalRow label="Gross Total" agg={{ count: grossCount, totalValue: grossValue }} />

            {/* ═══ B. Spacer ═══ */}
            <tr className="h-4" />

            {/* ═══ C. Deduction Section ═══ */}
            <tr className="border-b bg-muted/50">
              <td colSpan={3} className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Deductions
              </td>
            </tr>
            <DeductionRow label="Voided" agg={voided} />
            <DeductionRow label="Refunded" agg={refunded} />
            <SubtotalRow
              label="Total Deductions"
              agg={{ count: deductionCount, totalValue: deductionValue }}
              isDeduction
            />

            {/* ═══ D. Spacer ═══ */}
            <tr className="h-4" />

            {/* ═══ E. Bottom Summary Metrics ═══ */}
            <tr className="border-b">
              <td className="py-3 pl-6 pr-4 text-muted-foreground">Total Transactions</td>
              <td className="py-3 pr-4 text-right font-medium">{number(totalTransactions)}</td>
              <td className="py-3 pr-6" />
            </tr>
            <tr className="border-b">
              <td className="py-3 pl-6 pr-4 text-muted-foreground">Net Active Transactions</td>
              <td className="py-3 pr-4 text-right font-medium">{number(netActiveTransactions)}</td>
              <td className="py-3 pr-6" />
            </tr>
            <tr className="bg-blue-100">
              <td className="py-3 pl-6 pr-4 font-bold text-blue-900">Net Revenue</td>
              <td className="py-3 pr-6 text-right" />
              <td className="py-3 pr-6 text-right text-lg font-bold text-blue-700">
                {currency(netRevenue)}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

// ── Row helpers ──────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  agg: StatusAggregate;
}

const InflowRow: React.FC<RowProps> = ({ label, agg }) => (
  <tr className="border-b hover:bg-muted/50">
    <td className="py-2.5 pl-6 pr-4 text-muted-foreground">{label}</td>
    <td className="py-2.5 pr-4 text-right">{number(agg.count)}</td>
    <td className="py-2.5 pr-6 text-right">{currency(agg.totalValue)}</td>
  </tr>
);

const DeductionRow: React.FC<RowProps> = ({ label, agg }) => (
  <tr className="border-b hover:bg-muted/50">
    <td className="py-2.5 pl-6 pr-4 text-muted-foreground">{label}</td>
    <td className="py-2.5 pr-4 text-right text-red-600">{number(agg.count)}</td>
    <td className="py-2.5 pr-6 text-right text-red-600">-{currency(agg.totalValue)}</td>
  </tr>
);

interface SubtotalRowProps {
  label: string;
  agg: StatusAggregate;
  isDeduction?: boolean;
}

const SubtotalRow: React.FC<SubtotalRowProps> = ({ label, agg, isDeduction }) => (
  <tr
    className={`border-b-2 font-semibold ${
      isDeduction ? "bg-red-100" : "bg-emerald-100"
    }`}
  >
    <td
      className={`py-2.5 pl-6 pr-4 ${
        isDeduction ? "text-red-800" : "text-emerald-800"
      }`}
    >
      {label}
    </td>
    <td
      className={`py-2.5 pr-4 text-right ${
        isDeduction ? "text-red-700" : "text-emerald-700"
      }`}
    >
      {number(agg.count)}
    </td>
    <td
      className={`py-2.5 pr-6 text-right ${
        isDeduction ? "text-red-700" : "text-emerald-700"
      }`}
    >
      {isDeduction
        ? `-${currency(agg.totalValue)}`
        : `+${currency(agg.totalValue)}`}
    </td>
  </tr>
);

export default AggregatedFinancialSummary;
