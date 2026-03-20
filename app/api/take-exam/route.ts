import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Pobieranie pytań dla kursanta (BEZ KLUCZA ODPOWIEDZI!)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const participantId = searchParams.get("participantId");

    if (!orderId || !participantId) {
      return NextResponse.json({ error: "Brak parametrów" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        examTemplate: {
          include: {
            // Ukrywamy correctAnswer, wysyłamy tylko treść i opcje
            questions: { select: { id: true, content: true, options: true } }
          }
        },
        participants: { where: { id: participantId } }
      }
    });

    if (!order || !order.examTemplate || order.participants.length === 0) {
      return NextResponse.json({ error: "Nie znaleziono egzaminu lub uczestnika" }, { status: 404 });
    }

    return NextResponse.json({
      participant: order.participants[0],
      exam: order.examTemplate
    });
  } catch (error) {
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

// Sprawdzanie i ocenianie testu
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, participantId, examTemplateId, userAnswers } = body;

    // Pobieramy prawdziwe pytania z bazy (wraz z kluczem odpowiedzi)
    const questions = await prisma.question.findMany({
      where: { examTemplateId }
    });

    let score = 0;
    const maxScore = questions.length;

    // Automatyczne sprawdzanie
    for (const question of questions) {
      const userAnswer = userAnswers[question.id];
      if (userAnswer === question.correctAnswer) {
        score += 1;
      }
    }

    // Zapisujemy wynik do bazy
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        score,
        maxScore,
        testFinished: true
      }
    });

    return NextResponse.json({ score, maxScore, message: "Test sprawdzony pomyślnie!" });
  } catch (error) {
    console.error("Błąd sprawdzania testu:", error);
    return NextResponse.json({ error: "Błąd serwera podczas oceniania" }, { status: 500 });
  }
}