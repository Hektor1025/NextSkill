import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PATCH(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Brak identyfikatora użytkownika." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { notificationId, markAll } = body as {
      notificationId?: string;
      markAll?: boolean;
    };

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Brak notificationId." },
        { status: 400 }
      );
    }

    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd oznaczania powiadomienia:", error);
    return NextResponse.json(
      { error: "Nie udało się oznaczyć powiadomienia." },
      { status: 500 }
    );
  }
}