"use client";

import React, { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Definicja typu, żeby TypeScript wiedział, jak wygląda egzamin
type ExamTemplate = {
  id: string;
  title: string;
  description: string;
};

export default function NewOrderPage() {
  const [exams, setExams] = useState<ExamTemplate[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Pobieramy listę egzaminów od razu po wejściu na stronę
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (Array.isArray(data)) {
        setExams(data);
      }
    } catch (error) {
      console.error("Błąd pobierania egzaminów:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    setIsSubmitting(true);
    
    try {
      // Pobieramy aktualną sesję, żeby wiedzieć, który klient właśnie klika przycisk
      const session = await getSession();
      // @ts-ignore
      const clientId = session?.user?.id;

      if (!clientId) {
        alert("Błąd autoryzacji. Spróbuj zalogować się ponownie.");
        setIsSubmitting(false);
        return;
      }

      // Wysyłamy dane do naszego nowego API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          examTemplateId: selectedExamId, 
          clientId: clientId 
        }),
      });

      if (res.ok) {
        // Jeśli sukces, przenosimy klienta do historii zleceń
        router.push("/panel/history");
      } else {
        alert("Wystąpił błąd podczas zapisywania zlecenia.");
      }
    } catch (error) {
      console.error("Błąd połączenia:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nowe zlecenie egzaminu</h1>
            <p className="text-gray-500 text-sm mt-1">Wybierz pakiet z listy, aby rozpocząć proces certyfikacji.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500 font-medium">
            Ładowanie dostępnych egzaminów...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wybierz rodzaj egzaminu z dostępnej bazy
              </label>
              
              {exams.length === 0 ? (
                <div className="p-4 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm">
                  Administrator nie dodał jeszcze żadnych pakietów egzaminacyjnych do systemu.
                </div>
              ) : (
                <select
                  required
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white text-gray-800"
                >
                  <option value="" disabled>-- Kliknij, aby rozwinąć listę --</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Podgląd opisu wybranego egzaminu */}
            {selectedExamId && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Opis pakietu</h3>
                <p className="text-slate-700 text-sm">
                  {exams.find(e => e.id === selectedExamId)?.description}
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={!selectedExamId || isSubmitting}
                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-md ${
                  !selectedExamId || isSubmitting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {isSubmitting ? "Przetwarzanie..." : "Utwórz zlecenie i przejdź dalej"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}