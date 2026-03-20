import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Brak identyfikatora klienta" }, { status: 400 });
    }

    // 1. Liczymy wszystkie zlecenia tego klienta
    const totalOrders = await prisma.order.count({
      where: { clientId: clientId }
    });

    // 2. Liczymy ile certyfikatów ten klient już odebrał dla swoich ludzi
    const readyCertificates = await prisma.participant.count({
      where: {
        order: { clientId: clientId },
        certificateUrl: { not: null }
      }
    });

    // 3. Zlecenia w toku (niewykonane)
    const activeOrdersCount = await prisma.order.count({
      where: {
        clientId: clientId,
        status: { not: "COMPLETED" }
      }
    });

    // 4. Pobieramy 3 najnowsze zlecenia na listę
    const recentOrders = await prisma.order.findMany({
      where: { clientId: clientId },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        examTemplate: { select: { title: true } }
      }
    });

    return NextResponse.json({
      totalOrders,
      readyCertificates,
      activeOrdersCount,
      recentOrders
    });
  } catch (error) {
    console.error("Błąd pobierania statystyk klienta:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}