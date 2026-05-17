import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GoalSheetClient from "./GoalSheetClient";

export default async function GoalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">No Active Cycle</h2>
        <p className="text-slate-600 mt-2">Please contact your Admin.</p>
      </div>
    );
  }

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, cycleId: cycle.id },
    include: { thrustArea: true },
    orderBy: { createdAt: "asc" },
  });

  const thrustAreas = await prisma.thrustArea.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <GoalSheetClient
      initialGoals={goals}
      thrustAreas={thrustAreas}
      cycleId={cycle.id}
      cycleName={cycle.name}
      cyclePhase={cycle.phase}
    />
  );
}