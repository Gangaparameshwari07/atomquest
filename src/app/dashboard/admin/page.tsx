import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const cycles = await prisma.cycle.findMany({ orderBy: { createdAt: "desc" } });
  const users = await prisma.user.findMany({
    include: { manager: true, _count: { select: { goals: true } } },
    orderBy: { role: "asc" },
  });
  const lockedGoals = await prisma.goal.findMany({
    where: { isLocked: true },
    include: { user: true, thrustArea: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  const escalationLogs = await prisma.escalationLog.findMany({
    orderBy: { createdAt: "desc" },
  });
  const allUsers = await prisma.user.findMany();
  const userMap: Record<string, string> = {};
  allUsers.forEach((u) => (userMap[u.id] = u.name));

  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "MANAGER"] } },
    orderBy: { name: "asc" },
  });
  const thrustAreas = await prisma.thrustArea.findMany({ orderBy: { name: "asc" } });

  return (
    <AdminClient
      cycles={cycles}
      users={users}
      lockedGoals={lockedGoals}
      escalationLogs={escalationLogs}
      userMap={userMap}
      employees={employees}
      thrustAreas={thrustAreas}
    />
  );
}