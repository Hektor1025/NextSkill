import { Prisma, Role, OrderEventType } from "@prisma/client";
import { prisma } from "./prisma";

type CreateOrderEventInput = {
  orderId: string;
  type: OrderEventType;
  title: string;
  description: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: Role | null;
  metadata?: Prisma.InputJsonValue;
};

export async function createOrderEvent(input: CreateOrderEventInput) {
  return prisma.orderEvent.create({
    data: {
      orderId: input.orderId,
      type: input.type,
      title: input.title,
      description: input.description,
      actorUserId: input.actorUserId ?? null,
      actorEmail: input.actorEmail ?? null,
      actorRole: input.actorRole ?? null,
      metadata: input.metadata,
    },
  });
}