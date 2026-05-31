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
import { fetchCategories } from "@/features/inventory/services/productApi";
import type { CategoryDTO } from "@/features/inventory/types";

interface CategoryComboboxProps {
  value: string | null;
  onChange: (categoryId: string, categoryName: string) => void;
  onCreate: (newCategoryName: string) => void;
  disabled?: boolean;
  placeholder?: string;
  refreshKey?: number;
}

const CategoryCombobox: React.FC<CategoryComboboxProps> = ({
  value,
  onChange,
  onCreate,
  disabled = false,
  placeholder = "Select or type a category...",
  refreshKey,
}) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [search, setSearch] = useState("");
  const [pendingCreateName, setPendingCreateName] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, [refreshKey]);

  const selectedCategory = categories.find((c) => c.categoryId === value);

  useEffect(() => {
    if (value) setPendingCreateName(null);
  }, [value]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const showCreate =
    search.trim().length > 0 &&
    !filtered.some(
      (c) => c.name.toLowerCase() === search.toLowerCase()
    );

  const handleSelect = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.categoryId === categoryId);
      if (cat) {
        onChange(cat.categoryId, cat.name);
        setPendingCreateName(null);
        setOpen(false);
        setSearch("");
      }
    },
    [categories, onChange]
  );

  const handleCreate = useCallback(() => {
    const trimmed = search.trim();
    if (trimmed.length > 0) {
      console.log("[CategoryCombobox] Creating category:", trimmed);
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
          {selectedCategory ? selectedCategory.name : pendingCreateName ?? placeholder}
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
          {showCreate && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t px-2 py-2 text-sm text-primary hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={handleCreate}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create &ldquo;{search.trim()}&rdquo;
            </button>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CategoryCombobox;
