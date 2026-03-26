import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { SecurityEventType } from "@prisma/client";
import {
  createSecurityLog,
  getRequestMeta,
  validateStrongPassword,
} from "../../../../lib/security";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      companyName,
      nip,
      address,
      contactPerson,
      phone,
      termsAccepted,
      marketingConsent,
    } = body as {
      email: string;
      password: string;
      companyName?: string;
      nip?: string;
      address?: string;
      contactPerson?: string;
      phone?: string;
      termsAccepted?: boolean;
      marketingConsent?: boolean;
    };

    const normalizedEmail = email?.trim().toLowerCase();
    const { ipAddress, userAgent } = getRequestMeta(req);

    if (!normalizedEmail || !password || !companyName || !nip) {
      return NextResponse.json(
        { error: "Wypełnij wszystkie wymagane pola." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "Akceptacja regulaminu i polityki prywatności jest wymagana." },
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

    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (existingUser) {
      await createSecurityLog({
        userId: existingUser.id,
        email: normalizedEmail,
        eventType: SecurityEventType.REGISTER_FAILURE,
        success: false,
        ipAddress,
        userAgent,
        message: "Próba rejestracji konta na istniejący adres e-mail.",
      });

      return NextResponse.json(
        { error: "Użytkownik z tym adresem e-mail już istnieje." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: "CLIENT",
        companyName: companyName?.trim() || null,
        nip: nip?.trim() || null,
        address: address?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        marketingConsent: Boolean(marketingConsent),
        passwordChangedAt: new Date(),
      },
    });

    await createSecurityLog({
      userId: user.id,
      email: user.email,
      eventType: SecurityEventType.REGISTER_SUCCESS,
      success: true,
      ipAddress,
      userAgent,
      message: "Pomyślna rejestracja nowego konta.",
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
    });
  } catch (error) {
    console.error("Błąd rejestracji:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas rejestracji." },
      { status: 500 }
    );
  }
}