import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Funkcja usuwania kursanta (dostępna dla klienta w etapie 2)
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    await prisma.participant.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Usunięto pomyślnie" });
  } catch (error) {
    console.error("Błąd usuwania kursanta:", error);
    return NextResponse.json({ error: "Błąd podczas usuwania" }, { status: 500 });
  }
}

// Funkcja aktualizacji kursanta (np. wgranie linku do certyfikatu przez Admina)
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { certificateUrl } = body;

    const updatedParticipant = await prisma.participant.update({
      where: { id: id },
      data: { certificateUrl }
    });

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("Błąd aktualizacji kursanta:", error);
    return NextResponse.json({ error: "Błąd podczas aktualizacji" }, { status: 500 });
  }
}