import { useState, useEffect } from "react";
import { Settings, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  fetchCategoriesWithProductCounts,
  toggleCategoryActive,
  toggleCategoryPerishable,
  updateCategory,
  createCategory,
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
  const [togglingPerishableId, setTogglingPerishableId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"PHYSICAL" | "SERVICE">("PHYSICAL");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

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
      const cat = categories.find((c) => c.categoryId === id);
      toast.success(cat?.isActive ? "Category Archived" : "Category Activated", {
        description: `"${cat?.name}" has been ${cat?.isActive ? "archived" : "activated"}.`,
      });
      onCategoriesChanged();
    } catch {
      setError("Failed to toggle category status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleTogglePerishable = async (id: string) => {
    setTogglingPerishableId(id);
    try {
      await toggleCategoryPerishable(id);
      setCategories((prev) =>
        prev.map((c) => (c.categoryId === id ? { ...c, isPerishable: !c.isPerishable } : c))
      );
      onCategoriesChanged();
    } catch {
      setError("Failed to toggle perishable status.");
    } finally {
      setTogglingPerishableId(null);
    }
  };

  const handleStartEdit = (cat: CategoryWithProductCountDTO) => {
    setEditingId(cat.categoryId);
    setEditName(cat.name);
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.categoryId !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      setEditError("A category with this name already exists.");
      return;
    }
    setSavingId(id);
    setEditError(null);
    try {
      await updateCategory(id, trimmed);
      setCategories((prev) =>
        prev.map((c) => (c.categoryId === id ? { ...c, name: trimmed } : c))
      );
      setEditingId(null);
      setEditName("");
      toast.success("Category Updated", {
        description: `Category name changed to "${trimmed}".`,
      });
      onCategoriesChanged();
    } catch {
      setEditError("Failed to update category.");
    } finally {
      setSavingId(null);
    }
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.categoryType === newType)) {
      setAddError("A category with this name and type already exists.");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await createCategory(trimmed, newType);
      setNewName("");
      toast.success("Category Created", {
        description: `"${trimmed}" has been added as a ${newType.toLowerCase()} category.`,
      });
      await loadCategories();
      onCategoriesChanged();
    } catch {
      setAddError("Failed to create category.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-2 border-b">
          <Input
            placeholder="New category name..."
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
            className="flex-1"
            disabled={adding}
          />
          <Select value={newType} onValueChange={(v) => setNewType(v as "PHYSICAL" | "SERVICE")} disabled={adding}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PHYSICAL">Physical</SelectItem>
              <SelectItem value="SERVICE">Service</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        {addError && (
          <p className="text-sm text-destructive">{addError}</p>
        )}

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
                  <th className="py-2 pr-4 text-center font-medium">Type</th>
                  <th className="py-2 pr-4 text-center font-medium">Active</th>
                  <th className="py-2 pr-4 text-center font-medium">Perishable</th>
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
                    <td className="py-2 pr-4">
                      {editingId === cat.categoryId ? (
                        <Input
                          value={editName}
                          onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
                          className="h-7 text-sm max-w-48"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(cat.categoryId);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="py-2 pr-4 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        cat.categoryType === "SERVICE"
                          ? "bg-purple-700 text-white"
                          : "bg-blue-700 text-white"
                      }`}>
                        {cat.categoryType === "SERVICE" ? "Service" : "Physical"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <Switch
                                checked={cat.isActive}
                                onCheckedChange={() => handleToggle(cat.categoryId)}
                                disabled={togglingId === cat.categoryId || editingId === cat.categoryId}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {cat.isActive ? "Click to archive" : "Click to activate"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="py-2 pr-4 text-center">
                      {cat.categoryType === "PHYSICAL" ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex">
                                <Switch
                                  checked={cat.isPerishable}
                                  onCheckedChange={() => handleTogglePerishable(cat.categoryId)}
                                  disabled={togglingPerishableId === cat.categoryId || editingId === cat.categoryId}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {cat.isPerishable ? "Non-perishable (no expiry tracking)" : "Perishable (batch + expiry tracking)"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {editingId === cat.categoryId ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 bg-muted-foreground/10 hover:bg-muted-foreground/20"
                            onClick={() => handleSaveEdit(cat.categoryId)}
                            disabled={savingId === cat.categoryId || !editName.trim()}
                          >
                            {savingId === cat.categoryId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 bg-muted-foreground/10 hover:bg-muted-foreground/20"
                            onClick={handleCancelEdit}
                            disabled={savingId === cat.categoryId}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 bg-muted-foreground/10 hover:bg-muted-foreground/20"
                                onClick={() => handleStartEdit(cat)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit name</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {editError && (
          <p className="text-sm text-destructive">{editError}</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementModal;
