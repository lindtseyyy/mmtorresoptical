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
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { fetchTransaction, refundTransaction, voidTransaction } from "@/features/sales/services/transactionApi";
import { toast } from "sonner";
import type { TransactionItemResponse, RefundStateItem, RefundMethod } from "@/features/sales/types";
import RefundDrawer from "./RefundDrawer";

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

const paymentTypeLabel = (pt: string) =>
  pt === "CASH" ? "Cash" : pt === "GCASH" ? "GCash" : pt;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Refund processed successfully.");
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

  // ── Refund workflow state ──
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refundItems, setRefundItems] = useState<RefundStateItem[]>([]);

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
    refundMethod: RefundMethod
  ) => {
    refundMutation.mutate(
      {
        items: finalItems.map((i) => ({
          transactionItemId: i.transactionItemId,
          refundQuantity: i.refundQuantity,
          refundReason: i.refundReason,
        })),
        refundMethod,
      },
      {
        onSuccess: () => {
          setDrawerOpen(false);
          cancelSelection();
        },
      }
    );
  };

  const canRefund =
    tx &&
    tx.transactionStatus !== "VOIDED" &&
    tx.transactionStatus !== "FULLY_REFUNDED" &&
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
          <Link to="/transactions">Back to Transactions</Link>
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
                <Badge
                  className={
                    tx.transactionStatus === "COMPLETED"
                      ? "bg-green-700 text-white"
                      : tx.transactionStatus === "VOIDED"
                        ? "bg-red-700 text-white"
                        : tx.transactionStatus === "PARTIALLY_REFUNDED"
                          ? "bg-amber-700 text-white"
                          : "bg-gray-600 text-white"
                  }
                >
                  {tx.transactionStatus.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-muted-foreground">Transaction details</p>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/transactions">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Transactions
          </Link>
        </Button>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Payment Details
            </CardTitle>
            {tx.transactionStatus === "COMPLETED" && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 text-white"
                onClick={() => setVoidDialogOpen(true)}
                disabled={voidMutation.isPending}
              >
                <Ban className="mr-1 h-3.5 w-3.5" />
                Void Transaction
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Transaction Number</p>
              <p className="font-medium text-sm">{tx.transactionNumber}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{formatDateTime(tx.transactionDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Type</p>
              <p className="font-medium">{paymentTypeLabel(tx.paymentType)}</p>
            </div>
            {tx.referenceNumber && (
              <div>
                <p className="text-xs text-muted-foreground">Reference Number</p>
                <p className="font-medium">{tx.referenceNumber}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="font-medium">{formatCurrency(tx.totalAmount)}</p>
            </div>
            {tx.paymentType === "CASH" && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Cash Tender</p>
                  <p className="font-medium">{formatCurrency(tx.cashTender)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Change</p>
                  <p className="font-medium">{formatCurrency(tx.change)}</p>
                </div>
              </>
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
          </div>

          {tx.transactionItems.some(
            (item) => (item.refundDetailsDTOList?.length ?? 0) > 0
          ) && (
            <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 border-t pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Refunded Items</p>
                <p className="font-medium">
                  {tx.transactionItems.reduce(
                    (count, item) =>
                      count + (item.refundDetailsDTOList?.length ?? 0),
                    0
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Refunded Amount</p>
                <p className="font-medium text-red-600">
                  {formatCurrency(
                    tx.transactionItems.reduce((total, item) => {
                      const itemTotal = (item.refundDetailsDTOList ?? []).reduce(
                        (sum, r) => sum + r.refundAmount,
                        0
                      );
                      return total + itemTotal;
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

            {!selectionMode && canRefund && (
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
                        <td className="py-3 pr-2">
                          <Checkbox
                            checked={isSelected}
                            disabled={refundableQty <= 0}
                            onCheckedChange={() => toggleItem(item)}
                          />
                        </td>
                      )}
                      <td className="py-3 pr-4">
                        <p className="font-medium">
                          {item.product?.productName ?? "—"}
                        </p>
                        {(item.refundedQuantity ?? 0) > 0 && (
                          <span className="text-xs text-red-600">
                            Refunded: {item.refundedQuantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {item.isDiscounted
                          ? item.discountType === "PERCENT"
                            ? `${item.discountValue}%`
                            : formatCurrency(item.discountValue)
                          : "—"}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Refunded Items */}
          {tx.transactionItems.some(
            (item) => (item.refundDetailsDTOList?.length ?? 0) > 0
          ) && (
            <>
              <div className="mt-6 flex items-center gap-2 border-t pt-4">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Refunded Items ({tx.transactionItems.reduce((sum, item) => sum + (item.refundDetailsDTOList?.length ?? 0), 0)})
                </h3>
              </div>
              <div className="mt-2 overflow-x-auto rounded-md bg-muted/50 p-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Product</th>
                      <th className="py-3 pr-4 text-center font-medium">Unit Price</th>
                      <th className="py-3 pr-4 text-center font-medium">Qty</th>
                      <th className="py-3 pr-4 text-right font-medium">Amount</th>
                      <th className="py-3 pr-4 font-medium">Reason</th>
                      <th className="py-3 pr-4 text-center font-medium">Refund Method</th>
                      <th className="py-3 font-medium">Refund Date</th>
                      <th className="py-3 font-medium">Refunded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tx.transactionItems.flatMap((item) =>
                      (item.refundDetailsDTOList ?? []).map((refund) => (
                        <tr
                          key={refund.refundId}
                          className="border-b text-muted-foreground"
                        >
                          <td className="py-3 pr-4">
                            <p className="font-medium text-foreground">
                              {item.product?.productName ?? "—"}
                            </p>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {refund.refundQuantity}
                          </td>
                          <td className="py-3 pr-4 text-right text-red-600">
                            {formatCurrency(refund.refundAmount)}
                          </td>
                          <td className="py-3 pr-4">{refund.refundReason}</td>
                          <td className="py-3 pr-4 text-center capitalize">{refund.refundMethod}</td>
                          <td className="py-3 whitespace-nowrap">
                            {formatDateTime(refund.refundedAt)}
                          </td>
                          <td className="py-3 whitespace-nowrap">
                            {refund.refundedBy?.fullName ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Void Transaction Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
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
      </Dialog>

      {/* Refund Drawer */}
      <RefundDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        items={refundItems}
        onComplete={handleCompleteRefund}
        isPending={refundMutation.isPending}
      />
    </div>
  );
};

export default ViewTransaction;
