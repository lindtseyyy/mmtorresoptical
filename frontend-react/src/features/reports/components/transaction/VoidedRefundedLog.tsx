import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import type { TransactionEntry } from "@/features/reports/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const formatDateTime = (raw: string) =>
  new Date(raw).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

interface VoidedRefundedLogProps {
  entries: TransactionEntry[];
}

const refundedAmount = (entry: TransactionEntry): number => {
  if (entry.status === "PARTIALLY_REFUNDED" || entry.status === "FULLY_REFUNDED") {
    return entry.items.reduce((sum, item) => sum + (item.refundAmount ?? 0), 0);
  }
  return entry.totalAmount;
};

const VoidedRefundedLog: React.FC<VoidedRefundedLogProps> = ({ entries }) => (
  <Card>
    <CardHeader className="bg-muted">
      <CardTitle className="text-base">Voided & Refunded Transactions</CardTitle>
    </CardHeader>
    <CardContent>
      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No voided or refunded transactions in the selected period.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="w-[22%] py-3 pr-2 font-medium">Date</th>
                <th className="w-[18%] py-3 pr-2 font-medium">Customer</th>
                <th className="w-[18%] py-3 pr-2 font-medium text-center">Amount</th>
                <th className="w-[18%] py-3 pr-2 font-medium text-center">Status</th>
                <th className="w-[16%] py-3 font-medium">Reason</th>
                <th className="w-[8%] py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-muted">
                  <td className="py-2 pr-2">{formatDateTime(entry.date)}</td>
                  <td className="py-2 pr-2 text-xs">{entry.customerName || "—"}</td>
                  <td className="py-2 pr-2 text-center">{currency(refundedAmount(entry))}</td>
                  <td className="py-2 pr-2 text-center">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="py-2 text-muted-foreground truncate max-w-[120px]">
                    {entry.voidReason || "—"}
                  </td>
                  <td className="py-2 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/transactions/${entry.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        <span className="ml-1">View</span>
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

export default VoidedRefundedLog;
