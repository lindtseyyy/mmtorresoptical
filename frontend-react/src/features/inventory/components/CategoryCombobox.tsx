import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { fetchCategories } from "@/features/inventory/services/productApi";
import type { CategoryDTO } from "@/features/inventory/types";

interface CategoryComboboxProps {
  value: string | null;
  onChange: (categoryId: string, categoryName: string) => void;
  disabled?: boolean;
  placeholder?: string;
  refreshKey?: number;
  productType?: "PHYSICAL" | "SERVICE";
}

const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select a category",
  refreshKey,
  productType,
}) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCategories(productType).then(setCategories).catch(() => setCategories([]));
  }, [refreshKey, productType]);

  const selectedCategory = categories.find((c) => c.categoryId === value);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.categoryId === categoryId);
      if (cat) {
        onChange(cat.categoryId, cat.name);
        setOpen(false);
        setSearch("");
      }
    },
    [categories, onChange]
  );

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
          {selectedCategory ? selectedCategory.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search categories..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              No categories found.
            </CommandEmpty>
            <CommandGroup>
              {filtered.map((cat) => (
                <CommandItem
                  key={cat.categoryId}
                  value={cat.categoryId}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cat.categoryId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cat.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryCombobox;
