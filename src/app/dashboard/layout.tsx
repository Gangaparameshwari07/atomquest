import { getCurrentUser, clearSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Target, ClipboardCheck, Users, Settings,
  BarChart3, FileText, ShieldAlert, LogOut,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import { getNotifications } from "@/lib/notifications";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const notifications = await getNotifications(user.id);

  async function logout() {
    "use server";
    await clearSession();
    redirect("/");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { href: "/dashboard/goals", label: "My Goals", icon: Target, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
    { href: "/dashboard/checkins", label: "Check-ins", icon: ClipboardCheck, roles: ["EMPLOYEE"] },
    { href: "/dashboard/team", label: "My Team", icon: Users, roles: ["MANAGER"] },
    { href: "/dashboard/admin", label: "Admin Panel", icon: Settings, roles: ["ADMIN"] },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, roles: ["MANAGER", "ADMIN"] },
    { href: "/dashboard/reports", label: "Reports", icon: FileText, roles: ["ADMIN"] },
    { href: "/dashboard/audit", label: "Audit Log", icon: ShieldAlert, roles: ["ADMIN"] },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    EMPLOYEE: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-lg">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            🎯 AtomQuest
          </h1>
          <p className="text-xs text-slate-400 mt-1">Goal Tracking Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-lg transition-all group"
              >
                <div className="p-1.5 rounded-md bg-slate-700/30 group-hover:bg-blue-600/30 transition-colors">
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3 bg-slate-700/30 rounded-lg p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-sm font-bold text-slate-900">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold inline-block ${roleColors[user.role]}`}>
                {user.role}
              </span>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-red-600/20 hover:text-red-300 rounded-lg transition"
            >
              <LogOut size={16} />
              Switch Role
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex justify-between items-center px-8 py-4 border-b border-slate-200 bg-white shadow-sm">
          <div>
            <h2 className="text-sm text-slate-500 font-medium">Dashboard</h2>
          </div>
          <NotificationBell notifications={notifications} />
        </div>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}