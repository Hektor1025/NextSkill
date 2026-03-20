import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const adminEmail = "admin@platforma.pl";
    const adminPassword = "haslo_admina_123";

    // Sprawdzamy, czy admin już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Konto administratora już istnieje!" });
    }

    // Szyfrowanie hasła
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Tworzenie użytkownika w bazie Supabase
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ 
      message: "Sukces! Utworzono konto administratora.", 
      email: user.email,
      role: user.role 
    });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Wystąpił błąd podczas tworzenia konta" }, { status: 500 });
  }
}