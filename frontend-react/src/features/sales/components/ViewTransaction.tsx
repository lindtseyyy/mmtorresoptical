import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Receipt, Banknote, Calendar, User, ShoppingCart, Undo2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { fetchTransaction, refundTransaction } from "@/features/sales/services/transactionApi";
import { toast } from "sonner";
import type { TransactionItemResponse } from "@/features/sales/types";

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
  const navigate = useNavigate();

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
      toast.success("Item refunded successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Refund failed.");
    },
  });

  const handleRefundItem = (item: TransactionItemResponse) => {
    const refundableQty = item.quantity - (item.refundedQuantity ?? 0);
    const reason = window.prompt(
      `Refund "${item.product?.productName ?? "item"}" (max ${refundableQty}). Enter reason:`
    );
    if (!reason) return null;
    const qtyStr = window.prompt(`Enter quantity to refund (max ${refundableQty}):`, String(refundableQty));
    const qty = Number(qtyStr);
    if (!qty || qty < 1 || qty > refundableQty) {
      toast.error("Invalid refund quantity.");
      return null;
    }
    return { transactionItemId: item.transactionItemId, refundQuantity: qty, refundReason: reason };
  };

  const handleRefundAll = () => {
    if (!tx) return;
    const refundableItems = tx.transactionItems.filter(
      (i) => (i.refundedQuantity ?? 0) < i.quantity
    );
    if (refundableItems.length === 0) {
      toast.error("No items available for refund.");
      return;
    }
    const results: { transactionItemId: string; refundQuantity: number; refundReason: string }[] = [];
    for (const item of refundableItems) {
      const result = handleRefundItem(item);
      if (!result) return; // user cancelled
      results.push(result);
    }
    if (results.length === 0) return;
    refundMutation.mutate({ items: results });
  };

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
                <h2 className="text-3xl font-bold">
                  {tx.transactionNumber}
                </h2>
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
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Payment Details
          </CardTitle>
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
              <CardDescription>{tx.transactionItems.length} item(s)</CardDescription>
            </div>
            {tx.transactionStatus !== "VOIDED" &&
              tx.transactionStatus !== "FULLY_REFUNDED" &&
              tx.transactionItems.some((i) => (i.refundedQuantity ?? 0) < i.quantity) && (
                <Button
                  size="sm"
                  className="h-8 bg-amber-600 text-white hover:bg-amber-700"
                  onClick={handleRefundAll}
                  disabled={refundMutation.isPending}
                >
                  <Undo2 className="mr-1 h-3.5 w-3.5" />
                  Refund Item(s)
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 text-center font-medium">Unit Price</th>
                  <th className="py-3 pr-4 text-center font-medium">Qty</th>
                  <th className="py-3 pr-4 text-center font-medium">Discount</th>
                  <th className="py-3 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {tx.transactionItems.map((item: TransactionItemResponse) => (
                  <tr key={item.transactionItemId} className="border-b">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{item.product?.productName ?? "—"}</p>
                      {(item.refundedQuantity ?? 0) > 0 && (
                        <span className="text-xs text-red-600">
                          Refunded: {item.refundedQuantity}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 pr-4 text-center">{item.quantity}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewTransaction;
