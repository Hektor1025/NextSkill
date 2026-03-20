import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Pobieramy ID wybranego egzaminu oraz ID klienta, który to wysyła
    const { examTemplateId, clientId } = body;

    if (!examTemplateId || !clientId) {
      return NextResponse.json({ error: "Brak wymaganych danych" }, { status: 400 });
    }

    // Tworzenie nowego zlecenia (Order) w bazie danych
    const newOrder = await prisma.order.create({
      data: {
        clientId: clientId,
        examTemplateId: examTemplateId,
        status: "NEW", // Domyślny status z naszego pliku schema.prisma
      }
    });

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("Błąd zapisu zlecenia:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas tworzenia zlecenia" }, { status: 500 });
  }
}