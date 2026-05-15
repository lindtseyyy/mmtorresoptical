import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Users, Eye, LogOut, UserRound, UserRoundCog, ShoppingCart, Receipt, Database, CircleHelp, Info, ChevronDown } from "lucide-react";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { isAdmin, type Role } from "@/shared/lib/auth";

interface MenuItem {
  title: string;
  href?: string;
  icon: React.FC<{ className?: string }>;
  roles: Role[];
  children?: { title: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { title: "Inventory Management", href: "/inventory", icon: Eye, roles: ["ADMIN", "STAFF"] as Role[] },
  { title: "Billing and Payment", href: "/sales", icon: ShoppingCart, roles: ["ADMIN", "STAFF"] as Role[] },
  { title: "Sales and Transactions", href: "/transactions", icon: Receipt, roles: ["ADMIN", "STAFF"] as Role[] },
  { title: "Patient Management", href: "/patients", icon: UserRound, roles: ["ADMIN"] as Role[] },
  { title: "Registration", href: "/users", icon: Users, roles: ["ADMIN"] as Role[] },
  {
    title: "Maintenance",
    icon: Database,
    roles: ["ADMIN"] as Role[],
    children: [
      { title: "Backup & Restore", href: "/admin/backup-restore" },
      { title: "Audit Logs", href: "/admin/audit-logs" },
      { title: "User Maintenance", href: "/admin/user-maintenance" },
    ],
  },
  { title: "Help", href: "/help", icon: CircleHelp, roles: ["ADMIN", "STAFF"] as Role[] },
  { title: "About", href: "/about", icon: Info, roles: ["ADMIN", "STAFF"] as Role[] },
];

function getLinkClassName({ isActive }: { isActive: boolean }): string {
  return buttonVariants({
    variant: isActive ? "default" : "ghost",
    className: "w-full justify-start gap-2",
  });
}

function getSubLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    buttonVariants({
      variant: "ghost",
      className: "w-full justify-start gap-2",
    }),
    isActive && "bg-primary/75 text-primary-foreground shadow hover:bg-primary/65"
  );
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
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(() => {
    // Auto-expand menus that contain the current path
    const expanded = new Set<string>();
    for (const item of menuItems) {
      if (item.children?.some((child) => location.pathname.startsWith(child.href))) {
        expanded.add(item.title);
      }
    }
    return expanded;
  });

  const user = getUserFromToken();
  const visibleItems = menuItems.filter((item) => isAdmin() || item.roles.includes("STAFF"));

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    toast.success("Logged Out", {
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
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
              const hasChildren = !!item.children?.length;
              const childPaths = item.children?.map((c) => c.href) ?? [];
              const isChildActive = childPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));
              const isExpanded = expandedMenus.has(item.title);

              if (hasChildren) {
                return (
                  <div key={item.title}>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={cn(
                        buttonVariants({
                          variant: isChildActive ? "default" : "ghost",
                          className: "w-full justify-start gap-2",
                        })
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-[1.125rem] mt-0.5 space-y-0 border-l-2 border-muted-foreground/25">
                        {item.children!.map((child, i) => (
                          <NavLink
                            key={child.href}
                            to={child.href}
                            className={(props) =>
                              cn(
                                getSubLinkClassName(props),
                                "relative pl-6 text-sm",
                                // Horizontal branch line
                                "before:absolute before:left-0 before:top-1/2 before:h-px before:w-3 before:-translate-y-1/2 before:bg-muted-foreground/25",
                                // Round the bottom corner for the last item
                                i === item.children!.length - 1 && "last-child"
                              )
                            }
                          >
                            <span>{child.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              return (
                <NavLink
                  key={item.title}
                  to={item.href!}
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
        <div className="space-y-1">
          <NavLink
            to="/profile"
            className={getLinkClassName({ isActive: location.pathname === "/profile" })}
          >
            <UserRoundCog className="h-4 w-4" />
            <span>My Profile</span>
          </NavLink>
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
    </div>
  );
};

export default Sidenav;
