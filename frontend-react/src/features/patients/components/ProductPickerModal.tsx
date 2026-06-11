import { useState, useMemo } from "react";
import { Search, Package, ImageOff, Glasses } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { getImageUrl } from "@/shared/lib/utils";
import { useProductSummaries } from "@/features/inventory/hooks/productQuery";
import type { ProductSummary } from "@/features/inventory/types";

interface ProductPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: ProductSummary) => void;
}

const ProductPickerModal: React.FC<ProductPickerModalProps> = ({ open, onOpenChange, onSelect }) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { data: products = [] } = useProductSummaries(search || undefined);

  const nonServiceProducts = useMemo(() => {
    return products.filter((p) => p.productType !== "SERVICE");
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nonServiceProducts.forEach((p) => {
      counts[p.categoryName] = (counts[p.categoryName] ?? 0) + 1;
    });
    return counts;
  }, [nonServiceProducts]);

  const filtered = useMemo(() => {
    return nonServiceProducts.filter((p) => {
      if (categoryFilter !== "all" && p.categoryName !== categoryFilter) return false;
      if (!search) return true;
      return p.productName.toLowerCase().includes(search.toLowerCase());
    });
  }, [nonServiceProducts, search, categoryFilter]);

  const handleSelect = (product: ProductSummary) => {
    onSelect(product);
    onOpenChange(false);
    setSearch("");
    setCategoryFilter("all");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[950px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Select Product</DialogTitle>
        </DialogHeader>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            autoFocus
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="cursor-pointer text-[11px]"
            onClick={() => setCategoryFilter("all")}
          >
            All ({nonServiceProducts.length})
          </Badge>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <Badge
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              className="cursor-pointer text-[11px]"
              onClick={() => setCategoryFilter(cat)}
            >
              {cat} ({count})
            </Badge>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground min-h-[40vh]">
            <Package className="h-10 w-10" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 h-[55vh] overflow-y-auto pr-1 content-start">
            {filtered.map((product) => (
              <div
                key={product.productId}
                className="flex flex-col rounded-lg border border-border bg-card shadow-sm hover:shadow-md cursor-pointer transition-shadow overflow-hidden w-[160px] shrink-0 grow-0"
                onClick={() => handleSelect(product)}
              >
                <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                  {product.productType === "SERVICE" ? (
                    <Glasses className="h-8 w-8 text-muted-foreground/50" />
                  ) : product.imageDir ? (
                    <img
                      src={getImageUrl(product.imageDir) ?? undefined}
                      alt={product.productName}
                      className="h-full w-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <ImageOff className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="p-2 flex flex-col justify-between flex-1">
                  <p className="text-xs font-semibold text-card-foreground line-clamp-1">
                    {product.productName}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 line-clamp-1">
                    {product.categoryName} &middot; {product.supplierName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPickerModal;
