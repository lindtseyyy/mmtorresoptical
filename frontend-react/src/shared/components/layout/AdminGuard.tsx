import { Navigate } from "react-router-dom";
import { isAdmin } from "@/shared/lib/auth";

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAdmin()) {
    return <Navigate to="/inventory" replace />;
  }
  return <>{children}</>;
};

export default AdminGuard;
