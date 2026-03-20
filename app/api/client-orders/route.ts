import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    // Odczytujemy ID klienta z paska adresu (parametr zapytania)
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Brak identyfikatora klienta" }, { status: 400 });
    }

    // Szukamy w bazie zleceń tylko dla tego konkretnego ID
    const orders = await prisma.order.findMany({
      where: {
        clientId: clientId,
      },
      // Dołączamy informacje o szablonie egzaminu, żeby mieć jego tytuł!
      include: {
        examTemplate: true,
      },
      orderBy: {
        createdAt: 'desc', // Sortujemy od najnowszego
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Błąd pobierania historii zleceń:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}