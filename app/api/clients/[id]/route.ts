import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Pobieramy dane klienta wraz ze wszystkimi jego zleceniami
    const client = await prisma.user.findUnique({
      where: { 
        id: id,
        role: "CLIENT" // Upewniamy się, że to klient
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' }, // Od najnowszego zlecenia
          include: {
            examTemplate: { select: { title: true } },
            participants: { select: { id: true, certificateUrl: true } }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Nie znaleziono klienta" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Błąd pobierania profilu klienta:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}