import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Users, Eye, LogOut, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { isAdmin, type Role } from "@/shared/lib/auth";

const menuItems = [
  { title: "Manage Inventory", href: "/inventory", icon: Eye, roles: ["ADMIN", "STAFF"] as Role[] },
  { title: "Manage Patients", href: "/patients", icon: UserRound, roles: ["ADMIN"] as Role[] },
  { title: "Manage Users", href: "/users", icon: Users, roles: ["ADMIN"] as Role[] },
];

function getLinkClassName({ isActive }: { isActive: boolean }): string {
  return buttonVariants({
    variant: isActive ? "default" : "ghost",
    className: "w-full justify-start gap-2",
  });
}

function getUserFromToken() {
  const token = localStorage.getItem("authToken");
  if (!token) return { name: "User", role: "Staff" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roleMap: Record<string, string> = { ADMIN: "Administrator", STAFF: "Staff" };
    return {
      name: payload.sub ?? "User",
      role: roleMap[payload.role] ?? "Staff",
    };
  } catch {
    return { name: "User", role: "Staff" };
  }
}

const Sidenav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getUserFromToken();
  const visibleItems = menuItems.filter((item) => isAdmin() || item.roles.includes("STAFF"));

  const handleLogout = () => {
    localStorage.removeItem("authToken");

    // 👈 3. Call sonner's toast function
    toast.success("Logged Out", {
      description: "You have been successfully logged out.",
    });

    navigate("/login");
  };

  return (
    <div className="flex h-screen w-52 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Eye className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">MM Torres</p>
          <p className="text-xs text-muted-foreground">Optical Clinic</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <nav className="flex-1 space-y-1">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              return (
                <NavLink
                  key={item.title}
                  to={item.href}
                  className={getLinkClassName({ isActive })}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-auto border-t border-border p-4">
        <div className="mb-4">
          <div className="font-semibold text-foreground">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.role}</div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
};

export default Sidenav;
