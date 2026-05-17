"use server";

import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateGoalByManager(
  goalId: string,
  data: { weightage?: number; target?: number }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MANAGER") return { success: false, error: "Forbidden" };

  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { user: true },
  });
  if (!goal) return { success: false, error: "Not found" };
  if (goal.user.managerId !== user.id) return { success: false, error: "Forbidden" };
  if (goal.isLocked) return { success: false, error: "Goal locked" };

  const changes = [];
  if (data.weightage !== undefined && data.weightage !== goal.weightage) {
    changes.push({ field: "weightage", old: String(goal.weightage), new: String(data.weightage) });
  }
  if (data.target !== undefined && data.target !== goal.target) {
    changes.push({ field: "target", old: String(goal.target), new: String(data.target) });
  }

  await prisma.goal.update({ where: { id: goalId }, data });

  for (const c of changes) {
    await prisma.auditLog.create({
      data: {
        goalId,
        actorId: user.id,
        action: "MANAGER_EDIT",
        field: c.field,
        oldValue: c.old,
        newValue: c.new,
      },
    });
  }

  return { success: true };
}

export async function approveGoals(employeeId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MANAGER") return { success: false, error: "Forbidden" };

  const employee = await prisma.user.findFirst({
    where: { id: employeeId, managerId: user.id },
  });
  if (!employee) return { success: false, error: "Not your reportee" };

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return { success: false, error: "No active cycle" };

  const goals = await prisma.goal.findMany({
    where: { userId: employeeId, cycleId: cycle.id },
  });

  const total = goals.reduce((s, g) => s + g.weightage, 0);
  if (total !== 100) return { success: false, error: `Weightage = ${total}%` };

  if (goals.some((g) => g.weightage < 10)) {
    return { success: false, error: "Each goal must have minimum 10% weightage" };
  }

  await prisma.goal.updateMany({
    where: { userId: employeeId, cycleId: cycle.id, status: "SUBMITTED" },
    data: { status: "APPROVED", isLocked: true },
  });

  for (const g of goals) {
    await prisma.auditLog.create({
      data: {
        goalId: g.id,
        actorId: user.id,
        action: "APPROVED_LOCKED",
      },
    });
  }

  // Notify employee
  await createNotification({
    userId: employeeId,
    type: "GOAL_APPROVED",
    title: "Your goals were approved! 🎉",
    body: "All goals are now locked. You can start tracking achievements.",
  });

  revalidatePath(`/dashboard/team/${employeeId}`);
  revalidatePath("/dashboard/team");
  return { success: true };
}

export async function returnGoals(employeeId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MANAGER") return { success: false, error: "Forbidden" };

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return { success: false, error: "No active cycle" };

  await prisma.goal.updateMany({
    where: { userId: employeeId, cycleId: cycle.id, status: "SUBMITTED" },
    data: { status: "RETURNED" },
  });

  await createNotification({
    userId: employeeId,
    type: "GOAL_RETURNED",
    title: "Goals returned for rework",
    body: "Your manager has requested changes. Please review and resubmit.",
  });

  revalidatePath(`/dashboard/team/${employeeId}`);
  return { success: true };
}

export async function saveCheckIn({
  employeeId,
  cycleId,
  quarter,
  comment,
  goalIds,
}: {
  employeeId: string;
  cycleId: string;
  quarter: string;
  comment: string;
  goalIds: string[];
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MANAGER") return { success: false, error: "Forbidden" };

  try {
    const existing = await prisma.checkIn.findUnique({
      where: {
        managerId_employeeId_cycleId_quarter: {
          managerId: user.id,
          employeeId,
          cycleId,
          // @ts-ignore
          quarter,
        },
      },
    });

    let checkIn;
    if (existing) {
      checkIn = await prisma.checkIn.update({
        where: { id: existing.id },
        data: { comment },
      });
    } else {
      checkIn = await prisma.checkIn.create({
        data: {
          managerId: user.id,
          employeeId,
          cycleId,
          // @ts-ignore
          quarter,
          comment,
          items: {
            create: goalIds.map((goalId) => ({ goalId })),
          },
        },
      });
    }

    revalidatePath(`/dashboard/team/${employeeId}`);
    return { success: true, id: checkIn.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}