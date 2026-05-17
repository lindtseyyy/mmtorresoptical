import { useTransactionMonthlyTrend } from "@/features/reports/hooks/reportQuery";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const BAR_COLOR = "var(--chart-1)";
const AREA_STROKE = "var(--chart-3)";
const AREA_FILL = "var(--chart-3)";
const GRID_COLOR = "var(--muted-foreground)";
const AXIS_COLOR = "var(--muted-foreground)";
const BORDER_COLOR = "var(--border)";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

const formatMonthAxis = (month: string) => {
  const [y, m] = month.split("-");
  const short = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short" });
  return `${short} '${y.slice(2)}`;
};

const formatMonthFull = (month: string) => {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const CountTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-muted-foreground mb-1">{formatMonthFull(label)}</p>
      <p className="font-semibold text-foreground">
        {number(payload[0].value)} transactions
      </p>
    </div>
  );
};

const RevenueTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-muted-foreground mb-1">{formatMonthFull(label)}</p>
      <p className="font-semibold text-foreground">
        {currency(payload[0].value)}
      </p>
    </div>
  );
};

const TransactionCharts: React.FC = () => {
  const { data, isLoading } = useTransactionMonthlyTrend();

  const chartData = data?.map((p) => ({ ...p })) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-center h-72">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center h-72">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Column A: Transaction Volume */}
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle>Transaction Volume</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.12} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickFormatter={formatMonthAxis}
                  axisLine={{ stroke: BORDER_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickFormatter={(v: number) => number(v)}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CountTooltip />} />
                <Bar dataKey="transactionCount" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Column B: Net Revenue Trend */}
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle>Net Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={AREA_FILL} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={AREA_FILL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.12} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickFormatter={formatMonthAxis}
                  axisLine={{ stroke: BORDER_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickFormatter={(v: number) => currency(v)}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="netRevenue"
                  stroke={AREA_STROKE}
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionCharts;
