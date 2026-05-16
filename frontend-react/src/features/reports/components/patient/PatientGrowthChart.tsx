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
import type { PatientGrowthPoint } from "@/features/reports/types";

const LINE_COLOR = "var(--chart-2)";
const DOT_COLOR = "var(--chart-3)";
const CURRENT_DOT_COLOR = "var(--primary)";
const CARD_BG = "var(--card)";
const GRID_COLOR = "var(--muted-foreground)";
const AXIS_COLOR = "var(--muted-foreground)";
const BORDER_COLOR = "var(--border)";

const formatMonthAxis = (month: string) => {
  const [y, m] = month.split("-");
  const short = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short" });
  return `${short} '${y.slice(2)}`;
};

const formatMonthFull = (month: string) => {
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

interface PatientGrowthChartProps {
  data: PatientGrowthPoint[];
}

const PatientGrowthChart: React.FC<PatientGrowthChartProps> = memo(({ data }) => {
  const chartData = data.map((p) => ({ ...p, label: p.month }));

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const idx = chartData.findIndex((d) => d.label === label);
    const currentCount = payload[0].value as number;
    const prevCount: number | null =
      idx > 0 ? chartData[idx - 1].count : null;

    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
        <p className="text-muted-foreground mb-1">{formatMonthFull(label)}</p>
        <p className="font-semibold text-foreground">
          {currentCount} patient{currentCount !== 1 ? "s" : ""}
        </p>
        {prevCount != null && (
          <p
            className={`text-xs font-medium ${
              currentCount >= prevCount ? "text-green-600" : "text-red-600"
            }`}
          >
            {currentCount >= prevCount ? "+" : ""}
            {prevCount > 0
              ? (((currentCount - prevCount) / prevCount) * 100).toFixed(1)
              : currentCount > 0
                ? "100.0"
                : "0.0"}
            % vs previous month
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          No growth trend data available.
        </div>
      ) : (
        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <defs>
                  <linearGradient id="patientGradient" x1="0" y1="0" x2="0" y2="1">
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
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  fill="url(#patientGradient)"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="count"
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
    </>
  );
});

export default PatientGrowthChart;
