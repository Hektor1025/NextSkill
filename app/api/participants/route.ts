import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // NOWOŚĆ: Jeśli przyszła cała TABLICA uczestników z CSV (Masowy Import)
    if (body.participants && Array.isArray(body.participants)) {
      // Mapujemy obiekty na format pasujący do Prisma
      const participantsData = body.participants.map((p: any) => ({
        orderId: p.orderId,
        firstName: p.firstName,
        lastName: p.lastName,
        birthDate: p.birthDate,
        birthPlace: p.birthPlace || ""
      }));

      // Wrzucamy wszystkich jednym potężnym zapytaniem do bazy
      const result = await prisma.participant.createMany({
        data: participantsData
      });

      return NextResponse.json({ message: `Masowo dodano ${result.count} kursantów.` });
    }

    // Klasyczne dodawanie pojedynczego kursanta z formularza (zostało bez zmian)
    const { orderId, firstName, lastName, birthDate, birthPlace } = body;
    
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
    return NextResponse.json({ error: "Błąd podczas dodawania kursanta/kursantów" }, { status: 500 });
  }
}