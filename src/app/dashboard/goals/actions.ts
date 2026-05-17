"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createGoal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const cycleId = formData.get("cycleId") as string;
  const thrustAreaId = formData.get("thrustAreaId") as string;
  const uomType = formData.get("uomType") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const target = Number(formData.get("target"));
  const weightage = Number(formData.get("weightage"));

  // Validate max 8
  const existing = await prisma.goal.count({
    where: { userId: user.id, cycleId },
  });
  if (existing >= 8) return { success: false, error: "Max 8 goals allowed" };

  if (weightage < 10) return { success: false, error: "Min weightage is 10%" };

  try {
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        cycleId,
        thrustAreaId,
        // @ts-ignore
        uomType,
        title,
        description: description || null,
        target,
        weightage,
        status: "DRAFT",
      },
      include: { thrustArea: true },
    });

    await prisma.auditLog.create({
      data: {
        goalId: goal.id,
        actorId: user.id,
        action: "GOAL_CREATED",
      },
    });

    revalidatePath("/dashboard/goals");
    return { success: true, goal };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateGoal(
  goalId: string,
  data: { weightage?: number; target?: number }
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return { success: false, error: "Not found" };
  if (goal.isLocked) return { success: false, error: "Goal is locked" };

  try {
    await prisma.goal.update({
      where: { id: goalId },
      data,
    });
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteGoal(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return { success: false, error: "Not found" };
  if (goal.isLocked) return { success: false, error: "Goal is locked" };
  if (goal.userId !== user.id) return { success: false, error: "Forbidden" };

  try {
    await prisma.auditLog.deleteMany({ where: { goalId } });
    await prisma.goal.delete({ where: { id: goalId } });
    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function submitGoals(cycleId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const goals = await prisma.goal.findMany({
    where: { userId: user.id, cycleId },
  });

  // Validate
  if (goals.length > 8) return { success: false, error: "Max 8 goals" };
  if (goals.some((g) => g.weightage < 10))
    return { success: false, error: "Min weightage 10%" };

  const total = goals.reduce((s, g) => s + g.weightage, 0);
  if (total !== 100)
    return { success: false, error: `Total weightage must be 100% (now ${total}%)` };

  try {
    await prisma.goal.updateMany({
      where: { userId: user.id, cycleId, status: "DRAFT" },
      data: { status: "SUBMITTED" },
    });

    for (const g of goals) {
      await prisma.auditLog.create({
        data: {
          goalId: g.id,
          actorId: user.id,
          action: "GOAL_SUBMITTED",
        },
      });
    }

    revalidatePath("/dashboard/goals");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Add to top of file:
import { createNotification } from "@/lib/notifications";

// In submitGoals function, after revalidatePath, add:
// (Find submitGoals function and add before `return { success: true }`)

  // Notify manager
  if (goals.length > 0) {
    const employee = await prisma.user.findUnique({ where: { id: user.id } });
    if (employee?.managerId) {
      await createNotification({
        userId: employee.managerId,
        type: "GOAL_SUBMITTED",
        title: `${employee.name} submitted goals`,
        body: `${goals.length} goal(s) pending your approval`,
      });
    }
  }