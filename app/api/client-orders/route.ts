import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { computeOrderWorkflow } from "../../../lib/order-workflow";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Brak identyfikatora klienta" },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        clientId,
      },
      include: {
        examTemplate: {
          select: {
            title: true,
          },
        },
        participants: {
          select: {
            id: true,
            certificateUrl: true,
            score: true,
            maxScore: true,
            testFinished: true,
            scannedTestUrl: true,
          },
        },
        documents: {
          select: {
            id: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const payload = orders.map((order) => ({
      id: order.id,
      status: order.status,
      createdAt: order.createdAt,
      invoiceUrl: order.invoiceUrl,
      generatedTestUrl: order.generatedTestUrl,
      examTemplate: order.examTemplate,
      workflow: computeOrderWorkflow({
        status: order.status,
        invoiceUrl: order.invoiceUrl,
        generatedTestUrl: order.generatedTestUrl,
        participants: order.participants,
        documents: order.documents,
      }),
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Błąd pobierania zleceń klienta:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}