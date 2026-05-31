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
  fetchSuppliersWithProductCounts,
  toggleSupplierActive,
  deleteSupplier,
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      onSuppliersChanged();
    } catch {
      setError("Failed to toggle supplier status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.supplierId !== id));
      onSuppliersChanged();
    } catch {
      setError("Failed to delete supplier. It may be linked to products.");
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
            Manage Suppliers
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
                  <th className="py-2 pr-4 font-medium">Supplier</th>
                  <th className="py-2 pr-4 text-center font-medium">Products</th>
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
                    <td className="py-2 pr-4">{sup.name}</td>
                    <td className="py-2 pr-4 text-center">{sup.productCount}</td>
                    <td className="py-2 pr-4 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <Switch
                                checked={sup.isActive}
                                onCheckedChange={() => handleToggle(sup.supplierId)}
                                disabled={togglingId === sup.supplierId}
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
                      {sup.productCount === 0 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(sup.supplierId)}
                          disabled={deletingId === sup.supplierId}
                        >
                          {deletingId === sup.supplierId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <span className="text-gray-400">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No suppliers found.
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

export default SupplierManagementModal;
