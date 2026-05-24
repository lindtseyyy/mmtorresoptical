import { Clock, PackageOpen, Banknote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/shared/components/MetricCard";
import { createInventorySummaryQueryOptions } from "@/features/inventory/hooks/productQuery";
import { createTransactionMetricsQueryOptions } from "@/features/sales/hooks/transactionQuery";

const formatCurrency = (amount: number) =>
  `₱ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { data: inventorySummary } = useQuery(createInventorySummaryQueryOptions());

  const { data: metrics } = useQuery(createTransactionMetricsQueryOptions());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of clinic operations at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={Banknote}
          label="Active Inventory Value"
          value={inventorySummary != null ? formatCurrency(inventorySummary.inventoryValue) : "—"}
          color="emerald"
        />
        <MetricCard
          icon={Clock}
          label="Outstanding Receivables"
          value={metrics != null ? formatCurrency(metrics.totalAccountsReceivable) : "—"}
          color="amber"
        />
        <MetricCard
          icon={PackageOpen}
          label="Orders Awaiting Pickup"
          value={metrics?.awaitingPickupCount ?? "—"}
          color="violet"
        />
      </div>
    </div>
  );
}
