import { Badge } from "@/shared/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-600 hover:bg-yellow-700 text-white",
  PARTIALLY_PAID: "bg-orange-600 hover:bg-orange-700 text-white",
  PAID: "bg-green-600 hover:bg-green-700 text-white",
  COMPLETED: "bg-blue-600 hover:bg-blue-700 text-white",
  VOIDED: "bg-red-700 hover:bg-red-800 text-white",
  PARTIALLY_REFUNDED: "bg-purple-600 hover:bg-purple-700 text-white",
  FULLY_REFUNDED: "bg-gray-600 hover:bg-gray-700 text-white",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const style = STATUS_STYLES[status] ?? "bg-gray-500 text-white";

  return (
    <Badge className={`${style} ${className}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
};

export default StatusBadge;
