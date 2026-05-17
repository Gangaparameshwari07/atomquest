import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";
import { computeScore } from "@/lib/logic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    redirect("/dashboard");
  }

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return <p>No active cycle</p>;

  // Filter scope: Manager sees own team, Admin sees all
  const userFilter =
    user.role === "MANAGER"
      ? { user: { managerId: user.id } }
      : {};

  const goals = await prisma.goal.findMany({
    where: { cycleId: cycle.id, ...userFilter },
    include: {
      thrustArea: true,
      user: true,
      achievements: true,
    },
  });

  // 1. Goal Distribution by Thrust Area
  const thrustMap: Record<string, number> = {};
  goals.forEach((g) => {
    thrustMap[g.thrustArea.name] = (thrustMap[g.thrustArea.name] || 0) + 1;
  });
  const thrustData = Object.entries(thrustMap).map(([name, value]) => ({ name, value }));

  // 2. Goal Distribution by UoM
  const uomMap: Record<string, number> = {};
  goals.forEach((g) => {
    uomMap[g.uomType] = (uomMap[g.uomType] || 0) + 1;
  });
  const uomData = Object.entries(uomMap).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  // 3. Status Distribution
  const statusMap: Record<string, number> = {};
  goals.forEach((g) => {
    statusMap[g.status] = (statusMap[g.status] || 0) + 1;
  });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // 4. Quarter-on-Quarter Trend (avg score)
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const qoqData = quarters.map((q) => {
    const scoresInQ: number[] = [];
    goals.forEach((g) => {
      const a = g.achievements.find((x) => x.quarter === q);
      if (a?.actual != null) {
        scoresInQ.push(Math.min(computeScore(g.uomType, g.target, a.actual), 100));
      }
    });
    const avg = scoresInQ.length
      ? scoresInQ.reduce((s, n) => s + n, 0) / scoresInQ.length
      : 0;
    return { quarter: q, avgScore: Math.round(avg), goalsTracked: scoresInQ.length };
  });

  // 5. Department Completion Heatmap
  const deptMap: Record<string, { total: number; completed: number }> = {};
  goals.forEach((g) => {
    if (!deptMap[g.user.department]) {
      deptMap[g.user.department] = { total: 0, completed: 0 };
    }
    deptMap[g.user.department].total += 1;
    const hasAnyActual = g.achievements.some((a) => a.actual !== null);
    if (hasAnyActual) deptMap[g.user.department].completed += 1;
  });
  const deptData = Object.entries(deptMap).map(([name, v]) => ({
    name,
    completion: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
    total: v.total,
  }));

  // 6. Manager Effectiveness (Admin only)
  let managerData: any[] = [];
  if (user.role === "ADMIN") {
    const checkIns = await prisma.checkIn.findMany({
      where: { cycleId: cycle.id },
      include: { manager: true },
    });
    const mgrMap: Record<string, { name: string; count: number }> = {};
    checkIns.forEach((c) => {
      if (!mgrMap[c.managerId]) mgrMap[c.managerId] = { name: c.manager.name, count: 0 };
      mgrMap[c.managerId].count += 1;
    });
    managerData = Object.values(mgrMap);
  }

  return (
    <AnalyticsClient
      thrustData={thrustData}
      uomData={uomData}
      statusData={statusData}
      qoqData={qoqData}
      deptData={deptData}
      managerData={managerData}
      cycleName={cycle.name}
      scope={user.role === "MANAGER" ? "team" : "org"}
    />
  );
}