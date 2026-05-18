import PrintableReceipt from "@/features/sales/components/PrintableReceipt";
import type { TransactionResponse } from "@/features/sales/types";

interface ReceiptDialogProps {
  receipt: TransactionResponse | null;
  onClose: () => void;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  return (
    <PrintableReceipt
      open={!!receipt}
      onClose={onClose}
      transaction={receipt}
      printMode="ORIGINAL"
      isReprint={false}
    />
  );
};

export default ReceiptDialog;
