"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { computeScore } from "@/lib/logic";
import { revalidatePath } from "next/cache";

export async function updateAchievement({
  goalId,
  quarter,
  actual,
  progressStatus,
}: {
  goalId: string;
  quarter: string;
  actual: number | null;
  progressStatus: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return { success: false, error: "Goal not found" };
  if (goal.userId !== user.id) return { success: false, error: "Forbidden" };
  if (goal.status !== "APPROVED") return { success: false, error: "Goal not approved" };

  const score = actual !== null
    ? computeScore(goal.uomType, goal.target, actual)
    : null;

  try {
    await prisma.achievement.upsert({
      where: {
        goalId_quarter: {
          goalId,
          // @ts-ignore
          quarter,
        },
      },
      create: {
        goalId,
        // @ts-ignore
        quarter,
        actual,
        // @ts-ignore
        progressStatus,
        score,
      },
      update: {
        actual,
        // @ts-ignore
        progressStatus,
        score,
      },
    });

    // Sync to child shared goals if this is a parent
    if (goal.isShared && !goal.parentGoalId) {
      const childGoals = await prisma.goal.findMany({
        where: { parentGoalId: goal.id },
      });
      for (const child of childGoals) {
        await prisma.achievement.upsert({
          where: {
            goalId_quarter: {
              goalId: child.id,
              // @ts-ignore
              quarter,
            },
          },
          create: {
            goalId: child.id,
            // @ts-ignore
            quarter,
            actual,
            // @ts-ignore
            progressStatus,
            score,
          },
          update: {
            actual,
            // @ts-ignore
            progressStatus,
            score,
          },
        });
      }
    }

    revalidatePath("/dashboard/checkins");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}