import { memo } from "react";
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

const LINE_COLOR = "var(--chart-1)";
const DOT_COLOR = "var(--chart-3)";
const TODAY_DOT_COLOR = "var(--primary)";
const CARD_BG = "var(--card)";
const GRID_COLOR = "var(--muted-foreground)";
const AXIS_COLOR = "var(--muted-foreground)";
const BORDER_COLOR = "var(--border)";

interface DailyCashInflow {
  day: number;
  amount: number;
}

interface DailyRevenueChartProps {
  data: DailyCashInflow[];
}

const monthName = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

const formatCurrency = (amount: number) =>
  `₱ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatAxisCurrency = (amount: number) => {
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₱${amount}`;
};

const DailyRevenueChart: React.FC<DailyRevenueChartProps> = memo(({ data }) => {
  const today = new Date().getDate();
  const chartData = data.map((d) => ({ ...d, label: d.day }));

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const amount = payload[0].value as number;

    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
        <p className="text-muted-foreground mb-1">
          {monthName} &mdash; Day {label}
        </p>
        <p className="font-semibold text-foreground">
          {formatCurrency(amount)}
        </p>
      </div>
    );
  };

  return (
    <>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          No daily revenue data available.
        </div>
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 8, left: -4 }}
            >
              <defs>
                <linearGradient
                  id="dailyRevenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={LINE_COLOR} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={LINE_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID_COLOR}
                strokeOpacity={0.12}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: AXIS_COLOR }}
                axisLine={{ stroke: BORDER_COLOR }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: AXIS_COLOR }}
                tickFormatter={formatAxisCurrency}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                fill="url(#dailyRevenueGradient)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, index } = props;
                  const isToday = chartData[index]?.day === today;
                  return (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={isToday ? 4.5 : 3}
                      fill={isToday ? TODAY_DOT_COLOR : DOT_COLOR}
                      stroke={CARD_BG}
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{
                  r: 5,
                  fill: TODAY_DOT_COLOR,
                  stroke: CARD_BG,
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
});

export default DailyRevenueChart;
