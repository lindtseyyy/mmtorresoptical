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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  fetchSuppliersWithProductCounts,
  toggleSupplierActive,
  updateSupplier,
  createSupplier,
} from "@/features/inventory/services/productApi";
import type { SupplierWithProductCountDTO } from "@/features/inventory/types";

interface SupplierManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuppliersChanged: () => void;
}

const SupplierManagementModal: React.FC<SupplierManagementModalProps> = ({
  open,
  onOpenChange,
  onSuppliersChanged,
}) => {
  const [suppliers, setSuppliers] = useState<SupplierWithProductCountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSuppliersWithProductCounts();
      setSuppliers(data);
    } catch {
      setError("Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadSuppliers();
  }, [open]);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleSupplierActive(id);
      setSuppliers((prev) =>
        prev.map((s) => (s.supplierId === id ? { ...s, isActive: !s.isActive } : s))
      );
      const sup = suppliers.find((s) => s.supplierId === id);
      toast.success(sup?.isActive ? "Supplier Archived" : "Supplier Activated", {
        description: `"${sup?.name}" has been ${sup?.isActive ? "archived" : "activated"}.`,
      });
      onSuppliersChanged();
    } catch {
      setError("Failed to toggle supplier status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleStartEdit = (sup: SupplierWithProductCountDTO) => {
    setEditingId(sup.supplierId);
    setEditName(sup.name);
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
    if (suppliers.some((s) => s.supplierId !== id && s.name.toLowerCase() === trimmed.toLowerCase())) {
      setEditError("A supplier with this name already exists.");
      return;
    }
    setSavingId(id);
    setEditError(null);
    try {
      await updateSupplier(id, trimmed);
      setSuppliers((prev) =>
        prev.map((s) => (s.supplierId === id ? { ...s, name: trimmed } : s))
      );
      setEditingId(null);
      setEditName("");
      toast.success("Supplier Updated", {
        description: `Supplier name changed to "${trimmed}".`,
      });
      onSuppliersChanged();
    } catch {
      setEditError("Failed to update supplier.");
    } finally {
      setSavingId(null);
    }
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (suppliers.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setAddError("A supplier with this name already exists.");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      await createSupplier(trimmed);
      setNewName("");
      toast.success("Supplier Created", {
        description: `"${trimmed}" has been added.`,
      });
      await loadSuppliers();
      onSuppliersChanged();
    } catch {
      setAddError("Failed to create supplier.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Suppliers
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-2 border-b">
          <Input
            placeholder="New supplier name..."
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
            className="flex-1"
            disabled={adding}
          />
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
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[60%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 px-4 font-medium">Supplier</th>
                  <th className="py-2 pr-4 text-center font-medium">Active</th>
                  <th className="py-2 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...suppliers]
                  .sort((a, b) => {
                    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((sup) => (
                  <tr key={sup.supplierId} className="border-b last:border-0">
                    <td className="py-2 px-4">
                      {editingId === sup.supplierId ? (
                        <Input
                          value={editName}
                          onChange={(e) => { setEditName(e.target.value); setEditError(null); }}
                          className="h-7 text-sm w-full px-2"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(sup.supplierId);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                      ) : (
                        sup.name
                      )}
                    </td>
                    <td className="py-2 pr-4 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <Switch
                                checked={sup.isActive}
                                onCheckedChange={() => handleToggle(sup.supplierId)}
                                disabled={togglingId === sup.supplierId || editingId === sup.supplierId}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {sup.isActive ? "Click to archive" : "Click to activate"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="py-2 text-center">
                      {editingId === sup.supplierId ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 bg-muted-foreground/10 hover:bg-muted-foreground/20"
                            onClick={() => handleSaveEdit(sup.supplierId)}
                            disabled={savingId === sup.supplierId || !editName.trim() || editName.trim() === sup.name}
                          >
                            {savingId === sup.supplierId ? (
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
                            disabled={savingId === sup.supplierId}
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
                                onClick={() => handleStartEdit(sup)}
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
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">
                      No suppliers found.
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

export default SupplierManagementModal;
