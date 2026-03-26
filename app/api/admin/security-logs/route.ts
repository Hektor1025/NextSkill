import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const eventType = searchParams.get("eventType");
    const success = searchParams.get("success");

    const limit = Math.min(Number(limitParam || 50), 200);

    const logs = await prisma.securityLog.findMany({
      where: {
        ...(eventType ? { eventType: eventType as any } : {}),
        ...(success === "true"
          ? { success: true }
          : success === "false"
          ? { success: false }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Błąd pobierania logów bezpieczeństwa:", error);
    return NextResponse.json(
      { error: "Nie udało się pobrać logów bezpieczeństwa." },
      { status: 500 }
    );
  }
}