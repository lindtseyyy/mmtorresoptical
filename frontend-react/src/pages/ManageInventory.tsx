import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
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
import { Plus, Search, Archive, Pencil, Glasses } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/types"; // Import our new Product type
import { toast } from "sonner";

// API call to fetch all products
const fetchProducts = async (): Promise<Product[]> => {
  const token = localStorage.getItem("authToken");
  const { data } = await axios.get("http://localhost:8080/api/products", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// API call to archive a product (using DELETE)
const archiveProduct = async (id: string) => {
  const token = localStorage.getItem("authToken");
  return await axios.delete(`http://localhost:8080/api/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const ManageInventory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch data using React Query
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // Mutation for archiving
  const archiveMutation = useMutation({
    mutationFn: archiveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product Archived", {
        description: "The product has been successfully archived.",
      });
    },
    onError: () => {
      toast.error("Error", {
        description: "Failed to archive product.",
      });
    },
  });

  const handleArchive = (id: string) => {
    // You should add a confirmation dialog here
    archiveMutation.mutate(id);
  };

  // Filter products based on state
  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    // This matches your reference (shows non-archived by default)
    return matchesSearch && matchesCategory && !product.isArchived;
  });

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

      <Card>
        <CardContent className="p-6">
          {/* Search bar and filters (no longer a separate component) */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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

          {/* Loading Spinner */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            // Product List
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Product Inventory ({filteredProducts?.length || 0})
              </p>
              {filteredProducts?.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <div
                    key={product.productId}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    {product.imageDir ? (
                      <img
                        src={product.imageDir || ""}
                        alt={product.productName}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                        <Glasses className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold">{product.productName}</h3>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {product.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ID: {product.productId.slice(0, 8)} | Supplier:{" "}
                        {product.supplier}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-4 text-sm">
                        <div className="flex-col">
                          <div className="font-bold">Stock Level</div>
                          <div className="font-semibold">
                            {product.quantity} units
                          </div>
                        </div>
                        <div className="flex-col">
                          <div className="font-bold">Unit Price</div>
                          <div className="font-semibold">
                            ₱{product.unitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Edit button navigates to edit page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          navigate(`/inventory/edit/${product.productId}`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchive(product.productId)}
                        disabled={archiveMutation.isPending}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageInventory;
