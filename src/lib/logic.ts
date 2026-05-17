import { UoMType } from "@prisma/client";

export const GOAL_RULES = {
  MAX_GOALS: 8,
  MIN_WEIGHTAGE: 10,
  TOTAL_WEIGHTAGE: 100,
};

export type GoalInput = {
  weightage: number;
};

export function validateGoalSheet(goals: GoalInput[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const total = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

  if (goals.length === 0) errors.push("Add at least one goal.");
  if (goals.length > GOAL_RULES.MAX_GOALS) errors.push(`Max ${GOAL_RULES.MAX_GOALS} goals allowed.`);

  goals.forEach((g, i) => {
    if (g.weightage < GOAL_RULES.MIN_WEIGHTAGE) {
      errors.push(`Goal #${i + 1}: Weightage must be at least ${GOAL_RULES.MIN_WEIGHTAGE}%.`);
    }
  });

  if (total !== GOAL_RULES.TOTAL_WEIGHTAGE) {
    errors.push(`Total weightage must be exactly 100% (currently ${total}%).`);
  }

  return { valid: errors.length === 0, errors };
}

export function computeScore(
  uomType: UoMType,
  target: number,
  actual: number | null | undefined,
  completionDate?: Date | null
): number {
  // GUARDS against NaN / Infinity
  if (actual === null || actual === undefined || isNaN(actual)) return 0;
  if (target === null || target === undefined || isNaN(target)) return 0;

  let score = 0;

  switch (uomType) {
    case "NUMERIC_HIGHER_BETTER":
      if (target === 0) {
        score = actual > 0 ? 100 : 0;
      } else {
        score = (actual / target) * 100;
      }
      break;

    case "NUMERIC_LOWER_BETTER":
      if (actual === 0 && target === 0) {
        score = 100;
      } else if (actual === 0) {
        score = 150; // Better than target
      } else if (target === 0) {
        score = 0; // Target was 0 but you scored more
      } else {
        score = (target / actual) * 100;
      }
      break;

    case "ZERO_BASED":
      score = actual === 0 ? 100 : 0;
      break;

    case "TIMELINE":
      if (!completionDate) {
        score = 0;
      } else {
        const deadline = new Date(target);
        score = completionDate.getTime() <= deadline.getTime() ? 100 : 0;
      }
      break;
  }

  // Final guards
  if (isNaN(score) || !isFinite(score)) return 0;
  return Math.max(0, Math.min(score, 150));
}

export const UOM_LABELS: Record<UoMType, string> = {
  NUMERIC_HIGHER_BETTER: "Numeric (Higher is Better)",
  NUMERIC_LOWER_BETTER: "Numeric (Lower is Better)",
  TIMELINE: "Timeline (Date)",
  ZERO_BASED: "Zero-Based (0 = Success)",
};