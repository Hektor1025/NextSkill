import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { participantId, fileUrls, fileUrl, examTemplateId } = body;
    
    const urlsToProcess = fileUrls || (fileUrl ? [fileUrl] : []);

    if (urlsToProcess.length === 0) {
      return NextResponse.json({ error: "Brak plików do weryfikacji" }, { status: 400 });
    }

    await prisma.participant.update({
      where: { id: participantId },
      data: { scannedTestUrl: urlsToProcess[0] }
    });

    const questions = await prisma.question.findMany({
      where: { examTemplateId },
      orderBy: { createdAt: 'asc' }
    });

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "Brak pytań w teście" }, { status: 400 });
    }

    // ZAAWANSOWANY KLUCZ: Wysyłamy nie tylko literę, ale PEŁNĄ TREŚĆ odpowiedzi
    const keyString = questions.map((q, i) => {
      const correctLetter = String.fromCharCode(65 + q.correctAnswer);
      const correctText = q.options[q.correctAnswer];
      return `Zadanie ${i + 1}: Poprawna odpowiedź to ${correctLetter} (Treść: "${correctText}")`;
    }).join('\n');

    // BARDZO RESTRYKCYJNY PROMPT DLA AI
    const prompt = `Jesteś precyzyjnym i bezstronnym systemem OCR oraz egzaminatorem.
    Otrzymujesz zdjęcia rozwiązanego testu (może mieć kilka stron).
    
    Oto Twój szczegółowy klucz odpowiedzi:
    ${keyString}
    
    ZASADY WERYFIKACJI (BARDZO WAŻNE):
    1. Przeanalizuj uważnie każde zadanie na skanach. Zignoruj zadania, których nie ma w kluczu.
    2. Kursant zaznacza odpowiedź stawiając znak (np. X, V, kółko, podkreślenie) przy literze A, B, C lub D, albo zakreślając całą treść odpowiedzi.
    3. Punkt przyznajesz TYLKO, jeśli zaznaczona odpowiedź idealnie zgadza się z kluczem (zarówno literą, jak i treścią).
    4. Bądź bardzo dokładny. Zlicz powoli sumę punktów.
    
    MUSISZ zwrócić wynik WYŁĄCZNIE jako surowy obiekt JSON (bez żadnych znaczników typu \`\`\`json):
    {
      "score": <liczba_poprawnych_odpowiedzi>,
      "maxScore": ${questions.length}
    }`;

    const imageContents = urlsToProcess.map((url: string) => ({
      type: "image_url",
      image_url: { url }
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageContents
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1, // Niska temperatura = wyższa precyzja, brak zmyślania
      response_format: { type: "json_object" }
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) throw new Error("AI nie zwróciło oceny");

    const parsedResult = JSON.parse(resultText);

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
    return NextResponse.json({ error: "Błąd podczas automatycznego sprawdzania. Administrator oceni test ręcznie." }, { status: 500 });
  }
}