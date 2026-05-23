import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { TransactionReportSummary } from "@/features/reports/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const COLORS = {
  Completed: "#16a34a",
  Voided: "#dc2626",
  Refunded: "#7c3aed",
  "Active / Other": "#3b82f6",
};

interface LifecycleSlice {
  name: string;
  count: number;
  amount: number;
  fill: string;
}

function buildSlices(summary: TransactionReportSummary): LifecycleSlice[] {
  const activeCount = summary.totalCount - summary.completedCount - summary.voidedCount - summary.refundedCount;
  const activeAmount = summary.totalAmount - summary.completedAmount - summary.voidedAmount - summary.refundedAmount;

  return [
    { name: "Completed", count: summary.completedCount, amount: summary.completedAmount, fill: COLORS.Completed },
    { name: "Voided", count: summary.voidedCount, amount: summary.voidedAmount, fill: COLORS.Voided },
    { name: "Refunded", count: summary.refundedCount, amount: summary.refundedAmount, fill: COLORS.Refunded },
    { name: "Active / Other", count: Math.max(0, activeCount), amount: Math.max(0, activeAmount), fill: COLORS["Active / Other"] },
  ].filter((s) => s.count > 0 || s.amount > 0);
}

interface TransactionLifecycleChartProps {
  summary: TransactionReportSummary;
}

const TransactionLifecycleChart: React.FC<TransactionLifecycleChartProps> = ({ summary }) => {
  const slices = buildSlices(summary);
  const totalAmount = slices.reduce((sum, s) => sum + s.amount, 0);

  if (slices.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No transaction data to display.
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            paddingAngle={2}
            strokeWidth={0}
          >
            {slices.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }: any) => {
              if (!active || !payload || payload.length === 0) return null;
              const d = payload[0].payload as LifecycleSlice;
              const pct = totalAmount > 0 ? ((d.amount / totalAmount) * 100).toFixed(1) : "0";
              return (
                <div className="bg-white border border-border rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-semibold" style={{ color: d.fill }}>{d.name}</p>
                  <p className="text-muted-foreground">{d.count} transaction{d.count !== 1 ? "s" : ""}</p>
                  <p className="text-muted-foreground">{currency(d.amount)}</p>
                  <p className="text-muted-foreground">{pct}% of total</p>
                </div>
              );
            }}
          />
          <Legend
            formatter={(value: string) => {
              const s = slices.find((x) => x.name === value);
              if (!s) return value;
              const pct = totalAmount > 0 ? ((s.amount / totalAmount) * 100).toFixed(1) : "0";
              return `${value} (${s.count} — ${pct}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionLifecycleChart;
