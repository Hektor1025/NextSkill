import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

// Funkcja GET - pobiera wszystkich użytkowników z rolą CLIENT
export async function GET() {
  try {
    const clients = await prisma.user.findMany({
      where: {
        role: "CLIENT"
      },
      orderBy: {
        createdAt: 'desc'
      },
      // Pobieramy tylko bezpieczne dane (bez haseł!)
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Błąd pobierania klientów" }, { status: 500 });
  }
}

// Funkcja POST - tworzy nowe konto dla Klienta
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // Sprawdzamy czy mail nie jest już zajęty
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Konto z tym adresem e-mail już istnieje!" },
        { status: 400 }
      );
    }

    // Szyfrujemy hasło dla bezpieczeństwa
    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "CLIENT",
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      }
    });

    return NextResponse.json(newClient);
  } catch (error) {
    return NextResponse.json({ error: "Błąd podczas tworzenia konta" }, { status: 500 });
  }
}