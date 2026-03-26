import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string | null;
};

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
    },
  });
}

export async function createNotifications(
  inputs: CreateNotificationInput[]
) {
  if (inputs.length === 0) return;

  await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
    })),
  });
}