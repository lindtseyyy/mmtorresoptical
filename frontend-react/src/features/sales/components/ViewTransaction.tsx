import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Receipt,
  Banknote,
  ShoppingCart,
  RotateCcw,
  Undo2,
  X,
  Ban,
  Eye,
  EyeOff,
  CreditCard,
  PackageOpen,
  PackageCheck,
  Printer,
  FileText,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { isAdmin } from "@/shared/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { fetchTransaction, refundTransaction, voidTransaction, addPayment, updateFulfillmentStatus } from "@/features/sales/services/transactionApi";
import { toast } from "sonner";
import type { TransactionItemResponse, RefundStateItem, RefundMethod, PaymentResponse, ItemRefundResponse, RefundReceiptData } from "@/features/sales/types";
import RefundDrawer from "./RefundDrawer";
import RefundReceipt from "./RefundReceipt";
import PrintableReceipt from "./PrintableReceipt";
import AddPaymentDrawer from "./AddPaymentDrawer";
import PaymentReceipt from "./PaymentReceipt";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (amount: number) =>
  `₱ ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ViewTransaction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const transactionId = id!;

  const queryClient = useQueryClient();

  const { data: tx, isLoading } = useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => fetchTransaction(transactionId),
    enabled: !!transactionId,
  });

  const refundMutation = useMutation({
    mutationFn: refundTransaction,
    onSuccess: (data: ItemRefundResponse) => {
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["daily-cash-inflow"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-metrics"] });
      toast.success("Refund processed successfully.");
      // Store the response for receipt display
      setLastRefundResponse(data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Refund failed.");
    },
  });

  const voidMutation = useMutation({
    mutationFn: ({ reason, password }: { reason: string; password: string }) =>
      voidTransaction(transactionId, reason, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["daily-cash-inflow"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-metrics"] });
      toast.success("Transaction voided successfully.");
      setVoidDialogOpen(false);
      setVoidReason("");
      setVoidPassword("");
      setShowVoidPassword(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Void failed.");
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: { amount: number; paymentMethod: string; gcashNumber?: string; referenceNumber?: string }) =>
      addPayment(transactionId, data),
    onSuccess: (payment: PaymentResponse) => {
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Payment added successfully");
      setPaymentDrawerOpen(false);
      setLastPayment(payment);
      setPaymentReceiptOpen(true);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Payment failed");
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: (status: string) => updateFulfillmentStatus(transactionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setFulfillDialogOpen(false);
      setFulfillTarget(null);
      toast.success("Fulfillment status updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Failed to update fulfillment status");
    },
  });

  // ── Refund workflow state ──
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refundItems, setRefundItems] = useState<RefundStateItem[]>([]);

  // ── Refund receipt state ──
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastRefundResponse, setLastRefundResponse] = useState<ItemRefundResponse | null>(null);

  // ── Payment drawer state ──
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  // ── Payment receipt state ──
  const [paymentReceiptOpen, setPaymentReceiptOpen] = useState(false);
  const [lastPayment, setLastPayment] = useState<PaymentResponse | null>(null);

  // ── Reprint receipt state ──
  const [reprintReceiptOpen, setReprintReceiptOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);

  // ── Refund receipt reprint state ──
  const [reprintRefundReceipt, setReprintRefundReceipt] = useState<RefundReceiptData | null>(null);

  // ── Payment receipt reprint state ──
  const [reprintPayment, setReprintPayment] = useState<PaymentResponse | null>(null);

  // ── Fulfillment dialog state ──
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [fulfillTarget, setFulfillTarget] = useState<"FOR_PICKUP" | "COMPLETED" | null>(null);

  // ── Void dialog state ──
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voidPassword, setVoidPassword] = useState("");
  const [showVoidPassword, setShowVoidPassword] = useState(false);

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedItems(new Set());
  };

  const toggleItem = (item: TransactionItemResponse) => {
    const refundableQty = item.quantity - (item.refundedQuantity ?? 0);
    if (refundableQty <= 0) return;

    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item.transactionItemId)) {
        next.delete(item.transactionItemId);
      } else {
        next.add(item.transactionItemId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!tx) return;
    const refundable = tx.transactionItems.filter(
      (i) => (i.refundedQuantity ?? 0) < i.quantity
    );

    if (selectedItems.size === refundable.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(refundable.map((i) => i.transactionItemId)));
    }
  };

  const handlePrepareRefund = () => {
    if (!tx) return;
    const items: RefundStateItem[] = [];
    for (const item of tx.transactionItems) {
      if (selectedItems.has(item.transactionItemId)) {
        const maxQty = item.quantity - (item.refundedQuantity ?? 0);
        items.push({
          transactionItemId: item.transactionItemId,
          productName: item.product?.productName ?? "Unknown",
          unitPrice: item.unitPrice,
          maxQuantity: maxQty,
          refundQuantity: 1,
          refundReason: "",
          discountType: item.discountType,
          discountValue: item.discountValue,
          isDiscounted: item.isDiscounted,
          originalQuantity: item.quantity,
          batchAllocations: item.batchAllocations,
        });
      }
    }
    if (items.length === 0) {
      toast.error("No items selected for refund.");
      return;
    }
    setRefundItems(items);
    setDrawerOpen(true);
  };

  const handleCompleteRefund = (
    finalItems: RefundStateItem[],
    refundMethod: RefundMethod,
    gcashNumber?: string,
    referenceNumber?: string
  ): Promise<ItemRefundResponse> => {
    return new Promise((resolve, reject) => {
      refundMutation.mutate(
        {
          items: finalItems.map((i) => ({
            transactionItemId: i.transactionItemId,
            refundQuantity: i.refundQuantity,
            refundReason: i.refundReason,
            batchAllocations: (i as any).selectedBatchAllocations,
          })),
          refundMethod,
          gcashNumber,
          referenceNumber,
        },
        {
          onSuccess: (data: ItemRefundResponse) => {
            setDrawerOpen(false);
            cancelSelection();
            resolve(data);
          },
          onError: (error: Error) => {
            reject(error);
          },
        }
      );
    });
  };

  const handleRefundDrawerSuccess = (response: ItemRefundResponse) => {
    setDrawerOpen(false);
    cancelSelection();
    if (response.refundReceipt) {
      setReceiptOpen(true);
    }
  };

  // Only CASH/GCASH refunds count toward the refundable cash pool
  const totalCashRefunded = tx
    ? (tx.refundReceipts ?? []).reduce((sum, receipt) => {
        if (receipt.refundMethod === "CASH" || receipt.refundMethod === "GCASH") {
          return sum + (receipt.actualCashback ?? 0);
        }
        return sum;
      }, 0)
    : 0;

  // All refunded item values, used for revised total computation
  const totalAllRefunded = tx
    ? (tx.refundReceipts ?? []).reduce((sum, receipt) => {
        return (
          sum +
          (receipt.refundItems ?? []).reduce(
            (s, item) => s + (item.itemCreditAmount ?? 0),
            0
          )
        );
      }, 0)
    : 0;

  const revisedTotal = tx
    ? tx.totalAmount - totalAllRefunded
    : 0;

  const effectiveBalanceDue = tx
    ? Math.max(0, revisedTotal - ((tx.amountPaid ?? 0) - totalCashRefunded))
    : 0;

  const canRefund =
    tx &&
    tx.transactionStatus !== "VOIDED" &&
    tx.refundStatus !== "FULL" &&
    tx.transactionItems.some((i) => (i.refundedQuantity ?? 0) < i.quantity);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Transaction not found.</p>
        <Button variant="link" asChild className="mt-2">
          <Link to="/transactions">Back to Sales and Transactions</Link>
        </Button>
      </div>
    );
  }

  const refundableCount = tx.transactionItems.filter(
    (i) => (i.refundedQuantity ?? 0) < i.quantity
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold">{tx.transactionNumber}</h2>
                <StatusBadge status={tx.transactionStatus} />
                <StatusBadge status={tx.fulfillmentStatus} />
                {tx.refundStatus !== "NONE" && (
                  <StatusBadge status={tx.refundStatus} displayText={tx.refundStatus === "FULL" ? "Fully Refunded" : "Partially Refunded"} />
                )}
              </div>
              <p className="text-muted-foreground">Transaction details</p>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/transactions">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Sales and Transactions
          </Link>
        </Button>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => setReprintReceiptOpen(true)}
              >
                <Printer className="h-3.5 w-3.5" />
                Reprint Receipt
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => setStatementOpen(true)}
              >
                <FileText className="h-3.5 w-3.5" />
                Statement of Account
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin() && tx.transactionStatus === "DEPOSIT" && (
                <Button
                  size="sm"
                  className="h-8"
                  onClick={() => setPaymentDrawerOpen(true)}
                >
                  <CreditCard className="mr-1 h-3.5 w-3.5" />
                  Add Payment
                </Button>
              )}
              {isAdmin() && tx.fulfillmentStatus === "PENDING_LAB" && tx.refundStatus !== "FULL" && tx.transactionStatus !== "VOIDED" && (
                <Button
                  size="sm"
                  className="h-8 bg-yellow-600 hover:bg-yellow-700 text-white"
                  onClick={() => { setFulfillTarget("FOR_PICKUP"); setFulfillDialogOpen(true); }}
                  disabled={fulfillMutation.isPending}
                >
                  <PackageCheck className="mr-1 h-3.5 w-3.5" />
                  Mark as For Pickup
                </Button>
              )}
              {isAdmin() && tx.fulfillmentStatus === "FOR_PICKUP" && tx.refundStatus !== "FULL" && tx.transactionStatus !== "VOIDED" && (
                <Button
                  size="sm"
                  className="h-8 bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                  onClick={() => { setFulfillTarget("COMPLETED"); setFulfillDialogOpen(true); }}
                  disabled={tx.transactionStatus !== "PAID" || fulfillMutation.isPending}
                  title={tx.transactionStatus !== "PAID" ? "Transaction must be fully paid before marking as picked up" : undefined}
                >
                  <PackageOpen className="mr-1 h-3.5 w-3.5" />
                  Mark as Picked Up
                </Button>
              )}
              {isAdmin() && ((tx.fulfillmentStatus === "PENDING_LAB" && tx.refundStatus === "NONE" && (tx.transactionStatus === "DEPOSIT" || (tx.transactionStatus === "PAID" && tx.payments.length < 2))) || (tx.fulfillmentStatus === "COMPLETED" && tx.transactionStatus === "PAID" && tx.refundStatus === "NONE" && !tx.prescriptionId && tx.payments.length < 2)) && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 text-white"
                  onClick={() => setVoidDialogOpen(true)}
                  disabled={voidMutation.isPending}
                >
                  <Ban className="mr-1 h-3.5 w-3.5" />
                  Void
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Transaction Number</p>
              <p className="font-medium">{tx.transactionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{formatDateTime(tx.transactionDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="font-medium">{formatCurrency(tx.totalAmount)}</p>
            </div>
            {tx.refundStatus !== "NONE" && (
              <div>
                <p className="text-xs text-muted-foreground">Revised Total Amount</p>
                <p className="font-medium">{formatCurrency(revisedTotal)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="font-medium text-green-600">{formatCurrency(tx.amountPaid ?? 0)}</p>
            </div>
            {effectiveBalanceDue > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Balance Due</p>
                <p className="font-medium text-amber-600">{formatCurrency(effectiveBalanceDue)}</p>
              </div>
            )}
            {tx.fulfillmentStatus === "COMPLETED" && tx.completedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Completed At</p>
                <p className="font-medium">{formatDateTime(tx.completedAt)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Processed By</p>
              <p className="font-medium">{tx.createdBy.fullName}</p>
            </div>
            {tx.patient && (
              <div>
                <p className="text-xs text-muted-foreground">Patient</p>
                <p className="font-medium">{tx.patient.fullName}</p>
              </div>
            )}
            {tx.prescriptionId && tx.rxNumber && (
              <div>
                <p className="text-xs text-muted-foreground">Prescription Number</p>
                <p className="font-medium">{tx.rxNumber}</p>
              </div>
            )}
            {tx.estimatedReadyDate && (
              <div>
                <p className="text-xs text-muted-foreground">Estimated Pickup</p>
                <p className="font-medium">{formatDate(tx.estimatedReadyDate)}</p>
              </div>
            )}
          </div>

          {/* Senior/PWD Discount Info */}
          {tx.isSeniorPwdApplied && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {tx.seniorPwdType === "SENIOR_CITIZEN" ? "Senior Citizen" : tx.seniorPwdType === "PWD" ? "PWD" : "Senior / PWD"} Discount Applied
              </p>
              <div className="grid grid-cols-3 gap-x-8 gap-y-1 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium">{tx.seniorPwdName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{tx.seniorPwdAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID Number</p>
                  <p className="font-medium">{tx.seniorPwdIdNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          {(tx.payments?.length ?? 0) > 0 && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">Payment History</h3>
              <div className="overflow-x-auto rounded-md bg-muted/50 p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 text-right font-medium">Amount</th>
                      <th className="py-2 pr-4 font-medium">Method</th>
                      <th className="py-2 pr-4 font-medium">GCash No.</th>
                      <th className="py-2 pr-4 font-medium">Reference</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.payments.map((p: PaymentResponse) => (
                      <tr key={p.id} className="border-b text-muted-foreground last:border-b-0">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {formatDateTime(p.createdAt)}
                        </td>
                        <td className="py-2 pr-4 text-right font-medium text-green-600">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-2 pr-4 capitalize">{p.paymentMethod}</td>
                        <td className="py-2 pr-4">{p.gcashNumber || "—"}</td>
                        <td className="py-2 pr-4">{p.referenceNumber || "—"}</td>
                        <td className="py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1"
                            onClick={() => setReprintPayment(p)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Reprint
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(tx.refundReceipts?.length ?? 0) > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 border-t pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Refund Events</p>
                <p className="font-medium">{tx.refundReceipts.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cash Refunded</p>
                <p className="font-medium text-red-600">
                  {formatCurrency(
                    tx.refundReceipts.reduce((total, receipt) => {
                      if (receipt.refundMethod === "CASH" || receipt.refundMethod === "GCASH") {
                        return total + (receipt.actualCashback ?? 0);
                      }
                      return total;
                    }, 0)
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Items
              </CardTitle>
              <CardDescription>
                {tx.transactionItems.length} item(s)
                {selectionMode && ` — ${selectedItems.size} selected`}
              </CardDescription>
            </div>

            {isAdmin() && !selectionMode && canRefund && (
              <Button
                size="sm"
                className="h-8 bg-amber-600 text-white hover:bg-amber-700"
                onClick={() => setSelectionMode(true)}
                disabled={refundMutation.isPending}
              >
                <Undo2 className="mr-1 h-3.5 w-3.5" />
                Refund Item(s)
              </Button>
            )}

            {selectionMode && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={cancelSelection}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 bg-amber-600 text-white hover:bg-amber-700"
                  onClick={handlePrepareRefund}
                  disabled={selectedItems.size === 0}
                >
                  Prepare Refund ({selectedItems.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  {selectionMode && (
                    <th className="py-3 pr-2 w-8">
                      <Checkbox
                        checked={
                          refundableCount > 0 &&
                          selectedItems.size === refundableCount
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 text-center font-medium">Unit Price</th>
                  <th className="py-3 pr-4 text-center font-medium">Qty</th>
                  <th className="py-3 pr-4 text-center font-medium">Discount</th>
                  <th className="py-3 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {tx.transactionItems.map((item: TransactionItemResponse) => {
                  const refundableQty =
                    item.quantity - (item.refundedQuantity ?? 0);
                  const isSelected = selectedItems.has(item.transactionItemId);

                  return (
                    <tr key={item.transactionItemId} className="border-b">
                      {selectionMode && (
                        <td className="py-3 pr-2 align-top">
                          <Checkbox
                            checked={isSelected}
                            disabled={refundableQty <= 0}
                            onCheckedChange={() => toggleItem(item)}
                          />
                        </td>
                      )}
                      <td className="py-3 pr-4 align-top">
                        <p className="font-medium">
                          {item.product?.productName ?? "—"}
                        </p>
                        {(item.batchAllocations ?? []).length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.batchAllocations!.map((alloc) => (
                              <div
                                key={alloc.productBatchId}
                                className="text-xs text-muted-foreground flex items-center gap-1"
                              >
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                <span>
                                  {alloc.quantityDeducted} {alloc.quantityDeducted === 1 ? "unit" : "units"} from{" "}
                                  <span className="font-medium text-foreground">{alloc.batchNumber}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {(item.refundedQuantity ?? 0) > 0 && (
                          <span className="text-xs text-red-600">
                            Refunded: {item.refundedQuantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center align-top">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 pr-4 text-center align-top">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-4 text-center align-top">
                        {item.isDiscounted
                          ? item.discountType === "PERCENT"
                            ? `${item.discountValue}%`
                            : formatCurrency(item.discountValue)
                          : "—"}
                      </td>
                      <td className="py-3 text-right font-medium align-top">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Refunded Items — grouped by refund event */}
          {(tx.refundReceipts?.length ?? 0) > 0 && (
            <>
              <div className="mt-6 flex items-center gap-2 border-t pt-4">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Refund History ({tx.refundReceipts.length} event{tx.refundReceipts.length !== 1 ? "s" : ""})
                </h3>
              </div>
              <div className="mt-2 space-y-4">
                {[...tx.refundReceipts].reverse().map((receipt: RefundReceiptData) => (
                  <div
                    key={receipt.refundReceiptId}
                    className="rounded-lg border border-border bg-muted/30 p-4"
                  >
                    {/* Event Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {receipt.receiptNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(receipt.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {receipt.issuedByFullName}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1"
                          onClick={() => setReprintRefundReceipt(receipt)}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Reprint
                        </Button>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto rounded-md bg-background/50 p-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 pr-2 font-medium text-xs">Product</th>
                            <th className="py-2 pr-2 text-center font-medium text-xs">Unit Price</th>
                            <th className="py-2 pr-2 text-center font-medium text-xs">Qty</th>
                            <th className="py-2 pr-2 text-center font-medium text-xs">Item Credit</th>
                            <th className="py-2 font-medium text-xs">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(receipt.refundItems ?? []).map((item) => (
                            <tr key={item.refundItemId} className="border-b border-muted-foreground/10 text-muted-foreground">
                              <td className="py-2 pr-2 align-top">
                                <p className="font-medium text-foreground text-xs">
                                  {item.productName}
                                </p>
                                {(item.batchDetails ?? []).length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {item.batchDetails!.map((bd, idx) => (
                                      <div key={idx} className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                        <span>
                                          Returned {bd.quantityRestored} {bd.quantityRestored === 1 ? "unit" : "units"} to{" "}
                                          <span className="font-medium text-foreground">{bd.batchNumber}</span>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 pr-2 text-center text-xs">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="py-2 pr-2 text-center text-xs">
                                {item.quantityRefunded}
                              </td>
                              <td className="py-2 pr-2 text-center text-red-600 text-xs">
                                {formatCurrency(item.itemCreditAmount ?? 0)}
                              </td>
                              <td className="py-2 text-xs">{item.refundReason || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Event Footer */}
                    <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Method:</span>{" "}
                          {receipt.refundMethod === "BALANCE_ADJUSTMENT"
                            ? "Balance Adjustment"
                            : receipt.refundMethod}
                        </div>
                        <div className="text-sm font-semibold">
                          {receipt.actualCashback > 0 ? (
                            <span className="text-red-600">
                              Amount Returned: {formatCurrency(receipt.actualCashback)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Balance Adjustment
                            </span>
                          )}
                        </div>
                      </div>
                      {receipt.refundMethod === "GCASH" && (receipt.gcashNumber || receipt.referenceNumber) && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {receipt.gcashNumber && (
                            <span>
                              <span className="font-medium">GCash No:</span> {receipt.gcashNumber}
                            </span>
                          )}
                          {receipt.referenceNumber && (
                            <span>
                              <span className="font-medium">Ref:</span> {receipt.referenceNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Void Transaction Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Transaction</DialogTitle>
            <DialogDescription>
              This will mark <strong>{tx.transactionNumber}</strong> as voided and restore all item quantities to stock. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="void-reason">Reason</Label>
              <Input
                id="void-reason"
                placeholder="Enter reason for voiding"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="void-password">Password</Label>
              <div className="relative">
                <Input
                  id="void-password"
                  type={showVoidPassword ? "text" : "password"}
                  placeholder="Enter your password to confirm"
                  className="pr-10"
                  value={voidPassword}
                  onChange={(e) => setVoidPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      voidMutation.mutate({ reason: voidReason, password: voidPassword });
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowVoidPassword(!showVoidPassword)}
                  tabIndex={-1}
                >
                  {showVoidPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setVoidDialogOpen(false);
                  setVoidReason("");
                  setVoidPassword("");
                  setShowVoidPassword(false);
                }}
                disabled={voidMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="text-white"
                onClick={() =>
                  voidMutation.mutate({ reason: voidReason, password: voidPassword })
                }
                disabled={!voidReason.trim() || !voidPassword || voidMutation.isPending}
              >
                {voidMutation.isPending ? "Processing..." : "Proceed"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fulfillment Confirmation Dialog */}
      <Dialog open={fulfillDialogOpen} onOpenChange={setFulfillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {fulfillTarget === "FOR_PICKUP" ? "Mark as Ready for Pickup" : "Mark as Picked Up"}
            </DialogTitle>
            <DialogDescription>
              {fulfillTarget === "FOR_PICKUP" ? (
                <>
                  This will mark <strong>{tx?.transactionNumber}</strong> as <strong>Ready for Pickup</strong>. The patient can now come in to collect their glasses.
                </>
              ) : (
                <>
                  This will mark <strong>{tx?.transactionNumber}</strong> as <strong>Picked Up</strong>. This confirms the glasses have been handed to the patient and the order is complete. This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => { setFulfillDialogOpen(false); setFulfillTarget(null); }}
              disabled={fulfillMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className={fulfillTarget === "FOR_PICKUP" ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-teal-600 hover:bg-teal-700 text-white"}
              onClick={() => fulfillTarget && fulfillMutation.mutate(fulfillTarget)}
              disabled={fulfillMutation.isPending || !fulfillTarget}
            >
              {fulfillMutation.isPending ? "Processing..." : fulfillTarget === "FOR_PICKUP" ? "Confirm Ready" : "Confirm Picked Up"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Drawer */}
      <RefundDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        items={refundItems}
        onComplete={handleCompleteRefund}
        onRefundSuccess={handleRefundDrawerSuccess}
        isPending={refundMutation.isPending}
        amountPaid={tx.amountPaid}
        totalAlreadyRefunded={totalCashRefunded}
        totalAllRefunded={totalAllRefunded}
        transactionTotal={tx.totalAmount}
        transactionAmountPaid={tx.amountPaid ?? 0}
      />

      {/* Add Payment Drawer */}
      {tx && (
        <AddPaymentDrawer
          open={paymentDrawerOpen}
          onClose={() => setPaymentDrawerOpen(false)}
          transactionNumber={tx.transactionNumber}
          totalAmount={tx.totalAmount}
          balanceDue={effectiveBalanceDue}
          onComplete={(data) => addPaymentMutation.mutate(data)}
          pending={addPaymentMutation.isPending}
        />
      )}

      {/* Refund Receipt Dialog */}
      {tx && lastRefundResponse && (
        <RefundReceipt
          open={receiptOpen}
          onClose={() => {
            setReceiptOpen(false);
            setLastRefundResponse(null);
          }}
          refundData={lastRefundResponse}
          transaction={tx}
        />
      )}

      {/* Refund Receipt Reprint Dialog */}
      {tx && reprintRefundReceipt && (
        <RefundReceipt
          open={!!reprintRefundReceipt}
          onClose={() => setReprintRefundReceipt(null)}
          reprintData={reprintRefundReceipt}
          transaction={tx}
        />
      )}

      {/* Reprint Receipt Dialog */}
      <PrintableReceipt
        open={reprintReceiptOpen}
        onClose={() => setReprintReceiptOpen(false)}
        transaction={tx}
        printMode="ORIGINAL"
        isReprint
      />

      {/* Statement of Account Dialog */}
      <PrintableReceipt
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        transaction={tx}
        printMode="UPDATED"
      />

      {/* Payment Receipt Dialog */}
      {tx && lastPayment && (
        <PaymentReceipt
          open={paymentReceiptOpen}
          onClose={() => {
            setPaymentReceiptOpen(false);
            setLastPayment(null);
          }}
          transaction={tx}
          payment={lastPayment}
        />
      )}

      {/* Payment Receipt Reprint Dialog */}
      {tx && reprintPayment && (() => {
        const sortedPayments = [...tx.payments].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const idx = sortedPayments.findIndex((p) => p.id === reprintPayment.id);
        const previousPaid = idx > 0
          ? sortedPayments.slice(0, idx).reduce((sum, p) => sum + p.amount, 0)
          : 0;
        return (
          <PaymentReceipt
            open={!!reprintPayment}
            onClose={() => setReprintPayment(null)}
            transaction={tx}
            payment={reprintPayment}
            isReprint
            previousPaid={previousPaid}
          />
        );
      })()}
    </div>
  );
};

export default ViewTransaction;
