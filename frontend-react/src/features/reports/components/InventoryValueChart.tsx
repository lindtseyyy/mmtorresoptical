import { useInventoryValueTrend } from "@/features/reports/hooks/reportQuery";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const LINE_COLOR = "var(--chart-2)";
const DOT_COLOR = "var(--chart-3)";
const CURRENT_DOT_COLOR = "var(--primary)";
const CARD_BG = "var(--card)";
const GRID_COLOR = "var(--muted-foreground)";
const AXIS_COLOR = "var(--muted-foreground)";
const BORDER_COLOR = "var(--border)";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatMonthAxis = (month: string) => {
  const [y, m] = month.split("-");
  const short = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short" });
  return `${short} '${y.slice(2)}`;
};

const formatMonthFull = (month: string) => {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
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

const InventoryValueChart: React.FC = () => {
  const { data, isLoading } = useInventoryValueTrend();

  const chartData = data?.map((p) => ({ ...p, label: p.month })) ?? [];

  return (
    <Card>
      <CardHeader className="bg-muted">
        <CardTitle>12-Month Inventory Value Trend</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <defs>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LINE_COLOR} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.12} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickFormatter={formatMonthAxis}
                  axisLine={{ stroke: BORDER_COLOR }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickFormatter={currency}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" fill="url(#valueGradient)" stroke="none" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={LINE_COLOR}
                  strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, index } = props;
                    const isCurrentMonth = index === chartData.length - 1;
                    return (
                      <circle
                        key={index}
                        cx={cx}
                        cy={cy}
                        r={isCurrentMonth ? 5 : 3.5}
                        fill={isCurrentMonth ? CURRENT_DOT_COLOR : DOT_COLOR}
                        stroke={CARD_BG}
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: CURRENT_DOT_COLOR, stroke: CARD_BG, strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryValueChart;
