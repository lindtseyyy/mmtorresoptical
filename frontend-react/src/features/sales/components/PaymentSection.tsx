import { useState } from "react";
import { Banknote, Smartphone, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import type { CartItem } from "@/features/sales/types";

interface PaymentSectionProps {
  items: CartItem[];
  grandTotal: number;
  onComplete: (data: PaymentData) => void;
  pending: boolean;
}

export interface PaymentData {
  paymentMethod: "CASH" | "GCASH";
  amountTendered: number;
  referenceNumber?: string;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
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

  return (
    <div className="flex flex-col h-full">
      <h3 className="mb-3 text-sm font-semibold text-card-foreground">
        Payment Method
      </h3>

      {/* Payment type toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setPaymentType("CASH")}
          className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
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
          className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
            paymentType === "GCASH"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          }`}
        >
          <Smartphone className="h-4 w-4" />
          GCash
        </button>
      </div>

      {/* Payment details */}
      <div className="flex-1 space-y-4">
        {paymentType === "CASH" && (
          <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
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
                <span className="text-green-700 dark:text-green-300">
                  Change
                </span>
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
          <div className="space-y-3 rounded-lg border border-border bg-background/50 p-3">
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
            <p className="text-xs text-muted-foreground">
              Verify the GCash payment screenshot or confirmation before
              completing.
            </p>
          </div>
        )}

        {/* Grand total display */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-card-foreground">
                Total Amount
              </span>
            </div>
            <span className="text-xl font-bold tabular-nums text-primary">
              ₱{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Complete button */}
      <Button
        className="mt-4 w-full gap-2"
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
            Pay
          </>
        )}
      </Button>
    </div>
  );
};

export default PaymentSection;
