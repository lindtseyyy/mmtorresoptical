import { useCategoryBreakdown } from "@/features/reports/hooks/reportQuery";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const BAR_COLOR = "var(--chart-2)";
const AXIS_COLOR = "var(--muted-foreground)";
const GRID_COLOR = "var(--muted-foreground)";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatCategory = (cat: string) =>
  cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const categoryName = payload[0].payload.name;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="text-muted-foreground mb-1">{categoryName}</p>
      <p className="font-semibold text-foreground">
        {currency(payload[0].value)}
      </p>
    </div>
  );
};

const CategoryBreakdownChart: React.FC = () => {
  const { data, isLoading } = useCategoryBreakdown();

  const chartData =
    data
      ?.map((d) => ({
        name: formatCategory(d.category),
        value: d.totalValue,
      }))
      .sort((a, b) => b.value - a.value) ?? [];

  // Scale height per bar so long lists don't cram
  const chartHeight = Math.max(200, chartData.length * 48);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Catalog Breakdown by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            No category data available.
          </div>
        ) : (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} strokeOpacity={0.12} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  tickFormatter={currency}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdownChart;
