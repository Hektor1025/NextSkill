import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "../../../../lib/prisma";
import { SecurityEventType } from "@prisma/client";
import {
  createSecurityLog,
  generateRawResetToken,
  getRequestMeta,
  hashResetToken,
} from "../../../../lib/security";

function getBaseUrl(req: Request) {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    new URL(req.url).origin
  );
}

async function sendResetPasswordEmail(to: string, resetUrl: string) {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = process.env.EMAIL_SERVER_PORT
    ? Number(process.env.EMAIL_SERVER_PORT)
    : undefined;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM;

  if (!host || !port || !user || !pass || !from) {
    console.warn("Brak pełnej konfiguracji SMTP. Pomijam e-mail resetu hasła.");
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

  await transporter.sendMail({
    from,
    to,
    subject: "Reset hasła do platformy",
    text: `Aby ustawić nowe hasło, otwórz link: ${resetUrl}`,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body as { email?: string };
    const normalizedEmail = email?.trim().toLowerCase();
    const { ipAddress, userAgent } = getRequestMeta(req);

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Adres e-mail jest wymagany." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "Jeśli konto istnieje, wiadomość z linkiem do resetu została wysłana.",
      });
    }

    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const rawToken = generateRawResetToken();
    const tokenHash = hashResetToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${getBaseUrl(req)}/reset-password?token=${rawToken}`;

    await sendResetPasswordEmail(user.email, resetUrl);

    await createSecurityLog({
      userId: user.id,
      email: user.email,
      eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
      success: true,
      ipAddress,
      userAgent,
      message: "Wygenerowano link resetu hasła.",
    });

    return NextResponse.json({
      success: true,
      message:
        "Jeśli konto istnieje, wiadomość z linkiem do resetu została wysłana.",
    });
  } catch (error) {
    console.error("Błąd forgot-password:", error);
    return NextResponse.json(
      { error: "Nie udało się uruchomić procesu resetu hasła." },
      { status: 500 }
    );
  }
}