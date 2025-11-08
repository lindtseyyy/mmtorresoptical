import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Users, Package, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner"; // 👈 1. Import toast directly from sonner

const menuItems = [
  { title: "Manage Inventory", href: "/inventory", icon: Package },
  { title: "Manage Users", href: "/users", icon: Users },
];

function getLinkClassName({ isActive }: { isActive: boolean }): string {
  return buttonVariants({
    variant: isActive ? "default" : "ghost",
    className: "w-full justify-start gap-2",
  });
}

const Sidenav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // 👈 2. No more useToast() hook!

  const user = { name: "admin", role: "Administrator" };

  const handleLogout = () => {
    localStorage.removeItem("authToken");

    // 👈 3. Call sonner's toast function
    toast.success("Logged Out", {
      description: "You have been successfully logged out.",
    });

    navigate("/login");
  };

  return (
    <div className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Package className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">MM Torres</p>
          <p className="text-xs text-muted-foreground">Optical Clinic</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2">
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
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
