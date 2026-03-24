import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Funkcja GET - pobiera wszystkie egzaminy z bazy i układa od najnowszego
export async function GET() {
  try {
    const exams = await prisma.examTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        questions: true // Dołączamy pytania, by widzieć w panelu, czy test ma już wygenerowany klucz!
      }
    });
    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: "Błąd pobierania danych" }, { status: 500 });
  }
}

// Funkcja POST - zapisuje nowy egzamin w bazie WRAZ Z PYTANIAMI
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, isCustom, questions, learningOutcomes, level } = body;

    // Tworzymy egzamin i od razu podpinamy do niego pytania wygenerowane przez AI oraz nowe pola
    const newExam = await prisma.examTemplate.create({
      data: {
        title,
        description,
        learningOutcomes,
        level,
        isCustom: isCustom || false,
        questions: {
          create: questions && Array.isArray(questions) ? questions.map((q: any) => ({
            content: q.content,
            options: q.options,
            correctAnswer: q.correctAnswer
          })) : []
        }
      },
      include: {
        questions: true
      }
    });

    return NextResponse.json(newExam);
  } catch (error) {
    console.error("Błąd zapisu egzaminu w bazie:", error);
    return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });
  }
}