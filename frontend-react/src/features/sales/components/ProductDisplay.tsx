import { useState, useMemo } from "react";
import { Search, Plus, Package, ImageOff } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import type { Product } from "@/features/inventory/types";

interface ProductDisplayProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  eyeglasses: "Eyeglasses",
  frames: "Frames",
  lens: "Lens",
  goggles: "Goggles",
  prisms: "Prisms",
  eyedrop: "Eye Drops",
  sunglasses: "Sunglasses",
};

const ProductCard: React.FC<{
  product: Product;
  onAdd: () => void;
  disabled: boolean;
}> = ({ product, onAdd, disabled }) => {
  const lowStock = product.quantity <= product.lowLevelThreshold;
  const outOfStock = product.quantity === 0;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md overflow-hidden">
      <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden">
        {product.imageDir && !imgFailed ? (
          <img
            src={product.imageDir}
            alt={product.productName}
            className="h-full w-full object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
        )}
      </div>

      <div className="flex flex-col flex-1 p-2.5">
        <div className="mb-1 flex items-start justify-between gap-1">
          <span className="text-xs font-semibold text-card-foreground leading-tight line-clamp-1">
            {product.productName}
          </span>
          {lowStock && !outOfStock && (
            <Badge variant="secondary" className="shrink-0 text-[9px] px-1 py-0">
              Low
            </Badge>
          )}
          {outOfStock && (
            <Badge variant="destructive" className="shrink-0 text-[9px] px-1 py-0">
              OOS
            </Badge>
          )}
        </div>

        <span className="mb-1.5 text-[11px] text-muted-foreground">
          {CATEGORY_LABELS[product.category] ?? product.category}
        </span>

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
  onAddToCart,
  disabled = false,
}) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return Array.from(cats).sort();
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.productName.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="cursor-pointer text-[11px]"
            onClick={() => setCategoryFilter("all")}
          >
            All ({products.length})
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              className="cursor-pointer text-[11px]"
              onClick={() => setCategoryFilter(cat)}
            >
              {CATEGORY_LABELS[cat] ?? cat} ({categoryCounts[cat] ?? 0})
            </Badge>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <Package className="h-10 w-10" />
          <p className="text-sm">No products found</p>
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
