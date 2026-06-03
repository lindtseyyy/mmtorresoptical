import { useState, useCallback, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, UserRound, X, FileText, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { useProductsForSale, usePatientPrescriptions } from "@/features/sales/hooks/salesQuery";
import { createTransaction } from "@/features/sales/services/transactionApi";
import { fetchPrescriptionForCheckout } from "@/features/patients/services/prescriptionApi";
import ProductDisplay from "@/features/sales/components/ProductDisplay";
import BillingSection from "@/features/sales/components/BillingSection";
import PaymentDrawer from "@/features/sales/components/PaymentDrawer";
import ReceiptDialog from "@/features/sales/components/ReceiptDialog";
import PatientPickerModal from "@/features/sales/components/PatientPickerModal";
import type { CartItem, TransactionRequest, TransactionResponse, SelectedPatient } from "@/features/sales/types";
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
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [resetKey, setResetKey] = useState(0);
  const [lastReceipt, setLastReceipt] = useState<TransactionResponse | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [productTypeFilter, setProductTypeFilter] = useState<"PHYSICAL" | "SERVICE">("PHYSICAL");
  const [selectedPatient, setSelectedPatient] = useState<SelectedPatient | null>(null);
  const [estimatedReadyDate, setEstimatedReadyDate] = useState("");
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [patientExpanded, setPatientExpanded] = useState(true);
  const [seniorPwdEnabled, setSeniorPwdEnabled] = useState(false);
  const [seniorPwdName, setSeniorPwdName] = useState("");
  const [seniorPwdAddress, setSeniorPwdAddress] = useState("");
  const [seniorPwdIdNumber, setSeniorPwdIdNumber] = useState("");

  const { data: patientPrescriptions = [] } = usePatientPrescriptions(selectedPatient?.patientId);

  const physicalCount = useMemo(
    () => products.filter((p) => p.productType === "PHYSICAL").length,
    [products]
  );
  const serviceCount = useMemo(
    () => products.filter((p) => p.productType === "SERVICE").length,
    [products]
  );

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

  // Senior/PWD discount computation
  useEffect(() => {
    const allFieldsFilled = seniorPwdName.trim() && seniorPwdAddress.trim() && seniorPwdIdNumber.trim();

    if (!seniorPwdEnabled || !allFieldsFilled) {
      // Restore any saved manual discounts
      setCart((prev) =>
        prev.map((item) => {
          if (item.isSeniorPwdRateActive || item.savedManualDiscountType !== undefined) {
            return {
              ...item,
              discountType: item.savedManualDiscountType ?? null,
              discountValue: item.savedManualDiscountValue ?? 0,
              isDiscounted: item.savedManualDiscountType != null,
              savedManualDiscountType: undefined,
              savedManualDiscountValue: undefined,
              isSeniorPwdRateActive: false,
              isSeniorPwdProcessed: false,
              seniorPwdDiscountAmount: undefined,
            };
          }
          return item;
        })
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (!item.product.isSeniorPwdEligible) return item;
        // Skip items already processed by this effect (unless a manual discount was applied after)
        if (item.isSeniorPwdProcessed) return item;

        const pwdSavingPerUnit = item.product.unitPrice * 0.2;
        const pwdSavingTotal = pwdSavingPerUnit * item.quantity;
        // Use the current effective discount, or fall back to saved manual discount
        const currentDiscount =
          item.isDiscounted && item.discountType && item.discountValue
            ? item.discountType === "PERCENT"
              ? (item.product.unitPrice * item.quantity * item.discountValue) / 100
              : item.discountValue
            : 0;
        const manualDiscountTotal =
          currentDiscount > 0
            ? currentDiscount
            : item.savedManualDiscountType && item.savedManualDiscountValue
              ? item.savedManualDiscountType === "PERCENT"
                ? (item.product.unitPrice * item.quantity * item.savedManualDiscountValue) / 100
                : item.savedManualDiscountValue
              : 0;

        if (pwdSavingTotal >= manualDiscountTotal) {
          return {
            ...item,
            savedManualDiscountType: item.savedManualDiscountType ?? item.discountType,
            savedManualDiscountValue: item.savedManualDiscountValue ?? item.discountValue,
            discountType: "PERCENT" as const,
            discountValue: 20,
            isDiscounted: true,
            isSeniorPwdRateActive: true,
            isSeniorPwdProcessed: true,
            seniorPwdDiscountAmount: pwdSavingTotal,
          };
        }

        return {
          ...item,
          savedManualDiscountType: item.savedManualDiscountType ?? item.discountType,
          savedManualDiscountValue: item.savedManualDiscountValue ?? item.discountValue,
          isSeniorPwdRateActive: false,
          isSeniorPwdProcessed: true,
          seniorPwdDiscountAmount: 0,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seniorPwdEnabled, seniorPwdName, seniorPwdAddress, seniorPwdIdNumber]);

  const transactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-summary"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setLastReceipt(data);
      sessionStorage.removeItem(STORAGE_KEY);
      setCart([]);
      setSelectedPatient(null);
      setEstimatedReadyDate("");
      setShowDrawer(false);
      setResetKey((k) => k + 1);
      setSeniorPwdEnabled(false);
      setSeniorPwdName("");
      setSeniorPwdAddress("");
      setSeniorPwdIdNumber("");
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
      const isService = product.productType === "SERVICE";
      const undiscounted = prev.find(
        (i) => i.product.productId === product.productId && !i.isDiscounted
      );
      if (undiscounted) {
        if (!isService && undiscounted.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.product.productId === product.productId && !i.isDiscounted
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      const seniorActive = seniorPwdEnabled && seniorPwdName.trim() && seniorPwdAddress.trim() && seniorPwdIdNumber.trim();
      const applySenior = seniorActive && product.isSeniorPwdEligible;
      return [
        ...prev,
        {
          uid: nextUid(),
          product,
          quantity: 1,
          discountType: applySenior ? "PERCENT" : null,
          discountValue: applySenior ? 20 : 0,
          isDiscounted: !!applySenior,
          isSeniorPwdRateActive: !!applySenior,
          isSeniorPwdProcessed: !!applySenior,
          seniorPwdDiscountAmount: applySenior ? product.unitPrice * 0.2 : undefined,
        },
      ];
    });
  }, [seniorPwdEnabled, seniorPwdName, seniorPwdAddress, seniorPwdIdNumber]);

  const updateQuantity = useCallback((uid: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.uid !== uid));
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.uid !== uid) return i;
        const updated = { ...i, quantity };
        // Recalculate senior discount amount if senior rate is active
        if (i.isSeniorPwdRateActive) {
          updated.seniorPwdDiscountAmount = i.product.unitPrice * 0.2 * quantity;
        }
        return updated;
      })
    );
  }, []);

  const removeItem = useCallback((uid: string) => {
    setCart((prev) => prev.filter((i) => i.uid !== uid));
  }, []);

  const clearAll = useCallback(() => {
    setCart([]);
    setEstimatedReadyDate("");
    setSeniorPwdEnabled(false);
    setSeniorPwdName("");
    setSeniorPwdAddress("");
    setSeniorPwdIdNumber("");
  }, []);

  const applyDiscount = useCallback(
    (
      uid: string,
      discountType: "PERCENT" | "FIXED",
      discountValue: number
    ) => {
      setCart((prev) =>
        prev.map((i) => {
          if (i.uid !== uid) return i;
          // Don't allow manual discount override on senior-eligible items when senior toggle is active
          const seniorActive = seniorPwdEnabled && seniorPwdName.trim() && seniorPwdAddress.trim() && seniorPwdIdNumber.trim();
          if (seniorActive && i.product.isSeniorPwdEligible && i.isSeniorPwdRateActive) return i;
          return { ...i, isDiscounted: true, discountType, discountValue, isSeniorPwdProcessed: false };
        })
      );
    },
    [seniorPwdEnabled, seniorPwdName, seniorPwdAddress, seniorPwdIdNumber]
  );

  const removeDiscount = useCallback((uid: string) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.uid !== uid) return i;
        // Don't allow removing senior rate when toggle is active
        const seniorActive = seniorPwdEnabled && seniorPwdName.trim() && seniorPwdAddress.trim() && seniorPwdIdNumber.trim();
        if (seniorActive && i.product.isSeniorPwdEligible && i.isSeniorPwdRateActive) return i;
        return { ...i, isDiscounted: false, discountType: null, discountValue: 0, isSeniorPwdProcessed: false };
      })
    );
  }, [seniorPwdEnabled, seniorPwdName, seniorPwdAddress, seniorPwdIdNumber]);

  const loadPrescriptionToCart = useCallback(async (prescriptionId: string) => {
    try {
      const details = await fetchPrescriptionForCheckout(prescriptionId);
      if (!details.recommendations?.length) {
        toast.info("No recommendations", {
          description: "This prescription has no product recommendations.",
        });
        return;
      }

      const skipped: string[] = [];
      let addedCount = 0;

      setCart((prev) => {
        const merged = [...prev];
        for (const rec of details.recommendations!) {
          const alreadyInCart = merged.some(
            (i) => i.product.productId === rec.productId
          );
          if (alreadyInCart) {
            skipped.push(rec.productName);
            continue;
          }
          merged.push({
            uid: nextUid(),
            product: {
              productId: rec.productId,
              productName: rec.productName,
              categoryId: "",
              categoryName: rec.category,
              supplierId: "",
              supplierName: rec.supplierName,
              unitPrice: rec.unitPrice,
              quantity: rec.stockQuantity,
              productType: rec.productType as "PHYSICAL" | "SERVICE",
              imageDir: rec.imageDir,
              lowLevelThreshold: 0,
              overstockedThreshold: 0,
              leadTimeDays: 0,
              reorderPoint: null,
              suggestedOrderQuantity: null,
              isArchived: false,
              isSeniorPwdEligible: rec.isSeniorPwdEligible,
              createdAt: "",
            },
            quantity: rec.quantity,
            discountType: null,
            discountValue: 0,
            isDiscounted: false,
          });
          addedCount++;
        }
        return merged;
      });

      if (skipped.length > 0 && addedCount > 0) {
        toast.warning("Some items skipped", {
          description: `Already in cart: ${skipped.join(", ")}. ${addedCount} new item(s) added.`,
        });
      } else if (skipped.length > 0 && addedCount === 0) {
        toast.info("Already in cart", {
          description: `All items from this prescription are already in the cart: ${skipped.join(", ")}.`,
        });
      } else {
        toast.success("Prescription loaded", {
          description: `${addedCount} item(s) added to cart.`,
        });
      }
    } catch (e: any) {
      toast.error("Failed to load prescription", {
        description: e?.response?.data?.message || e?.message,
      });
    }
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
        seniorPwdDiscountAmount: item.seniorPwdDiscountAmount ?? 0,
      }));

      const payload: TransactionRequest = {
        amountTendered: payment.amountTendered,
        paymentMethod: payment.paymentMethod,
        items,
        ...(selectedPatient && { patientId: selectedPatient.patientId }),
        ...(selectedPatient && estimatedReadyDate && { estimatedReadyDate }),
        ...(selectedPrescriptionId && { prescriptionId: selectedPrescriptionId }),
        ...(payment.referenceNumber && {
          referenceNumber: payment.referenceNumber,
        }),
        ...(payment.gcashNumber && {
          gcashNumber: payment.gcashNumber,
        }),
        ...(seniorPwdEnabled &&
          seniorPwdName.trim() && {
            seniorPwdName: seniorPwdName.trim(),
            seniorPwdAddress: seniorPwdAddress.trim(),
            seniorPwdIdNumber: seniorPwdIdNumber.trim(),
          }),
      };

      transactionMutation.mutate(payload);
    },
    [cart, selectedPatient, selectedPrescriptionId, estimatedReadyDate, transactionMutation, seniorPwdEnabled, seniorPwdName, seniorPwdAddress, seniorPwdIdNumber]
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
        <div className="mb-3 border-b border-muted-foreground/20 pb-2">
          <SegmentedControl
            className="w-full"
            options={[
              { value: "PHYSICAL", label: "Products", count: physicalCount },
              { value: "SERVICE", label: "Services", count: serviceCount },
            ]}
            value={productTypeFilter}
            onChange={(v) => setProductTypeFilter(v as "PHYSICAL" | "SERVICE")}
          />
        </div>
        <ProductDisplay
          products={products}
          productTypeFilter={productTypeFilter}
          onAddToCart={addToCart}
          disabled={transactionMutation.isPending}
        />
      </div>

      {/* Right column — Billing */}
      <div className="flex w-2/5 flex-col min-h-0 gap-3">
        {/* Customer Context */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          {selectedPatient ? (
            <>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                  onClick={() => setPatientExpanded((p) => !p)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <UserRound className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {selectedPatient.fullName}
                    </p>
                  </div>
                  {patientExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-red-800 text-white hover:bg-red-900 hover:text-white"
                  onClick={() => {
                    setSelectedPatient(null);
                    setSelectedPrescriptionId("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {patientExpanded && (
                <>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-muted-foreground">
                      Estimated Pickup Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={estimatedReadyDate}
                      onChange={(e) => setEstimatedReadyDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />

                  </div>

                  {patientPrescriptions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Load Prescription Recommendations
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedPrescriptionId}
                          onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                          className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                          <option value="">Select a prescription...</option>
                          {patientPrescriptions.map((rx: any) => (
                            <option key={rx.prescriptionId} value={rx.prescriptionId}>
                              {rx.rxNumber} —{" "}
                              {new Date(rx.issueDate).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 shrink-0 gap-1.5"
                          disabled={!selectedPrescriptionId}
                          onClick={() => loadPrescriptionToCart(selectedPrescriptionId)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Load to Cart
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 cursor-pointer"
              onClick={() => setIsPatientModalOpen(true)}
            >
              <UserRound className="h-4 w-4" />
              Associate Patient
            </Button>
          )}
        </div>

        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card p-4 min-h-0">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-card-foreground">
              Billing
            </h2>
            {cart.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                onClick={clearAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove all items
              </Button>
            )}
          </div>
          <BillingSection
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onApplyDiscount={applyDiscount}
            onRemoveDiscount={removeDiscount}
            onPay={() => setShowDrawer(true)}
            seniorPwdEnabled={seniorPwdEnabled}
            onToggleSeniorPwd={setSeniorPwdEnabled}
            seniorPwdName={seniorPwdName}
            onSeniorPwdNameChange={setSeniorPwdName}
            seniorPwdAddress={seniorPwdAddress}
            onSeniorPwdAddressChange={setSeniorPwdAddress}
            seniorPwdIdNumber={seniorPwdIdNumber}
            onSeniorPwdIdNumberChange={setSeniorPwdIdNumber}
          />
        </div>
      </div>

      <PatientPickerModal
        open={isPatientModalOpen}
        onOpenChange={setIsPatientModalOpen}
        onSelect={setSelectedPatient}
      />

      <PaymentDrawer
        key={resetKey}
        open={showDrawer}
        onClose={() => setShowDrawer(false)}
        items={cart}
        grandTotal={grandTotal}
        onComplete={handleCompleteSale}
        pending={transactionMutation.isPending}
        hasPatient={selectedPatient !== null}
        hasPrescription={!!selectedPrescriptionId}
      />

      <ReceiptDialog
        receipt={lastReceipt}
        onClose={() => setLastReceipt(null)}
      />
    </div>
  );
};

export default ManageSales;
