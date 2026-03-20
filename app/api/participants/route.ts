import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, firstName, lastName, birthDate, birthPlace } = body;

    // Zapisujemy nowego kursanta przypisanego do konkretnego zlecenia
    const newParticipant = await prisma.participant.create({
      data: {
        orderId,
        firstName,
        lastName,
        birthDate,
        birthPlace,
      }
    });

    return NextResponse.json(newParticipant);
  } catch (error) {
    console.error("Błąd zapisu kursanta:", error);
    return NextResponse.json({ error: "Błąd podczas dodawania kursanta" }, { status: 500 });
  }
}