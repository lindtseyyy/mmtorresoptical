import {
  ShoppingCart,
  Clock,
  ArrowRight,
  PackageOpen,
  Receipt,
  UserPlus,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { createInventorySummaryQueryOptions } from "@/features/inventory/hooks/productQuery";

const quickActions = [
  { label: "Manage Inventory", href: "/inventory", icon: PackageOpen },
  { label: "New Sale", href: "/sales", icon: ShoppingCart },
  { label: "View Transactions", href: "/transactions", icon: Receipt },
  { label: "Register Patient", href: "/patients/add", icon: UserPlus },
];

const recentActivity = [
  { text: "No recent activity to display.", time: "" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    data: inventorySummary,
    isLoading: inventoryLoading,
    isError: inventoryError,
  } = useQuery(createInventorySummaryQueryOptions());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of clinic operations and quick access to common tasks.
        </p>
      </div>

      {/* Inventory alerts — immediate action items */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Inventory Alerts</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard
            icon={AlertTriangle}
            label="Low Stock Items — Needs Reorder"
            value={inventoryLoading ? "…" : inventoryError ? "—" : inventorySummary?.countLowStockProducts ?? "—"}
            color="red"
            labelPosition="bottom"
          />
          <MetricCard
            icon={TrendingUp}
            label="Overstocked Items — Excess Capital"
            value={inventoryLoading ? "…" : inventoryError ? "—" : inventorySummary?.countOverstockedProducts ?? "—"}
            color="amber"
            labelPosition="bottom"
          />
        </div>
      </div>

      <Separator />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="justify-start gap-3 h-auto py-4"
                onClick={() => navigate(action.href)}
              >
                <action.icon className="h-5 w-5 text-muted-foreground" />
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Clock className="h-10 w-10" />
              <p>No recent activity to display.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-sm">{item.text}</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
