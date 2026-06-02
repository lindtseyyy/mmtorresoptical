import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Search, Eye, ChevronLeft, ChevronRight, Glasses, ArrowUp, ArrowDown, PackageX, AlertTriangle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "@/shared/lib/auth";
import { getImageUrl } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import EmptyTableRows from "@/shared/components/EmptyTableRows";
import type { Product, CategoryDTO } from "@/features/inventory/types";
import { fetchCategories } from "@/features/inventory/services/productApi";
import {
  createProductsListQueryOptions,
  createInventorySummaryQueryOptions,
} from "@/features/inventory/hooks/productQuery";

const ManageInventory: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);
  const [stockFilter, setStockFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const navigate = useNavigate();

  const {
    data: pageData,
    isLoading,
    isFetching,
  } = useQuery({
    ...createProductsListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, categoryFilter, sortBy, sortOrder, stockFilter, "ACTIVE", productTypeFilter),
    placeholderData: keepPreviousData,
  });

  const products = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const { data: summary } = useQuery(createInventorySummaryQueryOptions());

  // Reset page when search or category filter changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, categoryFilter, sortBy, sortOrder, stockFilter, productTypeFilter]);

  // If current page is empty and not the first page, step back
  useEffect(() => {
    if (products.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [products.length, page, isFetching]);

  // Helper function using ROP-based logic
  const getStockStatus = (product: Product) => {
    if (product.productType === "SERVICE") {
      return { label: "Service", variant: "default" as const };
    }
    if (product.quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    }
    if (product.reorderPoint != null && product.quantity <= product.reorderPoint) {
      return { label: "Reorder", variant: "secondary" as const };
    }
    if (product.quantity >= product.overstockedThreshold) {
      return { label: "Overstocked", variant: "secondary" as const };
    }
    return { label: "Normal", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage optical product inventory.
          </p>
        </div>
        {/* Updated Button to navigate */}
        {isAdmin() && (
          <Button onClick={() => navigate("/inventory/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item to Catalog
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          icon={PackageX}
          label="Out of Stock"
          value={summary?.countOutOfStockProducts ?? "—"}
          color="red"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Reorder Needed"
          value={summary?.countReorderNeededProducts ?? "—"}
          color="amber"
        />
        <MetricCard
          icon={TrendingUp}
          label="Overstocked"
          value={summary?.countOverstockedProducts ?? "—"}
          color="blue"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by product name..."
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
                    <SelectItem value="productName">Name</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                    <SelectItem value="unitPrice">Price</SelectItem>
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
                <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Stock:</span>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">No Stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Reorder</SelectItem>
                    <SelectItem value="OVERSTOCKED">Overstocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Type:</span>
                <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Loading Spinner */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : products?.length === 0 ? (
            <div className="flex min-h-[570px] items-center justify-center">
              <p className="text-center text-muted-foreground">
                No products found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[32%] py-3 pr-4 font-medium">Name</th>
                      <th className="w-[12%] py-3 pr-4 font-medium">Category</th>
                      <th className="w-[10%] py-3 pr-4 text-right font-medium">Quantity</th>
                      <th className="w-[12%] py-3 pr-4 text-right font-medium">Unit Price</th>
                      <th className="w-[12%] py-3 pr-4 text-right font-medium">Lead Time</th>
                      <th className="w-[14%] py-3 pr-4 text-center font-medium">Stock Status</th>
                      <th className="w-[8%] py-3 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.map((product, index) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <tr
                          key={product.productId}
                          className={`border-b transition-colors hover:bg-muted/30 ${index % 2 === 0 ? "bg-transparent" : "bg-muted"}`}
                        >
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-2 font-medium">
                              {product.productType === "SERVICE" ? (
                                <span className="flex h-6 w-6 items-center justify-center">
                                  <Glasses className="h-4 w-4 text-muted-foreground" />
                                </span>
                              ) : product.imageDir ? (
                                <img
                                  src={getImageUrl(product.imageDir) ?? undefined}
                                  alt=""
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <span className="flex h-6 w-6 items-center justify-center">
                                  <Glasses className="h-4 w-4 text-muted-foreground" />
                                </span>
                              )}
                              {product.productName}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {product.categoryName}
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
                          <td className="py-3 pr-4 text-right">
                            {product.productType === "SERVICE" ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              `${product.leadTimeDays} days`
                            )}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {product.productType === "SERVICE" ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <Badge
                                className={`text-white ${
                                  stockStatus.variant === "destructive"
                                    ? "bg-red-700 hover:bg-red-700"
                                    : stockStatus.variant === "secondary"
                                      ? "bg-yellow-700 hover:bg-yellow-700"
                                      : "bg-green-700 hover:bg-green-700"
                                }`}
                              >
                                {stockStatus.label}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/inventory/view/${product.productId}`)}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <EmptyTableRows
                      count={PAGE_SIZE - (products?.length ?? 0)}
                      colSpan={7}
                      className="h-[57px]"
                    />
                  </tbody>
                </table>
              </div>

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
    </div>
  );
};

export default ManageInventory;
