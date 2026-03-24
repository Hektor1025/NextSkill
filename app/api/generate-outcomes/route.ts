import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { description } = body;

    if (!description || description.length < 10) {
      return NextResponse.json({ error: "Brak opisu szkolenia." }, { status: 400 });
    }

    const prompt = `Jesteś ekspertem ds. metodyki nauczania, Polskiej Ramy Kwalifikacji (PRK) i certyfikacji. 
    Na podstawie poniższego opisu szkolenia przygotuj profesjonalne i mierzalne "Efekty uczenia się" (wiedza, umiejętności, kompetencje społeczne). 
    
    ZASADY:
    1. Zwróć wynik jako zwykły tekst, każdy punkt w nowej linii.
    2. Każdy punkt MUSI rozpoczynać się od kolejnego cyfrowego numeru i kropki (np. "1. ", "2. ", "3. "). Nie używaj żadnych innych punktorów, myślników ani gwiazdek.
    3. Zaraz po numerze każdy punkt musi rozpoczynać się od czasownika operacyjnego w 3. osobie liczby pojedynczej, opartego na Taksonomii Blooma (np. "Wymienia...", "Analizuje...", "Projektuje...", "Stosuje...", "Ocenia...").
    4. Kategorycznie unikaj czasowników i rzeczowników niemierzalnych (np. "Rozumie...", "Zrozumienie...", "Poznaje...", "Wie...", "Opanowuje..."). Skup się na konkretnych, obserwowalnych działaniach.
    5. Zachowaj pełną spójność gramatyczną wszystkich punktów. Nie mieszaj form czasownikowych z rzeczownikami odczasownikowymi.
    6. Nie dodawaj absolutnie żadnych wstępów (np. "Oto efekty:"), podsumowań ani komentarzy. Wygeneruj tylko i wyłącznie same ponumerowane punkty.
    7. Wygeneruj od 8 do 16 najważniejszych punktów. Zadbaj o to, aby były one kompleksowe i wyczerpujące (łącz powiązane zagadnienia w jeden, bardziej rozbudowany i dłuższy punkt, zamiast je sztucznie rozbijać na kilka krótkich).
    
    Przykład oczekiwanego formatu wyjściowego (tylko tekst, nowa linia, ponumerowana lista):
    1. Wymienia główne zasady zarządzania czasem w kontekście pracy projektowej
    2. Stosuje techniki asertywnej komunikacji w zespole podczas rozwiązywania trudnych konfliktów
    3. Projektuje harmonogram działań projektowych z uwzględnieniem dostępnych zasobów ludzkich i technicznych
    4. Ocenia skuteczność wdrożonych rozwiązań na podstawie zebranych danych analitycznych
    
    Opis szkolenia:
    ${description}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000, // ZWIĘKSZONO: 1000 tokenów zagwarantuje, że AI nigdy nie utnie długiej listy
    });

    const outcomes = response.choices[0].message.content?.trim() || "";

    return NextResponse.json({ outcomes });
  } catch (error) {
    console.error("Błąd generowania efektów uczenia:", error);
    return NextResponse.json({ error: "Wystąpił błąd modułu AI." }, { status: 500 });
  }
}