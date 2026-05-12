export type Role = "ADMIN" | "STAFF";

export function getUserRole(): Role | null {
  const token = localStorage.getItem("authToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "ADMIN" || payload.role === "STAFF" ? payload.role : null;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getUserRole() === "ADMIN";
}
