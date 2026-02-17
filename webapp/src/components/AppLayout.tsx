import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/hooks/use-auth";
import { LayoutDashboard, Bike, Wrench, Sparkles, User, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/bikes", icon: Bike, label: "Fietsen" },
  { to: "/kanban", icon: Wrench, label: "Werkplaats" },
  { to: "/ai", icon: Sparkles, label: "AI" },
  { to: "/profile", icon: User, label: "Profiel" },
];

function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Bike className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-slate-100 font-bold text-lg">BikeShop</h1>
            <p className="text-slate-500 text-xs">Inventory Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-slate-600 text-xs text-center">BikeShop v1.0.0</p>
      </div>
    </aside>
  );
}

function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
      <ul className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[56px] transition-all",
                  isActive
                    ? "text-blue-400"
                    : "text-slate-500 hover:text-slate-300"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: session, isPending, error } = useSession();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && (error || !session)) {
      navigate("/login", { replace: true });
    }
  }, [isPending, error, session, navigate]);

  // Show loading while checking authentication
  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Laden...</p>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <DesktopSidebar />
      <main className={cn("flex-1 min-h-screen", isMobile && "pb-20")}>
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
