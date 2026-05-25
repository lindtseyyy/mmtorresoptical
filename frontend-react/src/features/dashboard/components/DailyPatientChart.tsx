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

const LINE_COLOR = "var(--chart-2)";
const DOT_COLOR = "var(--chart-3)";
const TODAY_DOT_COLOR = "var(--primary)";
const CARD_BG = "var(--card)";
const GRID_COLOR = "var(--muted-foreground)";
const AXIS_COLOR = "var(--muted-foreground)";
const BORDER_COLOR = "var(--border)";

interface DailyArrival {
  day: number;
  count: number;
}

interface DailyPatientChartProps {
  data: DailyArrival[];
}

const monthName = new Date().toLocaleDateString("en-US", {
  month: "long",
  year: "numeric",
});

const DailyPatientChart: React.FC<DailyPatientChartProps> = memo(({ data }) => {
  const today = new Date().getDate();
  const chartData = data.map((d) => ({ ...d, label: d.day }));

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const count = payload[0].value as number;

    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
        <p className="text-muted-foreground mb-1">
          {monthName} &mdash; Day {label}
        </p>
        <p className="font-semibold text-foreground">
          {count} new patient{count !== 1 ? "s" : ""}
        </p>
      </div>
    );
  };

  return (
    <>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          No daily arrival data available.
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
                  id="dailyPatientGradient"
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
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                fill="url(#dailyPatientGradient)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="count"
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

export default DailyPatientChart;
