import { prisma } from "./prisma";

export type NotificationType =
  | "GOAL_SUBMITTED"
  | "GOAL_APPROVED"
  | "GOAL_RETURNED"
  | "CHECKIN_REMINDER"
  | "SHARED_KPI"
  | "GOAL_UNLOCKED";

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: `NOTIFY_${type}`,
        field: title,
        newValue: body,
        oldValue: link || null,
      },
    });

    // Also "send email" (logged to console for hackathon demo)
    console.log(`📧 EMAIL → User ${userId}: ${title} — ${body}`);

    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function getNotifications(userId: string) {
  const notifications = await prisma.auditLog.findMany({
    where: {
      actorId: userId,
      action: { startsWith: "NOTIFY_" },
    },
    orderBy: { timestamp: "desc" },
    take: 20,
  });
  return notifications;
}