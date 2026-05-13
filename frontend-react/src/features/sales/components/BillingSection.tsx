import { useState, useRef, useEffect } from "react";
import { Minus, Plus, Trash2, Tag, Receipt, X, CreditCard } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import type { CartItem } from "@/features/sales/types";

interface BillingSectionProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onApplyDiscount: (
    productId: string,
    discountType: "PERCENT" | "FIXED",
    discountValue: number
  ) => void;
  onRemoveDiscount: (productId: string) => void;
  onPay: () => void;
}

const BillingSection: React.FC<BillingSectionProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onRemoveDiscount,
  onPay,
}) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity,
    0
  );

  const discount = items.reduce((sum, item) => {
    if (!item.isDiscounted || !item.discountType || !item.discountValue)
      return sum;
    const itemSubtotal = item.product.unitPrice * item.quantity;
    if (item.discountType === "PERCENT") {
      return sum + (itemSubtotal * item.discountValue) / 100;
    }
    return sum + item.discountValue;
  }, 0);

  const grandTotal = subtotal - discount;

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
        <Receipt className="h-10 w-10" />
        <p className="text-sm text-center">
          No items added yet.<br />Select products from the left to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
        {items.map((item) => (
          <BillingEntry
            key={item.product.productId}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onApplyDiscount={onApplyDiscount}
            onRemoveDiscount={onRemoveDiscount}
          />
        ))}
      </div>

      <div className="mt-auto border-t border-border pt-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">₱{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="tabular-nums">-₱{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold border-t border-border pt-1.5">
          <span>Total</span>
          <span className="tabular-nums">₱{grandTotal.toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} &middot;{" "}
          {items.reduce((sum, i) => sum + i.quantity, 0)} total units
        </p>
        <Button className="w-full gap-2" size="lg" onClick={onPay}>
          <CreditCard className="h-4 w-4" />
          Pay ₱{grandTotal.toFixed(2)}
        </Button>
      </div>
    </div>
  );
};

const BillingEntry: React.FC<{
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onApplyDiscount: (
    productId: string,
    discountType: "PERCENT" | "FIXED",
    discountValue: number
  ) => void;
  onRemoveDiscount: (productId: string) => void;
}> = ({ item, onUpdateQuantity, onRemoveItem, onApplyDiscount, onRemoveDiscount }) => {
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [qtyInput, setQtyInput] = useState(String(item.quantity));
  const inputRef = useRef<HTMLInputElement>(null);

  const itemSubtotal = item.product.unitPrice * item.quantity;

  useEffect(() => {
    setQtyInput(String(item.quantity));
  }, [item.quantity]);

  const handleQtyChange = () => {
    const parsed = parseInt(qtyInput, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      const clamped = Math.min(parsed, item.product.quantity);
      onUpdateQuantity(item.product.productId, clamped);
      setQtyInput(String(clamped));
    } else {
      setQtyInput(String(item.quantity));
    }
  };

  let discountedSubtotal = itemSubtotal;
  if (item.isDiscounted && item.discountType && item.discountValue) {
    if (item.discountType === "PERCENT") {
      discountedSubtotal -= (itemSubtotal * item.discountValue) / 100;
    } else {
      discountedSubtotal -= item.discountValue;
    }
    discountedSubtotal = Math.max(0, discountedSubtotal);
  }

  const handleApplyDiscount = () => {
    const value = parseFloat(inputRef.current?.value ?? "0");
    if (!value || value <= 0) return;
    onApplyDiscount(item.product.productId, discountType, value);
    if (inputRef.current) inputRef.current.value = "";
    setShowDiscount(false);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-2.5">
      {/* Row 1: Product name (left) | Delete (right) */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-card-foreground leading-snug">
          {item.product.productName}
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 -mr-1 -mt-0.5"
          onClick={() => onRemoveItem(item.product.productId)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Row 2: Qty | Price | Subtotal */}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() =>
                onUpdateQuantity(item.product.productId, item.quantity - 1)
              }
            >
              <Minus className="h-3 w-3" />
            </Button>
            <input
              type="number"
              min="1"
              max={item.product.quantity}
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              onBlur={handleQtyChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleQtyChange();
                if (e.key === "Escape") setQtyInput(String(item.quantity));
              }}
              className="mx-1 h-6 w-8 text-center text-xs tabular-nums font-medium border border-border rounded bg-transparent outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              disabled={item.quantity >= item.product.quantity}
              onClick={() =>
                onUpdateQuantity(item.product.productId, item.quantity + 1)
              }
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            × ₱{item.product.unitPrice.toFixed(2)}
          </span>
        </div>

        <span className="text-sm font-semibold tabular-nums shrink-0">
          {item.isDiscounted ? (
            <>
              <span className="text-green-600">₱{discountedSubtotal.toFixed(2)}</span>
              <span className="ml-1 text-[10px] text-muted-foreground line-through font-normal">
                ₱{itemSubtotal.toFixed(2)}
              </span>
            </>
          ) : (
            <span>₱{itemSubtotal.toFixed(2)}</span>
          )}
        </span>
      </div>

      {/* Row 3: Discount */}
      <div className="mt-1.5">
        {item.isDiscounted ? (
          <button
            type="button"
            onClick={() => onRemoveDiscount(item.product.productId)}
            className="inline-flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 hover:bg-green-200 cursor-pointer dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
            title="Remove discount"
          >
            {item.discountType === "PERCENT"
              ? `${item.discountValue}% off`
              : `₱${item.discountValue.toFixed(2)} off`}
            <X className="h-2.5 w-2.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowDiscount(!showDiscount)}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary cursor-pointer"
          >
            <Tag className="h-3 w-3" />
            Discount
          </button>
        )}
      </div>

      {/* Collapsible discount form */}
      {showDiscount && (
        <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1.5">
          <select
            value={discountType}
            onChange={(e) =>
              setDiscountType(e.target.value as "FIXED" | "PERCENT")
            }
            className="h-7 w-14 rounded border border-border bg-background text-[11px] px-1 text-muted-foreground cursor-pointer"
          >
            <option value="FIXED">₱</option>
            <option value="PERCENT">%</option>
          </select>
          <Input
            ref={inputRef}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="h-7 w-20 text-[11px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleApplyDiscount();
              if (e.key === "Escape") setShowDiscount(false);
            }}
          />
          <Button
            variant="default"
            size="sm"
            className="h-7 text-[10px] px-2"
            onClick={handleApplyDiscount}
          >
            Apply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] px-2 cursor-pointer"
            onClick={() => setShowDiscount(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default BillingSection;
