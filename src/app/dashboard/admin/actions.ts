"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateCyclePhase(cycleId: string, phase: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Forbidden" };
  try {
    await prisma.cycle.update({
      where: { id: cycleId },
      // @ts-ignore
      data: { phase },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function activateCycle(cycleId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Forbidden" };
  try {
    await prisma.cycle.updateMany({ data: { isActive: false } });
    await prisma.cycle.update({
      where: { id: cycleId },
      data: { isActive: true },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function unlockGoal(goalId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Forbidden" };
  try {
    await prisma.goal.update({
      where: { id: goalId },
      data: { isLocked: false, status: "DRAFT" },
    });
    await prisma.auditLog.create({
      data: {
        goalId,
        actorId: user.id,
        action: "ADMIN_UNLOCKED",
      },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createCycle(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Forbidden" };

  const name = formData.get("name") as string;
  const startDate = new Date(formData.get("startDate") as string);
  const endDate = new Date(formData.get("endDate") as string);

  try {
    await prisma.cycle.create({
      data: {
        name,
        startDate,
        endDate,
        phase: "GOAL_SETTING",
        isActive: false,
      },
    });
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function runEscalationCheck() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return { success: false, error: "Forbidden" };

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return { success: false, error: "No active cycle" };

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      goals: { where: { cycleId: cycle.id } },
    },
  });

  let newCount = 0;

  for (const emp of employees) {
    // Rule 1: No goals at all
    if (emp.goals.length === 0) {
      const exists = await prisma.escalationLog.findFirst({
        where: { employeeId: emp.id, reason: "No goals created", resolved: false },
      });
      if (!exists) {
        await prisma.escalationLog.create({
          data: {
            employeeId: emp.id,
            managerId: emp.managerId,
            reason: "No goals created for active cycle",
            level: 1,
          },
        });
        newCount++;
      }
    }

    // Rule 2: Goals stuck in SUBMITTED
    const submitted = emp.goals.filter((g) => g.status === "SUBMITTED");
    if (submitted.length > 0) {
      const exists = await prisma.escalationLog.findFirst({
        where: { employeeId: emp.id, reason: { contains: "approval pending" }, resolved: false },
      });
      if (!exists) {
        await prisma.escalationLog.create({
          data: {
            employeeId: emp.id,
            managerId: emp.managerId,
            reason: `Manager approval pending for ${submitted.length} goal(s)`,
            level: 2,
          },
        });
        newCount++;
      }
    }

    // Rule 3: Approved goals without Q1 actuals (if past Q1)
    if (cycle.phase !== "GOAL_SETTING") {
      const approved = emp.goals.filter((g) => g.status === "APPROVED");
      if (approved.length > 0) {
        const achievements = await prisma.achievement.findMany({
          where: { goalId: { in: approved.map((g) => g.id) } },
        });
        if (achievements.length === 0) {
          const exists = await prisma.escalationLog.findFirst({
            where: { employeeId: emp.id, reason: { contains: "check-in" }, resolved: false },
          });
          if (!exists) {
            await prisma.escalationLog.create({
              data: {
                employeeId: emp.id,
                managerId: emp.managerId,
                reason: "Quarterly check-in not completed",
                level: 3,
              },
            });
            newCount++;
          }
        }
      }
    }
  }

  const logs = await prisma.escalationLog.findMany({ orderBy: { createdAt: "desc" } });
  return { success: true, logs, newCount };
}

export async function getEscalationLogs() {
  const logs = await prisma.escalationLog.findMany({ orderBy: { createdAt: "desc" } });
  return logs;
}

export async function createSharedGoal(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
    return { success: false, error: "Forbidden" };
  }

  const cycle = await prisma.cycle.findFirst({ where: { isActive: true } });
  if (!cycle) return { success: false, error: "No active cycle" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const thrustAreaId = formData.get("thrustAreaId") as string;
  const uomType = formData.get("uomType") as string;
  const target = Number(formData.get("target"));
  const weightage = Number(formData.get("weightage"));
  const primaryOwnerId = formData.get("primaryOwnerId") as string;
  const employeeIds = (formData.get("employeeIds") as string).split(",");

  if (weightage < 10) return { success: false, error: "Min weightage is 10%" };

  try {
    // Create parent (primary owner) goal first
    const parentGoal = await prisma.goal.create({
      data: {
        userId: primaryOwnerId,
        cycleId: cycle.id,
        thrustAreaId,
        title,
        description: description || null,
        // @ts-ignore
        uomType,
        target,
        weightage,
        status: "DRAFT",
        isShared: true,
      },
    });

    // Create child shared copies for other employees
    const otherIds = employeeIds.filter((id) => id !== primaryOwnerId);
    for (const empId of otherIds) {
      await prisma.goal.create({
        data: {
          userId: empId,
          cycleId: cycle.id,
          thrustAreaId,
          title,
          description: description || null,
          // @ts-ignore
          uomType,
          target,
          weightage,
          status: "DRAFT",
          isShared: true,
          parentGoalId: parentGoal.id,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        goalId: parentGoal.id,
        actorId: user.id,
        action: "SHARED_KPI_PUSHED",
        newValue: `Pushed to ${employeeIds.length} employees`,
      },
    });

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}