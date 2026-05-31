import { useState, useEffect } from "react";
import { Banknote, Smartphone, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/components/ui/sheet";
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
  const canComplete = amount > 0 && !pending &&
    (paymentMethod === "GCASH" ? referenceNumber.trim().length > 0 : true);

  const handleSubmit = () => {
    if (amount <= 0) {
      toast.error("Enter a valid payment amount");
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

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add Payment</SheetTitle>
          <SheetDescription>
            Settle the remaining balance for this transaction.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 flex flex-col mt-4 space-y-5">
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

          {/* Amount — read-only exact balance */}
          <div className="space-y-2 rounded-lg border border-border bg-background/50 p-3">
            <Label className="text-xs text-muted-foreground">Amount to Settle</Label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <Input
                type="number"
                value={amountStr}
                className="pl-7 bg-muted/50 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The remaining balance must be settled in full — partial payments are not allowed.
            </p>
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
        <div className="border-t border-border pt-4 mt-4">
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
                Settle Balance — ₱{amount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AddPaymentDrawer;
