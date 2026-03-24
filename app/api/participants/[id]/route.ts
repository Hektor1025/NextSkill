import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

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

// Funkcja aktualizacji kursanta (Certyfikaty + Ocenianie ręczne)
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { certificateUrl, score, maxScore, testFinished } = body;

    const dataToUpdate: any = {};
    if (certificateUrl !== undefined) dataToUpdate.certificateUrl = certificateUrl;
    if (score !== undefined) dataToUpdate.score = Number(score);
    if (maxScore !== undefined) dataToUpdate.maxScore = Number(maxScore);
    if (testFinished !== undefined) dataToUpdate.testFinished = testFinished;

    const updatedParticipant = await prisma.participant.update({
      where: { id: id },
      data: dataToUpdate
    });
    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("Błąd aktualizacji kursanta:", error);
    return NextResponse.json({ error: "Błąd podczas aktualizacji" }, { status: 500 });
  }
}