import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, ShoppingCart, Banknote, Calendar, Hash, TrendingUp, Layers, Glasses, ImageOff } from "lucide-react";
import StockAdjustmentModal from "./StockAdjustmentModal";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import { Badge } from "@/shared/components/ui/badge";
import {
  fetchProduct,
  fetchProductMetrics,
} from "@/features/inventory/services/productApi";
import { createProductBatchesQueryOptions } from "@/features/inventory/hooks/productQuery";
import type { ProductBatch, BatchBreakdownResponse } from "@/features/inventory/types";
import { isAdmin } from "@/shared/lib/auth";
import { getImageUrl } from "@/shared/lib/utils";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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
  const [imgFailed, setImgFailed] = useState(false);

  const isService = product?.productType === "SERVICE";

  const { data: batchData } = useQuery({
    ...createProductBatchesQueryOptions(productId),
    enabled: !!productId && !!product && !isService,
  });

  const batches = batchData?.batches;
  const availableQuantity = batchData?.availableQuantity ?? product?.quantity ?? 0;

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

  const inventoryValue = product.unitPrice * availableQuantity;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {isService ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Glasses className="h-6 w-6 text-muted-foreground" />
                </div>
              ) : product.imageDir && !imgFailed ? (
                <img
                  src={getImageUrl(product.imageDir) ?? undefined}
                  alt={product.productName}
                  className="h-12 w-12 rounded-lg object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  {imgFailed ? (
                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}
              <div>
                <h2 className="text-3xl font-bold">{product.productName}</h2>
                <div className="flex items-center gap-2 mt-1">
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
                      Needs Reordering
                    </Badge>
                  )}
                  {!product.isArchived && !isService && product.quantity <= 0 && (
                    <Badge className="bg-red-700 text-white hover:bg-red-700 cursor-default">
                      Out of Stock
                    </Badge>
                  )}
                  {!product.isArchived && !isService && product.quantity >= product.overstockedThreshold && (
                    <Badge className="bg-yellow-700 text-white hover:bg-yellow-700 cursor-default">
                      Overstocked
                    </Badge>
                  )}
                  {product.isSeniorPwdEligible && (
                    <Badge className="bg-green-700 text-white hover:bg-green-700 cursor-default">
                      Senior/PWD Discount Eligible
                    </Badge>
                  )}
                  {!isService && (
                    <Badge
                      className={
                        product.isPerishable
                          ? "bg-blue-700 text-white hover:bg-blue-700 cursor-default"
                          : "bg-gray-600 text-white hover:bg-gray-600 cursor-default"
                      }
                    >
                      {product.isPerishable ? "Perishable" : "Non-Perishable"}
                    </Badge>
                  )}
                </div>
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
                  Edit Item
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium">{product.categoryName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="font-medium">{product.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit Price</p>
              <p className="font-medium">₱ {product.unitPrice.toFixed(2)}</p>
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
            {!isService && (
              <div>
                <p className="text-xs text-muted-foreground">Lead Time</p>
                <p className="font-medium">{product.leadTimeDays} days</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(product.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Batch Breakdown */}
      {!isService && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Inventory Batch Breakdown
            </CardTitle>
            <CardDescription>
              Total available: <strong>{availableQuantity}</strong> units
              {product.isPerishable && " (unexpired batches only)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {batches && batches.length > 0 ? (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium w-1/4">Expiry Date</th>
                      <th className="px-4 py-3 text-left font-medium w-1/4">Batch Number</th>
                      <th className="px-4 py-3 text-right font-medium w-1/4">Qty Remaining</th>
                      <th className="px-4 py-3 text-left font-medium w-1/4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...batches].sort((a, b) => {
                      const statusPriority = (batch: ProductBatch) => {
                        if (batch.status === "EXPIRED") return 3;
                        if (batch.status === "NEAR_EXPIRY") return 2;
                        if (batch.status === "DEPLETED") return 4;
                        if (batch.expiryDate) return 0;
                        return 1;
                      };
                      const statusDiff = statusPriority(a) - statusPriority(b);
                      if (statusDiff !== 0) return statusDiff;
                      if (a.expiryDate && b.expiryDate) {
                        const dateDiff = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                        if (dateDiff !== 0) return dateDiff;
                      } else if (a.expiryDate) return -1;
                      else if (b.expiryDate) return 1;
                      return (a.batchNumber || "").localeCompare(b.batchNumber || "");
                    }).map((batch: ProductBatch, idx: number) => (
                      <tr
                        key={batch.productBatchId}
                        className={idx % 2 === 0 ? "bg-muted/50" : ""}
                      >
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(batch.expiryDate)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{batch.batchNumber}</td>
                        <td className="px-4 py-3 text-right">{batch.quantityRemaining}</td>
                        <td className="px-4 py-3">
                          {batch.status === "EXPIRED" ? (
                            <Badge className="bg-red-700 text-white hover:bg-red-700 cursor-default">Expired</Badge>
                          ) : batch.status === "NEAR_EXPIRY" ? (
                            <Badge className="bg-amber-700 text-white hover:bg-amber-700 cursor-default">Expiring Soon</Badge>
                          ) : batch.status === "DEPLETED" ? (
                            <Badge className="bg-gray-600 text-white hover:bg-gray-600 cursor-default">Depleted</Badge>
                          ) : batch.expiryDate ? (
                            <Badge className="bg-green-700 text-white hover:bg-green-700 cursor-default">Healthy</Badge>
                          ) : (
                            <Badge className="bg-green-700 text-white hover:bg-green-700 cursor-default">No Expiry</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No batches recorded.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {!isService && (
        <StockAdjustmentModal
          open={adjustModalOpen}
          onOpenChange={setAdjustModalOpen}
          product={{
            productId: product.productId,
            productName: product.productName,
            quantity: product.quantity,
            isPerishable: product.isPerishable,
          }}
        />
      )}
    </div>
  );
};

export default ViewProduct;
