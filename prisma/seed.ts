import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding rich demo data...");

  // Clear all
  await prisma.auditLog.deleteMany();
  await prisma.checkInItem.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.thrustArea.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.escalationLog.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const admin = await prisma.user.create({
    data: { email: "admin@atomquest.com", name: "Admin HR", role: "ADMIN", department: "HR" },
  });
  const manager = await prisma.user.create({
    data: { email: "manager@atomquest.com", name: "Priya Manager", role: "MANAGER", department: "Sales" },
  });
  const manager2 = await prisma.user.create({
    data: { email: "vikram@atomquest.com", name: "Vikram Manager", role: "MANAGER", department: "Engineering" },
  });
  const rahul = await prisma.user.create({
    data: { email: "rahul@atomquest.com", name: "Rahul Employee", role: "EMPLOYEE", department: "Sales", managerId: manager.id },
  });
  const sneha = await prisma.user.create({
    data: { email: "sneha@atomquest.com", name: "Sneha Employee", role: "EMPLOYEE", department: "Sales", managerId: manager.id },
  });
  const arjun = await prisma.user.create({
    data: { email: "arjun@atomquest.com", name: "Arjun Dev", role: "EMPLOYEE", department: "Engineering", managerId: manager2.id },
  });

  // Thrust Areas
  const ta = await Promise.all([
    prisma.thrustArea.create({ data: { name: "Revenue Growth" } }),
    prisma.thrustArea.create({ data: { name: "Customer Success" } }),
    prisma.thrustArea.create({ data: { name: "Operational Excellence" } }),
    prisma.thrustArea.create({ data: { name: "Innovation" } }),
    prisma.thrustArea.create({ data: { name: "People Development" } }),
  ]);

  // Cycle
  const cycle = await prisma.cycle.create({
    data: {
      name: "FY 2025-26",
      phase: "Q2_CHECKIN",
      isActive: true,
      startDate: new Date("2025-05-01"),
      endDate: new Date("2026-04-30"),
    },
  });

  // ---- RAHUL: 4 APPROVED goals with Q1 + Q2 achievements ----
  const rahulGoals = [
    { title: "Achieve ₹50L sales revenue", uomType: "NUMERIC_HIGHER_BETTER" as const, target: 5000000, weightage: 30, ta: ta[0].id, q1: 4200000, q2: 4800000 },
    { title: "Reduce customer churn rate", uomType: "NUMERIC_LOWER_BETTER" as const, target: 5, weightage: 25, ta: ta[1].id, q1: 7, q2: 5 },
    { title: "Zero safety incidents", uomType: "ZERO_BASED" as const, target: 0, weightage: 20, ta: ta[2].id, q1: 0, q2: 0 },
    { title: "Launch new training program", uomType: "NUMERIC_HIGHER_BETTER" as const, target: 4, weightage: 25, ta: ta[4].id, q1: 2, q2: 3 },
  ];

  for (const g of rahulGoals) {
    const goal = await prisma.goal.create({
      data: {
        userId: rahul.id,
        cycleId: cycle.id,
        thrustAreaId: g.ta,
        title: g.title,
        uomType: g.uomType,
        target: g.target,
        weightage: g.weightage,
        status: "APPROVED",
        isLocked: true,
      },
    });
    await prisma.achievement.createMany({
      data: [
        { goalId: goal.id, quarter: "Q1", actual: g.q1, progressStatus: "ON_TRACK", score: 70 },
        { goalId: goal.id, quarter: "Q2", actual: g.q2, progressStatus: "ON_TRACK", score: 85 },
      ],
    });
    await prisma.auditLog.createMany({
      data: [
        { goalId: goal.id, actorId: rahul.id, action: "GOAL_CREATED" },
        { goalId: goal.id, actorId: rahul.id, action: "GOAL_SUBMITTED" },
        { goalId: goal.id, actorId: manager.id, action: "APPROVED_LOCKED" },
      ],
    });
  }

  // ---- SNEHA: 3 APPROVED goals with Q1 data ----
  const snehaGoals = [
    { title: "Hit ₹30L revenue target", uomType: "NUMERIC_HIGHER_BETTER" as const, target: 3000000, weightage: 40, ta: ta[0].id, q1: 2400000 },
    { title: "Reduce TAT to under 24hrs", uomType: "NUMERIC_LOWER_BETTER" as const, target: 24, weightage: 30, ta: ta[2].id, q1: 28 },
    { title: "5 customer testimonials", uomType: "NUMERIC_HIGHER_BETTER" as const, target: 5, weightage: 30, ta: ta[1].id, q1: 3 },
  ];

  for (const g of snehaGoals) {
    const goal = await prisma.goal.create({
      data: {
        userId: sneha.id,
        cycleId: cycle.id,
        thrustAreaId: g.ta,
        title: g.title,
        uomType: g.uomType,
        target: g.target,
        weightage: g.weightage,
        status: "APPROVED",
        isLocked: true,
      },
    });
    await prisma.achievement.create({
      data: { goalId: goal.id, quarter: "Q1", actual: g.q1, progressStatus: "ON_TRACK", score: 75 },
    });
  }

  // ---- ARJUN: 3 SUBMITTED (pending) ----
  const arjunGoals = [
    { title: "Ship 5 new features", uomType: "NUMERIC_HIGHER_BETTER" as const, target: 5, weightage: 40, ta: ta[3].id },
    { title: "Reduce bug count to 0", uomType: "ZERO_BASED" as const, target: 0, weightage: 30, ta: ta[2].id },
    { title: "Mentor 2 juniors", uomType: "NUMERIC_HIGHER_BETTER" as const, target: 2, weightage: 30, ta: ta[4].id },
  ];

  for (const g of arjunGoals) {
    await prisma.goal.create({
      data: {
        userId: arjun.id,
        cycleId: cycle.id,
        thrustAreaId: g.ta,
        title: g.title,
        uomType: g.uomType,
        target: g.target,
        weightage: g.weightage,
        status: "SUBMITTED",
      },
    });
  }

  // Check-ins
  await prisma.checkIn.create({
    data: {
      managerId: manager.id,
      employeeId: rahul.id,
      cycleId: cycle.id,
      quarter: "Q1",
      comment: "Great start! Revenue tracking ahead of schedule. Keep up the focus on customer retention.",
    },
  });
  await prisma.checkIn.create({
    data: {
      managerId: manager.id,
      employeeId: rahul.id,
      cycleId: cycle.id,
      quarter: "Q2",
      comment: "Excellent Q2 performance. Sales hit 96% of plan. Discussed scaling the training program.",
    },
  });
  await prisma.checkIn.create({
    data: {
      managerId: manager.id,
      employeeId: sneha.id,
      cycleId: cycle.id,
      quarter: "Q1",
      comment: "Solid foundational quarter. Need to focus on TAT improvement next quarter.",
    },
  });

  console.log("✅ Rich seed complete!");
  console.log(`📊 6 users, 10 goals, 9 achievements, 3 check-ins`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });