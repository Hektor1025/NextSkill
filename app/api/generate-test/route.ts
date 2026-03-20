import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description, count, difficulty } = body;

    if (!description) {
      return NextResponse.json({ error: "Brak opisu szkolenia" }, { status: 400 });
    }

    let difficultyPrompt = "";
    if (difficulty === "easy") {
      difficultyPrompt = "POZIOM TRUDNOŚCI: ŁATWY. Używaj prostego języka. Pytania powinny dotyczyć absolutnych podstaw, a błędne odpowiedzi (dystraktory) muszą być łatwe do odrzucenia dla kogoś, kto uważał na zajęciach.";
    } else if (difficulty === "hard") {
      difficultyPrompt = "POZIOM TRUDNOŚCI: TRUDNY. Używaj zaawansowanego słownictwa. Pytania powinny być szczegółowe, a błędne odpowiedzi (dystraktory) BARDZO podchwytliwe, subtelnie różniące się od poprawnej. Wymagaj myślenia analitycznego.";
    } else {
      difficultyPrompt = "POZIOM TRUDNOŚCI: ŚREDNI. Zastosuj standardowy poziom wyzwania dla danego materiału. Dystraktory powinny być wiarygodne.";
    }

    // IDEALNIE ZBALANSOWANY PROMPT
    const prompt = `Jesteś profesjonalnym metodykiem edukacyjnym, egzaminatorem i doświadczonym nauczycielem. Twoim zadaniem jest wygenerowanie wysokiej jakości testu wielokrotnego wyboru na podstawie dostarczonego programu szkolenia.

    Liczba pytań do wygenerowania: ${count || 10}.
    ${difficultyPrompt}
    
    ZASADY GENEROWANIA PYTAŃ (RYGORZYSTYCZNIE PRZESTRZEGAJ):
    1. Zgodność z materiałem: Pytania muszą ściśle weryfikować wiedzę.
    2. Opcje odpowiedzi: Zawsze dokładnie 4 opcje (1 poprawna, 3 błędne). Nie używaj sformułowań typu "Wszystkie powyższe".
    3. LOSOWOŚĆ KLUCZA (BARDZO WAŻNE): Wartość "correctAnswer" (0, 1, 2, 3) MUSI być całkowicie losowo i równomiernie rozłożona w całym teście!
    4. SPECJALNE ZASADY DLA TESTÓW JĘZYKOWYCH (KRYTYCZNE): 
       - Jeśli program dotyczy nauki języka obcego (np. angielski, niemiecki itp.), stosuj zróżnicowane typy pytań:
         a) Tłumaczenie na język obcy: Pytanie po polsku (np. "Jak powiesz: Idę do pracy?"), a wszystkie 4 odpowiedzi w języku obcym.
         b) Tłumaczenie na polski: Pytanie o słówko/zwrot obcojęzyczny (np. "Co oznacza słowo 'environment'?"), a wszystkie 4 odpowiedzi po polsku.
         c) Luki w zdaniach: Zdanie w języku obcym z luką, a odpowiedzi to brakujące słowa w języku obcym (np. "I ___ a book yesterday.").
       - Zachowaj naturalność i sens logiczny.
    5. INNE TESTY: Jeśli test dotyczy innej dziedziny zawodowej (np. BHP, Wózki Widłowe), całe pytania i odpowiedzi muszą być w języku polskim.
    
    FORMAT ZWRACANYCH DANYCH:
    MUSISZ zwrócić wynik WYŁĄCZNIE w surowym formacie JSON. Wygeneruj TYLKO czysty obiekt JSON o poniższej strukturze:
    
    {
      "questions": [
        {
          "content": "Treść pytania",
          "options": ["Opcja 1", "Opcja 2", "Opcja 3", "Opcja 4"],
          "correctAnswer": 0
        }
      ]
    }
    
    Pamiętaj: "correctAnswer" to wartość od 0 do 3.

    Oto program szkolenia, na podstawie którego masz ułożyć profesjonalny test:
    ${description}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }, 
      temperature: 0.8, 
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) throw new Error("Brak odpowiedzi od AI");

    const parsedResult = JSON.parse(resultText);

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error("Błąd generatora AI:", error);
    return NextResponse.json({ error: "Wystąpił błąd podczas generowania testu." }, { status: 500 });
  }
}