import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { useProductsForSale } from "@/features/sales/hooks/salesQuery";
import { createTransaction } from "@/features/sales/services/transactionApi";
import ProductDisplay from "@/features/sales/components/ProductDisplay";
import BillingSection from "@/features/sales/components/BillingSection";
import PaymentDrawer from "@/features/sales/components/PaymentDrawer";
import ReceiptDialog from "@/features/sales/components/ReceiptDialog";
import type { CartItem, TransactionRequest, TransactionResponse } from "@/features/sales/types";
import type { PaymentData } from "@/features/sales/components/PaymentSection";
import type { Product } from "@/features/inventory/types";

const STORAGE_KEY = "pos-cart";

let uidCounter = 0;
const nextUid = () => `ci-${Date.now()}-${++uidCounter}`;

const loadCart = (): CartItem[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const ManageSales: React.FC = () => {
  const { data: products = [], isLoading, isError } = useProductsForSale();
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [resetKey, setResetKey] = useState(0);
  const [lastReceipt, setLastReceipt] = useState<TransactionResponse | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Remove cart items whose product is no longer active (e.g. was archived)
  useEffect(() => {
    if (products.length === 0) return;
    const activeIds = new Set(products.map((p) => p.productId));
    const stale = cart.filter((item) => !activeIds.has(item.product.productId));
    if (stale.length > 0) {
      const names = stale.map((item) => item.product.productName).join(", ");
      setCart((prev) => prev.filter((item) => activeIds.has(item.product.productId)));
      toast.warning("Item(s) removed from cart", {
        description: `${names} ${stale.length === 1 ? "is" : "are"} no longer available.`,
      });
    }
    // Only run when products identity changes — not on every cart change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const transactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: (data) => {
      setLastReceipt(data);
      sessionStorage.removeItem(STORAGE_KEY);
      setCart([]);
      setShowDrawer(false);
      setResetKey((k) => k + 1);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Transaction failed";
      toast.error("Transaction failed", { description: msg });
    },
  });

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const undiscounted = prev.find(
        (i) => i.product.productId === product.productId && !i.isDiscounted
      );
      if (undiscounted) {
        if (undiscounted.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.product.productId === product.productId && !i.isDiscounted
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          uid: nextUid(),
          product,
          quantity: 1,
          discountType: null,
          discountValue: 0,
          isDiscounted: false,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((uid: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.uid !== uid));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, quantity } : i))
    );
  }, []);

  const removeItem = useCallback((uid: string) => {
    setCart((prev) => prev.filter((i) => i.uid !== uid));
  }, []);

  const applyDiscount = useCallback(
    (
      uid: string,
      discountType: "PERCENT" | "FIXED",
      discountValue: number
    ) => {
      setCart((prev) =>
        prev.map((i) =>
          i.uid === uid
            ? { ...i, isDiscounted: true, discountType, discountValue }
            : i
        )
      );
    },
    []
  );

  const removeDiscount = useCallback((uid: string) => {
    setCart((prev) =>
      prev.map((i) =>
        i.uid === uid
          ? { ...i, isDiscounted: false, discountType: null, discountValue: 0 }
          : i
      )
    );
  }, []);

  const handleCompleteSale = useCallback(
    (payment: PaymentData) => {
      const items: TransactionRequest["items"] = cart.map((item) => ({
        productId: item.product.productId,
        quantity: item.quantity,
        ...(item.isDiscounted && {
          discountType: item.discountType ?? undefined,
          discountValue: item.discountValue,
          isDiscounted: true,
        }),
        isDiscounted: item.isDiscounted,
      }));

      const payload: TransactionRequest = {
        paymentType: payment.paymentType,
        items,
        ...(payment.paymentType === "CASH" && {
          cashTender: payment.cashTender,
        }),
        ...(payment.paymentType === "GCASH" && {
          referenceNumber: payment.referenceNumber,
        }),
      };

      transactionMutation.mutate(payload);
    },
    [cart, transactionMutation]
  );

  const grandTotal = cart.reduce((sum, item) => {
    const itemSubtotal = item.product.unitPrice * item.quantity;
    if (item.isDiscounted && item.discountType && item.discountValue) {
      if (item.discountType === "PERCENT") {
        return sum + itemSubtotal - (itemSubtotal * item.discountValue) / 100;
      }
      return sum + itemSubtotal - item.discountValue;
    }
    return sum + itemSubtotal;
  }, 0);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-destructive">Failed to load products.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left column — Products */}
      <div className="flex w-3/5 flex-col rounded-lg border border-border bg-card p-4 min-h-0">
        <h2 className="mb-2 text-sm font-semibold text-card-foreground">
          Products
        </h2>
        <ProductDisplay
          products={products}
          onAddToCart={addToCart}
          disabled={transactionMutation.isPending}
        />
      </div>

      {/* Right column — Billing */}
      <div className="flex w-2/5 flex-col min-h-0">
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card p-4 min-h-0">
          <h2 className="mb-2 text-sm font-semibold text-card-foreground">
            Billing
          </h2>
          <BillingSection
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onApplyDiscount={applyDiscount}
            onRemoveDiscount={removeDiscount}
            onPay={() => setShowDrawer(true)}
          />
        </div>
      </div>

      <PaymentDrawer
        key={resetKey}
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        items={cart}
        grandTotal={grandTotal}
        onComplete={handleCompleteSale}
        pending={transactionMutation.isPending}
      />

      <ReceiptDialog
        receipt={lastReceipt}
        onClose={() => setLastReceipt(null)}
      />
    </div>
  );
};

export default ManageSales;
