"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type Question = {
  id: string;
  content: string;
  options: string[];
};

type ExamData = {
  participant: { firstName: string; lastName: string; testFinished: boolean; score: number | null; maxScore: number | null };
  exam: { id: string; title: string; questions: Question[] };
};

export default function OnlineExamPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const participantId = params.participantId as string;

  const [data, setData] = useState<ExamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      const res = await fetch(`/api/take-exam?orderId=${orderId}&participantId=${participantId}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        alert("Nie udało się załadować egzaminu. Sprawdź poprawność linku.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = async () => {
    if (!data) return;
    // Sprawdzamy, czy odpowiedział na wszystkie pytania
    if (Object.keys(answers).length < data.exam.questions.length) {
      if (!confirm("Nie odpowiedziałeś na wszystkie pytania. Czy na pewno chcesz zakończyć test?")) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/take-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          participantId,
          examTemplateId: data.exam.id,
          userAnswers: answers
        })
      });

      if (res.ok) {
        const resultData = await res.json();
        setResult({ score: resultData.score, maxScore: resultData.maxScore });
      } else {
        alert("Błąd podczas wysyłania testu.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-bold">Ładowanie arkusza egzaminacyjnego...</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold">Błąd: Brak dostępu do egzaminu.</div>;

  // Ekran dla osoby, która już rozwiązała test
  if (data.participant.testFinished || result) {
    const finalScore = result?.score ?? data.participant.score ?? 0;
    const finalMax = result?.maxScore ?? data.participant.maxScore ?? 0;
    const percentage = finalMax > 0 ? Math.round((finalScore / finalMax) * 100) : 0;
    const passed = percentage >= 50;
    // Zakładamy próg 50%

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center border-t-8 border-t-blue-600">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Egzamin Zakończony</h1>
          <p className="text-gray-600 mb-8">{data.participant.firstName} {data.participant.lastName}, dziękujemy za rozwiązanie testu.</p>
          
          <div className={`p-8 rounded-xl border-2 mb-8 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-800' : 'text-red-800'}`}>
              Twój wynik to: {finalScore} / {finalMax} pkt
            </h2>
            <div className="text-5xl font-black mb-4">{percentage}%</div>
            {passed ? (
              <p className="text-green-700 font-medium">Gratulacje! Zdałeś egzamin. Oczekuj na wydanie certyfikatu przez swój ośrodek szkoleniowy.</p>
            ) : (
              <p className="text-red-700 font-medium">Niestety, nie uzyskałeś wymaganej liczby punktów. Skontaktuj się z osobą prowadzącą szkolenie.</p>
            )}
          </div>
          <p className="text-sm text-gray-400">Możesz już bezpiecznie zamknąć to okno.</p>
        </div>
      </div>
    );
  }

  // Właściwy ekran rozwiązywania testu
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-3xl mx-auto flex-1 w-full">
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="bg-slate-900 text-white p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">{data.exam.title}</h1>
            <p className="text-slate-400">Egzaminowany: <span className="text-white font-bold">{data.participant.firstName} {data.participant.lastName}</span></p>
          </div>
          
          <div className="p-8">
            <p className="text-gray-600 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm">
              <strong>Instrukcja:</strong> Przeczytaj uważnie każde pytanie. Zaznacz jedną, najbardziej pasującą odpowiedź. Gdy skończysz, kliknij przycisk "Zakończ i wyślij test" na samym dole strony.
            </p>

            <div className="space-y-10">
              {data.exam.questions.map((q, qIndex) => (
                <div key={q.id} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    <span className="text-blue-600 mr-2">{qIndex + 1}.</span> 
                    {q.content}
                  </h3>
                  <div className="space-y-3">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = answers[q.id] === optIndex;
                      return (
                        <label 
                          key={optIndex} 
                          className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                        >
                          <input 
                            type="radio" 
                            name={`question-${q.id}`} 
                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                            checked={isSelected}
                            onChange={() => handleOptionSelect(q.id, optIndex)}
                          />
                          <span className={`ml-3 text-base ${isSelected ? 'font-bold text-blue-900' : 'text-gray-700'}`}>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold py-4 px-12 rounded-xl transition-transform hover:-translate-y-1 shadow-lg disabled:opacity-50 w-full sm:w-auto"
              >
                {isSubmitting ? "Wysyłanie..." : "Zakończ i wyślij test"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NOWOŚĆ: Klauzula RODO dla kursanta */}
      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-gray-400 mt-4 px-4 pb-8">
        Administratorem Twoich danych osobowych (w tym imienia, nazwiska oraz wyniku testu) jest Ośrodek Szkoleniowy odpowiedzialny za przeprowadzenie tego egzaminu. Platforma Certyfikacyjna świadczy wyłącznie usługę techniczną polegającą na dostarczeniu oprogramowania egzaminacyjnego.
      </footer>
    </div>
  );
}