import { Printer } from "lucide-react";

import { Dialog } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import type { TransactionResponse, TransactionItemResponse, RefundDetails } from "@/features/sales/types";

const BUSINESS_NAME = "MM Torres Optical Clinic";
const BUSINESS_ADDRESS = "259 Shoe Avenue, Sto. Nino, Marikina City, 1806";
const BUSINESS_ADDRESS_LINE2 = "Metro Manila, Philippines";
const BUSINESS_PHONE = "(02) 933 7725";

export type PrintMode = "ORIGINAL" | "UPDATED";

interface PrintableReceiptProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionResponse;
  printMode: PrintMode;
  isReprint?: boolean;
}

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const format2 = (n: number) => n.toFixed(2);

// ────────────────────────────────────────────────────────────
// ORIGINAL Sales Receipt
// ────────────────────────────────────────────────────────────
const OriginalReceipt: React.FC<{
  transaction: TransactionResponse;
  isReprint?: boolean;
}> = ({ transaction: tx, isReprint }) => {
  const date = new Date(tx.transactionDate);
  const dateStr = date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const subtotal = tx.transactionItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const totalDiscount = tx.transactionItems.reduce((sum, i) => {
    if (i.isDiscounted) return sum + (i.unitPrice * i.quantity - i.subtotal);
    return sum;
  }, 0);

  return (
    <div className="font-mono text-xs leading-relaxed text-foreground max-h-[65vh] overflow-y-auto print:max-h-none print:overflow-visible">
      {/* Watermark for reprints */}
      {isReprint && (
        <div className="text-center mb-4 border border-dashed border-border py-2 px-4 rounded">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            DUPLICATE COPY / REPRINT
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Original: {dateStr} {timeStr}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xs font-bold tracking-wide uppercase text-muted-foreground mb-1">
          SALES RECEIPT
        </h2>
        <h2 className="text-sm font-bold tracking-wide uppercase">
          {BUSINESS_NAME}
        </h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">{BUSINESS_ADDRESS}</p>
        <p className="text-[10px] text-muted-foreground">{BUSINESS_ADDRESS_LINE2}</p>
        <p className="text-[10px] text-muted-foreground">{BUSINESS_PHONE}</p>
      </div>

      <hr className="border-dashed border-border mb-3" />

      {/* Transaction Metadata */}
      <div className="space-y-0.5 mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Receipt #</span>
          <span className="font-semibold">{tx.transactionNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time</span>
          <span>{timeStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cashier</span>
          <span>{tx.createdBy.fullName}</span>
        </div>
      </div>

      {tx.patient && (
        <div className="mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Patient</span>
            <span>{tx.patient.fullName}</span>
          </div>
        </div>
      )}

      <hr className="border-dashed border-border mb-3" />

      {/* Items */}
      <table className="w-full mb-3">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left font-semibold pb-1">Item</th>
            <th className="text-center font-semibold pb-1 w-10">Qty</th>
            <th className="text-right font-semibold pb-1 w-20">Total</th>
          </tr>
        </thead>
        <tbody>
          {tx.transactionItems.map((item) => (
            <tr key={item.transactionItemId} className="border-b border-border/30">
              <td className="py-1 align-top">
                <span className="font-medium">{item.product.productName}</span>
                {item.isDiscounted && (
                  <span className="text-green-600">
                    {" "}
                    ({item.discountType === "PERCENT"
                      ? `${item.discountValue}%`
                      : `₱${format2(item.discountValue)}`}{" "}
                    off)
                  </span>
                )}
              </td>
              <td className="py-1 text-center align-top text-muted-foreground">{item.quantity}</td>
              <td className="py-1 text-right align-top tabular-nums font-medium">
                {format2(item.isDiscounted ? item.subtotal : item.unitPrice * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="border-dashed border-border mb-3" />

      {/* Summary */}
      <div className="space-y-0.5 mb-3">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{format2(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="tabular-nums">-{format2(totalDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-border pt-1 mt-1">
          <span>TOTAL</span>
          <span className="tabular-nums">{format2(tx.totalAmount)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="rounded-sm bg-muted/50 px-2 py-1.5 mb-3">
        <div className="flex justify-between font-semibold">
          <span>Amount Paid</span>
          <span className="tabular-nums">{format2(tx.amountPaid ?? 0)}</span>
        </div>
        {(tx.balanceDue ?? 0) > 0 && (
          <div className="flex justify-between text-amber-600 font-semibold mt-0.5">
            <span>Remaining Balance</span>
            <span className="tabular-nums">{format2(tx.balanceDue ?? 0)}</span>
          </div>
        )}
        {(tx.payments?.length ?? 0) > 0 && (
          <>
            <hr className="border-dashed border-border my-1.5" />
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              {tx.payments.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span>{p.paymentMethod}{p.referenceNumber ? ` (#${p.referenceNumber})` : ""}</span>
                  <span className="tabular-nums">{format2(p.amount)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground space-y-1">
        <p>Returns accepted within 7 days of purchase.</p>
        <p>Receipt and original packaging required.</p>
        <p className="font-medium text-foreground text-xs mt-2">
          Thank you for choosing MM Torres Optical!
        </p>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// UPDATED Statement of Account
// ────────────────────────────────────────────────────────────
const UpdatedStatement: React.FC<{ transaction: TransactionResponse }> = ({ transaction: tx }) => {
  const date = new Date(tx.transactionDate);
  const dateStr = date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const now = new Date();
  const printedStr = now.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const printedTime = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  // Active items: quantity - refundedQuantity > 0
  const activeItems = tx.transactionItems
    .map((item) => {
      const activeQty = item.quantity - (item.refundedQuantity ?? 0);
      if (activeQty <= 0) return null;
      const activeSubtotal = activeQty * item.unitPrice;
      let discountAmount = 0;
      if (item.isDiscounted) {
        if (item.discountType === "PERCENT") {
          discountAmount = activeSubtotal * (item.discountValue / 100);
        } else {
          const discountPerUnit = item.discountValue / item.quantity;
          discountAmount = discountPerUnit * activeQty;
        }
      }
      return {
        ...item,
        activeQty,
        activeSubtotal: activeSubtotal - discountAmount,
        discountAmount,
        activeUnitPrice: item.unitPrice,
      };
    })
    .filter(Boolean) as (TransactionItemResponse & {
    activeQty: number;
    activeSubtotal: number;
    discountAmount: number;
    activeUnitPrice: number;
  })[];

  // Flatten all refund records across items
  const allRefunds: (RefundDetails & { productName: string })[] = [];
  for (const item of tx.transactionItems) {
    for (const r of item.refundDetailsDTOList ?? []) {
      allRefunds.push({ ...r, productName: item.product.productName });
    }
  }

  const totalDeductions = allRefunds.reduce((sum, r) => sum + (r.itemCreditAmount ?? 0), 0);
  const revisedTotal = tx.totalAmount - totalDeductions;

  return (
    <div className="font-mono text-xs leading-relaxed text-foreground max-h-[65vh] overflow-y-auto print:max-h-none print:overflow-visible">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xs font-bold tracking-wide uppercase text-muted-foreground mb-1">
          AMENDED STATEMENT OF ACCOUNT
        </h2>
        <h2 className="text-sm font-bold tracking-wide uppercase">
          {BUSINESS_NAME}
        </h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">{BUSINESS_ADDRESS}</p>
        <p className="text-[10px] text-muted-foreground">{BUSINESS_ADDRESS_LINE2}</p>
        <p className="text-[10px] text-muted-foreground">{BUSINESS_PHONE}</p>
      </div>

      <hr className="border-dashed border-border mb-3" />

      {/* Metadata */}
      <div className="space-y-0.5 mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Original Txn #</span>
          <span className="font-semibold">{tx.transactionNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transaction Date</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Statement Printed</span>
          <span>{printedStr} {printedTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cashier</span>
          <span>{tx.createdBy.fullName}</span>
        </div>
      </div>

      {tx.patient && (
        <div className="mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Patient</span>
            <span>{tx.patient.fullName}</span>
          </div>
        </div>
      )}

      <hr className="border-dashed border-border mb-3" />

      {/* Active Items */}
      {activeItems.length > 0 && (
        <>
          <h3 className="text-xs font-semibold mb-2 uppercase">Active Items</h3>
          <table className="w-full mb-3">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold pb-1">Item</th>
                <th className="text-center font-semibold pb-1 w-10">Qty</th>
                <th className="text-right font-semibold pb-1 w-20">Total</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item) => (
                <tr key={item.transactionItemId} className="border-b border-border/30">
                  <td className="py-1 align-top">
                    <span className="font-medium">{item.product.productName}</span>
                    {item.isDiscounted && (
                      <span className="text-green-600">
                        {" "}
                        ({item.discountType === "PERCENT"
                          ? `${item.discountValue}%`
                          : `₱${format2(item.discountValue)}`}{" "}
                        off)
                      </span>
                    )}
                  </td>
                  <td className="py-1 text-center align-top text-muted-foreground">{item.activeQty}</td>
                  <td className="py-1 text-right align-top tabular-nums font-medium">
                    {format2(item.activeSubtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Returns & Adjustments */}
      {allRefunds.length > 0 && (
        <>
          <hr className="border-dashed border-border mb-3" />
          <h3 className="text-xs font-semibold mb-2 uppercase">Returns &amp; Adjustments</h3>
          <table className="w-full mb-3">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-semibold pb-1">Item</th>
                <th className="text-center font-semibold pb-1 w-10">Qty</th>
                <th className="text-right font-semibold pb-1 w-20">Value</th>
              </tr>
            </thead>
            <tbody>
              {allRefunds.map((r) => (
                <tr key={r.refundId} className="border-b border-border/30">
                  <td className="py-1 align-top">
                    <span>{r.productName}</span>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDateTime(r.refundedAt)} &middot; {r.refundMethod.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="py-1 text-center align-top text-red-600">-{r.refundQuantity}</td>
                  <td className="py-1 text-right align-top tabular-nums text-red-600">
                    -₱{format2(r.itemCreditAmount ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <hr className="border-dashed border-border mb-3" />

      {/* Waterfall Ledger Summary */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between">
          <span>Original Order Total:</span>
          <span className="tabular-nums">₱{format2(tx.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Total Deductions:</span>
          <span className="tabular-nums">-₱{format2(totalDeductions)}</span>
        </div>
        <hr className="border-dashed border-border my-0.5" />
        <div className="flex justify-between font-bold">
          <span>REVISED TOTAL VALUE:</span>
          <span className="tabular-nums">₱{format2(revisedTotal)}</span>
        </div>
        <hr className="border-double border-border my-0.5" />
        <div className="flex justify-between">
          <span>Total Cash Collected:</span>
          <span className="tabular-nums">₱{format2(tx.amountPaid ?? 0)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>CURRENT BALANCE DUE:</span>
          <span className="tabular-nums">₱{format2(tx.balanceDue ?? 0)}</span>
        </div>
      </div>

      {/* Empty state — no refunds, all items active */}
      {allRefunds.length === 0 && (
        <div className="text-center text-muted-foreground text-[10px] mb-3">
          <p>No returns or adjustments recorded.</p>
          <p>This account is current as of {printedStr}.</p>
        </div>
      )}

      <hr className="border-dashed border-border mb-4" />

      {/* Signature */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-8">
          Customer Acknowledgment Signature: _________________________
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-muted-foreground">
        <p className="font-medium text-foreground text-xs">
          Thank you for choosing MM Torres Optical!
        </p>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// PrintableReceipt — dual-mode wrapper
// ────────────────────────────────────────────────────────────
const PrintableReceipt: React.FC<PrintableReceiptProps> = ({
  open,
  onClose,
  transaction,
  printMode,
  isReprint = false,
}) => {
  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  const isUpdated = printMode === "UPDATED";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {isUpdated ? (
        <UpdatedStatement transaction={transaction} />
      ) : (
        <OriginalReceipt transaction={transaction} isReprint={isReprint} />
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 print:hidden">
        <Button className="flex-1" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          {isUpdated ? "Print Statement" : "Print Receipt"}
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-2 border-gray-400 dark:border-gray-500"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
};

export default PrintableReceipt;
