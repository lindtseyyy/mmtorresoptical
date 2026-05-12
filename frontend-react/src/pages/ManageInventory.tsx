import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Archive, Pencil, ChevronLeft, ChevronRight, Glasses, MoreHorizontal, Eye, Package, Layers, AlertTriangle, TrendingUp, Banknote, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/types"; // Import our new Product type
import {
  createArchiveProductMutationOptions,
  createProductsListQueryOptions,
  createInventorySummaryQueryOptions,
} from "@/query/productQuery";

const ManageInventory: React.FC = () => {
  const PAGE_SIZE = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("productName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: pageData,
    isLoading,
    isFetching,
  } = useQuery({
    ...createProductsListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, categoryFilter, sortBy, sortOrder, stockFilter),
    placeholderData: keepPreviousData,
  });

  const products = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  const { data: summary } = useQuery(createInventorySummaryQueryOptions());

  // Mutation for archiving
  const archiveMutation = useMutation(
    createArchiveProductMutationOptions(queryClient)
  );

  const handleArchive = (id: string) => {
    // You should add a confirmation dialog here
    archiveMutation.mutate(id);
  };

  // Reset page when search or category filter changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, categoryFilter, sortBy, sortOrder, stockFilter]);

  // If current page is empty and not the first page, step back
  useEffect(() => {
    if (products.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [products.length, page, isFetching]);

  // Helper function from your reference
  const getStockStatus = (product: Product) => {
    if (product.quantity <= product.lowLevelThreshold) {
      return { label: "Low Stock", variant: "destructive" as const };
    } else if (product.quantity >= product.overstockedThreshold) {
      return { label: "Overstocked", variant: "secondary" as const };
    }
    return { label: "Active", variant: "default" as const };
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
        <Button onClick={() => navigate("/inventory/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.totalProducts ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10">
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.totalStockQuantity ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Total Stock Quantity</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {summary != null ? `₱ ${summary.inventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Total Inventory Value</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{summary?.countLowStockProducts ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{summary?.countOverstockedProducts ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Overstocked Items</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <Archive className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.countArchivedProducts ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Archived Products</p>
            </div>
          </CardContent>
        </Card>
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
                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                    <SelectItem value="OVERSTOCKED">Overstocked</SelectItem>
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
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Product Name</th>
                      <th className="py-3 pr-4 font-medium">Category</th>
                      <th className="py-3 pr-4 text-center font-medium">Quantity</th>
                      <th className="py-3 pr-4 text-center font-medium">Unit Price</th>
                      <th className="py-3 pr-4 font-medium">Supplier</th>
                      <th className="py-3 pl-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <tr
                          key={product.productId}
                          className="border-b transition-colors hover:bg-muted"
                        >
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-2 font-medium">
                              {product.imageDir ? (
                                <img
                                  src={product.imageDir}
                                  alt=""
                                  className="h-6 w-6 rounded object-cover"
                                />
                              ) : (
                                <Glasses className="h-4 w-4 text-muted-foreground" />
                              )}
                              {product.productName}
                            </span>
                          </td>
                          <td className="py-3 pr-4 capitalize">
                            {product.category}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <Badge
                              className={`text-white ${
                                stockStatus.variant === "destructive"
                                  ? "bg-red-700 hover:bg-red-700"
                                  : stockStatus.variant === "secondary"
                                    ? "bg-yellow-700 hover:bg-yellow-700"
                                    : "bg-green-700 hover:bg-green-700"
                              }`}
                            >
                              {product.quantity}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            ₱{product.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 pr-4">{product.supplier}</td>
                          <td className="py-3 pl-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/inventory/edit/${product.productId}`)
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/inventory/edit/${product.productId}`)
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleArchive(product.productId)}
                                  disabled={archiveMutation.isPending}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {products?.length === 0 && (
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
    </div>
  );
};

export default ManageInventory;
