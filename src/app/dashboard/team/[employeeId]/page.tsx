import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ApprovalClient from "./ApprovalClient";

export default async function EmployeeGoalsReview({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "MANAGER") redirect("/dashboard");

  const employee = await prisma.user.findFirst({
    where: { id: employeeId, managerId: user.id },
  });
  if (!employee) redirect("/dashboard/team");

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return <p>No active cycle</p>;

  const goals = await prisma.goal.findMany({
    where: { userId: employeeId, cycleId: cycle.id },
    include: {
      thrustArea: true,
      achievements: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const checkIns = await prisma.checkIn.findMany({
    where: { managerId: user.id, employeeId, cycleId: cycle.id },
  });

  return (
    <ApprovalClient
      employee={employee}
      goals={goals}
      cycleName={cycle.name}
      checkIns={checkIns}
      managerId={user.id}
      cycleId={cycle.id}
    />
  );
}