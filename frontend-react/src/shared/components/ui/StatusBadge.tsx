import { Badge } from "@/shared/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  DEPOSIT: "bg-orange-600 hover:bg-orange-700 text-white",
  PAID: "bg-green-600 hover:bg-green-700 text-white",
  COMPLETED: "bg-blue-600 hover:bg-blue-700 text-white",
  VOIDED: "bg-red-700 hover:bg-red-800 text-white",
};

const REFUND_STATUS_STYLES: Record<string, string> = {
  ADJUSTED: "bg-purple-600 hover:bg-purple-700 text-white",
  RETURNED: "bg-gray-600 hover:bg-gray-700 text-white",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const style =
    PAYMENT_STATUS_STYLES[status] ??
    REFUND_STATUS_STYLES[status] ??
    "bg-gray-500 text-white";

  return (
    <Badge className={`${style} ${className}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

export { PAYMENT_STATUS_STYLES, REFUND_STATUS_STYLES };
export default StatusBadge;
