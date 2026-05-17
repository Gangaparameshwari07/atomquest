import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CheckinsClient from "./CheckinsClient";

export default async function CheckinsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold">No Active Cycle</h2>
      </div>
    );
  }

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, cycleId: cycle.id, status: "APPROVED" },
    include: {
      thrustArea: true,
      achievements: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return <CheckinsClient goals={goals} cyclePhase={cycle.phase} cycleName={cycle.name} />;
}