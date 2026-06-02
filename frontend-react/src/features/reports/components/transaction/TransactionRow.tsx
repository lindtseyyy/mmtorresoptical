import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import type { TransactionEntry } from "@/features/reports/types";

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface TransactionRowProps {
  entry: TransactionEntry;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-[100px] font-mono text-sm">
          {formatDate(entry.date)}
        </span>
        <span className="flex-1 font-medium">{entry.customerName || ""}</span>
        <StatusBadge status={entry.status} className="shrink-0" />
        {entry.refundStatus && entry.refundStatus !== "NONE" && (
          <StatusBadge status={entry.refundStatus} className="shrink-0" />
        )}
        <span className="min-w-[100px] text-right font-medium">
          {currency(entry.totalAmount)}
        </span>
      </button>
      {expanded && (
        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Cashier: </span>
              <span>{entry.cashierName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Amount Paid: </span>
              <span>{currency(entry.amountPaid)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Balance Due: </span>
              <span>{currency(entry.balanceDue)}</span>
            </div>
            {entry.voidReason && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Void Reason: </span>
                <span className="text-red-600">{entry.voidReason}</span>
                {entry.voidedAt && (
                  <span className="text-muted-foreground text-xs ml-2">
                    ({formatDateTime(entry.voidedAt)}
                    {entry.voidedBy ? ` by ${entry.voidedBy}` : ""})
                  </span>
                )}
              </div>
            )}
          </div>

          {entry.items.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Items</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-1 pr-2">Product</th>
                    <th className="py-1 pr-2 text-right">Qty</th>
                    <th className="py-1 pr-2 text-right">Unit Price</th>
                    <th className="py-1 pr-2 text-right">Subtotal</th>
                    {entry.items.some((i) => i.refundedQuantity) && (
                      <th className="py-1 pr-2 text-right">Refunded</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {entry.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-muted">
                      <td className="py-1 pr-2">{item.productName}</td>
                      <td className="py-1 pr-2 text-right">{item.quantity}</td>
                      <td className="py-1 pr-2 text-right">{currency(item.unitPrice)}</td>
                      <td className="py-1 pr-2 text-right">{currency(item.subtotal)}</td>
                      {entry.items.some((i) => i.refundedQuantity) && (
                        <td className="py-1 pr-2 text-right">
                          {item.refundedQuantity
                            ? `${item.refundedQuantity}${item.refundAmount ? ` (${currency(item.refundAmount)})` : ""}`
                            : "-"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {entry.payments.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Payments</p>
              <div className="space-y-1">
                {entry.payments.map((pmt, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-xs">
                    <Badge variant="outline" className="capitalize">
                      {pmt.paymentMethod}
                    </Badge>
                    <span className="font-medium">{currency(pmt.amount)}</span>
                    {pmt.referenceNumber && (
                      <span className="text-muted-foreground">Ref: {pmt.referenceNumber}</span>
                    )}
                    {pmt.gcashNumber && (
                      <span className="text-muted-foreground">GCash No: {pmt.gcashNumber}</span>
                    )}
                    <span className="text-muted-foreground">{formatDateTime(pmt.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionRow;
