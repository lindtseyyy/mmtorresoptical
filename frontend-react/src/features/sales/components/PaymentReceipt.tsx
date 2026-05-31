import { Printer } from "lucide-react";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import type { TransactionResponse, PaymentResponse } from "@/features/sales/types";

const BUSINESS_NAME = "MM Torres Optical Clinic";
const BUSINESS_ADDRESS = "259 Shoe Avenue, Sto. Nino, Marikina City, 1806";
const BUSINESS_ADDRESS_LINE2 = "Metro Manila, Philippines";
const BUSINESS_PHONE = "(02) 933 7725";

interface PaymentReceiptProps {
  open: boolean;
  onClose: () => void;
  transaction: TransactionResponse;
  payment: PaymentResponse;
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

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  open,
  onClose,
  transaction: tx,
  payment,
}) => {
  if (!open) return null;

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div className="font-mono text-xs leading-relaxed text-foreground max-h-[65vh] overflow-y-auto print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xs font-bold tracking-wide uppercase text-muted-foreground mb-1">
            PAYMENT RECEIPT
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
            <span className="text-muted-foreground">Transaction #</span>
            <span className="font-semibold">{tx.transactionNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{formatDateTime(payment.createdAt)}</span>
          </div>
          {tx.patient && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Patient</span>
              <span>{tx.patient.fullName}</span>
            </div>
          )}
        </div>

        <hr className="border-dashed border-border mb-3" />

        {/* Payment Details */}
        <div className="space-y-0.5 mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original Total</span>
            <span className="tabular-nums">₱{format2(tx.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Previous Paid</span>
            <span className="tabular-nums">₱{format2((tx.amountPaid ?? 0) - payment.amount)}</span>
          </div>
          <div className="flex justify-between font-bold text-green-600">
            <span>Additional Payment</span>
            <span className="tabular-nums">₱{format2(payment.amount)}</span>
          </div>
          <hr className="border-dashed border-border my-1" />
          <div className="flex justify-between font-bold">
            <span>Total Paid</span>
            <span className="tabular-nums">₱{format2(tx.amountPaid ?? 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm">
            <span>Balance Due</span>
            <span className="tabular-nums">₱{format2(tx.balanceDue ?? 0)}</span>
          </div>
        </div>

        <hr className="border-dashed border-border mb-3" />

        {/* Payment Method */}
        <div className="space-y-0.5 mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-semibold">{payment.paymentMethod}</span>
          </div>
          {payment.referenceNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference #</span>
              <span>{payment.referenceNumber}</span>
            </div>
          )}
        </div>

        <hr className="border-dashed border-border mb-3" />

        {/* Status */}
        <div className="rounded-sm bg-muted/50 px-2 py-1.5 mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction Status</span>
            <span className={`font-semibold rounded-sm px-1.5 py-0.5 text-xs text-white leading-none inline-flex items-center ${(tx.amountPaid ?? 0) >= tx.totalAmount ? "bg-green-600" : "bg-orange-600"}`}>
              {(tx.amountPaid ?? 0) >= tx.totalAmount ? "PAID" : "DEPOSIT"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground space-y-1">
          <p>This receipt serves as proof of additional payment.</p>
          <p className="font-medium text-foreground text-xs mt-2">
            Thank you for choosing MM Torres Optical!
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-4 print:hidden">
        <Button className="flex-1" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-2 border-gray-400 dark:border-gray-500"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReceipt;
