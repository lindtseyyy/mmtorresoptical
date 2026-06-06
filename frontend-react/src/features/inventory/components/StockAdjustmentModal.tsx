import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/shared/lib/utils";
import { createAdjustStockMutationOptions } from "@/features/inventory/hooks/productQuery";

interface StockAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    productId: string;
    productName: string;
    quantity: number;
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
] as const;

const INTEGER_REGEX = /^\d*$/;

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

  const reasons = mode === "ADD_STOCK" ? ADD_REASONS : REMOVE_REASONS;

  const reset = useCallback(() => {
    setMode("ADD_STOCK");
    setAmount("");
    setReason("");
    setReasonSearch("");
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset]
  );

  const mutation = useMutation(
    createAdjustStockMutationOptions(queryClient)
  );

  const handleSubmit = () => {
    if (!amount || !reason) return;

    mutation.mutate(
      {
        id: product.productId,
        data: {
          adjustmentType: mode,
          amount: parseInt(amount, 10),
          reason,
        },
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
  };

  const numericAmount = parseInt(amount, 10) || 0;
  const isRemove = mode === "REMOVE_STOCK";
  const canSubmit = numericAmount > 0 && reason !== "" && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {product.productName} — Current quantity: <strong>{product.quantity}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
        {/* Mode toggle */}
        <div>
          <Label className="font-semibold">Mode</Label>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => { setMode("ADD_STOCK"); setReason(""); setReasonSearch(""); }}
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
              onClick={() => { setMode("REMOVE_STOCK"); setReason(""); setReasonSearch(""); }}
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

        {/* Amount */}
        <div>
          <Label className="font-semibold">Adjustment Amount</Label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Enter amount"
            className="mt-2"
            value={amount}
            onChange={(e) => {
              const val = e.target.value.trimStart();
              if (INTEGER_REGEX.test(val)) setAmount(val);
            }}
          />
          {isRemove && numericAmount > product.quantity && (
            <p className="mt-1 text-xs text-red-600">
              Amount exceeds current stock ({product.quantity}).
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
        {numericAmount > 0 && !(isRemove && numericAmount > product.quantity) && (
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
            disabled={!canSubmit || (isRemove && numericAmount > product.quantity)}
            className={
              isRemove
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }
          >
            {mutation.isPending
              ? "Processing..."
              : isRemove
                ? `Remove ${numericAmount} Unit${numericAmount > 1 ? "s" : ""}`
                : `Add ${numericAmount} Unit${numericAmount > 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockAdjustmentModal;
