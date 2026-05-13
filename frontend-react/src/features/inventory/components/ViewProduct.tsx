import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Archive, Undo2, Package, ShoppingCart, Banknote, Calendar, Hash, TrendingUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  fetchProduct,
  fetchProductMetrics,
} from "@/features/inventory/services/productApi";
import { fetchProductTransactions } from "@/features/sales/services/transactionApi";
import type { TransactionListItem } from "@/features/sales/types";
import {
  createArchiveProductMutationOptions,
  createRestoreProductMutationOptions,
} from "@/features/inventory/hooks/productQuery";

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
  const queryClient = useQueryClient();
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

  const [txPage, setTxPage] = useState(0);
  const { data: txData, isFetching: txFetching } = useQuery({
    queryKey: ["product-transactions", productId, txPage],
    queryFn: () => fetchProductTransactions(productId, txPage, 10),
    placeholderData: keepPreviousData,
    enabled: !!productId,
  });

  const archiveMutation = useMutation(
    createArchiveProductMutationOptions(queryClient)
  );

  const restoreMutation = useMutation(
    createRestoreProductMutationOptions(queryClient)
  );

  const handleArchive = () => {
    if (product?.isArchived) {
      restoreMutation.mutate(productId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["product", productId] });
        },
      });
    } else {
      archiveMutation.mutate(productId, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["product", productId] });
        },
      });
    }
  };

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
                </div>
                <p className="text-muted-foreground">Product details and transaction history</p>
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
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">{product.quantity}</p>
              <p className="text-xs text-muted-foreground">Current Stock</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">{metrics?.totalUnitsSold ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Total Units Sold</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
              <Banknote className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">
                {metrics != null
                  ? `₱ ${metrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Total Revenue Generated</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
              <Calendar className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold">{formatDate(metrics?.lastSoldDate ?? null)}</p>
              <p className="text-xs text-muted-foreground">Last Sold Date</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10">
              <Hash className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">{metrics?.numberOfTransactions ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Number of Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
              <TrendingUp className="h-4 w-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">
                ₱ {inventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground">Inventory Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Product information</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 shrink-0 p-0 [&_svg]:size-auto focus-visible:ring-0">
                  <MoreHorizontal className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                <DropdownMenuItem
                  onClick={() => navigate(`/inventory/edit/${productId}`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={archiveMutation.isPending || restoreMutation.isPending}
                >
                  {product.isArchived ? (
                    <>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <p className="font-medium capitalize">{product.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="font-medium">{product.supplier}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unit Price</p>
              <p className="font-medium">₱ {product.unitPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-medium">{product.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="font-medium">{formatDate(product.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Low Stock Threshold</p>
              <p className="font-medium">{product.lowLevelThreshold}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overstock Threshold</p>
              <p className="font-medium">{product.overstockedThreshold}</p>
            </div>
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateTime(tx.transactionDate)}</span>
                        <span>₱ {tx.totalAmount.toFixed(2)}</span>
                        <span className="capitalize">{tx.paymentType.toLowerCase()}</span>
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
    </div>
  );
};

export default ViewProduct;
