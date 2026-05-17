import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Target, CheckCircle2, Zap, Users, Grid3X3, BarChart3 } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const cycle = await prisma.cycle.findFirst({
    where: { isActive: true },
  });

  // Stats based on role
  let stats: { label: string; value: number | string; color: string; gradient: string; icon: React.ReactNode }[] = [];

  if (user.role === "EMPLOYEE") {
    const goals = await prisma.goal.count({ where: { userId: user.id } });
    const approved = await prisma.goal.count({ where: { userId: user.id, status: "APPROVED" } });
    const draft = await prisma.goal.count({ where: { userId: user.id, status: "DRAFT" } });
    stats = [
      { label: "Total Goals", value: goals, color: "text-blue-600", gradient: "from-blue-500/10 to-blue-600/10", icon: <Target size={24} /> },
      { label: "Approved", value: approved, color: "text-green-600", gradient: "from-green-500/10 to-green-600/10", icon: <CheckCircle2 size={24} /> },
      { label: "Draft", value: draft, color: "text-amber-600", gradient: "from-amber-500/10 to-amber-600/10", icon: <Zap size={24} /> },
    ];
  }

  if (user.role === "MANAGER") {
    const reportees = await prisma.user.count({ where: { managerId: user.id } });
    const pending = await prisma.goal.count({
      where: { user: { managerId: user.id }, status: "SUBMITTED" },
    });
    const approved = await prisma.goal.count({
      where: { user: { managerId: user.id }, status: "APPROVED" },
    });
    stats = [
      { label: "Team Members", value: reportees, color: "text-blue-600", gradient: "from-blue-500/10 to-blue-600/10", icon: <Users size={24} /> },
      { label: "Pending Approval", value: pending, color: "text-amber-600", gradient: "from-amber-500/10 to-amber-600/10", icon: <Zap size={24} /> },
      { label: "Approved Goals", value: approved, color: "text-green-600", gradient: "from-green-500/10 to-green-600/10", icon: <CheckCircle2 size={24} /> },
    ];
  }

  if (user.role === "ADMIN") {
    const totalUsers = await prisma.user.count();
    const totalGoals = await prisma.goal.count();
    const totalCycles = await prisma.cycle.count();
    stats = [
      { label: "Total Users", value: totalUsers, color: "text-purple-600", gradient: "from-purple-500/10 to-purple-600/10", icon: <Users size={24} /> },
      { label: "Total Goals", value: totalGoals, color: "text-blue-600", gradient: "from-blue-500/10 to-blue-600/10", icon: <Grid3X3 size={24} /> },
      { label: "Cycles", value: totalCycles, color: "text-green-600", gradient: "from-green-500/10 to-green-600/10", icon: <BarChart3 size={24} /> },
    ];
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Welcome back, <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{user.name.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-slate-600">
          {cycle ? `Active Cycle: ${cycle.name} • Phase: ${cycle.phase.replace("_", " ")}` : "No active cycle"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-gradient-to-br ${stat.gradient} border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-slate-300`}
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
            <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">In active cycle</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 border border-blue-200 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">🚀 Quick Start</h2>
        <p className="text-slate-700 leading-relaxed">
          {user.role === "EMPLOYEE" && "Head to 'My Goals' to create your goal sheet for this cycle. Each goal should have a clear target and weightage."}
          {user.role === "MANAGER" && "Visit 'My Team' to review pending goal submissions from your team members. Approve, return for rework, or edit targets as needed."}
          {user.role === "ADMIN" && "Visit 'Admin Panel' to manage cycles, unlock goals for editing, track escalations, and push shared KPIs to teams."}
        </p>
      </div>
    </div>
  );
}