import { useState } from "react";
import { PackageSearch } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import PrintableReceipt from "@/features/sales/components/PrintableReceipt";
import type { TransactionResponse } from "@/features/sales/types";

interface ReceiptDialogProps {
  receipt: TransactionResponse | null;
  onClose: () => void;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({ receipt, onClose }) => {
  const [showPickList, setShowPickList] = useState(false);

  if (!receipt) return null;

  const hasBatchAllocations = receipt.transactionItems.some(
    (item) => item.batchAllocations && item.batchAllocations.length > 0
  );

  return (
    <>
      <PrintableReceipt
        open={!!receipt}
        onClose={onClose}
        transaction={receipt}
        printMode="ORIGINAL"
        isReprint={false}
        extraButton={
          hasBatchAllocations ? (
            <Button
              variant="outline"
              className="flex-1 border-2 border-gray-400 dark:border-gray-500"
              onClick={() => setShowPickList(true)}
            >
              <PackageSearch className="mr-2 h-4 w-4" />
              Staff Pick List
            </Button>
          ) : undefined
        }
      />

      <PrintableReceipt
        open={showPickList}
        onClose={() => setShowPickList(false)}
        transaction={receipt}
        printMode="PICK_SLIP"
      />
    </>
  );
};

export default ReceiptDialog;
