import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Package, ImageOff, ArrowUp, ArrowDown, Stethoscope } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { getImageUrl } from "@/shared/lib/utils";
import type { Product } from "@/features/inventory/types";
import { CATEGORY_LABELS, PHYSICAL_CATEGORIES, SERVICE_CATEGORIES, type Category } from "@/features/inventory/types";

interface ProductDisplayProps {
  products: Product[];
  productTypeFilter: "PHYSICAL" | "SERVICE";
  onAddToCart: (product: Product) => void;
  disabled?: boolean;
}

const ProductCard: React.FC<{
  product: Product;
  onAdd: () => void;
  disabled: boolean;
}> = ({ product, onAdd, disabled }) => {
  const isService = product.productType === "SERVICE";
  const lowStock = !isService && product.quantity <= product.lowLevelThreshold;
  const overstocked = !isService && product.quantity >= product.overstockedThreshold;
  const outOfStock = !isService && product.quantity === 0;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`flex flex-col rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden${outOfStock ? " opacity-50" : ""}`}>
      <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden relative">
        {product.imageDir && !imgFailed ? (
          <img
            src={getImageUrl(product.imageDir) ?? undefined}
            alt={product.productName}
            className="h-full w-full object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        )}
        {isService && (
          <Badge className="absolute top-1.5 left-1.5 bg-blue-600 hover:bg-blue-600 text-white text-[11px] px-1.5 py-0.5">
            <Stethoscope className="h-3 w-3 mr-0.5 inline" />
            Service
          </Badge>
        )}
        {lowStock && !outOfStock && (
          <Badge className="absolute top-1.5 right-1.5 bg-red-700 hover:bg-red-700 text-white text-[11px] px-1.5 py-0.5">
            Low Stock
          </Badge>
        )}
        {overstocked && !outOfStock && (
          <Badge className="absolute top-1.5 right-1.5 bg-yellow-700 hover:bg-yellow-700 text-white text-[11px] px-1.5 py-0.5">
            Overstock
          </Badge>
        )}
        {outOfStock && (
          <Badge className="absolute top-1.5 right-1.5 bg-neutral-800 hover:bg-neutral-800 text-white text-[11px] px-1.5 py-0.5">
            Out of Stock
          </Badge>
        )}
      </div>

      <div className="flex flex-col flex-1 p-2.5">
        <div className="mb-1">
          <span className="text-xs font-semibold text-card-foreground leading-tight line-clamp-1">
            {product.productName}
          </span>
        </div>

        <span className="mb-1 text-[11px] text-muted-foreground/70">
          {CATEGORY_LABELS[product.category as Category] ?? product.category}
        </span>

        {isService ? (
          <span className="mb-1.5 text-[11px] font-medium text-blue-600">Service</span>
        ) : (
          <span className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            {product.quantity} item{product.quantity !== 1 ? "s" : ""} remaining
          </span>
        )}

        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            ₱{product.unitPrice.toFixed(2)}
          </span>
          <Button
            size="icon"
            variant={outOfStock ? "outline" : "default"}
            disabled={outOfStock || disabled}
            onClick={onAdd}
            className="h-7 w-7 rounded-md"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProductDisplay: React.FC<ProductDisplayProps> = ({
  products,
  productTypeFilter,
  onAddToCart,
  disabled = false,
}) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "quantity">("name");
  const [sortAsc, setSortAsc] = useState(true);

  const isPhysical = productTypeFilter === "PHYSICAL";
  const segmentTotal = isPhysical
    ? products.filter((p) => p.productType === "PHYSICAL").length
    : products.filter((p) => p.productType === "SERVICE").length;
  const filteredCategories = isPhysical ? PHYSICAL_CATEGORIES : SERVICE_CATEGORIES;
  const availableSortOptions = isPhysical
    ? (["name", "price", "quantity"] as const)
    : (["name", "price"] as const);

  useEffect(() => {
    setCategoryFilter("all");
  }, [productTypeFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  const { lowStockCount, overstockCount } = useMemo(() => {
    let low = 0;
    let over = 0;
    products.forEach((p) => {
      if (p.productType !== "PHYSICAL" || p.quantity === 0) return;
      if (p.quantity <= p.lowLevelThreshold) low++;
      else if (p.quantity >= p.overstockedThreshold) over++;
    });
    return { lowStockCount: low, overstockCount: over };
  }, [products]);

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      if (p.productType !== productTypeFilter) return false;
      const matchSearch =
        !search ||
        p.productName.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" ||
        categoryFilter === p.category ||
        (isPhysical && categoryFilter === "low_stock" && p.quantity <= p.lowLevelThreshold && p.quantity > 0) ||
        (isPhysical && categoryFilter === "overstocked" && p.quantity >= p.overstockedThreshold && p.quantity > 0);
      return matchSearch && matchCategory;
    });

    const effectiveSortBy = !isPhysical && sortBy === "quantity" ? "name" : sortBy;
    result.sort((a, b) => {
      const aOos = a.productType === "PHYSICAL" && a.quantity === 0 ? 1 : 0;
      const bOos = b.productType === "PHYSICAL" && b.quantity === 0 ? 1 : 0;
      if (aOos !== bOos) return aOos - bOos;
      let cmp: number;
      switch (effectiveSortBy) {
        case "price":
          cmp = a.unitPrice - b.unitPrice;
          break;
        case "quantity":
          cmp = a.quantity - b.quantity;
          break;
        default:
          cmp = a.productName.localeCompare(b.productName);
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [products, productTypeFilter, search, categoryFilter, sortBy, sortAsc, isPhysical]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isPhysical ? "Search products..." : "Search services..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</span>
          <Select
            value={isPhysical ? sortBy : (sortBy === "quantity" ? "name" : sortBy)}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="h-9 text-xs w-28 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableSortOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-sm">
                  {opt === "name" ? "Name" : opt === "price" ? "Price" : "Quantity"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortAsc(!sortAsc)}
            className="h-9 w-9 shrink-0"
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 rounded-md bg-muted/50 p-1.5 border">
          <Badge
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="cursor-pointer text-[11px]"
            onClick={() => setCategoryFilter("all")}
          >
            All ({segmentTotal})
          </Badge>
          {filteredCategories.map((cat) => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              className="cursor-pointer text-[11px]"
              onClick={() => setCategoryFilter(cat)}
            >
              {CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})
            </Badge>
          ))}
          {isPhysical && (
            <>
              <Badge
                variant={categoryFilter === "low_stock" ? "default" : "outline"}
                className="cursor-pointer text-[11px]"
                onClick={() => setCategoryFilter("low_stock")}
              >
                Low Stock ({lowStockCount})
              </Badge>
              <Badge
                variant={categoryFilter === "overstocked" ? "default" : "outline"}
                className="cursor-pointer text-[11px]"
                onClick={() => setCategoryFilter("overstocked")}
              >
                Overstock ({overstockCount})
              </Badge>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Package className="h-10 w-10" />
          <p className="text-sm">
            {isPhysical ? "No products found" : "No services found"}
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 pb-2">
            {filtered.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                onAdd={() => onAddToCart(product)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;
