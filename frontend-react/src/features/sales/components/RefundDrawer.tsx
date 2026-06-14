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
  // Item-level state (for non-batch items only)
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Batch-level state (for physical items with batch allocations)
  const [batchQuantities, setBatchQuantities] = useState<Record<string, Record<number, number>>>({});
  const [batchReasons, setBatchReasons] = useState<Record<string, Record<number, string>>>({});

  const [refundMethod, setRefundMethod] = useState<RefundMethod>("CASH");
  const [gcashNumber, setGcashNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const hasBatches = useCallback(
    (item: RefundStateItem) => (item.batchAllocations ?? []).length > 0,
    []
  );

  // Auto-distribute refund quantity across batches (FEFO order)
  const distributeToBatches = useCallback(
    (item: RefundStateItem, refundQty: number): Record<number, number> => {
      const allocations = item.batchAllocations ?? [];
      if (allocations.length === 0) return {};
      const result: Record<number, number> = {};
      let remaining = refundQty;
      for (const alloc of allocations) {
        if (remaining <= 0) {
          result[alloc.productBatchId] = 0;
          continue;
        }
        const take = Math.min(remaining, alloc.quantityDeducted);
        result[alloc.productBatchId] = take;
        remaining -= take;
      }
      return result;
    },
    []
  );

  // Initialize state when drawer opens
  useEffect(() => {
    if (!open) return;
    const initReasons: Record<string, string> = {};
    const initQtys: Record<string, number> = {};
    const initBatchQtys: Record<string, Record<number, number>> = {};
    const initBatchReasons: Record<string, Record<number, string>> = {};
    for (const item of items) {
      if (hasBatches(item)) {
        initBatchQtys[item.transactionItemId] = distributeToBatches(item, item.refundQuantity);
        initBatchReasons[item.transactionItemId] = {};
      } else {
        initReasons[item.transactionItemId] = "";
        initQtys[item.transactionItemId] = item.refundQuantity;
      }
    }
    setReasons(initReasons);
    setQuantities(initQtys);
    setBatchQuantities(initBatchQtys);
    setBatchReasons(initBatchReasons);
    setRefundMethod("CASH");
    setGcashNumber("");
    setReferenceNumber("");
  }, [open, items, distributeToBatches, hasBatches]);

  // Get effective quantity for an item
  const getEffectiveQty = useCallback(
    (item: RefundStateItem): number => {
      if (hasBatches(item)) {
        return Object.values(batchQuantities[item.transactionItemId] ?? {}).reduce((a, b) => a + b, 0);
      }
      return quantities[item.transactionItemId] ?? item.refundQuantity;
    },
    [hasBatches, batchQuantities, quantities]
  );

  // Validation: all reasons filled
  const allReasonsFilled = useMemo(
    () =>
      items.every((item) => {
        if (hasBatches(item)) {
          const bq = batchQuantities[item.transactionItemId] ?? {};
          const br = batchReasons[item.transactionItemId] ?? {};
          // Every batch with qty > 0 must have a reason
          return Object.entries(bq).every(
            ([batchId, qty]) => qty <= 0 || (br[Number(batchId)]?.trim())
          );
        }
        return reasons[item.transactionItemId]?.trim();
      }),
    [items, reasons, batchQuantities, batchReasons, hasBatches]
  );

  // Validation: batch items must have at least 1 unit allocated
  const batchHasQty = useMemo(
    () =>
      items.every((item) => {
        if (!hasBatches(item)) return true;
        const total = Object.values(batchQuantities[item.transactionItemId] ?? {}).reduce((a, b) => a + b, 0);
        return total > 0;
      }),
    [items, batchQuantities, hasBatches]
  );

  const gcashValid = useMemo(() => {
    if (refundMethod !== "GCASH") return true;
    return /^09\d{9}$/.test(gcashNumber.trim());
  }, [refundMethod, gcashNumber]);

  const referenceValid = useMemo(() => {
    if (refundMethod !== "GCASH") return true;
    return referenceNumber.trim().length > 0;
  }, [refundMethod, referenceNumber]);

  // Full-value subtotals before payment scaling
  const fullSubtotals = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of items) {
      const qty = getEffectiveQty(item);
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
  }, [items, getEffectiveQty]);

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
    const newOrderTotal = transactionTotal - (totalAllRefunded ?? 0) - fullTotal;
    const effectivePaid = transactionAmountPaid - (totalAlreadyRefunded ?? 0);
    const cashToReturn = Math.max(0, effectivePaid - Math.max(0, newOrderTotal));
    const newRemainingDue = Math.max(0, newOrderTotal - effectivePaid);
    return { newOrderTotal, cashToReturn, newRemainingDue };
  }, [transactionTotal, transactionAmountPaid, totalAllRefunded, totalAlreadyRefunded, fullTotal]);

  // ── Apply to all: sets reason on all batches and all non-batch items ──
  const handleApplyToAll = useCallback(
    (reason: string) => {
      setReasons((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (!hasBatches(item)) {
            next[item.transactionItemId] = reason;
          }
        }
        return next;
      });
      setBatchReasons((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (hasBatches(item)) {
            const allocs = item.batchAllocations ?? {};
            const current = next[item.transactionItemId] ?? {};
            const updated: Record<number, string> = {};
            for (const alloc of allocs) {
              updated[alloc.productBatchId] = reason;
            }
            next[item.transactionItemId] = { ...current, ...updated };
          }
        }
        return next;
      });
    },
    [items, hasBatches]
  );

  // ── Item-level quantity change (non-batch items only) ──
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

  // ── Batch-level quantity change ──
  const handleBatchQuantityChange = useCallback(
    (transactionItemId: string, productBatchId: number, delta: number, maxQty: number) => {
      setBatchQuantities((prev) => {
        const current = prev[transactionItemId]?.[productBatchId] ?? 0;
        const next = Math.min(maxQty, Math.max(0, current + delta));
        return {
          ...prev,
          [transactionItemId]: {
            ...prev[transactionItemId],
            [productBatchId]: next,
          },
        };
      });
    },
    []
  );

  // ── Batch-level reason change ──
  const handleBatchReasonChange = useCallback(
    (transactionItemId: string, productBatchId: number, reason: string) => {
      setBatchReasons((prev) => ({
        ...prev,
        [transactionItemId]: {
          ...prev[transactionItemId],
          [productBatchId]: reason,
        },
      }));
    },
    []
  );

  const handleComplete = async () => {
    const updatedItems = items.map((item) => {
      const effectiveQty = getEffectiveQty(item);
      let refundReason: string;

      if (hasBatches(item)) {
        // Derive item-level reason from batch reasons
        const br = batchReasons[item.transactionItemId] ?? {};
        const bq = batchQuantities[item.transactionItemId] ?? {};
        const reasonsUsed = Object.entries(bq)
          .filter(([, qty]) => qty > 0)
          .map(([batchId]) => br[Number(batchId)] ?? "")
          .filter((r) => r.trim());
        const unique = [...new Set(reasonsUsed)];
        refundReason = unique.length === 1 ? unique[0] : unique.join(", ");
      } else {
        refundReason = reasons[item.transactionItemId] ?? "";
      }

      const base: any = {
        ...item,
        refundReason,
        refundQuantity: effectiveQty,
      };

      if (hasBatches(item)) {
        const bq = batchQuantities[item.transactionItemId] ?? {};
        const br = batchReasons[item.transactionItemId] ?? {};
        base.selectedBatchAllocations = (item.batchAllocations ?? [])
          .filter((a) => (bq[a.productBatchId] ?? 0) > 0)
          .map((a) => ({
            productBatchId: a.productBatchId,
            quantityToRestore: bq[a.productBatchId] ?? 0,
            refundReason: br[a.productBatchId] ?? "",
          }));
      }

      return base;
    });
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
              {/* Item header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                </div>
                {!hasBatches(item) && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Max {item.maxQuantity}
                  </Badge>
                )}
              </div>

              {hasBatches(item) ? (
                /* ── Batch-level controls (physical items) ── */
                <div className="rounded-md bg-muted/50 border border-muted-foreground/10 p-2 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    Return to Batches
                  </p>
                  {(item.batchAllocations ?? []).map((alloc) => {
                    const currentBatchQty = batchQuantities[item.transactionItemId]?.[alloc.productBatchId] ?? 0;
                    const currentReason = batchReasons[item.transactionItemId]?.[alloc.productBatchId] ?? "";
                    return (
                      <div key={alloc.productBatchId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs truncate flex-1">
                            {alloc.batchNumber}
                            <span className="text-muted-foreground ml-1">(max {alloc.quantityDeducted})</span>
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              disabled={currentBatchQty <= 0}
                              onClick={() => handleBatchQuantityChange(item.transactionItemId, alloc.productBatchId, -1, alloc.quantityDeducted)}
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>
                            <span className="w-6 text-center text-xs font-medium tabular-nums">
                              {currentBatchQty}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              disabled={currentBatchQty >= alloc.quantityDeducted}
                              onClick={() => handleBatchQuantityChange(item.transactionItemId, alloc.productBatchId, 1, alloc.quantityDeducted)}
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                        {currentBatchQty > 0 && (
                          <Select
                            value={currentReason}
                            onValueChange={(v) =>
                              handleBatchReasonChange(item.transactionItemId, alloc.productBatchId, v)
                            }
                          >
                            <SelectTrigger className="h-7 text-[11px]">
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
                        )}
                      </div>
                    );
                  })}
                  {!batchHasQty && (
                    <p className="text-[11px] text-red-500 font-medium">
                      Allocate at least 1 unit to a batch
                    </p>
                  )}
                </div>
              ) : (
                /* ── Item-level controls (non-batch / service items) ── */
                <div className="flex items-center gap-3">
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
              )}

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

        {/* Refund method */}
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

        {/* GCash fields */}
        {(!accountingPreview || accountingPreview.cashToReturn > 0) && refundMethod === "GCASH" && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium">GCash Number *</label>
              <input
                type="text"
                inputMode="numeric"
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none ${
                  gcashNumber && !gcashValid ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="09123456789"
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
              />
              {gcashNumber && !gcashValid && (
                <p className="text-xs text-red-500 mt-1">Must start with 09 and be exactly 11 digits</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Reference Number *</label>
              <input
                type="text"
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none ${
                  referenceNumber && !referenceValid ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter reference number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
              {referenceNumber && !referenceValid && (
                <p className="text-xs text-red-500 mt-1">Reference number is required</p>
              )}
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

        {/* Submit button */}
        <div className="mt-4">
          <Button
            className={`w-full ${accountingPreview && accountingPreview.cashToReturn > 0
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
            disabled={!allReasonsFilled || !batchHasQty || !gcashValid || !referenceValid || isPending}
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
