import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Search, Archive, Undo2, ChevronLeft, ChevronRight, Glasses, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { getImageUrl } from "@/shared/lib/utils";
import { MetricCard } from "@/shared/components/MetricCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import type { Product, Category } from "@/features/inventory/types";
import { CATEGORY_LABELS } from "@/features/inventory/types";
import {
  createArchiveProductMutationOptions,
  createRestoreProductMutationOptions,
  createProductsListQueryOptions,
  createInventorySummaryQueryOptions,
} from "@/features/inventory/hooks/productQuery";
import EmptyTableRows from "@/shared/components/EmptyTableRows";

const PAGE_SIZE = 10;

const InventoryMaintenance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [archivedFilter, setArchivedFilter] = useState("ACTIVE");
  const [sortBy, setSortBy] = useState("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryClient = useQueryClient();

  const { data: pageData, isLoading, isFetching } = useQuery({
    ...createProductsListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, categoryFilter, sortBy, sortOrder, "all", archivedFilter),
    placeholderData: keepPreviousData,
  });

  const products = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const { data: summary } = useQuery(createInventorySummaryQueryOptions());

  const [pendingArchive, setPendingArchive] = useState<{ id: string; unarchive: boolean } | null>(null);

  const archiveMutation = useMutation(
    createArchiveProductMutationOptions(queryClient)
  );

  const restoreMutation = useMutation(
    createRestoreProductMutationOptions(queryClient)
  );

  const handleArchive = (id: string, unarchive: boolean) => {
    setPendingArchive({ id, unarchive });
  };

  const confirmArchive = () => {
    if (pendingArchive) {
      if (pendingArchive.unarchive) {
        restoreMutation.mutate(pendingArchive.id);
      } else {
        archiveMutation.mutate(pendingArchive.id);
      }
      setPendingArchive(null);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, categoryFilter, sortBy, sortOrder, archivedFilter]);

  useEffect(() => {
    if (products.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [products.length, page, isFetching]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Inventory Maintenance</h2>
        <p className="text-muted-foreground">
          Archive and restore products.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Archive}
          label="Archived Products"
          value={summary?.countArchivedProducts ?? "—"}
          color="muted"
          size="sm"
          labelPosition="bottom"
        />
        <MetricCard
          icon={Archive}
          label="Archived Inventory Value"
          value={summary != null ? `₱ ${summary.archivedInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          color="muted"
          size="sm"
          labelPosition="bottom"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Orphaned Archived Stock"
          value={summary?.countArchivedWithStock ?? "—"}
          color={"red"}
          size="sm"
          labelPosition="bottom"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productName">Product Name</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                <Select value={archivedFilter} onValueChange={setArchivedFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                    <SelectItem value="ALL">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="eyeglasses">Eyeglasses</SelectItem>
                    <SelectItem value="frames">Frames</SelectItem>
                    <SelectItem value="lens">Lens</SelectItem>
                    <SelectItem value="goggles">Goggles</SelectItem>
                    <SelectItem value="prisms">Prisms</SelectItem>
                    <SelectItem value="eyedrop">Eyedrop</SelectItem>
                    <SelectItem value="sunglasses">Sunglasses</SelectItem>
                    <SelectItem value="clinical_services">Clinical Services</SelectItem>
                    <SelectItem value="lens_fitting">Lens Fitting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[30%] py-3 pr-4 font-medium">Product Name</th>
                      <th className="w-[18%] py-3 pr-4 font-medium">Category</th>
                      <th className="w-[12%] py-3 pr-4 text-right font-medium">Quantity</th>
                      <th className="w-[12%] py-3 pr-4 text-right font-medium">Unit Price</th>
                      <th className="w-[18%] py-3 pr-4 text-center font-medium">Status</th>
                      <th className="w-[10%] py-3 pr-4 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      return (
                        <tr
                          key={product.productId}
                          className="border-b transition-colors hover:bg-muted"
                        >
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-2 font-medium">
                              {product.imageDir ? (
                                <img
                                  src={getImageUrl(product.imageDir)}
                                  alt=""
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <Glasses className="h-4 w-4 text-muted-foreground" />
                              )}
                              {product.productName}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {CATEGORY_LABELS[product.category as Category] ?? product.category}
                          </td>
                          <td className="py-3 pr-4 text-right">
                            {product.productType === "SERVICE" ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              product.quantity
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right">
                            ₱{product.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <Badge
                              variant={product.isArchived ? "outline" : "default"}
                              className={
                                product.isArchived
                                  ? "border-amber-500 text-amber-600"
                                  : "bg-emerald-600 hover:bg-emerald-600 text-white"
                              }
                            >
                              {product.isArchived ? "Archived" : "Active"}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <div className="flex justify-center">
                              <Button
                                variant={product.isArchived ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleArchive(product.productId, product.isArchived)}
                                disabled={archiveMutation.isPending || restoreMutation.isPending}
                                className={
                                  product.isArchived
                                    ? "bg-green-700 hover:bg-green-800 text-white"
                                    : "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                                }
                              >
                                {product.isArchived ? (
                                  <>
                                    <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <Archive className="mr-1.5 h-3.5 w-3.5" />
                                    Archive
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <EmptyTableRows
                      count={PAGE_SIZE - (products?.length ?? 0)}
                      colSpan={6}
                      className="h-[57px]"
                    />
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No products found.
                </p>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingArchive} onOpenChange={(open) => !open && setPendingArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingArchive?.unarchive ? "Restore Product" : "Archive Product"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingArchive?.unarchive
                ? "Are you sure you want to restore "
                : "Are you sure you want to archive "}
              <span className="font-semibold text-foreground">
                {products.find((p) => p.productId === pendingArchive?.id)?.productName}
              </span>
              {pendingArchive?.unarchive
                ? "? This will make the product active again."
                : "? This action can be reversed later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className={pendingArchive?.unarchive
                ? "bg-green-700 text-white hover:bg-green-800"
                : "bg-red-700 text-white hover:bg-red-800"
              }
            >
              {pendingArchive?.unarchive ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryMaintenance;
