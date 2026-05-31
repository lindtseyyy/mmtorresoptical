import { useState, useEffect } from "react";
import { Settings, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  fetchCategoriesWithProductCounts,
  toggleCategoryActive,
  deleteCategory,
} from "@/features/inventory/services/productApi";
import type { CategoryWithProductCountDTO } from "@/features/inventory/types";

interface CategoryManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesChanged: () => void;
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  open,
  onOpenChange,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<CategoryWithProductCountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCategoriesWithProductCounts();
      setCategories(data);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleCategoryActive(id);
      setCategories((prev) =>
        prev.map((c) => (c.categoryId === id ? { ...c, isActive: !c.isActive } : c))
      );
      onCategoriesChanged();
    } catch {
      setError("Failed to toggle category status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.categoryId !== id));
      onCategoriesChanged();
    } catch {
      setError("Failed to delete category. It may be linked to products.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 text-center font-medium">Products</th>
                  <th className="py-2 pr-4 text-center font-medium">Active</th>
                  <th className="py-2 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...categories]
                  .sort((a, b) => {
                    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((cat) => (
                  <tr key={cat.categoryId} className="border-b last:border-0">
                    <td className="py-2 pr-4">{cat.name}</td>
                    <td className="py-2 pr-4 text-center">{cat.productCount}</td>
                    <td className="py-2 pr-4 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <Switch
                                checked={cat.isActive}
                                onCheckedChange={() => handleToggle(cat.categoryId)}
                                disabled={togglingId === cat.categoryId}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {cat.isActive ? "Click to archive" : "Click to activate"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="py-2 text-center">
                      {cat.productCount === 0 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(cat.categoryId)}
                          disabled={deletingId === cat.categoryId}
                        >
                          {deletingId === cat.categoryId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementModal;
