import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { computeOrderWorkflow } from "../../../lib/order-workflow";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        client: {
          select: {
            email: true,
            companyName: true,
          },
        },
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
      client: order.client,
      examTemplate: order.examTemplate,
      participants: order.participants,
      documents: order.documents,
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
    console.error("Błąd pobierania zleceń dla admina:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 }
    );
  }
}