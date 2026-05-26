import { useState, useMemo, useCallback, useEffect } from "react";
import { RotateCcw, Minus, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import type { RefundStateItem, RefundMethod, ItemRefundResponse } from "@/features/sales/types";

const REFUND_REASONS = [
  "Damaged",
  "Expired",
  "Incorrect Item",
  "Change of Mind",
  "Defective",
  "Other",
] as const;

const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "GCASH", label: "GCash" },

];

const formatCurrency = (amount: number) =>
  `₱${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: RefundStateItem[];
  onComplete: (items: RefundStateItem[], refundMethod: RefundMethod, gcashNumber?: string, referenceNumber?: string) => Promise<ItemRefundResponse>;
  onRefundSuccess?: (response: ItemRefundResponse) => void;
  isPending: boolean;
  amountPaid?: number;
  totalAlreadyRefunded?: number;
  totalAllRefunded?: number;
  transactionTotal?: number;
  transactionAmountPaid?: number;
}

const RefundDrawer: React.FC<Props> = ({
  open,
  onOpenChange,
  items,
  onComplete,
  onRefundSuccess,
  isPending,
  amountPaid,
  totalAlreadyRefunded,
  totalAllRefunded,
  transactionTotal,
  transactionAmountPaid,
}) => {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("CASH");
  const [gcashNumber, setGcashNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Initialize state when items change (drawer opens)
  useEffect(() => {
    if (!open) return;
    const initReasons: Record<string, string> = {};
    const initQtys: Record<string, number> = {};
    for (const item of items) {
      initReasons[item.transactionItemId] = "";
      initQtys[item.transactionItemId] = item.refundQuantity;
    }
    setReasons(initReasons);
    setQuantities(initQtys);
    setRefundMethod("CASH");
    setGcashNumber("");
    setReferenceNumber("");
  }, [open, items]);

  const allReasonsFilled = useMemo(
    () => items.every((item) => reasons[item.transactionItemId]?.trim()),
    [items, reasons]
  );

  // Full-value subtotals before payment scaling
  const fullSubtotals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of items) {
      const qty = quantities[item.transactionItemId] ?? item.refundQuantity;
      let lineTotal = item.unitPrice * qty;
      if (item.isDiscounted) {
        if (item.discountType === "PERCENT") {
          lineTotal -= item.unitPrice * (item.discountValue / 100) * qty;
        } else if (item.discountType === "FIXED") {
          const discountPerUnit = item.discountValue / item.originalQuantity;
          lineTotal -= discountPerUnit * qty;
        }
      }
      result[item.transactionItemId] = Math.max(0, lineTotal);
    }
    return result;
  }, [items, quantities]);

  const fullTotal = useMemo(
    () => Object.values(fullSubtotals).reduce((a, b) => a + b, 0),
    [fullSubtotals]
  );

  const scaleFactor = useMemo(() => {
    if (amountPaid == null || totalAlreadyRefunded == null) return 1;
    const pool = amountPaid - totalAlreadyRefunded;
    if (pool <= 0 || fullTotal <= 0) return 0;
    return Math.min(1, pool / fullTotal);
  }, [amountPaid, totalAlreadyRefunded, fullTotal]);

  const refundTotal = fullTotal * scaleFactor;

  // ── Order-level accounting preview ──
  const accountingPreview = useMemo(() => {
    if (transactionTotal == null || transactionAmountPaid == null) return null;
    // Revised total accounts for ALL refunds: past (including balance adjustments) + current batch
    const newOrderTotal = transactionTotal - (totalAllRefunded ?? 0) - fullTotal;
    // Cash available to return = amount paid minus cash already refunded
    const effectivePaid = transactionAmountPaid - (totalAlreadyRefunded ?? 0);
    const cashToReturn = Math.max(0, effectivePaid - Math.max(0, newOrderTotal));
    const newRemainingDue = Math.max(0, newOrderTotal - effectivePaid);
    return { newOrderTotal, cashToReturn, newRemainingDue };
  }, [transactionTotal, transactionAmountPaid, totalAllRefunded, totalAlreadyRefunded, fullTotal]);

  const handleApplyToAll = useCallback(
    (reason: string) => {
      setReasons((prev) => {
        const next = { ...prev };
        for (const item of items) {
          next[item.transactionItemId] = reason;
        }
        return next;
      });
    },
    [items]
  );

  const handleQuantityChange = useCallback(
    (transactionItemId: string, delta: number) => {
      setQuantities((prev) => {
        const item = items.find((i) => i.transactionItemId === transactionItemId);
        if (!item) return prev;
        const current = prev[transactionItemId] ?? item.refundQuantity;
        const next = Math.min(item.maxQuantity, Math.max(1, current + delta));
        return { ...prev, [transactionItemId]: next };
      });
    },
    [items]
  );

  const handleComplete = async () => {
    const updatedItems = items.map((item) => ({
      ...item,
      refundReason: reasons[item.transactionItemId] ?? "",
      refundQuantity: quantities[item.transactionItemId] ?? item.refundQuantity,
    }));
    try {
      const response = await onComplete(updatedItems, refundMethod, gcashNumber || undefined, referenceNumber || undefined);
      if (onRefundSuccess) {
        onRefundSuccess(response);
      }
    } catch {
      // Error toast is handled by the mutation
    }
  };

  const openConfirmModal = () => setShowConfirm(true);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Refund Workspace
          </SheetTitle>
          <SheetDescription>
            {items.length} item(s) selected for refund
          </SheetDescription>
        </SheetHeader>

        {/* Apply to All shortcut */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Apply to all:
          </span>
          <Select onValueChange={handleApplyToAll}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Pick a reason…" />
            </SelectTrigger>
            <SelectContent>
              {REFUND_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Item list */}
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.transactionItemId}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  Max {item.maxQuantity}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                {/* Quantity control */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={
                      (quantities[item.transactionItemId] ??
                        item.refundQuantity) <= 1
                    }
                    onClick={() => handleQuantityChange(item.transactionItemId, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">
                    {quantities[item.transactionItemId] ?? item.refundQuantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={
                      (quantities[item.transactionItemId] ??
                        item.refundQuantity) >= item.maxQuantity
                    }
                    onClick={() => handleQuantityChange(item.transactionItemId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Reason dropdown */}
                <Select
                  value={reasons[item.transactionItemId] ?? ""}
                  onValueChange={(v) =>
                    setReasons((prev) => ({
                      ...prev,
                      [item.transactionItemId]: v,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue placeholder="Select reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFUND_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          ))}
        </div>

        {/* Financial summary */}
        {accountingPreview && transactionTotal != null && transactionAmountPaid != null && (
          <div className="mt-4 bg-muted rounded-md overflow-hidden text-sm py-1">
            <div className="flex items-center justify-between py-1.5 px-3 border-b border-gray-300 dark:border-gray-600">
              <span className="text-muted-foreground">Original Total Amount:</span>
              <span className="font-medium">{formatCurrency(transactionTotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-3 border-b border-gray-300 dark:border-gray-600">
              <span className="text-muted-foreground">Total Amount Paid:</span>
              <span className="font-medium">{formatCurrency(transactionAmountPaid)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-3 border-b border-gray-300 dark:border-gray-600">
              <span className="text-muted-foreground">Revised Total Amount:</span>
              <span className="font-medium">{formatCurrency(accountingPreview.newOrderTotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-3 border-b border-gray-300 dark:border-gray-600">
              <span className="text-muted-foreground">Remaining Due:</span>
              <span className="font-medium">{formatCurrency(accountingPreview.newRemainingDue)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-3">
              <span className="text-red-600 font-medium text-[15px]">Amount to Return:</span>
              <span className="font-bold text-red-600 text-[15px]">{formatCurrency(accountingPreview.cashToReturn)}</span>
            </div>
          </div>
        )}
        {!accountingPreview && (
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Refund Total</span>
              <span className="text-lg font-bold text-red-600">
                {formatCurrency(refundTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Refund method — only when cash is leaving the drawer */}
        {(!accountingPreview || accountingPreview.cashToReturn > 0) && (
          <div className="mt-3">
            <label className="text-xs font-medium text-muted-foreground">
              Refund Method
            </label>
            <div className="mt-1 flex gap-2">
              {REFUND_METHODS.map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  variant={refundMethod === m.value ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => setRefundMethod(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* GCash fields — only when GCash is selected and cash is actually being returned */}
        {(!accountingPreview || accountingPreview.cashToReturn > 0) && refundMethod === "GCASH" && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium">GCash Number</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
                placeholder="Enter GCash number (e.g. 09XX-XXX-XXXX)"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reference Number</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
                placeholder="Enter reference number (optional)"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>
        )}
        {accountingPreview && accountingPreview.cashToReturn > 0 && (
          <div className="mt-3 rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              You are refunding an amount of{" "}
              <strong className="underline">
                {formatCurrency(accountingPreview.cashToReturn)}
              </strong>
              {" "}using{" "}
              <strong>
                {REFUND_METHODS.find((m) => m.value === refundMethod)?.label ?? refundMethod}
              </strong>
              .
            </p>
          </div>
        )}

        {/* Complete Refund button — dynamic label based on cash flow */}
        <div className="mt-4">
          <Button
            className={`w-full ${accountingPreview && accountingPreview.cashToReturn > 0
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            disabled={!allReasonsFilled || isPending}
            onClick={openConfirmModal}
          >
            {isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Processing…
              </>
            ) : accountingPreview && accountingPreview.cashToReturn > 0 ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Process Refund &amp; Print
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Confirm Balance Adjustment
              </>
            )}
          </Button>
        </div>

        {/* Confirmation Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-lg m-4">
              <div className="mb-4 pr-8">
                <h2 className="text-lg font-semibold">Confirm Refund</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Please review the refund details before proceeding.
                </p>
              </div>
              <div className="space-y-3">
                <div className="rounded-md bg-muted p-3 text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Items to refund</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total refund amount</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(accountingPreview ? accountingPreview.cashToReturn : refundTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Refund method</span>
                    <span className="font-medium">
                      {REFUND_METHODS.find((m) => m.value === refundMethod)?.label ?? refundMethod}
                    </span>
                  </div>
                  {refundMethod === "GCASH" && gcashNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">GCash Number</span>
                      <span className="font-medium">{gcashNumber}</span>
                    </div>
                  )}
                  {refundMethod === "GCASH" && referenceNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reference Number</span>
                      <span className="font-medium">{referenceNumber}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  This action will update the transaction balance, restore inventory for physical items, and generate a refund receipt. It cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={isPending}
                  onClick={() => {
                    setShowConfirm(false);
                    handleComplete();
                  }}
                >
                  {isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Processing…
                    </>
                  ) : (
                    "Confirm Refund"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
};

export default RefundDrawer;
