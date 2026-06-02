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
  // Only count refunds from inflow groups (PAID and DEPOSIT) —
  // REFUNDED entries never contributed to gross, and VOIDED entries
  // are already deducted separately, so counting refunds from those
  // groups would double-deduct or subtract phantom revenue.
  for (const key of ["PAID", "DEPOSIT"]) {
    const entries = statusGroups[key];
    if (!entries) continue;
    for (const e of entries) {
      if (
        e.refundStatus === "PARTIAL" ||
        e.refundStatus === "FULL"
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
  const paid = aggregate(statusGroups, "PAID");
  const partiallyPaid = paidAggregate(statusGroups, "DEPOSIT");
  const voided = aggregate(statusGroups, "VOIDED");
  const refunded = refundDeductionAggregate(statusGroups);

  const grossCount = paid.count + partiallyPaid.count;
  const grossValue = paid.totalValue + partiallyPaid.totalValue;

  // Cash Deductions: only refunds (Voided excluded — those funds were never collected)
  const deductionValue = refunded.totalValue;

  // Operational metrics
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
              <td colSpan={2} className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inflow
              </td>
            </tr>
            <CurrencyRow label="Paid" value={paid.totalValue} isPositive />
            <CurrencyRow label="Deposit" value={partiallyPaid.totalValue} isPositive />
            <CurrencySubtotalRow label="Gross Total" value={grossValue} isPositive />

            {/* ═══ B. Spacer ═══ */}
            <tr className="h-4" />

            {/* ═══ C. Cash Deductions Section ═══ */}
            <tr className="border-b bg-muted/50">
              <td colSpan={2} className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cash Deductions
              </td>
            </tr>
            <CurrencyRow label="Refunded" value={refunded.totalValue} />
            <CurrencySubtotalRow label="Total Deductions" value={deductionValue} />

            {/* ═══ D. Spacer ═══ */}
            <tr className="h-4" />

            {/* ═══ E. Net Revenue ═══ */}
            <tr className="bg-blue-100">
              <td className="py-3 pl-6 pr-4 font-bold text-blue-900">Net Revenue</td>
              <td className="py-3 pr-6 text-right text-lg font-bold text-blue-700">
                {currency(netRevenue)}
              </td>
            </tr>

            {/* ═══ F. Spacer ═══ */}
            <tr className="h-4" />

            {/* ═══ G. Operational Overview Section ═══ */}
            <tr className="border-b bg-muted/50">
              <td colSpan={2} className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Operational Overview
              </td>
            </tr>
            <tr className="border-b hover:bg-muted/50">
              <td className="py-2.5 pl-6 pr-4 text-muted-foreground">Voided Transactions</td>
              <td className="py-2.5 pr-6 text-right">
                <span className="text-muted-foreground">{currency(voided.totalValue)}</span>
                &nbsp;<span className="font-semibold">({number(voided.count)})</span>
              </td>
            </tr>
            <tr className="border-b hover:bg-muted/50">
              <td className="py-2.5 pl-6 pr-4 text-muted-foreground">Total Transactions</td>
              <td className="py-2.5 pr-6 text-right font-medium">{number(totalTransactions)}</td>
            </tr>
            <tr className="border-b hover:bg-muted/50">
              <td className="py-2.5 pl-6 pr-4 text-muted-foreground">Net Active Transactions</td>
              <td className="py-2.5 pr-6 text-right font-medium">{number(netActiveTransactions)}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

// ── Row helpers ──────────────────────────────────────────────────────────

interface CurrencyRowProps {
  label: string;
  value: number;
  isPositive?: boolean;
}

const CurrencyRow: React.FC<CurrencyRowProps> = ({ label, value, isPositive }) => (
  <tr className="border-b hover:bg-muted/50">
    <td className="py-2.5 pl-6 pr-4 text-muted-foreground">{label}</td>
    <td className={`py-2.5 pr-6 text-right ${isPositive ? "text-green-600" : "text-red-600"}`}>
      {isPositive
        ? value > 0 ? `+${currency(value)}` : currency(value)
        : value > 0 ? `-${currency(value)}` : currency(value)}
    </td>
  </tr>
);

interface CurrencySubtotalRowProps {
  label: string;
  value: number;
  isPositive?: boolean;
}

const CurrencySubtotalRow: React.FC<CurrencySubtotalRowProps> = ({ label, value, isPositive }) => {
  const isDeduction = !isPositive;
  return (
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
        className={`py-2.5 pr-6 text-right ${
          isDeduction ? "text-red-700" : "text-emerald-700"
        }`}
      >
        {isPositive
          ? value > 0 ? `+${currency(value)}` : currency(value)
          : value > 0 ? `-${currency(value)}` : currency(value)}
      </td>
    </tr>
  );
};

export default AggregatedFinancialSummary;
