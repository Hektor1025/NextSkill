import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { participantId, fileUrl, examTemplateId } = body;

    // 1. Zapisujemy od razu link do wgranego skanu w profilu kursanta
    await prisma.participant.update({
      where: { id: participantId },
      data: { scannedTestUrl: fileUrl }
    });

    // 2. Pobieramy pytania z bazy (żeby przekazać klucz do AI)
    const questions = await prisma.question.findMany({
      where: { examTemplateId },
      orderBy: { createdAt: 'asc' }
    });

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "Brak pytań w teście" }, { status: 400 });
    }

    // Budujemy tekstowy klucz dla AI (Zamieniamy 0,1,2,3 na A,B,C,D)
    const keyString = questions.map((q, i) => {
      const correctLetter = String.fromCharCode(65 + q.correctAnswer);
      return `${i + 1}. Poprawna odpowiedź: ${correctLetter}`;
    }).join('\n');

    // 3. Prosimy OpenAI o "przeczytanie" obrazu i ocenę
    const prompt = `Jesteś bezstronnym egzaminatorem. Załączam zdjęcie rozwiązanego testu wielokrotnego wyboru.
    
    Oto Twój klucz odpowiedzi do tego testu:
    ${keyString}
    
    ZADANIE:
    1. Przeanalizuj uważnie zdjęcie.
    2. Odczytaj, jakie odpowiedzi zaznaczył kursant na karcie.
    3. Porównaj je z podanym kluczem.
    4. Zlicz sumę poprawnych odpowiedzi.
    
    MUSISZ zwrócić wynik WYŁĄCZNIE w formacie JSON (bez znaczników markdown):
    {
      "score": <liczba_poprawnie_zaznaczonych>,
      "maxScore": ${questions.length}
    }`;

    // Używamy modelu GPT-4o, który obsługuje widzenie komputerowe (Vision)
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: fileUrl } }
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) throw new Error("AI nie zwróciło oceny");

    const parsedResult = JSON.parse(resultText);

    // 4. Zapisujemy zdobyte punkty w bazie danych kursanta
    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: {
        score: parsedResult.score,
        maxScore: parsedResult.maxScore,
        testFinished: true
      }
    });

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("Błąd AI podczas czytania skanu:", error);
    return NextResponse.json({ error: "Błąd podczas automatycznego sprawdzania." }, { status: 500 });
  }
}