import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // 1. Liczymy wszystkich klientów (bez kont admina)
    const clientsCount = await prisma.user.count({
      where: { role: "CLIENT" }
    });

    // 2. Liczymy zlecenia, które wymagają Twojej uwagi (Status: NEW)
    const newOrdersCount = await prisma.order.count({
      where: { status: "NEW" }
    });

    // 3. Liczymy ile łącznie certyfikatów wydała platforma
    const certificatesCount = await prisma.participant.count({
      where: {
        certificateUrl: {
          not: null
        }
      }
    });

    // 4. Pobieramy 5 najnowszych zleceń do podglądu na pulpicie
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { email: true } },
        examTemplate: { select: { title: true } }
      }
    });

    return NextResponse.json({
      clientsCount,
      newOrdersCount,
      certificatesCount,
      recentOrders
    });
  } catch (error) {
    console.error("Błąd pobierania statystyk:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}