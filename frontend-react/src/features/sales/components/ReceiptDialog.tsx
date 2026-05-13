import { CheckCircle, Banknote, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import type { TransactionResponse } from "@/features/sales/types";

interface ReceiptDialogProps {
  receipt: TransactionResponse | null;
  onClose: () => void;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const date = new Date(receipt.transactionDate);
  const dateStr = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCash = receipt.paymentType === "CASH";

  return (
    <Dialog open={!!receipt} onOpenChange={onClose}>
      <DialogHeader>
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="h-10 w-10 text-green-600 mb-2" />
          <DialogTitle>Payment Successful</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dateStr} &middot; {timeStr}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">
            #{receipt.transactionId.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </DialogHeader>

      <div className="space-y-3">
        {/* Items table */}
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="py-1.5 pl-2.5 text-left font-medium">Item</th>
                <th className="py-1.5 text-center font-medium w-8">Qty</th>
                <th className="py-1.5 pr-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.transactionItems.map((item) => {
                const effectiveSubtotal = item.isDiscounted
                  ? item.subtotal
                  : item.unitPrice * item.quantity;

                return (
                  <tr
                    key={item.transactionItemId}
                    className="border-b border-border/50 last:border-b-0"
                  >
                    <td className="py-1.5 pl-2.5">
                      <p className="font-medium text-card-foreground leading-tight">
                        {item.product.productName}
                      </p>
                      {item.isDiscounted && (
                        <span className="text-[10px] text-green-600">
                          {item.discountType === "PERCENT"
                            ? `${item.discountValue}% off`
                            : `₱${item.discountValue.toFixed(2)} off`}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-center text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 pr-2.5 text-right tabular-nums font-medium">
                      ₱{effectiveSubtotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">
              ₱
              {receipt.transactionItems
                .reduce(
                  (sum, i) =>
                    sum + i.unitPrice * i.quantity,
                  0
                )
                .toFixed(2)}
            </span>
          </div>

          {receipt.transactionItems.some((i) => i.isDiscounted) && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="tabular-nums">
                -₱
                {receipt.transactionItems
                  .reduce((sum, i) => {
                    const itemSub = i.unitPrice * i.quantity;
                    if (i.isDiscounted) {
                      return sum + (itemSub - i.subtotal);
                    }
                    return sum;
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between font-bold text-base border-t border-border pt-1.5">
            <span>Total</span>
            <span className="tabular-nums">
              ₱{receipt.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment details */}
        <div className="rounded-md bg-muted/40 p-2.5 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {isCash ? (
              <Banknote className="h-3.5 w-3.5" />
            ) : (
              <Smartphone className="h-3.5 w-3.5" />
            )}
            <span>{isCash ? "Cash Payment" : "GCash Payment"}</span>
          </div>

          {isCash && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Tender</span>
                <span className="tabular-nums">
                  ₱{receipt.cashTender.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Change</span>
                <span className="tabular-nums font-medium text-green-600">
                  ₱{receipt.change.toFixed(2)}
                </span>
              </div>
            </>
          )}

          {!isCash && receipt.referenceNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ref #</span>
              <span className="font-mono">{receipt.referenceNumber}</span>
            </div>
          )}
        </div>

        <Button className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
};

export default ReceiptDialog;
