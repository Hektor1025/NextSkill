import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { OrderEventType, Role } from "@prisma/client";
import { createOrderEvent } from "../../../../../lib/order-events";

function getActorContext(req: Request): {
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: Role | null;
} {
  const actorUserId = req.headers.get("x-user-id");
  const actorEmail = req.headers.get("x-user-email");
  const actorRoleHeader = req.headers.get("x-user-role");

  const actorRole =
    actorRoleHeader === "ADMIN" || actorRoleHeader === "CLIENT"
      ? (actorRoleHeader as Role)
      : null;

  return {
    actorUserId,
    actorEmail,
    actorRole,
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const notes = await prisma.orderNote.findMany({
      where: {
        orderId: id,
      },
      include: {
        authorUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Błąd pobierania notatek:", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać notatek" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const actor = getActorContext(req);

    const { content, isPinned } = body as {
      content?: string;
      isPinned?: boolean;
    };

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Treść notatki jest wymagana" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Nie znaleziono zlecenia" },
        { status: 404 }
      );
    }

    const note = await prisma.orderNote.create({
      data: {
        orderId: id,
        authorUserId: actor.actorUserId,
        authorEmail: actor.actorEmail,
        authorRole: actor.actorRole,
        content: content.trim(),
        isPinned: Boolean(isPinned),
      },
      include: {
        authorUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await createOrderEvent({
      orderId: id,
      type: OrderEventType.NOTE_ADDED,
      title: "Dodano notatkę wewnętrzną",
      description: content.trim(),
      actorUserId: actor.actorUserId,
      actorEmail: actor.actorEmail,
      actorRole: actor.actorRole,
      metadata: {
        noteId: note.id,
        isPinned: note.isPinned,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Błąd dodawania notatki:", error);
    return NextResponse.json(
      { error: "Nie udało się zapisać notatki" },
      { status: 500 }
    );
  }
}