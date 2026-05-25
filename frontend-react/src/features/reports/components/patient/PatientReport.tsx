import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as BarTooltip,
  ResponsiveContainer as BarResponsive,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import PatientGrowthChart from "@/features/reports/components/patient/PatientGrowthChart";
import type { PatientReportDataset, PatientGrowthPoint, AgeGroupStat } from "@/features/reports/types";

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

const SEX_COLORS = {
  Male: "#3b82f6",
  Female: "#ec4899",
};

const AGE_GROUP_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

const BAR_COLOR = "var(--chart-3)";
const AXIS_COLOR = "var(--muted-foreground)";
const GRID_COLOR = "var(--muted-foreground)";

// ── Sex Distribution Pie Chart ───────────────────────────────────────

const SexDistributionChart: React.FC<{
  maleCount: number;
  femaleCount: number;
}> = ({ maleCount, femaleCount }) => {
  const total = maleCount + femaleCount;

  const data = [
    { name: "Male", value: maleCount, fill: SEX_COLORS.Male },
    { name: "Female", value: femaleCount, fill: SEX_COLORS.Female },
  ];

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No demographic data available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }: any) => {
            if (!active || !payload || payload.length === 0) return null;
            const d = payload[0].payload;
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
            return (
              <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-semibold" style={{ color: d.fill }}>{d.name}</p>
                <p className="text-muted-foreground">{number(d.value)} patient{d.value !== 1 ? "s" : ""}</p>
                <p className="text-muted-foreground">{pct}% of total</p>
              </div>
            );
          }}
        />
        <Legend
          formatter={(value: string) => {
            const entry = data.find((d) => d.name === value);
            if (!entry) return value;
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
            return `${value} — ${number(entry.value)} (${pct}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// ── Age Group Horizontal Bar Chart ───────────────────────────────────

const AgeGroupChart: React.FC<{
  data: AgeGroupStat[];
}> = ({ data }) => {
  const chartData = [...data]
    .map((d) => ({
      name: d.groupLabel,
      count: d.count,
    }))
    .sort((a, b) => b.count - a.count);

  const chartHeight = Math.max(200, chartData.length * 48);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No age group data available.
      </div>
    );
  }

  return (
    <div style={{ height: chartHeight }}>
      <BarResponsive width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            strokeOpacity={0.12}
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: AXIS_COLOR }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <BarTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            content={({ active, payload }: any) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
                  <p className="text-muted-foreground mb-1">{payload[0].payload.name}</p>
                  <p className="font-semibold text-foreground">
                    {number(payload[0].value)} patient{payload[0].value !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={AGE_GROUP_COLORS[i % AGE_GROUP_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </BarResponsive>
    </div>
  );
};

// ── Main Patient Report ──────────────────────────────────────────────

interface PatientReportProps {
  report: PatientReportDataset;
  growthTrend: PatientGrowthPoint[];
  minDate: string;
  maxDate: string;
  onMinDateChange: (value: string) => void;
  onMaxDateChange: (value: string) => void;
}

const PatientReport: React.FC<PatientReportProps> = ({
  report,
  growthTrend,
  minDate,
  maxDate,
  onMinDateChange,
  onMaxDateChange,
}) => {
  return (
    <>
      <Card>
        <CardHeader className="bg-muted">
          <CardTitle className="text-lg">12-Month Patient Growth Trend</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <PatientGrowthChart data={growthTrend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Patient Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-muted">
                <CardTitle className="text-base">Sex Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <SexDistributionChart
                  maleCount={report.maleCount}
                  femaleCount={report.femaleCount}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted">
                <CardTitle className="text-base">Age Group Distribution</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <AgeGroupChart data={report.ageGroupDistribution} />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default PatientReport;
