import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        examTemplate: {
          include: {
            // NOWOŚĆ: Pobieramy pytania, by Klient mógł wygenerować PDF do druku. 
            // Zwróć uwagę, że celowo NIE pobieramy "correctAnswer", by nikt nie ściągał!
            questions: { select: { id: true, content: true, options: true } }
          }
        },
        participants: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Zlecenie nie istnieje" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Błąd pobierania szczegółów zlecenia klienta:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// Funkcja POST (wgrywanie skanów) - zostaje w 100% bez zmian
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { fileName, fileUrl, fileType } = body;

    const document = await prisma.document.create({
      data: { orderId: id, fileName, fileUrl, fileType }
    });

    await prisma.order.update({
      where: { id: id },
      data: { status: "SCANS_UPLOADED" }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("Błąd zapisu dokumentu:", error);
    return NextResponse.json({ error: "Błąd serwera podczas zapisu dokumentu" }, { status: 500 });
  }
}