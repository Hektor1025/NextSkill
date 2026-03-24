import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        client: {
          select: { email: true, companyName: true } // Dodano companyName
        },
        examTemplate: {
          select: { title: true }
        },
        participants: {
          select: { id: true } // NOWOŚĆ: Zaciągamy ID kursantów, by móc zliczyć ich długość (length)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Błąd pobierania zleceń dla admina:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera" }, { status: 500 });
  }
}