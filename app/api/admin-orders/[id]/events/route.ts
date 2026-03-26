import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const events = await prisma.orderEvent.findMany({
      where: {
        orderId: id,
      },
      include: {
        actorUser: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Błąd pobierania eventów:", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać dziennika zdarzeń" },
      { status: 500 }
    );
  }
}