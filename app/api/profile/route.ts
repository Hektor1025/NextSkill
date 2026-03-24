import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) return NextResponse.json({ error: "Brak e-maila" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return NextResponse.json({ error: "Nie znaleziono użytkownika" }, { status: 404 });
    
    // Bezpieczeństwo: Nie wysyłamy hasła na frontend
    const { password, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera przy pobieraniu profilu" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, companyName, nip, address, contactPerson, phone, newPassword } = body;
    
    if (!email) return NextResponse.json({ error: "Brak e-maila" }, { status: 400 });

    const updateData: any = { companyName, nip, address, contactPerson, phone };

    // Jeśli Klient wpisał nowe hasło, szyfrujemy je przed zapisem
    if (newPassword && newPassword.trim() !== "") {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData
    });
    
    const { password, ...safeUser } = updatedUser;
    return NextResponse.json(safeUser);
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera przy aktualizacji profilu" }, { status: 500 });
  }
}