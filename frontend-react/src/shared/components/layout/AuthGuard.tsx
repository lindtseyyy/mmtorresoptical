import { Navigate } from "react-router-dom";

function hasValidToken(): boolean {
  const token = localStorage.getItem("authToken");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  } catch {
    return false;
  }
}

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!hasValidToken()) {
    localStorage.removeItem("authToken");
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default AuthGuard;
