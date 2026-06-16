import { useRef } from "react";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Printer } from "lucide-react";
import type { ItemRefundResponse, TransactionResponse, RefundReceiptData } from "@/features/sales/types";

const BUSINESS_NAME = "MM Torres Optical Clinic";
const BUSINESS_ADDRESS = "259 Shoe Avenue, Sto. Niño, Marikina City, 1806";
const BUSINESS_ADDRESS_LINE2 = "Metro Manila, Philippines";
const BUSINESS_PHONE = "(02) 933 7725";

interface RefundReceiptProps {
  open: boolean;
  onClose: () => void;
  refundData?: ItemRefundResponse;
  transaction: TransactionResponse;
  reprintData?: RefundReceiptData;
}

const formatCurrency = (amount: number) =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RefundReceipt: React.FC<RefundReceiptProps> = ({ open, onClose, refundData, transaction, reprintData }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const isReprint = !!reprintData;

  const dateStr = isReprint
    ? new Date(reprintData.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const timeStr = isReprint
    ? new Date(reprintData.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const receiptNumber = isReprint ? reprintData.receiptNumber : refundData!.refundReceipt.receiptNumber;
  const clerkName = isReprint ? reprintData.issuedByFullName : refundData!.refundReceipt.issuedByFullName;
  const cashRefunded = isReprint ? reprintData.actualCashback : refundData!.cashToReturn;
  const refundMethod = isReprint ? reprintData.refundMethod : refundData!.refundReceipt.refundMethod;
  const gcashNumber = isReprint ? reprintData.gcashNumber : refundData!.refundReceipt.gcashNumber;
  const referenceNumber = isReprint ? reprintData.referenceNumber : refundData!.refundReceipt.referenceNumber;

  const items = isReprint
    ? reprintData.refundItems.map((item) => ({
        productName: item.productName,
        quantity: item.quantityRefunded,
        amount: item.unitPrice * item.quantityRefunded,
      }))
    : (refundData!.refundedItems ?? []).map((item) => ({
        productName: item.productName,
        quantity: item.refundQuantity,
        amount: item.unitPrice * item.refundQuantity,
      }));

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div ref={receiptRef} className="receipt-canvas font-mono text-xs leading-relaxed text-foreground max-h-[65vh] overflow-y-auto print:max-h-none print:overflow-visible">
        {/* ---- Document Title ---- */}
        <div className="text-center mb-3">
          <h3 className="receipt-title text-xs font-bold uppercase tracking-wide">REFUND RECEIPT / CREDIT NOTE</h3>
          {isReprint && (
            <p className="text-[10px] text-muted-foreground mt-1 italic">DUPLICATE COPY</p>
          )}
        </div>

        {/* ---- Header ---- */}
        <div className="text-center mb-4">
          <h2 className="receipt-title text-sm font-bold tracking-wide uppercase">{BUSINESS_NAME}</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">{BUSINESS_ADDRESS}</p>
          <p className="text-[10px] text-muted-foreground">{BUSINESS_ADDRESS_LINE2}</p>
          <p className="text-[10px] text-muted-foreground">{BUSINESS_PHONE}</p>
        </div>

        <hr className="border-dashed border-border mb-3" />

        {/* ---- Metadata ---- */}
        <div className="space-y-0.5 mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receipt #</span>
            <span className="font-semibold">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original Txn</span>
            <span className="font-semibold">{transaction.transactionNumber}</span>
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
            <span className="text-muted-foreground">Clerk</span>
            <span>{clerkName}</span>
          </div>
        </div>

        <hr className="border-dashed border-border mb-3" />

        {/* ---- Refunded Items ---- */}
        <table className="w-full mb-3">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-semibold pb-1">Item</th>
              <th className="text-center font-semibold pb-1 w-10">Qty</th>
              <th className="receipt-num text-right font-semibold pb-1 w-20">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-border/30">
                <td className="py-1">{item.productName}</td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="receipt-num py-1 text-right text-red-600 tabular-nums">
                  -₱{formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="border-dashed border-border mb-3" />

        {/* ---- Financial Summary ---- */}
        <div className="space-y-0.5 mb-3">
          <div className="flex justify-between font-semibold">
            <span>Cash Refunded to Patient:</span>
            <span className="receipt-num tabular-nums text-red-600">₱{formatCurrency(cashRefunded)}</span>
          </div>
          {refundMethod && (
            <div className="flex justify-between text-muted-foreground">
              <span>Refund Method:</span>
              <span>{refundMethod === "BALANCE_ADJUSTMENT" ? "Balance Adjustment" : refundMethod}</span>
            </div>
          )}
          {(refundMethod === "GCASH" && (gcashNumber || referenceNumber)) && (
            <>
              {gcashNumber && (
                <div className="flex justify-between text-muted-foreground">
                  <span>GCash No:</span>
                  <span>{gcashNumber}</span>
                </div>
              )}
              {referenceNumber && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Reference No:</span>
                  <span>{referenceNumber}</span>
                </div>
              )}
            </>
          )}
        </div>

        <hr className="border-dashed border-border mb-3" />

        {/* ---- Signature Line ---- */}
        <div className="mt-6 mb-4">
          <p className="text-[10px] text-muted-foreground mb-8">
            Customer Acknowledgment Signature: ____________________________
          </p>
        </div>

        {/* ---- Footer ---- */}
        <div className="text-center text-[10px] text-muted-foreground">
          <p className="font-medium text-foreground text-xs mt-2">
            Thank you for choosing MM Torres Optical!
          </p>
        </div>
      </div>

      <div className="receipt-actions flex gap-2 mt-4 print:hidden">
        <Button className="flex-1" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button variant="outline" className="flex-1 border-2 border-gray-400 dark:border-gray-500" onClick={onClose}>
          Close
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundReceipt;

