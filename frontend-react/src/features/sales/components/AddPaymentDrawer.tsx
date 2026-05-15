import { useState, useEffect } from "react";
import { X, Banknote, Smartphone, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";

interface AddPaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  transactionNumber: string;
  totalAmount: number;
  balanceDue: number;
  onComplete: (data: { amount: number; paymentMethod: string; referenceNumber?: string }) => void;
  pending: boolean;
}

const AddPaymentDrawer: React.FC<AddPaymentDrawerProps> = ({
  open,
  onClose,
  transactionNumber,
  totalAmount,
  balanceDue,
  onComplete,
  pending,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "GCASH">("CASH");
  const [amountStr, setAmountStr] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    if (open) {
      setAmountStr(balanceDue.toFixed(2));
      setReferenceNumber("");
      setPaymentMethod("CASH");
    }
  }, [open, balanceDue]);

  const amount = parseFloat(amountStr) || 0;
  const canComplete = amount > 0 && amount <= balanceDue && !pending &&
    (paymentMethod === "GCASH" ? referenceNumber.trim().length > 0 : true);

  const handleSubmit = () => {
    if (amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }
    if (amount > balanceDue) {
      toast.error("Payment exceeds remaining balance");
      return;
    }
    if (paymentMethod === "GCASH" && !referenceNumber.trim()) {
      toast.error("Reference number is required for GCash");
      return;
    }
    onComplete({
      amount,
      paymentMethod,
      ...(paymentMethod === "GCASH" && { referenceNumber: referenceNumber.trim() }),
    });
  };

  if (!open) return null;

  const newBalance = balanceDue - amount;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/80 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-card-foreground">
            Add Payment
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

        <div className="flex-1 min-h-0 flex flex-col px-5 py-4 space-y-5">
          {/* Current status */}
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction</span>
              <span className="font-medium">{transactionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-medium tabular-nums">₱{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-amber-600">
              <span>Balance Due</span>
              <span className="tabular-nums">₱{balanceDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("GCASH")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  paymentMethod === "GCASH"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                GCash
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <Input
                type="number"
                min="0.01"
                max={balanceDue}
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="pl-7"
                disabled={pending}
              />
            </div>

            {amount > 0 && amount <= balanceDue && (
              <div className="flex justify-between rounded-md bg-green-50 dark:bg-green-950 p-2 text-sm">
                <span className="text-green-700 dark:text-green-300">New Balance</span>
                <span className="font-bold tabular-nums text-green-700 dark:text-green-300">
                  ₱{newBalance.toFixed(2)}
                </span>
              </div>
            )}

            {amount > balanceDue && (
              <p className="text-xs text-destructive">Amount exceeds remaining balance</p>
            )}
          </div>

          {/* GCash reference */}
          {paymentMethod === "GCASH" && (
            <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
              <Label className="text-xs text-muted-foreground">Reference Number</Label>
              <Input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter GCash reference #"
                disabled={pending}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-4">
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={!canComplete}
            onClick={handleSubmit}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Add Payment — ₱{amount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AddPaymentDrawer;
