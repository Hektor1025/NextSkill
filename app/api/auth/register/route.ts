import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, companyName, nip, address, contactPerson, phone, termsAccepted, marketingConsent } = body;

    // Walidacja podstawowych wymaganych pól
    if (!email || !password || !companyName || !nip) {
      return NextResponse.json({ error: "Wypełnij wszystkie wymagane pola (Email, Hasło, Nazwa firmy, NIP)." }, { status: 400 });
    }

    // NOWOŚĆ: Sprawdzenie wymogu akceptacji regulaminu
    if (!termsAccepted) {
      return NextResponse.json({ error: "Musisz zaakceptować Regulamin i Politykę Prywatności." }, { status: 400 });
    }

    // Sprawdzenie czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Użytkownik o tym adresie e-mail już istnieje." }, { status: 409 });
    }

    // Szyfrowanie hasła w bazie danych
    const hashedPassword = await bcrypt.hash(password, 10);

    // Utworzenie użytkownika z rolą CLIENT, danymi Organizacji oraz dowodami zgód RODO
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "CLIENT",
        companyName,
        nip,
        address,
        contactPerson,
        phone,
        termsAccepted,
        termsAcceptedAt: new Date(),
        marketingConsent: marketingConsent || false
      }
    });

    // Zwracamy odpowiedź z odcięciem wyświetlania wygenerowanego hasła
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({ message: "Rejestracja zakończona sukcesem", user: userWithoutPassword }, { status: 201 });

  } catch (error) {
    console.error("Błąd podczas rejestracji:", error);
    return NextResponse.json({ error: "Wystąpił błąd serwera podczas rejestracji." }, { status: 500 });
  }
}