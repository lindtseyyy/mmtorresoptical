import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { cn } from "@/shared/lib/utils";
import { createAddStockMutationOptions, createRemoveStockMutationOptions, createAvailableBatchesQueryOptions } from "@/features/inventory/hooks/productQuery";
import type { ProductBatch } from "@/features/inventory/types";

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    productId: string;
    productName: string;
    quantity: number;
    isPerishable: boolean;
  };
}

const ADD_REASONS = [
  "New Shipment Delivery",
  "Inventory Count Correction",
] as const;

const REMOVE_REASONS = [
  "Damaged/Broken Item",
  "Supplier Return",
  "Theft/Loss Discrepancy",
  "Inventory Count Correction",
  "Spoilage Disposal",
] as const;

const INTEGER_REGEX = /^\d*$/;

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  open,
  onOpenChange,
  product,
}) => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"ADD_STOCK" | "REMOVE_STOCK">("ADD_STOCK");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reasonSearch, setReasonSearch] = useState("");

  // Batch-specific state
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const reasons = mode === "ADD_STOCK" ? ADD_REASONS : REMOVE_REASONS;

  // Fetch available batches for remove mode
  const { data: availableBatches } = useQuery({
    ...createAvailableBatchesQueryOptions(product.productId),
    enabled: open && mode === "REMOVE_STOCK",
  });

  const selectedBatch = useMemo(() => {
    if (!availableBatches || !selectedBatchId) return null;
    return availableBatches.find((b: ProductBatch) => String(b.productBatchId) === selectedBatchId);
  }, [availableBatches, selectedBatchId]);

  const reset = useCallback(() => {
    setMode("ADD_STOCK");
    setAmount("");
    setReason("");
    setReasonSearch("");
    setBatchNumber("");
    setExpiryDate("");
    setSelectedBatchId("");
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const addStockMutation = useMutation(createAddStockMutationOptions(queryClient));
  const removeStockMutation = useMutation(createRemoveStockMutationOptions(queryClient));

  const isPending = addStockMutation.isPending || removeStockMutation.isPending;

  const handleSubmit = () => {
    if (!amount || !reason) return;

    if (mode === "ADD_STOCK") {
      addStockMutation.mutate(
        {
          productId: product.productId,
          data: {
            quantity: parseInt(amount, 10),
            reason,
            ...(batchNumber.trim() && { batchNumber: batchNumber.trim() }),
            ...(product.isPerishable && expiryDate ? { expiryDate } : {}),
          },
        },
        { onSuccess: () => handleOpenChange(false) }
      );
    } else {
      removeStockMutation.mutate(
        {
          productId: product.productId,
          data: {
            quantity: parseInt(amount, 10),
            reason,
            ...(selectedBatchId
              ? { productBatchId: parseInt(selectedBatchId, 10) }
              : {}),
          },
        },
        { onSuccess: () => handleOpenChange(false) }
      );
    }
  };

  const numericAmount = parseInt(amount, 10) || 0;
  const isRemove = mode === "REMOVE_STOCK";
  const maxRemovable = isRemove && selectedBatch
    ? selectedBatch.quantityRemaining
    : product.quantity;
  const exceedsStock = isRemove && numericAmount > maxRemovable;

  const canSubmit =
    numericAmount > 0 &&
    reason !== "" &&
    !isPending &&
    !exceedsStock &&
    // Add stock: batch number always required
    !(mode === "ADD_STOCK" && !batchNumber.trim()) &&
    // Perishable add: expiry required
    !(mode === "ADD_STOCK" && product.isPerishable && !expiryDate) &&
    // Remove: batch selection required
    !(mode === "REMOVE_STOCK" && !selectedBatchId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {product.productName} — Current quantity: <strong>{product.quantity}</strong>
            {product.isPerishable && (
              <span className="ml-2 text-xs text-amber-500">(Perishable — batch tracked)</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Mode toggle */}
          <div>
            <Label className="font-semibold">Mode</Label>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => { setMode("ADD_STOCK"); setReason(""); setReasonSearch(""); setSelectedBatchId(""); setAmount(""); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  mode === "ADD_STOCK"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-muted-foreground hover:border-gray-300"
                }`}
              >
                <Plus className="h-4 w-4" />
                Add Stock
              </button>
              <button
                type="button"
                onClick={() => { setMode("REMOVE_STOCK"); setReason(""); setReasonSearch(""); setBatchNumber(""); setExpiryDate(""); setAmount(""); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  mode === "REMOVE_STOCK"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 text-muted-foreground hover:border-gray-300"
                }`}
              >
                <Minus className="h-4 w-4" />
                Remove Stock
              </button>
            </div>
          </div>

          {/* Add Stock: Batch Number (always required) + Expiry Date (perishable only) */}
          {mode === "ADD_STOCK" && (
            <>
              <div>
                <Label className="font-semibold">
                  Batch Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  className="mt-2"
                  placeholder="Enter batch number"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>
              {product.isPerishable && (
                <div>
                  <Label className="font-semibold">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    className="mt-2"
                    value={expiryDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* Remove: Batch Dropdown */}
          {mode === "REMOVE_STOCK" && (
            <div>
              <Label className="font-semibold">
                Select Batch <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedBatchId} onValueChange={(val) => { setSelectedBatchId(val); setAmount(""); }}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a batch to remove from..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches && availableBatches.length > 0 ? (
                    availableBatches.map((batch: ProductBatch) => (
                      <SelectItem key={batch.productBatchId} value={String(batch.productBatchId)}>
                        {batch.batchNumber} (Available: {batch.quantityRemaining}{product.isPerishable ? ` | Exp: ${formatDate(batch.expiryDate)}` : ""})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No active batches available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount */}
          <div>
            <Label className="font-semibold">Adjustment Amount</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Enter amount"
              className="mt-2"
              value={amount}
              disabled={mode === "REMOVE_STOCK" && !selectedBatchId}
              onChange={(e) => {
                const val = e.target.value.trimStart();
                if (INTEGER_REGEX.test(val)) setAmount(val);
              }}
            />
            {exceedsStock && (
              <p className="mt-1 text-xs text-red-600">
                Amount exceeds available stock ({maxRemovable}).
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label className="font-semibold">Reason</Label>
            <Popover open={reasonOpen} onOpenChange={setReasonOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={reasonOpen}
                  className="mt-2 w-full justify-between font-normal"
                >
                  {reason || "Select or type a reason..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search or type a reason..."
                    value={reasonSearch}
                    onValueChange={setReasonSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No reasons found.</CommandEmpty>
                    <CommandGroup>
                      {reasons
                        .filter((r) =>
                          r.toLowerCase().includes(reasonSearch.toLowerCase())
                        )
                        .map((r) => (
                          <CommandItem
                            key={r}
                            value={r}
                            onSelect={() => {
                              setReason(r);
                              setReasonSearch("");
                              setReasonOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                reason === r ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {r}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                  {reasonSearch.trim().length > 0 &&
                    !reasons.some(
                      (r) => r.toLowerCase() === reasonSearch.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 border-t px-2 py-2 text-sm text-primary hover:bg-accent hover:text-accent-foreground cursor-pointer"
                        onClick={() => {
                          setReason(reasonSearch.trim());
                          setReasonSearch("");
                          setReasonOpen(false);
                        }}
                      >
                        <Plus className="h-4 w-4 shrink-0" />
                        Use &ldquo;{reasonSearch.trim()}&rdquo;
                      </button>
                    )}
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Preview */}
          {numericAmount > 0 && !exceedsStock && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Adjustment Result: </span>
              <span className="font-medium">{product.quantity}</span>
              <span className={isRemove ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                {" "}{isRemove ? `− ${numericAmount}` : `+ ${numericAmount}`}
              </span>
              <span className="text-muted-foreground"> → </span>
              <span className="font-semibold">
                {isRemove ? product.quantity - numericAmount : product.quantity + numericAmount}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={
                isRemove
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {isPending
                ? "Processing..."
                : isRemove
                  ? `Remove ${numericAmount} Unit${numericAmount !== 1 ? "s" : ""}`
                  : `Add ${numericAmount} Unit${numericAmount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentModal;
