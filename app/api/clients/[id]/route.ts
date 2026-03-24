import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const client = await prisma.user.findUnique({
      where: { 
        id: id,
        role: "CLIENT" 
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        companyName: true,
        nip: true,
        address: true,
        contactPerson: true,
        phone: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            examTemplate: { select: { title: true } },
            participants: { select: { id: true, certificateUrl: true } }
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Nie znaleziono klienta" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Błąd pobierania profilu klienta:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// NOWOŚĆ: Edycja danych Ośrodka i reset hasła przez Admina
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { companyName, nip, address, contactPerson, phone, password } = body;

    const updateData: any = { companyName, nip, address, contactPerson, phone };

    // Jeśli Administrator wpisał nowe hasło, szyfrujemy je
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedClient = await prisma.user.update({
      where: { id: id },
      data: updateData
    });

    return NextResponse.json({ message: "Profil zaktualizowany pomyślnie" });
  } catch (error) {
    console.error("Błąd aktualizacji klienta:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas aktualizacji." }, { status: 500 });
  }
}