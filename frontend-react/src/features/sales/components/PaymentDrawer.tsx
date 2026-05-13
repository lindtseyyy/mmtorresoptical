import { useState } from "react";
import { X, Banknote, Smartphone, CreditCard, Loader2, Receipt } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import type { CartItem } from "@/features/sales/types";
import type { PaymentData } from "@/features/sales/components/PaymentSection";

interface PaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  grandTotal: number;
  onComplete: (data: PaymentData) => void;
  pending: boolean;
}

const PaymentDrawer: React.FC<PaymentDrawerProps> = ({
  open,
  onClose,
  items,
  grandTotal,
  onComplete,
  pending,
}) => {
  const [paymentType, setPaymentType] = useState<"CASH" | "GCASH">("CASH");
  const [cashTender, setCashTender] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const cashTenderAmount = parseFloat(cashTender) || 0;
  const change = cashTenderAmount - grandTotal;
  const canComplete =
    items.length > 0 &&
    !pending &&
    (paymentType === "GCASH"
      ? referenceNumber.trim().length > 0
      : cashTenderAmount >= grandTotal);

  const handleComplete = () => {
    if (paymentType === "CASH" && cashTenderAmount < grandTotal) {
      toast.error("Insufficient cash tender");
      return;
    }
    if (paymentType === "GCASH" && !referenceNumber.trim()) {
      toast.error("Reference number is required for GCash");
      return;
    }
    onComplete({
      paymentType,
      ...(paymentType === "CASH" && { cashTender: cashTenderAmount }),
      ...(paymentType === "GCASH" && {
        referenceNumber: referenceNumber.trim(),
      }),
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/80 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-card-foreground">
            Payment
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            disabled={pending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-5 py-4 space-y-4">
          {/* Item summary */}
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide shrink-0 px-1">
              Order Summary
            </h3>
            <div className="max-h-[24vh] min-h-[12vh] overflow-y-auto rounded-md border border-border bg-muted/60 px-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-muted-foreground/30 text-[10px] text-foreground uppercase tracking-wide font-bold">
                    <th className="py-1 pl-2.5 text-left font-medium">Name</th>
                    <th className="py-1 text-center font-medium w-8">Qty</th>
                    <th className="py-1 pr-2.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const itemSubtotal = item.product.unitPrice * item.quantity;
                    let discountedSubtotal = itemSubtotal;
                    if (item.isDiscounted && item.discountType && item.discountValue) {
                      if (item.discountType === "PERCENT") {
                        discountedSubtotal -= (itemSubtotal * item.discountValue) / 100;
                      } else {
                        discountedSubtotal -= item.discountValue;
                      }
                      discountedSubtotal = Math.max(0, discountedSubtotal);
                    }
                    return (
                      <tr key={item.uid} className="border-b border-muted-foreground/20 last:border-b-0">
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
                        <td className="py-1.5 text-center text-muted-foreground w-8">
                          {item.quantity}
                        </td>
                        <td className="py-1.5 pr-2.5 text-right tabular-nums font-medium">
                          ₱{discountedSubtotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">
                ₱ {items
                  .reduce((sum, i) => sum + i.product.unitPrice * i.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>
            {items.some((i) => i.isDiscounted) && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="tabular-nums">
                  -₱ {items
                    .reduce((sum, i) => {
                      const itemSub = i.product.unitPrice * i.quantity;
                      if (!i.isDiscounted) return sum;
                      let disc = itemSub;
                      if (i.discountType === "PERCENT") {
                        disc -= (itemSub * (i.discountValue ?? 0)) / 100;
                      } else {
                        disc -= i.discountValue ?? 0;
                      }
                      disc = Math.max(0, disc);
                      return sum + (itemSub - disc);
                    }, 0)
                    .toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-border pt-1.5">
              <span>Total</span>
              <span className="tabular-nums">₱{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div className="border-t border-muted-foreground/30 pt-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Payment Method
            </h3>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setPaymentType("CASH")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  paymentType === "CASH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("GCASH")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  paymentType === "GCASH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                GCash
              </button>
            </div>

            {paymentType === "CASH" && (
              <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Cash Tender
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      ₱
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashTender}
                      onChange={(e) => setCashTender(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                      disabled={pending}
                    />
                  </div>
                </div>
                {cashTenderAmount > 0 && change >= 0 && (
                  <div className="flex justify-between rounded-md bg-green-50 p-2 text-sm dark:bg-green-950">
                    <span className="text-green-700 dark:text-green-300">Change</span>
                    <span className="font-bold tabular-nums text-green-700 dark:text-green-300">
                      ₱{change.toFixed(2)}
                    </span>
                  </div>
                )}
                {cashTenderAmount > 0 && change < 0 && (
                  <p className="text-xs text-destructive">
                    Insufficient. Need at least ₱{grandTotal.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {paymentType === "GCASH" && (
              <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Reference Number
                  </Label>
                  <Input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Enter GCash reference #"
                    disabled={pending}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Pay button */}
        <div className="border-t border-border px-5 py-4">
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={!canComplete}
            onClick={handleComplete}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Pay ₱{grandTotal.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default PaymentDrawer;
