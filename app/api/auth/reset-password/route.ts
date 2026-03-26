import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { SecurityEventType } from "@prisma/client";
import {
  createSecurityLog,
  getRequestMeta,
  hashResetToken,
  validateStrongPassword,
} from "../../../../lib/security";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body as {
      token?: string;
      password?: string;
      confirmPassword?: string;
    };

    const { ipAddress, userAgent } = getRequestMeta(req);

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token i oba pola hasła są wymagane." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Hasła nie są identyczne." },
        { status: 400 }
      );
    }

    const passwordValidation = validateStrongPassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(" ") },
        { status: 400 }
      );
    }

    const tokenHash = hashResetToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Link resetu hasła jest nieprawidłowy lub wygasł." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: {
            not: resetToken.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    await createSecurityLog({
      userId: resetToken.user.id,
      email: resetToken.user.email,
      eventType: SecurityEventType.PASSWORD_RESET_COMPLETED,
      success: true,
      ipAddress,
      userAgent,
      message: "Hasło zostało zmienione przy użyciu tokenu resetującego.",
    });

    return NextResponse.json({
      success: true,
      message: "Hasło zostało zmienione.",
    });
  } catch (error) {
    console.error("Błąd reset-password:", error);
    return NextResponse.json(
      { error: "Nie udało się zmienić hasła." },
      { status: 500 }
    );
  }
}