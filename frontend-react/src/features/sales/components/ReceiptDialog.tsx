import { Dialog } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import type { TransactionResponse } from "@/features/sales/types";

interface ReceiptDialogProps {
  receipt: TransactionResponse | null;
  onClose: () => void;
}

const BUSINESS_NAME = "MM Torres Optical Clinic";
const BUSINESS_ADDRESS = "259 Shoe Avenue, Sto. Niño, Marikina City, 1806";
const BUSINESS_ADDRESS_LINE2 = "Metro Manila, Philippines";
const BUSINESS_PHONE = "(02) 933 7725";

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const date = new Date(receipt.transactionDate);
  const dateStr = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const subtotal = receipt.transactionItems.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0,
  );

  const totalDiscount = receipt.transactionItems.reduce((sum, i) => {
    if (i.isDiscounted) {
      return sum + (i.unitPrice * i.quantity - i.subtotal);
    }
    return sum;
  }, 0);

  const format = (n: number) => n.toFixed(2);

  return (
    <Dialog open={!!receipt} onOpenChange={onClose}>
      <div className="font-mono text-xs leading-relaxed text-foreground max-h-[65vh] overflow-y-auto">

        {/* ---- Header ---- */}
        <div className="text-center mb-4">
          <h2 className="text-xs font-bold tracking-wide uppercase text-muted-foreground mb-1">
            OFFICIAL RECEIPT
          </h2>
          <h2 className="text-sm font-bold tracking-wide uppercase">
            {BUSINESS_NAME}
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {BUSINESS_ADDRESS}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {BUSINESS_ADDRESS_LINE2}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {BUSINESS_PHONE}
          </p>
        </div>

        <hr className="border-dashed border-border mb-3" />

        {/* ---- Transaction Metadata ---- */}
        <div className="space-y-0.5 mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receipt #</span>
            <span className="font-semibold">{receipt.transactionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              receipt.transactionStatus === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" :
              receipt.transactionStatus === "DEPOSIT" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
              "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}>{receipt.transactionStatus.replace(/_/g, " ")}</span>
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
            <span>{receipt.createdBy.fullName}</span>
          </div>
        </div>

        {/* ---- Patient Info ---- */}
        {receipt.patient && (
          <div className="mb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient</span>
              <span>{receipt.patient.fullName}</span>
            </div>
          </div>
        )}

        <hr className="border-dashed border-border mb-3" />

        {/* ---- Itemized List ---- */}
        <table className="w-full mb-3">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-semibold pb-1">Item</th>
              <th className="text-center font-semibold pb-1 w-8">Type</th>
              <th className="text-center font-semibold pb-1 w-10">Qty</th>
              <th className="text-right font-semibold pb-1 w-18">Price</th>
              <th className="text-right font-semibold pb-1 w-20">Total</th>
            </tr>
          </thead>
          <tbody>
            {receipt.transactionItems.map((item) => (
              <tr key={item.transactionItemId} className="border-b border-border/30">
                <td className="py-1 align-top">
                  <span className="font-medium">{item.product.productName}</span>
                  {item.isDiscounted && (
                    <>
                      {" "}
                      <span className="text-green-600">
                        ({item.discountType === "PERCENT"
                          ? `${item.discountValue}%`
                          : `₱${format(item.discountValue)}`}{" "}
                        off)
                      </span>
                    </>
                  )}
                </td>
                <td className="py-1 text-center align-top text-[11px]">
                  <span className={item.product?.productType === "SERVICE" ? "text-blue-600" : "text-muted-foreground"}>
                    {item.product?.productType === "SERVICE" ? "SVC" : "PHY"}
                  </span>
                </td>
                <td className="py-1 text-center align-top text-muted-foreground">
                  {item.quantity}
                </td>
                <td className="py-1 text-right align-top tabular-nums text-muted-foreground">
                  {format(item.unitPrice)}
                </td>
                <td className="py-1 text-right align-top tabular-nums font-medium">
                  {format(
                    item.isDiscounted
                      ? item.subtotal
                      : item.unitPrice * item.quantity,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="border-dashed border-border mb-3" />

        {/* ---- Financial Summary ---- */}
        <div className="space-y-0.5 mb-3">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{format(subtotal)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="tabular-nums">-{format(totalDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-sm border-t border-border pt-1 mt-1">
            <span>TOTAL</span>
            <span className="tabular-nums">{format(receipt.totalAmount)}</span>
          </div>
        </div>

        {/* ---- Payment Information ---- */}
          <div className="rounded-sm bg-muted/50 px-2 py-1.5 mb-3">
            <div className="flex justify-between font-semibold">
              <span>Amount Paid</span>
              <span className="tabular-nums">{format(receipt.amountPaid ?? 0)}</span>
            </div>

            {(receipt.balanceDue ?? 0) > 0 && (
              <div className="flex justify-between text-amber-600 font-semibold mt-0.5">
                <span>Remaining Balance</span>
                <span className="tabular-nums">{format(receipt.balanceDue ?? 0)}</span>
              </div>
            )}

            {/* Payment History */}
            {(receipt.payments?.length ?? 0) > 0 && (
              <>
                <hr className="border-dashed border-border my-1.5" />
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  {receipt.payments.map((p) => (
                    <div key={p.id} className="flex justify-between">
                      <span>{p.paymentMethod} {p.referenceNumber ? `(#${p.referenceNumber})` : ""}</span>
                      <span className="tabular-nums">{format(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        {/* ---- Footer ---- */}
        <div className="text-center text-[10px] text-muted-foreground space-y-1">
          <p>
            Returns accepted within 7 days of purchase.
            <br />
            Receipt and original packaging required.
          </p>
          <p className="font-medium text-foreground text-xs mt-2">
            Thank you for choosing MM Torres Optical!
          </p>
        </div>

        <Button className="w-full mt-4" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
};

export default ReceiptDialog;
