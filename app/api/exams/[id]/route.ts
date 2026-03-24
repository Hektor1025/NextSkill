import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, learningOutcomes, level, isCustom, questions } = body;

    const updateData: any = { title, description, learningOutcomes, level, isCustom };

    // Jeśli dołączono pytania, usuwamy stare i wpinamy nowe z AI
    if (questions && Array.isArray(questions)) {
      updateData.questions = {
        deleteMany: {}, 
        create: questions.map((q: any) => ({
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer
        }))
      };
    }

    const updatedExam = await prisma.examTemplate.update({
      where: { id: id },
      data: updateData
    });

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error("Błąd aktualizacji egzaminu:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas aktualizacji." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.examTemplate.delete({
      where: { id: id }
    });
    return NextResponse.json({ message: "Szkolenie usunięte pomyślnie" });
  } catch (error) {
    console.error("Błąd usuwania egzaminu:", error);
    return NextResponse.json({ error: "Nie można usunąć szkolenia (jest powiązane ze zleceniami)." }, { status: 500 });
  }
}