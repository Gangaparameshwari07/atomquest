import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <h2>No active cycle</h2>
      </div>
    );
  }

  const goals = await prisma.goal.findMany({
    where: { cycleId: cycle.id },
    include: {
      user: true,
      thrustArea: true,
      achievements: true,
    },
    orderBy: [{ user: { name: "asc" } }, { createdAt: "asc" }],
  });

  const users = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
    include: {
      goals: {
        where: { cycleId: cycle.id },
        include: { achievements: true },
      },
      _count: { select: { goals: true } },
    },
  });

  const completionData = users.map((u) => {
    const total = u.goals.length;
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const completion: Record<string, number> = {};
    quarters.forEach((q) => {
      const filled = u.goals.filter((g) =>
        g.achievements.some((a) => a.quarter === q && a.actual !== null)
      ).length;
      completion[q] = total > 0 ? Math.round((filled / total) * 100) : 0;
    });
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      department: u.department,
      totalGoals: total,
      completion,
    };
  });

  return (
    <ReportsClient
      goals={goals}
      completionData={completionData}
      cycleName={cycle.name}
    />
  );
}