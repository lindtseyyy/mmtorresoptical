import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
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
import { fetchSuppliers } from "@/features/inventory/services/productApi";
import type { SupplierDTO } from "@/features/inventory/types";

interface SupplierComboboxProps {
  value: string | null;
  onChange: (supplierId: string, supplierName: string) => void;
  onCreate: (newSupplierName: string) => void;
  disabled?: boolean;
  placeholder?: string;
  refreshKey?: number;
}

const SupplierCombobox: React.FC<SupplierComboboxProps> = ({
  value,
  onChange,
  onCreate,
  disabled = false,
  placeholder = "Select or type a supplier...",
  refreshKey,
}) => {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierDTO[]>([]);
  const [search, setSearch] = useState("");
  const [pendingCreateName, setPendingCreateName] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers().then(setSuppliers).catch(() => setSuppliers([]));
  }, [refreshKey]);

  const selectedSupplier = suppliers.find((s) => s.supplierId === value);

  useEffect(() => {
    if (value) setPendingCreateName(null);
  }, [value]);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const showCreate =
    search.trim().length > 0 &&
    !filtered.some(
      (s) => s.name.toLowerCase() === search.toLowerCase()
    );

  const handleSelect = useCallback(
    (supplierId: string) => {
      const sup = suppliers.find((s) => s.supplierId === supplierId);
      if (sup) {
        onChange(sup.supplierId, sup.name);
        setPendingCreateName(null);
        setOpen(false);
        setSearch("");
      }
    },
    [suppliers, onChange]
  );

  const handleCreate = useCallback(() => {
    const trimmed = search.trim();
    if (trimmed.length > 0) {
      console.log("[SupplierCombobox] Creating supplier:", trimmed);
      setPendingCreateName(trimmed);
      onCreate(trimmed);
      setOpen(false);
      setSearch("");
    }
  }, [search, onCreate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selectedSupplier ? selectedSupplier.name : pendingCreateName ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search suppliers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              No suppliers found.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((sup) => (
                <CommandItem
                  key={sup.supplierId}
                  value={sup.supplierId}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === sup.supplierId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {sup.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {showCreate && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t px-2 py-2 text-sm text-primary hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Register New Supplier &ldquo;{search.trim()}&rdquo;
            </button>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SupplierCombobox;
