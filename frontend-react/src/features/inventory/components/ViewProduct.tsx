import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Package, ShoppingCart, Banknote, Calendar, Hash, TrendingUp, Layers } from "lucide-react";
import StockAdjustmentModal from "./StockAdjustmentModal";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import { Badge } from "@/shared/components/ui/badge";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import {
  fetchProduct,
  fetchProductMetrics,
} from "@/features/inventory/services/productApi";
import { fetchProductTransactions } from "@/features/sales/services/transactionApi";
import type { TransactionListItem } from "@/features/sales/types";
import { CATEGORY_LABELS, type Category } from "@/features/inventory/types";
import { isAdmin } from "@/shared/lib/auth";

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

const ViewProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productId = id!;
  const navigate = useNavigate();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
  });

  const { data: metrics } = useQuery({
    queryKey: ["product-metrics", productId],
    queryFn: () => fetchProductMetrics(productId),
    enabled: !!productId,
  });

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  const [txPage, setTxPage] = useState(0);
  const { data: txData, isFetching: txFetching } = useQuery({
    queryKey: ["product-transactions", productId, txPage],
    queryFn: () => fetchProductTransactions(productId, txPage, 10),
    placeholderData: keepPreviousData,
    enabled: !!productId,
  });

  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button variant="link" asChild className="mt-2">
          <Link to="/inventory">Back to Inventory</Link>
        </Button>
      </div>
    );
  }

  const isService = product.productType === "SERVICE";
  const inventoryValue = product.unitPrice * product.quantity;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {product.imageDir ? (
                <img
                  src={product.imageDir}
                  alt={product.productName}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-bold">{product.productName}</h2>
                  <Badge
                    className={
                      product.isArchived
                        ? "bg-gray-600 text-white"
                        : "bg-green-700 text-white hover:bg-green-700 cursor-default"
                    }
                  >
                    {product.isArchived ? "Archived" : "Active"}
                  </Badge>
                  {!product.isArchived && !isService && product.reorderPoint != null && product.quantity > 0 && product.quantity <= product.reorderPoint && (
                    <Badge className="bg-yellow-700 text-white hover:bg-yellow-700 cursor-default">
                      Reorder
                    </Badge>
                  )}
                  {!product.isArchived && !isService && product.quantity >= product.overstockedThreshold && (
                    <Badge className="bg-yellow-700 text-white hover:bg-yellow-700 cursor-default">
                      Overstocked
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">Item details and transaction history</p>
              </div>
            </div>
          </div>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/inventory">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      {/* Days-of-Supply Reorder Warning Banner */}
      {!isService && !product.isArchived && product.reorderPoint != null &&
        product.quantity <= product.reorderPoint &&
        product.suggestedOrderQuantity != null && product.suggestedOrderQuantity > 0 && (
          <div className="rounded-lg border border-amber-700/60 bg-amber-700 px-4 py-3">
            <p className="text-sm text-white">
              <span className="font-semibold">⚠️ Reorder Warning:</span> Stock is low. Based on
              your current 30-day sales velocity data, the suggested reorder quantity is{" "}
              <span className="font-bold">{product.suggestedOrderQuantity} units</span>.
            </p>
          </div>
        )}

      {/* Card Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={Package}
          label={isService ? "Not Applicable" : "Current Stock"}
          value={isService ? "—" : product.quantity}
          color="primary"
          size="sm"
        />

        <MetricCard
          icon={ShoppingCart}
          label="Total Units Sold"
          value={metrics?.totalUnitsSold ?? "—"}
          color="blue"
          size="sm"
        />

        <MetricCard
          icon={Banknote}
          label="Total Revenue Generated"
          value={metrics != null
            ? `₱ ${metrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : "—"}
          color="emerald"
          size="sm"
        />

        <MetricCard
          icon={Calendar}
          label="Last Sold Date"
          value={formatDate(metrics?.lastSoldDate ?? null)}
          color="amber"
          size="sm"
        />

        <MetricCard
          icon={Hash}
          label="Number of Transactions"
          value={metrics?.numberOfTransactions ?? "—"}
          color="violet"
          size="sm"
        />

        <MetricCard
          icon={TrendingUp}
          label="Inventory Value"
          value={isService
            ? "—"
            : `₱ ${inventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
          color="rose"
          size="sm"
        />
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Item information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isService && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustModalOpen(true)}
                >
                  <Layers className="mr-1.5 h-3.5 w-3.5" />
                  Adjust Stock
                </Button>
              )}
              {isAdmin() && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate(`/inventory/edit/${productId}`)}
                >
                  Edit Product
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Product Name</p>
              <p className="font-medium">{product.productName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium">{CATEGORY_LABELS[product.category as Category] ?? product.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="font-medium">{product.supplier}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit Price</p>
              <p className="font-medium">₱ {product.unitPrice.toFixed(2)}</p>
            </div>
            {!isService && (
              <div>
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="font-medium">{product.quantity}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(product.createdAt)}</p>
            </div>
            {!isService && (
              <div>
                <p className="text-xs text-muted-foreground">Low Stock Threshold</p>
                <p className="font-medium">{product.lowLevelThreshold}</p>
              </div>
            )}
            {!isService && (
              <div>
                <p className="text-xs text-muted-foreground">Overstock Threshold</p>
                <p className="font-medium">{product.overstockedThreshold}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>
                {txData?.totalElements ?? 0} total transaction(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {txFetching && !txData ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !txData || txData.content.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No transactions recorded for this product.
            </p>
          ) : (
            <div className="space-y-3">
              {txData.content.map((tx: TransactionListItem) => (
                <div
                  key={tx.transactionId}
                  className="rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {tx.referenceNumber || tx.transactionId.substring(0, 8)}
                        </span>
                        <StatusBadge status={tx.transactionStatus} />
                        {tx.refundStatus !== "NONE" && (
                          <StatusBadge status={tx.refundStatus} />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(tx.transactionDate)}</span>
                        <span>₱ {tx.totalAmount.toFixed(2)}</span>
                        <span className="capitalize">{tx.paymentType?.toLowerCase() ?? "N/A"}</span>
                      </div>
                      {tx.patient && (
                        <p className="text-xs text-muted-foreground">
                          Patient: {tx.patient.fullName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {txData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {txPage + 1} of {txData.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTxPage((p) => p - 1)}
                      disabled={txPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTxPage((p) => p + 1)}
                      disabled={txPage >= txData.totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isService && (
        <StockAdjustmentModal
          open={adjustModalOpen}
          onOpenChange={setAdjustModalOpen}
          product={{
            productId: product.productId,
            productName: product.productName,
            quantity: product.quantity,
          }}
        />
      )}
    </div>
  );
};

export default ViewProduct;
