import { Badge } from "@/shared/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
  displayText?: string;
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  DEPOSIT: "bg-orange-600 hover:bg-orange-700 text-white",
  PAID: "bg-green-600 hover:bg-green-700 text-white",
  VOIDED: "bg-red-700 hover:bg-red-800 text-white",
};

const REFUND_STATUS_STYLES: Record<string, string> = {
  PARTIAL: "bg-purple-600 hover:bg-purple-700 text-white",
  FULL: "bg-gray-600 hover:bg-gray-700 text-white",
};

const FULFILLMENT_STATUS_STYLES: Record<string, string> = {
  PENDING_LAB: "bg-orange-700 hover:bg-orange-800 text-white",
  READY_FOR_PICKUP: "bg-yellow-600 hover:bg-yellow-700 text-white",
  COMPLETED: "bg-gray-600 hover:bg-gray-700 text-white",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "", displayText }) => {
  const style =
    PAYMENT_STATUS_STYLES[status] ??
    REFUND_STATUS_STYLES[status] ??
    FULFILLMENT_STATUS_STYLES[status] ??
    "bg-gray-500 text-white";

  const label = displayText ?? status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <Badge className={`${style} ${className}`}>
      {label}
    </Badge>
  );
};

export { PAYMENT_STATUS_STYLES, REFUND_STATUS_STYLES, FULFILLMENT_STATUS_STYLES };
export default StatusBadge;
