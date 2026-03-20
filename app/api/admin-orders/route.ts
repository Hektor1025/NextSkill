import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      // Dołączamy powiązane dane z innych tabel (email klienta i tytuł egzaminu)
      include: {
        client: {
          select: { email: true }
        },
        examTemplate: {
          select: { title: true }
        }
      },
      orderBy: {
        createdAt: 'desc' // Najnowsze na samej górze
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Błąd pobierania zleceń dla admina:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}