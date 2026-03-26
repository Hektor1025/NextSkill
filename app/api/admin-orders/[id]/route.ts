import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import nodemailer from "nodemailer";
import { OrderEventType, Role } from "@prisma/client";
import { computeOrderWorkflow } from "../../../../lib/order-workflow";
import { buildAdminOrderActivity } from "../../../../lib/admin-order-activity";
import { createOrderEvent } from "../../../../lib/order-events";
import { createNotifications } from "../../../../lib/notifications";
import { NotificationType } from "@prisma/client";
function buildStatusEmail(status: string, orderId: string, examTitle?: string | null) {
  const shortId = orderId.split("-")[0].toUpperCase();
  const examName = examTitle || "Pakiet egzaminacyjny";

  switch (status) {
    case "CONFIRMED":
      return {
        subject: `Zlecenie #${shortId} zostało potwierdzone`,
        text: `Twoje zlecenie ${examName} zostało potwierdzone i oczekuje na dalszą obsługę.`,
      };
    case "TEST_READY":
      return {
        subject: `Arkusze dla zlecenia #${shortId} są gotowe`,
        text: `Materiały egzaminacyjne dla zlecenia ${examName} są już gotowe.`,
      };
    case "SCANS_UPLOADED":
      return {
        subject: `Rozpoczęto weryfikację zlecenia #${shortId}`,
        text: `Do zlecenia ${examName} dostarczono skany i uruchomiono etap weryfikacji.`,
      };
    case "COMPLETED":
      return {
        subject: `Zlecenie #${shortId} zostało zakończone`,
        text: `Proces dla zlecenia ${examName} został zakończony. Sprawdź dostępne dokumenty i certyfikaty.`,
      };
    default:
      return {
        subject: `Aktualizacja statusu zlecenia #${shortId}`,
        text: `Status zlecenia ${examName} został zaktualizowany na: ${status}.`,
      };
  }
}

async function sendOrderStatusEmail(
  recipientEmail: string,
  status: string,
  orderId: string,
  examTitle?: string | null
) {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = process.env.EMAIL_SERVER_PORT
    ? Number(process.env.EMAIL_SERVER_PORT)
    : undefined;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.warn("Brak pełnej konfiguracji SMTP. Pomijam wysyłkę e-mail.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  const mail = buildStatusEmail(status, orderId, examTitle);

  await transporter.sendMail({
    from,
    to: recipientEmail,
    subject: mail.subject,
    text: mail.text,
  });
}

function getActorContext(req: Request): {
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: Role | null;
} {
  const actorUserId = req.headers.get("x-user-id");
  const actorEmail = req.headers.get("x-user-email");
  const actorRoleHeader = req.headers.get("x-user-role");

  const actorRole =
    actorRoleHeader === "ADMIN" || actorRoleHeader === "CLIENT"
      ? (actorRoleHeader as Role)
      : null;

  return {
    actorUserId,
    actorEmail,
    actorRole,
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            role: true,
            companyName: true,
          },
        },
        examTemplate: {
          include: {
            questions: true,
          },
        },
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
        participants: {
          orderBy: {
            lastName: "asc",
          },
        },
        notes: {
          include: {
            authorUser: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        events: {
          include: {
            actorUser: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Nie znaleziono zlecenia" },
        { status: 404 }
      );
    }

    const workflow = computeOrderWorkflow({
      status: order.status,
      invoiceUrl: order.invoiceUrl,
      generatedTestUrl: order.generatedTestUrl,
      participants: order.participants,
      documents: order.documents,
    });

    const activity = buildAdminOrderActivity({
      createdAt: order.createdAt,
      status: order.status,
      invoiceUrl: order.invoiceUrl,
      generatedTestUrl: order.generatedTestUrl,
      participants: order.participants,
      documents: order.documents,
    });

    return NextResponse.json({
      ...order,
      workflow,
      activity,
    });
  } catch (error) {
    console.error("Błąd pobierania szczegółów zlecenia admina:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { status, invoiceUrl, generatedTestUrl } = body as {
      status?: string;
      invoiceUrl?: string | null;
      generatedTestUrl?: string | null;
    };

    const actor = getActorContext(req);

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        examTemplate: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Nie znaleziono zlecenia" },
        { status: 404 }
      );
    }

    const updateData: {
      status?: string;
      invoiceUrl?: string | null;
      generatedTestUrl?: string | null;
    } = {};

    if (typeof status === "string" && status.length > 0) {
      updateData.status = status;
    }

    if (invoiceUrl !== undefined) {
      updateData.invoiceUrl = invoiceUrl;
    }

    if (generatedTestUrl !== undefined) {
      updateData.generatedTestUrl = generatedTestUrl;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            role: true,
            companyName: true,
          },
        },
        examTemplate: {
          include: {
            questions: true,
          },
        },
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
        participants: {
          orderBy: {
            lastName: "asc",
          },
        },
        notes: {
          include: {
            authorUser: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        events: {
          include: {
            actorUser: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (status && status !== existingOrder.status) {
      await createOrderEvent({
        orderId: id,
        type: OrderEventType.STATUS_CHANGED,
        title: "Zmiana statusu zlecenia",
        description: `Status zlecenia zmieniono z ${existingOrder.status} na ${status}.`,
        actorUserId: actor.actorUserId,
        actorEmail: actor.actorEmail,
        actorRole: actor.actorRole,
        metadata: {
          previousStatus: existingOrder.status,
          nextStatus: status,
        },
      });
    }
        if (status && status !== existingOrder.status) {
      const shortId = id.split("-")[0].toUpperCase();
      const orderHrefForAdmin = `/dashboard/orders/${id}`;
      const orderHrefForClient = `/panel/history/${id}`;

      await createNotifications([
        {
          userId: existingOrder.clientId,
          type: NotificationType.ORDER_STATUS,
          title: `Aktualizacja zlecenia #${shortId}`,
          message: `Status Twojego zlecenia został zmieniony na: ${status}.`,
          href: orderHrefForClient,
        },
        {
          userId: actor.actorUserId || existingOrder.clientId,
          type: NotificationType.SYSTEM,
          title: `Zmieniono status zlecenia #${shortId}`,
          message: `Status zlecenia został zmieniony z ${existingOrder.status} na ${status}.`,
          href: orderHrefForAdmin,
        },
      ]);
    }

    if (invoiceUrl !== undefined && invoiceUrl !== existingOrder.invoiceUrl) {
      await createOrderEvent({
        orderId: id,
        type: OrderEventType.INVOICE_UPDATED,
        title: invoiceUrl ? "Dodano lub zaktualizowano fakturę" : "Usunięto fakturę",
        description: invoiceUrl
          ? "Faktura została przypisana do zlecenia."
          : "Faktura została usunięta ze zlecenia.",
        actorUserId: actor.actorUserId,
        actorEmail: actor.actorEmail,
        actorRole: actor.actorRole,
        metadata: {
          hadInvoiceBefore: Boolean(existingOrder.invoiceUrl),
          hasInvoiceNow: Boolean(invoiceUrl),
        },
      });
    }

    if (
      generatedTestUrl !== undefined &&
      generatedTestUrl !== existingOrder.generatedTestUrl
    ) {
      await createOrderEvent({
        orderId: id,
        type: OrderEventType.TEST_UPDATED,
        title: generatedTestUrl
          ? "Dodano lub zaktualizowano arkusze"
          : "Usunięto plik z arkuszami",
        description: generatedTestUrl
          ? "Do zlecenia przypisano plik z materiałami egzaminacyjnymi."
          : "Usunięto powiązany plik materiałów egzaminacyjnych.",
        actorUserId: actor.actorUserId,
        actorEmail: actor.actorEmail,
        actorRole: actor.actorRole,
        metadata: {
          hadGeneratedTestBefore: Boolean(existingOrder.generatedTestUrl),
          hasGeneratedTestNow: Boolean(generatedTestUrl),
        },
      });
    }

    if (
      status &&
      status !== existingOrder.status &&
      existingOrder.client?.email
    ) {
      try {
        await sendOrderStatusEmail(
          existingOrder.client.email,
          status,
          updatedOrder.id,
          updatedOrder.examTemplate?.title
        );
      } catch (mailError) {
        console.error("Nie udało się wysłać e-maila o zmianie statusu:", mailError);
      }
    }

    const freshOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            role: true,
            companyName: true,
          },
        },
        examTemplate: {
          include: {
            questions: true,
          },
        },
        documents: {
          orderBy: {
            createdAt: "desc",
          },
        },
        participants: {
          orderBy: {
            lastName: "asc",
          },
        },
        notes: {
          include: {
            authorUser: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        events: {
          include: {
            actorUser: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!freshOrder) {
      return NextResponse.json(
        { error: "Nie znaleziono zlecenia po aktualizacji" },
        { status: 404 }
      );
    }

    const workflow = computeOrderWorkflow({
      status: freshOrder.status,
      invoiceUrl: freshOrder.invoiceUrl,
      generatedTestUrl: freshOrder.generatedTestUrl,
      participants: freshOrder.participants,
      documents: freshOrder.documents,
    });

    const activity = buildAdminOrderActivity({
      createdAt: freshOrder.createdAt,
      status: freshOrder.status,
      invoiceUrl: freshOrder.invoiceUrl,
      generatedTestUrl: freshOrder.generatedTestUrl,
      participants: freshOrder.participants,
      documents: freshOrder.documents,
    });

    return NextResponse.json({
      ...freshOrder,
      workflow,
      activity,
    });
  } catch (error) {
    console.error("Błąd aktualizacji zlecenia admina:", error);
    return NextResponse.json(
      { error: "Błąd serwera podczas aktualizacji" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const actor = getActorContext(req);

    const existingOrder = await prisma.order.findUnique({
      where: { id },
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
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Nie znaleziono zlecenia" },
        { status: 404 }
      );
    }

    await createOrderEvent({
      orderId: id,
      type: OrderEventType.ORDER_DELETED,
      title: "Usunięcie zlecenia",
      description: "Rozpoczęto usuwanie zlecenia z systemu.",
      actorUserId: actor.actorUserId,
      actorEmail: actor.actorEmail,
      actorRole: actor.actorRole,
      metadata: {
        orderId: id,
        examTitle: existingOrder.examTemplate?.title || null,
        clientEmail: existingOrder.client?.email || null,
      },
    });

    await prisma.orderNote.deleteMany({
      where: { orderId: id },
    });

    await prisma.orderEvent.deleteMany({
      where: { orderId: id },
    });

    await prisma.document.deleteMany({
      where: { orderId: id },
    });

    await prisma.participant.deleteMany({
      where: { orderId: id },
    });

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Błąd usuwania zlecenia:", error);
    return NextResponse.json(
      { error: "Błąd serwera podczas usuwania" },
      { status: 500 }
    );
  }
}